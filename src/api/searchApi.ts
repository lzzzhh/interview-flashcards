// src/api/searchApi.ts — AI 搜索 API client
import { apiPost } from './client';

export interface SearchResult {
  cardId: string;
  title: string;
  deckId: string;
  deckName?: string;
  tags: string[];
  score: number;
  matchType: string;
  reason: string;
  due?: boolean;
  lapses?: number;
  snippet?: string;
}

export interface HybridSearchResponse {
  results: SearchResult[];
  total: number;
  debug?: {
    traceId?: string;
    timingMs?: Record<string, number>;
    request?: { rawQuery: string; maxResults: number; minScore: number; deckIds?: string[] };
    understanding?: { intent: string; source: string; confidence: number; topic: string; deckHint?: string; subtopics: string[]; constraints: any; validation: any };
    rewrite?: { rewrittenQuery: string; keywords: string[]; expandedKeywords: string[]; canonicalTopic?: string; dictionaryHit: boolean; rewriteSource: string };
    retrievalText?: { recallText: string; rerankText: string; rawQueryUsed: boolean };
    retrieval?: Record<string, { count: number; top: any[] }>;
    merge?: { beforeDedup: number; afterDedup: number; topCandidates: any[] };
    hydration?: { requested: number; hydrated: number; missing: string[] };
    filters?: { before: number; after: number; removed: any[] };
    rerank?: { profile: string; top: any[] };
    threshold?: { minScore: number; before: number; after: number; removed: any[] };
    final?: { returned: number; top: { cardId: string; title: string; score: number; explanation: string }[] };
    // Simple mode
    ms?: number; resultCount?: number; topScores?: any[];
  };
}

export interface HybridSearchParams {
  query: string;
  minScore?: number;
  maxResults?: number;
  candidateLimit?: number;
  deckIds?: string[];
}

export async function hybridSearch(params: HybridSearchParams): Promise<HybridSearchResponse> {
  return apiPost('/search/hybrid', params);
}

export interface LearningPlanCard {
  cardId: string;
  title: string;
  deckId: string;
  score: number;
  stage: string;
  stageIndex: number;
  snippet: string;
  state: string;
  priority: number;
  deckName: string;
  interval?: number;
}

export interface LearningPlanResponse {
  plan: {
    topic: string;
    stages: Record<string, LearningPlanCard[]>;
    totalCards: number;
    stageBalance: number;
  };
  total: number;
}

export interface LearningPlanParams {
  query: string;
  deckIds?: string[];
  filters?: Record<string, unknown>;
}

export async function fetchLearningPlan(params: LearningPlanParams): Promise<LearningPlanResponse> {
  return apiPost('/search/learning-plan', params);
}
