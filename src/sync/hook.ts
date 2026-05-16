// ============================================================
// src/sync/hook.ts — React Hook
// ============================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { replayOps } from './engine';
import { doSync } from './lan/client';
import type { SyncOp, SeenOps } from './types';

export interface SyncState { syncing: boolean; lastResult: string | null; error: string | null; serverRunning: boolean; serverAddress: string; }

function isTauri() { return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window; }

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(cmd, args);
}

async function appendOpToFile(op: SyncOp) { if (isTauri()) await tauriInvoke('sync_append_op', { opJson: JSON.stringify(op) }); }
async function readSeenOps(): Promise<SeenOps> { return isTauri() ? tauriInvoke<SeenOps>('sync_read_seen_ops') : {} as SeenOps; }

/** 全局 oplog 写入（供 reducer 等非组件代码调用） */
export async function logSyncOp(op: SyncOp) {
  if (isTauri()) await tauriInvoke('sync_append_op', { opJson: JSON.stringify(op) });
}

async function readMyOps(): Promise<SyncOp[]> {
  if (!isTauri()) return [];
  const files: Record<string, string> = await tauriInvoke('sync_read_all_ops');
  const ops: SyncOp[] = [];
  for (const content of Object.values(files)) {
    for (const line of content.split('\n')) {
      const t = line.trim(); if (!t) continue;
      try { ops.push(JSON.parse(t)); } catch {}
    }
  }
  return ops;
}

