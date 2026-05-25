// backend/src/services/search/card-concept-matcher.ts
// Lightweight runtime card → concept matching using graph aliases.
// Matches card fields (title/titleCn/tags/searchKeywords/question/answer)
// against graph node aliases and searchAliases to infer matchedConcepts.

import { conceptGraphLookup, getConceptEquivalents } from './concept-graph';

export interface MatchedConcept {
  conceptId: string;
  canonical: string;
  matchSource: 'title' | 'titleCn' | 'tags' | 'searchKeywords' | 'question' | 'answer' | 'graphAlias';
  matchedAlias: string;
  weight: number; // 0-1 confidence
}

export interface CardFields {
  cardId: string;
  title?: string;
  titleCn?: string;
  tags?: string[];
  searchKeywords?: string[];
  question?: string;
  answer?: string;
}

// ── All known graph aliases indexed for fast lookup ──
let aliasToConcept: Map<string, { id: string; canonical: string }> | null = null;

function buildAliasIndex() {
  if (aliasToConcept) return aliasToConcept;
  aliasToConcept = new Map();
  // We'll build lazily from conceptGraphLookup on known concepts
  // For now, use a cache that populates on demand
  return aliasToConcept;
}

// Cache: conceptId → all equivalent terms
const equivCache = new Map<string, Set<string>>();

function getCachedEquivalents(conceptId: string): Set<string> {
  if (equivCache.has(conceptId)) return equivCache.get(conceptId)!;
  const equivs = getConceptEquivalents(conceptId);
  const terms = new Set([...equivs.aliases, ...equivs.equivalentTerms].map(t => t.toLowerCase()));
  equivCache.set(conceptId, terms);
  return terms;
}

/** Match card fields against all graph concepts */
export function matchCardToConcepts(card: CardFields): MatchedConcept[] {
  // Gather all card text
  const fields: Array<{ source: MatchedConcept['matchSource']; text: string[] }> = [];
  if (card.title) fields.push({ source: 'title', text: [card.title] });
  if (card.titleCn) fields.push({ source: 'titleCn', text: [card.titleCn] });
  if (card.tags) fields.push({ source: 'tags', text: card.tags });
  if (card.searchKeywords) fields.push({ source: 'searchKeywords', text: card.searchKeywords });
  if (card.question) fields.push({ source: 'question', text: [card.question] });
  if (card.answer) fields.push({ source: 'answer', text: [card.answer] });

  const allText = fields.flatMap(f => f.text).join(' ').toLowerCase();
  const matched: Map<string, MatchedConcept> = new Map();

  // Try matching each field against known graph concepts
  // We iterate graph concepts via lookup on card text tokens
  const tokens = new Set(allText.split(/[\s,，。/、();]+/).filter(t => t.length >= 2));

  for (const token of tokens) {
    const node = conceptGraphLookup(token);
    if (!node) continue;
    // Find which field matched
    for (const f of fields) {
      const fieldText = f.text.join(' ').toLowerCase();
      if (fieldText.includes(token.toLowerCase())) {
        const key = node.id;
        if (!matched.has(key)) {
          matched.set(key, {
            conceptId: node.id,
            canonical: node.canonical,
            matchSource: f.source,
            matchedAlias: token,
            weight: 0.8,
          });
        }
      }
    }
  }

  return [...matched.values()];
}

/** Match a list of card results to concepts (for eval precision) */
export function matchResultsToConcepts(cards: CardFields[]): Map<string, MatchedConcept[]> {
  const result = new Map<string, MatchedConcept[]>();
  for (const card of cards) {
    result.set(card.cardId, matchCardToConcepts(card));
  }
  return result;
}

/** Check if a card matches a given concept (via graph aliases) */
export function cardMatchesConcept(card: CardFields, conceptCanonical: string): boolean {
  const allText = [
    card.title, card.titleCn,
    ...(card.tags || []), ...(card.searchKeywords || []),
    card.question, card.answer,
  ].filter(Boolean).join(' ').toLowerCase();

  const node = conceptGraphLookup(conceptCanonical);
  if (!node) return allText.includes(conceptCanonical.toLowerCase());

  const equivTerms = getCachedEquivalents(node.id);
  for (const term of equivTerms) {
    if (allText.includes(term.toLowerCase())) return true;
  }
  return false;
}

/** Get all matched concept IDs for a card (for eval mustMatchAny) */
export function getMatchedConceptIds(card: CardFields): string[] {
  const matched = matchCardToConcepts(card);
  return matched.map(m => m.conceptId);
}
