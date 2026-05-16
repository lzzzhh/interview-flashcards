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
  useRef,
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
import { deepLearningCards } from '../data/deep-learning';
import { llmCards } from '../data/llm';
import { agentCards } from '../data/agent';
import { jargonCards } from '../data/jargon';
import { workplaceCards } from '../data/workplace';
import { scheduleReview, createDefaultSM2 } from '../utils/sm2';
import { loadProgress, saveSettings } from '../utils/storage';
import { loadAppData, saveAppData } from '../utils/nativeStorage';
import { appendReviewLog } from '../utils/reviewLogs';
import { shuffle } from '../utils/shuffle';
import { loadCustomCards } from '../utils/customDecks';
import { getModuleDailyLimit } from '../utils/customDecks';
import { SUB_MODULES } from '../constants';
import { logSyncOp } from '../sync/hook';

// ---- Undo support ----
let lastRating: { cardId: string; previousSm2: any } | null = null;
export function setLastRating(data: typeof lastRating) { lastRating = data; }
export function getLastRating() { const r = lastRating; lastRating = null; return r; }

// ---- 数据源映射 ----
const CARD_DATA: Partial<Record<Category, FlashCard[]>> = {
  leetcode: leetcodeHot100 as FlashCard[],
  statistics: statisticsCards as FlashCard[],
  'machine-learning': machineLearningCards as FlashCard[],
  'deep-learning': deepLearningCards as FlashCard[],
  llm: llmCards as FlashCard[],
  agent: agentCards as FlashCard[],
  jargon: jargonCards as FlashCard[],
  workplace: workplaceCards as FlashCard[],
};

const progressKeyMap: Record<Category, string> = {
  leetcode: 'fc-leetcode-progress',
  statistics: 'fc-stats-progress',
  'machine-learning': 'fc-ml-progress',
  'deep-learning': 'fc-deep-learning-progress',
  llm: 'fc-llm-progress',
  agent: 'fc-agent-progress',
  jargon: 'fc-jargon-progress',
  workplace: 'fc-workplace-progress',
};

// ---- 合并 progress → cardsById ----
function buildCardsById(category: Category): Record<string, FlashCard> {
  const now = Date.now();
  // 内置模块
  const rawCards = CARD_DATA[category];
  if (rawCards) {
    const progress = loadProgress(category);
    const result: Record<string, FlashCard> = {};
    for (const card of rawCards) {
      const sm2 = progress.sm2[card.id]
        ? { ...card.sm2, ...progress.sm2[card.id] }
        : { ...card.sm2, nextReview: now }; // 新卡片 nextReview 用当前时间
      result[card.id] = { ...card, sm2, favorited: progress.favorited.includes(card.id) };
    }
    return result;
  }
  
  // 自定义模块
  const customCards = loadCustomCards(category as string);
  const result: Record<string, FlashCard> = {};
  for (const card of customCards) {
    result[card.id] = { ...card, sm2: { ...card.sm2, nextReview: now } };
  }
  return result;
}

function isLeetCodeCard(card: FlashCard): card is LeetCodeCard {
  return card.category === 'leetcode';
}

