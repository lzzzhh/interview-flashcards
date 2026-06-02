// Neo4j V2 Enhanced Hybrid Search — tiered graph scoring, evidence gating,
// diversity penalty, and graph-aware Top50→Top15 rerank.
//
// This file is a copy of neo4j-hybrid-search.ts with V2 improvements.
// Kept fully isolated for side-by-side evaluation.

import prisma from '../../db/prisma';
import { fts5Search } from './fts5-search';
import { understandQuery } from './query-understanding';
import { expandQuery } from './query-expander';
import {
  neo4jConceptLookup,
  neo4jBuildKeywordTiers,
  neo4jGraphScoreV2,
  type Neo4jGraphContext,
  type GraphScoreV2,
} from './neo4j-graph-search';
import { tokenizeBigrams } from './bigram';
import {
  rerank,
  type CardForRerank,
  type RerankCandidate,
  detectProfile,
} from './reranker';

// ---- Types ----

interface HybridSearchInput {
  query: string;
  deckIds?: string[];
  topK?: number;
  maxResults?: number;
  minScore?: number;
  candidateLimit?: number;
  filters?: { difficulty?: string[]; onlyDue?: boolean; includeWeakCards?: boolean };
  overrideProfile?: any;
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
    graphBreakdownV2?: GraphScoreV2['breakdown'];
    graphMatchType?: string;
  };
  _neo4jTraceV2?: {
    matchedConcepts: string[];
    expandedConcepts: string[];
    deckHints: string[];
    keywordTiers: Record<string, string[]>;
    gatedCards: number;
    diversityPenalties: number;
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

// Evivence gating thresholds
const MIN_KEYWORD_EVIDENCE = 0.15;
const MIN_FIELD_EVIDENCE = 0.10;
const MAX_GRAPH_BOOST = 0.15;

// Diversity: max same-concept cards in Top15
const MAX_SAME_CONCEPT = 3;
const MAX_SAME_DECK = 5;

function safeJsonParse(s: any): any {
  if (!s) return null;
  if (typeof s !== 'string') return s;
  try { return JSON.parse(s); } catch { return null; }
}

// ---- Recall functions (local copies) ----

async function recallFTS5(query: string, limit: number, deckIds?: string[]): Promise<RecallCandidate[]> {
  const deckId = deckIds && deckIds.length === 1 ? deckIds[0] : undefined;
  const results = await fts5Search(query, limit, deckId);
  const maxMatches = results.length > 0 ? Math.max(1, ...results.map(r => r.matchCount || 1)) : 1;
  return results.map(r => {
    const normalized = (r.matchCount || 1) / maxMatches;
    const rankScore = 1 / (1 + (r.rank || 0) * 0.05);
    return { cardId: r.cardId, graphScore: 0, keywordScore: 0.3 + normalized * 0.5 + rankScore * 0.2, matchedKeywords: [], source: 'fts5' as const };
  });
}

async function recallByTags(query: string, expandedKW: string[], limit: number): Promise<RecallCandidate[]> {
  const searchTerms = [...expandedKW, ...query.split(/\s+/).filter(t => t.length > 0)];
  const results: RecallCandidate[] = [];
  const seen = new Set<string>();
  for (const term of searchTerms.slice(0, 8)) {
    if (seen.size >= limit) break;
    try {
      const rows = await prisma.$queryRawUnsafe(`SELECT id as cardId FROM Card WHERE tags LIKE ? LIMIT ?`, `%${term}%`, limit) as any[];
      for (const row of (rows || [])) {
        if (seen.has(row.cardId)) continue;
        seen.add(row.cardId);
        results.push({ cardId: row.cardId, graphScore: 0, keywordScore: 0.2, matchedKeywords: [term], source: 'tag' });
      }
    } catch { /* skip */ }
  }
  return results;
}

async function recallBySearchKeywords(query: string, expandedKW: string[], limit: number): Promise<RecallCandidate[]> {
  const searchTerms = [...expandedKW, ...query.split(/\s+/).filter(t => t.length > 0)];
  const results: RecallCandidate[] = [];
  const seen = new Set<string>();
  for (const term of searchTerms.slice(0, 8)) {
    if (seen.size >= limit) break;
    try {
      const rows = await prisma.$queryRawUnsafe(`SELECT id as cardId FROM Card WHERE searchKeywords LIKE ? AND searchKeywords IS NOT NULL LIMIT ?`, `%${term}%`, limit) as any[];
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

export async function neo4jHybridSearchV2(input: HybridSearchInput): Promise<CardMatch[]> {
  const maxResults = input.maxResults ?? input.topK ?? DEFAULT_MAX_RESULTS;
  const minScore = input.minScore ?? DEFAULT_MIN_SCORE;
  const candidateLimit = input.candidateLimit ?? DEFAULT_CANDIDATE_LIMIT;

  // 1. Query understanding
  const parsed = await understandQuery(input.query);
  const { topic, canonicalTopic, coreKeywords, expandedKeywords, recallText } = parsed;

  // 1b. Old expandQuery
  const { keywords: oldKW, normalizedQuery: oldNorm } = expandQuery(input.query);
  const allQueryTextRecall = [input.query, oldNorm || '', ...oldKW].filter(Boolean).join(' ').slice(0, 2000);

  // 2. Neo4j graph expansion
  const { tiers: neo4jTiers, context: neo4jContext } = await neo4jBuildKeywordTiers(input.query);
  const mergedCoreKeywords = [...new Set([...coreKeywords, ...neo4jTiers.coreKeywords])];
  const mergedExpandedKeywords = [...new Set([...expandedKeywords, ...neo4jTiers.expandedKeywords])];

  // 3. Multi-channel recall
  const [fts5Pool, tagPool, skwPool] = await Promise.all([
    recallFTS5(allQueryTextRecall, candidateLimit, input.deckIds),
    recallByTags(allQueryTextRecall, mergedExpandedKeywords.slice(0, 12), candidateLimit),
    recallBySearchKeywords(allQueryTextRecall, mergedExpandedKeywords.slice(0, 12), candidateLimit),
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

  const cardMap = new Map(cards.map(c => [c.id, c]));
  const progressMap = new Map(progresses.map(p => [p.cardId, p]));
  const queryBigrams = tokenizeBigrams(recallText);

  // 6. Graph context
  const graphContext: Neo4jGraphContext = {
    matchedConcepts: neo4jContext.matchedConcepts,
    expandedConcepts: neo4jContext.expandedConcepts,
    deckHints: neo4jContext.deckHints,
    paths: neo4jContext.paths,
    keywordTiers: { coreKeywords: mergedCoreKeywords, expandedKeywords: mergedExpandedKeywords, prerequisiteKeywords: neo4jTiers.prerequisiteKeywords, lowPriorityKeywords: [] },
    graphScore: 0,
    graphScoreBreakdown: {},
  };

  // 7. Build reranker candidates with V2 scoring + evidence gating
  const rerankInput: RerankCandidate[] = [];
  const cardDetails: CardForRerank[] = [];
  const graphScoreMap = new Map<string, GraphScoreV2>();
  let gatedCards = 0;

  for (const c of candidates) {
    const card = cardMap.get(c.cardId);
    if (!card) continue;

    // V2 tiered graph score
    const gs = neo4jGraphScoreV2({
      canonicalTopic: card.canonicalTopic || undefined,
      canonicalConcept: card.canonicalConcept || undefined,
      tags: safeJsonParse(card.tags) || [],
      searchKeywords: safeJsonParse(card.searchKeywords) || [],
      deckId: card.deckId,
    }, graphContext);
    graphScoreMap.set(c.cardId, gs);

    // Text evidence gating: graph boost only when keyword/field evidence exists
    const hasKeywordEvidence = c.keywordScore >= MIN_KEYWORD_EVIDENCE;
    const fieldScore = 0; // populated by reranker later — gate on keyword first
    const hasFieldEvidence = c.keywordScore >= MIN_FIELD_EVIDENCE;
    const evidenceGate = hasKeywordEvidence || hasFieldEvidence;

    // Effective graph score: gated by text evidence
    const effectiveGraphScore = evidenceGate
      ? Math.min(gs.score, MAX_GRAPH_BOOST)
      : gs.score * 0.3; // tiny boost without evidence

    if (!evidenceGate && gs.score > 0.02) gatedCards++;

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
      vectorScore: effectiveGraphScore,
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

  // 8. Rerank
  const profile = detectProfile(input.query, topic, mergedExpandedKeywords.slice(0, 5), input.deckIds || []);
  const ranked = rerank(rerankInput, cardDetails, profile, new Map());

  // 8b. Graph-aware Top50 → Top15 rerank: re-boost strong graph matches
  const STRONG_GRAPH_THRESHOLD = 0.10;
  for (const r of ranked.slice(0, 50)) {
    const gs = graphScoreMap.get(r.cardId);
    if (!gs) continue;
    if (gs.matchType === 'direct' && gs.score >= STRONG_GRAPH_THRESHOLD) {
      const card = cardMap.get(r.cardId);
      const hasEvidence = r.keywordScore >= MIN_KEYWORD_EVIDENCE;
      if (hasEvidence) {
        r.finalScore += 0.05; // boost direct concept matches with text evidence into Top15
      }
    }
  }

  // 8c. Deck boost
  const deckBoostSet = new Set(input.deckIds || []);
  for (const r of ranked) {
    const card = cardMap.get(r.cardId);
    if (card && deckBoostSet.has(card.deckId)) r.finalScore += profile.deckBoost;
  }

  // Re-sort after boosts
  ranked.sort((a, b) => b.finalScore - a.finalScore);

  // 9. Diversity penalty — same concept/deck clustering
  let diversityPenalties = 0;
  const conceptCounts = new Map<string, number>();
  const deckCounts = new Map<string, number>();

  for (let i = 0; i < ranked.length; i++) {
    const card = cardMap.get(ranked[i].cardId);
    if (!card) continue;

    const concept = (card.canonicalConcept || card.canonicalTopic || '').toLowerCase();
    const deck = card.deckId;

    if (concept) {
      const cc = conceptCounts.get(concept) || 0;
      if (cc >= MAX_SAME_CONCEPT) {
        ranked[i].finalScore *= 0.85;
        diversityPenalties++;
      }
      conceptCounts.set(concept, cc + 1);
    }

    if (deck) {
      const dc = deckCounts.get(deck) || 0;
      if (dc >= MAX_SAME_DECK) {
        ranked[i].finalScore *= 0.92;
        diversityPenalties++;
      }
      deckCounts.set(deck, dc + 1);
    }
  }

  ranked.sort((a, b) => b.finalScore - a.finalScore);

  // 10. Build output
  const results: CardMatch[] = [];
  for (const r of ranked) {
    const card = cardMap.get(r.cardId);
    if (!card) continue;
    const gs = graphScoreMap.get(r.cardId);

    if (r.finalScore < minScore) continue;

    const prog = progressMap.get(card.id);
    let matchType: CardMatch['matchType'] = 'keyword';
    let reason = '关键词匹配';
    if (gs && gs.matchType === 'direct') { matchType = 'hybrid'; reason = '图谱直接命中'; }
    else if (gs && gs.matchType === 'oneHop') { matchType = 'hybrid'; reason = '图谱单跳关联'; }
    if (prog && prog.state !== 'new' && prog.nextReview <= new Date()) {
      matchType = 'due'; reason = '到期复习';
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
      due: prog && prog.state !== 'new' && prog.nextReview <= new Date(),
      lapses: prog?.lapses ?? undefined,
      snippet,
      scoreBreakdown: {
        graphScore: gs?.score || 0,
        keywordScore: r.keywordScore,
        fieldBoost: r.fieldBoost,
        learningBoost: r.learningBoost,
        deckBoost: profile.deckBoost,
        graphBreakdownV2: gs?.breakdown,
        graphMatchType: gs?.matchType,
      },
      _neo4jTraceV2: input.debug ? {
        matchedConcepts: graphContext.matchedConcepts,
        expandedConcepts: graphContext.expandedConcepts,
        deckHints: neo4jContext.deckHints,
        keywordTiers: {
          coreKeywords: mergedCoreKeywords,
          expandedKeywords: mergedExpandedKeywords,
          prerequisiteKeywords: neo4jTiers.prerequisiteKeywords,
          lowPriorityKeywords: [],
        },
        gatedCards,
        diversityPenalties,
      } : undefined,
    });

    if (results.length >= maxResults) break;
  }

  return results;
}
