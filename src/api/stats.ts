import { apiGet, apiPost } from './client';
import type { StatsSnapshotResponse } from './types';

export function getStatsSnapshot(timezone = 'Australia/Sydney'): Promise<StatsSnapshotResponse> {
  return apiGet<StatsSnapshotResponse>(`/stats/snapshot?timezone=${encodeURIComponent(timezone)}`);
}

export function rebuildStatsSnapshot(timezone = 'Australia/Sydney'): Promise<StatsSnapshotResponse> {
  return apiPost<StatsSnapshotResponse>('/stats/rebuild', { timezone });
}
