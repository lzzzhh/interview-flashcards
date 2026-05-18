import { apiGet } from './client';

export interface DeckInfo {
  id: string;
  name: string;
  type: string;
  sortOrder: number;
  total: number;
  newCount: number;
  dueCount: number;
}

export async function getDecks(): Promise<DeckInfo[]> {
  return apiGet('/decks');
}

export async function getDeckStats(deckId: string): Promise<any> {
  return apiGet(`/decks/${deckId}/stats`);
}

export async function getDashboard(): Promise<any> {
  return apiGet('/dashboard');
}
