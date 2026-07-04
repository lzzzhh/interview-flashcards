// ============================================================
// src/utils/customDecks.ts — 自定义模块管理
// ============================================================

import type { QACard } from '../types';
import { persistLocalAppData } from './nativeStorage';
import { loadStudyModeConfig, saveStudyModeConfig } from './studyModeConfig';

export interface CustomDeck {
  id: string;
  name: string;
  icon?: string; // emoji
  createdAt: number;
}

export interface DeletedCustomDeck {
  deck: CustomDeck;
  cards: QACard[];
  deletedAt: number;
  dailyLimit?: number;
  dailyReviewLimit?: number;
}

const DECKS_KEY = 'fc-custom-decks';
const DELETED_DECKS_KEY = 'fc-deleted-custom-decks';
export const UNASSIGNED_DECK_ID = '__unassigned__';
export const UNASSIGNED_DECK_NAME = '未分配';

function persistStorageSoon(): void {
  void persistLocalAppData().catch(() => {});
}

function removeDeckFromStudyModeConfig(deckId: string): void {
  const config = loadStudyModeConfig();
  if (!config) return;
  const { [deckId]: _removed, ...dailyQuota } = config.dailyQuota;
  saveStudyModeConfig({
    ...config,
    selectedDecks: config.selectedDecks.filter((id) => id !== deckId),
    dailyQuota,
  });
}

