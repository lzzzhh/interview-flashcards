// src/api/cards.ts — 卡片 CRUD API
import { apiGet, apiPost, apiPatch, apiDelete } from './client';
import type { CardDTO, DeckCardsResponse } from './types';

export function getDeckCards(deckId: string, limit?: number, offset?: number): Promise<DeckCardsResponse> {
  const params = new URLSearchParams();
  if (limit != null) params.set('limit', String(limit));
  if (offset != null) params.set('offset', String(offset));
  params.set('includeProgress', 'true');
  const qs = params.toString();
  return apiGet<DeckCardsResponse>(`/decks/${encodeURIComponent(deckId)}/cards?${qs}`);
}

export function createCard(data: Partial<CardDTO> & { deckId: string }): Promise<CardDTO> {
  return apiPost<CardDTO>('/cards', data);
}

export function updateCard(cardId: string, data: Partial<CardDTO>): Promise<CardDTO> {
  return apiPatch<CardDTO>(`/cards/${cardId}`, data);
}

export function deleteCard(cardId: string): Promise<void> {
  return apiDelete<void>(`/cards/${cardId}`);
}
