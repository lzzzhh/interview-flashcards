// backend/src/services/search/reranker.ts — 精排 Reranker
//
// 公式：
//   finalScore = 0.35 * vectorScore + 0.30 * keywordScore
//              + 0.25 * fieldBoost     + 0.10 * learningBoost
//
// 相关性第一，学习状态第二。

import { tokenizeBigrams, bigramMatchCount } from './bigram';

// ---- 权重常量 ----

const W_VECTOR   = 0.40;
const W_KEYWORD  = 0.15;
const W_FIELD    = 0.35;
const W_LEARNING = 0.10;

/** 字段命中权重 */
const FIELD_WEIGHTS: Record<string, number> = {
  tags:           1.0,
  searchKeywords: 0.8,
  titleCn:        0.6,
  title:          0.6,
  question:       0.4,
  answer:         0.2,
  approach:       0.3,
  description:    0.2,
};

/** 噪音标签：太泛的标签命中不加权重，避免过度匹配 */
const NOISY_TAGS = new Set([
  '机器学习', 'machine learning', 'ml',
  '深度学习', 'deep learning', 'dl',
  '算法', 'algorithm',
  '数据', 'data',
  '模型', 'model',
  '统计', 'statistics',
  '面试', 'interview',
  '技术', 'tech',
  '编程', 'coding',
  'AI', 'ai', '人工智能',
  '优化', 'optimization',
  '分析', 'analysis',
]);

// ---- 类型 ----

export interface CardForRerank {
  cardId: string;
  title?: string | null;
  titleCn?: string | null;
  question?: string | null;
  answer?: string | null;
  approach?: string | null;
  description?: string | null;
  tags?: string | null;
  searchKeywords?: string | null;
}

export interface RerankCandidate {
  cardId: string;
  /** 向量语义相似度 [0, 1] */
  vectorScore: number;
  /** 关键词/FTS5 匹配分数 [0, 1] */
  keywordScore: number;
  /** 命中的关键词列表（用于字段 boost 计算） */
  matchedKeywords: string[];
  /** 查询 bigram token 列表 */
  queryBigrams: string[];
  /** 学习状态 */
  learning?: {
    due: boolean;
    lapses: number;
    easeFactor: number;
  };
}

/** 卡片各字段的 bigram 索引缓存 */
interface CardBigramCache {
  tags: string[];
  searchKeywords: string[];
  titleCn: string[];
  title: string[];
  question: string[];
  answer: string[];
  approach: string[];
  description: string[];
  all: string[];
}

// ---- 缓存 ----

const bigramCache = new Map<string, CardBigramCache>();

function getCardBigrams(card: CardForRerank): CardBigramCache {
  const key = card.cardId;
  if (bigramCache.has(key)) return bigramCache.get(key)!;

  const cache: CardBigramCache = {
    tags:           card.tags           ? tokenizeBigrams(card.tags) : [],
    searchKeywords: card.searchKeywords ? tokenizeBigrams(card.searchKeywords) : [],
    titleCn:        card.titleCn        ? tokenizeBigrams(card.titleCn) : [],
    title:          card.title          ? tokenizeBigrams(card.title) : [],
    question:       card.question       ? tokenizeBigrams(card.question) : [],
    answer:         card.answer         ? tokenizeBigrams(card.answer) : [],
    approach:       card.approach       ? tokenizeBigrams(card.approach) : [],
    description:    card.description    ? tokenizeBigrams(card.description) : [],
    all: [],
  };

  cache.all = [...new Set([
    ...cache.tags,
    ...cache.searchKeywords,
    ...cache.titleCn,
    ...cache.title,
    ...cache.question,
    ...cache.answer,
    ...cache.approach,
    ...cache.description,
  ])];

  bigramCache.set(key, cache);
  return cache;
}

// ---- 核心计算 ----

/** 计算字段加权 boost [0, 1] */
function computeFieldBoost(
  queryBigrams: string[],
  cardBigrams: CardBigramCache,
): number {
  if (queryBigrams.length === 0) return 0;

  const fieldScores: number[] = [];

  for (const [fieldName, weight] of Object.entries(FIELD_WEIGHTS)) {
    const fieldTokens = (cardBigrams as any)[fieldName] as string[] | undefined;
    if (!fieldTokens || fieldTokens.length === 0) continue;
    let hits = bigramMatchCount(queryBigrams, fieldTokens);
    if (hits === 0) continue;
    // 噪音过滤：tags 字段中如果只命中了泛标签，降权
    if (fieldName === 'tags') {
      const noisyHitCount = [...NOISY_TAGS].filter(nt => 
        queryBigrams.some(qb => qb.toLowerCase().includes(nt.toLowerCase()))
      ).length;
      if (noisyHitCount > 0 && hits <= noisyHitCount * 2) {
        hits = Math.max(1, hits - noisyHitCount); // 减掉噪音命中
      }
    }
    // 命中率归一化
    const hitRate = Math.min(hits / queryBigrams.length, 1.0);
    fieldScores.push(hitRate * weight);
  }

  // 取各字段得分的 max（不是 sum，避免多字段重复加分）
  return fieldScores.length > 0 ? Math.max(...fieldScores) : 0;
}

/** 计算学习状态 boost [0, 1] */
function computeLearningBoost(learning?: RerankCandidate['learning']): number {
  if (!learning) return 0;

  let score = 0;

  // 到期复习
  if (learning.due) {
    score += 0.4;
    // 高遗忘次数
    if (learning.lapses > 3) score += 0.3;
  }

  // 高遗忘（即使未到期）
  if (learning.lapses > 5) score += 0.2;
  else if (learning.lapses > 3) score += 0.1;

  // easeFactor 低表示卡片难记
  if (learning.easeFactor < 2.0) score += 0.1;

  return Math.min(score, 1.0);
}

/** 计算单个候选的最终分数 */
export function computeFinalScore(
  candidate: RerankCandidate,
  cardBigrams: CardBigramCache,
): number {
  const fieldBoost    = computeFieldBoost(candidate.queryBigrams, cardBigrams);
  const learningBoost = computeLearningBoost(candidate.learning);

  return (
    W_VECTOR   * candidate.vectorScore +
    W_KEYWORD  * candidate.keywordScore +
    W_FIELD    * fieldBoost +
    W_LEARNING * learningBoost
  );
}

/** 批量精排 */
export function rerank(
  candidates: RerankCandidate[],
  cards: CardForRerank[],
): { cardId: string; finalScore: number; fieldBoost: number; learningBoost: number }[] {
  const cardMap = new Map(cards.map(c => [c.cardId, c]));
  const ranked: { cardId: string; finalScore: number; fieldBoost: number; learningBoost: number }[] = [];

  for (const cand of candidates) {
    const card = cardMap.get(cand.cardId);
    if (!card) continue;
    const cardBigrams = getCardBigrams(card);
    const fieldBoost    = computeFieldBoost(cand.queryBigrams, cardBigrams);
    const learningBoost = computeLearningBoost(cand.learning);
    const finalScore = (
      W_VECTOR   * cand.vectorScore +
      W_KEYWORD  * cand.keywordScore +
      W_FIELD    * fieldBoost +
      W_LEARNING * learningBoost
    );

    ranked.push({ cardId: cand.cardId, finalScore, fieldBoost, learningBoost });
  }

  ranked.sort((a, b) => b.finalScore - a.finalScore);
  return ranked;
}

/** 清除 bigram 缓存（内存泄漏防护） */
export function clearBigramCache(): void {
  bigramCache.clear();
}
