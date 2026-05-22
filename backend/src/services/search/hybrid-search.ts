// backend/src/services/search/hybrid-search.ts — 多路召回 + Reranker 搜索编排
//
// 管线：
//   1. Query expansion（规则词典）
//   2. 多路召回（FTS5 + LIKE + tagSearch + searchKeywords + bge-m3 vector）
//   3. Union + dedup 候选池
//   4. DB 补全卡片详情 + SM-2 状态
//   5. Reranker 精排（0.35×vector + 0.30×keyword + 0.25×field + 0.10×learning）
//   6. 返回 topK

import prisma from '../../db/prisma';
import { getVectorStore } from '../vector/vector-store';
import { fts5Search } from './fts5-search';
import { getEmbeddingProvider } from '../embedding-provider';
import { textToVector } from '../vector/local-embedding';
import { expandQuery } from './query-expander';
import { tokenizeBigrams } from './bigram';
import {
  rerank,
  type CardForRerank,
  type RerankCandidate,
} from './reranker';

// ---- 类型 ----

interface HybridSearchInput {
  query: string;
  deckIds?: string[];
  /** @deprecated use maxResults */
  topK?: number;
  /** 最多返回多少条，默认 50 */
  maxResults?: number;
  /** 质量阈值，低于此分数的结果不返回，默认 0 */
  minScore?: number;
  /** 内部召回候选池大小，默认 300 */
  candidateLimit?: number;
  filters?: {
    difficulty?: string[];
    onlyDue?: boolean;
    includeWeakCards?: boolean;
  };
}

interface CardMatch {
  cardId: string;
  title: string;
  deckId: string;
  deckName?: string;
  tags: string[];
  score: number;
  matchType: 'vector' | 'keyword' | 'hybrid' | 'due' | 'tag' | 'semantic';
  reason: string;
  due?: boolean;
  lapses?: number;
  snippet?: string;
}

const USER_ID = 'demo-user';
const DEFAULT_MIN_SCORE = 0.30;
const DEFAULT_MAX_RESULTS = 50;
const DEFAULT_CANDIDATE_LIMIT = 300;

interface RecallCandidate {
  cardId: string;
  vectorScore: number;
  keywordScore: number;
  matchedKeywords: string[];
  source: 'fts5' | 'like' | 'tag' | 'searchKeywords' | 'vector';
}

// ---- 主入口 ----

