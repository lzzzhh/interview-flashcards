// ============================================================
// src/utils/nativeStorage.ts — 统一存储层
// Tauri 原生文件 → localStorage fallback → File System API
// ============================================================

import type { StoredProgress, StoredSettings, StoredStats, QACard, StudyModeConfig, SM2Record, ReviewLog } from '../types';
import { createLocalBackup } from './backup';

export interface CustomDeckInfo {
  id: string;
  name: string;
  icon?: string;
  description: string;
}

export interface AppData {
  schemaVersion: number;
  progress: Record<string, StoredProgress>;
  settings: StoredSettings;
  stats: StoredStats;
  customDecks: CustomDeckInfo[];
  customCards: Record<string, QACard[]>;
  moduleDailyLimits: Record<string, number>;
  moduleDailyReviewLimits: Record<string, number>;
  studyModeConfig?: StudyModeConfig | null;
  reviewLogs: Record<string, any[]>;
  deletedCustomDecks?: any[];
  deletedCards?: any[];
}

function emptyAppData(): AppData {
  return {
    schemaVersion: 2,
    progress: {},
    settings: { isDark: false, lastCategory: 'leetcode' },
    stats: { sessions: [] },
    customDecks: [],
    customCards: {},
    moduleDailyLimits: {},
    moduleDailyReviewLimits: {},
    studyModeConfig: null,
    reviewLogs: {},
    deletedCustomDecks: [],
    deletedCards: [],
  };
}

function asNonNegativeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : fallback;
}

function asTimestamp(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' || value instanceof Date) {
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }
  return 0;
}

function asNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function inferProgressStorageKey(cardId: string): string | null {
  if (cardId.startsWith('ml-')) return 'fc-ml-progress';
  if (cardId.startsWith('stats-')) return 'fc-stats-progress';
  if (cardId.startsWith('dl-')) return 'fc-deep-learning-progress';
  if (cardId.startsWith('llm-')) return 'fc-llm-progress';
  if (cardId.startsWith('agent-')) return 'fc-agent-progress';
  if (cardId.startsWith('jargon-')) return 'fc-jargon-progress';
  if (cardId.startsWith('wp-')) return 'fc-workplace-progress';
  if (cardId.startsWith('vc-')) return 'fc-vibe-coding-progress';
  if (cardId.startsWith('java-')) return 'fc-java-progress';
  if (cardId.startsWith('lc-')) return 'fc-leetcode-progress';
  return null;
}

function findProgressStorageKey(progress: Record<string, StoredProgress>, cardId: string): string | null {
  for (const [key, stored] of Object.entries(progress)) {
    if (stored?.sm2?.[cardId]) return key;
  }
  return inferProgressStorageKey(cardId);
}

function repairProgressFromReviewLogs(data: AppData): AppData {
  const reviewLogs = data.reviewLogs ?? {};
  const progress = { ...(data.progress ?? {}) };
  let changed = false;

  for (const [cardId, rawLogs] of Object.entries(reviewLogs)) {
    if (!Array.isArray(rawLogs) || rawLogs.length === 0) continue;

    const logs = rawLogs as ReviewLog[];
    const latest = logs.reduce<ReviewLog | null>((best, log) => {
      if (!log?.cardId) return best;
      return !best || asTimestamp(log.reviewedAt) > asTimestamp(best.reviewedAt) ? log : best;
    }, null);
    if (!latest || latest.stateAfter === 'new') continue;

    const storageKey = findProgressStorageKey(progress, cardId);
    if (!storageKey) continue;

    const bucket = progress[storageKey] ?? { sm2: {}, mastered: [], favorited: [] };
    const previous = bucket.sm2?.[cardId];
    const latestReviewedAt = asTimestamp(latest.reviewedAt);
    const previousReviewedAt = asTimestamp(previous?.lastReviewedAt);

    if (previous && previous.state !== 'new' && previousReviewedAt > latestReviewedAt) continue;

    const interval = Math.max(0, Math.round(asNumber(latest.intervalAfter, previous?.interval ?? 0)));
    const lapses = Math.max(previous?.lapses ?? 0, logs.filter((log) => log.rating <= 2).length);
    const repaired: SM2Record = {
      ...(previous ?? {
        state: 'new',
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        lapses: 0,
        nextReview: Date.now(),
      }),
      state: latest.stateAfter,
      easeFactor: asNumber(latest.easeAfter, previous?.easeFactor ?? 2.5),
      interval,
      repetitions: Math.max(previous?.repetitions ?? 0, logs.length),
      lapses,
      nextReview: latestReviewedAt + interval * 86400000,
      lastReviewedAt: latestReviewedAt,
      elapsedDays: asNumber(latest.elapsedDays, previous?.elapsedDays ?? 0),
      scheduledDays: Math.max(0, Math.round(asNumber(latest.scheduledDays, interval))),
    };

    progress[storageKey] = {
      ...bucket,
      sm2: { ...(bucket.sm2 ?? {}), [cardId]: repaired },
      mastered: repaired.state === 'mastered'
        ? Array.from(new Set([...(bucket.mastered ?? []), cardId]))
        : (bucket.mastered ?? []).filter((id) => id !== cardId),
    };
    changed = true;
  }

  return changed ? { ...data, progress } : data;
}

