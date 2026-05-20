// ============================================================
// src/utils/nativeStorage.ts — 统一存储层
// Tauri 原生文件 → localStorage fallback → File System API
// ============================================================

import type { StoredProgress, StoredSettings, StoredStats, QACard } from '../types';
import { createLocalBackup } from './backup';

export interface CustomDeckInfo {
  id: string;
  name: string;
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
  };
}

/** 检测是否运行在 Tauri 环境中 */
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
      return { ...emptyAppData(), ...raw, schemaVersion: 2 };
    }
    return raw as AppData;
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
  let moduleDailyLimits: Record<string, number> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('fc-limit-')) {
      moduleDailyLimits[k.replace('fc-limit-', '')] = Number(localStorage.getItem(k)) || 20;
    }
  }
  return { schemaVersion: 2, progress, settings, stats, customDecks, customCards, moduleDailyLimits };
}

function lsWrite(data: AppData): void {
  for (const [key, value] of Object.entries(data.progress)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  localStorage.setItem('fc-settings', JSON.stringify(data.settings));
  localStorage.setItem('fc-stats', JSON.stringify(data.stats));
  if (data.customDecks) localStorage.setItem('fc-custom-decks', JSON.stringify(data.customDecks));
  if (data.customCards) localStorage.setItem('fc-custom-cards', JSON.stringify(data.customCards));
  if (data.moduleDailyLimits) {
    for (const [id, limit] of Object.entries(data.moduleDailyLimits)) {
      localStorage.setItem(`fc-limit-${id}`, String(limit));
    }
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
  // 写入前创建 localStorage 备份（Tauri 端由 Rust atomic write 提供文件级备份）
  createLocalBackup();
  // 始终写入 localStorage 作为缓存
  lsWrite(data);
  // Tauri 环境写入原生文件
  if (isTauri()) {
    await tauriWrite(data);
  }
}

/** 获取数据文件路径 */
export async function getDataPath(): Promise<string> {
  if (isTauri()) {
    return await tauriGetPath();
  }
  return '浏览器 localStorage（未使用文件存储）';
}
