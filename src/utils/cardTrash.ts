import type { Category, FlashCard, QACard } from '../types';
import { persistLocalAppData } from './nativeStorage';
import {
  loadCustomCards,
  loadCustomDecks,
  saveCustomCards,
  UNASSIGNED_DECK_ID,
} from './customDecks';

export interface DeletedCard {
  card: FlashCard;
  deletedAt: number;
  originCategory: string;
}

const DELETED_CARDS_KEY = 'fc-deleted-cards';
const BUILTIN_CATEGORIES = new Set([
  'leetcode',
  'statistics',
  'machine-learning',
  'deep-learning',
  'llm',
  'agent',
  'jargon',
  'workplace',
  'vibe-coding',
  'java',
]);

function persistStorageSoon(): void {
  void persistLocalAppData().catch(() => {});
}

function saveDeletedCards(cards: DeletedCard[]): void {
  localStorage.setItem(DELETED_CARDS_KEY, JSON.stringify(cards));
}

export function loadDeletedCards(): DeletedCard[] {
  try {
    return JSON.parse(localStorage.getItem(DELETED_CARDS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getDeletedCardIds(): Set<string> {
  return new Set(loadDeletedCards().map((item) => item.card.id));
}

function removeFromUserCards(category: string, cardId: string): void {
  try {
    const key = `fc-user-cards-${category}`;
    const existing = JSON.parse(localStorage.getItem(key) || '{}');
    if (existing && typeof existing === 'object') {
      delete existing[cardId];
      localStorage.setItem(key, JSON.stringify(existing));
    }
  } catch {}
}

function saveUserCard(category: string, card: FlashCard): void {
  try {
    const key = `fc-user-cards-${category}`;
    const existing = JSON.parse(localStorage.getItem(key) || '{}');
    existing[card.id] = card;
    localStorage.setItem(key, JSON.stringify(existing));
  } catch {}
}

export function softDeleteCard(card: FlashCard): void {
  const deleted = loadDeletedCards().filter((item) => item.card.id !== card.id);
  deleted.unshift({
    card,
    deletedAt: Date.now(),
    originCategory: card.category,
  });
  saveDeletedCards(deleted);

  if (BUILTIN_CATEGORIES.has(card.category)) {
    removeFromUserCards(card.category, card.id);
  } else {
    saveCustomCards(card.category, loadCustomCards(card.category).filter((item) => item.id !== card.id));
  }

  persistStorageSoon();
}

export function restoreDeletedCard(cardId: string): FlashCard | null {
  const deleted = loadDeletedCards();
  const item = deleted.find((entry) => entry.card.id === cardId);
  if (!item) return null;

  const customDeckExists = loadCustomDecks().some((deck) => deck.id === item.originCategory);
  const targetCategory = BUILTIN_CATEGORIES.has(item.originCategory) || customDeckExists
    ? item.originCategory
    : UNASSIGNED_DECK_ID;
  const restored = { ...item.card, category: targetCategory as Category } as FlashCard;

  if (BUILTIN_CATEGORIES.has(targetCategory)) {
    saveUserCard(targetCategory, restored);
  } else {
    const qa = restored as QACard;
    const cards = loadCustomCards(targetCategory);
    if (!cards.some((card) => card.id === qa.id)) {
      saveCustomCards(targetCategory, [...cards, qa]);
    }
  }

  saveDeletedCards(deleted.filter((entry) => entry.card.id !== cardId));
  persistStorageSoon();
  return restored;
}