function normalizeAppData(data: AppData): AppData {
  const repaired = repairProgressFromReviewLogs(data);
  if (repaired.studyModeConfig) return repaired;

  const selectedDecks = Object.entries(repaired.moduleDailyLimits ?? {})
    .filter(([, limit]) => asNonNegativeNumber(limit) > 0)
    .map(([deckId]) => deckId);
  if (selectedDecks.length === 0) return { ...repaired, studyModeConfig: null };

  const dailyQuota = Object.fromEntries(
    selectedDecks.map((deckId) => [deckId, asNonNegativeNumber(repaired.moduleDailyLimits[deckId])]),
  );
  const firstRatio = selectedDecks
    .map((deckId) => {
      const newLimit = dailyQuota[deckId];
      const reviewLimit = asNonNegativeNumber(repaired.moduleDailyReviewLimits?.[deckId]);
      return newLimit > 0 && reviewLimit > 0 ? reviewLimit / newLimit : null;
    })
    .find((ratio): ratio is number => typeof ratio === 'number' && Number.isFinite(ratio) && ratio > 0);

  return {
    ...repaired,
    studyModeConfig: {
      mode: 'custom',
      targetDays: 90,
      autoResolveInterval: 90,
      selectedDecks,
      dailyQuota,
      dailyReviewMultiplier: firstRatio ?? 5,
    },
  };
}

// ---- Tauri native file read/write ----
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/** Tauri 原生文件读写 */
async function tauriRead(): Promise<AppData | null> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const json = await invoke<string>('read_data');
    if (!json || json === '{}') return null;
    const raw = JSON.parse(json);
    // 旧格式迁移
    if (!raw.schemaVersion || raw.schemaVersion < 2) {
      return normalizeAppData({ ...emptyAppData(), ...raw, schemaVersion: 2 });
    }
    return normalizeAppData(raw as AppData);
  } catch {
    return null;
  }
}

async function tauriWrite(data: AppData): Promise<boolean> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('write_data', { json: JSON.stringify(data, null, 2) });
    return true;
  } catch {
    return false;
  }
}

async function tauriGetPath(): Promise<string> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<string>('get_data_path');
  } catch {
    return '~/Documents/interview-flashcards/data.json';
  }
}

// ---- localStorage fallback ----
function lsRead(): AppData {
  const progressKeys = [
    'fc-leetcode-progress', 'fc-stats-progress', 'fc-ml-progress',
    'fc-deep-learning-progress', 'fc-llm-progress', 'fc-agent-progress',
    'fc-jargon-progress', 'fc-workplace-progress', 'fc-vibe-coding-progress',
    'fc-java-progress',
  ];
  const progress: Record<string, StoredProgress> = {};
  for (const key of progressKeys) {
    try {
      progress[key] = JSON.parse(localStorage.getItem(key) || '{"sm2":{},"mastered":[],"favorited":[]}');
    } catch {
      progress[key] = { sm2: {}, mastered: [], favorited: [] };
    }
  }
  let settings: StoredSettings = { isDark: false, lastCategory: 'leetcode' };
  try { settings = JSON.parse(localStorage.getItem('fc-settings') || JSON.stringify(settings)); } catch {}
  let stats: StoredStats = { sessions: [] };
  try { stats = JSON.parse(localStorage.getItem('fc-stats') || JSON.stringify(stats)); } catch {}
  let customDecks: CustomDeckInfo[] = [];
  try { customDecks = JSON.parse(localStorage.getItem('fc-custom-decks') || '[]'); } catch {}
  let customCards: Record<string, QACard[]> = {};
  try { customCards = JSON.parse(localStorage.getItem('fc-custom-cards') || '{}'); } catch {}
  for (const deck of customDecks) {
    try {
      const cards = JSON.parse(localStorage.getItem(`fc-cards-${deck.id}`) || '[]');
      if (cards.length > 0 || !customCards[deck.id]) customCards[deck.id] = cards;
    } catch {
      if (!customCards[deck.id]) customCards[deck.id] = [];
    }
  }
  try {
    const unassigned = JSON.parse(localStorage.getItem('fc-cards-__unassigned__') || '[]');
    if (unassigned.length > 0 || customCards.__unassigned__) customCards.__unassigned__ = unassigned;
  } catch {}
  let moduleDailyLimits: Record<string, number> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('fc-limit-')) {
      const raw = localStorage.getItem(k);
      const value = raw === null ? 20 : Number(raw);
      moduleDailyLimits[k.replace('fc-limit-', '')] = Number.isFinite(value) ? value : 20;
    }
  }
  let moduleDailyReviewLimits: Record<string, number> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('fc-review-limit-')) {
      const raw = localStorage.getItem(k);
      const value = raw === null ? 100 : Number(raw);
      moduleDailyReviewLimits[k.replace('fc-review-limit-', '')] = Number.isFinite(value) ? value : 100;
    }
  }
  let studyModeConfig: StudyModeConfig | null = null;
  try { studyModeConfig = JSON.parse(localStorage.getItem('study-mode-config') || 'null'); } catch {}
  // Read reviewLogs from localStorage
  let reviewLogs: Record<string, any[]> = {};
  try { reviewLogs = JSON.parse(localStorage.getItem('fc-review-logs') || '{}'); } catch {}
  let deletedCustomDecks: any[] = [];
  try { deletedCustomDecks = JSON.parse(localStorage.getItem('fc-deleted-custom-decks') || '[]'); } catch {}
  let deletedCards: any[] = [];
  try { deletedCards = JSON.parse(localStorage.getItem('fc-deleted-cards') || '[]'); } catch {}

  return normalizeAppData({ schemaVersion: 2, progress, settings, stats, customDecks, customCards, moduleDailyLimits, moduleDailyReviewLimits, studyModeConfig, reviewLogs, deletedCustomDecks, deletedCards });
}

