// src/api/searchApi.ts — AI 搜索 API client
import { apiGet, apiPost } from './client';

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

export async function hybridSearch(query: string, topK?: number, deckIds?: string[], minScore?: number): Promise<HybridSearchResponse> {
  return apiPost('/search/hybrid', { query, topK: topK || 10, deckIds, minScore });
}

export async function keywordSearch(q: string, limit?: number): Promise<{ results: any[]; total: number }> {
  return apiGet(`/search/keyword?q=${encodeURIComponent(q)}&limit=${limit || 10}`);
}
