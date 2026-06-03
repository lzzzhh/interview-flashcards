import { z } from 'zod';
import prisma from '../../db/prisma';
import { getLLMProvider } from '../llm-provider';
import { ragSearch } from '../rag/rag-search';
import { buildKeywordTiersFromGraphWithLimits, resolveConceptFromGraph } from '../search/concept-graph';
import { JD_PARSE_PROMPT, PLAN_GENERATE_PROMPT, PLAN_REVISE_PROMPT, TARGET_PARSE_PROMPT } from './job-prep-prompts';
import { getProfile } from './role-profiles';
import type { RoleProfile } from './role-profiles/types';
import { llmGuard } from './guards/plan-llm-guard';
import { ruleValidate, validateCardIds, type GuardContext, type GuardError } from './guards/plan-rule-validator';
import { searchPublicJD } from './tools/public-jd-search-tool';

type PrepHorizon = 'short' | 'medium' | 'long';

type JobPrepToolName =
  | 'parse_target'
  | 'search_public_jd'
  | 'parse_jd'
  | 'load_role_profile'
  | 'extract_requirements'
  | 'graph_expand'
  | 'retrieve_cards'
  | 'rag_search'
  | 'generate_plan'
  | 'validate_plan'
  | 'repair_plan'
  | 'save_plan'
  | 'ask_user';

export interface ReActTraceStep {
  step: number;
  action: JobPrepToolName;
  rationale: string;
  args: Record<string, any>;
  observation: ReActObservation;
  durationMs: number;
}

interface PrepIntentProfile {
  horizon: PrepHorizon;
  days?: number;
  explicit: boolean;
  includeHot100: boolean;
  includeFullDecks: string[];
  excludeDecks: string[];
  cardLimit: number;
  graphMode: 'search' | 'learning-path';
  reason: string;
}

interface RequirementObservation {
  name: string;
  normalizedName?: string | null;
  type: string;
  importance: string;
  evidenceText?: string | null;
  source: 'jd' | 'role_profile' | 'user_feedback';
}

interface RagObservation {
  sourceType: 'job_posting' | 'document' | 'project' | 'interview_qa' | 'card' | 'unknown';
  sourceId: string;
  title: string;
  text: string;
  score: number;
  evidenceSpan?: string;
}

interface CardCandidateObservation {
  cardId: string;
  deckId: string;
  question: string;
  title?: string | null;
  matchedRequirements: string[];
  matchedConcepts: string[];
  score: number;
  source: 'fts5' | 'neo4j' | 'hybrid' | 'full_deck';
  subTopic?: string | null;
  tags?: string | null;
  number?: number | null;
}

interface ReActObservation {
  ok: boolean;
  summary: string;
  data?: Record<string, any>;
  error?: string;
}

interface JobPrepAgentMetrics {
  fakeCardIds: number;
  hallucinationRate: number;
  ruleErrorCount: number;
  warningCount: number;
  mustCoverCoverage: number;
  selectedCardCount: number;
  availableCardCount: number;
  fullDeckCoverage: Record<string, { selected: number; available: number; coverage: number }>;
  stageCount: number;
  repairCount: number;
  latencyMs: number;
  toolCallCount: number;
  ragEvidenceCount: number;
  cardCandidateCount: number;
  missingRequirements: string[];
  saved: boolean;
}

export interface MultiAgentPlanResult {
  plan: any;
  savedPlanId?: string;
  trace: ReActTraceStep[];
  metrics: JobPrepAgentMetrics;
  guardErrors: GuardError[];
  mode: 'react-orchestrator';
  userQuestion?: string;
}

export interface JobPrepOrchestratorOptions {
  currentPlan?: any;
  revisionFeedback?: string;
  estimatedDays?: number;
  savePlan?: (plan: any) => Promise<{ id: string }>;
}

interface OrchestratorState {
  session: any;
  selectedJD: any;
  messages: string[];
  contextText: string;
  prepIntent: PrepIntentProfile;
  roleProfile?: RoleProfile;
  requirements: RequirementObservation[];
  graphKeywords: string[];
  ragEvidence: RagObservation[];
  cardCandidates: CardCandidateObservation[];
  currentPlan?: any;
  revisionFeedback?: string;
  guardResult?: { passed: boolean; errors: GuardError[]; repairInstructions: string[]; missingRequirements: string[] };
  savedPlanId?: string;
  userQuestion?: string;
  observations: ReActObservation[];
  repairedCount: number;
  guardFollowupRetrievals: number;
  startedAt: number;
  options: JobPrepOrchestratorOptions;
}

interface ToolDefinition {
  name: JobPrepToolName;
  description: string;
  inputSchema: z.ZodTypeAny;
  outputSchema: z.ZodTypeAny;
  timeoutMs: number;
  retryable: boolean;
  sideEffect: boolean;
}

const ActionSchema = z.object({
  action: z.string(),
  rationale: z.string().optional(),
  args: z.record(z.any()).optional(),
});

