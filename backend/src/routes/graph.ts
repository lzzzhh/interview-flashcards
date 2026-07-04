// Graph Routes — Neo4j graph expansion + card similarity for job prep

import { FastifyInstance } from 'fastify';
import { neo4jBuildKeywordTiers } from '../services/search/neo4j-graph-search';
import {
  rebuildAllCardSimilarities,
  upsertCardSimilarity,
  getSimilarCards,
  expandCardIdsViaSimilarity,
  getSimilarityGraphStats,
} from '../services/neo4j/card-similarity';

export async function graphRoutes(app: FastifyInstance) {
  // ── Concept graph expansion ──

  app.post('/api/graph/job-prep/expand', async (req) => {
    const body = req.body as any;
    const keywords = [
      ...(body.requirements || []),
      body.role || '',
      body.company || '',
    ].filter(Boolean).map((k: string) => k.trim()).filter((k: string) => k.length > 0);

    const allMatched: string[] = [];
    const allExpanded: string[] = [];
    const allPrereqs: string[] = [];
    const allDecks: string[] = [];
    const allPaths: string[] = [];

    for (const kw of keywords) {
      const { tiers, context } = await neo4jBuildKeywordTiers(kw);
      allMatched.push(...context.matchedConcepts);
      allExpanded.push(...context.expandedConcepts);
      allPrereqs.push(...tiers.prerequisiteKeywords);
      allDecks.push(...context.deckHints);
      allPaths.push(...(context.paths?.map(p => `${kw} -> ${p.relType} -> ${p.to}`) || []));
    }

    return {
      matchedConcepts: [...new Set(allMatched)],
      expandedConcepts: [...new Set(allExpanded)],
      prerequisites: [...new Set(allPrereqs)],
      relatedModules: [...new Set(allDecks)],
      deckHints: [...new Set(allDecks)],
      graphPaths: [...new Set(allPaths)],
      candidateCardIds: [],
    };
  });

  // ── Card Similarity Graph ──

  /** Full rebuild: compute all card similarity edges from scratch */
  app.post('/api/graph/similarity/rebuild', async () => {
    const result = await rebuildAllCardSimilarities();
    return result;
  });

  /** Upsert similarity for a single card (used after card import/update) */
  app.post('/api/graph/similarity/upsert', async (req) => {
    const { cardId } = req.body as any;
    if (!cardId) return { error: 'cardId required' };
    const result = await upsertCardSimilarity(cardId);
    return result;
  });

  /** Get similar cards for a given card */
  app.get('/api/graph/similarity/:cardId', async (req) => {
    const { cardId } = req.params as any;
    const cards = await getSimilarCards(cardId);
    return { cardId, similarCards: cards };
  });

  /** Batch expand: given seed cardIds, find similar cards via graph */
  app.post('/api/graph/similarity/expand', async (req) => {
    const { cardIds, expandPerCard } = req.body as any;
    if (!cardIds?.length) return { expandedCardIds: [] };
    const expanded = await expandCardIdsViaSimilarity(cardIds, expandPerCard || 5);
    return { expandedCardIds: expanded };
  });

  /** Graph stats — card nodes + similarity edges */
  app.get('/api/graph/similarity/stats', async () => {
    return await getSimilarityGraphStats();
  });
}
