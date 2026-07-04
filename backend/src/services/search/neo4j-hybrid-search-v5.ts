// Neo4j V5 LLM Rerank — Neo4j recall + LLM pairwise relevance scoring
// Based on v1 structure with LLM reranking on Top50 candidates.

import prisma from '../../db/prisma';
import { fts5Search } from './fts5-search';
import { understandQuery, type ParsedSearchQuery } from './query-understanding';
import { expandQuery } from './query-expander';
import {
  neo4jConceptLookup,
  neo4jBuildKeywordTiers,
  neo4jGraphScore,
  type Neo4jGraphContext,
} from './neo4j-graph-search';
import { tokenizeBigrams } from './bigram';
import {
  rerank,
  type CardForRerank,
  type RerankCandidate,
  detectProfile,
} from './reranker';
import { llmRerankTopK, normalizeLLMScore } from './llm-reranker';
import { isNeo4jAvailable, getNeo4jStatus } from '../neo4j/neo4j-client';

// ---- Types ----

interface HybridSearchInput {
  query: string;
  deckIds?: string[];
  topK?: number;
  maxResults?: number;
  minScore?: number;
  candidateLimit?: number;
  filters?: {
    difficulty?: string[];
    onlyDue?: boolean;
    includeWeakCards?: boolean;
  };
  overrideProfile?: RerankProfile;
  debug?: boolean;
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
  scoreBreakdown?: {
    graphScore: number;
    keywordScore: number;
    fieldBoost: number;
    learningBoost: number;
    deckBoost: number;
    graphBreakdown?: Record<string, number>;
  };
  // Neo4j-specific debug trace
  _neo4jTrace?: {
    matchedConcepts: string[];
    expandedConcepts: string[];
    deckHints: string[];
    paths: Array<{ from: string; to: string; relType: string }>;
    keywordTiers: {
      coreKeywords: string[];
      expandedKeywords: string[];
      prerequisiteKeywords: string[];
      lowPriorityKeywords: string[];
    };
  };
}

interface RecallCandidate {
  cardId: string;
  graphScore: number;
  keywordScore: number;
  matchedKeywords: string[];
  source: 'fts5' | 'like' | 'tag' | 'searchKeywords';
}

const USER_ID = 'demo-user';
const DEFAULT_MIN_SCORE = 0.30;
const DEFAULT_MAX_RESULTS = 50;
const DEFAULT_CANDIDATE_LIMIT = 300;

function safeJsonParse(s: any): any {
  if (!s) return null;
  if (typeof s !== 'string') return s;
  try { return JSON.parse(s); } catch { return null; }
}

// ---- Recall functions (local copies, isolated from hybrid-search.ts) ----

async function recallFTS5(
  query: string,
  limit: number,
  deckIds?: string[],
): Promise<RecallCandidate[]> {
  const deckId = deckIds && deckIds.length === 1 ? deckIds[0] : undefined;
  const results = await fts5Search(query, limit, deckId);
  const maxMatches = results.length > 0 ? Math.max(1, ...results.map(r => r.matchCount || 1)) : 1;
  return results.map(r => {
    const normalized = (r.matchCount || 1) / maxMatches;
    const rankScore = 1 / (1 + (r.rank || 0) * 0.05);
    return {
      cardId: r.cardId,
      graphScore: 0,
      keywordScore: 0.3 + normalized * 0.5 + rankScore * 0.2,
      matchedKeywords: [],
      source: 'fts5' as const,
    };
  });
}

async function recallByTags(
  query: string,
  expandedKW: string[],
  limit: number,
): Promise<RecallCandidate[]> {
  const searchTerms = [...expandedKW, ...query.split(/\s+/).filter(t => t.length > 0)];
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
        results.push({ cardId: row.cardId, graphScore: 0, keywordScore: 0.2, matchedKeywords: [term], source: 'tag' });
      }
    } catch { /* skip */ }
  }
  return results;
}