const TOOL_DEFINITIONS: Record<JobPrepToolName, ToolDefinition> = {
  parse_target: {
    name: 'parse_target',
    description: 'Parse or repair company, role, and roleFamily from the user session text.',
    inputSchema: z.object({ text: z.string().optional() }),
    outputSchema: z.object({ company: z.string().nullable().optional(), role: z.string().optional(), roleFamily: z.string().nullable().optional() }),
    timeoutMs: 5000,
    retryable: true,
    sideEffect: true,
  },
  search_public_jd: {
    name: 'search_public_jd',
    description: 'Search public job descriptions. Disabled by default — prefer user-pasted JD for reliability.',
    enabled: process.env.JOB_PREP_ENABLE_PUBLIC_JD_SEARCH === 'true',
    inputSchema: z.object({ company: z.string().optional(), role: z.string().optional() }),
    outputSchema: z.object({ candidates: z.array(z.any()) }),
    timeoutMs: 8000,
    retryable: true,
    sideEffect: true,
  },
  parse_jd: {
    name: 'parse_jd',
    description: 'Parse a selected JD into structured requirements.',
    inputSchema: z.object({ text: z.string().optional() }),
    outputSchema: z.object({ requirements: z.array(z.any()) }),
    timeoutMs: 10000,
    retryable: true,
    sideEffect: true,
  },
  load_role_profile: {
    name: 'load_role_profile',
    description: 'Load role-family checklist and common interview topics.',
    inputSchema: z.object({ roleFamily: z.string().nullable().optional() }),
    outputSchema: z.object({ found: z.boolean(), mustCoverInPlan: z.array(z.string()) }),
    timeoutMs: 1000,
    retryable: false,
    sideEffect: false,
  },
  extract_requirements: {
    name: 'extract_requirements',
    description: 'Merge JD requirements, role checklist, and revision feedback into prioritized requirements.',
    inputSchema: z.object({}),
    outputSchema: z.object({ requirements: z.array(z.any()) }),
    timeoutMs: 1000,
    retryable: false,
    sideEffect: false,
  },
  graph_expand: {
    name: 'graph_expand',
    description: 'Expand prioritized requirements through local graph and Neo4j.',
    inputSchema: z.object({ requirements: z.array(z.string()).optional() }),
    outputSchema: z.object({ keywords: z.array(z.string()) }),
    timeoutMs: 9000,
    retryable: true,
    sideEffect: false,
  },
  retrieve_cards: {
    name: 'retrieve_cards',
    description: 'Retrieve cards per requirement, preserving matched requirement and concept evidence.',
    inputSchema: z.object({ requirements: z.array(z.string()).optional(), perRequirement: z.number().optional() }),
    outputSchema: z.object({ cards: z.array(z.any()) }),
    timeoutMs: 12000,
    retryable: true,
    sideEffect: false,
  },
  rag_search: {
    name: 'rag_search',
    description: 'Retrieve structured evidence from Qdrant RAG sources.',
    inputSchema: z.object({ query: z.string().optional(), sourceTypes: z.array(z.string()).optional(), topK: z.number().optional() }),
    outputSchema: z.object({ evidence: z.array(z.any()) }),
    timeoutMs: 6000,
    retryable: true,
    sideEffect: false,
  },
  generate_plan: {
    name: 'generate_plan',
    description: 'Generate or revise a plan using only observed cards and evidence.',
    inputSchema: z.object({ mode: z.enum(['new', 'revise']).optional() }),
    outputSchema: z.object({ plan: z.any() }),
    timeoutMs: 30000,
    retryable: true,
    sideEffect: false,
  },
  validate_plan: {
    name: 'validate_plan',
    description: 'Run rule guard, DB cardId validation, and cheap LLM guard.',
    inputSchema: z.object({}),
    outputSchema: z.object({ passed: z.boolean(), errors: z.array(z.any()), missingRequirements: z.array(z.string()) }),
    timeoutMs: 12000,
    retryable: false,
    sideEffect: false,
  },
  repair_plan: {
    name: 'repair_plan',
    description: 'Repair a failed plan, preferably after retrieving missing evidence or cards.',
    inputSchema: z.object({ errors: z.array(z.any()).optional() }),
    outputSchema: z.object({ plan: z.any() }),
    timeoutMs: 20000,
    retryable: true,
    sideEffect: false,
  },
  save_plan: {
    name: 'save_plan',
    description: 'Persist the validated plan. Allowed only after validate_plan passed.',
    inputSchema: z.object({}),
    outputSchema: z.object({ planId: z.string().optional() }),
    timeoutMs: 8000,
    retryable: false,
    sideEffect: true,
  },
  ask_user: {
    name: 'ask_user',
    description: 'Stop the loop and ask the user for missing information.',
    inputSchema: z.object({ question: z.string() }),
    outputSchema: z.object({ question: z.string() }),
    timeoutMs: 1000,
    retryable: false,
    sideEffect: false,
  },
};

function now() { return Date.now(); }

function safeParseJson(text: string): any {
  try { return JSON.parse(text); } catch {}
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) { try { return JSON.parse(m[1]); } catch {} }
  const s = text.indexOf('{'), e = text.lastIndexOf('}');
  if (s >= 0 && e > s) { try { return JSON.parse(text.slice(s, e + 1)); } catch {} }
  return null;
}

