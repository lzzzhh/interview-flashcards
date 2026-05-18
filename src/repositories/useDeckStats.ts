import { useState, useEffect } from 'react';
import { apiGet } from '../api/client';

interface DeckStats {
  total: number;
  newCount: number;
  dueCount: number;
  dailyLimit: number;
  learningCount: number;
  reviewCount: number;
  relearningCount: number;
  favoritedCount: number;
}

interface DeckItem {
  id: string;
  name: string;
  type: string;
  sortOrder: number;
  stats: DeckStats;
}

interface DecksResponse { decks: DeckItem[]; }

const FALLBACK_TOTALS: Record<string, number> = {
  leetcode: 100, statistics: 199, 'machine-learning': 171, 'deep-learning': 32,
  llm: 37, agent: 26, jargon: 45, workplace: 76, 'vibe-coding': 23,
};

export function useDeckStats(): { totals: Record<string, number>; decks: DeckItem[]; loading: boolean } {
  const [totals, setTotals] = useState<Record<string, number>>(FALLBACK_TOTALS);
  const [decks, setDecks] = useState<DeckItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<DecksResponse>('/decks')
      .then((data) => {
        setDecks(data.decks);
        const next: Record<string, number> = {};
        for (const d of data.decks) next[d.id] = d.stats.total;
        setTotals(next);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { totals, decks, loading };
}

/** @deprecated 使用 useDeckStats */
export const useDeckTotals = useDeckStats;
