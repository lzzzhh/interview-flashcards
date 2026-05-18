import { apiGet } from '../api/client';

export interface DeckStats {
  total: number;
  newCount: number;
  learningCount: number;
  reviewCount: number;
  relearningCount: number;
  dueCount: number;
  favoritedCount: number;
  dailyLimit: number;
}

export interface DeckInfo {
  id: string;
  name: string;
  type: string;
  sortOrder: number;
  stats: DeckStats;
}

export interface DashboardData {
  totalCards: number;
  todayDue: number;
  todayNewAllowance: number;
  learningCount: number;
  recommended: { cardId: string; deckId: string; deckName: string; title: string; number?: number }[];
}

export async function getDecks(): Promise<DeckInfo[]> {
  const data = await apiGet<{ decks: DeckInfo[] }>('/decks');
  return data.decks;
}

export async function getDeckStats(deckId: string): Promise<DeckStats> {
  return apiGet<DeckStats>(`/decks/${deckId}/stats`);
}

export async function getDashboard(): Promise<DashboardData> {
  return apiGet<DashboardData>('/dashboard');
}
