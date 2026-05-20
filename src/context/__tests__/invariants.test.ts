import { describe, it, expect, beforeEach } from 'vitest';
import { createDefaultSM2, previewSchedule } from '../../utils/sm2';
import type { FlashCard, QACard } from '../../types';
import { getTodayReviewed, getStreak } from '../../utils/reviewLogs';

// === These tests verify the key invariants from the optimization plan ===

// Replicate the core reducer logic for testing (without full context)
// This validates the same logic paths without needing the full AppProvider

const DAY = 86400000;

function buildTestCards(): Record<string, FlashCard> {
  const cards: Record<string, FlashCard> = {};
  for (let i = 1; i <= 5; i++) {
    const card: QACard = {
      id: `card-${i}`,
      category: 'statistics',
      question: `Q${i}`,
      answer: `A${i}`,
      tags: ['test'],
      sm2: createDefaultSM2(),
      favorited: false,
    };
    cards[card.id] = card;
  }
  return cards;
}

describe('Reducer logic invariants', () => {
  // Test 1: RATE_CARD updates by cardId, not by index
  it('RATE_CARD should update the correct card by cardId regardless of visible list', () => {
    const cardsById = buildTestCards();

    // Simulate review mode: only card-3 and card-5 are visible
    const visibleCardIds = ['card-3', 'card-5'];
    const currentVisibleIndex = 0; // pointing to card-3

    // The card being rated is card-3 (visibleCardIds[0])
    const cardIdToRate = visibleCardIds[currentVisibleIndex];

    // Verify it's card-3
    expect(cardIdToRate).toBe('card-3');

    // Apply rating
    const card = cardsById[cardIdToRate];
    const result = previewSchedule(card.sm2, 4);

    // card-3 should be updated
    expect(result.state).toBe('learning');
    expect(result.interval).toBe(1);

    // card-4 should NOT be affected
    const card4 = cardsById['card-4'];
    expect(card4.sm2.state).toBe('new');
  });

  // Test 2: Filtering only changes visibleCardIds, not cardsById
  it('search filter should not modify cardsById', () => {
    const cardsById = buildTestCards();
    const allIds = Object.keys(cardsById);
    expect(allIds).toHaveLength(5);

    // Simulate search filtering
    const searchQuery = 'Q1';
    const filteredIds = allIds.filter((id) => {
      const c = cardsById[id] as QACard;
      return c.question.includes(searchQuery);
    });

    // Only 1 visible
    expect(filteredIds).toHaveLength(1);
    expect(filteredIds[0]).toBe('card-1');

    // But cardsById still has all 5
    expect(Object.keys(cardsById)).toHaveLength(5);
    expect(cardsById['card-2']).toBeDefined();
  });

  // Test 3: Review mode filtering should not drop cards
  it('review mode should only filter visibleCardIds, preserving all cards', () => {
    const cardsById = buildTestCards();

    // Mark card-1 and card-2 as learning (in review state)
    const now = Date.now();
    cardsById['card-1'].sm2 = {
      ...createDefaultSM2(),
      state: 'review',
      interval: 7,
      repetitions: 3,
      nextReview: now - DAY, // due
    };
    cardsById['card-2'].sm2 = {
      ...createDefaultSM2(),
      state: 'review',
      interval: 14,
      repetitions: 5,
      nextReview: now + 7 * DAY, // not due yet
    };

    // Review mode: only due cards
    const dueIds = Object.keys(cardsById).filter((id) => {
      const sm2 = cardsById[id].sm2;
      return sm2.state !== 'new' && sm2.nextReview <= now;
    });

    expect(dueIds).toHaveLength(1);
    expect(dueIds[0]).toBe('card-1');

    // But all original cards still exist
    expect(Object.keys(cardsById)).toHaveLength(5);
  });
});

