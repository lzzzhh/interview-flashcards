// backend/src/services/search/gating-config.ts
// Evidence-gated filtering config — intent-specific thresholds.
//
// These are the DEFAULT initial values. Final values should be tuned
// through the eval benchmark (release-gate-by-group, run-search-eval, etc.).
//
// Core principle:
//   reranker score is ALREADY a weighted score.
//   This layer does NOT add another weighted score.
//   It only judges: does this card have enough relevance evidence?

export type SearchIntent = 'search_cards' | 'create_plan' | 'review_weakness' | 'recommend_cards' | 'compare_cards' | 'clarify';

export interface IntentGatingConfig {
  /** Minimum reranker score regardless of top-score ratio */
  baseMinScore: number;
  /** topScore * ratio = threshold floor. Final threshold = max(baseMinScore, topScore * ratio) */
  topScoreRatio: number;
  /** Minimum number of strong+good cards before allowing weak cards into results */
  minStrongGoodBeforeWeak: number;
  /** Whether weak cards can be used as fallback when strong+good are insufficient */
  allowWeakFallback: boolean;
  /** Max weak cards allowed in top 15 when strong+good are sufficient */
  maxWeakInTop15: number;
  /** Max weak cards allowed in top 5 */
  maxWeakInTop5: number;
}

export interface GatingConfig {
  search_cards: IntentGatingConfig;
  recommend_cards: IntentGatingConfig;
  create_plan: IntentGatingConfig;
  review_weakness: IntentGatingConfig;
  compare_cards: IntentGatingConfig;
  clarify: IntentGatingConfig;
}

// ── Default config ──
//
// These are INITIAL VALUES for the benchmark to tune.
// DO NOT hard-code these assumptions into the filtering logic.

export const DEFAULT_GATING_CONFIG: GatingConfig = {
  search_cards: {
    baseMinScore: 0.7,
    topScoreRatio: 0.35,
    minStrongGoodBeforeWeak: 10,
    allowWeakFallback: true,
    maxWeakInTop15: 5,
    maxWeakInTop5: 0,  // Top5 must be all strong/good
  },
  recommend_cards: {
    baseMinScore: 0.2,
    topScoreRatio: 0.15,
    minStrongGoodBeforeWeak: 5,
    allowWeakFallback: true,
    maxWeakInTop15: 8,
    maxWeakInTop5: 2,
  },
  create_plan: {
    baseMinScore: 0.2,
    topScoreRatio: 0.15,
    minStrongGoodBeforeWeak: 5,
    allowWeakFallback: true,
    maxWeakInTop15: 8,
    maxWeakInTop5: 2,
  },
  review_weakness: {
    baseMinScore: 0.2,
    topScoreRatio: 0.15,
    minStrongGoodBeforeWeak: 3,
    allowWeakFallback: true,
    maxWeakInTop15: 10,
    maxWeakInTop5: 3,
  },
  compare_cards: {
    baseMinScore: 0.5,
    topScoreRatio: 0.25,
    minStrongGoodBeforeWeak: 5,
    allowWeakFallback: true,
    maxWeakInTop15: 5,
    maxWeakInTop5: 1,
  },
  clarify: {
    baseMinScore: 0.5,
    topScoreRatio: 0.25,
    minStrongGoodBeforeWeak: 5,
    allowWeakFallback: true,
    maxWeakInTop15: 5,
    maxWeakInTop5: 1,
  },
};

let currentConfig: GatingConfig = { ...DEFAULT_GATING_CONFIG };

export function getGatingConfig(): GatingConfig {
  return currentConfig;
}

/** Update gating config at runtime (for eval/benchmark tuning) */
export function setGatingConfig(config: Partial<GatingConfig>): void {
  if (config.search_cards) currentConfig.search_cards = { ...currentConfig.search_cards, ...config.search_cards };
  if (config.recommend_cards) currentConfig.recommend_cards = { ...currentConfig.recommend_cards, ...config.recommend_cards };
  if (config.create_plan) currentConfig.create_plan = { ...currentConfig.create_plan, ...config.create_plan };
  if (config.review_weakness) currentConfig.review_weakness = { ...currentConfig.review_weakness, ...config.review_weakness };
  if (config.compare_cards) currentConfig.compare_cards = { ...currentConfig.compare_cards, ...config.compare_cards };
  if (config.clarify) currentConfig.clarify = { ...currentConfig.clarify, ...config.clarify };
}

export function resetGatingConfig(): void {
  currentConfig = { ...DEFAULT_GATING_CONFIG };
}

/** Map intent string to gating config key */
export function intentToConfigKey(intent: string): keyof GatingConfig {
  const map: Record<string, keyof GatingConfig> = {
    search_cards: 'search_cards',
    recommend_cards: 'recommend_cards',
    create_plan: 'create_plan',
    review_weakness: 'review_weakness',
    compare_cards: 'compare_cards',
    clarify: 'clarify',
    // study/plan/recommend_cards from query-understanding map to learning-path intents
    study: 'recommend_cards',
    plan: 'create_plan',
  };
  return map[intent] || 'search_cards';
}
