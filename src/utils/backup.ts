// ============================================================
// src/utils/backup.ts — 进度导出/导入
// ============================================================

import { STORAGE_KEYS } from '../types';
import type { StoredProgress, StoredSettings, StoredStats } from '../types';

/** 备份数据结构 */
export interface BackupData {
  version: 1;
  exportedAt: string; // ISO timestamp
  cardCounts: Record<string, number>;
  progress: Record<string, StoredProgress>;
  settings: StoredSettings;
  stats: StoredStats;
}

/** 导出所有进度为 JSON 文件并下载 */
export function exportProgress(): void {
  const progress: Record<string, StoredProgress> = {};
  const keys = [
    STORAGE_KEYS.LEETCODE_PROGRESS,
    STORAGE_KEYS.STATISTICS_PROGRESS,
    STORAGE_KEYS.ML_PROGRESS,
    STORAGE_KEYS.LLM_PROGRESS,
    STORAGE_KEYS.JARGON_PROGRESS,
    STORAGE_KEYS.WORKPLACE_PROGRESS,
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

  // Count mastered cards per category
  const cardCounts: Record<string, number> = {};
  for (const [key, p] of Object.entries(progress)) {
    const short = key.replace('fc-', '').replace('-progress', '');
    cardCounts[short] = p.mastered?.length ?? 0;
  }

  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    cardCounts,
    progress,
    settings,
    stats,
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

/** 从 JSON 文件导入进度 */
export function importProgress(file: File): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data: BackupData = JSON.parse(text);

        // Validate
        if (!data.version || !data.progress) {
          resolve({ success: false, message: '无效的备份文件格式' });
          return;
        }

        let count = 0;
        for (const [key, value] of Object.entries(data.progress)) {
          if (typeof value === 'object' && value.sm2) {
            localStorage.setItem(key, JSON.stringify(value));
            count++;
          }
        }

        if (data.settings) {
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
        }

        if (data.stats) {
          localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(data.stats));
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
