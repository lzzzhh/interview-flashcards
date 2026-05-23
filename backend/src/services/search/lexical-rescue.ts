// backend/src/services/search/lexical-rescue.ts
// v8-parity: Strict Lexical Rescue — REJECTED (2026-05-23)
// See docs/v8-llm-rewrite-ablation-rejected.md
// - Rank 16–30 (not already in top 15)
// - vectorScore == 0 or very low (< 0.03)
// - Strong keywordScore (> 0.35) OR strong fieldBoost (> 0.30) OR title/exact match
// - Same deck as targetDecks (if target specified)
// - Not tag-only match
// - Intent confidence >= 0.75
// - Max boost 0.05 per candidate (conservative)
// - Max 3 rescues per query

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
  title?: string;
  searchKeywords?: string;
  tags?: string[];
}

const MAX_RESCUE_BOOST = 0.05;
const MAX_RESCUES_PER_QUERY = 3;
const RESCUE_RANK_MIN = 16;
const RESCUE_RANK_MAX = 30;

export function applyLexicalRescue(
  results: any[],
  understanding: QueryUnderstanding,
): { hits: any[]; rescued: number } {
  if (results.length < RESCUE_RANK_MIN) return { hits: results, rescued: 0 };
  if (understanding.confidence < 0.75) return { hits: results, rescued: 0 };

  const targetDeckSet = new Set(understanding.targetDecks);
  const queryTerms = understanding.coreConcepts
    .flatMap(c => c.split(/[，,、\s]+/))
    .filter(t => t.length > 0)
    .map(t => t.toLowerCase());

  const rescued = [...results];
  let rescueCount = 0;

  for (let i = RESCUE_RANK_MIN - 1; i < Math.min(RESCUE_RANK_MAX, results.length); i++) {
    if (rescueCount >= MAX_RESCUES_PER_QUERY) break;

    const r = results[i];
    const sb = r.scoreBreakdown;

    const vectorScore = sb?.vectorScore ?? 0;
    const keywordScore = sb?.keywordScore ?? 0;
    const fieldBoost = sb?.fieldBoost ?? 0;
    const deckId = r.deckId || '';
    const matchType = r.matchType || '';

    // Condition 1: vector is zero or very low
    if (vectorScore > 0.03) continue;

    // Condition 2: lexical signal must be strong
    const hasLexicalSignal =
      keywordScore > 0.35 ||
      fieldBoost > 0.30 ||
      (r.title && queryTerms.some(t => r.title.toLowerCase().includes(t)));

    if (!hasLexicalSignal) continue;

    // Condition 3: same target deck
    if (targetDeckSet.size > 0 && deckId && !targetDeckSet.has(deckId)) continue;

    // Condition 4: not tag-only
    if (matchType === 'tag' && keywordScore < 0.2) continue;

    // Compute conservative boost (max 0.05)
    let boost = 0;
    if (keywordScore > 0.35) boost += 0.02;
    if (fieldBoost > 0.30) boost += 0.02;
    if (vectorScore === 0) boost += 0.01; // extra for complete blind spot

    boost = Math.min(boost, MAX_RESCUE_BOOST);

    if (boost > 0) {
      rescued[i] = {
        ...r,
        score: r.score + boost,
        _rescued: true,
        _rescueBoost: boost,
        _rescueReason: `vector=${vectorScore.toFixed(3)} kw=${keywordScore.toFixed(3)} fb=${fieldBoost.toFixed(3)}`,
      };
      rescueCount++;
    }
  }

  // Re-sort
  rescued.sort((a: any, b: any) => b.score - a.score);
  return { hits: rescued, rescued: rescueCount };
}

/** Strict rescue: for ablation "rescue-strict" config */
export function applyStrictRescue(
  results: any[],
  understanding: QueryUnderstanding,
): { hits: any[]; rescued: number } {
  return applyLexicalRescue(results, understanding);
}
