// backend/src/services/search/lexical-rescue.ts
// v8: Lexical Rescue — boost rank 16-30 candidates with vector=0 but strong keyword/field match
//
// Only rescues candidates that are:
// - Rank 16-30
// - vectorScore = 0 or very low
// - Have strong keywordScore or fieldBoost
// - Same deck as targetDecks
// - Not noisy tag-only hits

import type { QueryUnderstanding } from './query-understanding';

interface RescueCandidate {
  cardId: string;
  rank: number;
  score: number;
  deckId: string;
  matchType: string;
  vectorScore?: number;
  keywordScore?: number;
  fieldBoost?: number;
  tags?: string[];
}

const MAX_RESCUE_BOOST = 0.15;
const RESCUE_RANK_MIN = 16;
const RESCUE_RANK_MAX = 30;

export function applyLexicalRescue(
  results: any[],
  understanding: QueryUnderstanding,
): any[] {
  if (results.length < RESCUE_RANK_MIN) return results;

  const targetDeckSet = new Set(understanding.targetDecks);
  const rescued = [...results];

  for (let i = RESCUE_RANK_MIN - 1; i < Math.min(RESCUE_RANK_MAX, results.length); i++) {
    const r = results[i];
    const sb = r.scoreBreakdown;

    // Check rescue conditions
    const vectorScore = sb?.vectorScore ?? 0;
    const keywordScore = sb?.keywordScore ?? 0;
    const fieldBoost = sb?.fieldBoost ?? 0;
    const deckId = r.deckId || '';

    // Condition 1: vector is low or zero
    if (vectorScore > 0.05) continue;

    // Condition 2: keyword or field signal is strong
    const hasLexicalSignal = keywordScore > 0.3 || fieldBoost > 0.2;
    if (!hasLexicalSignal) continue;

    // Condition 3: deck matches target (if targets specified)
    if (targetDeckSet.size > 0 && !targetDeckSet.has(deckId)) continue;

    // Condition 4: not a noisy tag-only hit
    if (r.matchType === 'tag' && keywordScore < 0.2) continue;

    // Compute rescue boost
    let boost = 0;
    if (keywordScore > 0.5) boost += 0.08;
    else if (keywordScore > 0.3) boost += 0.05;
    if (fieldBoost > 0.4) boost += 0.05;
    else if (fieldBoost > 0.2) boost += 0.03;
    if (vectorScore === 0) boost += 0.02; // extra for complete vector blind spot

    boost = Math.min(boost, MAX_RESCUE_BOOST);

    if (boost > 0) {
      rescued[i] = { ...r, score: r.score + boost, _rescued: true, _rescueBoost: boost };
    }
  }

  // Re-sort
  rescued.sort((a: any, b: any) => b.score - a.score);
  return rescued;
}
