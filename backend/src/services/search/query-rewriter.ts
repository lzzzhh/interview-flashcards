// backend/src/services/search/query-rewriter.ts
// v8: Rewrite-assisted recall second pass — REJECTED (2026-05-23)
// See docs/v8-llm-rewrite-ablation-rejected.md

import { hybridSearch } from './hybrid-search';
import type { QueryUnderstanding } from './query-understanding';

export interface RewriteResult {
  cardId: string;
  score: number;
  source: 'first_pass' | 'rewrite_raw' | 'rewrite_concept' | 'rewrite_expanded';
}

/**
 * Build search texts from QueryUnderstanding for multi-source recall.
 * Raw query + normalized + expanded queries + concepts.
 */
export function buildRewriteSearchTexts(
  rawQuery: string,
  understanding: QueryUnderstanding,
): string[] {
  const texts: string[] = [rawQuery];

  if (understanding.normalizedQuery && understanding.normalizedQuery !== rawQuery) {
    texts.push(understanding.normalizedQuery);
  }

  for (const eq of understanding.expandedQueries) {
    if (eq && !texts.includes(eq)) texts.push(eq);
  }

  // Concepts as a joined search text
  if (understanding.coreConcepts.length > 0) {
    const conceptText = understanding.coreConcepts.join(' ');
    if (!texts.includes(conceptText)) texts.push(conceptText);
  }

  return texts;
}

/**
 * Second-pass search using rewrite-assisted recall.
 * Keeps firstPass results and merges with rewrite results.
 */
export async function rewriteAssistedSearch(
  rawQuery: string,
  understanding: QueryUnderstanding,
  firstPass: any[],
  input: {
    deckIds?: string[];
    maxResults?: number;
    minScore?: number;
    candidateLimit?: number;
    filters?: { difficulty?: string[]; onlyDue?: boolean };
  },
): Promise<any[]> {
  const searchTexts = buildRewriteSearchTexts(rawQuery, understanding);

  // Run second pass with each search text
  const secondPassResults: Map<string, { cardId: string; score: number; source: string }> = new Map();

  for (const text of searchTexts.slice(1)) { // Skip rawQuery (already in firstPass)
    if (text === rawQuery) continue;

    try {
      const hits = await hybridSearch({
        query: text,
        deckIds: input.deckIds,
        maxResults: Math.min((input.maxResults || 50) + 30, 100),
        minScore: input.minScore || 0.25,
        candidateLimit: 500,
        filters: input.filters,
      });

      for (const h of hits) {
        const existing = secondPassResults.get(h.cardId);
        if (!existing || h.score > existing.score) {
          secondPassResults.set(h.cardId, {
            cardId: h.cardId,
            score: h.score,
            deckId: h.deckId || '',
            source: 'rewrite_expanded',
          });
        }
      }
    } catch {
      // skip failed channels
    }
  }

  // Merge: firstPass + secondPass
  // First pass entries always keep their original scores
  const merged = new Map<string, any>();
  for (const h of firstPass) {
    merged.set(h.cardId, { ...h, _source: 'first_pass' });
  }

  // Second pass entries only added if NOT in firstPass (discovery)
  for (const [cardId, sp] of secondPassResults) {
    if (!merged.has(cardId)) {
      merged.set(cardId, {
        cardId,
        title: cardId,
        deckId: sp.deckId || '',
        score: sp.score,
        matchType: 'hybrid',
        reason: '改写召回',
        tags: [],
        _source: sp.source,
      });
    }
  }

  // Sort by score desc
  const results = [...merged.values()].sort((a, b) => b.score - a.score);

  // Apply threshold and limit
  const minScore = input.minScore || 0.25;
  const maxResults = input.maxResults || 50;
  const filtered = minScore > 0 ? results.filter((r: any) => r.score >= minScore) : results;
  return filtered.slice(0, maxResults);
}