function lsWrite(data: AppData): void {
  for (const [key, value] of Object.entries(data.progress)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  localStorage.setItem('fc-settings', JSON.stringify(data.settings));
  localStorage.setItem('fc-stats', JSON.stringify(data.stats));
  if (data.customDecks) localStorage.setItem('fc-custom-decks', JSON.stringify(data.customDecks));
  if (data.customCards) {
    localStorage.setItem('fc-custom-cards', JSON.stringify(data.customCards));
    for (const [deckId, cards] of Object.entries(data.customCards)) {
      localStorage.setItem(`fc-cards-${deckId}`, JSON.stringify(cards));
    }
  }
  if (data.moduleDailyLimits) {
    for (const [id, limit] of Object.entries(data.moduleDailyLimits)) {
      localStorage.setItem(`fc-limit-${id}`, String(limit));
    }
  }
  if (data.moduleDailyReviewLimits) {
    for (const [id, limit] of Object.entries(data.moduleDailyReviewLimits)) {
      localStorage.setItem(`fc-review-limit-${id}`, String(limit));
    }
  }
  if (data.studyModeConfig) {
    localStorage.setItem('study-mode-config', JSON.stringify(data.studyModeConfig));
  } else if ('studyModeConfig' in data) {
    localStorage.removeItem('study-mode-config');
  }
  // Sync reviewLogs to localStorage so reviewLogs.ts can read them
  if (data.reviewLogs) {
    localStorage.setItem('fc-review-logs', JSON.stringify(data.reviewLogs));
  }
  if (data.deletedCustomDecks) {
    localStorage.setItem('fc-deleted-custom-decks', JSON.stringify(data.deletedCustomDecks));
  }
  if (data.deletedCards) {
    localStorage.setItem('fc-deleted-cards', JSON.stringify(data.deletedCards));
  }
}

// ---- Public API ----

/** 加载数据（Tauri 优先） */
export async function loadAppData(): Promise<AppData> {
  if (isTauri()) {
    const data = await tauriRead();
    if (data) { lsWrite(data); return data; }
  }
  return lsRead();
}

/** 保存数据（Tauri 优先，写入前自动备份） */
export async function saveAppData(data: AppData): Promise<void> {
  const normalized = normalizeAppData(data);
  // 写入前创建 localStorage 备份（Tauri 端由 Rust atomic write 提供文件级备份）
  createLocalBackup();
  // 始终写入 localStorage 作为缓存
  lsWrite(normalized);
  // Tauri 环境写入原生文件
  if (isTauri()) {
    await tauriWrite(normalized);
  }
}

/** 将当前 localStorage 快照立即同步到原生数据文件 */
export async function persistLocalAppData(): Promise<void> {
  const data = normalizeAppData(lsRead());
  lsWrite(data);
  if (isTauri()) {
    await tauriWrite(data);
  }
}

/** 读取当前 localStorage 快照，供后端统计投影同步使用 */
export function getLocalAppDataSnapshot(): AppData {
  return normalizeAppData(lsRead());
}

/** 获取数据文件路径 */
export async function getDataPath(): Promise<string> {
  if (isTauri()) {
    return await tauriGetPath();
  }
  return '浏览器 localStorage（未使用文件存储）';
}
