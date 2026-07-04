import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultSM2 } from '../sm2';
import { loadDeletedCards, restoreDeletedCard, softDeleteCard } from '../cardTrash';
import { createCustomDeck, loadCustomCards, saveCustomCards } from '../customDecks';
import type { QACard } from '../../types';

describe('card trash', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('soft deletes and restores a custom card', () => {
    const deck = createCustomDeck('卡片牌组');
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

    softDeleteCard(card);

    expect(loadCustomCards(deck.id)).toHaveLength(0);
    expect(loadDeletedCards()).toHaveLength(1);

    const restored = restoreDeletedCard(card.id);

    expect(restored?.id).toBe(card.id);
    expect(loadCustomCards(deck.id)).toHaveLength(1);
    expect(loadDeletedCards()).toHaveLength(0);
  });
});
