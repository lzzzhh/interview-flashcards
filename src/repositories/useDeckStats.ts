import { useState, useEffect } from 'react';
import { apiGet } from '../api/client';
import type { DeckDTO, DecksResponse } from '../api/types';

/** 从 decks 数据计算统计汇总 */
export function deriveGlobalStats(decks: DeckDTO[]) {
  let totalCards = 0;
  let newCards = 0;
  let dueCards = 0;
  let learningCount = 0;
  let mastered = 0;
  let relearning = 0;
  const moduleTotals: Record<string, number> = {};
  const moduleDue: Record<string, number> = {};

  for (const deck of decks) {
    const s = deck.stats;
    totalCards += s.total;
    newCards += s.newCount;
    dueCards += s.dueCount;
    learningCount += s.learningCount;
    mastered += s.reviewCount; // state=review 视为已掌握
    relearning += s.relearningCount;
    moduleTotals[deck.id] = s.total;
    moduleDue[deck.id] = s.dueCount;
  }

  return { totalCards, newCards, dueCards, learningCount, mastered, relearning, masterPercent: totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0, moduleTotals, moduleDue };
}

const FALLBACK_TOTALS: Record<string, number> = {
  leetcode: 100, statistics: 199, 'machine-learning': 171, 'deep-learning': 32,
  llm: 37, agent: 26, jargon: 45, workplace: 76, 'vibe-coding': 23,
};

export function useDecks(): { decks: DeckDTO[]; totals: Record<string, number>; loading: boolean } {
  const [decks, setDecks] = useState<DeckDTO[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>(FALLBACK_TOTALS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const applyFallback = () => {
      setTotals(FALLBACK_TOTALS);
      setDecks(
        Object.entries(FALLBACK_TOTALS).map(([id, total]) => ({
          id,
          name: id,
          type: 'builtin' as const,
          sortOrder: 0,
          stats: {
            total,
            newCount: total,
            learningCount: 0,
            reviewCount: 0,
            relearningCount: 0,
            dueCount: 0,
            favoritedCount: 0,
            dailyLimit: 20,
          },
        }))
      );
    };

    apiGet<DecksResponse>('/decks')
      .then((data) => {
        if (!data.decks || data.decks.length === 0) {
          applyFallback();
          return;
        }
        setDecks(data.decks);
        const next: Record<string, number> = {};
        for (const d of data.decks) next[d.id] = d.stats.total;
        setTotals(next);
      })
      .catch(() => applyFallback())
      .finally(() => setLoading(false));
  }, []);

  return { decks, totals, loading };
}

/** @deprecated 使用 useDecks */
export const useDeckTotals = useDecks;
/** @deprecated 使用 useDecks */
export const useDeckStats = useDecks;