export function useSync() {
  const { state, dispatch } = useAppContext();
  const [syncState, setSyncState] = useState<SyncState>({ syncing: false, lastResult: null, error: null, serverRunning: false, serverAddress: '' });
  const seqRef = useRef(0);

  const startServer = useCallback(async (port = 9876) => {
    if (!isTauri()) { setSyncState((s) => ({ ...s, error: '仅在桌面应用中可用' })); return; }
    try {
      const addr: string = await tauriInvoke('sync_start_server', { port });
      setSyncState((s) => ({ ...s, serverRunning: true, serverAddress: addr, error: null }));
    } catch (e: any) { setSyncState((s) => ({ ...s, error: e?.toString() || '启动失败' })); }
  }, []);

  const stopServer = useCallback(async () => {
    if (!isTauri()) return;
    try { await tauriInvoke('sync_stop_server'); setSyncState((s) => ({ ...s, serverRunning: false, serverAddress: '' })); } catch {}
  }, []);

  const connectAndSync = useCallback(async (ip: string, port = 9876) => {
    setSyncState((s) => ({ ...s, syncing: true, error: null, lastResult: null }));
    try {
      let deviceId = 'browser-' + Math.random().toString(36).slice(2, 8);
      let deviceName = 'Browser';
      if (isTauri()) {
        const status: any = await tauriInvoke('sync_get_status');
        deviceId = status.deviceId; deviceName = status.deviceName;
      }
      const seen = await readSeenOps();
      const fromTs = Object.values(seen).reduce((max, v) => Math.max(max, v), 0);

      // Gather ops to send: from oplog (Tauri) or from card state (browser)
      let myOps: SyncOp[] = [];
      if (isTauri()) {
        myOps = await readMyOps();
      } else {
        // Browser: convert current card state to create_card ops
        const now = Date.now();
        for (const card of Object.values(state.cardsById)) {
          if (card.category === 'leetcode') {
            myOps.push({
              op: 'create_card', cardId: card.id, ts: now, deviceId, seq: now,
              data: { category: card.category, question: card.titleCn, answer: card.approach || '' },
            });
          } else {
            myOps.push({
              op: 'create_card', cardId: card.id, ts: now, deviceId, seq: now,
              data: { category: card.category, question: card.question, answer: card.answer, tags: card.tags, difficulty: card.difficulty, subTopic: card.subTopic },
            });
          }
          // Also sync SM2 state
          myOps.push({
            op: 'rate', cardId: card.id, ts: now, deviceId, seq: now + 1,
            data: { rating: 4, sm2: card.sm2, reviewLog: { id: `sync-${card.id}`, cardId: card.id, rating: 4, stateBefore: card.sm2.state, stateAfter: card.sm2.state, intervalBefore: card.sm2.interval, intervalAfter: card.sm2.interval, easeBefore: card.sm2.easeFactor, easeAfter: card.sm2.easeFactor, elapsedDays: 0, scheduledDays: card.sm2.interval, reviewedAt: now } },
          });
        }
      }

      const result = await doSync(ip, port, fromTs, deviceId, deviceName, myOps);
      if (result.ops.length === 0) {
        setSyncState((s) => ({ ...s, syncing: false, lastResult: '已是最新，无需同步' }));
        return;
      }
      const merged = replayOps(result.ops, { cardsById: state.cardsById, reviewLogs: [] }, seen);
      for (const [, card] of Object.entries(merged.cardsById)) dispatch({ type: 'UPDATE_CARD', payload: card });
      for (const op of result.ops) await appendOpToFile(op);
      setSyncState((s) => ({ ...s, syncing: false, lastResult: `同步完成：收到 ${result.ops.length} 条操作` }));
    } catch (e: any) { setSyncState((s) => ({ ...s, syncing: false, error: e?.message || e?.toString() || '连接失败' })); }
  }, [state.cardsById, dispatch]);

  const logOp = useCallback(async (op: SyncOp) => { await appendOpToFile(op); }, []);
  const nextSeq = useCallback(() => { seqRef.current += 1; return seqRef.current; }, []);

  // 重放本地 oplog 到应用状态
  const replayLocal = useCallback(async () => {
    if (!isTauri()) { setSyncState((s) => ({ ...s, lastResult: '仅桌面端支持刷新' })); return; }
    try {
      const files: Record<string, string> = await tauriInvoke('sync_read_all_ops');
      const ops: SyncOp[] = [];
      for (const content of Object.values(files)) {
        for (const line of content.split('\n')) {
          const t = line.trim(); if (!t) continue;
          try { ops.push(JSON.parse(t)); } catch {}
        }
      }
      if (ops.length === 0) { setSyncState((s) => ({ ...s, lastResult: '没有需要同步的数据' })); return; }
      const merged = replayOps(ops, { cardsById: state.cardsById, reviewLogs: [] });
      let count = 0;
      for (const [, card] of Object.entries(merged.cardsById)) {
        dispatch({ type: 'UPDATE_CARD', payload: card });
        count++;
      }
      // 持久化进度到文件
      try {
        const { loadAppData, saveAppData } = await import('../utils/nativeStorage');
        const data = await loadAppData();
        if (data) {
          for (const [id, card] of Object.entries(merged.cardsById)) {
            const key = `fc-${card.category}-progress`;
            if (!data.progress[key]) data.progress[key] = { sm2: {}, mastered: [], favorited: [] };
            if (!data.progress[key].sm2) data.progress[key].sm2 = {};
            data.progress[key].sm2[id] = card.sm2;
          }
          await saveAppData(data);
        }
      } catch {}
      setSyncState((s) => ({ ...s, lastResult: `已刷新 ${count} 张卡片并保存` }));
    } catch (e: any) {
      setSyncState((s) => ({ ...s, error: e?.toString() || '刷新失败' }));
    }
  }, [state.cardsById, dispatch]);

  // 自动重放：作为服务端时，定期检查 oplog 是否有新数据
  const cardsRef = useRef(state.cardsById);
  cardsRef.current = state.cardsById;
  useEffect(() => {
    if (!isTauri()) return;
    const interval = setInterval(async () => {
      try {
        const files: Record<string, string> = await tauriInvoke('sync_read_all_ops');
        const ops: SyncOp[] = [];
        for (const content of Object.values(files)) {
          for (const line of content.split('\n')) {
            const t = line.trim(); if (!t) continue;
            try { ops.push(JSON.parse(t)); } catch {}
          }
        }
        if (ops.length === 0) return;
        const seen = await readSeenOps();
        const merged = replayOps(ops, { cardsById: cardsRef.current, reviewLogs: [] }, seen);
        for (const [id, card] of Object.entries(merged.cardsById)) {
          if (JSON.stringify(cardsRef.current[id]?.sm2) !== JSON.stringify(card.sm2)) {
            dispatch({ type: 'UPDATE_CARD', payload: card });
          }
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...syncState, startServer, stopServer, connectAndSync, logOp, nextSeq, replayLocal };
}
