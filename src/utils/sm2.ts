// ============================================================
// src/utils/sm2.ts — 增强版 SM-2 间隔重复算法
// ============================================================

import type { SM2Record, ReviewLog } from '../types';

let logCounter = 0;

/** 创建默认 SM-2 记录 */
export function createDefaultSM2(): SM2Record {
  return {
    state: 'new',
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    lapses: 0,
    nextReview: Date.now(),
  };
}

/**
 * 增强版 SM-2 调度
 * @returns 更新后的 SM2Record 和 ReviewLog
 */
export function scheduleReview(
  cardId: string,
  record: SM2Record,
  rating: number,
): { sm2: SM2Record; log: ReviewLog } {
  const now = Date.now();
  const stateBefore = record.state;
  const intervalBefore = record.interval;
  const easeBefore = record.easeFactor;

  const elapsedDays = record.lastReviewedAt
    ? Math.max(0, (now - record.lastReviewedAt) / 86400000)
    : 0;

  let next = { ...record };

  if (rating <= 2) {
    // 答错：进入 relearning
    next.state = 'relearning';
    next.lapses += 1;
    next.repetitions += 1; // 仍然算一次复习
    next.interval = rating === 1 ? 1 : Math.max(1, Math.round(record.interval * 0.5));
    next.easeFactor = Math.max(1.3, record.easeFactor - 0.2);
  } else {
    // 答对
    next.lapses = record.lapses;
    next.repetitions += 1;

    if (record.state === 'new') {
      next.state = 'learning';
      next.interval = 1;
    } else if (record.state === 'learning') {
      next.state = 'review';
      next.interval = rating >= 4 ? 6 : 3;
    } else if (record.state === 'relearning') {
      next.state = 'review';
      next.interval = rating >= 4 ? 7 : 4;
    } else {
      // review 状态
      next.state = 'review';
      const multiplier =
        rating === 3 ? 1.0 :
        rating === 4 ? 1.3 :
        1.6;
      next.interval = Math.round(record.interval * record.easeFactor * multiplier);
    }

    // 更新 easeFactor
    next.easeFactor = Math.max(
      1.3,
      record.easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)),
    );
  }

  next.nextReview = now + next.interval * 86400000;
  next.lastReviewedAt = now;

  const reviewLog: ReviewLog = {
    id: `log-${Date.now()}-${++logCounter}`,
    cardId,
    reviewedAt: now,
    rating,
    stateBefore,
    stateAfter: next.state,
    intervalBefore,
    intervalAfter: next.interval,
    easeBefore,
    easeAfter: next.easeFactor,
    elapsedDays: Math.round(elapsedDays * 100) / 100,
    scheduledDays: next.interval,
  };

  return { sm2: next, log: reviewLog };
}

/** 旧版 sm2 兼容包装（保留给可能还未迁移的调用） */
export function sm2(record: SM2Record, quality: number): SM2Record {
  return scheduleReview('legacy', record, quality).sm2;
}
