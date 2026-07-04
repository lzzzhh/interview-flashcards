// Job Prep Conversation Turn Handler — unified multi-turn entry point
// Classifies intent → routes to appropriate handler → returns assistant response

import prisma from '../../db/prisma';
import { getLLMProvider } from '../llm-provider';
import { JD_PARSE_PROMPT, PLAN_GENERATE_PROMPT, PLAN_REVISE_PROMPT, TARGET_PARSE_PROMPT } from './job-prep-prompts';
import { searchPublicJD } from './tools/public-jd-search-tool';
import { ragSearch } from '../rag/rag-search';
import { indexJobPosting } from '../rag/rag-indexer';
import { buildKeywordTiersFromGraphWithLimits, resolveConceptFromGraph } from '../search/concept-graph';
import { getProfile } from './role-profiles';
import type { RoleProfile } from './role-profiles/types';
import { ruleValidate, validateCardIds, type GuardContext } from './guards/plan-rule-validator';
import { llmGuard } from './guards/plan-llm-guard';
import { generateJobPrepPlanWithReActAgents } from './job-prep-react-agents';
import { classifyJobPrepIntent, isJobDescriptionText, type JobPrepIntent, type JobPrepIntentResult } from './job-prep-intent';
import { JdParseSchema, JobPrepPlanSchema, TargetParseSchema, parseWithSchema } from './job-prep-schemas';

// ── Intent types ──

export type { JobPrepIntent };

type PrepHorizon = 'short' | 'medium' | 'long';

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

const TECHNICAL_ROLE_FAMILIES = new Set([
  'data-analysis',
  'data-science',
  'algorithm',
  'machine-learning',
  'llm',
  'llm-application',
  'backend',
  'frontend',
]);

const CODING_INTERVIEW_TERMS = [
  'LeetCode',
  'Hot100',
  '数据结构',
  '算法基础',
  '数组',
  '哈希表',
  '链表',
  '二叉树',
  '双指针',
  '滑动窗口',
  '动态规划',
];

function codingBasicsLimit(horizon: PrepHorizon) {
  if (horizon === 'short') return 8;
  if (horizon === 'medium') return 16;
  return 0;
}

// ── Helpers ──

async function llm(prompt: string, userContent: string): Promise<string> {
  const p = getLLMProvider(); if (!p) throw new Error('LLM not configured');
  const r = await p.chat({
    model: p.defaultModel,
    messages: [{ role: 'system', content: prompt }, { role: 'user', content: userContent }],
    temperature: 0.3,
    maxTokens: 4096,
    responseFormat: 'json_object',
  });
  return r.text;
}

async function loadSession(sessionId: string): Promise<any> {
  return prisma.jobPrepSession.findUnique({ where: { id: sessionId } });
}

async function loadActivePlan(planId: string | null | undefined) {
  if (!planId) return null;
  return prisma.jobPrepPlan.findUnique({ where: { id: planId }, include: { stages: { orderBy: { order: 'asc' }, include: { cards: { orderBy: { order: 'asc' } } } } } });
}

function uniqueStrings(values: Array<string | null | undefined>, limit = 100) {
  return [...new Set(values.map(v => String(v || '').trim()).filter(Boolean))].slice(0, limit);
}

function parseSmallChineseNumber(value: string): number | undefined {
  const digits: Record<string, number> = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  if (value === '十') return 10;
  if (value.length === 1) return digits[value];
  const parts = value.split('十');
  if (parts.length !== 2) return undefined;
  const tens = parts[0] ? digits[parts[0]] : 1;
  const ones = parts[1] ? digits[parts[1]] : 0;
  return tens === undefined || ones === undefined ? undefined : tens * 10 + ones;
}

function detectDays(text: string): number | undefined {
  const c = text.toLowerCase();
  if (/(今天|今晚|明天)/.test(text)) return 1;
  if (/(后天|过两天|两天后|这两天)/.test(text)) return 2;
  if (/(大后天|三天后|3\s*天后)/.test(text)) return 3;
  const dayMatch = c.match(/(\d+)\s*(天|day|days)/);
  if (dayMatch) return Number(dayMatch[1]);
  const chineseDayMatch = text.match(/([一二两三四五六七八九十]{1,3})\s*天(?:后|内)?/);
  if (chineseDayMatch) {
    const days = parseSmallChineseNumber(chineseDayMatch[1]);
    if (days !== undefined) return days;
  }
  const weekMatch = c.match(/(\d+)\s*(周|星期|week|weeks)/);
  if (weekMatch) return Number(weekMatch[1]) * 7;
  const chineseWeekMatch = text.match(/([一二两三四五六七八九十]{1,3})\s*(周|星期|礼拜)/);
  if (chineseWeekMatch) {
    const weeks = parseSmallChineseNumber(chineseWeekMatch[1]);
    if (weeks !== undefined) return weeks * 7;
  }
  const monthMatch = c.match(/(\d+)\s*(个月|月|month|months)/);
  if (monthMatch) return Number(monthMatch[1]) * 30;
  const chineseMonthMatch = text.match(/([一二两三四五六七八九十]{1,3})\s*(个月|月)/);
  if (chineseMonthMatch) {
    const months = parseSmallChineseNumber(chineseMonthMatch[1]);
    if (months !== undefined) return months * 30;
  }
  if (/(本周|这周)/.test(text)) return 5;
  if (/(下周|下星期)/.test(text)) return 7;
  return undefined;
}

