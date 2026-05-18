// ============================================================
// src/utils/customDecks.ts — 自定义模块管理
// ============================================================

import type { QACard } from '../types';

export interface CustomDeck {
  id: string;
  name: string;
  icon?: string; // emoji
  createdAt: number;
}

const DECKS_KEY = 'fc-custom-decks';

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
  const decks = loadCustomDecks().filter((d) => d.id !== deckId);
  saveCustomDecks(decks);
  localStorage.removeItem(`fc-cards-${deckId}`);
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
    const v = localStorage.getItem(`fc-limit-${moduleId}`);
    return v ? parseInt(v) : 20;
  } catch { return 20; }
}

/** 设置模块的每日新卡上限 */
export function setModuleDailyLimit(moduleId: string, limit: number): void {
  localStorage.setItem(`fc-limit-${moduleId}`, String(Math.max(1, Math.min(100, limit))));
}

/** 获取所有模块的每日新卡上限 */
export function getAllModuleLimits(): Record<string, number> {
  const result: Record<string, number> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('fc-limit-')) {
      result[key.replace('fc-limit-', '')] = Number(localStorage.getItem(key)) || 20;
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
  return result;
}