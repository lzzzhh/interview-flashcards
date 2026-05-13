// ============================================================
// src/context/AppContext.tsx — 重构版
// cardsById 永远保存完整数据，visibleCardIds 只存筛选结果
// 所有卡片操作通过 cardId，不用 index
// ============================================================

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  AppState,
  AppAction,
  Category,
  FlashCard,
  LeetCodeCard,
  SM2Record,
  StoredProgress,
} from '../types';
import { leetcodeHot100 } from '../data/leetcode-hot100';
import { statisticsCards } from '../data/statistics';
import { machineLearningCards } from '../data/machine-learning';
import { llmCards } from '../data/llm';
import { jargonCards } from '../data/jargon';
import { workplaceCards } from '../data/workplace';
import { scheduleReview, createDefaultSM2 } from '../utils/sm2';
import { loadProgress, saveSettings } from '../utils/storage';
import { saveAppData } from '../utils/nativeStorage';
import { appendReviewLog } from '../utils/reviewLogs';
import { shuffle } from '../utils/shuffle';

// ---- 数据源映射 ----
const CARD_DATA: Record<Category, FlashCard[]> = {
  leetcode: leetcodeHot100 as FlashCard[],
  statistics: statisticsCards as FlashCard[],
  'machine-learning': machineLearningCards as FlashCard[],
  llm: llmCards as FlashCard[],
  jargon: jargonCards as FlashCard[],
  workplace: workplaceCards as FlashCard[],
};

const progressKeyMap: Record<Category, string> = {
  leetcode: 'fc-leetcode-progress',
  statistics: 'fc-stats-progress',
  'machine-learning': 'fc-ml-progress',
  llm: 'fc-llm-progress',
  jargon: 'fc-jargon-progress',
  workplace: 'fc-workplace-progress',
};

// ---- 合并 progress → cardsById ----
function buildCardsById(category: Category): Record<string, FlashCard> {
  const rawCards = CARD_DATA[category];
  const progress = loadProgress(category);
  const result: Record<string, FlashCard> = {};
  for (const card of rawCards) {
    const sm2 = progress.sm2[card.id]
      ? { ...card.sm2, ...progress.sm2[card.id] } // merge stored state
      : card.sm2;
    result[card.id] = { ...card, sm2, favorited: progress.favorited.includes(card.id) };
  }
  return result;
}

function isLeetCodeCard(card: FlashCard): card is LeetCodeCard {
  return card.category === 'leetcode';
}

// ---- 筛选 visibleCardIds ----
function computeVisibleIds(state: AppState): string[] {
  let ids = Object.keys(state.cardsById);

  // 复习模式：新卡片（限制数量）+ 到期卡片
  if (state.reviewMode) {
    const newIds = ids.filter((id) => state.cardsById[id].sm2.state === 'new');
    const reviewIds = ids.filter((id) => {
      const sm2 = state.cardsById[id].sm2;
      return sm2.state !== 'new' && sm2.nextReview <= Date.now();
    });
    // 新卡限制每日数量
    const limitedNew = newIds.slice(0, state.dailyNewLimit);
    // 到期卡片优先，新卡片排在后面
    ids = [...reviewIds, ...limitedNew];
  }

  // 难度
  if (state.filterDifficulty !== 'all') {
    ids = ids.filter((id) => {
      const c = state.cardsById[id];
      const d = isLeetCodeCard(c) ? c.difficulty : c.difficulty ?? 'medium';
      return d === state.filterDifficulty;
    });
  }

  // 子主题
  if (state.filterSubTopic !== 'all') {
    ids = ids.filter((id) => {
      const c = state.cardsById[id];
      if (isLeetCodeCard(c)) return c.tags.includes(state.filterSubTopic);
      return 'subTopic' in c && c.subTopic === state.filterSubTopic;
    });
  }

  // 搜索
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    ids = ids.filter((id) => {
      const c = state.cardsById[id];
      if (isLeetCodeCard(c)) {
        return (
          c.title.toLowerCase().includes(q) ||
          c.titleCn.includes(q) ||
          c.tags.some((t) => t.includes(q)) ||
          c.description.includes(q) ||
          c.approach.includes(q)
        );
      }
      return (
        c.question.includes(q) ||
        c.answer.includes(q) ||
        (c.tags ?? []).some((t) => t.includes(q)) ||
        ((c as any).subTopic ?? '').includes(q)
      );
    });
  }

  // 随机
  if (state.shuffled) {
    ids = shuffle(ids);
  }

  return ids;
}

