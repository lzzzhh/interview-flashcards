// src/utils/studyModeConfig.ts — 学习模式配置持久化

import type { StudyModeConfig } from '../types';

const STORAGE_KEY = 'study-mode-config';

export function loadStudyModeConfig(): StudyModeConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.mode) return null;
    return parsed as StudyModeConfig;
  } catch {
    return null;
  }
}

export function saveStudyModeConfig(config: StudyModeConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearStudyModeConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** 预设模式 */
export const PACE_PRESETS: Record<string, Pick<StudyModeConfig, 'targetDays' | 'autoResolveInterval' | 'mode'>> = {
  sprint: { mode: 'sprint', targetDays: 21, autoResolveInterval: 21 },
  fast: { mode: 'fast', targetDays: 45, autoResolveInterval: 45 },
  normal: { mode: 'normal', targetDays: 90, autoResolveInterval: 90 },
};

export const PACE_LABELS: Record<string, string> = {
  sprint: '冲刺',
  fast: '快速',
  normal: '正常',
  custom: '自定义',
};

/** 根据模式配置判断是否启用冲刺 SM-2 */
export function isSprintMode(): boolean {
  const config = loadStudyModeConfig();
  return config?.mode === 'sprint';
}

function normalizeLimit(value: unknown, fallback: number): number {
  return Number.isFinite(value) ? Math.max(0, Number(value)) : fallback;
}

export function getStudyModeNewLimit(deckId: string, fallback: number): number {
  const config = loadStudyModeConfig();
  if (!config) return normalizeLimit(fallback, 0);
  if (config.selectedDecks?.length && !config.selectedDecks.includes(deckId)) return 0;
  return normalizeLimit(config.dailyQuota?.[deckId], 0);
}

export function getStudyModeReviewLimit(deckId: string, fallback: number): number {
  const config = loadStudyModeConfig();
  if (!config) return normalizeLimit(fallback, 0);
  if (config.selectedDecks?.length && !config.selectedDecks.includes(deckId)) return 0;
  const newLimit = normalizeLimit(config.dailyQuota?.[deckId], 0);
  const multiplier = normalizeLimit(config.dailyReviewMultiplier, 5);
  return newLimit * multiplier;
}

export function getStudyModeDeckIds(deckIds: string[]): string[] {
  const config = loadStudyModeConfig();
  if (!config) return deckIds;
  const selected = new Set(config.selectedDecks ?? []);
  return deckIds.filter((id) => selected.has(id));
}

/**
 * 计算默认配额：按牌组新卡比例分配每日总上限
 */
export function computeDefaultQuota(
  selectedDecks: string[],
  newCardCounts: Record<string, number>,
  dailyTotal: number,
): Record<string, number> {
  const quota: Record<string, number> = {};
  const totalNew = selectedDecks.reduce((s, d) => s + (newCardCounts[d] || 0), 0);
  if (totalNew === 0) {
    selectedDecks.forEach(d => quota[d] = 0);
    return quota;
  }

  let allocated = 0;
  const entries = selectedDecks
    .map(d => ({ deck: d, n: newCardCounts[d] || 0 }))
    .sort((a, b) => b.n - a.n);

  for (let i = 0; i < entries.length; i++) {
    const share = Math.round((entries[i].n / totalNew) * dailyTotal);
    quota[entries[i].deck] = Math.min(share, entries[i].n);
    allocated += quota[entries[i].deck];
  }

  // Distribute remainder to largest deck
  let remaining = dailyTotal - allocated;
  for (const e of entries) {
    const canAdd = (newCardCounts[e.deck] || 0) - quota[e.deck];
    const add = Math.min(Math.max(0, remaining), canAdd);
    if (add > 0) {
      quota[e.deck] += add;
      remaining -= add;
    }
    if (remaining <= 0) break;
  }

  return quota;
}

/**
 * 计算每日总新卡数
 */
export function computeDailyTotal(newCardTotal: number, targetDays: number): number {
  return Math.max(1, Math.ceil(newCardTotal / targetDays));
}
