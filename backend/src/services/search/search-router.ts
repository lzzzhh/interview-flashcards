// backend/src/services/search/search-router.ts
// v8: Intent-based search routing
//
// Routes queries to the right search strategy based on QueryUnderstanding.
// Preserves v7 hybridSearch as the default for exact_lookup.

import { hybridSearch } from './hybrid-search';
import type { QueryUnderstanding, FirstPassSummary } from './query-understanding';
import { understandQuery, summarizeFirstPass } from './query-understanding';

// ── Smart Search Input ──

export interface SmartSearchInput {
  query: string;
  deckIds?: string[];
  maxResults?: number;
  minScore?: number;
  candidateLimit?: number;
  filters?: { difficulty?: string[]; onlyDue?: boolean };
  /** LLM provider for intent classification */
  llmProvider?: any;
  /** Force disable LLM (for ablation) */
  disableLLM?: boolean;
}

// ── Main Entry ──

export async function smartSearch(input: SmartSearchInput): Promise<{
  results: any[];
  understanding: QueryUnderstanding;
  firstPassSummary: FirstPassSummary;
  llmCalled: boolean;
  route: string;
}> {
  const { query, llmProvider, disableLLM } = input;
  let llmCalled = false;

  // 1. First pass: baseline hybridSearch
  const firstPass = await hybridSearch({
    query,
    deckIds: input.deckIds,
    maxResults: input.maxResults || 50,
    minScore: input.minScore || 0.30,
    candidateLimit: input.candidateLimit || 300,
    filters: input.filters,
  });

  const firstPassSummary = summarizeFirstPass(firstPass);

  // 2. Query understanding
  const understanding = await understandQuery(
    query,
    firstPassSummary,
    disableLLM ? undefined : llmProvider,
  );
  if (understanding.source === 'rule+llm') llmCalled = true;

  // 3. Route by intent
  const route = understanding.intent;

  // Study plan → delegate to learningPlanSearch
  if (understanding.needsStudyPlan) {
    try {
      const { learningPlanSearch } = await import('./hybrid-search');
      const plan = await learningPlanSearch({ query, deckIds: input.deckIds, filters: input.filters });
      return {
        results: [{ __studyPlan: plan }],
        understanding,
        firstPassSummary,
        llmCalled,
        route: 'study_plan',
      };
    } catch {
      // fall through to rewrite
    }
  }

  // Diagnostic, comparison, conceptual with low confidence → rewrite
  if (understanding.needsRewrite && (
    understanding.intent === 'diagnostic' ||
    understanding.intent === 'comparison' ||
    (understanding.intent === 'conceptual_search' && firstPassSummary.top1Score < 0.40) ||
    understanding.intent === 'interview_answer'
  )) {
    try {
      const { rewriteAssistedSearch } = await import('./query-rewriter');
      const rewriteResults = await rewriteAssistedSearch(query, understanding, firstPass, input);
      if (rewriteResults.length > 0) {
        return {
          results: rewriteResults,
          understanding,
          firstPassSummary,
          llmCalled,
          route: 'rewrite_assisted',
        };
      }
    } catch {
      // fall through to first pass
    }
  }

  // Ambiguous: conservative first pass
  if (understanding.intent === 'ambiguous') {
    return {
      results: firstPass,
      understanding,
      firstPassSummary,
      llmCalled,
      route: 'ambiguous_conservative',
    };
  }

  // Default: first pass with rescue
  try {
    const { applyLexicalRescue } = await import('./lexical-rescue');
    const rescued = applyLexicalRescue(firstPass, understanding);
    return {
      results: rescued,
      understanding,
      firstPassSummary,
      llmCalled,
      route: 'default_rescue',
    };
  } catch {
    return {
      results: firstPass,
      understanding,
      firstPassSummary,
      llmCalled,
      route: 'default_fallback',
    };
  }
}
