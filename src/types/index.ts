// ============================================================
// src/types/index.ts — 所有类型定义
// ============================================================

export type Category = 'leetcode' | 'statistics' | 'machine-learning' | 'deep-learning' | 'llm' | 'agent' | 'jargon' | 'workplace' | string;
export type Difficulty = 'easy' | 'medium' | 'hard';
export type CardState = 'new' | 'learning' | 'review' | 'relearning';
export type StudyMode = 'choose' | 'new' | 'review';

/** SM-2 复习状态（增强版） */
export interface SM2Record {
  state: CardState;         // new / learning / review / relearning
  easeFactor: number;       // 初始 2.5
  interval: number;         // 复习间隔（天）
  repetitions: number;      // 总复习次数
  lapses: number;           // 遗忘次数
  nextReview: number;       // 下次复习时间戳 (ms)
  lastReviewedAt?: number;  // 上次复习时间戳
}

/** ReviewLog — 每次复习的完整记录 */
export interface ReviewLog {
  id: string;
  cardId: string;
  reviewedAt: number;
  rating: number;
  stateBefore: CardState;
  stateAfter: CardState;
  intervalBefore: number;
  intervalAfter: number;
  easeBefore: number;
  easeAfter: number;
  elapsedDays: number;
  scheduledDays: number;
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
  // 多语言代码不再内联于卡片，改为从 solutions/ 模块按 cardId 获取
  // 向后兼容：导入时临时保留在卡片对象上
  code?: string;
  codes?: Record<string, string>;
  defaultLanguage?: string;
  sm2: SM2Record;
  favorited: boolean;
  userNotes?: string;
}

/** 离线存储 / 导出的卡片快照 */
export interface ExportCard {
  id: string;
  category: Category;
  tags: string[];
  difficulty: Difficulty | '';
  sm2: SM2Record;
  favorited: boolean;
  userNotes?: string;
  // LeetCode 专属
  number?: number;
  title?: string;
  titleCn?: string;
  description?: string;
  approach?: string;
  codes?: Record<string, string>;
  // QA 专属
  question?: string;
  answer?: string;
  subTopic?: string;
  source?: string;
}

/** 统一导出格式 v2 */
export interface ExportData {
  version: 2;
  exportedAt: string;
  cards: ExportCard[];
  reviewLogs: ReviewLog[];
  settings: AppSettings;
}

export interface AppSettings {
  isDark: boolean;
  lastCategory: Category;
}

/** 通用问答卡片（统计学/ML/大模型/黑话/话术） */
export interface QACard {
  id: string;
  category: 'statistics' | 'machine-learning' | 'deep-learning' | 'llm' | 'agent' | 'jargon' | 'workplace';
  question: string;
  answer: string;
  tags?: string[];
  subTopic?: string;
  difficulty?: Difficulty;
  source?: string;
  sm2: SM2Record;
  favorited: boolean;
  userNotes?: string;
}

export type FlashCard = LeetCodeCard | QACard;

// ============================================================
// State — 核心改进：cardsById 永远保存完整数据
// ============================================================
export interface AppState {
  category: Category;

  /** 完整卡片数据源（不可被筛选/review/shuffle 覆盖） */
  cardsById: Record<string, FlashCard>;

  /** 当前可见卡片 ID 列表（过滤/搜索/复习/随机只影响此列表） */
  visibleCardIds: string[];

  /** 当前在 visibleCardIds 中的下标 */
  currentVisibleIndex: number;

  showApproach: boolean;
  showCode: boolean;
  qaAnswerVisible: boolean;

  filterDifficulty: Difficulty | 'all';
  filterSubTopic: string | 'all';
  searchQuery: string;

  isDark: boolean;
  showStats: boolean;
  shuffled: boolean;
  reviewMode: boolean;
  dailyNewLimit: number;
  studyMode: StudyMode;
}

// ============================================================
// Actions
// ============================================================
export type AppAction =
  | { type: 'SET_CATEGORY'; payload: Category }
  | { type: 'GO_TO'; payload: number }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'TOGGLE_APPROACH' }
  | { type: 'TOGGLE_CODE' }
  | { type: 'TOGGLE_QA_ANSWER' }
  | { type: 'TOGGLE_MASTERED'; payload: string }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'RATE_CARD'; payload: { cardId: string; rating: number } }
  | { type: 'SET_FILTER_DIFFICULTY'; payload: Difficulty | 'all' }
  | { type: 'SET_FILTER_SUBTOPIC'; payload: string | 'all' }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'TOGGLE_DARK' }
  | { type: 'TOGGLE_STATS' }
  | { type: 'TOGGLE_REVIEW_MODE' }
  | { type: 'SHUFFLE' }
  | { type: 'RESET_ORDER' }
  | { type: 'ADD_CARD'; payload: FlashCard }
  | { type: 'UPDATE_CARD'; payload: FlashCard }
  | { type: 'JUMP_TO_CARD'; payload: { category: Category; cardId: string } }
  | { type: 'DELETE_CARD'; payload: string }
  | { type: 'SET_DAILY_NEW_LIMIT'; payload: number }
  | { type: 'SET_STUDY_MODE'; payload: StudyMode }
  | { type: 'UNDO_LAST_RATING' };

// ============================================================
// localStorage 持久化（兼容旧格式）
// ============================================================
export const STORAGE_KEYS = {
  LEETCODE_PROGRESS: 'fc-leetcode-progress',
  STATISTICS_PROGRESS: 'fc-stats-progress',
  ML_PROGRESS: 'fc-ml-progress',
  DEEP_LEARNING_PROGRESS: 'fc-deep-learning-progress',
  LLM_PROGRESS: 'fc-llm-progress',
  AGENT_PROGRESS: 'fc-agent-progress',
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
  date: string;
  cardsReviewed: number;
  cardsMastered: number;
}

export interface StoredStats {
  sessions: DayRecord[];
}

// ============================================================
// 新数据格式（Tauri 文件存储）
// ============================================================
export interface AppDataV1 {
  schemaVersion: 1;
  progress: Record<string, StoredProgress>;
  reviewLogs: Record<string, ReviewLog[]>;
  settings: StoredSettings;
  stats: StoredStats;
}
