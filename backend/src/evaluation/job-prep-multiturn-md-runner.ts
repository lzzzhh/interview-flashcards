import fs from 'fs';
import path from 'path';
import prisma from '../db/prisma';
import { OpenAIChatProvider, setLLMProvider } from '../services/llm-provider';
import { handleJobPrepMessage } from '../services/job-prep/job-prep-conversation';

interface MdCase {
  id: number;
  title: string;
  turns: string[];
}

interface TurnSummary {
  turn: number;
  nextAction: string;
  ms: number;
  assistantPreview: string;
}

interface CaseSummary {
  id: number;
  title: string;
  ok: boolean;
  totalMs: number;
  turns: TurnSummary[];
  plan: {
    title: string | null;
    stages: number;
    cards: number;
    fakeCardIds: number;
    deckCounts: Record<string, number>;
  };
  quality: {
    hardPass: boolean;
    requirementCoverage: number;
    missingRequirements: string[];
    emptyStageCount: number;
    avgCardsPerStage: number;
    horizonFit: number;
    overallScore: number;
  };
  traceCount: number;
  failedActions: string[];
}

function unquote(value: string) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadEnv() {
  for (const file of ['.env', '../.env']) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq < 0) continue;
      const key = t.slice(0, eq).trim();
      const value = unquote(t.slice(eq + 1));
      if (!process.env[key]) process.env[key] = value;
    }
  }
  if (process.env.LLM_BASE_URL && process.env.LLM_API_KEY) {
    setLLMProvider(new OpenAIChatProvider(
      process.env.LLM_BASE_URL,
      process.env.LLM_API_KEY,
      process.env.LLM_MODEL || 'deepseek-chat',
    ));
  }
}

