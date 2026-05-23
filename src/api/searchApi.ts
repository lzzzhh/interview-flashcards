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

export interface LearningPlanResponse {
  plan: {
    topic: string;
    stages: Record<string, {
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
    }[]>;
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
