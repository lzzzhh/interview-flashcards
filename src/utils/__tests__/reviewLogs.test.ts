import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  appendReviewLog,
  loadReviewLogs,
  saveReviewLogs,
  getAllLogs,
  getTodayReviewed,
  getStreak,
  getRecentAccuracy,
  getAverageRating,
  getDifficultCards,
  isReallyMastered,
} from '../reviewLogs';
import type { ReviewLog } from '../../types';

const MOCK_NOW = 1700000000000; // 2023-11-14
const DAY = 86400000;

function makeLog(overrides: Partial<ReviewLog> & { cardId: string; rating: number }): ReviewLog {
  return {
    id: `log-${Math.random()}`,
    cardId: overrides.cardId,
    reviewedAt: overrides.reviewedAt ?? MOCK_NOW,
    rating: overrides.rating,
    stateBefore: overrides.stateBefore ?? 'new',
    stateAfter: overrides.stateAfter ?? 'learning',
    intervalBefore: overrides.intervalBefore ?? 0,
    intervalAfter: overrides.intervalAfter ?? 1,
    easeBefore: overrides.easeBefore ?? 2.5,
    easeAfter: overrides.easeAfter ?? 2.5,
    elapsedDays: overrides.elapsedDays ?? 0,
    scheduledDays: overrides.scheduledDays ?? 1,
  };
}

describe('reviewLogs storage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should append and retrieve a log', () => {
    const log = makeLog({ cardId: 'card-1', rating: 4 });
    appendReviewLog(log);

    const logs = loadReviewLogs();
    expect(logs['card-1']).toHaveLength(1);
    expect(logs['card-1'][0].cardId).toBe('card-1');
  });

  it('should append multiple logs for the same card', () => {
    appendReviewLog(makeLog({ cardId: 'card-1', rating: 1 }));
    appendReviewLog(makeLog({ cardId: 'card-1', rating: 4 }));
    appendReviewLog(makeLog({ cardId: 'card-1', rating: 5 }));

    const logs = loadReviewLogs();
    expect(logs['card-1']).toHaveLength(3);
  });

  it('should flatten all logs correctly', () => {
    appendReviewLog(makeLog({ cardId: 'a', rating: 3 }));
    appendReviewLog(makeLog({ cardId: 'b', rating: 4 }));
    appendReviewLog(makeLog({ cardId: 'a', rating: 2 }));

    const all = getAllLogs();
    expect(all).toHaveLength(3);
  });
});

describe('getTodayReviewed', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should count logs created today', () => {
    appendReviewLog(makeLog({ cardId: 'c1', rating: 4, reviewedAt: MOCK_NOW }));
    appendReviewLog(makeLog({ cardId: 'c2', rating: 3, reviewedAt: MOCK_NOW }));
    appendReviewLog(makeLog({ cardId: 'c3', rating: 5, reviewedAt: MOCK_NOW - 2 * DAY })); // yesterday

    const all = getAllLogs();
    expect(getTodayReviewed(all)).toBe(2);
  });

  it('should return 0 when no logs exist', () => {
    expect(getTodayReviewed([])).toBe(0);
  });
});

describe('getStreak', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should count consecutive days ending at today', () => {
    // Today, yesterday, day before yesterday
    appendReviewLog(makeLog({ cardId: 'c1', rating: 4, reviewedAt: MOCK_NOW }));
    appendReviewLog(makeLog({ cardId: 'c2', rating: 4, reviewedAt: MOCK_NOW - 1 * DAY }));
    appendReviewLog(makeLog({ cardId: 'c3', rating: 4, reviewedAt: MOCK_NOW - 2 * DAY }));

    const all = getAllLogs();
    expect(getStreak(all)).toBe(3);
  });

  it('should not count when there is a gap', () => {
    // Today and day before yesterday (gap at yesterday)
    appendReviewLog(makeLog({ cardId: 'c1', rating: 4, reviewedAt: MOCK_NOW }));
    appendReviewLog(makeLog({ cardId: 'c3', rating: 4, reviewedAt: MOCK_NOW - 2 * DAY }));

    const all = getAllLogs();
    expect(getStreak(all)).toBe(1);
  });

  it('should return 0 for no logs', () => {
    expect(getStreak([])).toBe(0);
  });
});

