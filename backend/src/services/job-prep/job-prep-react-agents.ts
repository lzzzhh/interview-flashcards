import prisma from '../../db/prisma';
import { getLLMProvider } from '../llm-provider';
import { buildKeywordTiersFromGraphWithLimits, resolveConceptFromGraph } from '../search/concept-graph';
import { JD_PARSE_PROMPT, PLAN_GENERATE_PROMPT } from './job-prep-prompts';
import { getProfile } from './role-profiles';
import type { RoleProfile } from './role-profiles/types';
import { llmGuard } from './guards/plan-llm-guard';
import { ruleValidate, validateCardIds, type GuardContext } from './guards/plan-rule-validator';

type PrepHorizon = 'short' | 'medium' | 'long';
type AgentName = 'ContextAgent' | 'RequirementAgent' | 'RetrievalAgent' | 'PlannerAgent' | 'CriticAgent';

export interface ReActTraceStep {
  agent: AgentName;
  thought: string;
  action: string;
  observation: string;
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

interface CandidateCard {
  id: string;
  deckId: string | null;
  number?: number | null;
  question: string | null;
  title: string | null;
  titleCn?: string | null;
  tags?: string | null;
  subTopic?: string | null;
  score?: number;
}

interface MultiAgentContext {
  session: any;
  company: string;
  role: string;
  profile?: RoleProfile;
  posting: any;
  userMessages: string[];
  contextText: string;
  prepIntent: PrepIntentProfile;
  requirements: any[];
  jdReqText: string;
  graphKeywords: string[];
  cards: CandidateCard[];
  hasCards: boolean;
  ragEvidence: string;
}

export interface JobPrepAgentMetrics {
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
}

export interface MultiAgentPlanResult {
  plan: any;
  trace: ReActTraceStep[];
  metrics: JobPrepAgentMetrics;
  guardErrors: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  mode: 'multi-agent-react';
}

function now() {
  return Date.now();
}

async function step<T>(
  trace: ReActTraceStep[],
  agent: AgentName,
  thought: string,
  action: string,
  run: () => Promise<{ observation: string; value: T }>,
): Promise<T> {
  const start = now();
  const { observation, value } = await run();
  trace.push({ agent, thought, action, observation, durationMs: now() - start });
  return value;
}

function safeParseJson(text: string): any {
  try { return JSON.parse(text); } catch {}
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) { try { return JSON.parse(m[1]); } catch {} }
  const s = text.indexOf('{'), e = text.lastIndexOf('}');
  if (s >= 0 && e > s) { try { return JSON.parse(text.slice(s, e + 1)); } catch {} }
  return null;
}

async function llm(systemPrompt: string, userContent: string, maxTokens = 4096) {
  const p = getLLMProvider();
  if (!p) throw new Error('LLM not configured');
  const r = await p.chat({
    model: p.defaultModel,
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
    temperature: 0.25,
    maxTokens,
  });
  return r.text;
}

function uniqueStrings(values: Array<string | null | undefined>, limit = 100) {
  return [...new Set(values.map(v => String(v || '').trim()).filter(Boolean))].slice(0, limit);
}

function detectDays(text: string): number | undefined {
  const c = text.toLowerCase();
  if (/(今天|今晚|明天|后天|大后天|过两天|这两天)/.test(text)) return 2;
  const dayMatch = c.match(/(\d+)\s*(天|day|days)/);
  if (dayMatch) return Number(dayMatch[1]);
  const weekMatch = c.match(/(\d+)\s*(周|星期|week|weeks)/);
  if (weekMatch) return Number(weekMatch[1]) * 7;
  const monthMatch = c.match(/(\d+)\s*(个月|月|month|months)/);
  if (monthMatch) return Number(monthMatch[1]) * 30;
  if (/(本周|这周|下周)/.test(text)) return 7;
  return undefined;
}

