// src/utils/countdown.ts — 秋招倒计时 + 学习计划
import type { FlashCard, SM2Record } from '../types';

export interface CountdownPlan {
  eventName: string;
  targetDate: string;
  daysLeft: number;
  totalCards: number;
  newCardsLeft: number;
  dueCards: number;
  dailyTarget: number;
  urgentModules: { deck: string; due: number; new: number }[];
}

/**
 * 计算倒计时学习计划
 * @param targetDate 目标日期 (YYYY-MM-DD)
 * @param cardsById 所有卡片
 * @param eventName 事件名称
 */
export function calculateCountdownPlan(
  targetDate: string,
  cardsById: Record<string, FlashCard>,
  eventName: string = '秋招',
): CountdownPlan {
  const now = Date.now();
  const target = new Date(targetDate).getTime();
  const daysLeft = Math.max(1, Math.ceil((target - now) / 86400000));

  let totalCards = 0;
  let newCardsLeft = 0;
  let dueCards = 0;
  const moduleStats: Record<string, { due: number; new: number }> = {};

  for (const card of Object.values(cardsById)) {
    totalCards++;
    const sm2 = card.sm2 as SM2Record;
    const deck = card.category;

    if (!moduleStats[deck]) moduleStats[deck] = { due: 0, new: 0 };

    if (!sm2 || sm2.state === 'new') {
      newCardsLeft++;
      moduleStats[deck].new++;
    } else {
      if (sm2.nextReview && sm2.nextReview <= now) {
        dueCards++;
        moduleStats[deck].due++;
      }
    }
  }

  const dailyTarget = Math.ceil(totalCards / daysLeft);

  const urgentModules = Object.entries(moduleStats)
    .filter(([, stats]) => stats.due > 0 || stats.new > 5)
    .map(([deck, stats]) => ({ deck, ...stats }))
    .sort((a, b) => b.due - a.due);

  return {
    eventName,
    targetDate,
    daysLeft,
    totalCards,
    newCardsLeft,
    dueCards,
    dailyTarget,
    urgentModules,
  };
}
