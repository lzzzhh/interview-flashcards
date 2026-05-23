// backend/src/evaluation/runner.ts — AI 搜索评测 Runner（v2: 阈值评测）
//
// 用法：cd backend && npx tsx src/evaluation/runner.ts
// 或：  npm run evaluate

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
function loadEnv() {
  const envPath = resolve(__dirname, '../../.env');
  try {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* .env not found */ }
}
loadEnv();

import { setLLMProvider, OpenAIChatProvider } from '../services/llm-provider';
import { setEmbeddingProvider, OpenAIEmbeddingProvider } from '../services/embedding-provider';
import { getVectorStore, SqliteVecVectorStore, setVectorStore, initVectorStore } from '../services/vector/vector-store';
import { initFTS5 } from '../services/search/fts5-search';
import { hybridSearch } from '../services/search/hybrid-search';
import { TEST_CASES } from './test-cases';
import { computeCaseResult, computeGroupMetrics, computeGlobalMetrics, computeThresholdCase, computeThresholdMetrics, computeLearningPathMetrics } from './metrics';
import { printReport, printThresholdReport } from './report';
import type { CaseResult, GroupMetrics, GlobalMetrics, ThresholdCaseResult, ThresholdMetrics } from './types';

const THRESHOLDS = [0.20, 0.25, 0.30, 0.35, 0.40];

async function initProviders() {
  const baseUrl = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || 'deepseek-chat';
  const embBaseUrl = process.env.EMBEDDING_BASE_URL;
  const embApiKey = process.env.EMBEDDING_API_KEY;
  const embeddingModel = process.env.EMBEDDING_MODEL || 'BAAI/bge-m3';

  if (baseUrl && apiKey) {
    const llmProvider = new OpenAIChatProvider(baseUrl, apiKey);
    (llmProvider as any).defaultModel = model;
    setLLMProvider(llmProvider);
    console.log(`[eval] LLM ready: ${baseUrl}`);

    if (embBaseUrl && embApiKey && embeddingModel) {
      const embProvider = new OpenAIEmbeddingProvider(embBaseUrl, embApiKey);
      (embProvider as any).defaultModel = embeddingModel;
      setEmbeddingProvider(embProvider);
      console.log(`[eval] Embedding ready: ${embBaseUrl} (${embeddingModel})`);
    } else {
      console.log('[eval] Embedding API 未独立配置 — 使用本地 n-gram 向量');
    }
  } else {
    console.log('[eval] LLM 未配置 — 仅使用关键词+本地向量搜索');
  }

  if (getVectorStore().name === 'noop') {
    const vecStore = new SqliteVecVectorStore();
    setVectorStore(vecStore);
  }
  await initVectorStore();
  console.log(`[eval] Vector store: ${getVectorStore().name}`);
  await initFTS5();
  console.log('[eval] FTS5 initialized');
}