// ---- Reducer ----
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CATEGORY': {
      const nextState = {
        ...state,
        category: action.payload,
        cardsById: buildCardsById(action.payload),
        showApproach: false,
        showCode: false,
        qaAnswerVisible: false,
        filterDifficulty: 'all' as const,
        filterSubTopic: 'all' as const,
        searchQuery: '',
        shuffled: false,
        reviewMode: false,
      };
      return { ...nextState, visibleCardIds: computeVisibleIds(nextState), currentVisibleIndex: 0 };
    }

    case 'GO_TO':
      return {
        ...state,
        currentVisibleIndex: Math.max(0, Math.min(action.payload, state.visibleCardIds.length - 1)),
      };

    case 'NEXT':
      return {
        ...state,
        currentVisibleIndex: Math.min(state.currentVisibleIndex + 1, state.visibleCardIds.length - 1),
        qaAnswerVisible: false,
        showApproach: false,
        showCode: false,
      };

    case 'PREV':
      return {
        ...state,
        currentVisibleIndex: Math.max(state.currentVisibleIndex - 1, 0),
        qaAnswerVisible: false,
        showApproach: false,
        showCode: false,
      };

    case 'TOGGLE_APPROACH':
      return { ...state, showApproach: !state.showApproach };

    case 'TOGGLE_CODE':
      return { ...state, showCode: !state.showCode };

    case 'TOGGLE_QA_ANSWER':
      return { ...state, qaAnswerVisible: !state.qaAnswerVisible };

    case 'TOGGLE_MASTERED': {
      const card = state.cardsById[action.payload];
      if (!card) return state;
      const newSm2: SM2Record = card.sm2.state === 'new'
        ? { ...card.sm2, state: 'learning' as const, interval: 6, repetitions: 3, nextReview: Date.now() + 6 * 86400000 }
        : createDefaultSM2();
      return {
        ...state,
        cardsById: { ...state.cardsById, [action.payload]: { ...card, sm2: newSm2 } },
      };
    }

    case 'TOGGLE_FAVORITE': {
      const card = state.cardsById[action.payload];
      if (!card) return state;
      return {
        ...state,
        cardsById: {
          ...state.cardsById,
          [action.payload]: { ...card, favorited: !card.favorited },
        },
      };
    }

    case 'RATE_CARD': {
      const { cardId, rating } = action.payload;
      const card = state.cardsById[cardId];
      if (!card) return state;
      const result = scheduleReview(cardId, card.sm2, rating);
      // 持久化 ReviewLog
      appendReviewLog(result.log);
      return {
        ...state,
        cardsById: {
          ...state.cardsById,
          [cardId]: { ...card, sm2: result.sm2 },
        },
        qaAnswerVisible: false,
      };
    }

    case 'SET_FILTER_DIFFICULTY': {
      const next = { ...state, filterDifficulty: action.payload };
      return { ...next, visibleCardIds: computeVisibleIds(next), currentVisibleIndex: 0 };
    }

    case 'SET_FILTER_SUBTOPIC': {
      const next = { ...state, filterSubTopic: action.payload };
      return { ...next, visibleCardIds: computeVisibleIds(next), currentVisibleIndex: 0 };
    }

    case 'SET_SEARCH': {
      const next = { ...state, searchQuery: action.payload };
      return { ...next, visibleCardIds: computeVisibleIds(next), currentVisibleIndex: 0 };
    }

    case 'TOGGLE_DARK': {
      const next = !state.isDark;
      saveSettings({ isDark: next, lastCategory: state.category });
      return { ...state, isDark: next };
    }

    case 'TOGGLE_STATS':
      return { ...state, showStats: !state.showStats };

    case 'TOGGLE_REVIEW_MODE': {
      const nextReview = !state.reviewMode;
      const next = { ...state, reviewMode: nextReview };
      return { ...next, visibleCardIds: computeVisibleIds(next), currentVisibleIndex: 0 };
    }

    case 'SHUFFLE': {
      const next = { ...state, shuffled: true };
      return { ...next, visibleCardIds: computeVisibleIds(next), currentVisibleIndex: 0 };
    }

    case 'RESET_ORDER': {
      const next = { ...state, shuffled: false };
      return { ...next, visibleCardIds: computeVisibleIds(next), currentVisibleIndex: 0 };
    }

    case 'ADD_CARD': {
      const card = action.payload;
      return {
        ...state,
        cardsById: { ...state.cardsById, [card.id]: card },
      };
    }

    case 'UPDATE_CARD': {
      const card = action.payload;
      return {
        ...state,
        cardsById: { ...state.cardsById, [card.id]: card },
      };
    }

    case 'DELETE_CARD': {
      const newCards = { ...state.cardsById };
      delete newCards[action.payload];
      return {
        ...state,
        cardsById: newCards,
      };
    }

    case 'SET_DAILY_NEW_LIMIT':
      return { ...state, dailyNewLimit: action.payload };

    default:
      return state;
  }
}

