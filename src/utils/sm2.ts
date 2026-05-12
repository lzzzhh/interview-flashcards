// ============================================================
// src/utils/sm2.ts — SM-2 间隔重复算法
// ============================================================

import type { SM2Record } from '../types';

/**
 * SM-2 算法实现
 * @param record 当前 SM-2 记录
 * @param quality 0-5 的评分
 *   0: 完全遗忘
 *   1: 记得但很困难
 *   2: 有点困难
 *   3: 大部分正确
 *   4: 正确且轻松
 *   5: 秒答
 * @returns 更新后的 SM-2 记录
 */
export function sm2(record: SM2Record, quality: number): SM2Record {
  let { easeFactor, interval, repetitions } = record;

  if (quality < 3) {
    // 没记住 — 重置
    repetitions = 0;
    interval = 1;
  } else {
    // 记住了 — 扩展间隔
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions++;
  }

  // 更新 ease factor
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  return {
    easeFactor,
    interval,
    repetitions,
    nextReview: Date.now() + interval * 86400000, // ms → days
  };
}

/** 创建默认 SM-2 记录 */
export function createDefaultSM2(): SM2Record {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: Date.now(),
  };
}
