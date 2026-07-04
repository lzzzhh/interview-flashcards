import type { StatsSnapshotResponse } from '../api/types';
import type { StudyModeConfig } from '../types';
import { apiPost } from '../api/client';
import { setModuleDailyLimit, setModuleDailyReviewLimit } from './customDecks';
import { persistLocalAppData } from './nativeStorage';
import { saveStudyModeConfig } from './studyModeConfig';
import { syncLocalAppDataToBackend } from './backendSync';

export async function applyStudyModeConfig(
  config: StudyModeConfig,
  snapshot: StatsSnapshotResponse | null,
): Promise<void> {
  saveStudyModeConfig(config);

  const selectedDeckIds = new Set(config.selectedDecks);
  const deckIds = new Set([
    ...(snapshot?.decks ?? []).map((deck) => deck.scopeId),
    ...Object.keys(config.dailyQuota),
  ]);
  const limits: Record<string, { newLimit: number; reviewLimit: number }> = {};

  for (const deckId of deckIds) {
    const quota = selectedDeckIds.has(deckId) ? config.dailyQuota[deckId] ?? 0 : 0;
    const reviewLimit = quota * config.dailyReviewMultiplier;
    setModuleDailyLimit(deckId, quota);
    setModuleDailyReviewLimit(deckId, reviewLimit);
    limits[deckId] = { newLimit: quota, reviewLimit };
  }

  await persistLocalAppData().catch(() => {});
  if (Object.keys(limits).length > 0) {
    await apiPost('/stats/set-deck-limits', { limits }).catch(() => {});
  }
  await syncLocalAppDataToBackend().catch(() => {});
}