// ---- Helpers ----
export function getMasteredIds(cardsById: Record<string, FlashCard>): string[] {
  return Object.values(cardsById)
    .filter((c) => c.sm2.state !== 'new')
    .map((c) => c.id);
}

export function getFavoritedIds(cardsById: Record<string, FlashCard>): string[] {
  return Object.values(cardsById).filter((c) => c.favorited).map((c) => c.id);
}

// ---- Initial State ----
function createInitialState(): AppState {
  const settings = (() => {
    try { return JSON.parse(localStorage.getItem('fc-settings') || '{}'); }
    catch { return {}; }
  })();
  const category = settings.lastCategory ?? 'leetcode';

  return {
    category,
    cardsById: buildCardsById(category),
    visibleCardIds: [],
    currentVisibleIndex: 0,
    showApproach: false,
    showCode: false,
    qaAnswerVisible: false,
    filterDifficulty: 'all',
    filterSubTopic: 'all',
    searchQuery: '',
    isDark: settings.isDark ?? false,
    showStats: false,
    shuffled: false,
    reviewMode: false,
    dailyNewLimit: 20,
  };
}

// ---- Context ----
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  currentCard: FlashCard | null;
  visibleCards: FlashCard[];
  masteredIds: string[];
  favoritedIds: string[];
  dueCountByCategory: Record<Category, number>;
  totalDue: number;
  totalNew: number;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);

  // 初始化时触发可见卡片计算
  useEffect(() => {
    // Dispatch a no-op filter change to trigger visibleCardIds computation
    dispatch({ type: 'SET_FILTER_DIFFICULTY', payload: 'all' });
  }, []);

  // persist dark mode class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.isDark);
  }, [state.isDark]);

  // 持久化
  useEffect(() => {
    const progress: StoredProgress = {
      sm2: {},
      mastered: getMasteredIds(state.cardsById),
      favorited: getFavoritedIds(state.cardsById),
    };
    for (const card of Object.values(state.cardsById)) {
      progress.sm2[card.id] = card.sm2;
    }
    saveProgressToLS(state.category, progress);

    // Tauri 文件存储
    const allData = loadAllProgress();
    saveAppData({
      schemaVersion: 1,
      progress: allData,
      reviewLogs: {},
      settings: { isDark: state.isDark, lastCategory: state.category },
      stats: { sessions: [] },
    } as any);
  }, [state.cardsById, state.category, state.isDark]);

  const currentCard = state.visibleCardIds.length > 0
    ? state.cardsById[state.visibleCardIds[state.currentVisibleIndex]] ?? null
    : null;

  const visibleCards = useMemo(
    () => state.visibleCardIds.map((id) => state.cardsById[id]).filter(Boolean) as FlashCard[],
    [state.visibleCardIds, state.cardsById],
  );

  const masteredIds = useMemo(() => getMasteredIds(state.cardsById), [state.cardsById]);
  const favoritedIds = useMemo(() => getFavoritedIds(state.cardsById), [state.cardsById]);

  // Due counts
  const dueCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [cat, allCards] of Object.entries(CARD_DATA) as [Category, FlashCard[]][]) {
      const progress = loadProgress(cat);
      counts[cat] = allCards.filter((c) => {
        const sm2 = progress.sm2[c.id] ?? c.sm2;
        // 新卡片不计入到期数，只有复习过的卡片到期才算
        return sm2.state !== 'new' && sm2.nextReview <= Date.now();
      }).length;
    }
    return counts as Record<Category, number>;
  }, [state.cardsById]);

  const totalDue = useMemo(() => Object.values(dueCountByCategory).reduce((a, b) => a + b, 0), [dueCountByCategory]);

  // 新卡片总数
  const totalNew = useMemo(() => {
    let count = 0;
    for (const cat of Object.values(CARD_DATA) as FlashCard[][]) {
      count += cat.filter((c) => c.sm2.state === 'new').length;
    }
    return count;
  }, []);

  const value: AppContextValue = {
    state,
    dispatch,
    currentCard,
    visibleCards,
    masteredIds,
    favoritedIds,
    dueCountByCategory,
    totalDue,
    totalNew,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

// ---- helpers ----
function saveProgressToLS(category: Category, progress: StoredProgress) {
  try {
    localStorage.setItem(progressKeyMap[category], JSON.stringify(progress));
  } catch {}
}

function loadAllProgress(): Record<string, StoredProgress> {
  const result: Record<string, StoredProgress> = {};
  for (const key of Object.values(progressKeyMap)) {
    try {
      result[key] = JSON.parse(localStorage.getItem(key) || '{"sm2":{},"mastered":[],"favorited":[]}');
    } catch {
      result[key] = { sm2: {}, mastered: [], favorited: [] };
    }
  }
  return result;
}
