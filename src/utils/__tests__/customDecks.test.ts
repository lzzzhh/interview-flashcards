import { beforeEach, describe, expect, it } from 'vitest';
import {
  createCustomDeck,
  deleteCustomDeck,
  getAllModuleLimits,
  getAllModuleReviewLimits,
  getModuleDailyLimit,
  getModuleDailyReviewLimit,
  loadCustomCards,
  loadDeletedCustomDecks,
  loadUnassignedCards,
  restoreCustomDeck,
  saveCustomCards,
  setModuleDailyLimit,
  setModuleDailyReviewLimit,
} from '../customDecks';
import { createDefaultSM2 } from '../sm2';
import type { QACard } from '../../types';

describe('custom deck daily limits', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('preserves explicit zero daily limits', () => {
    setModuleDailyLimit('leetcode', 0);
    setModuleDailyReviewLimit('leetcode', 0);

    expect(getModuleDailyLimit('leetcode')).toBe(0);
    expect(getModuleDailyReviewLimit('leetcode')).toBe(0);
    expect(getAllModuleLimits().leetcode).toBe(0);
    expect(getAllModuleReviewLimits().leetcode).toBe(0);
  });

  it('soft deletes a custom deck and moves cards to unassigned', () => {
    const deck = createCustomDeck('测试牌组');
    const card: QACard = {
      id: 'card-1',
      category: deck.id as QACard['category'],
      question: 'Q',
      answer: 'A',
      tags: [],
      sm2: createDefaultSM2(),
      favorited: false,
    };
    saveCustomCards(deck.id, [card]);

    deleteCustomDeck(deck.id);

    expect(loadCustomCards(deck.id)).toEqual([]);
    expect(loadUnassignedCards()).toHaveLength(1);
    expect(loadDeletedCustomDecks()[0].deck.id).toBe(deck.id);
  });

  it('restores a soft deleted custom deck with its cards', () => {
    const deck = createCustomDeck('测试牌组');
    saveCustomCards(deck.id, [{
      id: 'card-1',
      category: deck.id as QACard['category'],
      question: 'Q',
      answer: 'A',
      tags: [],
      sm2: createDefaultSM2(),
      favorited: false,
    }]);

    deleteCustomDeck(deck.id);
    expect(restoreCustomDeck(deck.id)).toBe(true);

    expect(loadCustomCards(deck.id)).toHaveLength(1);
    expect(loadUnassignedCards()).toHaveLength(0);
    expect(loadDeletedCustomDecks()).toHaveLength(0);
  });
});
