import prisma from '../db/prisma';
import { handleJobPrepMessage } from '../services/job-prep/job-prep-conversation';
import { readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { OpenAIChatProvider, setLLMProvider } from '../services/llm-provider';

type Mode = 'single' | 'multi';

interface EvalCase {
  id: string;
  target: string;
  jd: string;
  expectedDeck?: string;
  expectedDeckCount?: number;
  forbiddenDeck?: string;
}

interface CaseMetrics {
  caseId: string;
  mode: Mode;
  ok: boolean;
  totalCards: number;
  stageCount: number;
  fakeCardIds: number;
  hallucinationRate: number;
  expectedDeckRecall: number | null;
  forbiddenDeckCount: number;
  latencyMs: number;
  ruleErrors: number;
  assistantMessage: string;
}

const CASES: EvalCase[] = [
  {
    id: 'short-algo-no-hot100',
    target: '腾讯算法工程师',
    jd: `3. 腾讯 — 算法工程师 (algorithm)
岗位: 腾讯微信算法工程师
职位描述: 负责微信搜一搜、视频号推荐等核心场景的算法研发。设计和优化排序算法、召回策略，通过深度学习和大规模机器学习提升用户体验和业务指标。
职位要求: 扎实的数据结构和算法基础，精通C++/Python，熟悉常见排序算法、图算法、动态规划。有搜索/推荐/广告领域经验优先。ACM/ICPC获奖者优先。
我过两天就要面试，短期冲刺，不安排 Hot100。`,
    forbiddenDeck: 'leetcode',
  },
  {
    id: 'long-algo-hot100',
    target: '长期准备腾讯算法工程师',
    jd: `岗位: 腾讯微信算法工程师
职位描述: 负责搜索推荐排序算法研发。
职位要求: 扎实的数据结构和算法基础，熟悉动态规划、图算法、排序、递归、C++/Python。
我要长期系统准备，必须安排所有 Hot100 / LeetCode 卡片。`,
    expectedDeck: 'leetcode',
    expectedDeckCount: 100,
  },
  {
    id: 'long-ml-full-deck',
    target: '长期准备机器学习工程师',
    jd: `岗位: 机器学习工程师
职位描述: 长期系统准备机器学习面试，需要把机器学习知识图谱扩展出来，并把所有机器学习卡片都安排进计划。
职位要求: 熟悉监督学习、无监督学习、特征工程、模型评估、深度学习、推荐系统、NLP、CV、模型部署。`,
    expectedDeck: 'machine-learning',
    expectedDeckCount: 189,
  },
];

function unquote(value: string) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadEnvFile() {
  const dir = dirname(fileURLToPath(import.meta.url));
  const path = `${dir}/../../.env`;
  try {
    const content = readFileSync(path, 'utf-8');
    for (const line of content.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq < 0) continue;
      const key = t.slice(0, eq).trim();
      const value = unquote(t.slice(eq + 1));
      if (!process.env[key]) process.env[key] = value;
    }
  } catch { /* optional */ }
}

function initLLMForEval() {
  loadEnvFile();
  const baseUrl = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || 'deepseek-chat';
  if (!baseUrl || !apiKey) {
    console.warn('[job-prep-agent-ab-test] LLM not configured; LLM-dependent cases will use failure/fallback paths.');
    return;
  }
  setLLMProvider(new OpenAIChatProvider(baseUrl, apiKey, model));
}

async function createSession(input: string) {
  const session = await prisma.jobPrepSession.create({
    data: { role: input, status: 'collecting' },
  });
  return session.id;
}