function detectPrepIntent(text: string, roleFamily: string | null | undefined): PrepIntentProfile {
  const lower = text.toLowerCase();
  const days = detectDays(text);
  const hasShortSignal = /(今天|今晚|明天|后天|大后天|过两天|这两天|马上|很急|临时|突击|冲刺|来不及|短期)/.test(text);
  const hasLongSignal = /(长期|系统|全面|完整|从零|打基础|全部|所有|刷完|hot\s*100|hot100|leetcode|力扣|一个月|两个月|三个月|半年)/i.test(text);
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
    || /((所有|全部|全量|完整).{0,12}(机器学习|machine learning|机器学习卡片))|((机器学习|machine learning|机器学习卡片).{0,12}(所有|全部|全量|完整|卡片))/i.test(text);
  const includeFullDecks = [
    includeHot100 ? 'leetcode' : '',
    horizon === 'long' && wantsMachineLearning ? 'machine-learning' : '',
  ].filter(Boolean);
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

function expandTermsFromConceptGraph(terms: string[], mode: 'search' | 'learning-path') {
  const expanded: string[] = [];
  for (const term of uniqueStrings(terms, 16)) {
    const resolved = resolveConceptFromGraph(term);
    if (!resolved.conceptGraphHit || !resolved.graphNodeId) continue;
    const tiers = buildKeywordTiersFromGraphWithLimits(resolved.graphNodeId, mode);
    expanded.push(resolved.canonicalTopic, ...tiers.coreKeywords, ...tiers.expandedKeywords, ...tiers.prerequisiteKeywords);
  }
  return uniqueStrings(expanded, mode === 'learning-path' ? 80 : 40);
}

async function expandTermsFromNeo4j(terms: string[], mode: 'search' | 'learning-path') {
  if (process.env.JOB_PREP_ENABLE_NEO4J !== 'true') return [];
  try {
    const { neo4jBuildKeywordTiers } = await import('../search/neo4j-graph-search');
    const expanded: string[] = [];
    for (const term of uniqueStrings(terms, mode === 'learning-path' ? 5 : 3)) {
      const result = await Promise.race([
        neo4jBuildKeywordTiers(term),
        new Promise<any>((resolve) => setTimeout(() => resolve(null), 1500)),
      ]);
      if (result?.tiers) expanded.push(...result.tiers.coreKeywords, ...result.tiers.expandedKeywords, ...result.tiers.prerequisiteKeywords);
    }
    return uniqueStrings(expanded, 60);
  } catch {
    return [];
  }
}

async function findCandidateCards(terms: string[], limit: number, excludeDecks: string[] = []) {
  const uniqueTerms = uniqueStrings(terms, 12).filter(t => t.length >= 2);
  const excluded = new Set(excludeDecks);
  const matches = new Map<string, CandidateCard>();
  for (const term of uniqueTerms) {
    const like = `%${term}%`;
    const rows = await prisma.$queryRawUnsafe(
      `SELECT id, deckId, number, question, title, titleCn, tags, subTopic FROM Card
       WHERE question LIKE ? OR titleCn LIKE ? OR title LIKE ?
          OR tags LIKE ? OR searchKeywords LIKE ? OR subTopic LIKE ?
       LIMIT ?`,
      like, like, like, like, like, like, limit * 2,
    ) as CandidateCard[];
    for (const row of rows) {
      if (row.deckId && excluded.has(row.deckId)) continue;
      const current = matches.get(row.id);
      if (current) current.score = (current.score || 0) + 1;
      else matches.set(row.id, { ...row, score: 1 });
    }
  }
  return [...matches.values()].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, limit);
}

async function findFullDeckCards(deckIds: string[]) {
  if (deckIds.length === 0) return [];
  return prisma.card.findMany({
    where: { deckId: { in: deckIds } },
    select: { id: true, deckId: true, number: true, question: true, title: true, titleCn: true, tags: true, subTopic: true },
    orderBy: [{ deckId: 'asc' }, { number: 'asc' }, { id: 'asc' }],
  }) as Promise<CandidateCard[]>;
}

