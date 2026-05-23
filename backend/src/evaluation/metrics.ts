// backend/src/evaluation/metrics.ts — 评测指标计算（v2: 阈值评测）

import type {
  TestCase, CaseResult, GroupMetrics, GlobalMetrics,
  CardExpectation, NormalizedExpectation, RelevanceGrade,
  ThresholdMetrics, ThresholdCaseResult,
} from './types';

// Search hit from backend
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

// ---- 期望归一化 ----

/** 从 primaryIds/secondaryIds/expectations 推导归一化期望 */
export function normalizeExpectations(tc: TestCase): NormalizedExpectation[] {
  // 优先使用 explicit expectations
  if (tc.expectations && tc.expectations.length > 0) {
    return tc.expectations.map(e => ({ cardId: e.cardId, grade: e.grade }));
  }
  // 向后兼容：primaryIds → grade 3，secondaryIds → grade 2
  const map = new Map<string, RelevanceGrade>();
  for (const id of tc.primaryIds || []) map.set(id, 3);
  for (const id of tc.secondaryIds || []) {
    if (!map.has(id)) map.set(id, 2);
  }
  return [...map.entries()].map(([cardId, grade]) => ({ cardId, grade }));
}

// ---- 传统指标（向后兼容） ----

export function computeCaseResult(
  testCase: TestCase,
  hits: SearchHit[],
  responseTimeMs: number,
): CaseResult {
  const expectations = normalizeExpectations(testCase);
  const primaryIds = testCase.primaryIds || expectations.filter(e => e.grade === 3).map(e => e.cardId);
  const secondaryIds = testCase.secondaryIds || expectations.filter(e => e.grade <= 2).map(e => e.cardId);

  const rankedIds = hits.map(h => h.cardId);
  const rankedDecks = hits.map(h => h.deckId);
  const rankedScores = hits.map(h => h.score);
  const totalResults = hits.length;

  const rankOf = (id: string) => { const idx = rankedIds.indexOf(id); return idx >= 0 ? idx + 1 : -1; };

  const primaryRanks = (primaryIds || []).map(rankOf);
  const secondaryRanks = (secondaryIds || []).map(rankOf);
  const expectationRanks = expectations.map(e => rankOf(e.cardId));

  const primaryHitTop15 = (primaryIds || []).filter(id => rankOf(id) > 0 && rankOf(id) <= TOP15);
  const primaryHitTop50 = (primaryIds || []).filter(id => rankOf(id) > 0 && rankOf(id) <= TOP50);
  const primaryHitTop100 = (primaryIds || []).filter(id => rankOf(id) > 0 && rankOf(id) <= TOP100);
  const primaryMissing = (primaryIds || []).filter(id => !rankedIds.slice(0, TOP100).includes(id));
  const primaryBuried = (primaryIds || []).filter(id => { const r = rankOf(id); return r > TOP15 && r <= TOP100; });

  const acceptableDeckSet = new Set(testCase.acceptableDecks);
  const acceptableDeckHitsTop15 = rankedDecks.slice(0, TOP15).filter(d => acceptableDeckSet.has(d)).length;

  return {
    query: testCase.query,
    group: testCase.group,
    totalResults, responseTimeMs,
    rankedIds, rankedDecks, rankedScores,
    primaryRanks, secondaryRanks,
    primaryHitTop15, primaryHitTop50, primaryHitTop100,
    primaryMissing, primaryBuried,
    acceptableDeckHitsTop15,
    allPrimaryFound: primaryMissing.length === 0,
    expectationRanks, expectations,
  };
}

function precisionAtK(caseResult: CaseResult, k: number): number {
  const topIds = caseResult.rankedIds.slice(0, k);
  const relevant = new Set(caseResult.expectations?.filter(e => e.grade >= 1).map(e => e.cardId) || []);
  let hits = 0;
  for (const id of topIds) { if (relevant.has(id)) hits++; }
  return k > 0 ? hits / k : 0;
}