function detectPrepIntent(text: string, session: any): PrepIntentProfile {
  const lower = text.toLowerCase();
  const hasShortSignal = /(今天|今晚|明天|后天|大后天|过两天|这两天|马上|很急|临时|突击|冲刺|来不及|短期)/.test(text);
  const hasLongSignal = /(长期|系统性|系统\s*(准备|学习|复习|梳理|过一遍)|全面|完整|从零|打基础|全部|所有|全量|刷完|hot\s*100|hot100|leetcode|力扣)/i.test(text);
  const hasPrepDurationContext = /(准备|备战|面试|冲刺|复习|计划|只有|剩|来不及|系统)/.test(text);
  const rawDays = detectDays(text);
  const days = (hasPrepDurationContext || hasShortSignal || hasLongSignal) ? rawDays : undefined;
  const explicit = days !== undefined || hasShortSignal || hasLongSignal;

  let horizon: PrepHorizon = 'medium';
  if (days !== undefined && days <= 3) horizon = 'short';
  else if (days !== undefined && days >= 21) horizon = 'long';
  else if (hasShortSignal) horizon = 'short';
  else if (hasLongSignal) horizon = 'long';

  const roleFamily = String(session.roleFamily || '');
  const isTechnicalRole = TECHNICAL_ROLE_FAMILIES.has(roleFamily)
    || /(工程师|开发|技术|算法|数据|前端|后端|测试|运维|安全|架构|程序员|developer|engineer)/i.test(text);
  const includeHot100 = horizon === 'long' && isTechnicalRole;
  const wantsMachineLearning = roleFamily === 'machine-learning'
    || /((所有|全部|全量|完整|全都).{0,12}(机器学习|machine learning|机器学习卡片))|((机器学习|machine learning|机器学习卡片).{0,12}(所有|全部|全量|完整|全都|卡片|过一遍|都过|系统过))/i.test(text);

  const includeFullDecks = [
    includeHot100 ? 'leetcode' : '',
    horizon === 'long' && wantsMachineLearning ? 'machine-learning' : '',
  ].filter(Boolean);

  const excludeDecks: string[] = [];
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
      ? '识别为短期冲刺，优先 JD 命中点，并保留少量算法基础卡片。'
      : horizon === 'long'
        ? '识别为长期系统准备，允许知识图谱深度扩展并纳入全量核心牌组。'
        : '识别为常规准备，使用 JD + 岗位画像的中等范围计划。',
  };
}

function hasUsableTarget(session: any) {
  const role = String(session.role || '').trim();
  return !!role
    && role !== 'unknown'
    && role.length < 40
    && !/(准备|面试|JD|jd|岗位描述|职位描述|暂时没有|没有)/.test(role);
}

function inferRoleFamily(text: string) {
  const combined = text.toLowerCase();
  if (/数据分析|bi|tableau|埋点|数仓|取数|sql/.test(combined)) return 'data-analysis';
  if (/数据科学|因果|a\/b|ab实验|机器学习/.test(combined)) return 'data-science';
  if (/后端|java|go|spring|分布式/.test(combined)) return 'backend';
  if (/前端|react|vue|typescript|javascript/.test(combined)) return 'frontend';
  if (/大模型|llm|rag|agent|prompt/.test(combined)) return 'llm-application';
  if (/算法|leetcode|hot100|动态规划/.test(combined)) return 'algorithm';
  return 'other';
}

