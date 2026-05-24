// backend/src/services/search/eval/search-eval-types.ts
export interface EvalCase {
  id: string;
  query: string;
  expectedUnderstanding: {
    intent: string;
    topic: string;
    deckHint?: string;
    parentCategory?: string;
  };
  rewrite: {
    mustInclude: string[];
    mustNotInclude: string[];
  };
  retrieval: {
    maxMergedCandidates?: number;
    minFinalResults?: number;
    maxFinalResults?: number;
  };
  ranking: {
    topK: number;
    mustMatchAny: string[];
    minPrecision: number;
  };
}

export interface EvalResult {
  id: string;
  pass: boolean;
  failures: string[];
  understanding: {
    expected: { intent: string; topic: string; deckHint?: string; parentCategory?: string };
    actual: { intent: string; topic: string; deckHint?: string; parentCategory?: string };
    passed: boolean;
  };
  rewrite: { mustIncludeFailed: string[]; mustNotIncludeFailed: string[] };
  retrieval: { mergedCandidates?: number; finalResults: number; retrievalPassed: boolean };
  ranking: { topK: number; matchedCount: number; precision: number; rankingPassed: boolean };
}