function parseMarkdownCases(markdown: string): MdCase[] {
  const lines = markdown.split(/\r?\n/);
  const cases: MdCase[] = [];
  let current: MdCase | null = null;
  let inTextBlock = false;
  let buffer: string[] = [];

  const flushTurn = () => {
    if (!current || buffer.length === 0) return;
    const text = buffer.join('\n').trim();
    if (text) current.turns.push(text);
    buffer = [];
  };

  for (const line of lines) {
    const header = line.match(/^##\s+(\d+)\.\s+(.+)$/);
    if (!inTextBlock && header) {
      flushTurn();
      current = { id: Number(header[1]), title: header[2].trim(), turns: [] };
      cases.push(current);
      continue;
    }
    if (line.trim() === '```text') {
      inTextBlock = true;
      buffer = [];
      continue;
    }
    if (inTextBlock && line.trim() === '```') {
      inTextBlock = false;
      flushTurn();
      continue;
    }
    if (inTextBlock) buffer.push(line);
  }
  flushTurn();
  return cases.filter(c => c.turns.length > 0);
}

async function summarizePlan(sessionId: string) {
  const session = await prisma.jobPrepSession.findUnique({ where: { id: sessionId } });
  const plan: any = session?.activePlanId
    ? await prisma.jobPrepPlan.findUnique({
      where: { id: session.activePlanId },
      include: { stages: true, cards: true },
    })
    : null;
  const cards = plan?.cards || [];
  const ids = cards.map((card: any) => card.cardId).filter(Boolean);
  const existing = ids.length ? await prisma.card.findMany({ where: { id: { in: ids } }, select: { id: true } }) : [];
  const existingSet = new Set(existing.map(card => card.id));
  const deckCounts: Record<string, number> = {};
  for (const card of cards) deckCounts[card.deckId] = (deckCounts[card.deckId] || 0) + 1;
  return {
    title: plan?.title || null,
    stages: plan?.stages?.length || 0,
    cards: cards.length,
    fakeCardIds: ids.filter((id: string) => !existingSet.has(id)).length,
    deckCounts,
    estimatedDays: plan?.estimatedDays || null,
    stageRows: plan?.stages || [],
    cardRows: cards,
  };
}

async function scorePlanQuality(sessionId: string, plan: Awaited<ReturnType<typeof summarizePlan>>, turns: TurnSummary[]) {
  const requirements = await prisma.jobRequirement.findMany({ where: { sessionId } });
  const requirementNames = [...new Set(requirements
    .map(req => (req.normalizedName || req.name || '').trim())
    .filter(Boolean))]
    .slice(0, 40);
  const planText = [
    plan.title || '',
    ...plan.stageRows.map((stage: any) => `${stage.name || ''} ${stage.goal || ''}`),
    ...plan.cardRows.map((card: any) => `${card.reason || ''} ${card.matchedRequirements || ''} ${card.matchedConcepts || ''}`),
  ].join('\n').toLowerCase();
  const missingRequirements = requirementNames.filter(name => !planText.includes(name.toLowerCase()));
  const requirementCoverage = requirementNames.length === 0
    ? 1
    : (requirementNames.length - missingRequirements.length) / requirementNames.length;
  const emptyStageCount = plan.stageRows.filter((stage: any) => {
    const stageCards = plan.cardRows.filter((card: any) => card.stageId === stage.id);
    return stageCards.length === 0;
  }).length;
  const avgCardsPerStage = plan.stages > 0 ? plan.cards / plan.stages : 0;
  const assistantText = turns.map(turn => turn.assistantPreview).join('\n');
  const allText = `${assistantText}\n${planText}`;
  const wantsShort = /(今天|今晚|明天|后天|过两天|这两天|很急|临时|突击|短期|只有\s*\d+\s*天)/.test(allText);
  const wantsLong = /(长期|系统|全面|完整|全部|所有|hot\s*100|hot100|leetcode|力扣)/i.test(allText);
  const days = Number(plan.estimatedDays || 0);
  const horizonFit = wantsShort
    ? (days > 0 && days <= 5 ? 1 : 0.4)
    : wantsLong
      ? (days >= 14 || plan.cards >= 80 ? 1 : 0.55)
      : 1;
  const densityScore = plan.stages > 0 && plan.cards > 0 && avgCardsPerStage >= 2 ? 1 : 0.5;
  const stageScore = plan.stages >= 2 && emptyStageCount === 0 ? 1 : 0.6;
  const overallScore = Math.round(100 * (
    requirementCoverage * 0.45
    + horizonFit * 0.25
    + densityScore * 0.15
    + stageScore * 0.15
  )) / 100;
  return {
    hardPass: plan.stages > 0 && plan.cards > 0 && plan.fakeCardIds === 0,
    requirementCoverage: Math.round(requirementCoverage * 100) / 100,
    missingRequirements,
    emptyStageCount,
    avgCardsPerStage: Math.round(avgCardsPerStage * 10) / 10,
    horizonFit,
    overallScore,
  };
}

async function summarizeTrace(sessionId: string) {
  const traces = await prisma.jobPrepMessage.findMany({
    where: { sessionId, role: 'tool' },
    select: { toolName: true, toolPayload: true },
  });
  const failedActions: string[] = [];
  for (const trace of traces) {
    const payload: any = trace.toolPayload || {};
    const steps = Array.isArray(payload.trace) ? payload.trace : [];
    for (const step of steps) {
      if (step?.observation?.ok === false) failedActions.push(String(step.action || trace.toolName || 'unknown'));
    }
  }
  return { traceCount: traces.length, failedActions };
}

async function runCase(testCase: MdCase): Promise<CaseSummary> {
  const session = await prisma.jobPrepSession.create({
    data: { role: testCase.turns[0].slice(0, 80), status: 'collecting' },
  });
  const started = Date.now();
  const turns: TurnSummary[] = [];
  try {
    for (let i = 0; i < testCase.turns.length; i++) {
      const turnStarted = Date.now();
      const response = await handleJobPrepMessage(session.id, testCase.turns[i]);
      turns.push({
        turn: i + 1,
        nextAction: String(response.nextAction || ''),
        ms: Date.now() - turnStarted,
        assistantPreview: String(response.assistantMessage || '').slice(0, 160),
      });
    }
    const plan = await summarizePlan(session.id);
    const trace = await summarizeTrace(session.id);
    const quality = await scorePlanQuality(session.id, plan, turns);
    const ok = plan.stages > 0
      && plan.cards > 0
      && plan.fakeCardIds === 0
      && quality.overallScore >= 0.7
      && !turns.some(t => /失败|请求失败|not configured|error/i.test(t.assistantPreview));
    return {
      id: testCase.id,
      title: testCase.title,
      ok,
      totalMs: Date.now() - started,
      turns,
      plan,
      quality,
      ...trace,
    };
  } finally {
    if (process.env.JOB_PREP_EVAL_KEEP_SESSIONS !== 'true') {
      await prisma.jobPrepSession.deleteMany({ where: { id: session.id } });
    }
  }
}

function aggregate(cases: CaseSummary[]) {
  const avg = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / Math.max(1, values.length);
  return {
    cases: cases.length,
    passRate: cases.filter(c => c.ok).length / Math.max(1, cases.length),
    avgTotalMs: Math.round(avg(cases.map(c => c.totalMs))),
    avgCards: Math.round(avg(cases.map(c => c.plan.cards))),
    avgRequirementCoverage: Math.round(avg(cases.map(c => c.quality.requirementCoverage)) * 100) / 100,
    avgOverallScore: Math.round(avg(cases.map(c => c.quality.overallScore)) * 100) / 100,
    fakeCardIds: cases.reduce((sum, c) => sum + c.plan.fakeCardIds, 0),
    failedActionCount: cases.reduce((sum, c) => sum + c.failedActions.length, 0),
  };
}

async function main() {
  loadEnv();
  const mdPath = process.argv[2] || '/Users/zhanhuilin/Downloads/job_prep_agent_multiturn_test_queries.md';
  const limit = Number(process.env.JOB_PREP_EVAL_LIMIT || '0');
  const markdown = fs.readFileSync(path.resolve(mdPath), 'utf8');
  const cases = parseMarkdownCases(markdown).slice(0, limit > 0 ? limit : undefined);
  const summaries: CaseSummary[] = [];
  for (const testCase of cases) {
    const summary = await runCase(testCase);
    summaries.push(summary);
    console.log(JSON.stringify({ event: 'case_done', id: summary.id, ok: summary.ok, totalMs: summary.totalMs, plan: summary.plan }));
  }
  console.log(JSON.stringify({ summary: aggregate(summaries), cases: summaries }, null, 2));
}

main()
  .catch(e => {
    console.error(e.stack || e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