export async function hybridSearch(input: HybridSearchInput): Promise<CardMatch[]> {
  // Resolve parameters: new fields take priority, fallback to legacy topK
  const maxResults = input.maxResults ?? input.topK ?? DEFAULT_MAX_RESULTS;
  const minScore = input.minScore ?? 0;
  const candidateLimit = Math.min(input.candidateLimit ?? DEFAULT_CANDIDATE_LIMIT, 1000);

  // 1. Query expansion
  const { keywords: expandedKW, deckIds: expandedDeckIds } = expandQuery(input.query);
  const allQueryText = [input.query, ...expandedKW].join(' ');

  // 2. 多路召回（并行）— 召回池大小由 candidateLimit 控制
  const poolSize = candidateLimit;
  const tagPoolSize = candidateLimit;

  const [
    fts5Pool,
    tagPool,
    skwPool,
    vecPool,
  ] = await Promise.all([
    recallFTS5(allQueryText, poolSize, input.deckIds),
    recallByTags(allQueryText, expandedKW, tagPoolSize),
    recallBySearchKeywords(allQueryText, expandedKW, tagPoolSize),
    recallVector(allQueryText, candidateLimit),
  ]);

  // 3. Union + dedup
  const candidateMap = new Map<string, RecallCandidate>();

  for (const c of fts5Pool) {
    candidateMap.set(c.cardId, c);
  }
  for (const c of tagPool) {
    const existing = candidateMap.get(c.cardId);
    if (existing) {
      existing.keywordScore = Math.max(existing.keywordScore, c.keywordScore);
      existing.matchedKeywords = [...new Set([...existing.matchedKeywords, ...c.matchedKeywords])];
    } else {
      candidateMap.set(c.cardId, c);
    }
  }
  for (const c of skwPool) {
    const existing = candidateMap.get(c.cardId);
    if (existing) {
      existing.keywordScore = Math.max(existing.keywordScore, c.keywordScore);
      existing.matchedKeywords = [...new Set([...existing.matchedKeywords, ...c.matchedKeywords])];
    } else {
      candidateMap.set(c.cardId, c);
    }
  }
  for (const c of vecPool) {
    const existing = candidateMap.get(c.cardId);
    if (existing) {
      existing.vectorScore = Math.max(existing.vectorScore, c.vectorScore);
    } else {
      candidateMap.set(c.cardId, c);
    }
  }

  const candidates = [...candidateMap.values()];
  if (candidates.length === 0) return [];

  // 4. DB 补全卡片详情 + SM-2 状态
  const cardIds = candidates.map(c => c.cardId);

  const where: any = { id: { in: cardIds } };
  if (input.deckIds && input.deckIds.length > 0) {
    where.deckId = { in: input.deckIds };
  }
  if (input.filters?.difficulty?.length) {
    where.difficulty = { in: input.filters.difficulty };
  }

  let [cards, progresses] = await Promise.all([
    prisma.card.findMany({
      where,
      include: { deck: true },
    }),
    prisma.cardProgress.findMany({
      where: { userId: USER_ID, cardId: { in: cardIds } },
    }),
  ]);

  // Apply onlyDue filter after progress fetch
  if (input.filters?.onlyDue) {
    const dueCardIds = new Set(
      progresses
        .filter(p => p.state !== 'new' && new Date(p.nextReview) <= new Date())
        .map(p => p.cardId)
    );
    cards = cards.filter(c => dueCardIds.has(c.id));
  }

  const cardMap = new Map(cards.map(c => [c.id, c]));
  const progressMap = new Map(progresses.map(p => [p.cardId, p]));

  // 5. 查询 bigram tokens
  const queryBigrams = tokenizeBigrams(allQueryText);

  // 6. Build reranker candidates
  const rerankInput: RerankCandidate[] = [];
  const cardDetails: CardForRerank[] = [];

  for (const c of candidates) {
    const card = cardMap.get(c.cardId);
    if (!card) continue;

    cardDetails.push({
      cardId: card.id,
      title: card.title,
      titleCn: card.titleCn,
      question: card.question,
      answer: card.answer,
      approach: card.approach,
      description: card.description,
      tags: card.tags,
      searchKeywords: card.searchKeywords,
    });

    const prog = progressMap.get(c.cardId);

    rerankInput.push({
      cardId: c.cardId,
      vectorScore: c.vectorScore,
      keywordScore: c.keywordScore,
      matchedKeywords: c.matchedKeywords,
      queryBigrams,
      learning: prog ? {
        due: prog.state !== 'new' && prog.nextReview <= new Date(),
        lapses: prog.lapses,
        easeFactor: prog.easeFactor,
      } : undefined,
    });
  }

  // 7. Rerank
  const ranked = rerank(rerankInput, cardDetails);

  // 7b. Deck matching boost: 卡片牌组命中 query expansion 建议的牌组时 +0.25
  const deckBoostSet = new Set(expandedDeckIds);
  for (const r of ranked) {
    const card = cardMap.get(r.cardId);
    if (card && deckBoostSet.has(card.deckId)) {
      r.finalScore += 0.20;
    }
  }
  // Re-sort after deck boost
  ranked.sort((a, b) => b.finalScore - a.finalScore);

  // 8. Build final output
  const rankedMap = new Map(ranked.map((r, i) => [r.cardId, { ...r, rank: i + 1 }]));

  const results: CardMatch[] = [];
  for (const c of candidates) {
    const card = cardMap.get(c.cardId);
    const rankInfo = rankedMap.get(c.cardId);
    if (!card || !rankInfo) continue;

    // 判断 matchType
    let matchType: CardMatch['matchType'] = 'keyword';
    let reason = '关键词匹配';

    if (c.source === 'vector') {
      matchType = 'semantic';
      reason = '语义匹配';
    } else if (c.source === 'tag') {
      matchType = 'tag';
      reason = '标签匹配';
    } else if (c.source === 'searchKeywords') {
      matchType = 'keyword';
      reason = '关键词匹配';
    }

    const prog = progressMap.get(c.cardId);
    if (prog && prog.state !== 'new' && prog.nextReview <= new Date()) {
      matchType = 'due';
      reason = '到期复习';
    }

    // 如果分数来自多通道，标记为 hybrid
    const sourceCount = [c.vectorScore > 0, c.keywordScore > 0, c.source === 'tag', c.source === 'searchKeywords'].filter(Boolean).length;
    if (sourceCount >= 2 && matchType !== 'due') {
      matchType = 'hybrid';
      reason = '多路混合匹配';
    }

    const content = card.question || card.answer || card.description || '';
    const snippet = content.slice(0, 120) + (content.length > 120 ? '...' : '');

    results.push({
      cardId: card.id,
      title: card.title || card.titleCn || card.question || card.id,
      deckId: card.deckId,
      deckName: card.deck.name,
      tags: card.tags ? safeJsonParse(card.tags) : [],
      score: rankInfo.finalScore,
      matchType,
      reason,
      due: prog ? (prog.state !== 'new' && prog.nextReview <= new Date()) : false,
      lapses: prog?.lapses,
      snippet,
    });
  }

  // Sort by finalScore descending, then apply threshold and limit
  results.sort((a, b) => b.score - a.score);
  const filtered = minScore > 0 ? results.filter(r => r.score >= minScore) : results;
  return filtered.slice(0, maxResults);
}

