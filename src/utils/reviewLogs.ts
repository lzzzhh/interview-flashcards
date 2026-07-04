// ============================================================
// src/utils/reviewLogs.ts — ReviewLog 存储 + 统计
// ============================================================

import type { ReviewLog } from '../types';

const LOGS_KEY = 'fc-review-logs';

/** 加载所有 ReviewLog */
export function loadReviewLogs(): Record<string, ReviewLog[]> {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** 保存 ReviewLog */
export function saveReviewLogs(logs: Record<string, ReviewLog[]>): void {
  try {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  } catch {
    // quota exceeded — silently ignore
  }
}

/** 添加一条 ReviewLog */
export function appendReviewLog(log: ReviewLog): void {
  const logs = loadReviewLogs();
  if (!logs[log.cardId]) logs[log.cardId] = [];
  if (logs[log.cardId].some((existing) => existing.id === log.id)) return;
  logs[log.cardId].push(log);
  saveReviewLogs(logs);
}

/** 获取所有日志（扁平化） */
export function getAllLogs(): ReviewLog[] {
  const logs = loadReviewLogs();
  return Object.values(logs).flat();
}

/** 今日复习数 */
export function getTodayReviewed(allLogs: ReviewLog[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return allLogs.filter((l) => {
    const d = new Date(l.reviewedAt).toISOString().slice(0, 10);
    return d === today;
  }).length;
}

function getLocalDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 今日从 new 首次学过的卡片 ID */
export function getTodayNewLearnedCardIds(
  logs: Record<string, ReviewLog[]> = loadReviewLogs(),
  now = Date.now(),
): Set<string> {
  const today = getLocalDateKey(now);
  const learnedIds = new Set<string>();

  for (const [cardId, cardLogs] of Object.entries(logs)) {
    if (cardLogs.some((log) => log.stateBefore === 'new' && getLocalDateKey(log.reviewedAt) === today)) {
      learnedIds.add(cardId);
    }
  }

  return learnedIds;
}

/** 今日有过任意复习记录的卡片 ID（去重） */
export function getTodayStudiedCardIds(
  logs: Record<string, ReviewLog[]> = loadReviewLogs(),
  now = Date.now(),
): Set<string> {
  const today = getLocalDateKey(now);
  const studiedIds = new Set<string>();

  for (const [cardId, cardLogs] of Object.entries(logs)) {
    if (cardLogs.some((log) => getLocalDateKey(log.reviewedAt) === today)) {
      studiedIds.add(cardId);
    }
  }

  return studiedIds;
}

/** 指定卡片集合里，今天已经消耗的新卡额度 */
export function countTodayNewLearned(
  cardIds: Iterable<string>,
  logs: Record<string, ReviewLog[]> = loadReviewLogs(),
  now = Date.now(),
): number {
  const deckCardIds = new Set(cardIds);
  const learnedIds = getTodayNewLearnedCardIds(logs, now);
  let count = 0;
  for (const cardId of learnedIds) {
    if (deckCardIds.has(cardId)) count += 1;
  }
  return count;
}

/** 指定卡片集合里，今天已经完成过学习/复习的唯一卡片数 */
export function countTodayStudied(
  cardIds: Iterable<string>,
  logs: Record<string, ReviewLog[]> = loadReviewLogs(),
  now = Date.now(),
): number {
  const deckCardIds = new Set(cardIds);
  const studiedIds = getTodayStudiedCardIds(logs, now);
  let count = 0;
  for (const cardId of studiedIds) {
    if (deckCardIds.has(cardId)) count += 1;
  }
  return count;
}

/** 连续学习天数 */
export function getStreak(allLogs: ReviewLog[]): number {
  const dates = new Set(
    allLogs.map((l) => new Date(l.reviewedAt).toISOString().slice(0, 10)),
  );
  const sorted = [...dates].sort().reverse();

  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  let check = new Date();

  // 如果今天还没学习，从昨天开始算
  if (!dates.has(today)) {
    check.setDate(check.getDate() - 1);
  }

  for (const d of sorted) {
    const expected = check.toISOString().slice(0, 10);
    if (d === expected) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else if (d < expected) {
      break;
    }
  }
  return streak;
}

/** 最近 N 天正确率 */
export function getRecentAccuracy(allLogs: ReviewLog[], days = 7): number {
  const since = Date.now() - days * 86400000;
  const recent = allLogs.filter((l) => l.reviewedAt >= since);
  if (recent.length === 0) return 0;
  const correct = recent.filter((l) => l.rating >= 3).length;
  return Math.round((correct / recent.length) * 100);
}

/** 平均评分 */
export function getAverageRating(allLogs: ReviewLog[]): number {
  if (allLogs.length === 0) return 0;
  const sum = allLogs.reduce((s, l) => s + l.rating, 0);
  return Math.round((sum / allLogs.length) * 10) / 10;
}

/** 识别难卡（lapses >= 3 或最近正确率 < 50%） */
export function getDifficultCards(
  logs: Record<string, ReviewLog[]>,
  cardIds: string[],
): string[] {
  return cardIds.filter((id) => {
    const cardLogs = logs[id] || [];
    const lapses = cardLogs.filter((l) => l.rating <= 2).length;
    if (lapses >= 3) return true;
    const recent = cardLogs.filter((l) => l.reviewedAt > Date.now() - 7 * 86400000);
    if (recent.length >= 3) {
      const wrong = recent.filter((l) => l.rating <= 2).length;
      return wrong / recent.length >= 0.5;
    }
    return false;
  });
}

/** 掌握率重定义：interval >= 21 且 lapses <= 1 */
export function isReallyMastered(interval: number, lapses: number): boolean {
  return interval >= 21 && lapses <= 1;
}
