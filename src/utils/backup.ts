// ============================================================
// src/utils/backup.ts — 进度导出/导入
// ============================================================

import { STORAGE_KEYS } from '../types';
import type { StoredProgress, StoredSettings, StoredStats } from '../types';

const MAX_BACKUPS = 10;
const BACKUP_KEY_PREFIX = 'fc-backup-v2-';

/** 创建 localStorage 备份轮换（保存所有当前数据快照） */
export function createLocalBackup(): void {
  const snapshot: Record<string, unknown> = {};

  // Collect all fc-* keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('fc-') || key === 'reviewLogs')) {
      try {
        snapshot[key] = JSON.parse(localStorage.getItem(key) || 'null');
      } catch {
        snapshot[key] = localStorage.getItem(key);
      }
    }
  }

  // Rotate: find next slot
  const keys = findBackupSlots();
  const nextSlot = (keys.length > 0 ? Math.min(...keys) : 0) + 1;
  const slot = nextSlot > MAX_BACKUPS ? 1 : nextSlot;

  // Remove oldest overflow
  for (let i = MAX_BACKUPS + 1; i <= MAX_BACKUPS + 5; i++) {
    localStorage.removeItem(`${BACKUP_KEY_PREFIX}${i}`);
  }

  localStorage.setItem(`${BACKUP_KEY_PREFIX}${slot}`, JSON.stringify({
    timestamp: new Date().toISOString(),
    data: snapshot,
  }));
}

/** 列出所有备份 */
export function listBackups(): { slot: number; timestamp: string; keys: number }[] {
  const results: { slot: number; timestamp: string; keys: number }[] = [];
  for (let i = 1; i <= MAX_BACKUPS; i++) {
    try {
      const raw = localStorage.getItem(`${BACKUP_KEY_PREFIX}${i}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        results.push({ slot: i, timestamp: parsed.timestamp, keys: Object.keys(parsed.data || {}).length });
      }
    } catch {}
  }
  return results.sort((a, b) => b.slot - a.slot);
}

/** 从指定备份恢复 */
export function restoreBackup(slot: number): boolean {
  try {
    const raw = localStorage.getItem(`${BACKUP_KEY_PREFIX}${slot}`);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const data = parsed.data;
    if (!data) return false;

    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(key, typeof value === 'string' ? value as string : JSON.stringify(value));
    }
    return true;
  } catch {
    return false;
  }
}

function findBackupSlots(): number[] {
  const slots: number[] = [];
  for (let i = 1; i <= MAX_BACKUPS; i++) {
    if (localStorage.getItem(`${BACKUP_KEY_PREFIX}${i}`)) {
      slots.push(i);
    }
  }
  return slots;
}

/** 导出所有进度为 JSON 文件并下载（v2 格式，包含自定义牌组） */
export function exportProgress(): void {
  const progress: Record<string, StoredProgress> = {};
  const keys = [
    STORAGE_KEYS.LEETCODE_PROGRESS, STORAGE_KEYS.STATISTICS_PROGRESS,
    STORAGE_KEYS.ML_PROGRESS, STORAGE_KEYS.DEEP_LEARNING_PROGRESS,
    STORAGE_KEYS.LLM_PROGRESS, STORAGE_KEYS.AGENT_PROGRESS,
    STORAGE_KEYS.JARGON_PROGRESS, STORAGE_KEYS.WORKPLACE_PROGRESS,
    STORAGE_KEYS.VIBE_CODING_PROGRESS,
  ];

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

/** 导出所有卡片为 CSV（兼容 Excel） */
export function exportProgressCSV(): void {
  const rows: string[][] = [['cardId', 'category', 'state', 'interval', 'repetitions', 'lapses', 'easeFactor', 'nextReview', 'favorited']];
  const keys = [
    STORAGE_KEYS.LEETCODE_PROGRESS, STORAGE_KEYS.STATISTICS_PROGRESS,
    STORAGE_KEYS.ML_PROGRESS, STORAGE_KEYS.DEEP_LEARNING_PROGRESS,
    STORAGE_KEYS.LLM_PROGRESS, STORAGE_KEYS.AGENT_PROGRESS,
    STORAGE_KEYS.JARGON_PROGRESS, STORAGE_KEYS.WORKPLACE_PROGRESS,
    STORAGE_KEYS.VIBE_CODING_PROGRESS,
  ];
  for (const key of keys) {
    const cat = key.replace('fc-', '').replace('-progress', '');
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const p = JSON.parse(raw);
      if (p.sm2) {
        for (const [cardId, sm2] of Object.entries(p.sm2)) {
          const s = sm2 as any;
          rows.push([cardId, cat, s.state || '', String(s.interval || 0), String(s.repetitions || 0), String(s.lapses || 0), String(s.easeFactor || 2.5), String(s.nextReview || ''), p.favorited?.includes(cardId) ? '1' : '0']);
        }
      }
    } catch {}
  }
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flashcards-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 从 CSV 导入进度 */
export function importProgressCSV(file: File): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) { resolve({ success: false, message: 'CSV 文件为空' }); return; }
        const header = lines[0].toLowerCase();
        if (!header.includes('cardid')) { resolve({ success: false, message: 'CSV 格式不正确' }); return; }

        const collected: Record<string, any> = {};
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',');
          if (cols.length < 9) continue;
          const [cardId, category, state, interval, repetitions, lapses, easeFactor, nextReview, favorited] = cols;
          const key = `fc-${category}-progress`;
          if (!collected[key]) collected[key] = { sm2: {}, mastered: [], favorited: [] };
          collected[key].sm2[cardId] = {
            state, interval: parseInt(interval) || 0, repetitions: parseInt(repetitions) || 0,
            lapses: parseInt(lapses) || 0, easeFactor: parseFloat(easeFactor) || 2.5, nextReview: parseInt(nextReview) || Date.now(),
          };
          if (favorited === '1') collected[key].favorited.push(cardId);
        }
        let count = 0;
        for (const [key, value] of Object.entries(collected)) {
          localStorage.setItem(key, JSON.stringify(value));
          count++;
        }
        resolve({ success: true, message: `从 CSV 导入 ${count} 个模块的进度` });
      } catch { resolve({ success: false, message: 'CSV 解析失败' }); }
    };
    reader.onerror = () => resolve({ success: false, message: '文件读取失败' });
    reader.readAsText(file);
  });
}