async function recallBySearchKeywords(
  query: string,
  expandedKW: string[],
  limit: number,
): Promise<RecallCandidate[]> {
  const searchTerms = [...expandedKW, ...query.split(/\s+/).filter(t => t.length > 0)];
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
        results.push({ cardId: row.cardId, graphScore: 0, keywordScore: 0.35, matchedKeywords: [term], source: 'searchKeywords' });
      }
    } catch { /* skip */ }
  }
  return results;
}

// ---- Main Entry ----

export async function neo4jHybridSearchV5(input: HybridSearchInput): Promise<CardMatch[]> {
  const maxResults = input.maxResults ?? input.topK ?? DEFAULT_MAX_RESULTS;
  const minScore = input.minScore ?? DEFAULT_MIN_SCORE;
  const candidateLimit = input.candidateLimit ?? DEFAULT_CANDIDATE_LIMIT;

  // 1. Query understanding
  const parsed = await understandQuery(input.query);
  const { intent, topic, canonicalTopic, deckHint, coreKeywords, expandedKeywords, recallText, rerankText } = parsed;

  // 1b. Old expandQuery
  const { keywords: oldKW, normalizedQuery: oldNorm } = expandQuery(input.query);
  const allQueryTextRecall = [input.query, oldNorm || '', ...oldKW].filter(Boolean).join(' ').slice(0, 2000);
  const finalRecallText = allQueryTextRecall;

  // 2. Neo4j graph-enhanced query expansion
  const { tiers: neo4jTiers, context: neo4jContext } = await neo4jBuildKeywordTiers(input.query);

  // Merge static graph keywords with Neo4j keywords
  const mergedCoreKeywords = [...new Set([...coreKeywords, ...neo4jTiers.coreKeywords])];
  const mergedExpandedKeywords = [...new Set([...expandedKeywords, ...neo4jTiers.expandedKeywords])];

  // 3. Multi-channel recall (no vector — keep isolated)
  const [fts5Pool, tagPool, skwPool] = await Promise.all([
    recallFTS5(finalRecallText, candidateLimit, input.deckIds),
    recallByTags(finalRecallText, mergedExpandedKeywords.slice(0, 12), candidateLimit),
    recallBySearchKeywords(finalRecallText, mergedExpandedKeywords.slice(0, 12), candidateLimit),
  ]);

  // 4. Union + dedup
  const candidateMap = new Map<string, RecallCandidate>();
  for (const c of fts5Pool) candidateMap.set(c.cardId, c);
  for (const c of tagPool) {
    const existing = candidateMap.get(c.cardId);
    if (existing) {
      existing.keywordScore = Math.max(existing.keywordScore, c.keywordScore);
      existing.matchedKeywords = [...new Set([...existing.matchedKeywords, ...c.matchedKeywords])];
    } else candidateMap.set(c.cardId, c);
  }
  for (const c of skwPool) {
    const existing = candidateMap.get(c.cardId);
    if (existing) {
      existing.keywordScore = Math.max(existing.keywordScore, c.keywordScore);
      existing.matchedKeywords = [...new Set([...existing.matchedKeywords, ...c.matchedKeywords])];
    } else candidateMap.set(c.cardId, c);
  }

  const candidates = [...candidateMap.values()];
  if (candidates.length === 0) return [];

  // 5. DB hydration
  const cardIds = candidates.map(c => c.cardId);
  const where: any = { id: { in: cardIds } };
  if (input.deckIds?.length) where.deckId = { in: input.deckIds };

  let [cards, progresses] = await Promise.all([
    prisma.card.findMany({ where, include: { deck: true } }),
    prisma.cardProgress.findMany({ where: { userId: USER_ID, cardId: { in: cardIds } } }),
  ]);

  if (input.filters?.onlyDue) {
    const dueCardIds = new Set(progresses.filter(p => ['learning', 'review', 'relearning'].includes(p.state) && new Date(p.nextReview) <= new Date()).map(p => p.cardId));
    cards = cards.filter(c => dueCardIds.has(c.id));
  }

  const cardMap = new Map(cards.map(c => [c.id, c]));
  const progressMap = new Map(progresses.map(p => [p.cardId, p]));
  const queryBigrams = tokenizeBigrams(recallText);

  // 6. Neo4j graph context (for scoring and tracing)
  const graphContext: Neo4jGraphContext = {
    matchedConcepts: neo4jContext.matchedConcepts,
    expandedConcepts: neo4jContext.expandedConcepts,
    deckHints: neo4jContext.deckHints,
    paths: neo4jContext.paths,
    keywordTiers: {
      coreKeywords: mergedCoreKeywords,
      expandedKeywords: mergedExpandedKeywords,
      prerequisiteKeywords: neo4jTiers.prerequisiteKeywords,
      lowPriorityKeywords: [],
    },
    graphScore: 0,
    graphScoreBreakdown: {},
  };

  // 7. Build reranker candidates with graph scoring
  const rerankInput: RerankCandidate[] = [];
  const cardDetails: CardForRerank[] = [];
  const graphScoreMap = new Map<string, number>();

  for (const c of candidates) {
    const card = cardMap.get(c.cardId);
    if (!card) continue;

    // Compute Neo4j graph score for this card
    const graphResult = neo4jGraphScore({
      canonicalTopic: card.canonicalTopic || undefined,
      canonicalConcept: card.canonicalConcept || undefined,
      tags: safeJsonParse(card.tags) || [],
      searchKeywords: safeJsonParse(card.searchKeywords) || [],
    }, graphContext);
    graphScoreMap.set(c.cardId, graphResult.score);

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
      vectorScore: graphResult.score,   // Neo4j score in vector slot for reranker
      keywordScore: c.keywordScore,
      matchedKeywords: c.matchedKeywords,
      queryBigrams,
      learning: prog ? {
        due: ['learning', 'review', 'relearning'].includes(prog.state) && prog.nextReview <= new Date(),
        lapses: prog.lapses,
        easeFactor: prog.easeFactor,
      } : undefined,
    });
  }

  // 8. Rerank — Neo4j-optimized: higher wVector for graph signal
  const profile = input.overrideProfile || { 
    wVector: 0.35, wKeyword: 0.30, wField: 0.25, wLearning: 0.10, 
    deckBoost: detectProfile(input.query, topic, mergedExpandedKeywords.slice(0, 5), input.deckIds || []).deckBoost,
    statsLexicalBoost: false
  };
  const extraBoosts = new Map<string, number>();

  // Topic match boost
  const topicLower = (canonicalTopic || topic || '').toLowerCase();
  const allMatchTerms = [...new Set([
    topicLower,
    ...mergedCoreKeywords.map(k => k.toLowerCase()),
    ...mergedExpandedKeywords.slice(0, 8).map(k => k.toLowerCase()),
  ])].filter(t => t.length > 1);

  if (allMatchTerms.length > 0) {
    for (const card of cards) {
      let topicBoost = 0;
      const cardSKW = (card.searchKeywords || '').toLowerCase();
      const cardTags = safeJsonParse(card.tags)?.map((t: string) => t.toLowerCase()) || [];
      const cardTitle = (card.title || card.titleCn || '').toLowerCase();
      if (allMatchTerms.some(t => cardSKW.includes(t))) topicBoost = Math.max(topicBoost, 0.15);
      if (allMatchTerms.some(t => cardTags.some(tag => tag.includes(t) || t.includes(tag)))) topicBoost = Math.max(topicBoost, 0.12);
      if (allMatchTerms.some(t => cardTitle.includes(t))) topicBoost = Math.max(topicBoost, 0.10);
      if (topicBoost > 0) extraBoosts.set(card.id, (extraBoosts.get(card.id) || 0) + topicBoost);
    }
  }

  const ranked = rerank(rerankInput, cardDetails, profile, extraBoosts);

  // Deck boost
  const deckBoostSet = new Set(input.deckIds || []);
  for (const r of ranked) {
    const card = cardMap.get(r.cardId);
    if (card && deckBoostSet.has(card.deckId)) r.finalScore += profile.deckBoost;
  }

  // 8d. LLM Rerank — score Top50 candidates, combine with original score
  const LLM_RERANK_K = 50;
  const topKCandidates = ranked.slice(0, LLM_RERANK_K);
  const llmResults = await llmRerankTopK(
    input.query,
    topKCandidates.map(r => {
      const card = cardMap.get(r.cardId);
      return {
        cardId: r.cardId,
        title: card?.title || card?.titleCn || '',
        question: card?.question || '',
        answer: card?.answer || '',
        tags: safeJsonParse(card?.tags) || [],
        searchKeywords: safeJsonParse(card?.searchKeywords) || [],
        deckName: (card as any)?.deck?.name,
        matchedConcepts: graphContext.matchedConcepts,
      };
    }),
    15,
  );

  // Merge LLM scores: 0.65 * llmScore + 0.20 * original + 0.15 * graphScore
  const llmScoreMap = new Map<string, number>();
  for (const lr of llmResults) {
    llmScoreMap.set(lr.cardId, normalizeLLMScore(lr.relevance));
  }

  for (const r of ranked) {
    const llmScore = llmScoreMap.get(r.cardId) ?? 0;
    const originalNorm = Math.min(r.finalScore, 1.0);
    const graphScore = graphScoreMap.get(r.cardId)?.score ?? 0;
    r.finalScore = 0.65 * llmScore + 0.20 * originalNorm + 0.15 * graphScore;
  }
  ranked.sort((a, b) => b.finalScore - a.finalScore);

  // 9. Build output
  const results: CardMatch[] = [];
  for (const r of ranked) {
    const card = cardMap.get(r.cardId);
    if (!card) continue;
    const c = candidates.find(x => x.cardId === r.cardId);
    const graphResult = c ? neo4jGraphScore({
      canonicalTopic: card.canonicalTopic || undefined,
      canonicalConcept: card.canonicalConcept || undefined,
      tags: safeJsonParse(card.tags) || [],
      searchKeywords: safeJsonParse(card.searchKeywords) || [],
    }, graphContext) : { score: 0, breakdown: {} };

    if (r.finalScore < minScore) continue;

    const prog = progressMap.get(card.id);
    let matchType = 'keyword' as CardMatch['matchType'];
    let reason = '关键词匹配';
    if (graphResult.score > 0.3) { matchType = 'hybrid'; reason = '图谱增强混合匹配'; }
    if (prog && ['learning', 'review', 'relearning'].includes(prog.state) && prog.nextReview <= new Date()) {
      matchType = 'due';
      reason = '到期复习';
    }

    const content = card.question || card.answer || card.description || '';
    const snippet = content.slice(0, 120) + (content.length > 120 ? '...' : '');

    results.push({
      cardId: card.id,
      title: card.title || card.titleCn || card.question || '',
      deckId: card.deckId,
      deckName: (card as any).deck?.name,
      tags: safeJsonParse(card.tags) || [],
      score: r.finalScore,
      matchType,
      reason,
      due: prog && ['learning', 'review', 'relearning'].includes(prog.state) && prog.nextReview <= new Date(),
      lapses: prog?.lapses ?? undefined,
      snippet,
      scoreBreakdown: {
        graphScore: r.vectorScore,
        keywordScore: r.keywordScore,
        fieldBoost: r.fieldBoost,
        learningBoost: r.learningBoost,
        deckBoost: profile.deckBoost,
        graphBreakdown: graphResult.breakdown,
      },
      _neo4jTrace: input.debug ? {
        matchedConcepts: graphContext.matchedConcepts,
        expandedConcepts: graphContext.expandedConcepts,
        deckHints: neo4jContext.deckHints,
        paths: neo4jContext.paths,
        keywordTiers: {
          coreKeywords: mergedCoreKeywords,
          expandedKeywords: mergedExpandedKeywords,
          prerequisiteKeywords: neo4jTiers.prerequisiteKeywords,
          lowPriorityKeywords: [],
        },
      } : undefined,
    });

    if (results.length >= maxResults) break;
  }

  return results;
}