// ---- 召回通道 ----

/** 通道 1: FTS5 + LIKE 关键词召回 */
async function recallFTS5(
  query: string,
  limit: number,
  deckIds?: string[],
): Promise<RecallCandidate[]> {
  const deckId = deckIds && deckIds.length === 1 ? deckIds[0] : undefined;
  const results = await fts5Search(query, limit, deckId);
  return results.map(r => ({
    cardId: r.cardId,
    vectorScore: 0,
    keywordScore: Math.max(0.08, 1 / (1 + Math.abs(Number(r.rank || 0)) * 0.005)), // FTS5: higher weight
    matchedKeywords: [],
    source: 'fts5' as const,
  }));
}

/** 通道 2: 标签召回（bigram 匹配 tags 字段） */
async function recallByTags(
  query: string,
  expandedKW: string[],
  limit: number,
): Promise<RecallCandidate[]> {
  if (expandedKW.length === 0 && !query.trim()) return [];

  const searchTerms = [
    ...expandedKW,
    ...query.split(/\s+/).filter(t => t.length > 0),
  ];

  const results: RecallCandidate[] = [];
  const seen = new Set<string>();

  for (const term of searchTerms.slice(0, 8)) {
    if (seen.size >= limit) break;
    try {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT id as cardId FROM Card WHERE tags LIKE ? LIMIT ?`,
        `%${term}%`, limit,
      ) as any[];
      for (const row of (rows || [])) {
        if (seen.has(row.cardId)) continue;
        seen.add(row.cardId);
        results.push({
          cardId: row.cardId,
          vectorScore: 0,
          keywordScore: 0.2,
          matchedKeywords: [term],
          source: 'tag',
        });
      }
    } catch { /* skip */ }
  }

  return results;
}

/** 通道 3: searchKeywords 字段召回 */
async function recallBySearchKeywords(
  query: string,
  expandedKW: string[],
  limit: number,
): Promise<RecallCandidate[]> {
  const searchTerms = [
    ...expandedKW,
    ...query.split(/\s+/).filter(t => t.length > 0),
  ];

  const results: RecallCandidate[] = [];
  const seen = new Set<string>();

  for (const term of searchTerms.slice(0, 8)) {
    if (seen.size >= limit) break;
    try {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT id as cardId FROM Card WHERE searchKeywords LIKE ? AND searchKeywords IS NOT NULL LIMIT ?`,
        `%${term}%`, limit,
      ) as any[];
      for (const row of (rows || [])) {
        if (seen.has(row.cardId)) continue;
        seen.add(row.cardId);
        results.push({
          cardId: row.cardId,
          vectorScore: 0,
          keywordScore: 0.35,  // searchKeywords: higher weight
          matchedKeywords: [term],
          source: 'searchKeywords',
        });
      }
    } catch { /* skip */ }
  }

  return results;
}

