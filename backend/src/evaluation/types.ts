// backend/src/evaluation/types.ts — 评测框架类型定义（v2: 阈值评测）

/** 相关性等级 */
export type RelevanceGrade = 3 | 2 | 1 | 0;
// 3 = 强相关（核心答案，必须在结果中）
// 2 = 相关（可接受答案，应该被找到）
// 1 = 弱相关（有关联但不关键）
// 0 = 无关（不在期望列表中）

/** 期望命中的卡片 */
export interface CardExpectation {
  cardId: string;
  grade: RelevanceGrade;
}

/** 单条测试用例 */
export interface TestCase {
  query: string;
  group: string;
  /** 期望命中的卡片及其相关性等级 */
  expectations?: CardExpectation[];
  /** @deprecated 使用 expectations；向后兼容，grade=3 的卡片 */
  primaryIds?: string[];
  /** @deprecated 使用 expectations；向后兼容，grade=1-2 的卡片 */
  secondaryIds?: string[];
  acceptableDecks: string[];
  acceptableConcepts: string[];

  // ── v7 metadata fields (optional) ──

  /** search = 关键词/概念/长句搜索, learning = 学习路径, regression = 回归/对抗 */
  taskType?: 'search' | 'learning' | 'regression';
  /** keyword = 精确术语, concept = 概念/同义表达, long = 长句自然语言, mixed = 中英混合, cross = 跨模块 */
  queryType?: 'keyword' | 'concept' | 'long' | 'mixed' | 'cross';
  /** easy = 高频术语精确匹配, medium = 需同义扩展, hard = 需长句理解+跨模块推理 */
  difficulty?: 'easy' | 'medium' | 'hard';
  /** pending = 未审, reviewed = 已人工确认, needs_fix = 需修正 */
  reviewStatus?: 'pending' | 'reviewed' | 'needs_fix';
  /** generated = 脚本生成未审核, manual = 人工标注, merged = 合并去重后 */
  labelQuality?: 'generated' | 'manual' | 'merged' | 'verified' | 'needs_review' | 'weak';
  /** Where this test case came from */
  source?: 'legacy' | 'coverage_gap_resolved' | 'manual_review';

  // ── v8 normalization metadata ──
  /** search = card search benchmark, learning_plan = learning path, excluded = not a card search task */
  benchmarkScope?: 'search' | 'learning_plan' | 'excluded';
  /** What kind of user intent this query represents */
  intentType?: 'card_lookup' | 'concept_card_search' | 'card_collection_search' | 'learning_plan' | 'ambiguous' | 'not_card_search_intent';
  /** Why excluded, if benchmarkScope=excluded */
  excludeReason?: 'open_qa' | 'career_advice' | 'business_decision' | 'diagnostic_qa' | 'too_ambiguous' | 'out_of_scope';
  /** For search queries with awkward phrasing, the normalized equivalent */
  normalizedQuery?: string;
}

/** 归一化后的期望（运行时从 primaryIds/secondaryIds/expectations 推导） */
export interface NormalizedExpectation {
  cardId: string;
  grade: RelevanceGrade;
}

/** 单条用例的评测结果 */
export interface CaseResult {
  query: string;
  group: string;
  totalResults: number;
  responseTimeMs: number;
  rankedIds: string[];
  rankedDecks: string[];
  rankedScores: number[];
  primaryRanks: number[];
  secondaryRanks: number[];
  primaryHitTop15: string[];
  primaryHitTop50: string[];
  primaryHitTop100: string[];
  primaryMissing: string[];
  primaryBuried: string[];
  acceptableDeckHitsTop15: number;
  allPrimaryFound: boolean;
  /** 该 query 的 allExactIdRanks（期望卡片排名，未找到=-1） */
  expectationRanks: number[];
  /** 该 query 的期望列表 */
  expectations: NormalizedExpectation[];
}

/** 聚合后的分组指标 */
export interface GroupMetrics {
  group: string;
  caseCount: number;
  hitRateTop15: number;
  hitRateTop50: number;
  hitRateTop100: number;
  avgPrecisionAt5: number;
  avgMRR: number;
  avgDeckHitRateTop15: number;
  avgResponseTimeMs: number;
  totalMissing: number;
  totalBuried: number;
  totalPrimaries: number;
}

/** 全局汇总指标 */
export interface GlobalMetrics extends GroupMetrics {
  groups: GroupMetrics[];
}

// ════════════════════ 阈值评测指标 ════════════════════

/** 阈值评测聚合指标 */
export interface ThresholdMetrics {
  /** 评分阈值 */
  threshold: number;
  /** 总用例数 */
  totalCases: number;
  /** 总结果数 */
  totalResults: number;
  /** Precision@threshold：结果中 grade>=1 的比例 */
  precision: number;
  /** Recall@threshold：grade>=2 的期望卡片被找到的比例 */
  recallStrong: number;
  /** Recall@threshold（含弱相关）：grade>=1 的期望卡片被找到的比例 */
  recallAll: number;
  /** Empty Rate：返回 0 条结果的 query 比例 */
  emptyRate: number;
  /** Low Rate：返回 < 3 条结果的 query 比例 */
  lowRate: number;

  // 返回数量分布
  resultCount: {
    avg: number;
    p50: number;
    p90: number;
    p95: number;
    max: number;
    min: number;
  };

  // 传统指标（保持可比性）
  mrr: number;
  precisionAt5: number;
}

/** 单条 query 阈值评测结果 */
export interface ThresholdCaseResult {
  query: string;
  group: string;
  threshold: number;
  resultCount: number;
  /** 返回结果中 grade>=1 的数量 */
  relevantFound: number;
  /** 返回结果中 grade>=2 的数量 */
  strongFound: number;
  /** 期望中 grade>=2 的总数 */
  totalStrongExpected: number;
  /** 期望中 grade>=1 的总数 */
  totalExpected: number;
  /** 返回结果中各相关等级的命中详情 */
  hits: { cardId: string; grade: RelevanceGrade; score: number; rank: number }[];
  /** 遗漏的期望卡片 */
  missed: { cardId: string; grade: RelevanceGrade }[];
  precision: number;
  recallStrong: number;
  recallAll: number;
}
