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
