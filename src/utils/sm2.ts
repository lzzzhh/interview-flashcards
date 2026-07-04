// ============================================================
// src/utils/sm2.ts — 增强版 SM-2 间隔重复算法
// ============================================================

import type { SM2Record, ReviewLog } from '../types';

let logCounter = 0;

export interface ScheduleOptions {
  sprint?: boolean;
  autoResolveInterval?: number;
}

function normalizeOptions(options: boolean | ScheduleOptions = false): Required<ScheduleOptions> {
  const sprint = typeof options === 'boolean' ? options : options.sprint ?? false;
  const rawInterval = typeof options === 'boolean' ? undefined : options.autoResolveInterval;
  return {
    sprint,
    autoResolveInterval: Number.isFinite(rawInterval) ? Math.max(1, rawInterval as number) : Infinity,
  };
}

export function createDefaultSM2(): SM2Record {
  return {
    state: 'new', easeFactor: 2.5, interval: 0,
    repetitions: 0, lapses: 0, nextReview: Date.now(),
    stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0,
  };
}

/** 纯计算：给定 SM2 记录和评分，返回新的 SM2 状态（不产生副作用） */
export function previewSchedule(record: SM2Record, rating: number, options: boolean | ScheduleOptions = false): SM2Record {
  const { sprint, autoResolveInterval } = normalizeOptions(options);
  const now = Date.now();
  let next = { ...record };

  if (rating <= 2) {
    next.state = 'relearning';
    next.lapses += 1;
    next.repetitions += 1;
    next.interval = rating === 1 ? 1 : Math.max(1, Math.round(record.interval * 0.5));
    next.easeFactor = Math.max(1.3, record.easeFactor - 0.2);
  } else {
    next.lapses = record.lapses;
    next.repetitions += 1;
    if (record.state === 'new') { next.state = 'learning'; next.interval = 1; }
    else if (record.state === 'learning') {
      next.state = 'review';
      // 冲刺模式：压缩 learning→review 从 6→4 天
      next.interval = sprint
        ? (rating >= 4 ? 4 : 2)
        : (rating >= 4 ? 6 : 3);
    }
    else if (record.state === 'relearning') { next.state = 'review'; next.interval = sprint ? (rating >= 4 ? 4 : 3) : (rating >= 4 ? 7 : 4); }
    else {
      next.state = 'review';
      const m = rating === 3 ? 1.0 : rating === 4 ? 1.3 : 1.6;
      next.interval = Math.round(record.interval * record.easeFactor * m);
    }
    next.easeFactor = Math.max(1.3, record.easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)));
  }
  if (next.state === 'review' && next.interval >= autoResolveInterval) {
    next.state = 'mastered';
  }
  next.nextReview = now + next.interval * 86400000;
  next.lastReviewedAt = now;
  // FSRS-ready fields
  next.elapsedDays = record.lastReviewedAt ? Math.max(0, (now - record.lastReviewedAt) / 86400000) : 0;
  next.scheduledDays = next.interval;
  // Simple stability/difficulty estimation (future FSRS migration)
  next.stability = Math.max(0.1, next.interval * next.easeFactor / 10);
  next.difficulty = Math.min(10, Math.max(0, (11 - rating) * (1 + record.lapses * 0.1)));
  return next;
}

/** 完整调度：返回新 SM2 状态 + ReviewLog */
export function scheduleReview(cardId: string, record: SM2Record, rating: number, options: boolean | ScheduleOptions = false): { sm2: SM2Record; log: ReviewLog } {
  const now = Date.now();
  const stateBefore = record.state;
  const intervalBefore = record.interval;
  const easeBefore = record.easeFactor;
  const elapsedDays = record.lastReviewedAt ? Math.max(0, (now - record.lastReviewedAt) / 86400000) : 0;

  const sm2 = previewSchedule(record, rating, options);

  const reviewLog: ReviewLog = {
    id: `log-${Date.now()}-${++logCounter}`, cardId, reviewedAt: now, rating,
    stateBefore, stateAfter: sm2.state, intervalBefore, intervalAfter: sm2.interval,
    easeBefore, easeAfter: sm2.easeFactor,
    elapsedDays: Math.round(elapsedDays * 100) / 100, scheduledDays: sm2.interval,
  };

  return { sm2, log: reviewLog };
}

export function sm2(record: SM2Record, quality: number): SM2Record {
  return scheduleReview('legacy', record, quality).sm2;
}
