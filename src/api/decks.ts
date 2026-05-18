import { apiGet } from './client';

export interface DeckStats {
  total: number;
  newCount: number;
  dueCount: number;
  dailyLimit: number;
  learningCount: number;
  reviewCount: number;
  relearningCount: number;
  favoritedCount: number;
}

export interface DeckItem {
  id: string;
  name: string;
  type: string;
  sortOrder: number;
  stats: DeckStats;
}

export interface DecksResponse {
  decks: DeckItem[];
}

export async function getDecks(): Promise<DecksResponse> {
  return apiGet<DecksResponse>('/decks');
}

export async function getDeckStats(deckId: string): Promise<DeckStats> {
  return apiGet<DeckStats>(`/decks/${deckId}/stats`);
}

export async function getDashboard(): Promise<any> {
  return apiGet('/dashboard');
}
