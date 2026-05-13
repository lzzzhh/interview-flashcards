// ============================================================
// src/types/index.ts — 所有类型定义
// ============================================================

export type Category = 'leetcode' | 'statistics' | 'machine-learning' | 'llm' | 'jargon' | 'workplace';
export type Difficulty = 'easy' | 'medium' | 'hard';

/** SM-2 复习状态 */
export interface SM2Record {
  easeFactor: number;     // 初始 2.5
  interval: number;       // 复习间隔（天）
  repetitions: number;    // 连续答对次数
  nextReview: number;     // 下次复习时间戳 (ms)
}

/** 力扣 Hot 100 卡片 */
export interface LeetCodeCard {
  id: string;
  category: 'leetcode';
  number: number;
  title: string;
  titleCn: string;
  difficulty: Difficulty;
  tags: string[];
  description: string;
  approach: string;
  code: string;
  sm2: SM2Record;
  favorited: boolean;
}

/** 通用问答卡片（统计学/ML/大模型/黑话/话术） */
export interface QACard {
  id: string;
  category: 'statistics' | 'machine-learning' | 'llm' | 'jargon' | 'workplace';
  question: string;
  answer: string;
  tags?: string[];
  subTopic?: string;
  difficulty?: Difficulty;
  source?: string;
  sm2: SM2Record;
  favorited: boolean;
}

export type FlashCard = LeetCodeCard | QACard;

export interface AppState {
  category: Category;
  cards: FlashCard[];
  currentIndex: number;
  showApproach: boolean;
  showCode: boolean;
  filterDifficulty: Difficulty | 'all';
  filterSubTopic: string | 'all';
  searchQuery: string;
  isDark: boolean;
  showStats: boolean;
  shuffled: boolean;
  reviewMode: boolean;
  qaAnswerVisible: boolean;
}

export type AppAction =
  | { type: 'SET_CATEGORY'; payload: Category }
  | { type: 'SET_CARDS'; payload: FlashCard[] }
  | { type: 'GO_TO'; payload: number }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'TOGGLE_APPROACH' }
  | { type: 'TOGGLE_CODE' }
  | { type: 'TOGGLE_MASTERED' }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'RATE_CARD'; payload: 0 | 1 | 2 | 3 | 4 | 5 }
  | { type: 'SET_FILTER_DIFFICULTY'; payload: Difficulty | 'all' }
  | { type: 'SET_FILTER_SUBTOPIC'; payload: string | 'all' }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'TOGGLE_DARK' }
  | { type: 'TOGGLE_STATS' }
  | { type: 'SHUFFLE' }
  | { type: 'RESET_ORDER' }
  | { type: 'TOGGLE_REVIEW_MODE' }
  | { type: 'TOGGLE_QA_ANSWER' };

// ============================================================
// localStorage 持久化相关类型
// ============================================================

export const STORAGE_KEYS = {
  LEETCODE_PROGRESS: 'fc-leetcode-progress',
  STATISTICS_PROGRESS: 'fc-stats-progress',
  ML_PROGRESS: 'fc-ml-progress',
  LLM_PROGRESS: 'fc-llm-progress',
  JARGON_PROGRESS: 'fc-jargon-progress',
  WORKPLACE_PROGRESS: 'fc-workplace-progress',
  SETTINGS: 'fc-settings',
  STATS: 'fc-stats',
} as const;

export interface StoredProgress {
  sm2: Record<string, SM2Record>;
  mastered: string[];
  favorited: string[];
}

export interface StoredSettings {
  isDark: boolean;
  lastCategory: Category;
}

export interface DayRecord {
  date: string;        // '2026-05-12'
  cardsReviewed: number;
  cardsMastered: number;
}

export interface StoredStats {
  sessions: DayRecord[];
}