// ---- 筛选 visibleCardIds ----
function computeVisibleIds(state: AppState): string[] {
  let ids = Object.keys(state.cardsById);

  // 学习模式：新学 / 复习
  if (state.studyMode === 'new') {
    ids = ids.filter((id) => {
      const sm2 = state.cardsById[id]?.sm2;
      return !sm2 || sm2.state === 'new';
    });
  } else if (state.studyMode === 'review') {
    ids = ids.filter((id) => {
      const sm2 = state.cardsById[id]?.sm2;
      return sm2 && sm2.state !== 'new' && sm2.nextReview <= Date.now();
    });
  }

  // 难度
  if (state.filterDifficulty !== 'all') {
    ids = ids.filter((id) => {
      const c = state.cardsById[id];
      const d = isLeetCodeCard(c) ? c.difficulty : c.difficulty ?? 'medium';
      return d === state.filterDifficulty;
    });
  }

  // 子主题 / 标签过滤（必须在每日上限截取之前）
  if (state.filterSubTopic !== 'all') {
    const subMods = SUB_MODULES[state.category] || [];
    const sm = subMods.find((s: any) => s.key === state.filterSubTopic);

    if (sm?.tags && sm.tags.length > 0) {
      // LeetCode: 按标签匹配
      const tagSet = new Set(sm.tags);
      ids = ids.filter((id) => {
        const c = state.cardsById[id];
        if (!isLeetCodeCard(c)) return false;
        return c.tags.some((t) => tagSet.has(t));
      });
    } else if (sm?.subTopic) {
      // QA 卡片: 按 subTopic 匹配
      ids = ids.filter((id) => {
        const c = state.cardsById[id];
        if (isLeetCodeCard(c)) return false;
        return 'subTopic' in c && c.subTopic === sm.subTopic;
      });
    } else if (sm) {
      // "其他专题" / 无标签无 subTopic
      const knownSubTopics = new Set(subMods.filter((s: any) => s.subTopic).map((s: any) => s.subTopic));
      const knownTags = new Set(subMods.filter((s: any) => s.tags).flatMap((s: any) => s.tags!));
      ids = ids.filter((id) => {
        const c = state.cardsById[id];
        if (isLeetCodeCard(c)) {
          if (knownTags.size === 0) return true;
          return !c.tags.some((t) => knownTags.has(t));
        }
        const st = (c as any).subTopic;
        return !st || !knownSubTopics.has(st);
      });
    } else {
      // 自定义专题：按 subTopic 直接匹配（自定义专题的 key 不在 SUB_MODULES 中）
      ids = ids.filter((id) => {
        const c = state.cardsById[id];
        if (isLeetCodeCard(c)) return false;
        return 'subTopic' in c && c.subTopic === state.filterSubTopic;
      });
    }
  }

  // 每日上限（新学模式，在过滤之后截取）
  if (state.studyMode === 'new') {
    const limit = getModuleDailyLimit(state.category);
    ids = ids.slice(0, limit);
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
        studyMode: 'choose' as const,
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
      // 保存原始状态用于撤回
      setLastRating({ cardId, previousSm2: { ...card.sm2 } });
      const result = scheduleReview(cardId, card.sm2, rating);
      appendReviewLog(result.log);
      // 写入同步 oplog
      logSyncOp({
        op: 'rate', cardId, ts: Date.now(), deviceId: 'local', seq: Date.now(),
        data: { rating, sm2: result.sm2, reviewLog: result.log },
      });
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

    case 'SET_STUDY_MODE': {
      const next = { 
        ...state, 
        studyMode: action.payload,
        filterSubTopic: action.payload === 'choose' ? 'all' : state.filterSubTopic,
      };
      return { ...next, visibleCardIds: computeVisibleIds(next), currentVisibleIndex: 0 };
    }

    case 'UNDO_LAST_RATING': {
      const last = getLastRating();
      if (!last || !state.cardsById[last.cardId]) return state;
      return {
        ...state,
        cardsById: { 
          ...state.cardsById, 
          [last.cardId]: { ...state.cardsById[last.cardId], sm2: last.previousSm2 } 
        },
        qaAnswerVisible: false,
      };
    }

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
    studyMode: 'choose',
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

  // 启动时从 data.json 恢复进度到 localStorage
  const hasLoadedData = useRef(false);
  useEffect(() => {
    loadAppData().then(() => {
      hasLoadedData.current = true;
      // 重建 cardsById，使用刚从文件恢复的进度
      dispatch({ type: 'SET_CATEGORY', payload: state.category });
    });
  }, []);

  // 初始化时触发可见卡片计算
  useEffect(() => {
    dispatch({ type: 'SET_FILTER_DIFFICULTY', payload: 'all' });
  }, []);

  // persist dark mode class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.isDark);
  }, [state.isDark]);

  // 持久化（数据未从文件恢复前跳过，防止空数据覆盖 data.json）
  useEffect(() => {
    if (!hasLoadedData.current) return;

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
        // 防御：state 可以是 learning / review / relearning，缺失或不认识的视为 new
        const knownStates = new Set(['learning', 'review', 'relearning']);
        if (!knownStates.has(sm2.state)) return false;
        return sm2.nextReview <= Date.now();
      }).length;
    }
    return counts as Record<Category, number>;
  }, [state.cardsById]);

  const totalDue = useMemo(() => Object.values(dueCountByCategory).reduce((a, b) => a + b, 0), [dueCountByCategory]);

  // 新卡片总数（从 localStorage 读取真实状态）
  const totalNew = useMemo(() => {
    let count = 0;
    for (const [cat, allCards] of Object.entries(CARD_DATA) as [Category, FlashCard[]][]) {
      const progress = loadProgress(cat);
      count += allCards.filter((c) => {
        const sm2 = progress.sm2[c.id];
        return !sm2 || sm2.state === 'new';
      }).length;
    }
    return count;
  }, [state.cardsById]);

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
    const key = progressKeyMap[category] ?? `fc-progress-${category}`;
    localStorage.setItem(key, JSON.stringify(progress));
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
