// ============================================================
// src/context/AppContext.tsx — 全局状态管理
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
import { sm2, createDefaultSM2 } from '../utils/sm2';
import { loadProgress, saveProgress, loadSettings, saveSettings } from '../utils/storage';
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

// ---- 合并 progress 到卡片 ----
function mergeProgress(cards: FlashCard[], progress: StoredProgress): FlashCard[] {
  return cards.map((card) => ({
    ...card,
    sm2: progress.sm2[card.id] ?? card.sm2,
    favorited: progress.favorited.includes(card.id),
  }));
}

// ---- Reducer ----
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CATEGORY': {
      const rawCards = CARD_DATA[action.payload];
      const progress = loadProgress(action.payload);
      const cards = mergeProgress(rawCards, progress);
      return {
        ...state,
        category: action.payload,
        cards,
        currentIndex: 0,
        showApproach: false,
        showCode: false,
        qaAnswerVisible: false,
        filterDifficulty: 'all',
        filterSubTopic: 'all',
        searchQuery: '',
        shuffled: false,
      };
    }

    case 'SET_CARDS':
      return { ...state, cards: action.payload, currentIndex: 0 };

    case 'GO_TO':
      return {
        ...state,
        currentIndex: Math.max(0, Math.min(action.payload, state.cards.length - 1)),
      };

    case 'NEXT':
      return {
        ...state,
        currentIndex: Math.min(state.currentIndex + 1, state.cards.length - 1),
        qaAnswerVisible: false,
        showApproach: false,
        showCode: false,
      };

    case 'PREV':
      return {
        ...state,
        currentIndex: Math.max(state.currentIndex - 1, 0),
        qaAnswerVisible: false,
        showApproach: false,
        showCode: false,
      };

    case 'TOGGLE_APPROACH':
      return { ...state, showApproach: !state.showApproach };

    case 'TOGGLE_CODE':
      return { ...state, showCode: !state.showCode };

    case 'TOGGLE_MASTERED': {
      const idx = state.currentIndex;
      if (idx >= state.cards.length) return state;
      const card = state.cards[idx];
      const isNowMastered = card.sm2.repetitions === 0;
      const newSm2: SM2Record = isNowMastered
        ? { ...card.sm2, repetitions: 3, nextReview: Date.now() + 6 * 86400000 }
        : createDefaultSM2();
      const newCards = state.cards.map((c, i) =>
        i === idx ? { ...c, sm2: newSm2 } : c,
      );
      return { ...state, cards: newCards };
    }

    case 'TOGGLE_FAVORITE': {
      const newCards = state.cards.map((c) =>
        c.id === action.payload ? { ...c, favorited: !c.favorited } : c,
      );
      return { ...state, cards: newCards };
    }

    case 'RATE_CARD': {
      const idx = state.currentIndex;
      if (idx >= state.cards.length) return state;
      const card = state.cards[idx];
      const newSm2 = sm2(card.sm2, action.payload);
      const newCards = state.cards.map((c, i) =>
        i === idx ? { ...c, sm2: newSm2 } : c,
      );
      return { ...state, cards: newCards };
    }

    case 'SET_FILTER_DIFFICULTY':
      return { ...state, filterDifficulty: action.payload };

    case 'SET_FILTER_SUBTOPIC':
      return { ...state, filterSubTopic: action.payload };

    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };

    case 'TOGGLE_DARK': {
      const next = !state.isDark;
      saveSettings({ isDark: next, lastCategory: state.category });
      return { ...state, isDark: next };
    }

    case 'TOGGLE_STATS':
      return { ...state, showStats: !state.showStats };

    case 'SHUFFLE': {
      const filtered = applyFilters(state.cards, state);
      const shuffled = shuffle(filtered);
      return { ...state, cards: shuffled, currentIndex: 0, shuffled: true };
    }

    case 'RESET_ORDER': {
      const rawCards = CARD_DATA[state.category];
      const progress = loadProgress(state.category);
      return {
        ...state,
        cards: mergeProgress(rawCards, progress),
        currentIndex: 0,
        shuffled: false,
      };
    }

    case 'TOGGLE_REVIEW_MODE': {
      const next = !state.reviewMode;
      if (next) {
        const due = state.cards.filter((c) => c.sm2.nextReview <= Date.now());
        return { ...state, reviewMode: true, cards: due, currentIndex: 0 };
      } else {
        const rawCards = CARD_DATA[state.category];
        const progress = loadProgress(state.category);
        return {
          ...state,
          reviewMode: false,
          cards: mergeProgress(rawCards, progress),
          currentIndex: 0,
        };
      }
    }

    case 'TOGGLE_QA_ANSWER':
      return { ...state, qaAnswerVisible: !state.qaAnswerVisible };

    default:
      return state;
  }
}

