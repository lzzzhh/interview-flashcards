import type { Category, FlashCard, QACard } from '../types';
import { CATEGORIES } from '../constants';
import { leetcodeHot100 } from '../data/leetcode-hot100';
import { statisticsCards } from '../data/statistics';
import { machineLearningCards } from '../data/machine-learning';
import { deepLearningCards } from '../data/deep-learning';
import { llmCards } from '../data/llm';
import { agentCards } from '../data/agent';
import { jargonCards } from '../data/jargon';
import { workplaceCards } from '../data/workplace';
import { vibeCodingCards } from '../data/vibe-coding';
import { loadProgress } from './storage';
import { loadCustomCards, loadCustomDecks, loadUnassignedCards, UNASSIGNED_DECK_ID, UNASSIGNED_DECK_NAME } from './customDecks';
import { getDeletedCardIds } from './cardTrash';

export const BUILTIN_CARD_SOURCES: [Category, FlashCard[]][] = [
  ['leetcode', leetcodeHot100 as FlashCard[]],
  ['statistics', statisticsCards as FlashCard[]],
  ['machine-learning', machineLearningCards as FlashCard[]],
  ['deep-learning', deepLearningCards as FlashCard[]],
  ['llm', llmCards as FlashCard[]],
  ['agent', agentCards as FlashCard[]],
  ['jargon', jargonCards as FlashCard[]],
  ['workplace', workplaceCards as FlashCard[]],
  ['vibe-coding', vibeCodingCards as FlashCard[]],
];

export function isBuiltInCategory(category: string): boolean {
  return BUILTIN_CARD_SOURCES.some(([id]) => id === category) || category === 'java';
}

export function getCardDisplayLabel(card: FlashCard): string {
  if (card.category === 'leetcode') {
    return `#${card.number} ${card.titleCn || card.title}`;
  }
  return (card as QACard).question;
}

export function getCardSearchText(card: FlashCard): string {
  if (card.category === 'leetcode') {
    return `${card.titleCn || card.title} ${card.description || ''}`;
  }
  const qa = card as QACard;
  return `${qa.question} ${qa.answer || ''}`;
}

export function getCategoryLabel(category: string): string {
  if (category === UNASSIGNED_DECK_ID) return UNASSIGNED_DECK_NAME;
  return CATEGORIES.find((c) => c.key === category)?.label
    || loadCustomDecks().find((deck) => deck.id === category)?.name
    || category;
}

export function loadCardsForCategory(category: string): FlashCard[] {
  const deletedIds = getDeletedCardIds();
  const builtin = BUILTIN_CARD_SOURCES.find(([id]) => id === category);
  if (builtin) {
    const progress = loadProgress(category);
    return builtin[1]
      .filter((card) => !deletedIds.has(card.id))
      .map((card) => {
        const sm2 = progress.sm2[card.id] ? { ...card.sm2, ...progress.sm2[card.id] } : card.sm2;
        return { ...card, sm2, favorited: card.favorited || progress.favorited.includes(card.id) };
      });
  }

  const progress = loadProgress(category as Category);
  return loadCustomCards(category)
    .filter((card) => !deletedIds.has(card.id))
    .map((card) => {
      const saved = progress.sm2[card.id];
      return {
        ...card,
        sm2: saved ? { ...card.sm2, ...saved } : card.sm2,
        favorited: card.favorited || progress.favorited.includes(card.id),
      };
    });
}

export function loadAllCardsFromStorage(): FlashCard[] {
  const result: FlashCard[] = [];
  for (const [category] of BUILTIN_CARD_SOURCES) {
    result.push(...loadCardsForCategory(category));
  }
  for (const deck of loadCustomDecks()) {
    result.push(...loadCardsForCategory(deck.id));
  }
  if (loadUnassignedCards().length > 0) {
    result.push(...loadCardsForCategory(UNASSIGNED_DECK_ID));
  }
  return result;
}