function meanReciprocalRank(caseResult: CaseResult): number {
  const foundRanks = caseResult.expectationRanks?.filter(r => r > 0) || [];
  if (foundRanks.length === 0) return 0;
  return 1 / Math.min(...foundRanks);
}

export function computeGroupMetrics(group: string, results: CaseResult[]): GroupMetrics {
  const n = results.length;
  if (n === 0) return { group, caseCount: 0, hitRateTop15: 0, hitRateTop50: 0, hitRateTop100: 0, avgPrecisionAt5: 0, avgMRR: 0, avgDeckHitRateTop15: 0, avgResponseTimeMs: 0, totalMissing: 0, totalBuried: 0, totalPrimaries: 0 };

  return {
    group, caseCount: n,
    hitRateTop15: results.filter(r => r.primaryHitTop15.length > 0).length / n,
    hitRateTop50: results.filter(r => r.primaryHitTop50.length > 0).length / n,
    hitRateTop100: results.filter(r => r.primaryHitTop100.length > 0).length / n,
    avgPrecisionAt5: results.reduce((s, r) => s + precisionAtK(r, P_AT_K), 0) / n,
    avgMRR: results.reduce((s, r) => s + meanReciprocalRank(r), 0) / n,
    avgDeckHitRateTop15: results.reduce((s, r) => s + (r.acceptableDeckHitsTop15 / Math.min(TOP15, r.totalResults || TOP15)), 0) / n,
    avgResponseTimeMs: Math.round(results.reduce((s, r) => s + r.responseTimeMs, 0) / n),
    totalMissing: results.reduce((s, r) => s + r.primaryMissing.length, 0),
    totalBuried: results.reduce((s, r) => s + r.primaryBuried.length, 0),
    totalPrimaries: results.reduce((s, r) => s + r.primaryRanks.length, 0),
  };
}

export function computeGlobalMetrics(groupMetricsList: GroupMetrics[]): GlobalMetrics {
  const n = groupMetricsList.reduce((s, g) => s + g.caseCount, 0);
  if (n === 0) return { group: '全部', caseCount: 0, hitRateTop15: 0, hitRateTop50: 0, hitRateTop100: 0, avgPrecisionAt5: 0, avgMRR: 0, avgDeckHitRateTop15: 0, avgResponseTimeMs: 0, totalMissing: 0, totalBuried: 0, totalPrimaries: 0, groups: groupMetricsList };

  const weighted = (key: keyof GroupMetrics) => groupMetricsList.reduce((s, g) => s + (g[key] as number) * g.caseCount, 0) / n;

  return {
    group: '全部', caseCount: n,
    hitRateTop15: weighted('hitRateTop15'), hitRateTop50: weighted('hitRateTop50'), hitRateTop100: weighted('hitRateTop100'),
    avgPrecisionAt5: weighted('avgPrecisionAt5'), avgMRR: weighted('avgMRR'),
    avgDeckHitRateTop15: weighted('avgDeckHitRateTop15'),
    avgResponseTimeMs: Math.round(weighted('avgResponseTimeMs')),
    totalMissing: groupMetricsList.reduce((s, g) => s + g.totalMissing, 0),
    totalBuried: groupMetricsList.reduce((s, g) => s + g.totalBuried, 0),
    totalPrimaries: groupMetricsList.reduce((s, g) => s + g.totalPrimaries, 0),
    groups: groupMetricsList,
  };
}

// ---- 阈值评测 ----