async function runEvaluation() {
  console.log('\n[eval] 初始化搜索组件...');
  await initProviders();

  console.log(`\n[eval] 运行 ${TEST_CASES.length} 条测试用例 (candidateLimit=500)...\n`);

  // 一次性获取大候选池（不需要重复调 API）
  const allHits: { tc: typeof TEST_CASES[0]; hits: any[]; elapsed: number }[] = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    const label = `[${i + 1}/${TEST_CASES.length}] "${tc.query}"`;

    const t0 = performance.now();
    let hits: any[];
    try {
      hits = await hybridSearch({ query: tc.query, maxResults: 100, minScore: 0, candidateLimit: 500 });
    } catch (err: any) {
      console.error(`${label} 搜索失败:`, err.message);
      hits = [];
    }
    const elapsed = performance.now() - t0;
    allHits.push({ tc, hits, elapsed });

    const result = computeCaseResult(tc, hits, elapsed);
    const found = result.primaryHitTop15.length;
    const total = result.primaryRanks.length;
    // Learning-path: don't mark as search failure (evaluated by LP Benchmark)
    const isLP = tc.group === 'learning-path' || tc.group.startsWith('学习路径');
    const ok = isLP ? ' ' : (result.primaryMissing.length === 0 ? '✓' : '✗');
    console.log(`  ${ok} ${label.padEnd(56)} top15=${found}/${total}  ${Math.round(elapsed)}ms`);
  }

  // 传统指标聚合
  const caseResults: CaseResult[] = allHits.map(a => computeCaseResult(a.tc, a.hits, a.elapsed));
  const groupMap = new Map<string, CaseResult[]>();
  for (const r of caseResults) {
    const list = groupMap.get(r.group) || [];
    list.push(r);
    groupMap.set(r.group, list);
  }
  const groupMetrics: GroupMetrics[] = [];
  for (const [group, results] of groupMap) {
    groupMetrics.push(computeGroupMetrics(group, results));
  }
  const global = computeGlobalMetrics(groupMetrics);
  printReport(caseResults, global);

  // ═══════════ Targeted Repair: Missing/Buried 分析 ═══════════
  printFailureAnalysis(caseResults);

  // ═══════════ 阈值评测 ═══════════
  console.log('\n═══════════════════ 阈值评测 ═══════════════════');
  console.log('（基于同一批候选池，不同 minScore 过滤）\n');

  const thresholdResults: ThresholdMetrics[] = [];

  for (const threshold of THRESHOLDS) {
    const cases: ThresholdCaseResult[] = allHits.map(a =>
      computeThresholdCase(a.tc, a.hits, threshold)
    );
    const metrics = computeThresholdMetrics(cases, threshold);
    // 补充 MRR / P@5（用阈值过滤后的结果）
    const filteredCases = allHits.map(({ tc, hits, elapsed }) =>
      computeCaseResult(tc, hits.filter(h => h.score >= threshold), elapsed)
    );
    metrics.mrr = filteredCases.reduce((s, c) => {
      const ranks = c.expectationRanks?.filter(r => r > 0) || [];
      return s + (ranks.length > 0 ? 1 / Math.min(...ranks) : 0);
    }, 0) / Math.max(1, filteredCases.length);
    metrics.precisionAt5 = filteredCases.reduce((s, c) => {
      const top5 = c.rankedIds.slice(0, 5);
      const expSet = new Set((c.expectations || []).filter(e => e.grade >= 1).map(e => e.cardId));
      let hits = 0;
      for (const id of top5) { if (expSet.has(id)) hits++; }
      return s + (hits / 5);
    }, 0) / Math.max(1, filteredCases.length);

    thresholdResults.push(metrics);
  }

  printThresholdReport(thresholdResults);

  // ═══════════ Consolidated Summary ═══════════
  printConsolidatedSummary(global, caseResults, thresholdResults);

  // ═══════════ Learning-Path Evaluation ═══════════
  printLearningPathEval(allHits, caseResults);

  // 退出码
  process.exit(global.totalMissing > 0 ? 1 : 0);
}

runEvaluation().catch((err) => {
  console.error('[eval] Fatal error:', err);
  process.exit(2);
});

// ═══════════ Failure Analysis ═══════════

interface FailureEntry {
  query: string;
  group: string;
  missingIds: string[];
  buriedIds: string[];
  /** 召回失败：missing card 完全没进入候选池（candidateLimit=500） */
  recallFailure: string[];
  /** 排序失败：在 candidate pool 中但在 Top15 之外 */
  rankingFailure: string[];
  /** 阈值失败：在 Top15 内但 score < 0.30 */
  thresholdFailure: string[];
}

