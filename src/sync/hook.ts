// ============================================================
// src/sync/hook.ts — React Hook
// ============================================================

import { useState, useCallback, useRef } from 'react';
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
      const result = await doSync(ip, port, fromTs, deviceId, deviceName);
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

  return { ...syncState, startServer, stopServer, connectAndSync, logOp, nextSeq };
}
