// ============================================================
// src/hooks/useProgress.ts — 进度统计
// ============================================================

import { useMemo } from 'react';
import type { FlashCard, StoredStats } from '../types';
import { loadStats } from '../utils/storage';

export interface ProgressStats {
  total: number;
  mastered: number;
  pending: number;
  masteredPercent: number;
  todayReviewed: number;
  streak: number;
  byCategory: Record<string, { total: number; mastered: number }>;
  byDifficulty: Record<string, { total: number; mastered: number }>;
}

export function useProgress(cards: FlashCard[]): ProgressStats {
  return useMemo(() => {
    const mastered = cards.filter((c) => c.sm2.repetitions > 0).length;
    const total = cards.length;
    const pending = total - mastered;

    // Today's date string
    const today = new Date().toISOString().slice(0, 10);

    // Load stats for streak
    const stats: StoredStats = loadStats();
    const sessions = stats.sessions ?? [];

    // Calculate streak
    let streak = 0;
    const sortedDates = sessions
      .map((s) => s.date)
      .filter((d) => d !== today)
      .sort()
      .reverse();
    const uniqueDates = [...new Set(sortedDates)];

    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1); // start from yesterday
    for (const dateStr of uniqueDates) {
      const expected = checkDate.toISOString().slice(0, 10);
      if (dateStr === expected) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dateStr < expected) {
        break;
      }
    }
    // If reviewed today, add 1
    const todaySession = sessions.find((s) => s.date === today);
    if (todaySession && todaySession.cardsReviewed > 0) {
      streak++;
    }

    const todayReviewed = todaySession?.cardsReviewed ?? 0;

    // By difficulty
    const byDifficulty: Record<string, { total: number; mastered: number }> = {};
    for (const card of cards) {
      const d = 'difficulty' in card ? card.difficulty ?? 'unknown' : 'unknown';
      if (!byDifficulty[d]) byDifficulty[d] = { total: 0, mastered: 0 };
      byDifficulty[d].total++;
      if (card.sm2.repetitions > 0) byDifficulty[d].mastered++;
    }

    return {
      total,
      mastered,
      pending,
      masteredPercent: total > 0 ? Math.round((mastered / total) * 100) : 0,
      todayReviewed,
      streak,
      byCategory: {},
      byDifficulty,
    };
  }, [cards]);
}