function readStoredLimit(key: string, fallback: number): number {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

/** 加载所有自定义模块 */
export function loadCustomDecks(): CustomDeck[] {
  try {
    return JSON.parse(localStorage.getItem(DECKS_KEY) || '[]');
  } catch {
    return [];
  }
}

/** 保存自定义模块 */
function saveCustomDecks(decks: CustomDeck[]): void {
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

export function loadDeletedCustomDecks(): DeletedCustomDeck[] {
  try {
    return JSON.parse(localStorage.getItem(DELETED_DECKS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveDeletedCustomDecks(items: DeletedCustomDeck[]): void {
  localStorage.setItem(DELETED_DECKS_KEY, JSON.stringify(items));
}

/** 加载模块的卡片 */
export function loadCustomCards(deckId: string): QACard[] {
  try {
    return JSON.parse(localStorage.getItem(`fc-cards-${deckId}`) || '[]');
  } catch {
    return [];
  }
}

/** 保存模块的卡片 */
export function saveCustomCards(deckId: string, cards: QACard[]): void {
  localStorage.setItem(`fc-cards-${deckId}`, JSON.stringify(cards));
}

export function loadUnassignedCards(): QACard[] {
  return loadCustomCards(UNASSIGNED_DECK_ID);
}

export function saveUnassignedCards(cards: QACard[]): void {
  saveCustomCards(UNASSIGNED_DECK_ID, cards);
}

/** 创建自定义模块 */
export function createCustomDeck(name: string, icon?: string): CustomDeck {
  const decks = loadCustomDecks();
  const deck: CustomDeck = {
    id: `custom-${Date.now()}`,
    name,
    icon: icon || '📦',
    createdAt: Date.now(),
  };
  decks.push(deck);
  saveCustomDecks(decks);
  return deck;
}

/** 删除自定义模块 */
export function deleteCustomDeck(deckId: string): void {
  const deck = loadCustomDecks().find((d) => d.id === deckId);
  if (!deck) return;
  const cards = loadCustomCards(deckId);
  const deleted = loadDeletedCustomDecks().filter((item) => item.deck.id !== deckId);
  deleted.unshift({
    deck,
    cards,
    deletedAt: Date.now(),
    dailyLimit: getModuleDailyLimit(deckId),
    dailyReviewLimit: getModuleDailyReviewLimit(deckId),
  });
  saveDeletedCustomDecks(deleted);

  const unassigned = loadUnassignedCards();
  const existingIds = new Set(unassigned.map((card) => card.id));
  const movedCards = cards
    .filter((card) => !existingIds.has(card.id))
    .map((card) => ({
      ...card,
      category: UNASSIGNED_DECK_ID as QACard['category'],
      source: card.source || deck.name,
      originalCategory: deckId,
    }) as QACard);
  saveUnassignedCards([...unassigned, ...movedCards]);

  const decks = loadCustomDecks().filter((d) => d.id !== deckId);
  saveCustomDecks(decks);
  localStorage.removeItem(`fc-cards-${deckId}`);
  localStorage.removeItem(`fc-limit-${deckId}`);
  localStorage.removeItem(`fc-review-limit-${deckId}`);
  localStorage.removeItem(`fc-user-cards-${deckId}`);
  localStorage.removeItem(`fc-custom-topics-${deckId}`);
  localStorage.removeItem(`fc-deleted-topics-${deckId}`);
  removeDeckFromStudyModeConfig(deckId);

  try {
    const customCards = JSON.parse(localStorage.getItem('fc-custom-cards') || '{}');
    if (customCards && typeof customCards === 'object') {
      delete customCards[deckId];
      localStorage.setItem('fc-custom-cards', JSON.stringify(customCards));
    }
  } catch {}
  persistStorageSoon();
}

export function restoreCustomDeck(deckId: string): boolean {
  const deleted = loadDeletedCustomDecks();
  const item = deleted.find((entry) => entry.deck.id === deckId);
  if (!item) return false;

  const decks = loadCustomDecks();
  if (!decks.some((deck) => deck.id === deckId)) {
    saveCustomDecks([...decks, item.deck]);
  }

  const unassigned = loadUnassignedCards();
  const restoreIds = new Set(item.cards.map((card) => card.id));
  const cardsFromUnassigned = unassigned
    .filter((card) => (card as any).originalCategory === deckId || restoreIds.has(card.id))
    .map((card) => {
      const { originalCategory: _originalCategory, ...rest } = card as QACard & { originalCategory?: string };
      return { ...rest, category: deckId as QACard['category'] };
    });
  const fallbackCards = item.cards.filter((card) => !cardsFromUnassigned.some((existing) => existing.id === card.id));
  const currentDeckCards = loadCustomCards(deckId);
  const currentIds = new Set(currentDeckCards.map((card) => card.id));
  const restoredCards = [...cardsFromUnassigned, ...fallbackCards.map((card) => ({ ...card, category: deckId as QACard['category'] }))];
  saveCustomCards(deckId, [...currentDeckCards, ...restoredCards.filter((card) => !currentIds.has(card.id))]);
  saveUnassignedCards(unassigned.filter((card) => !restoreIds.has(card.id) && (card as any).originalCategory !== deckId));

  if (item.dailyLimit !== undefined) localStorage.setItem(`fc-limit-${deckId}`, String(item.dailyLimit));
  if (item.dailyReviewLimit !== undefined) localStorage.setItem(`fc-review-limit-${deckId}`, String(item.dailyReviewLimit));
  saveDeletedCustomDecks(deleted.filter((entry) => entry.deck.id !== deckId));
  persistStorageSoon();
  return true;
}

/** 添加卡片到模块 */
export function addCardToDeck(deckId: string, card: QACard): void {
  const cards = loadCustomCards(deckId);
  cards.push(card);
  saveCustomCards(deckId, cards);
}

/** 更新模块里的卡片 */
export function updateCardInDeck(deckId: string, updatedCard: QACard): void {
  const cards = loadCustomCards(deckId);
  const idx = cards.findIndex((c) => c.id === updatedCard.id);
  if (idx >= 0) cards[idx] = updatedCard;
  else cards.push(updatedCard);
  saveCustomCards(deckId, cards);
}

/** 删除模块里的卡片 */
export function deleteCardFromDeck(deckId: string, cardId: string): void {
  const cards = loadCustomCards(deckId).filter((c) => c.id !== cardId);
  saveCustomCards(deckId, cards);
}

/** 导入 CSV 到模块 */
export function importCSVToDeck(deckId: string, csvText: string): number {
  const lines = csvText.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return 0;
  
  const cards = loadCustomCards(deckId);
  let count = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVRow(lines[i]);
    if (cols.length < 2) continue;
    
    const [question, answer, tagsStr] = cols;
    const card: QACard = {
      id: `${deckId}-${Date.now()}-${i}`,
      category: deckId as any,
      question: question || '',
      answer: answer || '',
      tags: (tagsStr || '').split(';').map((t) => t.trim()).filter(Boolean),
      sm2: { state: 'new', easeFactor: 2.5, interval: 0, repetitions: 0, lapses: 0, nextReview: Date.now() },
      favorited: false,
    };
    cards.push(card);
    count++;
  }
  
  saveCustomCards(deckId, cards);
  return count;
}

function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

/** 获取模块的每日新卡上限 */
export function getModuleDailyLimit(moduleId: string): number {
  try {
    return readStoredLimit(`fc-limit-${moduleId}`, 20);
  } catch { return 20; }
}

/** 设置模块的每日新卡上限 */
export function setModuleDailyLimit(moduleId: string, limit: number): void {
  localStorage.setItem(`fc-limit-${moduleId}`, String(Math.max(0, Math.min(100, limit))));
  persistStorageSoon();
}

/** 获取模块的每日复习上限 */
export function getModuleDailyReviewLimit(moduleId: string): number {
  try {
    return readStoredLimit(`fc-review-limit-${moduleId}`, 100);
  } catch { return 100; }
}

/** 设置模块的每日复习上限 */
export function setModuleDailyReviewLimit(moduleId: string, limit: number): void {
  localStorage.setItem(`fc-review-limit-${moduleId}`, String(Math.max(0, Math.min(300, limit))));
  persistStorageSoon();
}

/** 获取所有模块的每日新卡上限 */
export function getAllModuleLimits(): Record<string, number> {
  const result: Record<string, number> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('fc-limit-') && !key.startsWith('fc-review-limit-')) {
      result[key.replace('fc-limit-', '')] = readStoredLimit(key, 20);
    }
  }
  return result;
}

/** 获取所有模块的每日复习上限 */
export function getAllModuleReviewLimits(): Record<string, number> {
  const result: Record<string, number> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('fc-review-limit-')) {
      result[key.replace('fc-review-limit-', '')] = readStoredLimit(key, 100);
    }
  }
  return result;
}

/** 加载所有自定义牌组的卡片 */
export function loadAllCustomCards(): Record<string, QACard[]> {
  const decks = loadCustomDecks();
  const result: Record<string, QACard[]> = {};
  for (const deck of decks) {
    try {
      const raw = localStorage.getItem(`fc-cards-${deck.id}`);
      result[deck.id] = raw ? JSON.parse(raw) : [];
    } catch { result[deck.id] = []; }
  }
  const unassigned = loadUnassignedCards();
  if (unassigned.length > 0) result[UNASSIGNED_DECK_ID] = unassigned;
  return result;
}
