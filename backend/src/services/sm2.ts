// backend/src/services/sm2.ts — SM-2 间隔重复算法（后端版）
// 与前端 src/utils/sm2.ts 逻辑完全一致

export interface SM2Record {
  state: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  nextReview: Date;
  lastReviewedAt?: Date;
}

export interface ScheduleOptions {
  sprint?: boolean;
  autoResolveInterval?: number;
}

function normalizeOptions(options: boolean | ScheduleOptions = false): Required<ScheduleOptions> {
  const sprint = typeof options === 'boolean' ? options : options.sprint ?? false;
  const rawInterval = typeof options === 'boolean' ? undefined : options.autoResolveInterval;
  return {
    sprint,
    autoResolveInterval: Number.isFinite(rawInterval) ? Math.max(1, Number(rawInterval)) : Infinity,
  };
}

export function createDefaultSM2(): SM2Record {
  return {
    state: 'new', easeFactor: 2.5, intervalDays: 0,
    repetitions: 0, lapses: 0, nextReview: new Date(),
  };
}

export function previewSchedule(record: SM2Record, rating: number, options: boolean | ScheduleOptions = false): SM2Record {
  const { sprint, autoResolveInterval } = normalizeOptions(options);
  const now = new Date();
  const next = { ...record };

  if (rating <= 2) {
    next.state = 'relearning';
    next.lapses += 1;
    next.repetitions += 1;
    next.intervalDays = rating === 1 ? 1 : Math.max(1, Math.round(record.intervalDays * 0.5));
    next.easeFactor = Math.max(1.3, record.easeFactor - 0.2);
  } else {
    next.lapses = record.lapses;
    next.repetitions += 1;
    if (record.state === 'new') { next.state = 'learning'; next.intervalDays = 1; }
    else if (record.state === 'learning') { next.state = 'review'; next.intervalDays = sprint ? (rating >= 4 ? 4 : 2) : (rating >= 4 ? 6 : 3); }
    else if (record.state === 'relearning') { next.state = 'review'; next.intervalDays = sprint ? (rating >= 4 ? 4 : 3) : (rating >= 4 ? 7 : 4); }
    else {
      next.state = 'review';
      const m = rating === 3 ? 1.0 : rating === 4 ? 1.3 : 1.6;
      next.intervalDays = Math.round(record.intervalDays * record.easeFactor * m);
    }
    next.easeFactor = Math.max(1.3, record.easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)));
  }
  if (next.state === 'review' && next.intervalDays >= autoResolveInterval) {
    next.state = 'mastered';
  }
  next.nextReview = new Date(now.getTime() + next.intervalDays * 86400000);
  next.lastReviewedAt = now;
  return next;
}

export function scheduleReview(
  cardId: string, record: SM2Record, rating: number, options: boolean | ScheduleOptions = false,
): { sm2: SM2Record; log: { cardId: string; rating: number; stateBefore: string; stateAfter: string; intervalBefore: number; intervalAfter: number; easeBefore: number; easeAfter: number; elapsedDays: number; scheduledDays: number; reviewedAt: Date } } {
  const stateBefore = record.state;
  const intervalBefore = record.intervalDays;
  const easeBefore = record.easeFactor;
  const elapsedDays = record.lastReviewedAt
    ? Math.max(0, (Date.now() - record.lastReviewedAt.getTime()) / 86400000)
    : 0;

  const sm2 = previewSchedule(record, rating, options);

  return {
    sm2,
    log: {
      cardId, rating, stateBefore, stateAfter: sm2.state,
      intervalBefore, intervalAfter: sm2.intervalDays,
      easeBefore, easeAfter: sm2.easeFactor,
      elapsedDays: Math.round(elapsedDays * 100) / 100,
      scheduledDays: sm2.intervalDays,
      reviewedAt: new Date(),
    },
  };
}