/** 通道 4: bge-m3 字段级多向量语义召回 */
async function recallVector(
  query: string,
  limit: number,
): Promise<RecallCandidate[]> {
  const vectorStore = getVectorStore();
  if (vectorStore.name === 'noop') return [];

  try {
    let queryVec: number[] | null = null;

    // Try external embedding API first
    const provider = getEmbeddingProvider();
    if (provider) {
      try {
        const emb = await provider.embed({
          model: (provider as any).defaultModel || 'bge-m3',
          texts: [query],
        });
        if (emb.embeddings.length > 0) queryVec = emb.embeddings[0];
      } catch { /* fallback to local */ }
    }

    // Local fallback: n-gram vector
    if (!queryVec) {
      queryVec = textToVector(query);
    }

    if (queryVec && queryVec.length > 0) {
      const vecResults = await vectorStore.search(queryVec, limit, { objectType: 'card', module: 'ai-search' });
      return vecResults.map(r => ({
        cardId: r.objectId,
        vectorScore: r.score,
        keywordScore: 0,
        matchedKeywords: [],
        source: 'vector' as const,
      }));
    }
  } catch { /* skip vector */ }

  return [];
}

// ---- 辅助 ----

function safeJsonParse(s: string): string[] {
  try { return JSON.parse(s); } catch { return []; }
}

// ---- 学习清单搜索 ----

interface LearningPlanItem {
  cardId: string;
  title: string;
  deckId: string;
  deckName?: string;
  tags: string[];
  score: number;
  state: string;
  interval: number;
  nextReview: number;
  priority: number; // 0=新卡(高优先), 1=到期, 2=即将到期, 3=已掌握
  snippet?: string;
}

export async function learningPlanSearch(input: {
  query: string;
  deckIds?: string[];
  filters?: { difficulty?: string[]; onlyDue?: boolean };
}): Promise<LearningPlanItem[]> {
  // 1. 用大候选池跑搜索（topK=999，取全部结果）
  const matches = await hybridSearch({
    query: input.query,
    deckIds: input.deckIds,
    topK: 999,
    filters: input.filters,
  });

  if (matches.length === 0) return [];

  // 过滤：只保留有实际语义/关键词匹配的结果（score >= 0.08 且 deck 匹配相关概念）
  const deckBoostSet = new Set<string>();
  // 从 query expansion 推断目标牌组
  const { deckIds: expandedDecks } = expandQuery(input.query);
  for (const d of expandedDecks) deckBoostSet.add(d);

  const relevant = matches.filter(m => {
    if (m.score >= 0.30) return true;  // 高分直接保留
    if (m.score >= 0.20 && deckBoostSet.has(m.deckId)) return true;  // 目标牌组降分保留
    return false;
  });

  if (relevant.length === 0) return [];

  // 限制最多 100 张（保持学习清单可管理）
  const capped = relevant.slice(0, 100);

  // 2. 获取学习状态
  const cardIds = capped.map(c => c.cardId);
  const [progresses, cards] = await Promise.all([
    prisma.cardProgress.findMany({
      where: { userId: 'demo-user', cardId: { in: cardIds } },
    }),
    prisma.card.findMany({
      where: { id: { in: cardIds } },
      include: { deck: true },
    }),
  ]);

  const progressMap = new Map(progresses.map(p => [p.cardId, p]));
  const cardMap = new Map(cards.map(c => [c.id, c]));
  const now = Date.now();

  // 3. 计算学习优先级
  const plan: LearningPlanItem[] = [];
  for (const m of capped) {
    const card = cardMap.get(m.cardId);
    const prog = progressMap.get(m.cardId);
    const state = prog?.state || 'new';
    const nextReview = prog?.nextReview ? new Date(prog.nextReview).getTime() : 0;

    let priority: number;
    if (state === 'new') {
      priority = 0; // 最高优先：新卡片，还没学过
    } else if (state !== 'new' && nextReview <= now) {
      priority = 1; // 高优先：到期复习
    } else if (state !== 'new' && nextReview <= now + 3 * 86400000) {
      priority = 2; // 中优先：3天内到期
    } else {
      priority = 3; // 低优先：已掌握，间隔较长
    }

    const content = card?.question || card?.answer || '';
    plan.push({
      cardId: m.cardId,
      title: m.title,
      deckId: m.deckId,
      deckName: m.deckName || card?.deck?.name,
      tags: m.tags,
      score: m.score,
      state,
      interval: prog?.intervalDays || 0,
      nextReview,
      priority,
      snippet: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
    });
  }

  // 4. 按优先级排序：priority ASC（新卡优先），然后 score DESC
  plan.sort((a, b) => a.priority - b.priority || b.score - a.score);

  return plan;
}
