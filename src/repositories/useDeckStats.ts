// 牌组总数 — hook 方式，从 API 获取，无硬编码 fallback

import { useState, useEffect } from 'react';
import { apiGet } from '../api/client';

interface DeckStats {
  total: number;
  newCount: number;
  dueCount: number;
  dailyLimit: number;
  learningCount: number;
}

interface DeckResponse {
  id: string;
  name: string;
  type: string;
  sortOrder: number;
  stats: DeckStats;
}

interface DecksResponse {
  decks: DeckResponse[];
}

export function useDeckTotals(): { totals: Record<string, number>; loading: boolean } {
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<DecksResponse>('/decks')
      .then((data) => {
        const next: Record<string, number> = {};
        for (const d of data.decks) next[d.id] = d.stats.total;
        setTotals(next);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { totals, loading };
}

export function getDeckTotals(): Record<string, number> {
  return {};
}
