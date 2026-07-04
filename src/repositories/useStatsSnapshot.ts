import { useCallback, useEffect, useMemo, useState } from 'react';
import { getStatsSnapshot } from '../api/stats';
import type { StatsSnapshotResponse, StatsSnapshotRowDTO } from '../api/types';
import { syncLocalAppDataToBackend } from '../utils/backendSync';

export function useStatsSnapshot(): {
  snapshot: StatsSnapshotResponse | null;
  byDeck: Record<string, StatsSnapshotRowDTO>;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [snapshot, setSnapshot] = useState<StatsSnapshotResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await syncLocalAppDataToBackend();
      setSnapshot(await getStatsSnapshot());
    } catch {
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const byDeck = useMemo(() => {
    const result: Record<string, StatsSnapshotRowDTO> = {};
    for (const row of snapshot?.decks ?? []) result[row.scopeId] = row;
    return result;
  }, [snapshot]);

  return { snapshot, byDeck, loading, refresh };
}
