// backend/src/modules/cards/card.mapper.ts — Card/CardProgress → CardDTO
import type { Card, CardProgress } from '@prisma/client';

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

function safeJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { const arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; }
  catch { return []; }
}

function safeJsonObject(raw: string | null | undefined): Record<string, string> | null {
  if (!raw) return null;
  try { const obj = JSON.parse(raw); return typeof obj === 'object' && !Array.isArray(obj) ? obj : null; }
  catch { return null; }
}

export function toCardDTO(card: Card & { progress?: (CardProgress | null)[] }): CardDTO {
  const p = card.progress?.[0] ?? null;
  return {
    id: card.id,
    deckId: card.deckId,
    type: card.type as 'qa' | 'leetcode',
    number: card.number,
    title: card.title,
    titleCn: card.titleCn,
    question: card.question,
    answer: card.answer,
    description: card.description,
    approach: card.approach,
    difficulty: (card.difficulty as 'easy' | 'medium' | 'hard') || null,
    tags: safeJsonArray(card.tags),
    subTopic: card.subTopic,
    source: card.source,
    codes: safeJsonObject(card.codes),
    progress: p ? toProgressDTO(p) : null,
  };
}

export function toProgressDTO(p: CardProgress): CardProgressDTO {
  return {
    state: p.state,
    easeFactor: p.easeFactor,
    intervalDays: p.intervalDays,
    repetitions: p.repetitions,
    lapses: p.lapses,
    nextReview: p.nextReview.toISOString(),
    lastReviewedAt: p.lastReviewedAt?.toISOString() ?? null,
    favorited: p.favorited,
    userNotes: p.userNotes,
  };
}