describe('getRecentAccuracy', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should calculate accuracy for recent ratings', () => {
    const logs: ReviewLog[] = [
      makeLog({ cardId: 'c1', rating: 4, reviewedAt: MOCK_NOW }),
      makeLog({ cardId: 'c2', rating: 2, reviewedAt: MOCK_NOW }),
      makeLog({ cardId: 'c3', rating: 5, reviewedAt: MOCK_NOW }),
    ];

    // 2 correct (4,5) out of 3 = 67%
    expect(getRecentAccuracy(logs, 7)).toBe(67);
  });

  it('should return 0 for no recent logs', () => {
    const logs: ReviewLog[] = [
      makeLog({ cardId: 'c1', rating: 4, reviewedAt: MOCK_NOW - 30 * DAY }),
    ];
    expect(getRecentAccuracy(logs, 7)).toBe(0);
  });
});

describe('getAverageRating', () => {
  it('should return average of ratings', () => {
    const logs: ReviewLog[] = [
      makeLog({ cardId: 'c1', rating: 1 }),
      makeLog({ cardId: 'c2', rating: 5 }),
    ];
    expect(getAverageRating(logs)).toBe(3);
  });

  it('should return 0 for empty logs', () => {
    expect(getAverageRating([])).toBe(0);
  });
});

describe('getDifficultCards', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should identify cards with 3+ lapses', () => {
    appendReviewLog(makeLog({ cardId: 'hard', rating: 1 }));
    appendReviewLog(makeLog({ cardId: 'hard', rating: 2 }));
    appendReviewLog(makeLog({ cardId: 'hard', rating: 1 }));
    appendReviewLog(makeLog({ cardId: 'easy', rating: 4 }));

    const logs = loadReviewLogs();
    const difficult = getDifficultCards(logs, ['hard', 'easy']);
    expect(difficult).toContain('hard');
    expect(difficult).not.toContain('easy');
  });

  it('should identify cards with poor recent accuracy', () => {
    appendReviewLog(makeLog({ cardId: 'bad', rating: 1, reviewedAt: MOCK_NOW }));
    appendReviewLog(makeLog({ cardId: 'bad', rating: 2, reviewedAt: MOCK_NOW - DAY }));
    appendReviewLog(makeLog({ cardId: 'bad', rating: 1, reviewedAt: MOCK_NOW - 2 * DAY }));
    appendReviewLog(makeLog({ cardId: 'good', rating: 4, reviewedAt: MOCK_NOW }));
    appendReviewLog(makeLog({ cardId: 'good', rating: 5, reviewedAt: MOCK_NOW - DAY }));
    appendReviewLog(makeLog({ cardId: 'good', rating: 3, reviewedAt: MOCK_NOW - 2 * DAY }));

    const logs = loadReviewLogs();
    const difficult = getDifficultCards(logs, ['bad', 'good']);
    expect(difficult).toContain('bad');
    expect(difficult).not.toContain('good');
  });
});

describe('isReallyMastered', () => {
  it('should return true for interval >= 21 and lapses <= 1', () => {
    expect(isReallyMastered(21, 0)).toBe(true);
    expect(isReallyMastered(30, 1)).toBe(true);
    expect(isReallyMastered(90, 0)).toBe(true);
  });

  it('should return false for interval < 21', () => {
    expect(isReallyMastered(20, 0)).toBe(false);
    expect(isReallyMastered(7, 0)).toBe(false);
    expect(isReallyMastered(0, 0)).toBe(false);
  });

  it('should return false for lapses > 1', () => {
    expect(isReallyMastered(30, 2)).toBe(false);
    expect(isReallyMastered(90, 3)).toBe(false);
  });
});
