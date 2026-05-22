// backend/src/evaluation/metrics.ts — 评测指标计算

import type { TestCase, CaseResult, GroupMetrics, GlobalMetrics } from './types';

interface SearchHit {
  cardId: string;
  title: string;
  deckId: string;
  tags: string[];
  score: number;
  matchType: string;
  reason: string;
  snippet?: string;
}

const TOP15 = 15;
const TOP50 = 50;
const TOP100 = 100;
const P_AT_K = 5;

/** 计算单条用例的评测指标 */
export function computeCaseResult(
  testCase: TestCase,
  hits: SearchHit[],
  responseTimeMs: number,
): CaseResult {
  const rankedIds = hits.map(h => h.cardId);
  const rankedDecks = hits.map(h => h.deckId);
  const totalResults = hits.length;

  // 计算各 primaryId 的排名
  const primaryRanks = testCase.primaryIds.map(id => {
    const idx = rankedIds.indexOf(id);
    return idx >= 0 ? idx + 1 : -1; // 1-indexed rank
  });

  // 计算各 secondaryId 的排名
  const secondaryRanks = testCase.secondaryIds.map(id => {
    const idx = rankedIds.indexOf(id);
    return idx >= 0 ? idx + 1 : -1;
  });

  // 各 Top-K 命中
  const primaryHitTop15 = testCase.primaryIds.filter(id => {
    const idx = rankedIds.indexOf(id);
    return idx >= 0 && idx < TOP15;
  });
  const primaryHitTop50 = testCase.primaryIds.filter(id => {
    const idx = rankedIds.indexOf(id);
    return idx >= 0 && idx < TOP50;
  });
  const primaryHitTop100 = testCase.primaryIds.filter(id => {
    const idx = rankedIds.indexOf(id);
    return idx >= 0 && idx < TOP100;
  });

  // missing = 完全不在 top 100 中
  const primaryMissing = testCase.primaryIds.filter(id => !rankedIds.slice(0, TOP100).includes(id));

  // buried = 在 top 100 但不在 top 15 中
  const primaryBuried = testCase.primaryIds.filter(id => {
    const idx = rankedIds.indexOf(id);
    return idx >= TOP15 && idx < TOP100;
  });

  // Acceptable Deck 命中（top 15 中）
  const acceptableDeckSet = new Set(testCase.acceptableDecks);
  const acceptableDeckHitsTop15 = rankedDecks.slice(0, TOP15).filter(d => acceptableDeckSet.has(d)).length;

  const allPrimaryFound = primaryMissing.length === 0;

  return {
    query: testCase.query,
    group: testCase.group,
    totalResults,
    responseTimeMs,
    rankedIds,
    rankedDecks,
    primaryRanks,
    secondaryRanks,
    primaryHitTop15,
    primaryHitTop50,
    primaryHitTop100,
    primaryMissing,
    primaryBuried,
    acceptableDeckHitsTop15,
    allPrimaryFound,
  };
}

/** 计算 Precision@K */
function precisionAtK(caseResult: CaseResult, k: number): number {
  const topIds = caseResult.rankedIds.slice(0, k);
  const relevant = new Set([...caseResult.primaryHitTop100, ...caseResult.secondaryRanks
    .map((r, i) => r > 0 ? caseResult.rankedIds[r - 1] : null)
    .filter(Boolean) as string[]]);
  let hits = 0;
  for (const id of topIds) {
    if (relevant.has(id)) hits++;
  }
  return k > 0 ? hits / k : 0;
}

/** 计算 MRR (Mean Reciprocal Rank) */
function meanReciprocalRank(caseResult: CaseResult): number {
  const foundRanks = caseResult.primaryRanks.filter(r => r > 0);
  if (foundRanks.length === 0) return 0;
  return 1 / Math.min(...foundRanks);
}