async function summarizePlan(sessionId: string, expectedDeck?: string, expectedDeckCount?: number, forbiddenDeck?: string) {
  const session = await prisma.jobPrepSession.findUnique({
    where: { id: sessionId },
    include: {
      plans: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { cards: true, stages: true },
      },
    },
  });
  const plan = session?.plans?.[0];
  const cards = plan?.cards || [];
  const ids = cards.map(c => c.cardId).filter(Boolean);
  const existing = ids.length
    ? await prisma.card.findMany({ where: { id: { in: ids } }, select: { id: true } })
    : [];
  const existingSet = new Set(existing.map(c => c.id));
  const fakeCardIds = ids.filter(id => !existingSet.has(id)).length;
  const expectedDeckSelected = expectedDeck ? cards.filter(c => c.deckId === expectedDeck).length : 0;
  const forbiddenDeckCount = forbiddenDeck ? cards.filter(c => c.deckId === forbiddenDeck).length : 0;
  return {
    totalCards: cards.length,
    stageCount: plan?.stages?.length || 0,
    fakeCardIds,
    hallucinationRate: ids.length > 0 ? fakeCardIds / ids.length : 0,
    expectedDeckRecall: expectedDeck && expectedDeckCount ? expectedDeckSelected / expectedDeckCount : null,
    forbiddenDeckCount,
  };
}

async function runCase(mode: Mode, testCase: EvalCase): Promise<CaseMetrics> {
  const previous = process.env.JOB_PREP_AGENT_MODE;
  process.env.JOB_PREP_AGENT_MODE = mode === 'single' ? 'single' : 'multi';
  const sessionId = await createSession(testCase.target);
  const started = Date.now();
  try {
    const response = await handleJobPrepMessage(sessionId, testCase.jd);
    const summary = await summarizePlan(sessionId, testCase.expectedDeck, testCase.expectedDeckCount, testCase.forbiddenDeck);
    const guard = (response as any)._guardDetails || {};
    return {
      caseId: testCase.id,
      mode,
      ok: summary.fakeCardIds === 0 && summary.forbiddenDeckCount === 0
        && (summary.expectedDeckRecall === null || summary.expectedDeckRecall >= 0.99),
      ...summary,
      latencyMs: Date.now() - started,
      ruleErrors: (guard.errors || []).filter((e: any) => e.severity === 'error').length,
      assistantMessage: response.assistantMessage || '',
    };
  } finally {
    await prisma.jobPrepSession.deleteMany({ where: { id: sessionId } });
    if (previous === undefined) delete process.env.JOB_PREP_AGENT_MODE;
    else process.env.JOB_PREP_AGENT_MODE = previous;
  }
}

function aggregate(rows: CaseMetrics[]) {
  const avg = (values: number[]) => values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
  return {
    cases: rows.length,
    passRate: rows.filter(r => r.ok).length / Math.max(1, rows.length),
    avgHallucinationRate: avg(rows.map(r => r.hallucinationRate)),
    avgFakeCardIds: avg(rows.map(r => r.fakeCardIds)),
    avgExpectedDeckRecall: avg(rows.filter(r => r.expectedDeckRecall !== null).map(r => r.expectedDeckRecall || 0)),
    avgForbiddenDeckCount: avg(rows.map(r => r.forbiddenDeckCount)),
    avgRuleErrors: avg(rows.map(r => r.ruleErrors)),
    avgLatencyMs: avg(rows.map(r => r.latencyMs)),
  };
}

async function main() {
  initLLMForEval();
  const rows: CaseMetrics[] = [];
  for (const testCase of CASES) {
    rows.push(await runCase('single', testCase));
    rows.push(await runCase('multi', testCase));
  }
  const single = rows.filter(r => r.mode === 'single');
  const multi = rows.filter(r => r.mode === 'multi');
  const report = {
    rows,
    summary: {
      single: aggregate(single),
      multi: aggregate(multi),
      delta: {
        hallucinationRate: aggregate(multi).avgHallucinationRate - aggregate(single).avgHallucinationRate,
        fakeCardIds: aggregate(multi).avgFakeCardIds - aggregate(single).avgFakeCardIds,
        expectedDeckRecall: aggregate(multi).avgExpectedDeckRecall - aggregate(single).avgExpectedDeckRecall,
        forbiddenDeckCount: aggregate(multi).avgForbiddenDeckCount - aggregate(single).avgForbiddenDeckCount,
        ruleErrors: aggregate(multi).avgRuleErrors - aggregate(single).avgRuleErrors,
        latencyMs: aggregate(multi).avgLatencyMs - aggregate(single).avgLatencyMs,
      },
    },
  };
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
