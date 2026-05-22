// backend/src/evaluation/types.ts — 评测框架类型定义

/** 单条测试用例 */
export interface TestCase {
  /** 自然语言搜索查询（中文优先） */
  query: string;
  /** 分组标签，用于聚合报告 */
  group: string;
  /** 必须命中的卡片 ID（核心答案） */
  primaryIds: string[];
  /** 可接受命中的卡片 ID（相关但不核心） */
  secondaryIds: string[];
  /** 可接受的牌组 ID 列表 */
  acceptableDecks: string[];
  /** 可接受的概念描述（用于人工复核） */
  acceptableConcepts: string[];
}

/** 单条用例的评测结果 */
export interface CaseResult {
  query: string;
  group: string;
  /** 总返回结果数 */
  totalResults: number;
  /** 响应时间（毫秒） */
  responseTimeMs: number;
  /** 返回结果的 cardId 列表（按 rank 排序） */
  rankedIds: string[];
  /** 返回结果的 deckId 列表（按 rank 排序） */
  rankedDecks: string[];
  /** 各 primaryId 的排名（-1 表示未找到） */
  primaryRanks: number[];
  /** 各 secondaryId 的排名（-1 表示未找到） */
  secondaryRanks: number[];
  /** Top-15 内命中的 primaryIds */
  primaryHitTop15: string[];
  /** Top-50 内命中的 primaryIds */
  primaryHitTop50: string[];
  /** Top-100 内命中的 primaryIds */
  primaryHitTop100: string[];
  /** 完全未命中（不在 top 100 中）的 primaryIds */
  primaryMissing: string[];
  /** 命中但排名较深（在 top 100 但不在 top 15 中）的 primaryIds */
  primaryBuried: string[];
  /** Top-15 内来自 acceptableDecks 的结果数 */
  acceptableDeckHitsTop15: number;
  /** 是否所有 primaryIds 都在 top 100 中 */
  allPrimaryFound: boolean;
}

/** 聚合后的分组指标 */
export interface GroupMetrics {
  group: string;
  caseCount: number;
  /** Top-15 命中率（至少一个 primaryId 在 top 15 中） */
  hitRateTop15: number;
  /** Top-50 命中率 */
  hitRateTop50: number;
  /** Top-100 命中率 */
  hitRateTop100: number;
  /** P@5 平均值 */
  avgPrecisionAt5: number;
  /** MRR 平均值 */
  avgMRR: number;
  /** Acceptable Deck 命中率（top 15 中） */
  avgDeckHitRateTop15: number;
  /** 平均响应时间（毫秒） */
  avgResponseTimeMs: number;
  /** missing 的 primaryIds 总数 */
  totalMissing: number;
  /** buried 的 primaryIds 总数 */
  totalBuried: number;
  /** primaryIds 总数（用于归一化） */
  totalPrimaries: number;
}

/** 全局汇总指标 */
export interface GlobalMetrics extends GroupMetrics {
  groups: GroupMetrics[];
}
