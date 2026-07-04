import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createDefaultSM2,
  previewSchedule,
  scheduleReview,
} from '../sm2';
import type { SM2Record } from '../../types';

// Mock Date.now to get deterministic results
const MOCK_NOW = 1700000000000;

describe('createDefaultSM2', () => {
  it('should create a new SM2 record with correct defaults', () => {
    const record = createDefaultSM2();
    expect(record.state).toBe('new');
    expect(record.easeFactor).toBe(2.5);
    expect(record.interval).toBe(0);
    expect(record.repetitions).toBe(0);
    expect(record.lapses).toBe(0);
    expect(record.nextReview).toBeGreaterThan(0);
  });
});

describe('previewSchedule', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const newRecord: SM2Record = {
    state: 'new',
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    lapses: 0,
    nextReview: MOCK_NOW,
  };

  const learningRecord: SM2Record = {
    state: 'learning',
    easeFactor: 2.5,
    interval: 1,
    repetitions: 1,
    lapses: 0,
    nextReview: MOCK_NOW,
  };

  const reviewRecord: SM2Record = {
    state: 'review',
    easeFactor: 2.5,
    interval: 7,
    repetitions: 3,
    lapses: 0,
    nextReview: MOCK_NOW,
  };

  describe('rating <= 2 (forgotten/hard)', () => {
    it('should set state to relearning on rating 1', () => {
      const result = previewSchedule(reviewRecord, 1);
      expect(result.state).toBe('relearning');
      expect(result.lapses).toBe(1);
      expect(result.interval).toBe(1);
      expect(result.easeFactor).toBeCloseTo(2.3, 1);
    });

    it('should reduce interval on rating 2', () => {
      const result = previewSchedule(reviewRecord, 2);
      expect(result.state).toBe('relearning');
      expect(result.lapses).toBe(1);
      expect(result.interval).toBe(Math.max(1, Math.round(7 * 0.5)));
      expect(result.easeFactor).toBeCloseTo(2.3, 1);
    });

    it('should not drop easeFactor below 1.3', () => {
      const lowEase: SM2Record = {
        ...reviewRecord,
        easeFactor: 1.31,
      };
      const result = previewSchedule(lowEase, 2);
      expect(result.easeFactor).toBe(1.3);
    });
  });

  describe('rating >= 3 (good/easy)', () => {
    it('should move from new to learning on first good rating', () => {
      const result = previewSchedule(newRecord, 4);
      expect(result.state).toBe('learning');
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it('should move from learning to review on second good rating', () => {
      const result = previewSchedule(learningRecord, 4);
      expect(result.state).toBe('review');
      expect(result.interval).toBe(6); // rating >= 4
    });

    it('should use shorter interval for rating 3 in learning', () => {
      const result = previewSchedule(learningRecord, 3);
      expect(result.state).toBe('review');
      expect(result.interval).toBe(3); // rating < 4
    });

    it('should increase interval proportionally in review state', () => {
      const result = previewSchedule(reviewRecord, 4);
      expect(result.state).toBe('review');
      // interval = round(7 * 2.5 * 1.3) = round(22.75) = 23
      expect(result.interval).toBe(23);
      expect(result.repetitions).toBe(4);
    });

    it('should shorten learning intervals in sprint mode', () => {
      const result = previewSchedule(learningRecord, 4, { sprint: true });
      expect(result.state).toBe('review');
      expect(result.interval).toBe(4);
    });

    it('should mark review cards mastered when interval reaches auto resolve threshold', () => {
      const result = previewSchedule(reviewRecord, 4, { autoResolveInterval: 20 });
      expect(result.state).toBe('mastered');
      expect(result.interval).toBe(23);
    });

    it('should use multiplier 1.0 for rating 3', () => {
      const result = previewSchedule(reviewRecord, 3);
      expect(result.interval).toBe(Math.round(7 * 2.5 * 1.0));
    });

    it('should use multiplier 1.6 for rating 5', () => {
      const result = previewSchedule(reviewRecord, 5);
      expect(result.interval).toBe(Math.round(7 * 2.5 * 1.6));
    });

    it('should update easeFactor correctly', () => {
      const result = previewSchedule(reviewRecord, 5);
      // EF' = EF + (0.1 - (5-5)*(0.08 + (5-5)*0.02)) = 2.5 + 0.1 = 2.6
      expect(result.easeFactor).toBeCloseTo(2.6, 1);
    });
  });

  describe('relearning state', () => {
    const relearningRecord: SM2Record = {
      state: 'relearning',
      easeFactor: 2.3,
      interval: 1,
      repetitions: 2,
      lapses: 1,
      nextReview: MOCK_NOW,
    };

    it('should move to review with rating >= 4', () => {
      const result = previewSchedule(relearningRecord, 4);
      expect(result.state).toBe('review');
      expect(result.interval).toBe(7);
    });

    it('should keep shorter interval with rating 3', () => {
      const result = previewSchedule(relearningRecord, 3);
      expect(result.state).toBe('review');
      expect(result.interval).toBe(4);
    });
  });

  describe('nextReview calculation', () => {
    it('should set nextReview to now + interval days', () => {
      const result = previewSchedule(newRecord, 4);
      expect(result.nextReview).toBe(MOCK_NOW + 1 * 86400000);
    });

    it('should set lastReviewedAt to current time', () => {
      const result = previewSchedule(reviewRecord, 4);
      expect(result.lastReviewedAt).toBe(MOCK_NOW);
    });
  });
});

describe('scheduleReview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return both new SM2 record and a ReviewLog', () => {
    const record = createDefaultSM2();
    const result = scheduleReview('test-card-id', record, 4);

    expect(result.sm2).toBeDefined();
    expect(result.log).toBeDefined();
    expect(result.log.cardId).toBe('test-card-id');
    expect(result.log.rating).toBe(4);
    expect(result.log.stateBefore).toBe('new');
    expect(result.log.stateAfter).toBe('learning');
    expect(result.log.reviewedAt).toBe(MOCK_NOW);
  });

  it('should calculate elapsedDays correctly', () => {
    const record: SM2Record = {
      ...createDefaultSM2(),
      lastReviewedAt: MOCK_NOW - 5 * 86400000, // 5 days ago
    };
    const result = scheduleReview('card-1', record, 4);
    expect(result.log.elapsedDays).toBe(5);
  });
});
