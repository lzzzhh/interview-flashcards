// ============================================================
// src/sync/types.ts — 同步操作类型 + NDJSON 序列化
// ============================================================

import type { SM2Record, ReviewLog, Difficulty, Category } from '../types';

export type SyncOp = RateOp | EditCardOp | CreateCardOp | DeleteCardOp | ToggleFavOp;

export interface RateOp {
  op: 'rate'; cardId: string; ts: number; deviceId: string; seq: number;
  data: { rating: number; sm2: SM2Record; reviewLog: ReviewLog };
}

export interface EditCardOp {
  op: 'edit_card'; cardId: string; ts: number; deviceId: string; seq: number;
  data: { approach?: string; description?: string; question?: string; answer?: string; tags?: string[]; difficulty?: Difficulty; titleCn?: string };
}

export interface CreateCardOp {
  op: 'create_card'; cardId: string; ts: number; deviceId: string; seq: number;
  data: { category: Category; question: string; answer: string; tags?: string[]; difficulty?: Difficulty; subTopic?: string };
}

export interface DeleteCardOp { op: 'delete_card'; cardId: string; ts: number; deviceId: string; seq: number; }

export interface ToggleFavOp {
  op: 'toggle_favorite'; cardId: string; ts: number; deviceId: string; seq: number;
  data: { favorited: boolean };
}

export interface DeviceInfo { deviceId: string; deviceName: string; version: string; }
export interface ExchangeRequest { deviceId: string; deviceName: string; fromTs: number; }
export interface ExchangeResponse { serverDeviceId: string; serverTime: number; ops: SyncOp[]; clientOpsSeen: number; }
export interface SeenOps { [deviceId: string]: number; }

export function serializeOps(ops: SyncOp[]): string {
  return ops.map((op) => JSON.stringify(op)).join('\n') + (ops.length ? '\n' : '');
}

export function deserializeOps(text: string): SyncOp[] {
  const ops: SyncOp[] = [];
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try { ops.push(JSON.parse(t)); } catch { /* skip */ }
  }
  return ops;
}