function mergeCards(primary: CandidateCard[], extra: CandidateCard[], limit: number) {
  const merged = new Map<string, CandidateCard>();
  for (const card of [...primary, ...extra]) {
    if (!merged.has(card.id)) merged.set(card.id, card);
  }
  return [...merged.values()].slice(0, limit);
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

function leetcodeBucket(card: CandidateCard) {
  const text = `${parseTags(card.tags).join(' ')} ${card.question || ''} ${card.title || ''} ${card.titleCn || ''}`;
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

function stageNameForCard(card: CandidateCard) {
  if (card.deckId === 'leetcode') return leetcodeBucket(card);
  return card.subTopic || (card.deckId === 'machine-learning' ? '机器学习综合' : card.deckId || '综合准备');
}

function buildDeterministicPlan(session: any, cards: CandidateCard[], prepIntent: PrepIntentProfile, profile?: RoleProfile) {
  const groups = new Map<string, CandidateCard[]>();
  for (const card of cards) {
    const key = stageNameForCard(card);
    const group = groups.get(key) || [];
    group.push(card);
    groups.set(key, group);
  }
  const stages = [...groups.entries()].map(([name, group], index) => ({
    name: `${index + 1}. ${name}`,
    goal: prepIntent.includeHot100 && group.some(c => c.deckId === 'leetcode')
      ? `完成 Hot100 中「${name}」相关题目，建立可复盘的解题模板。`
      : prepIntent.horizon === 'short'
        ? `短期优先复盘「${name}」中最贴近 JD 的面试卡片。`
        : `系统覆盖「${name}」相关面试卡片，补齐准备的知识面。`,
    estimatedMinutes: Math.max(90, Math.min(360, group.length * 18)),
    cards: group.map(card => ({
      cardId: card.id,
      deckId: card.deckId || '',
      reason: prepIntent.includeHot100 && card.deckId === 'leetcode'
        ? '长期算法准备要求覆盖全部 Hot100。'
        : prepIntent.horizon === 'short'
          ? `短期冲刺优先覆盖 JD 直接相关的${profile?.displayName || '岗位'}知识点。`
          : `${profile?.displayName || '岗位'}准备要求覆盖该知识模块。`,
    })),
  }));
  const displayRole = [session.company, session.role].filter(Boolean).join(' ') || profile?.displayName || '岗位';
  const horizonName = prepIntent.horizon === 'short' ? '短期冲刺' : prepIntent.horizon === 'long' ? '长期系统' : '常规';
  return {
    title: `${displayRole}${horizonName}备战计划`,
    summary: [
      prepIntent.reason,
      `本计划由多 Agent ReAct 编排生成，安排 ${cards.length} 张可用卡片。`,
      profile?.mustCoverInPlan?.length ? `覆盖岗位核心项：${profile.mustCoverInPlan.join('、')}。` : '',
    ].filter(Boolean).join(' '),
    estimatedDays: prepIntent.days || (prepIntent.horizon === 'short' ? 2 : Math.max(14, Math.ceil(cards.length / 8))),
    stages,
  };
}

function selectedCardIds(plan: any) {
  return (plan?.stages || []).flatMap((s: any) => s.cards || []).map((c: any) => c.cardId).filter(Boolean);
}

function computeMustCoverCoverage(plan: any, profile?: RoleProfile) {
  if (!profile?.mustCoverInPlan?.length) return 1;
  const planText = JSON.stringify(plan).toLowerCase();
  const covered = profile.mustCoverInPlan.filter(skill => planText.includes(skill.toLowerCase())).length;
  return covered / profile.mustCoverInPlan.length;
}

async function computeMetrics(
  plan: any,
  context: MultiAgentContext,
  guardErrors: Array<{ code: string; message: string; severity: 'error' | 'warning' }>,
  repairCount: number,
  latencyMs: number,
): Promise<JobPrepAgentMetrics> {
  const ids = selectedCardIds(plan);
  const existing = ids.length
    ? await prisma.card.findMany({ where: { id: { in: ids } }, select: { id: true } })
    : [];
  const existingSet = new Set(existing.map(c => c.id));
  const fakeCardIds = ids.filter((id: string) => !existingSet.has(id)).length;
  const fullDeckCoverage: Record<string, { selected: number; available: number; coverage: number }> = {};
  for (const deckId of context.prepIntent.includeFullDecks) {
    const available = await prisma.card.count({ where: { deckId } });
    const selected = ids.filter((id: string) => context.cards.find(c => c.id === id && c.deckId === deckId)).length;
    fullDeckCoverage[deckId] = { selected, available, coverage: available > 0 ? selected / available : 1 };
  }
  const ruleErrorCount = guardErrors.filter(e => e.severity === 'error').length;
  const warningCount = guardErrors.filter(e => e.severity === 'warning').length;
  return {
    fakeCardIds,
    hallucinationRate: ids.length > 0 ? fakeCardIds / ids.length : 0,
    ruleErrorCount,
    warningCount,
    mustCoverCoverage: computeMustCoverCoverage(plan, context.profile),
    selectedCardCount: ids.length,
    availableCardCount: context.cards.length,
    fullDeckCoverage,
    stageCount: plan?.stages?.length || 0,
    repairCount,
    latencyMs,
  };
}

async function contextAgent(session: any, trace: ReActTraceStep[]): Promise<MultiAgentContext> {
  return step(trace, 'ContextAgent',
    'I need to observe the complete session before planning so the system does not skip missing user intent.',
    'load_session_context',
    async () => {
      const [posting, messages] = await Promise.all([
        prisma.jobPostingSnapshot.findFirst({
          where: { sessionId: session.id, selected: true },
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.jobPrepMessage.findMany({
          where: { sessionId: session.id, role: 'user' },
          orderBy: { createdAt: 'asc' },
          take: 20,
        }),
      ]);
      const contextText = [
        session.company || '',
        session.role || '',
        posting?.cleanedText || posting?.rawText || '',
        ...messages.map(m => m.content),
      ].filter(Boolean).join('\n');
      const prepIntent = detectPrepIntent(contextText, session.roleFamily);
      const profile = getProfile(session.roleFamily || '');
      const value: MultiAgentContext = {
        session,
        company: session.company || '',
        role: session.role || '',
        profile,
        posting,
        userMessages: messages.map(m => m.content),
        contextText,
        prepIntent,
        requirements: [],
        jdReqText: '',
        graphKeywords: [],
        cards: [],
        hasCards: false,
        ragEvidence: '',
      };
      return {
        observation: `target=${session.company || ''} ${session.role || ''}; roleFamily=${session.roleFamily || 'unknown'}; horizon=${prepIntent.horizon}; explicit=${prepIntent.explicit}`,
        value,
      };
    });
}

async function requirementAgent(context: MultiAgentContext, trace: ReActTraceStep[]) {
  return step(trace, 'RequirementAgent',
    'I need to extract JD requirements and distinguish JD evidence from role checklist assumptions.',
    'parse_requirements',
    async () => {
      let reqs = await prisma.jobRequirement.findMany({ where: { sessionId: context.session.id } });
      if (reqs.length === 0 && context.posting?.rawText) {
        try {
          const raw = await llm(JD_PARSE_PROMPT, `Parse this JD:\n${String(context.posting.cleanedText || context.posting.rawText).slice(0, 3000)}`);
          const parsed = safeParseJson(raw);
          if (parsed?.requirements) {
            for (const r of parsed.requirements) {
              await prisma.jobRequirement.create({
                data: {
                  sessionId: context.session.id,
                  type: r.type || 'skill',
                  name: r.name,
                  normalizedName: r.normalizedName,
                  importance: r.importance || 'unknown',
                  evidenceText: r.evidenceText,
                },
              });
            }
            reqs = await prisma.jobRequirement.findMany({ where: { sessionId: context.session.id } });
          }
        } catch { /* non-critical */ }
      }
      context.requirements = reqs;
      context.jdReqText = reqs.length > 0
        ? reqs.map(r => `- [JD] ${r.type}: ${r.name} (${r.importance})`).join('\n')
        : '(no JD requirements extracted)';
      return { observation: `requirements=${reqs.length}`, value: context };
    });
}

async function retrievalAgent(context: MultiAgentContext, trace: ReActTraceStep[]) {
  return step(trace, 'RetrievalAgent',
    'I need to expand concepts through the graph and retrieve only valid database cards before the planner writes cardIds.',
    'graph_expand_and_retrieve_cards',
    async () => {
      const profileKeywords = context.profile
        ? [...context.profile.mustCoverInPlan, ...context.profile.concepts, ...context.profile.interviewTopics]
        : [];
      const seedTerms = [
        ...(context.profile?.mustCoverInPlan || []),
        ...(context.profile?.interviewTopics || []),
        context.company,
        context.role,
        ...context.requirements.flatMap(r => [r.normalizedName || '', r.name || ''].filter((t: string) => t.length <= 40)),
      ];
      const localGraphKw = expandTermsFromConceptGraph([...seedTerms, ...profileKeywords], context.prepIntent.graphMode);
      const neo4jGraphKw = await expandTermsFromNeo4j([...seedTerms, ...profileKeywords], context.prepIntent.graphMode);
      context.graphKeywords = uniqueStrings([...localGraphKw, ...neo4jGraphKw, ...profileKeywords], 80);
      const cardSearchTerms = uniqueStrings([...seedTerms, ...context.graphKeywords], 120);
      const matchedCards = await findCandidateCards(cardSearchTerms, context.prepIntent.cardLimit, context.prepIntent.excludeDecks);
      const fullDeckCards = await findFullDeckCards(context.prepIntent.includeFullDecks);
      context.cards = mergeCards(fullDeckCards, matchedCards, context.prepIntent.cardLimit);
      context.hasCards = context.cards.length > 0;
      return {
        observation: `graphKeywords=${context.graphKeywords.length}; cards=${context.cards.length}; fullDecks=${context.prepIntent.includeFullDecks.join(',') || 'none'}`,
        value: context,
      };
    });
}

async function plannerAgent(context: MultiAgentContext, trace: ReActTraceStep[]) {
  return step(trace, 'PlannerAgent',
    'I need to create a plan using only observed cards. Full-deck policies are deterministic to avoid omissions.',
    'draft_plan',
    async () => {
      if (context.prepIntent.includeFullDecks.length > 0) {
        const fullDeckIds = new Set(context.prepIntent.includeFullDecks);
        const comprehensiveCards = context.cards.filter(card => card.deckId && fullDeckIds.has(card.deckId));
        const plan = buildDeterministicPlan(context.session, comprehensiveCards, context.prepIntent, context.profile);
        return { observation: `deterministicFullDeckPlan cards=${selectedCardIds(plan).length}`, value: plan };
      }

      const checklistText = context.profile
        ? [
          `以下为${context.profile.displayName}岗位常见准备项（来自岗位画像，非JD原文）：`,
          ...context.profile.mustCoverInPlan.map((s: string) => `- [CHECKLIST] skill: ${s} (must_have — role common)`),
        ].join('\n')
        : '';
      const cardList = context.hasCards
        ? context.cards.map(c => `- ${c.id}: [${c.deckId || ''}] ${c.question || c.title || ''}`).join('\n')
        : '(no cards available — generate topic-based plan with empty cards array, use topic fields instead)';
      const basePrompt = [
        `Job: ${context.company} ${context.role}${context.profile ? ` (${context.profile.displayName})` : ''}`,
        `\nJD Requirements (extracted from job posting):\n${context.jdReqText}`,
        checklistText ? `\nRole Checklist (role-common requirements, supplement gaps):\n${checklistText}` : '',
        `\nPreparation intent: ${context.prepIntent.horizon}${context.prepIntent.days ? ` (${context.prepIntent.days} days)` : ''}. ${context.prepIntent.reason}`,
        context.prepIntent.excludeDecks.length > 0 ? `\nDeck policy: exclude ${context.prepIntent.excludeDecks.join(', ')} for this short-term plan.` : '',
        `\nConcepts from knowledge graph: ${context.graphKeywords.join(', ')}`,
        `\nCards:\n${cardList}`,
      ].join('\n');
      const raw = await llm(PLAN_GENERATE_PROMPT, basePrompt);
      const plan = safeParseJson(raw);
      return { observation: `llmDraftPlan parsed=${!!plan}; cards=${selectedCardIds(plan).length}`, value: plan };
    });
}

async function criticAgent(context: MultiAgentContext, draftPlan: any, trace: ReActTraceStep[], startedAt: number) {
  return step(trace, 'CriticAgent',
    'I need to validate the plan against database cardIds, product rules, and semantic quality, then repair by deterministic fallback if needed.',
    'validate_and_repair_plan',
    async () => {
      let plan = draftPlan;
      const guardProfile = context.prepIntent.horizon === 'short' && context.profile
        ? { ...context.profile, mustCoverInPlan: [] }
        : context.profile;
      const guardContext: GuardContext = {
        hasCards: context.hasCards,
        roleFamily: context.session.roleFamily,
        profile: guardProfile,
        jdReqText: context.jdReqText,
        ragEvidence: context.ragEvidence,
      };
      let ruleResult = { passed: true, errors: [] as any[], repairInstructions: [] as string[] };
      try { ruleResult = ruleValidate(plan, guardContext); } catch {}
      let dbCardErrors: any[] = [];
      try { dbCardErrors = await validateCardIds(plan); } catch {}
      let llmErrors: any[] = [];
      try { const lr = await llmGuard(plan, guardContext); llmErrors = lr.errors || []; } catch {}
      let guardErrors = [...ruleResult.errors, ...dbCardErrors, ...llmErrors];
      let repairCount = 0;

      if (guardErrors.some(e => e.severity === 'error') && context.cards.length > 0) {
        const repairCards = context.prepIntent.includeFullDecks.length > 0
          ? context.cards.filter(card => card.deckId && context.prepIntent.includeFullDecks.includes(card.deckId))
          : context.cards;
        plan = buildDeterministicPlan(context.session, repairCards, context.prepIntent, context.profile);
        repairCount = 1;
        ruleResult = ruleValidate(plan, guardContext);
        dbCardErrors = await validateCardIds(plan);
        guardErrors = [...ruleResult.errors, ...dbCardErrors];
      }

      const metrics = await computeMetrics(plan, context, guardErrors, repairCount, now() - startedAt);
      return {
        observation: `fakeCardIds=${metrics.fakeCardIds}; hallucinationRate=${metrics.hallucinationRate}; ruleErrors=${metrics.ruleErrorCount}; coverage=${metrics.mustCoverCoverage}`,
        value: { plan, metrics, guardErrors },
      };
    });
}

export async function generateJobPrepPlanWithReActAgents(session: any): Promise<MultiAgentPlanResult> {
  const startedAt = now();
  const trace: ReActTraceStep[] = [];
  let context = await contextAgent(session, trace);
  context = await requirementAgent(context, trace);
  context = await retrievalAgent(context, trace);
  const draftPlan = await plannerAgent(context, trace);
  const reviewed = await criticAgent(context, draftPlan, trace, startedAt);
  return {
    plan: reviewed.plan,
    trace,
    metrics: reviewed.metrics,
    guardErrors: reviewed.guardErrors,
    mode: 'multi-agent-react',
  };
}
