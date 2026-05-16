// ============================================================
// src/sync/lan/client.ts — HTTP 客户端
// ============================================================

import type { SyncOp, DeviceInfo, ExchangeRequest, ExchangeResponse } from '../types';

export async function pingHost(ip: string, port: number): Promise<DeviceInfo> {
  const resp = await fetch(`http://${ip}:${port}/ping`, { signal: AbortSignal.timeout(3000) });
  if (!resp.ok) throw new Error(`Ping failed: ${resp.status}`);
  return resp.json();
}

export async function exchangeWithHost(ip: string, port: number, req: ExchangeRequest): Promise<ExchangeResponse> {
  const resp = await fetch(`http://${ip}:${port}/sync/exchange`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req), signal: AbortSignal.timeout(15000),
  });
  if (!resp.ok) throw new Error(`Exchange failed: ${resp.status}`);
  return resp.json();
}

export async function doSync(ip: string, port: number, fromTs: number, deviceId: string, deviceName: string) {
  await pingHost(ip, port);
  const res = await exchangeWithHost(ip, port, { deviceId, deviceName, fromTs });
  return { ops: res.ops as SyncOp[], serverDeviceId: res.serverDeviceId };
}
