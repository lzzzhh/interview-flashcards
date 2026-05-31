// Global document processing queue — singleton store
// Survives page navigation, persists to localStorage (Tauri WebView compatible)

import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../api/client';

async function getDraftCount(docId: string): Promise<number> {
  try {
    const res = await fetch(`${API_BASE}/documents/${docId}/drafts`);
    const drafts = await res.json();
    return Array.isArray(drafts) ? drafts.length : 0;
  } catch { return -1; }
}

export interface QueueItem {
  docId: string;
  filename: string;
  status: 'processing' | 'done' | 'failed';
  progress: number;      // 0-100
  message?: string;       // progress message from backend
  draftCount: number;     // populated when done
  createdAt: number;
}

const STORAGE_KEY = 'fc_document_queue';

// ── Module-level singleton store ──

let items: QueueItem[] = [];
let pollTimer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function loadFromStorage(): QueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueueItem[];
  } catch { return []; }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function notify() {
  saveToStorage();
  for (const fn of listeners) fn();
}

// ── Poll progress for processing items ──

async function pollProgress(docId: string) {
  try {
    const res = await fetch(`${API_BASE}/documents/${docId}/progress`);
    if (!res.ok) return;
    const progress = await res.json();
    if (!progress) return;

    const item = items.find(i => i.docId === docId);
    if (!item) return;

    item.progress = progress.step && progress.total ? Math.round((progress.step / progress.total) * 100) : item.progress;
    item.message = progress.message || item.message;

    if (progress.stage === 'failed') {
      item.status = 'failed';
      item.message = progress.message || '处理失败';
      notify();
      return;
    }

    if (progress.stage === 'done') {
      // Fetch draft count
      try {
        const draftsRes = await fetch(`${API_BASE}/documents/${docId}/drafts`);
        const drafts = await draftsRes.json();
        item.draftCount = Array.isArray(drafts) ? drafts.length : 0;
      } catch { item.draftCount = 0; }
      item.status = 'done';
      item.progress = 100;
      item.message = '完成';
      notify();
      return;
    }

    notify(); // update progress display
  } catch { /* ignore polling errors */ }
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    const processing = items.filter(i => i.status === 'processing');
    if (processing.length === 0) {
      stopPolling();
      return;
    }
    for (const item of processing) {
      pollProgress(item.docId);
    }
  }, 2500);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function addToQueue(docId: string, filename: string) {
  items = items.filter(i => i.docId !== docId);
  items.unshift({
    docId,
    filename: filename || '未知文件',
    status: 'processing',
    progress: 0,
    draftCount: 0,
    createdAt: Date.now(),
  });
  notify();
  startPolling();
}

function removeFromQueue(docId: string) {
  items = items.filter(i => i.docId !== docId);
  notify();
  if (items.length === 0) stopPolling();
}

function clearQueue() {
  items = [];
  notify();
  stopPolling();
}

// ── Hook ──

export function useDocumentQueue() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    items = loadFromStorage();
    // Clean stale queue items (documents whose drafts have been deleted)
    const checkStale = async () => {
      const stale: string[] = [];
      for (const item of items) {
        if (item.status === 'done') {
          const fresh = await getDraftCount(item.docId);
          if (fresh === 0) stale.push(item.docId);
        }
      }
      if (stale.length > 0) {
        items = items.filter(i => !stale.includes(i.docId));
        notify();
      }
    };
    checkStale();

    // Resume polling for any still-processing items
    if (items.some(i => i.status === 'processing')) {
      startPolling();
    }
    forceUpdate(v => v + 1);

    const listener = () => forceUpdate(v => v + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const processingCount = items.filter(i => i.status === 'processing').length;
  const doneCount = items.filter(i => i.status === 'done').length;
  const pendingDraftCount = items.filter(i => i.status === 'done').reduce((sum, i) => sum + i.draftCount, 0);

  return {
    items,
    processingCount,
    doneCount,
    pendingDraftCount,
    addToQueue: useCallback(addToQueue, []),
    removeFromQueue: useCallback(removeFromQueue, []),
    clearQueue: useCallback(clearQueue, []),
  };
}
