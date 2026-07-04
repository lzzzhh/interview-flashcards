// Neo4j V3 Soft Rerank — tiered graph scoring with soft gating,
// higher boost cap, no diversity penalty, soft Top50→Top15 promote.
// Based on neo4j-hybrid-search.ts (v1) structure, not v2.

import prisma from '../../db/prisma';
import { fts5Search } from './fts5-search';
import { understandQuery } from './query-understanding';
import { expandQuery } from './query-expander';
import {
  neo4jBuildKeywordTiers,
  neo4jGraphScore,
  type Neo4jGraphContext,
} from './neo4j-graph-search';
import { tokenizeBigrams } from './bigram';
import { rerank, type CardForRerank, type RerankCandidate, detectProfile } from './reranker';

// ---- Types ----
interface HybridSearchInput {
  query: string; deckIds?: string[]; topK?: number; maxResults?: number;
  minScore?: number; candidateLimit?: number;
  filters?: { difficulty?: string[]; onlyDue?: boolean };
  overrideProfile?: any; debug?: boolean;
}

interface CardMatch {
  cardId: string; title: string; deckId: string; deckName?: string;
  tags: string[]; score: number;
  matchType: 'vector' | 'keyword' | 'hybrid' | 'due' | 'tag' | 'semantic';
  reason: string; due?: boolean; lapses?: number; snippet?: string;
  scoreBreakdown?: {
    graphScore: number; keywordScore: number;
    fieldBoost: number; learningBoost: number; deckBoost: number;
    graphBreakdownV3?: Record<string, number>;
    softGatingMultiplier?: number; graphMatchType?: string;
  };
  _neo4jTraceV3?: any;
}

interface RecallCandidate {
  cardId: string; graphScore: number; keywordScore: number;
  matchedKeywords: string[]; source: 'fts5' | 'like' | 'tag' | 'searchKeywords';
}

const USER_ID = 'demo-user';
const DEFAULT_MIN_SCORE = 0.30;
const DEFAULT_MAX_RESULTS = 50;
const DEFAULT_CANDIDATE_LIMIT = 300;

// V3 soft gating config
const SOFT_GATE_THRESHOLD = 0.08;
const SOFT_GATE_MULTIPLIER = 0.35;

function safeJsonParse(s: any): any {
  if (!s) return null;
  if (typeof s !== 'string') return s;
  try { return JSON.parse(s); } catch { return null; }
}

// ---- Recall (from v1) ----
async function recallFTS5(q: string, limit: number, deckIds?: string[]): Promise<RecallCandidate[]> {
  const deckId = deckIds?.length === 1 ? deckIds[0] : undefined;
  const results = await fts5Search(q, limit, deckId);
  const maxMatches = results.length > 0 ? Math.max(1, ...results.map(r => r.matchCount || 1)) : 1;
  return results.map(r => {
    const n = (r.matchCount || 1) / maxMatches;
    const rankS = 1 / (1 + (r.rank || 0) * 0.05);
    return { cardId: r.cardId, graphScore: 0, keywordScore: 0.3 + n * 0.5 + rankS * 0.2, matchedKeywords: [], source: 'fts5' as const };
  });
}

async function recallByTags(q: string, expandedKW: string[], limit: number): Promise<RecallCandidate[]> {
  const terms = [...expandedKW, ...q.split(/\s+/).filter(t => t.length > 0)];
  const results: RecallCandidate[] = [];
  const seen = new Set<string>();
  for (const t of terms.slice(0, 8)) {
    if (seen.size >= limit) break;
    try {
      const rows = await prisma.$queryRawUnsafe(`SELECT id as cardId FROM Card WHERE tags LIKE ? LIMIT ?`, `%${t}%`, limit) as any[];
      for (const row of (rows || [])) {
        if (seen.has(row.cardId)) continue;
        seen.add(row.cardId);
        results.push({ cardId: row.cardId, graphScore: 0, keywordScore: 0.2, matchedKeywords: [t], source: 'tag' });
      }
    } catch {}
  }
  return results;
}

async function recallBySearchKeywords(q: string, expandedKW: string[], limit: number): Promise<RecallCandidate[]> {
  const terms = [...expandedKW, ...q.split(/\s+/).filter(t => t.length > 0)];
  const results: RecallCandidate[] = [];
  const seen = new Set<string>();
  for (const t of terms.slice(0, 8)) {
    if (seen.size >= limit) break;
    try {
      const rows = await prisma.$queryRawUnsafe(`SELECT id as cardId FROM Card WHERE searchKeywords LIKE ? AND searchKeywords IS NOT NULL LIMIT ?`, `%${t}%`, limit) as any[];
      for (const row of (rows || [])) {
        if (seen.has(row.cardId)) continue;
        seen.add(row.cardId);
        results.push({ cardId: row.cardId, graphScore: 0, keywordScore: 0.35, matchedKeywords: [t], source: 'searchKeywords' });
      }
    } catch {}
  }
  return results;
}

// ---- V3 Rerank helpers ----

// ---- Main ----

