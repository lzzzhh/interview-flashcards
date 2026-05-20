// src/api/types.ts — 前后端共享 DTO 类型
export interface CardProgressDTO {
  state: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  nextReview: string;
  lastReviewedAt?: string | null;
  favorited: boolean;
  userNotes?: string | null;
}

export interface CardDTO {
  id: string;
  deckId: string;
  type: 'qa' | 'leetcode';
  number?: number | null;
  title?: string | null;
  titleCn?: string | null;
  question?: string | null;
  answer?: string | null;
  description?: string | null;
  approach?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard' | null;
  tags: string[];
  subTopic?: string | null;
  source?: string | null;
  codes?: Record<string, string> | null;
  progress: CardProgressDTO | null;
}

export interface StudyQueueResponse {
  mode: 'new' | 'review';
  deckId: string;
  cards: CardDTO[];
  total: number;
  dailyLimit?: number;
}

export interface ReviewResponse {
  cardId: string;
  progress: CardProgressDTO | null;
  log: {
    id: string;
    cardId: string;
    rating: number;
    reviewedAt: string;
    stateBefore: string;
    stateAfter: string;
    intervalBefore: number;
    intervalAfter: number;
    easeBefore: number;
    easeAfter: number;
    elapsedDays: number;
    scheduledDays: number;
  };
}

export interface DeckDTO {
  id: string;
  name: string;
  type: 'builtin' | 'custom';
  icon?: string | null;
  sortOrder: number;
  stats: {
    total: number;
    newCount: number;
    learningCount: number;
    reviewCount: number;
    relearningCount: number;
    dueCount: number;
    favoritedCount: number;
    dailyLimit: number;
  };
}

export interface DeckCardsResponse {
  cards: CardDTO[];
  total: number;
  limit: number;
  offset: number;
}

export interface DecksResponse {
  decks: DeckDTO[];
}
