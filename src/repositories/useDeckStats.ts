import { useState, useEffect } from 'react';
import { apiGet } from '../api/client';
import type { DeckDTO, DecksResponse } from '../api/types';
import { agentCards } from '../data/agent';
import { deepLearningCards } from '../data/deep-learning';
import { jargonCards } from '../data/jargon';
import { leetcodeHot100 } from '../data/leetcode-hot100';
import { llmCards } from '../data/llm';
import { machineLearningCards } from '../data/machine-learning';
import { statisticsCards } from '../data/statistics';
import { vibeCodingCards } from '../data/vibe-coding';
import { workplaceCards } from '../data/workplace';
import { getModuleDailyLimit, loadCustomCards, loadCustomDecks } from '../utils/customDecks';
import { getStudyModeNewLimit } from '../utils/studyModeConfig';
import { loadProgress } from '../utils/storage';

const REVIEW_STATES = new Set(['learning', 'review', 'relearning']);

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
    mastered += (s as any).masteredCount ?? 0;
    relearning += s.relearningCount;
    moduleTotals[deck.id] = s.total;
    moduleDue[deck.id] = s.dueCount;
  }

  return { totalCards, newCards, dueCards, learningCount, mastered, relearning, masterPercent: totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0, moduleTotals, moduleDue };
}

const FALLBACK_TOTALS: Record<string, number> = {
  leetcode: leetcodeHot100.length,
  statistics: statisticsCards.length,
  'machine-learning': machineLearningCards.length,
  'deep-learning': deepLearningCards.length,
  llm: llmCards.length,
  agent: agentCards.length,
  jargon: jargonCards.length,
  workplace: workplaceCards.length,
  'vibe-coding': vibeCodingCards.length,
  java: 0,
};

function getLocalCustomDecks(): DeckDTO[] {
  const now = Date.now();
  return loadCustomDecks().map((deck, index) => {
    const progress = loadProgress(deck.id);
    const cards = loadCustomCards(deck.id).map((card) => ({
      ...card,
      sm2: progress.sm2[card.id] ? { ...card.sm2, ...progress.sm2[card.id] } : card.sm2,
      favorited: card.favorited || progress.favorited.includes(card.id),
    }));
    const newCount = cards.filter((card) => !card.sm2.state || card.sm2.state === 'new').length;
    const learningCount = cards.filter((card) => card.sm2.state === 'learning').length;
    const reviewCount = cards.filter((card) => card.sm2.state === 'review').length;
    const relearningCount = cards.filter((card) => card.sm2.state === 'relearning').length;
    const masteredCount = cards.filter((card) => card.sm2.state === 'mastered').length;
    const dueCount = cards.filter((card) => REVIEW_STATES.has(card.sm2.state) && card.sm2.nextReview <= now).length;
    const favoritedCount = cards.filter((card) => card.favorited).length;

    return {
      id: deck.id,
      name: deck.name,
      type: 'custom' as const,
      icon: deck.icon,
      sortOrder: 1000 + index,
      stats: {
        total: cards.length,
        newCount,
        learningCount,
        reviewCount,
        relearningCount,
        masteredCount,
        dueCount,
        favoritedCount,
        dailyLimit: getStudyModeNewLimit(deck.id, getModuleDailyLimit(deck.id)),
      },
    };
  });
}

function mergeLocalCustomDecks(decks: DeckDTO[]): DeckDTO[] {
  const byId = new Map(decks.map((deck) => [deck.id, deck]));
  for (const deck of getLocalCustomDecks()) byId.set(deck.id, deck);
  return Array.from(byId.values())
    .map((deck) => ({
      ...deck,
      stats: {
        ...deck.stats,
        dailyLimit: getStudyModeNewLimit(deck.id, getModuleDailyLimit(deck.id)),
      },
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function useDecks(): { decks: DeckDTO[]; totals: Record<string, number>; loading: boolean } {
  const [decks, setDecks] = useState<DeckDTO[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>(FALLBACK_TOTALS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const applyFallback = () => {
      const fallbackDecks = mergeLocalCustomDecks(
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
            masteredCount: 0,
            dueCount: 0,
            favoritedCount: 0,
            dailyLimit: getStudyModeNewLimit(id, getModuleDailyLimit(id)),
          },
        }))
      );
      setDecks(fallbackDecks);
      const next: Record<string, number> = {};
      for (const d of fallbackDecks) next[d.id] = d.stats.total;
      setTotals(next);
    };

    apiGet<DecksResponse>('/decks')
      .then((data) => {
        if (!data.decks || data.decks.length === 0) {
          applyFallback();
          return;
        }
        const mergedDecks = mergeLocalCustomDecks(data.decks);
        setDecks(mergedDecks);
        const next: Record<string, number> = {};
        for (const d of mergedDecks) next[d.id] = d.stats.total;
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
