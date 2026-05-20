// src/api/study.ts — 学习队列 API
import { apiGet } from './client';
import type { StudyQueueResponse } from './types';

export function getStudyQueue(deckId: string, mode: 'new' | 'review'): Promise<StudyQueueResponse> {
  return apiGet<StudyQueueResponse>(`/study/queue?deckId=${encodeURIComponent(deckId)}&mode=${mode}`);
}