async function llm(systemPrompt: string, userContent: string, maxTokens = 4096, temperature = 0.2) {
  const p = getLLMProvider();
  if (!p) throw new Error('LLM not configured');
  const r = await p.chat({
    model: p.defaultModel,
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
    temperature,
    maxTokens,
  });
  return r.text;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, name: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${name} timed out after ${timeoutMs}ms`)), timeoutMs)),
  ]);
}

function uniqueStrings(values: Array<string | null | undefined>, limit = 100) {
  return [...new Set(values.map(v => String(v || '').trim()).filter(Boolean))].slice(0, limit);
}

function detectDays(text: string): number | undefined {
  const c = text.toLowerCase();
  if (/(今天|今晚|明天)/.test(text)) return 1;
  if (/(后天|过两天|两天后|这两天)/.test(text)) return 2;
  if (/(大后天|三天后|3\s*天后)/.test(text)) return 3;
  const dayMatch = c.match(/(\d+)\s*(天|day|days)/);
  if (dayMatch) return Number(dayMatch[1]);
  const chineseDayMatch = text.match(/([一二两三四五六七八九十])\s*天(?:后|内)?/);
  if (chineseDayMatch) {
    const daysByCn: Record<string, number> = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
    return daysByCn[chineseDayMatch[1]];
  }
  const weekMatch = c.match(/(\d+)\s*(周|星期|week|weeks)/);
  if (weekMatch) return Number(weekMatch[1]) * 7;
  const monthMatch = c.match(/(\d+)\s*(个月|月|month|months)/);
  if (monthMatch) return Number(monthMatch[1]) * 30;
  if (/(本周|这周)/.test(text)) return 5;
  if (/(下周|下星期)/.test(text)) return 7;
  return undefined;
}

function detectPrepIntent(text: string, roleFamily: string | null | undefined): PrepIntentProfile {
  const lower = text.toLowerCase();
  const days = detectDays(text);
  const hasShortSignal = /(今天|今晚|明天|后天|大后天|过两天|这两天|马上|很急|临时|突击|冲刺|来不及|短期)/.test(text);
  const hasLongSignal = /(长期|系统性|系统\s*(准备|学习|复习|梳理|过一遍)|全面|完整|从零|打基础|全部|所有|全量|刷完|hot\s*100|hot100|leetcode|力扣|一个月|两个月|三个月|半年)/i.test(text);
  const explicit = days !== undefined || hasShortSignal || hasLongSignal;
  let horizon: PrepHorizon = 'medium';
  if (days !== undefined && days <= 3) horizon = 'short';
  else if (days !== undefined && days >= 21) horizon = 'long';
  else if (hasShortSignal) horizon = 'short';
  else if (hasLongSignal) horizon = 'long';

  const includeHot100 = horizon === 'long' && (
    roleFamily === 'algorithm' || /hot\s*100|hot100|leetcode|力扣|刷题|算法/.test(lower)
  );
  const wantsMachineLearning = roleFamily === 'machine-learning'
    || /((所有|全部|全量|完整|全都).{0,12}(机器学习|machine learning|机器学习卡片))|((机器学习|machine learning|机器学习卡片).{0,12}(所有|全部|全量|完整|全都|卡片|过一遍|都过|系统过))/i.test(text);
  const includeFullDecks = [includeHot100 ? 'leetcode' : '', horizon === 'long' && wantsMachineLearning ? 'machine-learning' : ''].filter(Boolean);
  const excludeDecks = horizon === 'short' ? ['leetcode'] : [];
  const cardLimit = horizon === 'short' ? 24 : horizon === 'long' && includeHot100 && wantsMachineLearning ? 320 : horizon === 'long' ? 220 : 60;

  return {
    horizon,
    days,
    explicit,
    includeHot100,
    includeFullDecks,
    excludeDecks,
    cardLimit,
    graphMode: horizon === 'long' ? 'learning-path' : 'search',
    reason: horizon === 'short'
      ? '识别为短期冲刺，优先 JD 命中点，跳过 Hot100/刷题型长线任务。'
      : horizon === 'long'
        ? '识别为长期系统准备，允许知识图谱深度扩展并纳入全量核心牌组。'
        : '识别为常规准备，使用 JD + 岗位画像的中等范围计划。',
  };
}

function cardText(card: CardCandidateObservation) {
  return `${card.question || ''} ${card.title || ''} ${card.tags || ''} ${card.subTopic || ''}`.toLowerCase();
}

function parseTags(tags?: string | null): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return tags.split(/[,，]/).map(t => t.trim()).filter(Boolean);
  }
}

function leetcodeBucket(card: CardCandidateObservation) {
  const text = `${parseTags(card.tags).join(' ')} ${card.question || ''} ${card.title || ''}`;
  if (/(数组|哈希|前缀和|矩阵)/.test(text)) return '数组、哈希与前缀和';
  if (/(双指针|滑动窗口)/.test(text)) return '双指针与滑动窗口';
  if (/(链表)/.test(text)) return '链表';
  if (/(栈|队列|单调栈|堆|优先队列)/.test(text)) return '栈、队列与堆';
  if (/(树|二叉树|BST|递归)/i.test(text)) return '二叉树与递归';
  if (/(图|广度|深度|DFS|BFS|回溯|并查集)/i.test(text)) return '图搜索与回溯';
  if (/(动态规划|DP|背包)/i.test(text)) return '动态规划';
  if (/(二分|排序|贪心)/.test(text)) return '二分、排序与贪心';
  return '综合高频题';
}

function stageNameForCard(card: CardCandidateObservation) {
  if (card.deckId === 'leetcode') return leetcodeBucket(card);
  return card.subTopic || (card.deckId === 'machine-learning' ? '机器学习综合' : card.deckId || '综合准备');
}

function selectedCardIds(plan: any) {
  return (plan?.stages || []).flatMap((s: any) => s.cards || []).map((c: any) => c.cardId).filter(Boolean);
}

function buildDeterministicPlan(state: OrchestratorState, cards: CardCandidateObservation[]) {
  const groups = new Map<string, CardCandidateObservation[]>();
  for (const card of cards) {
    const key = stageNameForCard(card);
    const group = groups.get(key) || [];
    group.push(card);
    groups.set(key, group);
  }
  const stages = [...groups.entries()].map(([name, group], index) => ({
    name: `${index + 1}. ${name}`,
    goal: state.prepIntent.includeHot100 && group.some(c => c.deckId === 'leetcode')
      ? `完成 Hot100 中「${name}」相关题目，建立可复盘的解题模板。`
      : state.prepIntent.horizon === 'short'
        ? `短期优先复盘「${name}」中最贴近 JD 的面试卡片。`
        : `系统覆盖「${name}」相关面试卡片，补齐准备的知识面。`,
    estimatedMinutes: Math.max(90, Math.min(360, group.length * 18)),
    cards: group.map(card => ({
      cardId: card.cardId,
      deckId: card.deckId,
      reason: card.matchedRequirements.length > 0
        ? `覆盖 ${card.matchedRequirements.slice(0, 2).join('、')}。`
        : state.prepIntent.horizon === 'short'
          ? `短期冲刺优先覆盖 JD 直接相关的${state.roleProfile?.displayName || '岗位'}知识点。`
          : `${state.roleProfile?.displayName || '岗位'}准备要求覆盖该知识模块。`,
      matchedRequirements: card.matchedRequirements,
      matchedConcepts: card.matchedConcepts,
      source: card.source,
    })),
  }));
  const planText = JSON.stringify(stages).toLowerCase();
  const missingRequirementStages = requirementNames(state)
    .filter(name => !planText.includes(name.toLowerCase()))
    .slice(0, state.prepIntent.horizon === 'short' ? 0 : 10)
    .map((name, offset) => ({
      name: `${stages.length + offset + 1}. ${name}`,
      goal: `系统补齐「${name}」相关面试知识点；当前卡库召回不足时先作为主题复习阶段保留。`,
      estimatedMinutes: 90,
      cards: [],
    }));
  const displayRole = [state.session.company, state.session.role].filter(Boolean).join(' ') || state.roleProfile?.displayName || '岗位';
  const horizonName = state.prepIntent.horizon === 'short' ? '短期冲刺' : state.prepIntent.horizon === 'long' ? '长期系统' : '常规';
  return {
    title: `${displayRole}${horizonName}备战计划`,
    summary: `${state.prepIntent.reason} 本计划由 ReAct 工具编排生成，基于 ${state.requirements.length} 个需求、${state.cardCandidates.length} 张候选卡片和 ${state.ragEvidence.length} 条证据。`,
    estimatedDays: state.options.estimatedDays || state.prepIntent.days || (state.prepIntent.horizon === 'short' ? 2 : Math.max(14, Math.ceil(cards.length / 8))),
    stages: [...stages, ...missingRequirementStages],
  };
}

function requirementNames(state: OrchestratorState, sourceFilter?: RequirementObservation['source'][]) {
  const filtered = sourceFilter?.length ? state.requirements.filter(r => sourceFilter.includes(r.source)) : state.requirements;
  return uniqueStrings(filtered.map(r => r.normalizedName || r.name), 40);
}

function prioritizeGraphTerms(state: OrchestratorState, requested?: string[]) {
  const reqSet = new Set((requested || []).map(v => v.toLowerCase()));
  const matchesRequest = (r: RequirementObservation) => reqSet.size === 0 || reqSet.has((r.normalizedName || r.name).toLowerCase());
  const p0 = state.requirements
    .filter(r => r.source === 'jd' && /must|required|核心|必需|重点|high/i.test(`${r.importance} ${r.evidenceText || ''}`) && matchesRequest(r))
    .map(r => r.normalizedName || r.name);
  const p1 = state.roleProfile?.mustCoverInPlan || [];
  const p2 = [...(state.roleProfile?.commonTasks || []), ...state.requirements.filter(matchesRequest).map(r => r.name)];
  const p3 = [state.session.role, state.session.company];
  const p4 = [...(state.roleProfile?.concepts || []), ...(state.roleProfile?.interviewTopics || [])];
  return uniqueStrings([...p0, ...p1, ...p2, ...p3, ...p4], state.prepIntent.graphMode === 'learning-path' ? 16 : 10);
}

function extractMissingRequirements(errors: GuardError[], state: OrchestratorState) {
  const text = errors.map(e => `${e.code} ${e.message}`).join('\n');
  const known = requirementNames(state);
  return known.filter(name => text.toLowerCase().includes(name.toLowerCase()));
}

function findMissingByPlanText(plan: any, state: OrchestratorState) {
  const planText = JSON.stringify(plan || '').toLowerCase();
  return requirementNames(state).filter(name => !planText.includes(name.toLowerCase()));
}

function toRagEvidenceString(evidence: RagObservation[]) {
  return evidence.map(r => `[${r.sourceType}:${r.sourceId}] ${r.title}: ${r.evidenceSpan || r.text.slice(0, 300)}`).join('\n---\n');
}

function guardContext(state: OrchestratorState): GuardContext {
  const profile = state.prepIntent.horizon === 'short' && state.roleProfile
    ? { ...state.roleProfile, mustCoverInPlan: [] }
    : state.roleProfile;
  return {
    hasCards: state.cardCandidates.length > 0,
    roleFamily: state.session.roleFamily,
    profile,
    jdReqText: state.requirements.filter(r => r.source === 'jd').length
      ? state.requirements.filter(r => r.source === 'jd').map(r => `- [JD] ${r.type}: ${r.name} (${r.importance})`).join('\n')
      : '(no JD requirements extracted)',
    ragEvidence: toRagEvidenceString(state.ragEvidence),
  };
}

function summarizeStateForDecision(state: OrchestratorState) {
  return {
    target: { company: state.session.company, role: state.session.role, roleFamily: state.session.roleFamily },
    hasJD: !!state.selectedJD,
    prepIntent: state.prepIntent,
    roleProfileLoaded: !!state.roleProfile,
    requirementCount: state.requirements.length,
    topRequirements: requirementNames(state).slice(0, 12),
    graphKeywordCount: state.graphKeywords.length,
    cardCandidateCount: state.cardCandidates.length,
    ragEvidenceCount: state.ragEvidence.length,
    hasPlan: !!state.currentPlan,
    guard: state.guardResult ? { passed: state.guardResult.passed, errors: state.guardResult.errors, missingRequirements: state.guardResult.missingRequirements } : null,
    saved: !!state.savedPlanId,
    revisionFeedback: state.revisionFeedback,
    lastObservation: state.observations.at(-1),
  };
}

function deterministicNextAction(state: OrchestratorState): { action: JobPrepToolName; args: Record<string, any>; rationale: string } {
  if (!state.session.role || state.session.role === 'unknown') return { action: 'parse_target', args: {}, rationale: 'Target is missing.' };
  if (!state.roleProfile) return { action: 'load_role_profile', args: {}, rationale: 'Role profile is needed for coverage.' };
  if (state.selectedJD?.sourceType !== 'fallback_profile' && state.requirements.filter(r => r.source === 'jd').length === 0) return { action: 'parse_jd', args: {}, rationale: 'Selected JD should be parsed before retrieval.' };
  if (state.requirements.length === 0) return { action: 'extract_requirements', args: {}, rationale: 'Requirements are needed for grouped retrieval.' };
  if (state.graphKeywords.length === 0) return { action: 'graph_expand', args: {}, rationale: 'Graph expansion is needed before retrieval.' };
  if (state.cardCandidates.length === 0) return { action: 'retrieve_cards', args: { perRequirement: state.prepIntent.horizon === 'short' ? 4 : 8 }, rationale: 'No cards have been observed yet.' };
  if (state.ragEvidence.length === 0 && process.env.JOB_PREP_ENABLE_RAG === 'true') return { action: 'rag_search', args: {}, rationale: 'RAG evidence can support plan grounding.' };
  if (!state.currentPlan) return { action: 'generate_plan', args: { mode: state.revisionFeedback ? 'revise' : 'new' }, rationale: 'Enough evidence exists to draft the plan.' };
  if (!state.guardResult) return { action: 'validate_plan', args: {}, rationale: 'The plan must pass guards before saving.' };
  if (!state.guardResult.passed) {
    const missing = state.guardResult.missingRequirements;
    if (missing.length > 0 && state.guardFollowupRetrievals === 0 && state.repairedCount < 2) {
      return { action: 'retrieve_cards', args: { requirements: missing, perRequirement: 8 }, rationale: 'Guard found missing requirements, retrieve targeted cards before repair.' };
    }
    return { action: 'repair_plan', args: { errors: state.guardResult.errors }, rationale: 'Guard failed after retrieval; repair using observed cards.' };
  }
  return { action: 'save_plan', args: {}, rationale: 'Validated plan can be saved.' };
}

async function decideNextAction(state: OrchestratorState): Promise<{ action: JobPrepToolName; args: Record<string, any>; rationale: string }> {
  const fallback = deterministicNextAction(state);
  const provider = getLLMProvider();
  if (!provider || process.env.JOB_PREP_REACT_DECIDER === 'deterministic') return fallback;
  if (state.guardResult?.passed) return fallback;
  if (state.guardResult && !state.guardResult.passed && (state.guardFollowupRetrievals > 0 || state.repairedCount > 0)) {
    return fallback;
  }

  const systemPrompt = `You are a job-prep ReAct orchestrator. Decide exactly one next tool action.
Return ONLY JSON: {"action":"tool_name","rationale":"short reason, no private chain of thought","args":{...}}.
Do not call save_plan unless validate_plan has passed. If guard reports missing requirements, prefer retrieve_cards or rag_search before repair_plan.
Available tools: ${Object.values(TOOL_DEFINITIONS).map(t => `${t.name}: ${t.description}`).join('\n')}`;
  try {
    const raw = await llm(systemPrompt, JSON.stringify(summarizeStateForDecision(state)).slice(0, 5000), 700, 0);
    const parsed = ActionSchema.safeParse(safeParseJson(raw));
    if (!parsed.success) return fallback;
    const action = parsed.data.action as JobPrepToolName;
    if (!TOOL_DEFINITIONS[action]) return fallback;
    if (action === 'save_plan' && !state.guardResult?.passed) return fallback;
    if (action === 'search_public_jd' && process.env.JOB_PREP_ENABLE_PUBLIC_JD_SEARCH !== 'true') {
      return { action: 'ask_user', args: { question: '请直接粘贴岗位 JD；如果暂时没有 JD，也可以回复「没有 JD」，我会按岗位画像生成通用计划。' }, rationale: 'Public JD search disabled — prefer user-pasted JD.' };
    }
    return { action, args: parsed.data.args || {}, rationale: parsed.data.rationale || fallback.rationale };
  } catch {
    return fallback;
  }
}

async function executeTool(name: JobPrepToolName, args: Record<string, any>, state: OrchestratorState): Promise<ReActObservation> {
  switch (name) {
    case 'parse_target': {
      const raw = await llm(TARGET_PARSE_PROMPT, String(args.text || state.contextText).slice(0, 3000), 500, 0.1);
      const parsed = safeParseJson(raw) || {};
      if (parsed.role) {
        state.session = await prisma.jobPrepSession.update({
          where: { id: state.session.id },
          data: {
            company: parsed.company || state.session.company || null,
            role: parsed.role || state.session.role || 'unknown',
            roleFamily: parsed.roleFamily || state.session.roleFamily || null,
          },
        });
      }
      return { ok: true, summary: `target=${state.session.company || ''} ${state.session.role}`, data: parsed };
    }
    case 'search_public_jd': {
      const result = await searchPublicJD(args.company || state.session.company || '', args.role || state.session.role || '');
      for (const candidate of result.candidates.slice(0, 5)) {
        await prisma.jobPostingSnapshot.create({
          data: {
            sessionId: state.session.id,
            sourceType: candidate.sourceType,
            sourceUrl: candidate.sourceUrl,
            title: candidate.title,
            company: candidate.company,
            role: candidate.role,
            rawText: candidate.rawText,
            cleanedText: candidate.cleanedText,
            confidence: candidate.confidence,
          },
        });
      }
      return { ok: true, summary: `publicJD candidates=${result.candidates.length}`, data: { candidates: result.candidates.slice(0, 5) } };
    }
    case 'parse_jd': {
      if (!state.selectedJD) return { ok: true, summary: 'no selected JD to parse', data: { requirements: [] } };
      const text = String(args.text || state.selectedJD.cleanedText || state.selectedJD.rawText || '');
      const raw = await llm(JD_PARSE_PROMPT, `Parse this JD:\n${text.slice(0, 3000)}`, 2000, 0.1);
      const parsed = safeParseJson(raw) || {};
      if (Array.isArray(parsed.requirements)) {
        await prisma.jobRequirement.deleteMany({ where: { sessionId: state.session.id } });
        for (const r of parsed.requirements) {
          await prisma.jobRequirement.create({
            data: {
              sessionId: state.session.id,
              type: r.type || 'skill',
              name: r.name,
              normalizedName: r.normalizedName,
              importance: r.importance || 'unknown',
              evidenceText: r.evidenceText,
            },
          });
        }
      }
      const reqs = await prisma.jobRequirement.findMany({ where: { sessionId: state.session.id } });
      state.requirements = reqs.map(r => ({ name: r.name, normalizedName: r.normalizedName, type: r.type, importance: r.importance, evidenceText: r.evidenceText, source: 'jd' }));
      return { ok: true, summary: `parsedJD requirements=${state.requirements.length}`, data: { requirements: state.requirements } };
    }
    case 'load_role_profile': {
      state.roleProfile = getProfile(args.roleFamily || state.session.roleFamily || '');
      return { ok: true, summary: state.roleProfile ? `profile=${state.roleProfile.displayName}` : 'profile=none', data: { found: !!state.roleProfile, mustCoverInPlan: state.roleProfile?.mustCoverInPlan || [] } };
    }
    case 'extract_requirements': {
      const existing = await prisma.jobRequirement.findMany({ where: { sessionId: state.session.id } });
      const jdReqs: RequirementObservation[] = existing.map(r => ({ name: r.name, normalizedName: r.normalizedName, type: r.type, importance: r.importance, evidenceText: r.evidenceText, source: 'jd' }));
      const profileReqs: RequirementObservation[] = (state.roleProfile?.mustCoverInPlan || []).map(name => ({ name, normalizedName: name, type: 'skill', importance: 'role_must_cover', source: 'role_profile' }));
      const feedbackReqs: RequirementObservation[] = state.revisionFeedback
        ? uniqueStrings(state.revisionFeedback.split(/[，,、\s]+/).filter(t => t.length >= 2), 8).map(name => ({ name, normalizedName: name, type: 'revision_feedback', importance: 'user_requested', source: 'user_feedback' }))
        : [];
      const merged = new Map<string, RequirementObservation>();
      for (const req of [...jdReqs, ...profileReqs, ...feedbackReqs]) {
        const key = String(req.normalizedName || req.name).toLowerCase();
        if (!merged.has(key)) merged.set(key, req);
      }
      state.requirements = [...merged.values()];
      return { ok: true, summary: `requirements=${state.requirements.length}`, data: { requirements: state.requirements } };
    }
    case 'graph_expand': {
      const requested = Array.isArray(args.requirements) ? args.requirements.map(String) : undefined;
      const seeds = prioritizeGraphTerms(state, requested);
      const local: string[] = [];
      for (const term of seeds) {
        const resolved = resolveConceptFromGraph(term);
        if (!resolved.conceptGraphHit || !resolved.graphNodeId) continue;
        const tiers = buildKeywordTiersFromGraphWithLimits(resolved.graphNodeId, state.prepIntent.graphMode);
        local.push(resolved.canonicalTopic, ...tiers.coreKeywords, ...tiers.expandedKeywords, ...tiers.prerequisiteKeywords);
      }
      const neo4j: string[] = [];
      if (process.env.JOB_PREP_ENABLE_NEO4J === 'true') {
        try {
          const { neo4jBuildKeywordTiers } = await import('../search/neo4j-graph-search');
          for (const term of seeds.slice(0, state.prepIntent.graphMode === 'learning-path' ? 6 : 4)) {
            const result = await Promise.race([
              neo4jBuildKeywordTiers(term),
              new Promise<any>((resolve) => setTimeout(() => resolve(null), 1500)),
            ]);
            if (result?.tiers) neo4j.push(...result.tiers.coreKeywords, ...result.tiers.expandedKeywords, ...result.tiers.prerequisiteKeywords);
          }
        } catch (e: any) {
          console.warn(`[job-prep] Neo4j expansion skipped: ${e.message}`);
        }
      }
      state.graphKeywords = uniqueStrings([...state.graphKeywords, ...seeds, ...local, ...neo4j], 100);
      return { ok: true, summary: `graphSeeds=${seeds.slice(0, 6).join(',')}; graphKeywords=${state.graphKeywords.length}`, data: { seeds, keywords: state.graphKeywords } };
    }
    case 'retrieve_cards': {
      const requested = Array.isArray(args.requirements) && args.requirements.length
        ? args.requirements.map(String)
        : requirementNames(state).slice(0, state.prepIntent.horizon === 'short' ? 10 : 18);
      const perRequirement = Number(args.perRequirement || (state.prepIntent.horizon === 'short' ? 4 : 8));
      const cards = await retrieveCardsForRequirements(requested, state, perRequirement);
      const fullDeckCards = await findFullDeckCards(state.prepIntent.includeFullDecks);
      const merged = new Map(state.cardCandidates.map(card => [card.cardId, card]));
      for (const card of [...fullDeckCards, ...cards]) {
        if (!merged.has(card.cardId)) merged.set(card.cardId, card);
      }
      state.cardCandidates = [...merged.values()].slice(0, state.prepIntent.cardLimit);
      if (state.guardResult && !state.guardResult.passed) state.guardFollowupRetrievals += 1;
      return {
        ok: true,
        summary: `requested=${requested.slice(0, 8).join(',')}; cardCandidates=${state.cardCandidates.length}`,
        data: { cards: state.cardCandidates.slice(0, 80), requested },
      };
    }
    case 'rag_search': {
      if (process.env.JOB_PREP_ENABLE_RAG !== 'true') return { ok: true, summary: 'rag disabled', data: { evidence: [] } };
      const query = String(args.query || requirementNames(state).slice(0, 12).join(' ') || `${state.session.company || ''} ${state.session.role || ''}`);
      const sourceTypes = Array.isArray(args.sourceTypes) ? args.sourceTypes.map(String) : ['job_posting', 'document', 'project', 'interview_qa'];
      const results = await ragSearch({ query, sourceTypes, topK: Number(args.topK || 15) });
      const evidence: RagObservation[] = results.map(r => ({
        sourceType: ['job_posting', 'document', 'project', 'interview_qa', 'card'].includes(r.sourceType) ? r.sourceType as RagObservation['sourceType'] : 'unknown',
        sourceId: r.sourceId,
        title: r.title || '',
        text: r.text,
        score: r.score,
        evidenceSpan: r.text.slice(0, 300),
      }));
      const merged = new Map(state.ragEvidence.map(e => [`${e.sourceType}:${e.sourceId}:${e.text.slice(0, 40)}`, e]));
      for (const e of evidence) merged.set(`${e.sourceType}:${e.sourceId}:${e.text.slice(0, 40)}`, e);
      state.ragEvidence = [...merged.values()].slice(0, 30);
      return { ok: true, summary: `ragEvidence=${state.ragEvidence.length}; query=${query.slice(0, 80)}`, data: { evidence: state.ragEvidence } };
    }
    case 'generate_plan': {
      state.currentPlan = await generatePlanFromState(state, String(args.mode || (state.revisionFeedback ? 'revise' : 'new')) as 'new' | 'revise');
      state.guardResult = undefined;
      return { ok: true, summary: `planStages=${state.currentPlan?.stages?.length || 0}; planCards=${selectedCardIds(state.currentPlan).length}`, data: { plan: state.currentPlan } };
    }
    case 'validate_plan': {
      state.guardResult = await validatePlan(state);
      return { ok: state.guardResult.passed, summary: `passed=${state.guardResult.passed}; errors=${state.guardResult.errors.length}; missing=${state.guardResult.missingRequirements.join(',')}`, data: state.guardResult };
    }
    case 'repair_plan': {
      if (state.repairedCount >= 2) return { ok: false, summary: 'max repair attempts reached', error: 'max_repair_2' };
      state.currentPlan = await repairPlanFromState(state);
      state.guardResult = undefined;
      state.repairedCount += 1;
      return { ok: true, summary: `repairCount=${state.repairedCount}; planCards=${selectedCardIds(state.currentPlan).length}`, data: { plan: state.currentPlan } };
    }
    case 'save_plan': {
      if (!state.guardResult?.passed) return { ok: false, summary: 'save blocked because validate_plan has not passed', error: 'VALIDATION_REQUIRED' };
      if (!state.currentPlan) return { ok: false, summary: 'save blocked because no plan exists', error: 'NO_PLAN' };
      if (state.options.savePlan && !state.savedPlanId) {
        const saved = await state.options.savePlan(state.currentPlan);
        state.savedPlanId = saved.id;
      }
      return { ok: true, summary: `savedPlanId=${state.savedPlanId || 'deferred'}`, data: { planId: state.savedPlanId } };
    }
    case 'ask_user': {
      state.userQuestion = String(args.question || '还需要补充 JD 或准备周期后再制定计划。');
      return { ok: true, summary: state.userQuestion, data: { question: state.userQuestion } };
    }
  }
}

async function retrieveCardsForRequirements(requirements: string[], state: OrchestratorState, perRequirement: number) {
  const excluded = new Set(state.prepIntent.excludeDecks);
  const matches = new Map<string, CardCandidateObservation>();
  for (const req of uniqueStrings(requirements, 24)) {
    const concepts = state.graphKeywords.filter(k => k.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(k.toLowerCase())).slice(0, 4);
    const terms = uniqueStrings([req, ...concepts, ...state.graphKeywords.slice(0, 8)], 10).filter(t => t.length >= 2);
    for (const term of terms) {
      const like = `%${term}%`;
      const rows = await prisma.$queryRawUnsafe(
        `SELECT id, deckId, number, question, title, titleCn, tags, subTopic FROM Card
         WHERE question LIKE ? OR titleCn LIKE ? OR title LIKE ?
            OR tags LIKE ? OR searchKeywords LIKE ? OR subTopic LIKE ?
         LIMIT ?`,
        like, like, like, like, like, like, perRequirement * 3,
      ) as Array<{ id: string; deckId: string | null; number?: number | null; question: string | null; title: string | null; titleCn?: string | null; tags?: string | null; subTopic?: string | null }>;
      for (const row of rows) {
        if (row.deckId && excluded.has(row.deckId)) continue;
        const existing = matches.get(row.id);
        if (existing) {
          existing.score += 1;
          if (!existing.matchedRequirements.includes(req)) existing.matchedRequirements.push(req);
          for (const concept of concepts) if (!existing.matchedConcepts.includes(concept)) existing.matchedConcepts.push(concept);
        } else {
          matches.set(row.id, {
            cardId: row.id,
            deckId: row.deckId || '',
            question: row.question || row.titleCn || row.title || '',
            title: row.titleCn || row.title,
            matchedRequirements: [req],
            matchedConcepts: concepts,
            score: 1,
            source: concepts.length > 0 ? 'hybrid' : 'fts5',
            subTopic: row.subTopic,
            tags: row.tags,
            number: row.number,
          });
        }
      }
    }
  }
  return [...matches.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, state.prepIntent.cardLimit);
}

async function findFullDeckCards(deckIds: string[]) {
  if (deckIds.length === 0) return [];
  const rows = await prisma.card.findMany({
    where: { deckId: { in: deckIds } },
    select: { id: true, deckId: true, number: true, question: true, title: true, titleCn: true, tags: true, subTopic: true },
    orderBy: [{ deckId: 'asc' }, { number: 'asc' }, { id: 'asc' }],
  });
  return rows.map(row => ({
    cardId: row.id,
    deckId: row.deckId || '',
    question: row.question || row.titleCn || row.title || '',
    title: row.titleCn || row.title,
    matchedRequirements: [],
    matchedConcepts: [],
    score: 999,
    source: 'full_deck' as const,
    subTopic: row.subTopic,
    tags: row.tags,
    number: row.number,
  }));
}

function availableCardList(state: OrchestratorState) {
  return state.cardCandidates
    .slice(0, state.prepIntent.horizon === 'long' ? 260 : 100)
    .map(c => `- ${c.cardId}: [${c.deckId}] ${c.question} | requirements=${c.matchedRequirements.join(',')} | concepts=${c.matchedConcepts.join(',')}`)
    .join('\n');
}

async function generatePlanFromState(state: OrchestratorState, mode: 'new' | 'revise') {
  if (state.prepIntent.includeFullDecks.length > 0) {
    const fullDeckIds = new Set(state.prepIntent.includeFullDecks);
    const comprehensiveCards = state.cardCandidates.filter(card => fullDeckIds.has(card.deckId));
    if (comprehensiveCards.length > 0) return buildDeterministicPlan(state, comprehensiveCards);
  }
  if (mode === 'revise' && state.options.currentPlan && state.revisionFeedback) {
    const prompt = [
      `Job: ${state.session.company || ''} ${state.session.role || ''}`,
      `Revision feedback: ${state.revisionFeedback}`,
      state.options.estimatedDays ? `Target days: ${state.options.estimatedDays}` : '',
      `Current plan:\n${JSON.stringify(state.options.currentPlan).slice(0, 3500)}`,
      `Structured requirements:\n${JSON.stringify(state.requirements).slice(0, 2500)}`,
      `Available cards, use only these cardIds:\n${availableCardList(state)}`,
      `Guard policy: return JSON plan only. Keep cardId values exactly as provided.`,
    ].filter(Boolean).join('\n\n');
    const raw = await llm(PLAN_REVISE_PROMPT, prompt, 4096, 0.2);
    const parsed = safeParseJson(raw);
    if (parsed) return parsed;
  }
  const prompt = [
    `Job: ${state.session.company || ''} ${state.session.role || ''}${state.roleProfile ? ` (${state.roleProfile.displayName})` : ''}`,
    `Preparation intent: ${state.prepIntent.horizon}${state.prepIntent.days ? ` (${state.prepIntent.days} days)` : ''}. ${state.prepIntent.reason}`,
    state.prepIntent.excludeDecks.length > 0 ? `Deck policy: exclude ${state.prepIntent.excludeDecks.join(', ')} for this short-term plan.` : '',
    `Structured requirements:\n${JSON.stringify(state.requirements).slice(0, 3500)}`,
    state.roleProfile ? `Role checklist: ${state.roleProfile.mustCoverInPlan.join(', ')}` : '',
    state.ragEvidence.length > 0 ? `RAG evidence:\n${toRagEvidenceString(state.ragEvidence).slice(0, 3000)}` : '',
    `Graph concepts: ${state.graphKeywords.slice(0, 60).join(', ')}`,
    state.cardCandidates.length > 0 ? `Cards, use only these cardIds:\n${availableCardList(state)}` : 'No cards available. Generate topic stages with empty cards arrays.',
  ].filter(Boolean).join('\n\n');
  const raw = await llm(PLAN_GENERATE_PROMPT, prompt, 4096, 0.2);
  const parsed = safeParseJson(raw);
  return parsed || buildDeterministicPlan(state, state.cardCandidates);
}

async function validatePlan(state: OrchestratorState) {
  const context = guardContext(state);
  let ruleResult = { passed: true, errors: [] as GuardError[], repairInstructions: [] as string[] };
  try { ruleResult = ruleValidate(state.currentPlan, context); } catch {}
  let dbCardErrors: GuardError[] = [];
  try { dbCardErrors = await validateCardIds(state.currentPlan); } catch {}
  let llmErrors: GuardError[] = [];
  try { const lr = await llmGuard(state.currentPlan, context); llmErrors = lr.errors || []; } catch {}
  if (state.prepIntent.horizon === 'short' || state.revisionFeedback) {
    llmErrors = llmErrors.map(error => ({ ...error, severity: 'warning' as const }));
  }
  const errors = [...ruleResult.errors, ...dbCardErrors, ...llmErrors];
  const missingFromPlanText = state.prepIntent.horizon === 'short' ? [] : findMissingByPlanText(state.currentPlan, state).slice(0, 8);
  const missingRequirements = uniqueStrings([...extractMissingRequirements(errors.filter(e => e.severity === 'error'), state), ...missingFromPlanText], 12);
  return {
    passed: errors.filter(e => e.severity === 'error').length === 0,
    errors,
    repairInstructions: ruleResult.repairInstructions,
    missingRequirements,
  };
}

async function repairPlanFromState(state: OrchestratorState) {
  const missing = state.guardResult?.missingRequirements || [];
  const cards = missing.length > 0
    ? state.cardCandidates.filter(card => missing.some(req => card.matchedRequirements.includes(req) || cardText(card).includes(req.toLowerCase())))
    : state.cardCandidates;
  const repairCards = cards.length > 0 ? cards : state.cardCandidates;
  if (repairCards.length > 0) return buildDeterministicPlan(state, repairCards);
  return generatePlanFromState(state, 'new');
}

async function computeMetrics(state: OrchestratorState, trace: ReActTraceStep[]): Promise<JobPrepAgentMetrics> {
  const ids = selectedCardIds(state.currentPlan);
  const existing = ids.length ? await prisma.card.findMany({ where: { id: { in: ids } }, select: { id: true } }) : [];
  const existingSet = new Set(existing.map(c => c.id));
  const fakeCardIds = ids.filter((id: string) => !existingSet.has(id)).length;
  const fullDeckCoverage: Record<string, { selected: number; available: number; coverage: number }> = {};
  for (const deckId of state.prepIntent.includeFullDecks) {
    const available = await prisma.card.count({ where: { deckId } });
    const selected = state.cardCandidates.filter(c => c.deckId === deckId && ids.includes(c.cardId)).length;
    fullDeckCoverage[deckId] = { selected, available, coverage: available > 0 ? selected / available : 1 };
  }
  const errors = state.guardResult?.errors || [];
  return {
    fakeCardIds,
    hallucinationRate: ids.length > 0 ? fakeCardIds / ids.length : 0,
    ruleErrorCount: errors.filter(e => e.severity === 'error').length,
    warningCount: errors.filter(e => e.severity === 'warning').length,
    mustCoverCoverage: state.guardResult?.missingRequirements?.length ? 1 - (state.guardResult.missingRequirements.length / Math.max(1, state.requirements.length)) : 1,
    selectedCardCount: ids.length,
    availableCardCount: state.cardCandidates.length,
    fullDeckCoverage,
    stageCount: state.currentPlan?.stages?.length || 0,
    repairCount: state.repairedCount,
    latencyMs: now() - state.startedAt,
    toolCallCount: trace.length,
    ragEvidenceCount: state.ragEvidence.length,
    cardCandidateCount: state.cardCandidates.length,
    missingRequirements: state.guardResult?.missingRequirements || [],
    saved: !!state.savedPlanId,
  };
}

async function loadInitialState(session: any, options: JobPrepOrchestratorOptions): Promise<OrchestratorState> {
  const [selectedJD, messages] = await Promise.all([
    prisma.jobPostingSnapshot.findFirst({ where: { sessionId: session.id, selected: true }, orderBy: { updatedAt: 'desc' } }),
    prisma.jobPrepMessage.findMany({ where: { sessionId: session.id, role: 'user' }, orderBy: { createdAt: 'asc' }, take: 30 }),
  ]);
  const contextText = [
    session.company || '',
    session.role || '',
    selectedJD?.cleanedText || selectedJD?.rawText || '',
    ...messages.map(m => m.content),
    options.revisionFeedback || '',
  ].filter(Boolean).join('\n');
  return {
    session,
    selectedJD,
    messages: messages.map(m => m.content),
    contextText,
    prepIntent: detectPrepIntent(contextText, session.roleFamily),
    requirements: [],
    graphKeywords: [],
    ragEvidence: [],
    cardCandidates: [],
    currentPlan: options.revisionFeedback ? undefined : options.currentPlan,
    revisionFeedback: options.revisionFeedback,
    observations: [],
    repairedCount: 0,
    guardFollowupRetrievals: 0,
    startedAt: now(),
    options,
  };
}

export function getJobPrepToolRegistry() {
  return TOOL_DEFINITIONS;
}

export async function generateJobPrepPlanWithReActAgents(session: any, options: JobPrepOrchestratorOptions = {}): Promise<MultiAgentPlanResult> {
  const state = await loadInitialState(session, options);
  const trace: ReActTraceStep[] = [];
  const maxSteps = Number(process.env.JOB_PREP_REACT_MAX_STEPS || 14);

  for (let i = 0; i < maxSteps; i++) {
    const decision = await decideNextAction(state);
    const tool = TOOL_DEFINITIONS[decision.action];
    const started = now();
    let observation: ReActObservation;
    try {
      const parsedArgs = tool.inputSchema.parse(decision.args || {});
      observation = await withTimeout(executeTool(decision.action, parsedArgs, state), tool.timeoutMs, decision.action);
      state.observations.push(observation);
    } catch (e: any) {
      observation = { ok: false, summary: `${decision.action} failed`, error: e.message };
      state.observations.push(observation);
      if (!tool.retryable) break;
    }
    trace.push({
      step: i + 1,
      action: decision.action,
      rationale: decision.rationale.slice(0, 240),
      args: decision.args || {},
      observation,
      durationMs: now() - started,
    });

    if (decision.action === 'ask_user' || state.userQuestion) break;
    if (decision.action === 'save_plan' && observation.ok) break;
  }

  if (!state.currentPlan && state.cardCandidates.length > 0) {
    state.currentPlan = buildDeterministicPlan(state, state.cardCandidates);
  }
  if (!state.guardResult && state.currentPlan) {
    state.guardResult = await validatePlan(state);
  }
  if (state.currentPlan && state.guardResult?.passed && !state.savedPlanId && options.savePlan) {
    const saved = await options.savePlan(state.currentPlan);
    state.savedPlanId = saved.id;
  }
  const metrics = await computeMetrics(state, trace);

  return {
    plan: state.currentPlan,
    savedPlanId: state.savedPlanId,
    trace,
    metrics,
    guardErrors: state.guardResult?.errors || [],
    mode: 'react-orchestrator',
    userQuestion: state.userQuestion,
  };
}
