// ============================================================
// src/utils/storage.ts — localStorage 读写封装
// ============================================================

import type { Category, StoredProgress, StoredSettings, StoredStats } from '../types';
import { STORAGE_KEYS } from '../types';

// ---- StoredProgress ----

const progressKeyMap: Record<Category, string> = {
  leetcode: STORAGE_KEYS.LEETCODE_PROGRESS,
  statistics: STORAGE_KEYS.STATISTICS_PROGRESS,
  'machine-learning': STORAGE_KEYS.ML_PROGRESS,
  'deep-learning': STORAGE_KEYS.DEEP_LEARNING_PROGRESS,
  llm: STORAGE_KEYS.LLM_PROGRESS,
  agent: STORAGE_KEYS.AGENT_PROGRESS,
  jargon: STORAGE_KEYS.JARGON_PROGRESS,
  workplace: STORAGE_KEYS.WORKPLACE_PROGRESS,
};

function getProgressKey(category: Category): string {
  return progressKeyMap[category];
}

export function loadProgress(category: Category): StoredProgress {
  try {
    const raw = localStorage.getItem(getProgressKey(category));
    if (raw) return JSON.parse(raw) as StoredProgress;
  } catch {
    // corrupted data — reset
  }
  return { sm2: {}, mastered: [], favorited: [] };
}

export function saveProgress(category: Category, progress: StoredProgress): void {
  try {
    localStorage.setItem(getProgressKey(category), JSON.stringify(progress));
  } catch {
    // quota exceeded or private browsing — silently ignore
  }
}

// ---- StoredSettings ----

const defaultSettings: StoredSettings = { isDark: false, lastCategory: 'leetcode' };

export function loadSettings(): StoredSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    // fallthrough
  }
  return { ...defaultSettings };
}

export function saveSettings(settings: StoredSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // silently ignore
  }
}

// ---- StoredStats ----

export function loadStats(): StoredStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (raw) return JSON.parse(raw) as StoredStats;
  } catch {
    // fallthrough
  }
  return { sessions: [] };
}

export function saveStats(stats: StoredStats): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch {
    // silently ignore
  }
}