// ---- 筛选 helpers ----
export function getMasteredIds(cards: FlashCard[]): string[] {
  return cards
    .filter((c) => c.sm2.repetitions > 0)
    .map((c) => c.id);
}

export function getFavoritedIds(cards: FlashCard[]): string[] {
  return cards.filter((c) => c.favorited).map((c) => c.id);
}

export function applyFilters(cards: FlashCard[], state: AppState): FlashCard[] {
  let filtered = [...cards];

  // filter by difficulty
  if (state.filterDifficulty !== 'all') {
    filtered = filtered.filter((c) => {
      const d = isLeetCodeCard(c) ? c.difficulty : c.difficulty ?? 'medium';
      return d === state.filterDifficulty;
    });
  }

  // filter by subtopic
  if (state.filterSubTopic !== 'all') {
    filtered = filtered.filter((c) => {
      if (isLeetCodeCard(c)) return c.tags.includes(state.filterSubTopic);
      return c.subTopic === state.filterSubTopic;
    });
  }

  // search
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter((c) => {
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
        (c.subTopic ?? '').includes(q)
      );
    });
  }

  return filtered;
}

function isLeetCodeCard(card: FlashCard): card is LeetCodeCard {
  return card.category === 'leetcode';
}

// ---- Initial State ----
function createInitialState(): AppState {
  const settings = loadSettings();
  const category = settings.lastCategory ?? 'leetcode';
  const rawCards = CARD_DATA[category];
  const progress = loadProgress(category);
  const cards = mergeProgress(rawCards, progress);

  return {
    category,
    cards,
    currentIndex: 0,
    showApproach: false,
    showCode: false,
    filterDifficulty: 'all',
    filterSubTopic: 'all',
    searchQuery: '',
    isDark: settings.isDark ?? false,
    showStats: false,
    shuffled: false,
    reviewMode: false,
    qaAnswerVisible: false,
  };
}

// ---- Context ----
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  filteredCards: FlashCard[];
  currentCard: FlashCard | null;
  masteredIds: string[];
  favoritedIds: string[];
  dueCountByCategory: Record<Category, number>;
  totalDue: number;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);

  // persist dark mode class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.isDark);
  }, [state.isDark]);

  // persist progress after mutations
  useEffect(() => {
    const progress: StoredProgress = {
      sm2: {},
      mastered: getMasteredIds(state.cards),
      favorited: getFavoritedIds(state.cards),
    };
    for (const card of state.cards) {
      progress.sm2[card.id] = card.sm2;
    }
    saveProgress(state.category, progress);
  }, [state.cards, state.category]);

  // persist settings
  useEffect(() => {
    saveSettings({ isDark: state.isDark, lastCategory: state.category });
  }, [state.isDark, state.category]);

  const filteredCards = useMemo(
    () => applyFilters(state.cards, state),
    [state.cards, state.filterDifficulty, state.filterSubTopic, state.searchQuery],
  );

  const currentCard =
    filteredCards.length > 0 ? filteredCards[Math.min(state.currentIndex, filteredCards.length - 1)] : null;

  const masteredIds = useMemo(() => getMasteredIds(state.cards), [state.cards]);
  const favoritedIds = useMemo(() => getFavoritedIds(state.cards), [state.cards]);

  // Due counts by category — compute from ALL card data (not just loaded)
  const dueCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [cat, allCards] of Object.entries(CARD_DATA) as [Category, FlashCard[]][]) {
      const progress = loadProgress(cat);
      const merged = allCards.map((c) => ({
        ...c,
        sm2: progress.sm2[c.id] ?? c.sm2,
      }));
      counts[cat] = merged.filter((c) => c.sm2.nextReview <= Date.now()).length;
    }
    return counts as Record<Category, number>;
  }, [state.cards, state.category]); // re-evaluate when cards change

  const totalDue = useMemo(
    () => Object.values(dueCountByCategory).reduce((a, b) => a + b, 0),
    [dueCountByCategory],
  );

  const value: AppContextValue = {
    state,
    dispatch,
    filteredCards,
    currentCard,
    masteredIds,
    favoritedIds,
    dueCountByCategory,
    totalDue,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
