// backend/src/services/search/reranker.ts — 精排 Reranker (v2: query/deck-specific profiles)
//
// 公式（默认）：
//   finalScore = 0.40 * vectorScore + 0.15 * keywordScore
//              + 0.35 * fieldBoost     + 0.10 * learningBoost
//
// 相关性第一，学习状态第二。统计学 query 使用专用 profile 降低向量权重，提升关键词/字段权重。

import { tokenizeBigrams, bigramMatchCount } from './bigram';

// ════════════════════ Reranker Profiles ════════════════════

export interface RerankProfile {
  name: string;
  wVector: number;
  wKeyword: number;
  wField: number;
  wLearning: number;
  deckBoost: number;
  /** 是否启用统计学 lexical booster */
  statsLexicalBoost: boolean;
}

export const DEFAULT_PROFILE: RerankProfile = {
  name: 'default',
  wVector: 0.40,
  wKeyword: 0.15,
  wField: 0.35,
  wLearning: 0.10,
  deckBoost: 0.25,
  statsLexicalBoost: false,
};

export const STATS_PROFILE: RerankProfile = {
  name: 'statistics',
  wVector: 0.20,
  wKeyword: 0.30,
  wField: 0.40,
  wLearning: 0.10,
  deckBoost: 0.25,
  statsLexicalBoost: true,
};

export const LONG_STATS_PROFILE: RerankProfile = {
  name: 'long-statistics',
  wVector: 0.15,
  wKeyword: 0.35,
  wField: 0.40,
  wLearning: 0.10,
  deckBoost: 0.25,
  statsLexicalBoost: true,
};

/** 全局 keyword-heavy profile (ablation 用) */
export const KEYWORD_HEAVY_PROFILE: RerankProfile = {
  name: 'keyword-heavy',
  wVector: 0.25,
  wKeyword: 0.30,
  wField: 0.35,
  wLearning: 0.10,
  deckBoost: 0.25,
  statsLexicalBoost: false,
};

// ════════════════════ Profile Detection ════════════════════

/** 统计学核心词表 */
const STATS_LEXICON = new Set([
  'p值', 'p-value', '显著性', '假设检验', '原假设', '备择假设',
  't检验', '卡方', 'z检验', '置信区间', '样本量', '统计功效',
  'power', '效应量', '方差分析', 'anova', 'a/b测试', 'ab测试',
  '实验组', '对照组', '留存率', '转化率', 'type i error', 'type ii error',
  '第一类错误', '第二类错误', '统计推断', '统计显著', '显著性水平',
  '比例检验', 'f检验', '正态性检验', '多重比较', 'bonferroni',
  'fdr', '混杂因子', 'confounding', '因果推断', '漏斗分析',
  '比例变化', '指标变化', '留存变化', '转化变化',
]);

/** 检测 query 中是否包含统计学词表的词 */
function hasStatsTerms(text: string): boolean {
  const lower = text.toLowerCase();
  for (const term of STATS_LEXICON) {
    if (lower.includes(term.toLowerCase())) return true;
  }
  return false;
}

/** 检测是否为长句 query（超过一定长度且含口语特征） */
function isLongQuery(query: string): boolean {
  return query.length > 30 && /[,，.。!！?？、\s]/.test(query);
}

/**
 * 根据 query 文本和 QE 结果检测应使用的 rerank profile。
 * 优先级：long stats > stats > default
 */
export function detectProfile(
  query: string,
  normalizedQuery: string,
  expandedKeywords: string[],
  expandedDeckIds: string[],
): RerankProfile {
  const checkText = (query + ' ' + normalizedQuery + ' ' + expandedKeywords.join(' ')).toLowerCase();
  const hasStatsInText = hasStatsTerms(checkText);
  const hasStatsDeck = expandedDeckIds.includes('statistics');

  if (hasStatsInText || hasStatsDeck) {
    if (isLongQuery(query)) return LONG_STATS_PROFILE;
    return STATS_PROFILE;
  }

  return DEFAULT_PROFILE;
}

// ════════════════════ Statistics Lexical Booster ════════════════════

/**
 * 统计学卡片的字面匹配 booster。
 * 当 query 命中统计学词表时，对 deckId=statistics 的卡片额外加分。
 * 上限 +0.25。
 */
export function computeStatsLexicalBoost(
  queryLower: string,
  cardTitle: string,
  cardSearchKeywords: string,
  cardTags: string[],
  cardQuestion: string,
  cardAnswer: string,
  cardDeckId: string,
): number {
  if (cardDeckId !== 'statistics') return 0;
  if (!hasStatsTerms(queryLower)) return 0;

  let boost = 0;

  // 提取 query 中具体的统计学术语
  const hitTerms: string[] = [];
  for (const term of STATS_LEXICON) {
    if (queryLower.includes(term.toLowerCase())) {
      hitTerms.push(term.toLowerCase());
    }
  }
  if (hitTerms.length === 0) return 0;

  // 逐字段检测命中
  for (const term of hitTerms) {
    if (cardTitle.toLowerCase().includes(term)) {
      boost += 0.20;
      break; // 只加一次 title
    }
  }
  for (const term of hitTerms) {
    if (cardSearchKeywords.toLowerCase().includes(term)) {
      boost += 0.15;
      break; // 只加一次 searchKeywords
    }
  }
  for (const tag of cardTags) {
    for (const term of hitTerms) {
      if (tag.toLowerCase().includes(term)) {
        boost += 0.10;
        break;
      }
    }
    if (boost >= 0.35) break;
  }
  // question/answer checks (lower weight)
  for (const term of hitTerms) {
    if (cardQuestion.toLowerCase().includes(term)) boost += 0.05;
    if (boost >= 0.40) break;
  }
  for (const term of hitTerms) {
    if (cardAnswer.toLowerCase().includes(term)) boost += 0.05;
    if (boost >= 0.45) break;
  }

  return Math.min(boost, 0.25);
}

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
  profile: RerankProfile = DEFAULT_PROFILE,
  extraBoost: number = 0,
): number {
  const fieldBoost    = computeFieldBoost(candidate.queryBigrams, cardBigrams);
  const learningBoost = computeLearningBoost(candidate.learning);

  return (
    profile.wVector   * candidate.vectorScore +
    profile.wKeyword  * candidate.keywordScore +
    profile.wField    * fieldBoost +
    profile.wLearning * learningBoost +
    extraBoost
  );
}

/** 批量精排 */
export function rerank(
  candidates: RerankCandidate[],
  cards: CardForRerank[],
  profile: RerankProfile = DEFAULT_PROFILE,
  /** cardId → extra boost (e.g. stats lexical booster) */
  extraBoosts: Map<string, number> = new Map(),
): { cardId: string; finalScore: number; fieldBoost: number; learningBoost: number }[] {
  const cardMap = new Map(cards.map(c => [c.cardId, c]));
  const ranked: { cardId: string; finalScore: number; fieldBoost: number; learningBoost: number }[] = [];

  for (const cand of candidates) {
    const card = cardMap.get(cand.cardId);
    if (!card) continue;
    const cardBigrams = getCardBigrams(card);
    const fieldBoost    = computeFieldBoost(cand.queryBigrams, cardBigrams);
    const learningBoost = computeLearningBoost(cand.learning);
    const extra = extraBoosts.get(cand.cardId) || 0;
    const finalScore = (
      profile.wVector   * cand.vectorScore +
      profile.wKeyword  * cand.keywordScore +
      profile.wField    * fieldBoost +
      profile.wLearning * learningBoost +
      extra
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
