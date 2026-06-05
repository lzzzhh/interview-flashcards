// ============================================================
// src/utils/fileStorage.ts — 本地文件读写（File System Access API）
// 支持 Chrome/Edge/Opera，其他浏览器回退到 localStorage
// ============================================================

import type { StoredProgress, StoredSettings, StoredStats } from '../types';
import { STORAGE_KEYS } from '../types';

export type StorageMode = 'file' | 'localStorage' | 'pending';

/** 检查 File System Access API 是否可用 */
export function isFileSystemAPISupported(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window;
}

// ---- File handle persistence via IndexedDB ----
function openHandleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('fc-file-handles', 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('handles');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getStoredHandle(): Promise<FileSystemFileHandle | null> {
  if (!isFileSystemAPISupported()) return null;
  try {
    const db = await openHandleDB();
    const handle = await new Promise<FileSystemFileHandle | undefined>((resolve) => {
      const tx = db.transaction('handles', 'readonly');
      const req = tx.objectStore('handles').get('data-file');
      req.onsuccess = () => resolve(req.result as FileSystemFileHandle | undefined);
      req.onerror = () => resolve(undefined);
    });
    if (!handle) return null;
    // Verify permission
    const ok = (await handle.queryPermission({ mode: 'readwrite' })) === 'granted';
    return ok ? handle : null;
  } catch {
    return null;
  }
}

async function storeHandle(handle: FileSystemFileHandle): Promise<void> {
  try {
    const db = await openHandleDB();
    const tx = db.transaction('handles', 'readwrite');
    tx.objectStore('handles').put(handle, 'data-file');
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // silently ignore
  }
}

async function clearStoredHandle(): Promise<void> {
  try {
    const db = await openHandleDB();
    const tx = db.transaction('handles', 'readwrite');
    tx.objectStore('handles').delete('data-file');
  } catch {
    // ignore
  }
}

// ---- Public API ----

export interface AppData {
  progress: Record<string, StoredProgress>;
  settings: StoredSettings;
  stats: StoredStats;
}

/** 提示用户选择或创建数据文件 */
export async function pickDataFile(): Promise<{ handle: FileSystemFileHandle; data: AppData | null } | null> {
  if (!isFileSystemAPISupported()) return null;

  try {
    // 尝试打开已有文件
    const [handle] = await window.showOpenFilePicker({
      types: [{
        description: '面经闪卡数据文件',
        accept: { 'application/json': ['.json'] },
      }],
      multiple: false,
    });
    await storeHandle(handle);
    const data = await readFromHandle(handle);
    return { handle, data };
  } catch (e: unknown) {
    if ((e as DOMException)?.name === 'AbortError') return null;
    throw e;
  }
}

/** 创建新的数据文件 */
export async function createDataFile(initialData: AppData): Promise<FileSystemFileHandle | null> {
  if (!isFileSystemAPISupported()) return null;

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: 'interview-flashcards-data.json',
      types: [{
        description: '面经闪卡数据文件',
        accept: { 'application/json': ['.json'] },
      }],
    });
    await storeHandle(handle);
    await writeToHandle(handle, initialData);
    return handle;
  } catch (e: unknown) {
    if ((e as DOMException)?.name === 'AbortError') return null;
    throw e;
  }
}

/** 加载已有数据 */
export async function loadFromFile(): Promise<{ handle: FileSystemFileHandle; data: AppData | null } | null> {
  const handle = await getStoredHandle();
  if (!handle) return null;
  try {
    const data = await readFromHandle(handle);
    return { handle, data };
  } catch {
    // Handle invalid, clear it
    await clearStoredHandle();
    return null;
  }
}

/** 写入数据到文件 */
export async function saveToFile(data: AppData): Promise<boolean> {
  const handle = await getStoredHandle();
  if (!handle) return false;
  try {
    await writeToHandle(handle, data);
    return true;
  } catch {
    return false;
  }
}

/** 断开文件存储，回退到 localStorage */
export async function disconnectFile(): Promise<void> {
  await clearStoredHandle();
}

/** 获取当前存储模式 */
export async function getStorageMode(): Promise<StorageMode> {
  if (!isFileSystemAPISupported()) return 'localStorage';
  const handle = await getStoredHandle();
  return handle ? 'file' : 'pending';
}

// ---- Internal ----
async function readFromHandle(handle: FileSystemFileHandle): Promise<AppData | null> {
  const file = await handle.getFile();
  const text = await file.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as AppData;
  } catch {
    return null;
  }
}

async function writeToHandle(handle: FileSystemFileHandle, data: AppData): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

// ---- localStorage fallback ----
export function loadFromLocalStorage(): AppData {
  const progress: Record<string, StoredProgress> = {};
  const keys = [
    STORAGE_KEYS.LEETCODE_PROGRESS,
    STORAGE_KEYS.STATISTICS_PROGRESS,
    STORAGE_KEYS.ML_PROGRESS,
    STORAGE_KEYS.DEEP_LEARNING_PROGRESS,
    STORAGE_KEYS.LLM_PROGRESS,
    STORAGE_KEYS.AGENT_PROGRESS,
    STORAGE_KEYS.JARGON_PROGRESS,
    STORAGE_KEYS.WORKPLACE_PROGRESS,
    STORAGE_KEYS.VIBE_CODING_PROGRESS,
    STORAGE_KEYS.JAVA_PROGRESS,
  ];
  for (const key of keys) {
    try {
      progress[key] = JSON.parse(localStorage.getItem(key) || '{"sm2":{},"mastered":[],"favorited":[]}');
    } catch {
      progress[key] = { sm2: {}, mastered: [], favorited: [] };
    }
  }
  let settings: StoredSettings = { isDark: false, lastCategory: 'leetcode' };
  try {
    settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || JSON.stringify(settings));
  } catch { /* default */ }
  let stats: StoredStats = { sessions: [] };
  try {
    stats = JSON.parse(localStorage.getItem(STORAGE_KEYS.STATS) || JSON.stringify(stats));
  } catch { /* default */ }
  return { progress, settings, stats };
}

export function saveToLocalStorage(data: AppData): void {
  for (const [key, value] of Object.entries(data.progress)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(data.stats));
}
