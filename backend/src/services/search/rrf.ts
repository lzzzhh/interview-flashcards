// backend/src/services/search/rrf.ts
// v8: Reciprocal Rank Fusion — lightweight experiment
//
// Merges multiple ranked lists using RRF: score = Σ 1/(k + rank_i)
// k=60 (standard). Useful when vector and keyword give different but complementary rankings.

interface RankedItem {
  cardId: string;
  rank: number;
}

/**
 * Merge multiple ranked lists using Reciprocal Rank Fusion.
 * @param rankedLists - array of ranked lists (each sorted, position 0 = rank 1)
 * @param k - RRF constant (default 60)
 * @param weights - optional per-list weights (default 1.0 each)
 */
export function reciprocalRankFusion(
  rankedLists: string[][],
  k: number = 60,
  weights?: number[],
): { cardId: string; rrfScore: number }[] {
  const scores = new Map<string, number>();

  for (let li = 0; li < rankedLists.length; li++) {
    const list = rankedLists[li];
    const w = weights ? weights[li] || 1.0 : 1.0;

    for (let rank = 0; rank < list.length; rank++) {
      const cardId = list[rank];
      const rrf = w / (k + rank + 1);
      scores.set(cardId, (scores.get(cardId) || 0) + rrf);
    }
  }

  return [...scores.entries()]
    .map(([cardId, rrfScore]) => ({ cardId, rrfScore }))
    .sort((a, b) => b.rrfScore - a.rrfScore);
}

/**
 * Compute RRF over multiple channel-specific rankings.
 * Channels: fts5, searchKeywords, vector (raw + normalized + concepts).
 */
export function computeChannelRRF(
  fts5Ids: string[],
  searchKeywordsIds: string[],
  vectorRawIds: string[],
  vectorNormalizedIds: string[],
  vectorConceptsIds: string[],
): { cardId: string; rrfScore: number }[] {
  return reciprocalRankFusion(
    [fts5Ids, searchKeywordsIds, vectorRawIds, vectorNormalizedIds, vectorConceptsIds],
    60,
    [1.0, 0.8, 0.6, 0.6, 0.5],
  );
}