export async function neo4jHybridSearchV3(input: HybridSearchInput): Promise<CardMatch[]> {
  const maxResults = input.maxResults ?? input.topK ?? DEFAULT_MAX_RESULTS;
  const minScore = input.minScore ?? DEFAULT_MIN_SCORE;
  const candidateLimit = input.candidateLimit ?? DEFAULT_CANDIDATE_LIMIT;

  // 1. Query understanding
  const parsed = await understandQuery(input.query);
  const { topic, coreKeywords, expandedKeywords, recallText } = parsed;
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
    const ex = candidateMap.get(c.cardId);
    if (ex) { ex.keywordScore = Math.max(ex.keywordScore, c.keywordScore); ex.matchedKeywords = [...new Set([...ex.matchedKeywords, ...c.matchedKeywords])]; }
    else candidateMap.set(c.cardId, c);
  }
  for (const c of skwPool) {
    const ex = candidateMap.get(c.cardId);
    if (ex) { ex.keywordScore = Math.max(ex.keywordScore, c.keywordScore); ex.matchedKeywords = [...new Set([...ex.matchedKeywords, ...c.matchedKeywords])]; }
    else candidateMap.set(c.cardId, c);
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
    graphScore: 0, graphScoreBreakdown: {},
  };

  // 7. Reranker candidates with V3 soft gating
  const rerankInput: RerankCandidate[] = [];
  const cardDetails: CardForRerank[] = [];
  const graphScoreMap = new Map<string, { score: number; breakdown: Record<string, number> }>();
  const gatingMap = new Map<string, number>();

  for (const c of candidates) {
    const card = cardMap.get(c.cardId);
    if (!card) continue;

    const gs = neo4jGraphScore({
      canonicalTopic: card.canonicalTopic || undefined,
      canonicalConcept: card.canonicalConcept || undefined,
      tags: safeJsonParse(card.tags) || [],
      searchKeywords: safeJsonParse(card.searchKeywords) || [],
    }, graphContext);
    graphScoreMap.set(c.cardId, gs);

    const hasEvidence = c.keywordScore >= SOFT_GATE_THRESHOLD;
    const multiplier = hasEvidence ? 1.0 : SOFT_GATE_MULTIPLIER;
    const boost = gs.score * multiplier; // soft gate only, no hard cap
    gatingMap.set(c.cardId, multiplier);

    cardDetails.push({
      cardId: card.id, title: card.title, titleCn: card.titleCn,
      question: card.question, answer: card.answer,
      approach: card.approach, description: card.description,
      tags: card.tags, searchKeywords: card.searchKeywords,
    });

    const prog = progressMap.get(c.cardId);
    rerankInput.push({
      cardId: c.cardId,
      vectorScore: boost,
      keywordScore: c.keywordScore,
      matchedKeywords: c.matchedKeywords,
      queryBigrams,
      learning: prog ? { due: ['learning', 'review', 'relearning'].includes(prog.state) && prog.nextReview <= new Date(), lapses: prog.lapses, easeFactor: prog.easeFactor } : undefined,
    });
  }
  const profile = detectProfile(input.query, topic, mergedExpandedKeywords.slice(0, 5), input.deckIds || []);
  const ranked = rerank(rerankInput, cardDetails, profile, new Map());

  // 8b. Deck boost
  const deckBoostSet = new Set(input.deckIds || []);
  for (const r of ranked) {
    const card = cardMap.get(r.cardId);
    if (card && deckBoostSet.has(card.deckId)) r.finalScore += profile.deckBoost;
  }
  ranked.sort((a, b) => b.finalScore - a.finalScore);

  // 8c. V3 Soft promote: strong graph match from rank 16-40 → +0.04 boost
  const promoted: { idx: number }[] = [];
  for (let i = 15; i < Math.min(40, ranked.length); i++) {
    const gs = graphScoreMap.get(ranked[i].cardId);
    if (!gs || gs.score < 0.10) continue;
    const hasEv = (ranked[i].keywordScore || 0) >= SOFT_GATE_THRESHOLD;
    if (hasEv) promoted.push({ idx: i });
  }
  for (const p of promoted) ranked[p.idx].finalScore += 0.04;
  ranked.sort((a, b) => b.finalScore - a.finalScore);

  // NO diversity penalty in v3

  // 9. Build output
  const results: CardMatch[] = [];
  for (const r of ranked) {
    const card = cardMap.get(r.cardId);
    if (!card) continue;
    if (r.finalScore < minScore) continue;

    const gs = graphScoreMap.get(r.cardId);
    const gatingMult = gatingMap.get(r.cardId) || 1.0;
    const prog = progressMap.get(card.id);

    let matchType: CardMatch['matchType'] = 'keyword';
    let reason = '关键词匹配';
    if (gs && gs.score > 0.15) { matchType = 'hybrid'; reason = '图谱增强匹配'; }
    if (prog && ['learning', 'review', 'relearning'].includes(prog.state) && prog.nextReview <= new Date()) { matchType = 'due'; reason = '到期复习'; }

    const content = card.question || card.answer || card.description || '';
    results.push({
      cardId: card.id,
      title: card.title || card.titleCn || card.question || '',
      deckId: card.deckId, deckName: (card as any).deck?.name,
      tags: safeJsonParse(card.tags) || [], score: r.finalScore, matchType, reason,
      due: prog && ['learning', 'review', 'relearning'].includes(prog.state) && prog.nextReview <= new Date(),
      lapses: prog?.lapses ?? undefined,
      snippet: content.slice(0, 120) + (content.length > 120 ? '...' : ''),
      scoreBreakdown: {
        graphScore: gs?.score || 0, keywordScore: r.keywordScore,
        fieldBoost: r.fieldBoost, learningBoost: r.learningBoost, deckBoost: profile.deckBoost,
        graphBreakdownV3: gs?.breakdown as Record<string, number>,
        softGatingMultiplier: gatingMult,
      },
      _neo4jTraceV3: input.debug ? {
        matchedConcepts: graphContext.matchedConcepts,
        expandedConcepts: graphContext.expandedConcepts,
        deckHints: neo4jContext.deckHints,
        keywordTiers: { coreKeywords: mergedCoreKeywords, expandedKeywords: mergedExpandedKeywords, prerequisiteKeywords: neo4jTiers.prerequisiteKeywords, lowPriorityKeywords: [] },
      } : undefined,
    });
    if (results.length >= maxResults) break;
  }
  return results;
}
