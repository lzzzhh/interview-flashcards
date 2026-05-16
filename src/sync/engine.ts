// ============================================================
// src/sync/engine.ts — 合并引擎
// ============================================================

import type { SyncOp, SeenOps } from './types';
import type { FlashCard, ReviewLog } from '../types';
import { createDefaultSM2 } from '../utils/sm2';

export interface MergeTarget { cardsById: Record<string, FlashCard>; reviewLogs: ReviewLog[]; }

export function sortOps(ops: SyncOp[]): SyncOp[] {
  return [...ops].sort((a, b) => a.ts - b.ts || a.deviceId.localeCompare(b.deviceId) || a.seq - b.seq);
}

export function replayOps(ops: SyncOp[], target: MergeTarget, seen: SeenOps = {}): MergeTarget {
  const sorted = sortOps(ops);
  const cards = { ...target.cardsById };
  const logs = [...target.reviewLogs];
  const logSet = new Set(target.reviewLogs.map((l) => l.id));

  for (const op of sorted) {
    const lastSeen = seen[op.deviceId] ?? 0;
    if (op.seq <= lastSeen) continue;

    switch (op.op) {
      case 'rate': {
        const card = cards[op.cardId];
        if (card) card.sm2 = { ...op.data.sm2 };
        if (!logSet.has(op.data.reviewLog.id)) { logs.push(op.data.reviewLog); logSet.add(op.data.reviewLog.id); }
        break;
      }
      case 'edit_card': {
        const card = cards[op.cardId];
        if (!card) break;
        if (card.category === 'leetcode') {
          if (op.data.approach !== undefined) card.approach = op.data.approach;
          if (op.data.description !== undefined) card.description = op.data.description;
          if (op.data.tags !== undefined) card.tags = op.data.tags;
          if (op.data.difficulty !== undefined) card.difficulty = op.data.difficulty;
          if (op.data.titleCn !== undefined) card.titleCn = op.data.titleCn;
        } else {
          if (op.data.question !== undefined) card.question = op.data.question;
          if (op.data.answer !== undefined) card.answer = op.data.answer;
          if (op.data.tags !== undefined) card.tags = op.data.tags;
          if (op.data.difficulty !== undefined) card.difficulty = op.data.difficulty;
        }
        break;
      }
      case 'create_card': {
        if (!cards[op.cardId]) {
          cards[op.cardId] = {
            id: op.cardId, category: op.data.category, question: op.data.question, answer: op.data.answer,
            tags: op.data.tags, difficulty: op.data.difficulty, subTopic: op.data.subTopic,
            sm2: createDefaultSM2(), favorited: false,
          } as FlashCard;
        }
        break;
      }
      case 'delete_card': { delete cards[op.cardId]; break; }
      case 'toggle_favorite': {
        const card = cards[op.cardId];
        if (card) card.favorited = op.data.favorited;
        break;
      }
    }
    seen[op.deviceId] = op.seq;
  }
  return { cardsById: cards, reviewLogs: logs };
}