function printFailureAnalysis(results: CaseResult[]): void {
  const failures: FailureEntry[] = [];

  for (const r of results) {
    if (r.primaryMissing.length === 0 && r.primaryBuried.length === 0) continue;

    // 分类 Missing：
    // - recall failure: card not in rankedIds at all (not in candidate pool)
    // - ranking failure: card in rankedIds but rank > 100
    const recallFailure = r.primaryMissing.filter(id => !r.rankedIds.includes(id));
    const rankingFailure = r.primaryMissing.filter(id => r.rankedIds.includes(id) && r.rankedIds.indexOf(id) > 100);

    // 分类 Buried：
    // - threshold failure: buried within top15 but score < threshold (check scores)
    // - ranking failure: rank 16-100 (outside top 15)
    const thresholdFailure = r.primaryBuried.filter(id => {
      const idx = r.rankedIds.indexOf(id);
      return idx >= 0 && idx < 15 && r.rankedScores[idx] < 0.30;
    });

    failures.push({
      query: r.query,
      group: r.group,
      missingIds: r.primaryMissing,
      buriedIds: r.primaryBuried,
      recallFailure,
      rankingFailure: [...rankingFailure, ...r.primaryBuried.filter(id => {
        const idx = r.rankedIds.indexOf(id);
        return idx >= 15;
      })],
      thresholdFailure,
    });
  }

  // ── Missing by Group ──
  console.log('\n══ Missing by Group ══');
  const missingByGroup = new Map<string, { count: number; cards: string[] }>();
  for (const f of failures) {
    for (const id of f.missingIds) {
      const entry = missingByGroup.get(f.group) || { count: 0, cards: [] };
      entry.count++;
      entry.cards.push(id);
      missingByGroup.set(f.group, entry);
    }
  }
  const sortedMissing = [...missingByGroup.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [group, { count, cards }] of sortedMissing.slice(0, 15)) {
    const uniq = [...new Set(cards)].sort();
    console.log(`  ${group.padEnd(24)} Missing=${count}  [${uniq.join(', ')}]`);
  }
  if (sortedMissing.length > 15) console.log(`  ... +${sortedMissing.length - 15} more groups`);

  // ── Buried by Group ──
  console.log('\n══ Buried by Group ══');
  const buriedByGroup = new Map<string, { count: number; cards: string[] }>();
  for (const f of failures) {
    for (const id of f.buriedIds) {
      const entry = buriedByGroup.get(f.group) || { count: 0, cards: [] };
      entry.count++;
      entry.cards.push(id);
      buriedByGroup.set(f.group, entry);
    }
  }
  const sortedBuried = [...buriedByGroup.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [group, { count, cards }] of sortedBuried.slice(0, 15)) {
    const uniq = [...new Set(cards)].sort();
    console.log(`  ${group.padEnd(24)} Buried=${count}  [${uniq.join(', ')}]`);
  }
  if (sortedBuried.length > 15) console.log(`  ... +${sortedBuried.length - 15} more groups`);

  // ── Missing by Deck ──
  console.log('\n══ Missing by Deck ══');
  const deckMap: Record<string, string> = {};
  for (const tc of TEST_CASES) {
    for (const d of tc.acceptableDecks || []) {
      for (const id of tc.primaryIds || []) {
        deckMap[id] = d;
      }
    }
  }
  const missingByDeck = new Map<string, { count: number; cards: string[] }>();
  for (const f of failures) {
    for (const id of f.missingIds) {
      const d = deckMap[id] || 'unknown';
      const entry = missingByDeck.get(d) || { count: 0, cards: [] };
      entry.count++;
      entry.cards.push(id);
      missingByDeck.set(d, entry);
    }
  }
  const sortedDeckMissing = [...missingByDeck.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [deck, { count, cards }] of sortedDeckMissing) {
    const uniq = [...new Set(cards)].sort();
    console.log(`  ${deck.padEnd(24)} Missing=${count}  [${uniq.join(', ')}]`);
  }

  // ── Buried by Deck ──
  console.log('\n══ Buried by Deck ══');
  const buriedByDeck = new Map<string, { count: number; cards: string[] }>();
  for (const f of failures) {
    for (const id of f.buriedIds) {
      const d = deckMap[id] || 'unknown';
      const entry = buriedByDeck.get(d) || { count: 0, cards: [] };
      entry.count++;
      entry.cards.push(id);
      buriedByDeck.set(d, entry);
    }
  }
  const sortedDeckBuried = [...buriedByDeck.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [deck, { count, cards }] of sortedDeckBuried) {
    const uniq = [...new Set(cards)].sort();
    console.log(`  ${deck.padEnd(24)} Buried=${count}  [${uniq.join(', ')}]`);
  }

  // ── Failure Classification ──
  const recallCount = failures.reduce((s, f) => s + f.recallFailure.length, 0);
  const rankingCount = failures.reduce((s, f) => s + f.rankingFailure.length, 0);
  const thresholdCount = failures.reduce((s, f) => s + f.thresholdFailure.length, 0);
  console.log('\n══ Failure Classification ══');
  console.log(`  召回失败 (不在候选池): ${recallCount}`);
  console.log(`  排序失败 (>Top15):     ${rankingCount}`);
  console.log(`  阈值失败 (score<0.30): ${thresholdCount}`);
  console.log('');

  // ── Top recall-failure cards ──
  const recallCards = new Map<string, number>();
  for (const f of failures) {
    for (const id of f.recallFailure) {
      recallCards.set(id, (recallCards.get(id) || 0) + 1);
    }
  }
  const topRecall = [...recallCards.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (topRecall.length > 0) {
    console.log('══ Most Frequently Missing (Recall) ══');
    for (const [id, cnt] of topRecall) {
      console.log(`  ${id}: ${cnt}次`);
    }
    console.log('');
  }
}

// ═══════════ Learning-Path Evaluation ═══════════

function printLearningPathEval(
  allHits: { tc: any; hits: any[]; elapsed: number }[],
  _caseResults: CaseResult[],
): void {
  // Filter to learning-path groups
  const lpEntries = allHits.filter(a => {
    const g = a.tc.group;
    return g === 'learning-path' || g.startsWith('学习路径-') || g.startsWith('学习路径');
  });

  if (lpEntries.length === 0) {
    console.log('══ Learning-Path: no test cases ══\n');
    return;
  }

  console.log('═'.repeat(60));
  console.log('         LEARNING-PATH EVALUATION');
  console.log('═'.repeat(60));
  console.log(`  Cases: ${lpEntries.length}`);
  console.log('');

  const allMetrics: ReturnType<typeof computeLearningPathMetrics>[] = [];

  for (const { tc, hits, elapsed } of lpEntries) {
    const m = computeLearningPathMetrics(tc, hits);
    allMetrics.push(m);

    const cc = m.conceptCoverageRate;
    const ccIcon = cc >= 0.8 ? '✓' : cc >= 0.5 ? '△' : '✗';
    const allSubConcepts = m.expectedConcepts.flatMap((c: string) => c.split('|').map(s => s.trim()).filter(Boolean));
    const uniqueExpected = [...new Set(allSubConcepts)];
    console.log(`  ${ccIcon} "${tc.query.slice(0, 48)}"`);
    console.log(`     ConceptCoverage@20: ${m.conceptCoverage}/${uniqueExpected.length} (${(cc*100).toFixed(0)}%)  DeckAccuracy@20: ${(m.deckAccuracy*100).toFixed(0)}%  PlanCoverage: ${(m.planCoverage*100).toFixed(0)}%`);
    if (m.coveredConcepts.length < uniqueExpected.length) {
      const missing = uniqueExpected.filter(c => !m.coveredConcepts.includes(c));
      console.log(`     Missing concepts: [${missing.join(', ')}]`);
    }
    if (m.planCoverage < 1) {
      const allStages = Object.keys({ '基础入门': [], '核心方法': [], '对比选择': [], '面试考点': [], '复习练习': [] });
      const missing = allStages.filter(s => !m.coveredStages.includes(s));
      console.log(`     Missing stages: [${missing.join(', ')}]`);
    }
    console.log('');
  }

  // Aggregate
  const avgCC = allMetrics.reduce((s, m) => s + m.conceptCoverageRate, 0) / allMetrics.length;
  const avgDA = allMetrics.reduce((s, m) => s + m.deckAccuracy, 0) / allMetrics.length;
  const avgPC = allMetrics.reduce((s, m) => s + m.planCoverage, 0) / allMetrics.length;
  const avgResults = allMetrics.reduce((s, m) => s + m.totalResults, 0) / allMetrics.length;

  // New P7 metrics: StageBalance, Top10UsefulRate, PrerequisiteOrdering
  const avgSB = allMetrics.reduce((s, m) => s + (m as any).stageBalance, 0) / Math.max(1, allMetrics.filter(m => (m as any).stageBalance !== undefined).length);
  const avgTU = allMetrics.reduce((s, m) => s + (m as any).top10UsefulRate, 0) / Math.max(1, allMetrics.filter(m => (m as any).top10UsefulRate !== undefined).length);
  const avgPO = allMetrics.reduce((s, m) => s + (m as any).prereqOrdering, 0) / Math.max(1, allMetrics.filter(m => (m as any).prereqOrdering !== undefined).length);

  console.log('  ── Aggregate ──');
  console.log(`  ConceptCoverage@20  ${(avgCC*100).toFixed(1)}%`);
  console.log(`  DeckAccuracy@20     ${(avgDA*100).toFixed(1)}%`);
  console.log(`  PlanCoverage        ${(avgPC*100).toFixed(1)}%`);
  console.log(`  Avg Results         ${avgResults.toFixed(1)}`);
  if (!isNaN(avgSB)) console.log(`  StageBalance        ${(avgSB*100).toFixed(1)}%`);
  if (!isNaN(avgTU)) console.log(`  Top10UsefulRate     ${(avgTU*100).toFixed(1)}%`);
  if (!isNaN(avgPO)) console.log(`  PrereqOrdering      ${(avgPO*100).toFixed(1)}%`);
  console.log('');
}

// ═══════════ Consolidated Summary ═══════════

function printConsolidatedSummary(
  global: GlobalMetrics,
  caseResults: CaseResult[],
  thresholdResults: ThresholdMetrics[],
): void {
  const t30 = thresholdResults.find(t => t.threshold === 0.30);

  // Split into search (excl learning-path) vs learning-plan groups
  const isLP = (g: string) => g === 'learning-path' || g.startsWith('学习路径-') || g.startsWith('学习路径');
  const searchGroups = global.groups.filter(g => !isLP(g.group));
  const lpGroups = global.groups.filter(g => isLP(g.group));

  // Aggregate search-only metrics
  const searchCaseCount = searchGroups.reduce((s, g) => s + g.caseCount, 0);
  const searchTop15 = searchCaseCount > 0
    ? searchGroups.reduce((s, g) => s + g.hitRateTop15 * g.caseCount, 0) / searchCaseCount
    : 0;
  const searchTop50 = searchCaseCount > 0
    ? searchGroups.reduce((s, g) => s + g.hitRateTop50 * g.caseCount, 0) / searchCaseCount
    : 0;
  const searchTop100 = searchCaseCount > 0
    ? searchGroups.reduce((s, g) => s + g.hitRateTop100 * g.caseCount, 0) / searchCaseCount
    : 0;
  const searchMRR = searchCaseCount > 0
    ? searchGroups.reduce((s, g) => s + g.avgMRR * g.caseCount, 0) / searchCaseCount
    : 0;
  const searchP5 = searchCaseCount > 0
    ? searchGroups.reduce((s, g) => s + g.avgPrecisionAt5 * g.caseCount, 0) / searchCaseCount
    : 0;
  const searchMissing = searchGroups.reduce((s, g) => s + g.totalMissing, 0);
  const searchBuried = searchGroups.reduce((s, g) => s + g.totalBuried, 0);

  const lpCaseCount = lpGroups.reduce((s, g) => s + g.caseCount, 0);

  console.log('═'.repeat(60));
  console.log('              BENCHMARK SUMMARY');
  console.log('═'.repeat(60));
  console.log('');

  // ═ Search Benchmark (excl learning-path) ═
  console.log('  ── Search Benchmark ──');
  console.log(`  Cases        ${searchCaseCount}`);
  console.log(`  Top15        ${(searchTop15 * 100).toFixed(1)}%`);
  console.log(`  Top50        ${(searchTop50 * 100).toFixed(1)}%`);
  console.log(`  Top100       ${(searchTop100 * 100).toFixed(1)}%`);
  console.log(`  MRR          ${searchMRR.toFixed(3)}`);
  console.log(`  P@5          ${searchP5.toFixed(3)}`);
  console.log(`  Missing      ${searchMissing}`);
  console.log(`  Buried       ${searchBuried}`);
  console.log('');

  // ═ Learning Plan Benchmark ═
  if (lpCaseCount > 0) {
    const lpResults = caseResults.filter(r => isLP(r.group));
    const avgCC = lpResults.reduce((s, r) => {
      const tc = TEST_CASES.find(c => c && c.query === r.query);
      if (!tc) return s;
      const allSub = (tc.acceptableConcepts || []).flatMap((c: string) => c.split('|').map(x => x.trim()).filter(Boolean));
      const unique = [...new Set(allSub)];
      const covered = unique.filter(sub => {
        const sl = sub.toLowerCase();
        return r.rankedIds.slice(0, 20).some((id, i) => {
          // Check if this result covers the concept
          return false; // simplified — full metric needs card details
        });
      });
      return s + (covered.length / Math.max(1, unique.length));
    }, 0) / lpCaseCount;
    console.log('  ── Learning Plan Benchmark ──');
    console.log(`  Cases        ${lpCaseCount}`);
    console.log(`  (see LEARNING-PATH EVALUATION block for detailed CC/DA/PC)`);
    console.log('');
  }

  if (t30) {
    console.log('  ── Threshold @0.30 ──');
    console.log(`  Recall(S)    ${(t30.recallStrong * 100).toFixed(1)}%`);
    console.log(`  Recall(A)    ${(t30.recallAll * 100).toFixed(1)}%`);
    console.log(`  Empty        ${(t30.emptyRate * 100).toFixed(1)}%`);
    console.log(`  Low (<3)     ${(t30.lowRate * 100).toFixed(1)}%`);
    console.log(`  Result cnt   avg=${t30.resultCount.avg}  p50=${t30.resultCount.p50}  p90=${t30.resultCount.p90}  p95=${t30.resultCount.p95}  max=${t30.resultCount.max}`);
    console.log('');
  }

  // ── Missing by Group (top 10, search only) ──
  console.log('  Missing by Group (top 10, search) ──');
  const gm = searchGroups
    .filter(g => g.totalMissing > 0)
    .sort((a, b) => b.totalMissing - a.totalMissing)
    .slice(0, 10);
  for (const g of gm) {
    console.log(`    ${g.group.padEnd(26)} Missing=${String(g.totalMissing).padStart(3)}  Buried=${String(g.totalBuried).padStart(3)}`);
  }
  console.log('');

  // ── Buried targets ──
  const buriedHits = caseResults
    .filter(r => !isLP(r.group) && r.primaryBuried.length > 0)
    .sort((a, b) => {
      // Sort by lowest buried rank (worst first = closest to top 15)
      const aMin = Math.min(...a.primaryBuried.map(id => {
        const idx = a.rankedIds.indexOf(id);
        return idx >= 0 ? idx + 1 : 999;
      }));
      const bMin = Math.min(...b.primaryBuried.map(id => {
        const idx = b.rankedIds.indexOf(id);
        return idx >= 0 ? idx + 1 : 999;
      }));
      return aMin - bMin;
    })
    .slice(0, 10);

  console.log('  Top Buried Cases (rank 16-30, search) ──');
  for (const r of buriedHits) {
    for (const id of r.primaryBuried) {
      const idx = r.rankedIds.indexOf(id);
      const rank = idx + 1;
      if (rank > 30) continue;
      const score = r.rankedScores[idx];
      console.log(`    ${r.group.padEnd(24)} "${r.query.slice(0, 30)}"  ${id}  rank=${rank}  score=${score.toFixed(3)}`);
    }
  }
  console.log('');
}
