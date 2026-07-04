export type Category = 'leetcode' | 'statistics' | 'machine-learning' | 'deep-learning' | 'llm' | 'agent' | 'jargon' | 'workplace' | 'vibe-coding' | 'java' | string;
export type Difficulty = 'easy' | 'medium' | 'hard';
export type CardState = 'new' | 'learning' | 'review' | 'relearning' | 'mastered';
export type StudyMode = 'choose' | 'new' | 'review';
/** 学习模式预设 */
export type StudyPaceMode = 'sprint' | 'fast' | 'normal' | 'custom';
/** 学习模式配置 */
export interface StudyModeConfig {
    /** 模式预设 */
    mode: StudyPaceMode;
    /** 目标天数 */
    targetDays: number;
    /** 自动解决阈值（interval 超过此天数自动标记 mastered） */
    autoResolveInterval: number;
    /** 选中的牌组 ID */
    selectedDecks: string[];
    /** 每日新卡配额 { deckId: nCards }，总和不等于总上限时用默认比例 */
    dailyQuota: Record<string, number>;
    /** 每日复习上限倍数（新卡数 × multiplier） */
    dailyReviewMultiplier: number;
}
/** SM-2 复习状态（增强版） */
export interface SM2Record {
    state: CardState;
    easeFactor: number;
    interval: number;
    repetitions: number;
    lapses: number;
    nextReview: number;
    lastReviewedAt?: number;
    /** FSRS-ready 预留字段 */
    stability?: number;
    difficulty?: number;
    elapsedDays?: number;
    scheduledDays?: number;
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
    number?: number;
    title?: string;
    titleCn?: string;
    description?: string;
    approach?: string;
    codes?: Record<string, string>;
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
    category: 'statistics' | 'machine-learning' | 'deep-learning' | 'llm' | 'agent' | 'jargon' | 'workplace' | 'vibe-coding' | 'java';
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
export interface AppState {
    category: Category;
    /** 完整卡片数据源（不可被筛选/review/shuffle 覆盖） */
    cardsById: Record<string, FlashCard>;
    /** 当前可见卡片 ID 列表（过滤/搜索/复习/随机只影响此列表） */
    visibleCardIds: string[];
    /** 当前在 visibleCardIds 中的下标 */
    currentVisibleIndex: number;
    /** 本次学习队列的初始总数，用于进度条保持总量稳定 */
    studyQueueTotal: number;
    /** 本次队列中已完成但仍保留可查看的卡片 ID，例如手动标记已掌握 */
    studyQueueCompletedIds: string[];
    /** 当前学习队列是否计入今日学习日志/每日限额 */
    studyQueueCountsTowardDaily: boolean;
    /** 当前学习队列是否允许展示已掌握卡片 */
    studyQueueIncludesResolved: boolean;
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
    dailyReviewLimit: number;
    studyMode: StudyMode;
    loading: boolean;
    apiSource: boolean;
    /** 计划学习模式：只显示指定卡片，不受每日新卡限制 */
    planCardIds: string[] | null;
}
export type AppAction = {
    type: 'SET_CATEGORY';
    payload: Category;
} | {
    type: 'GO_TO';
    payload: number;
} | {
    type: 'NEXT';
} | {
    type: 'PREV';
} | {
    type: 'TOGGLE_APPROACH';
} | {
    type: 'TOGGLE_CODE';
} | {
    type: 'TOGGLE_QA_ANSWER';
} | {
    type: 'TOGGLE_MASTERED';
    payload: string;
} | {
    type: 'TOGGLE_FAVORITE';
    payload: string;
} | {
    type: 'RATE_CARD';
    payload: {
        cardId: string;
        rating: number;
        clientReviewId?: string;
    };
} | {
    type: 'SET_FILTER_DIFFICULTY';
    payload: Difficulty | 'all';
} | {
    type: 'SET_FILTER_SUBTOPIC';
    payload: string | 'all';
} | {
    type: 'SET_SEARCH';
    payload: string;
} | {
    type: 'TOGGLE_DARK';
} | {
    type: 'TOGGLE_STATS';
} | {
    type: 'TOGGLE_REVIEW_MODE';
} | {
    type: 'SHUFFLE';
} | {
    type: 'RESET_ORDER';
} | {
    type: 'ADD_CARD';
    payload: FlashCard;
} | {
    type: 'UPDATE_CARD';
    payload: FlashCard;
} | {
    type: 'JUMP_TO_CARD';
    payload: {
        category: Category;
        cardId: string;
    };
} | {
    type: 'DELETE_CARD';
    payload: string;
} | {
    type: 'SET_DAILY_NEW_LIMIT';
    payload: number;
} | {
    type: 'SET_DAILY_REVIEW_LIMIT';
    payload: number;
} | {
    type: 'SET_STUDY_MODE';
    payload: StudyMode;
} | {
    type: 'UNDO_LAST_RATING';
} | {
    type: 'LOADED_QUEUE';
    payload: {
        cards: FlashCard[];
        mode: 'new' | 'review';
    };
} | {
    type: 'SET_LOADING';
    payload: boolean;
} | {
    type: 'API_RATE_SUCCESS';
    payload: {
        cardId: string;
        progress: any;
        log?: any;
    };
} | {
    type: 'SET_API_SOURCE';
    payload: boolean;
} | {
    type: 'START_TODAY_STUDY';
    payload?: {
        cards?: FlashCard[];
        deckIds?: string[];
    };
} | {
    type: 'START_PLAN_STUDY';
    payload: {
        cardIds: string[];
    };
} | {
    type: 'START_SINGLE_CARD_STUDY';
    payload: {
        card: FlashCard;
        countTowardsDaily?: boolean;
    };
} | {
    type: 'STOP_PLAN_STUDY';
} | {
    type: 'SET_STUDY_MODE_CONFIG';
    payload: StudyModeConfig;
};
export declare const STORAGE_KEYS: {
    readonly LEETCODE_PROGRESS: "fc-leetcode-progress";
    readonly STATISTICS_PROGRESS: "fc-stats-progress";
    readonly ML_PROGRESS: "fc-ml-progress";
    readonly DEEP_LEARNING_PROGRESS: "fc-deep-learning-progress";
    readonly LLM_PROGRESS: "fc-llm-progress";
    readonly AGENT_PROGRESS: "fc-agent-progress";
    readonly JARGON_PROGRESS: "fc-jargon-progress";
    readonly WORKPLACE_PROGRESS: "fc-workplace-progress";
    readonly VIBE_CODING_PROGRESS: "fc-vibe-coding-progress";
    readonly JAVA_PROGRESS: "fc-java-progress";
    readonly SETTINGS: "fc-settings";
    readonly STATS: "fc-stats";
};
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
export interface AppDataV1 {
    schemaVersion: 1;
    progress: Record<string, StoredProgress>;
    reviewLogs: Record<string, ReviewLog[]>;
    settings: StoredSettings;
    stats: StoredStats;
}
