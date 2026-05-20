// src/api/reviews.ts — 评分 API
import { apiPost } from './client';
import type { ReviewResponse } from './types';

export function rateCard(cardId: string, rating: number): Promise<ReviewResponse> {
  return apiPost<ReviewResponse>('/reviews', { cardId, rating });
}
