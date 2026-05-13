// ============================================================
// src/utils/nativeStorage.ts — 统一存储层
// Tauri 原生文件 → localStorage fallback → File System API
// ============================================================

import type { StoredProgress, StoredSettings, StoredStats } from '../types';

export interface AppData {
  progress: Record<string, StoredProgress>;
  settings: StoredSettings;
  stats: StoredStats;
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
    return JSON.parse(json) as AppData;
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
  const keys = [
    'fc-leetcode-progress', 'fc-stats-progress', 'fc-ml-progress',
    'fc-llm-progress', 'fc-jargon-progress', 'fc-workplace-progress',
  ];
  const progress: Record<string, StoredProgress> = {};
  for (const key of keys) {
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
  return { progress, settings, stats };
}

function lsWrite(data: AppData): void {
  for (const [key, value] of Object.entries(data.progress)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  localStorage.setItem('fc-settings', JSON.stringify(data.settings));
  localStorage.setItem('fc-stats', JSON.stringify(data.stats));
}

// ---- Public API ----

/** 加载数据（Tauri 优先） */
export async function loadAppData(): Promise<AppData> {
  if (isTauri()) {
    const data = await tauriRead();
    if (data) {
      // 同步到 localStorage 以便 fallback 和快速访问
      lsWrite(data);
      return data;
    }
  }
  return lsRead();
}

/** 保存数据（Tauri 优先） */
export async function saveAppData(data: AppData): Promise<void> {
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
