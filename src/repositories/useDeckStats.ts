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

export function useDeckStats(): { totals: Record<string, number>; decks: DeckItem[]; loading: boolean } {
  const [totals, setTotals] = useState<Record<string, number>>({});
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