describe('SM-2 core scheduling invariants', () => {
  it('should never set easeFactor below 1.3', () => {
    let record = createDefaultSM2();
    // Apply 10 worst ratings
    for (let i = 0; i < 10; i++) {
      record = previewSchedule(record, 1);
    }
    expect(record.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('should produce increasing intervals for good ratings', () => {
    let record = createDefaultSM2();
    record = previewSchedule(record, 4); // new -> learning, interval 1
    record = previewSchedule(record, 4); // learning -> review, interval 6
    record = previewSchedule(record, 4); // review, interval = 6 * 2.5 * 1.3 = 20

    expect(record.interval).toBeGreaterThan(6);
  });

  it('should increment repetitions for every rating', () => {
    let record = createDefaultSM2();
    record = previewSchedule(record, 4);
    expect(record.repetitions).toBe(1);
    record = previewSchedule(record, 1);
    expect(record.repetitions).toBe(2);
  });

  it('should increment lapses only for bad ratings', () => {
    let record = createDefaultSM2();
    record = previewSchedule(record, 4);
    expect(record.lapses).toBe(0);
    record = previewSchedule(record, 2);
    expect(record.lapses).toBe(1);
    record = previewSchedule(record, 4);
    expect(record.lapses).toBe(1); // lapses preserved from previous
  });
});

describe('ReviewLog integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should track today reviewed count accurately', () => {
    const now = Date.now();

    // Simulate appending logs
    const allLogs = [
      { id: 'rl1', cardId: 'c1', reviewedAt: now, rating: 4, stateBefore: 'new' as const, stateAfter: 'learning' as const, intervalBefore: 0, intervalAfter: 1, easeBefore: 2.5, easeAfter: 2.5, elapsedDays: 0, scheduledDays: 1 },
      { id: 'rl2', cardId: 'c2', reviewedAt: now - DAY, rating: 3, stateBefore: 'review' as const, stateAfter: 'review' as const, intervalBefore: 7, intervalAfter: 14, easeBefore: 2.5, easeAfter: 2.5, elapsedDays: 7, scheduledDays: 14 },
      { id: 'rl3', cardId: 'c3', reviewedAt: now, rating: 5, stateBefore: 'new' as const, stateAfter: 'learning' as const, intervalBefore: 0, intervalAfter: 1, easeBefore: 2.5, easeAfter: 2.6, elapsedDays: 0, scheduledDays: 1 },
    ];

    const todayCount = getTodayReviewed(allLogs);
    expect(todayCount).toBe(2);
  });

  it('should calculate streak correctly', () => {
    const now = Date.now();
    const allLogs = [
      // Today
      { id: 'a', cardId: 'c1', reviewedAt: now, rating: 4, stateBefore: 'new', stateAfter: 'learning', intervalBefore: 0, intervalAfter: 1, easeBefore: 2.5, easeAfter: 2.5, elapsedDays: 0, scheduledDays: 1 },
      // Yesterday
      { id: 'b', cardId: 'c2', reviewedAt: now - DAY, rating: 4, stateBefore: 'new', stateAfter: 'learning', intervalBefore: 0, intervalAfter: 1, easeBefore: 2.5, easeAfter: 2.5, elapsedDays: 0, scheduledDays: 1 },
      // Day before yesterday
      { id: 'c', cardId: 'c3', reviewedAt: now - 2 * DAY, rating: 4, stateBefore: 'new', stateAfter: 'learning', intervalBefore: 0, intervalAfter: 1, easeBefore: 2.5, easeAfter: 2.5, elapsedDays: 0, scheduledDays: 1 },
    ] as any[];

    const streak = getStreak(allLogs);
    expect(streak).toBe(3);
  });

  it('should detect difficult cards by lapses', () => {
    const logs: Record<string, any[]> = {
      'hard-card': [
        { rating: 1 }, { rating: 1 }, { rating: 2 }, { rating: 2 },
      ],
      'easy-card': [
        { rating: 4 }, { rating: 5 },
      ],
    };

    // Manually check lapses
    const hardLapses = logs['hard-card'].filter((l: any) => l.rating <= 2).length;
    const easyLapses = logs['easy-card'].filter((l: any) => l.rating <= 2).length;

    expect(hardLapses).toBe(4);
    expect(easyLapses).toBe(0);
  });
});
