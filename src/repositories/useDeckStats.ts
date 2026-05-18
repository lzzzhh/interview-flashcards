// 牌组总数 — 优先 API，fallback 硬编码

import { getDecks } from '../api/decks';

let cached: Record<string, number> | null = null;

const FALLBACK: Record<string, number> = {
  leetcode: 100, statistics: 199, 'machine-learning': 171, 'deep-learning': 32,
  llm: 37, agent: 26, jargon: 45, workplace: 76, 'vibe-coding': 23,
};

export function getDeckTotals(): Record<string, number> {
  return cached || FALLBACK;
}

export async function loadDeckTotals(): Promise<void> {
  try {
    const data = await getDecks();
    cached = {};
    for (const d of data) cached[d.id] = d.total;
  } catch { /* use fallback */ }
}

// 立即尝试加载
loadDeckTotals();