/** 聚合分组指标 */
export function computeGroupMetrics(
  group: string,
  results: CaseResult[],
): GroupMetrics {
  const n = results.length;
  if (n === 0) {
    return {
      group,
      caseCount: 0,
      hitRateTop15: 0,
      hitRateTop50: 0,
      hitRateTop100: 0,
      avgPrecisionAt5: 0,
      avgMRR: 0,
      avgDeckHitRateTop15: 0,
      avgResponseTimeMs: 0,
      totalMissing: 0,
      totalBuried: 0,
      totalPrimaries: 0,
    };
  }

  const hitTop15 = results.filter(r => r.primaryHitTop15.length > 0).length;
  const hitTop50 = results.filter(r => r.primaryHitTop50.length > 0).length;
  const hitTop100 = results.filter(r => r.primaryHitTop100.length > 0).length;

  const sumP5 = results.reduce((s, r) => s + precisionAtK(r, P_AT_K), 0);
  const sumMRR = results.reduce((s, r) => s + meanReciprocalRank(r), 0);
  const sumDeckHit = results.reduce((s, r) => {
    return s + (r.acceptableDeckHitsTop15 / Math.min(TOP15, r.totalResults || TOP15));
  }, 0);
  const sumRT = results.reduce((s, r) => s + r.responseTimeMs, 0);

  const totalMissing = results.reduce((s, r) => s + r.primaryMissing.length, 0);
  const totalBuried = results.reduce((s, r) => s + r.primaryBuried.length, 0);

  // 统计所有 cases 的 primaryIds 总数
  const totalPrimaries = results.reduce((s, r) => {
    // 从原始 test cases 中获取 — 这里从 primaryRanks 推断
    return s + r.primaryRanks.length;
  }, 0);

  return {
    group,
    caseCount: n,
    hitRateTop15: hitTop15 / n,
    hitRateTop50: hitTop50 / n,
    hitRateTop100: hitTop100 / n,
    avgPrecisionAt5: sumP5 / n,
    avgMRR: sumMRR / n,
    avgDeckHitRateTop15: sumDeckHit / n,
    avgResponseTimeMs: Math.round(sumRT / n),
    totalMissing,
    totalBuried,
    totalPrimaries,
  };
}

/** 计算全局指标 */
export function computeGlobalMetrics(
  groupMetricsList: GroupMetrics[],
): GlobalMetrics {
  const n = groupMetricsList.reduce((s, g) => s + g.caseCount, 0);
  if (n === 0) {
    return {
      group: '全部',
      caseCount: 0,
      hitRateTop15: 0,
      hitRateTop50: 0,
      hitRateTop100: 0,
      avgPrecisionAt5: 0,
      avgMRR: 0,
      avgDeckHitRateTop15: 0,
      avgResponseTimeMs: 0,
      totalMissing: 0,
      totalBuried: 0,
      totalPrimaries: 0,
      groups: groupMetricsList,
    };
  }

  const weighted = (key: keyof GroupMetrics) => {
    let sum = 0;
    for (const g of groupMetricsList) {
      sum += (g[key] as number) * g.caseCount;
    }
    return sum / n;
  };

  return {
    group: '全部',
    caseCount: n,
    hitRateTop15: weighted('hitRateTop15'),
    hitRateTop50: weighted('hitRateTop50'),
    hitRateTop100: weighted('hitRateTop100'),
    avgPrecisionAt5: weighted('avgPrecisionAt5'),
    avgMRR: weighted('avgMRR'),
    avgDeckHitRateTop15: weighted('avgDeckHitRateTop15'),
    avgResponseTimeMs: Math.round(weighted('avgResponseTimeMs')),
    totalMissing: groupMetricsList.reduce((s, g) => s + g.totalMissing, 0),
    totalBuried: groupMetricsList.reduce((s, g) => s + g.totalBuried, 0),
    totalPrimaries: groupMetricsList.reduce((s, g) => s + g.totalPrimaries, 0),
    groups: groupMetricsList,
  };
}
