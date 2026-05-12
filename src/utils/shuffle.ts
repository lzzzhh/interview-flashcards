// ============================================================
// src/utils/shuffle.ts — Fisher-Yates 洗牌
// ============================================================

/**
 * Fisher-Yates 洗牌 — 返回新数组，不改变原数组
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