/** 计算单条 query 在给定阈值下的评测结果 */
export function computeThresholdCase(
  tc: TestCase,
  hits: SearchHit[],
  threshold: number,
): ThresholdCaseResult {
  const expectations = normalizeExpectations(tc);
  const expectedMap = new Map(expectations.map(e => [e.cardId, e.grade]));
  const strongExpected = expectations.filter(e => e.grade >= 2);
  const allExpected = expectations.filter(e => e.grade >= 1);

  // 阈值过滤
  const filtered = hits.filter(h => h.score >= threshold);

  // 命中和遗漏
  const hits_: ThresholdCaseResult['hits'] = [];
  const seen = new Set<string>();
  for (let i = 0; i < filtered.length; i++) {
    const h = filtered[i];
    const grade = expectedMap.get(h.cardId) || 0;
    hits_.push({ cardId: h.cardId, grade, score: h.score, rank: i + 1 });
    seen.add(h.cardId);
  }

  const missed = expectations
    .filter(e => !seen.has(e.cardId))
    .map(e => ({ cardId: e.cardId, grade: e.grade }));

  const relevantFound = hits_.filter(h => h.grade >= 1).length;
  const strongFound = hits_.filter(h => h.grade >= 2).length;
  const totalStrongExp = strongExpected.length;
  const totalExp = allExpected.length;

  return {
    query: tc.query,
    group: tc.group,
    threshold,
    resultCount: filtered.length,
    relevantFound,
    strongFound,
    totalStrongExpected: totalStrongExp,
    totalExpected: totalExp,
    hits: hits_,
    missed,
    precision: filtered.length > 0 ? relevantFound / filtered.length : 0,
    recallStrong: totalStrongExp > 0 ? strongFound / totalStrongExp : 0,
    recallAll: totalExp > 0 ? relevantFound / totalExp : 0,
  };
}

/** 聚合所有 query 在给定阈值下的全局指标 */
export function computeThresholdMetrics(
  caseResults: ThresholdCaseResult[],
  threshold: number,
): ThresholdMetrics {
  const n = caseResults.length;
  if (n === 0) {
    return {
      threshold, totalCases: 0, totalResults: 0,
      precision: 0, recallStrong: 0, recallAll: 0,
      emptyRate: 0, lowRate: 0,
      resultCount: { avg: 0, p50: 0, p90: 0, p95: 0, max: 0, min: 0 },
      mrr: 0, precisionAt5: 0,
    };
  }

  // Precision / Recall
  const totalResults = caseResults.reduce((s, c) => s + c.resultCount, 0);
  const totalRelevant = caseResults.reduce((s, c) => s + c.relevantFound, 0);
  const totalStrong = caseResults.reduce((s, c) => s + c.strongFound, 0);
  const totalStrongExp = caseResults.reduce((s, c) => s + c.totalStrongExpected, 0);
  const totalExp = caseResults.reduce((s, c) => s + c.totalExpected, 0);

  const precision = totalResults > 0 ? totalRelevant / totalResults : 0;
  const recallStrong = totalStrongExp > 0 ? totalStrong / totalStrongExp : 0;
  const recallAll = totalExp > 0 ? totalRelevant / totalExp : 0;

  // Empty / Low rates
  const emptyCount = caseResults.filter(c => c.resultCount === 0).length;
  const lowCount = caseResults.filter(c => c.resultCount < 3).length;

  // Result count distribution
  const counts = caseResults.map(c => c.resultCount).sort((a, b) => a - b);
  const p = (arr: number[], percentile: number) => {
    const idx = Math.ceil((percentile / 100) * arr.length) - 1;
    return arr[Math.max(0, Math.min(idx, arr.length - 1))];
  };

  return {
    threshold,
    totalCases: n,
    totalResults,
    precision,
    recallStrong,
    recallAll,
    emptyRate: emptyCount / n,
    lowRate: lowCount / n,
    resultCount: {
      avg: Math.round(counts.reduce((s, v) => s + v, 0) / n * 10) / 10,
      p50: p(counts, 50),
      p90: p(counts, 90),
      p95: p(counts, 95),
      max: counts[counts.length - 1] || 0,
      min: counts[0] || 0,
    },
    mrr: 0, // filled by runner
    precisionAt5: 0, // filled by runner
  };
}

// ════════════════════ Learning-Path Metrics ════════════════════

