// ============================================================
// src/utils/backup.ts — 进度导出/导入
// ============================================================

import { STORAGE_KEYS } from '../types';
import type { StoredProgress, StoredSettings, StoredStats } from '../types';

/** 导出所有进度为 JSON 文件并下载（v2 格式，包含自定义牌组） */
export function exportProgress(): void {
  const progress: Record<string, StoredProgress> = {};
  const keys = Object.values(STORAGE_KEYS).filter((k): k is string =>
    typeof k === 'string' && k.startsWith('fc-') && k.endsWith('-progress'),
  ) as string[];

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      progress[key] = raw ? JSON.parse(raw) : { sm2: {}, mastered: [], favorited: [] };
    } catch {
      progress[key] = { sm2: {}, mastered: [], favorited: [] };
    }
  }

  let settings: StoredSettings = { isDark: false, lastCategory: 'leetcode' };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) settings = JSON.parse(raw);
  } catch { /* use default */ }

  let stats: StoredStats = { sessions: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (raw) stats = JSON.parse(raw);
  } catch { /* use default */ }

  // 导出自定义牌组
  let customDecks: any[] = [];
  let customCards: Record<string, any[]> = {};
  let moduleDailyLimits: Record<string, number> = {};
  try {
    customDecks = JSON.parse(localStorage.getItem('fc-custom-decks') || '[]');
  } catch {}
  for (const deck of customDecks) {
    try { customCards[deck.id] = JSON.parse(localStorage.getItem(`fc-cards-${deck.id}`) || '[]'); } catch { customCards[deck.id] = []; }
  }
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('fc-limit-')) {
      moduleDailyLimits[k.replace('fc-limit-', '')] = Number(localStorage.getItem(k)) || 20;
    }
  }

  const cardCounts: Record<string, number> = {};
  for (const [key, p] of Object.entries(progress)) {
    const short = key.replace('fc-', '').replace('-progress', '');
    cardCounts[short] = p.mastered?.length ?? 0;
  }

  const backup = {
    version: 2,
    exportedAt: new Date().toISOString(),
    progress, settings, stats, cardCounts,
    customDecks, customCards, moduleDailyLimits,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `interview-flashcards-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 从 JSON 文件导入进度（兼容 v1 和 v2） */
export function importProgress(file: File): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        if (!data.progress) {
          resolve({ success: false, message: '无效的备份文件格式' });
          return;
        }

        let count = 0;
        for (const [key, value] of Object.entries(data.progress)) {
          const v = value as any;
          if (v && v.sm2) {
            localStorage.setItem(key, JSON.stringify(v));
            count++;
          }
        }

        if (data.settings) {
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
        }
        if (data.stats) {
          localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(data.stats));
        }

        // v2: 导入自定义牌组
        if (data.customDecks) {
          localStorage.setItem('fc-custom-decks', JSON.stringify(data.customDecks));
          count++;
        }
        if (data.customCards) {
          for (const [deckId, cards] of Object.entries(data.customCards)) {
            localStorage.setItem(`fc-cards-${deckId}`, JSON.stringify(cards));
          }
        }
        if (data.moduleDailyLimits) {
          for (const [id, limit] of Object.entries(data.moduleDailyLimits)) {
            localStorage.setItem(`fc-limit-${id}`, String(limit));
          }
        }

        const exportedDate = data.exportedAt
          ? new Date(data.exportedAt).toLocaleString('zh-CN')
          : '未知时间';

        resolve({
          success: true,
          message: `成功导入 ${count} 个题库的进度（备份于 ${exportedDate}）。请刷新页面以生效。`,
        });
      } catch {
        resolve({ success: false, message: '文件解析失败，请确认选择了正确的 JSON 备份文件' });
      }
    };
    reader.onerror = () => {
      resolve({ success: false, message: '文件读取失败' });
    };
    reader.readAsText(file);
  });
}