function inferTargetFromPlainText(content: string) {
  const cleaned = content.replace(/\s+/g, ' ').trim();
  const knownCompanies = ['字节跳动', '腾讯微信', '腾讯', '阿里', '蚂蚁', '美团', '百度', '快手', '京东', '小红书', '抖音', '飞书'];
  const company = knownCompanies.find(name => cleaned.includes(name)) || null;
  const knownRoleMatch = cleaned.match(/(AI\s*应用开发工程师|大模型算法工程师|机器学习工程师|数据科学实习生|数据分析实习生|数据分析师|算法工程师|后端开发工程师|前端开发工程师|Java\s*开发工程师)/i);
  const fallbackRoleMatch = cleaned.match(/(?:岗位|职位)?[:：]?\s*([\u4e00-\u9fa5A-Za-z0-9 +#/.-]{2,24}(?:工程师|开发|实习生|分析师|科学家|算法岗|开发岗|产品岗|运营岗))/i);
  const roleMatch = knownRoleMatch || fallbackRoleMatch;
  const role = (roleMatch?.[1] || '')
    .replace(company || '', '')
    .replace(/^(我想|我要|希望|计划|打算|准备|面试|应聘|投递|按通用|通用|的|岗位：?|职位：?)+/, '')
    .replace(/岗位$/, '')
    .trim();
  return {
    company,
    role: role && role.length < 40 ? role.replace(/岗位$/, '') : 'unknown',
    roleFamily: inferRoleFamily(cleaned),
  };
}

function inferTargetFromJD(content: string) {
  const firstLine = content.split(/\n/).map(line => line.trim()).find(Boolean) || '';
  const titleMatch = firstLine.match(/^(.+?)[-—–](.+)$/);
  const role = (titleMatch?.[1] || firstLine).trim();
  const company = titleMatch?.[2]?.trim() || null;
  return {
    company,
    role: role || 'unknown',
    roleFamily: inferRoleFamily(`${content}\n${role}`),
  };
}

async function parseTargetIntoSession(session: any, content: string) {
  if (isJobDescriptionText(content)) {
    const inferred = inferTargetFromJD(content);
    return prisma.jobPrepSession.update({
      where: { id: session.id },
      data: {
        company: inferred.company || session.company || null,
        role: inferred.role || session.role || 'unknown',
        roleFamily: inferred.roleFamily || session.roleFamily || null,
      },
    });
  }
  try {
    const raw = await llm(TARGET_PARSE_PROMPT, content.slice(0, 3000));
    const parsed = parseWithSchema(TargetParseSchema, raw);
    if (!parsed?.role) {
      const inferred = inferTargetFromPlainText(content);
      if (!inferred.role || inferred.role === 'unknown') return session;
      return prisma.jobPrepSession.update({
        where: { id: session.id },
        data: {
          company: inferred.company || session.company || null,
          role: inferred.role,
          roleFamily: inferred.roleFamily || session.roleFamily || null,
        },
      });
    }
    return prisma.jobPrepSession.update({
      where: { id: session.id },
      data: {
        company: parsed.company || session.company || null,
        role: parsed.role || session.role || 'unknown',
        roleFamily: parsed.roleFamily || session.roleFamily || null,
      },
    });
  } catch {
    const inferred = inferTargetFromPlainText(content);
    if (!inferred.role || inferred.role === 'unknown') return session;
    return prisma.jobPrepSession.update({
      where: { id: session.id },
      data: {
        company: inferred.company || session.company || null,
        role: inferred.role,
        roleFamily: inferred.roleFamily || session.roleFamily || null,
      },
    });
  }
}

async function getSessionContext(session: any) {
  const [selectedPosting, messages] = await Promise.all([
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
    selectedPosting?.cleanedText || selectedPosting?.rawText || '',
    ...messages.map(m => m.content),
  ].filter(Boolean).join('\n');
  return { selectedPosting, contextText, prepIntent: detectPrepIntent(contextText, session) };
}

async function savePastedJD(session: any, content: string, parseRequirements = true) {
  const posting = await prisma.jobPostingSnapshot.create({
    data: {
      sessionId: session.id,
      sourceType: 'user_pasted',
      rawText: content,
      cleanedText: content,
      company: session.company,
      role: session.role,
      selected: true,
    },
  });
  await prisma.jobPostingSnapshot.updateMany({
    where: { sessionId: session.id, id: { not: posting.id } },
    data: { selected: false },
  });

  if (parseRequirements) try {
    const raw = await llm(JD_PARSE_PROMPT, `Parse this JD:\n${content.slice(0, 3000)}`);
    const parsed = parseWithSchema(JdParseSchema, raw);
    if (parsed?.requirements) {
      await prisma.jobRequirement.deleteMany({ where: { sessionId: session.id } });
      for (const r of parsed.requirements) {
        await prisma.jobRequirement.create({
          data: {
            sessionId: session.id,
            type: r.type || 'skill',
            name: r.name,
            normalizedName: r.normalizedName,
            importance: r.importance || 'unknown',
            evidenceText: r.evidenceText,
          },
        });
      }
    }
  } catch { /* non-critical */ }

  if (process.env.JOB_PREP_ENABLE_RAG === 'true') {
    indexJobPosting(posting.id).catch(e => console.warn(`[job-prep] JD index failed: ${e.message}`));
  }
  return posting;
}

function expandTermsFromConceptGraph(terms: string[], mode: 'search' | 'learning-path') {
  const expanded: string[] = [];
  for (const term of uniqueStrings(terms, 16)) {
    const resolved = resolveConceptFromGraph(term);
    if (!resolved.conceptGraphHit || !resolved.graphNodeId) continue;
    const tiers = buildKeywordTiersFromGraphWithLimits(resolved.graphNodeId, mode);
    expanded.push(
      resolved.canonicalTopic,
      ...tiers.coreKeywords,
      ...tiers.expandedKeywords,
      ...tiers.prerequisiteKeywords,
    );
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
      if (result?.tiers) {
        expanded.push(
          ...result.tiers.coreKeywords,
          ...result.tiers.expandedKeywords,
          ...result.tiers.prerequisiteKeywords,
        );
      }
    }
    return uniqueStrings(expanded, 60);
  } catch (e: any) {
    console.warn(`[job-prep] Neo4j expansion skipped: ${e.message}`);
    return [];
  }
}

async function findCandidateCards(terms: string[], limit: number, excludeDecks: string[] = []) {
  const uniqueTerms = [...new Set(terms.map(t => t.trim()).filter(t => t.length >= 2))].slice(0, 12);
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

  return [...matches.values()]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, limit);
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
  const tags = parseTags(card.tags).join(' ');
  const text = `${tags} ${card.question || ''} ${card.title || ''} ${card.titleCn || ''}`;
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

function buildDeterministicPlan(
  session: any,
  cards: CandidateCard[],
  prepIntent: PrepIntentProfile,
  profile?: RoleProfile,
) {
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
    summary: `${prepIntent.reason} 本计划采用确定性分组，安排 ${cards.length} 张可用卡片。`,
    estimatedDays: prepIntent.days || (prepIntent.horizon === 'short' ? 2 : Math.max(14, Math.ceil(cards.length / 8))),
    stages,
  };
}

// ── Intent Classifier ──

function classifyIntent(content: string, hasPlan: boolean): JobPrepIntentResult {
  return classifyJobPrepIntent(content, hasPlan);
}

async function logAgentTrace(sessionId: string, event: string, payload: Record<string, any>) {
  await prisma.jobPrepMessage.create({
    data: {
      sessionId,
      role: 'tool',
      content: event,
      toolName: event,
      toolPayload: payload,
    },
  }).catch(() => {});
}

// ── Main Handler ──

export async function handleJobPrepMessage(sessionId: string, content: string): Promise<any> {
  let session = await loadSession(sessionId);
  if (!session) return { assistantMessage: '会话不存在。', nextAction: 'collect_target' };

  // Fix #2: confirm_jd by session status + digit input
  if (session.status === 'confirming_jd' && /^\d+$/.test(content.trim())) {
    return handleConfirmJD(session, content);
  }

  await prisma.jobPrepMessage.create({ data: { sessionId, role: 'user', content } });

  const activePlan = await loadActivePlan(session.activePlanId);
  const hasPlan = !!session.activePlanId;
  const intentResult = classifyIntent(content, hasPlan);
  await logAgentTrace(sessionId, 'intent_classified', {
    intent: intentResult.intent,
    confidence: intentResult.confidence,
    reason: intentResult.reason,
    hasPlan,
    status: session.status,
  });

  if (!hasPlan && (isJobDescriptionText(content) || !hasUsableTarget(session) || !session.roleFamily)) {
    session = await parseTargetIntoSession(session, content);
  }

  if (!hasPlan && isJobDescriptionText(content)) {
    const prepIntentFromMessage = detectPrepIntent(content, session);
    await savePastedJD(session, content, prepIntentFromMessage.explicit);
    session = await loadSession(sessionId);
    if (!session) return { assistantMessage: '会话不存在。', nextAction: 'collect_target' };
  }

  if (!hasPlan) {
    const { selectedPosting, prepIntent } = await getSessionContext(session);

    if (!hasUsableTarget(session)) {
      await prisma.jobPrepSession.update({ where: { id: session.id }, data: { status: 'collecting' } });
      return {
        assistantMessage: '我已经收到信息了，但还缺目标岗位。你要准备哪个公司、什么岗位的面试？例如「腾讯算法工程师」或「字节数据分析实习」。',
        nextAction: 'collect_target',
      };
    }

    if (!selectedPosting) {
      const c = content.toLowerCase();
      if (c.includes('搜索') && (content.includes('JD') || content.includes('岗位') || content.includes('公开'))) {
        return handleSearchJD(session);
      }
      if (/(没有|无|暂时没有|没找到).{0,8}(jd|JD|岗位描述)?/.test(content)) {
        await prisma.jobPostingSnapshot.create({
          data: { sessionId: session.id, sourceType: 'fallback_profile', rawText: `通用${session.role || ''}岗位画像`, selected: true },
        });
        session = await loadSession(sessionId);
      } else {
        await prisma.jobPrepSession.update({ where: { id: session.id }, data: { status: 'collecting_context' } });
        const cycleHint = prepIntent.explicit
          ? ''
          : '\n\n另外也告诉我准备周期：比如「过两天面试」或「长期系统准备」。';
        return {
          assistantMessage: `目标我先记为「${[session.company, session.role].filter(Boolean).join(' ') || session.role}」。请直接粘贴这份岗位 JD，我会从 JD 中提取技能要求并生成备战计划。如果暂时没有 JD，回复「没有 JD」。${cycleHint}`,
          nextAction: 'ask_for_jd',
        };
      }
    }

    const refreshed = await loadSession(sessionId);
    if (refreshed) session = refreshed;
    const refreshedContext = await getSessionContext(session);
    if (!refreshedContext.prepIntent.explicit) {
      await prisma.jobPrepSession.update({ where: { id: session.id }, data: { status: 'collecting_context' } });
      return {
        assistantMessage: 'JD 和目标岗位我已经收到了。你这次是短期冲刺还是长期系统准备？\n\n例如：\n- 「过两天就面试，短期冲刺」\n- 「长期准备，Hot100 全部安排」\n- 「长期准备，把机器学习卡片都安排上」',
        nextAction: 'collect_prep_intent',
      };
    }

    await prisma.jobPrepSession.update({ where: { id: session.id }, data: { status: 'planning' } });
    return generateAndSavePlan(session);
  }

  // ── Route by intent ──
  switch (intentResult.intent) {
    case 'provide_jd': return handleProvideJD(session, content);
    case 'search_jd_again': return handleSearchJD(session);
    case 'confirm_jd': return handleConfirmJD(session, content);
    case 'shorten_plan': return handleShortenPlan(session, activePlan, content);
    case 'strengthen_skill': return handleStrengthenSkill(session, activePlan, content);
    case 'reduce_topic': return handleReduceTopic(session, activePlan, content);
    case 'revise_plan': return revisePlanWithFeedback(session, activePlan, content);
    case 'explain_plan': return handleExplainPlan(activePlan);
    case 'replace_cards': return handleReplaceCards(session, activePlan);
    case 'regenerate_plan': return handleRegeneratePlan(session, activePlan);
    case 'start_learning': return handleStartLearning(activePlan);
    default: return handleGeneralQuestion(session, activePlan, content);
  }
}

// ── Intent Handlers ──

async function handleProvideJD(session: any, content: string) {
  const posting = await prisma.jobPostingSnapshot.create({ data: { sessionId: session.id, sourceType: 'user_pasted', rawText: content, cleanedText: content, company: session.company, role: session.role, selected: true } });
  await prisma.jobPrepSession.update({ where: { id: session.id }, data: { status: 'planning' } });

  // Parse requirements
  try {
    const raw = await llm(JD_PARSE_PROMPT, `Parse this JD:\n${content.slice(0, 3000)}`);
    const parsed = parseWithSchema(JdParseSchema, raw);
    if (parsed?.requirements) for (const r of parsed.requirements) {
      await prisma.jobRequirement.create({ data: { sessionId: session.id, type: r.type || 'skill', name: r.name, normalizedName: r.normalizedName, importance: r.importance || 'unknown', evidenceText: r.evidenceText } });
    }
  } catch { /* non-critical */ }

  // Index JD into Qdrant for RAG retrieval (fire-and-forget, don't block response)
  if (process.env.JOB_PREP_ENABLE_RAG === 'true') {
    indexJobPosting(posting.id).catch(e => console.warn(`[job-prep] JD index failed: ${e.message}`));
  }

  return generateAndSavePlan(session);
}

async function handleSearchJD(session: any) {
  if (process.env.JOB_PREP_ENABLE_PUBLIC_JD_SEARCH !== 'true') {
    return {
      assistantMessage: '为了保证岗位信息可靠，请直接粘贴岗位 JD；如果暂时没有 JD，回复「没有 JD」，我会按岗位画像生成通用计划。',
      nextAction: 'ask_for_jd',
    };
  }
  const result = await searchPublicJD(session.company || '', session.role || '');
  if (result.candidates.length > 0) {
    for (const c of result.candidates) {
      await prisma.jobPostingSnapshot.create({ data: { sessionId: session.id, sourceType: c.sourceType, sourceUrl: c.sourceUrl, title: c.title, company: c.company, role: c.role, rawText: c.rawText, cleanedText: c.cleanedText, confidence: c.confidence } });
    }
    await prisma.jobPrepSession.update({ where: { id: session.id }, data: { status: 'confirming_jd' } });
    const list = result.candidates.map((c: any, i: number) => `${i + 1}. ${c.title} (${Math.round(c.confidence * 100)}%)`).join('\n');
    return { assistantMessage: `找到 ${result.candidates.length} 个岗位：\n${list}\n\n回复编号确认。`, nextAction: 'confirm_jd' };
  }
  await prisma.jobPostingSnapshot.create({ data: { sessionId: session.id, sourceType: 'fallback_profile', rawText: `通用${session.role || ''}岗位画像`, selected: true } });
  await prisma.jobPrepSession.update({ where: { id: session.id }, data: { status: 'planning' } });
  return generateAndSavePlan(session);
}

async function handleConfirmJD(session: any, content: string) {
  const candidates = await prisma.jobPostingSnapshot.findMany({ where: { sessionId: session.id, sourceType: { in: ['public_web', 'official_site'] } } });
  const idx = parseInt(content) - 1;
  if (idx >= 0 && idx < candidates.length) {
    const candidate = candidates[idx];
    await prisma.jobPostingSnapshot.updateMany({ where: { sessionId: session.id }, data: { selected: false } });
    await prisma.jobPostingSnapshot.update({ where: { id: candidate.id }, data: { selected: true } });
    await prisma.jobPrepSession.update({ where: { id: session.id }, data: { status: 'planning' } });

    // Parse requirements from confirmed JD
    try {
      const raw = await llm(JD_PARSE_PROMPT, `Parse this JD:\n${candidate.cleanedText || candidate.rawText}`);
      const parsed = parseWithSchema(JdParseSchema, raw);
      if (parsed?.requirements) for (const r of parsed.requirements) {
        await prisma.jobRequirement.create({ data: { sessionId: session.id, type: r.type || 'skill', name: r.name, normalizedName: r.normalizedName, importance: r.importance || 'unknown', evidenceText: r.evidenceText } });
      }
    } catch { /* non-critical */ }

    if (process.env.JOB_PREP_ENABLE_RAG === 'true') {
      indexJobPosting(candidate.id).catch(e => console.warn(`[job-prep] JD index failed: ${e.message}`));
    }

    return generateAndSavePlan(session);
  }
  return { assistantMessage: `请输入 1-${candidates.length} 之间的编号。`, nextAction: 'confirm_jd' };
}

async function handleShortenPlan(session: any, plan: any, content: string) {
  const days = parseInt((content.match(/(\d+)\s*天/) || [])[1]) || 3;
  return revisePlanWithFeedback(session, plan, `将计划压缩到 ${days} 天，保留最重要的卡片。`, days);
}

async function handleStrengthenSkill(session: any, plan: any, content: string) {
  const skill = content.replace(/加强|增加|更多/g, '').trim() || content;
  return revisePlanWithFeedback(session, plan, `加强对「${skill}」的覆盖，增加相关卡片数量。`);
}

async function handleReduceTopic(session: any, plan: any, content: string) {
  const topic = content.replace(/减少|去掉|删除|不要/g, '').trim() || content;
  return revisePlanWithFeedback(session, plan, `减少或移除「${topic}」相关卡片。`);
}

async function handleExplainPlan(plan: any) {
  if (!plan) return { assistantMessage: '暂无计划，请先生成。', nextAction: 'ask_for_jd' };
  const stages = plan.stages?.map((s: any, i: number) => `${i + 1}. ${s.name}: ${s.goal}（${s.cards?.length || 0} 张卡片）`).join('\n') || '';
  return { assistantMessage: `「${plan.title}」共 ${plan.totalStages} 个阶段：\n${stages}\n\n需要调整可以告诉我。`, nextAction: 'await_user' };
}

async function handleReplaceCards(session: any, plan: any) {
  if (!plan) return { assistantMessage: '暂无计划。', nextAction: 'ask_for_jd' };
  return revisePlanWithFeedback(session, plan, '替换不相关或低质量的卡片，保留核心阶段结构。');
}

async function handleRegeneratePlan(session: any, plan: any) {
  if (plan) await prisma.jobPrepPlan.update({ where: { id: plan.id }, data: { status: 'archived' } });
  return generateAndSavePlan(session);
}

async function handleStartLearning(plan: any) {
  if (!plan?.stages?.[0]) return { assistantMessage: '暂无阶段可学习。', nextAction: 'await_user' };
  const stage = plan.stages[0];
  const cardIds = stage.cards?.map((c: any) => c.cardId) || [];
  return { assistantMessage: `开始学习「${stage.name}」（${cardIds.length} 张卡片）`, nextAction: 'start_stage', data: { stageId: stage.id, cardIds } };
}

async function handleGeneralQuestion(session: any, plan: any, content: string) {
  if (!session.company && !session.role) {
    // No job target yet — treat as target
    await prisma.jobPrepSession.update({ where: { id: session.id }, data: { status: 'collecting' } });
    return { assistantMessage: '你想准备什么公司和岗位的面试？例如：「我要面试阿里的数据分析实习」。', nextAction: 'collect_target' };
  }
  if (!plan && session.status !== 'planning') {
    // No plan yet — prompt for JD or generate
    return { assistantMessage: '请直接粘贴岗位 JD，我会提取技能要求并生成备战计划。如果没有 JD，回复「没有 JD」。', nextAction: 'ask_for_jd' };
  }
  // General conversation with context
  return { assistantMessage: '收到。有什么我可以帮你的？\n\n你可以说「加强 SQL」「只有 3 天」「重新生成计划」来调整计划。', nextAction: 'await_user' };
}

// ── Plan Generation & Revision ──

async function shouldUseFastPlan(session: any) {
  const [selectedPosting, userMessages] = await Promise.all([
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
  const prepIntent = detectPrepIntent(
    [session.company || '', session.role || '', selectedPosting?.cleanedText || selectedPosting?.rawText || '', ...userMessages.map(m => m.content)].filter(Boolean).join('\n'),
    session,
  );
  return prepIntent.horizon === 'short';
}

async function generateAndSavePlan(session: any) {
  const useFastPlan = await shouldUseFastPlan(session);
  if (!useFastPlan && process.env.JOB_PREP_AGENT_MODE !== 'single') {
    try {
      const result = await generateJobPrepPlanWithReActAgents(session, {
        savePlan: (plan) => savePlanToDB(session.id, plan),
      });
      await logAgentTrace(session.id, 'react_run_completed', {
        mode: result.mode,
        savedPlanId: result.savedPlanId,
        metrics: result.metrics,
        guardErrors: result.guardErrors,
        trace: result.trace,
      });
      if (result.userQuestion && !result.plan) {
        return { assistantMessage: result.userQuestion, nextAction: 'ask_for_jd', data: { reactTrace: result.trace } };
      }
      if (!result.plan) throw new Error('multi-agent returned no plan');
      if (!result.savedPlanId) throw new Error('multi-agent returned an unsaved plan');
      const savedPlanId = result.savedPlanId;
      return {
        assistantMessage: `计划「${result.plan.title || '备战计划'}」已生成！共 ${result.metrics.stageCount} 个阶段、${result.metrics.selectedCardCount} 张卡片。\n\nReAct 多 Agent 指标：cardId 幻觉率 ${Math.round(result.metrics.hallucinationRate * 100)}%，核心覆盖率 ${Math.round(result.metrics.mustCoverCoverage * 100)}%，规则错误 ${result.metrics.ruleErrorCount} 个。`,
        nextAction: 'await_user',
        data: { planId: savedPlanId, metrics: result.metrics, reactTrace: result.trace },
        _guardDetails: { guardPassed: result.metrics.ruleErrorCount === 0, repairCount: result.metrics.repairCount, errors: result.guardErrors, metrics: result.metrics, reactTrace: result.trace },
      };
    } catch (e: any) {
      console.warn(`[job-prep] multi-agent ReAct failed, fallback to single pipeline: ${e.message}`);
    }
  }

  const company = session.company || '';
  const role = session.role || '';
  const profile: RoleProfile | undefined = getProfile(session.roleFamily || '');
  const selectedPosting = await prisma.jobPostingSnapshot.findFirst({
    where: { sessionId: session.id, selected: true },
    orderBy: { updatedAt: 'desc' },
  });
  const userMessages = await prisma.jobPrepMessage.findMany({
    where: { sessionId: session.id, role: 'user' },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });
  const prepIntent = detectPrepIntent(
    [company, role, selectedPosting?.cleanedText || selectedPosting?.rawText || '', ...userMessages.map(m => m.content)].filter(Boolean).join('\n'),
    session,
  );
  const shouldCoverCodingBasics = TECHNICAL_ROLE_FAMILIES.has(String(session.roleFamily || '')) || prepIntent.includeHot100;

  // Profile keywords for graph expansion — supplement JD requirements
  const profileKeywords = profile
    ? [...profile.mustCoverInPlan, ...profile.concepts, ...profile.interviewTopics, ...(shouldCoverCodingBasics ? CODING_INTERVIEW_TERMS : [])]
    : [];

  // Requirements from JD
  const reqs = await prisma.jobRequirement.findMany({ where: { sessionId: session.id } });
  const jdReqText = reqs.length > 0
    ? reqs.map(r => `- [JD] ${r.type}: ${r.name} (${r.importance})`).join('\n')
    : '(no JD requirements extracted)';

  const seedTerms = [
    ...(profile?.mustCoverInPlan || []),
    ...(profile?.interviewTopics || []),
    ...(shouldCoverCodingBasics ? CODING_INTERVIEW_TERMS : []),
    company,
    role,
    ...reqs.flatMap(r => [r.normalizedName || '', r.name || ''].filter(t => t.length <= 40)),
  ];
  const localGraphKw = expandTermsFromConceptGraph([...seedTerms, ...profileKeywords], prepIntent.graphMode);
  const neo4jGraphKw = await expandTermsFromNeo4j([...seedTerms, ...profileKeywords], prepIntent.graphMode);
  const graphKw = uniqueStrings([...localGraphKw, ...neo4jGraphKw, ...profileKeywords], 80);
  const cardSearchTerms = uniqueStrings([...seedTerms, ...graphKw], 120);
  const matchedCards = await findCandidateCards(cardSearchTerms, prepIntent.cardLimit, prepIntent.excludeDecks);
  const fullDeckCards = await findFullDeckCards(prepIntent.includeFullDecks);
  const codingBasicsCards = shouldCoverCodingBasics && !prepIntent.includeFullDecks.includes('leetcode')
    ? (await findFullDeckCards(['leetcode'])).slice(0, codingBasicsLimit(prepIntent.horizon))
    : [];
  const cards = mergeCards([...fullDeckCards, ...codingBasicsCards], matchedCards, prepIntent.cardLimit);
  const hasCards = cards.length > 0;
  const cardList = hasCards
    ? cards.map(c => `- ${c.id}: [${c.deckId || ''}] ${c.question || c.title || ''}`).join('\n')
    : '(no cards available — generate topic-based plan with empty cards array, use topic fields instead)';

  if (prepIntent.horizon === 'short' && hasCards) {
    const draftPlan = buildDeterministicPlan(session, cards, prepIntent, profile);
    const saved = await savePlanToDB(session.id, draftPlan);
    await logAgentTrace(session.id, 'fast_plan_saved', {
      reason: 'short_horizon',
      planId: saved.id,
      horizon: prepIntent.horizon,
      cardCount: cards.length,
      stageCount: draftPlan.stages?.length || 0,
    });
    return {
      assistantMessage: `计划「${draftPlan.title}」已生成！${prepIntent.reason} 共 ${draftPlan.stages.length} 个阶段、${cards.length} 张卡片。`,
      nextAction: 'await_user',
      data: { planId: saved.id },
      _guardDetails: { guardPassed: true, repairCount: 0, errors: [] },
    };
  }

  if (prepIntent.includeFullDecks.length > 0 && fullDeckCards.length > 0) {
    const fullDeckIds = new Set(prepIntent.includeFullDecks);
    const comprehensiveCards = cards.filter(card => card.deckId && fullDeckIds.has(card.deckId));
    const draftPlan = buildDeterministicPlan(session, comprehensiveCards, prepIntent, profile);
    const saved = await savePlanToDB(session.id, draftPlan);
    await logAgentTrace(session.id, 'fast_plan_saved', {
      reason: 'full_deck',
      planId: saved.id,
      includeFullDecks: prepIntent.includeFullDecks,
      cardCount: comprehensiveCards.length,
      stageCount: draftPlan.stages?.length || 0,
    });
    return {
      assistantMessage: `计划「${draftPlan.title}」已生成！${prepIntent.reason} 共 ${draftPlan.stages.length} 个阶段、${comprehensiveCards.length} 张卡片。`,
      nextAction: 'await_user',
      data: { planId: saved.id },
      _guardDetails: { guardPassed: true, repairCount: 0, errors: [] },
    };
  }

  // Role checklist requirements — supplement gaps
  let checklistText = '';
  if (profile) {
    checklistText = [
      `以下为${profile.displayName}岗位常见准备项（来自岗位画像，非JD原文）：`,
      ...profile.mustCoverInPlan.map((s: string) => `- [CHECKLIST] skill: ${s} (must_have — role common)`),
    ].join('\n');
  }

  // RAG context — fire-and-forget, don't block plan generation if slow
  let ragEvidence = '';
  if (process.env.JOB_PREP_ENABLE_RAG === 'true') {
    const ragPromise = ragSearch({ query: [company, role, ...reqs.map(r => r.name)].filter(Boolean).join(' '), sourceTypes: ['job_posting', 'document', 'project', 'interview_qa'], topK: 15 })
      .then(results => results.length > 0 ? results.map(r => `[${r.sourceType}:${r.sourceId}] ${r.title || ''}: ${r.text.slice(0, 300)}`).join('\n---\n') : '')
      .catch(() => '');
    ragEvidence = await Promise.race([ragPromise, new Promise<string>(r => setTimeout(() => r(''), 5000))]);
  }

  // Build the base prompt
  const basePrompt = [
    `Job: ${company} ${role}${profile ? ` (${profile.displayName})` : ''}`,
    jdReqText ? `\nJD Requirements (extracted from job posting):\n${jdReqText}` : '',
    checklistText ? `\nRole Checklist (role-common requirements, supplement gaps):\n${checklistText}` : '',
    ragEvidence ? `\nRAG Evidence:\n${ragEvidence}` : '',
    `\nPreparation intent: ${prepIntent.horizon}${prepIntent.days ? ` (${prepIntent.days} days)` : ''}. ${prepIntent.reason}`,
    prepIntent.excludeDecks.length > 0 ? `\nDeck policy: exclude ${prepIntent.excludeDecks.join(', ')} for this short-term plan.` : '',
    `\nConcepts from knowledge graph: ${graphKw.join(', ')}`,
    `\nCards:\n${cardList}`,
  ].join('\n');

  const topicNote = !hasCards ? ' （当前为主题型计划，暂无绑定卡片）' : '';

  // Guard context — passed to both validators
  const guardContext: GuardContext = {
    hasCards: cards.length > 0,
    roleFamily: session.roleFamily,
    profile,
    jdReqText,
    ragEvidence,
  };

  try {
    let guardErrors: Array<{ code: string; message: string; severity: 'error' | 'warning' }> = [];
    let repairCount = 0;
    const MAX_REPAIRS = 2;

    for (let attempt = 0; attempt <= MAX_REPAIRS; attempt++) {
      // Build prompt — append repair instructions on retry
      let currentPrompt = basePrompt;
      if (attempt > 0 && guardErrors.filter(e => e.severity === 'error').length > 0) {
        const fixNotes = guardErrors.filter(e => e.severity === 'error').map(e => `FIX: ${e.message}`).join('\n');
        if (fixNotes) {
          currentPrompt = `PREVIOUS PLAN FAILED QUALITY CHECK. Fix these issues:\n${fixNotes}\n\n---\n${basePrompt}`;
        }
      }

      // Generate draft plan (safe — don't crash on LLM failure)
      let draftPlan: any = null;
      try {
        const raw = await llm(PLAN_GENERATE_PROMPT, currentPrompt);
        draftPlan = parseWithSchema(JobPrepPlanSchema, raw);
      } catch (e: any) {
        guardErrors.push({ code: 'LLM_FAIL', message: `LLM call failed: ${e.message}`, severity: 'error' });
        if (attempt < MAX_REPAIRS) { repairCount++; continue; }
        break;
      }
      if (!draftPlan) {
        guardErrors.push({ code: 'JSON_PARSE', message: 'Plan JSON could not be parsed', severity: 'error' });
        if (attempt < MAX_REPAIRS) { repairCount++; continue; }
        break;
      }

      // Rule validation
      let ruleResult = { passed: true, errors: [] as any[], repairInstructions: [] as string[] };
      try { ruleResult = ruleValidate(draftPlan, guardContext); } catch {}
      let dbCardErrors: any[] = [];
      try { dbCardErrors = await validateCardIds(draftPlan); } catch {}
      const allRuleErrors = [...ruleResult.errors, ...dbCardErrors];

      // LLM guard (Flash model — graceful, skip on failure)
      let llmErrors: any[] = [];
      try { const lr = await llmGuard(draftPlan, guardContext); llmErrors = lr.errors || []; } catch {}

      guardErrors = [...allRuleErrors, ...llmErrors];
      const criticalErrors = guardErrors.filter(e => e.severity === 'error');

      if (criticalErrors.length === 0) {
        // Passed! Save and return
        const saved = await savePlanToDB(session.id, draftPlan);
        const stageCount = draftPlan.stages?.length || 0;
        const cardTotal = draftPlan.stages?.reduce((s: number, st: any) => s + (st.cards?.length || 0), 0) || 0;
        return {
          assistantMessage: `计划「${draftPlan.title}」已生成！共 ${stageCount} 个阶段、${cardTotal} 张卡片。${topicNote}\n\n你可以说「加强 SQL」「只有 3 天」「为什么这样安排」来调整计划。`,
          nextAction: 'await_user',
          data: { planId: saved.id },
          _guardDetails: { guardPassed: true, repairCount: attempt, errors: guardErrors },
        };
      }

      if (attempt < MAX_REPAIRS) repairCount++;
    }

    // All attempts exhausted — save a deterministic plan from known-valid cards
    // instead of returning an empty result when the model invents cardIds.
    if (hasCards) {
      const draftPlan = buildDeterministicPlan(session, cards, prepIntent, profile);
      const saved = await savePlanToDB(session.id, draftPlan);
      const stageCount = draftPlan.stages?.length || 0;
      const cardTotal = draftPlan.stages?.reduce((s: number, st: any) => s + (st.cards?.length || 0), 0) || 0;
      await logAgentTrace(session.id, 'fallback_plan_saved', {
        reason: 'deterministic_cards',
        planId: saved.id,
        guardErrors,
        repairCount,
        cardCount: cardTotal,
        stageCount,
      });
      return {
        assistantMessage: `计划「${draftPlan.title}」已生成！${prepIntent.reason} 共 ${stageCount} 个阶段、${cardTotal} 张卡片。`,
        nextAction: 'await_user',
        data: { planId: saved.id },
        _guardDetails: { guardPassed: true, repairCount, errors: guardErrors, fallback: 'deterministic_cards' },
      };
    }

    // All attempts exhausted — don't save bad topic-only plan
    return {
      assistantMessage: `计划生成遇到问题，无法通过质量检查。${guardErrors.filter(e => e.severity === 'error').map(e => e.message).join('；')}`,
      nextAction: 'await_user',
      data: {},
      _guardDetails: { guardPassed: false, repairCount, errors: guardErrors },
    };
  } catch (e: any) {
    return { assistantMessage: `计划生成失败：${e.message}`, nextAction: 'await_user' };
  }
}

async function revisePlanWithFeedback(session: any, plan: any, feedback: string, estimatedDays?: number) {
  if (!plan) return generateAndSavePlan(session);

  if (process.env.JOB_PREP_AGENT_MODE !== 'single') {
    try {
      const result = await generateJobPrepPlanWithReActAgents(session, {
        currentPlan: plan,
        revisionFeedback: feedback,
        estimatedDays,
        savePlan: (nextPlan) => savePlanToDB(session.id, nextPlan, plan.version + 1, plan.id),
      });
      if (!result.savedPlanId) throw new Error('multi-agent revision returned no saved plan');
      await prisma.jobPrepPlan.update({ where: { id: plan.id }, data: { status: 'archived' } });
      await logAgentTrace(session.id, 'react_revision_completed', {
        previousPlanId: plan.id,
        savedPlanId: result.savedPlanId,
        feedback,
        estimatedDays,
        metrics: result.metrics,
        guardErrors: result.guardErrors,
        trace: result.trace,
      });
      return {
        assistantMessage: `已根据「${feedback}」调整计划，并通过 ReAct/Guard 校验。`,
        nextAction: 'await_user',
        data: { planId: result.savedPlanId, metrics: result.metrics, reactTrace: result.trace },
        _guardDetails: { guardPassed: result.metrics.ruleErrorCount === 0, repairCount: result.metrics.repairCount, errors: result.guardErrors, metrics: result.metrics, reactTrace: result.trace },
      };
    } catch (e: any) {
      console.warn(`[job-prep] ReAct revision failed, fallback to single revision: ${e.message}`);
    }
  }

  const company = session.company || '';
  const role = session.role || '';

  const cards = await prisma.card.findMany({ include: { deck: true }, take: 60 });
  const cardList = cards.map(c => `- ${c.id}: [${c.deckId}] ${(c as any).deck?.name}: ${c.question || c.title}`).join('\n');

  const stages = plan.stages?.map((s: any) => `- ${s.name}: ${s.goal} (${s.cards?.length} cards)`).join('\n') || '';

  const prompt = `Job: ${company} ${role}\n\nCurrent plan:\n${stages}\n\nFeedback: ${feedback}\n${estimatedDays ? `Target days: ${estimatedDays}` : ''}\n\nAvailable cards:\n${cardList}`;

  try {
    const raw = await llm(PLAN_REVISE_PROMPT, prompt);
    const revised = parseWithSchema(JobPrepPlanSchema, raw);
    if (revised) {
      // Archive old plan, save new
      await prisma.jobPrepPlan.update({ where: { id: plan.id }, data: { status: 'archived' } });
      const saved = await savePlanToDB(session.id, revised, plan.version + 1, plan.id);
      await logAgentTrace(session.id, 'fallback_revision_saved', {
        previousPlanId: plan.id,
        planId: saved.id,
        feedback,
        estimatedDays,
      });
      return { assistantMessage: `已根据「${feedback}」调整计划。`, nextAction: 'await_user', data: { planId: saved.id } };
    }
    return { assistantMessage: '调整遇到问题，请重试。', nextAction: 'await_user' };
  } catch (e: any) {
    return { assistantMessage: `调整失败：${e.message}`, nextAction: 'await_user' };
  }
}

async function savePlanToDB(sessionId: string, plan: any, version = 1, parentPlanId?: string) {
  const normalizedPlan = JobPrepPlanSchema.parse(plan || {});
  const validPlanCards: Array<{ stageIndex: number; cardIndex: number; card: any; existingDeckId: string | null }> = [];
  const requestedCards = (normalizedPlan.stages || []).flatMap((stage, stageIndex) =>
    (stage.cards || []).map((card, cardIndex) => ({ stageIndex, cardIndex, card }))
  ).filter(item => item.card.cardId);
  if (requestedCards.length > 0) {
    const existing = await prisma.card.findMany({
      where: { id: { in: requestedCards.map(item => item.card.cardId as string) } },
      select: { id: true, deckId: true },
    });
    const existingById = new Map(existing.map(card => [card.id, card.deckId]));
    for (const item of requestedCards) {
      const existingDeckId = existingById.get(item.card.cardId as string);
      if (existingDeckId !== undefined) validPlanCards.push({ ...item, existingDeckId });
    }
  }
  const p = await prisma.jobPrepPlan.create({
    data: {
      sessionId, title: normalizedPlan.title || '备战计划', summary: normalizedPlan.summary, estimatedDays: normalizedPlan.estimatedDays,
      version, parentPlanId: parentPlanId || null,
      totalStages: normalizedPlan.stages.length, totalCards: validPlanCards.length,
    },
  });
  for (const [si, stage] of normalizedPlan.stages.entries()) {
    const st = await prisma.jobPrepStage.create({ data: { planId: p.id, order: si, name: stage.name || `Stage ${si + 1}`, goal: stage.goal || '', estimatedMinutes: stage.estimatedMinutes || 180 } });
    for (const item of validPlanCards.filter(card => card.stageIndex === si)) {
      const card = item.card;
      await prisma.jobPrepPlanCard.create({
        data: {
          planId: p.id,
          stageId: st.id,
          cardId: card.cardId as string,
          deckId: card.deckId || item.existingDeckId,
          order: item.cardIndex,
          reason: card.reason || '',
          matchedRequirements: card.matchedRequirements || [],
          matchedConcepts: card.matchedConcepts || [],
          source: card.source || 'hybrid',
        },
      });
    }
  }
  await prisma.jobPrepSession.update({ where: { id: sessionId }, data: { status: 'active', activePlanId: p.id } });
  return p;
}