/** 学习阶段关键词 */
const STAGE_KEYWORDS: Record<string, RegExp[]> = {
  '基础入门': [/入门|基础|概述|介绍|什么是|定义|概念|初学|新手|简介|理解/i],
  '核心方法': [/核心|主要|关键|算法|方法|原理|机制|实现|技术|模型|架构/i],
  '对比选择': [/对比|区别|比较|vs|选择|优劣|适用|场景|差异|不同/i],
  '面试考点': [/面试|常见|考点|总结|必考|经典|重点|考察/i],
  '复习练习': [/复习|回顾|刷题|练习|巩固|整理|清单/i],
};

export interface LearningPathMetrics {
  query: string;
  group: string;
  /** Top20 中不重复的核心概念覆盖数 / 期望概念数 */
  conceptCoverage: number;
  conceptCoverageRate: number;
  expectedConcepts: string[];
  coveredConcepts: string[];
  /** Top20 中目标牌组的卡片占比 */
  deckAccuracy: number;
  targetDecks: string[];
  /** 学习阶段覆盖率 */
  planCoverage: number;
  coveredStages: string[];
  /** 总结果数 */
  totalResults: number;
}

/**
 * 计算学习路径专属评测指标。
 * 不再使用 primaryId Top15 作为标准，改用概念覆盖、牌组准确度、阶段覆盖。
 */
export function computeLearningPathMetrics(
  tc: TestCase,
  hits: SearchHit[],
  cardDetails?: Array<{ cardId: string; title: string; titleCn?: string | null; searchKeywords?: string | null; deckId: string }>,
): LearningPathMetrics {
  const top20 = hits.slice(0, 20);
  const expectedConcepts = tc.acceptableConcepts || [];
  const targetDecks = tc.acceptableDecks || [];

  // 1. ConceptCoverage@20
  const top20Text = top20.map(h => {
    const detail = cardDetails?.find(c => c.cardId === h.cardId);
    const text = [
      detail?.title || '',
      detail?.titleCn || '',
      detail?.searchKeywords || '',
      h.title || '',
    ].join(' ').toLowerCase();
    return text;
  });

  const coveredConcepts: string[] = [];
  for (const concept of expectedConcepts) {
    // Split pipe-separated concepts: "推荐|协同过滤" → ["推荐", "协同过滤"]
    const subConcepts = concept.split('|').map(s => s.trim()).filter(Boolean);
    for (const sub of subConcepts) {
      const sl = sub.toLowerCase();
      if (top20Text.some(t => t.includes(sl))) {
        coveredConcepts.push(sub);
      }
    }
  }

  // Total expected = sum of all sub-concepts
  const allSubConcepts = expectedConcepts.flatMap(c => c.split('|').map(s => s.trim()).filter(Boolean));
  const uniqueExpected = [...new Set(allSubConcepts)];

  const conceptCoverage = coveredConcepts.length;
  const conceptCoverageRate = uniqueExpected.length > 0
    ? conceptCoverage / uniqueExpected.length
    : 0;

  // 2. DeckAccuracy@20
  const targetDeckSet = new Set(targetDecks);
  const inTargetDeck = top20.filter(h => targetDeckSet.has(h.deckId)).length;
  const deckAccuracy = top20.length > 0 ? inTargetDeck / top20.length : 0;

  // 3. PlanCoverage: how many learning stages have >=1 result
  const coveredStages: string[] = [];
  for (const [stage, patterns] of Object.entries(STAGE_KEYWORDS)) {
    if (top20Text.some(t => patterns.some(p => p.test(t)))) {
      coveredStages.push(stage);
    }
  }
  const planCoverage = coveredStages.length / Object.keys(STAGE_KEYWORDS).length;

  return {
    query: tc.query,
    group: tc.group,
    conceptCoverage,
    conceptCoverageRate,
    expectedConcepts,
    coveredConcepts,
    deckAccuracy,
    targetDecks,
    planCoverage,
    coveredStages,
    totalResults: hits.length,
  };
}
