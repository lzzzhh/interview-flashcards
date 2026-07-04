import { apiPost } from '../api/client';
import { agentCards } from '../data/agent';
import { deepLearningCards } from '../data/deep-learning';
import { jargonCards } from '../data/jargon';
import { leetcodeHot100 } from '../data/leetcode-hot100';
import { llmCards } from '../data/llm';
import { machineLearningCards } from '../data/machine-learning';
import { statisticsCards } from '../data/statistics';
import { vibeCodingCards } from '../data/vibe-coding';
import { workplaceCards } from '../data/workplace';
import type { Category, FlashCard, LeetCodeCard, QACard } from '../types';
import { getLocalAppDataSnapshot } from './nativeStorage';

let inflight: Promise<void> | null = null;

const BUILTIN_CARD_SOURCES: Record<Category, FlashCard[]> = {
  leetcode: leetcodeHot100 as FlashCard[],
  statistics: statisticsCards as FlashCard[],
  'machine-learning': machineLearningCards as FlashCard[],
  'deep-learning': deepLearningCards as FlashCard[],
  llm: llmCards as FlashCard[],
  agent: agentCards as FlashCard[],
  jargon: jargonCards as FlashCard[],
  workplace: workplaceCards as FlashCard[],
  'vibe-coding': vibeCodingCards as FlashCard[],
  java: [],
};

function isLeetCodeCard(card: FlashCard): card is LeetCodeCard {
  return card.category === 'leetcode';
}

function readUserCards(category: string): FlashCard[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`fc-user-cards-${category}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const values = Array.isArray(parsed) ? parsed : Object.values(parsed ?? {});
    return values.filter((card): card is FlashCard => !!card && typeof (card as any).id === 'string');
  } catch {
    return [];
  }
}

function toBackendCard(card: FlashCard) {
  if (isLeetCodeCard(card)) {
    return {
      id: card.id,
      deckId: card.category,
      type: 'leetcode',
      number: card.number ?? null,
      title: card.title ?? null,
      titleCn: card.titleCn ?? null,
      question: null,
      answer: null,
      description: card.description ?? null,
      approach: card.approach ?? null,
      difficulty: card.difficulty ?? null,
      tags: card.tags ?? [],
      subTopic: null,
      source: null,
      codes: card.codes ?? null,
    };
  }

  const qa = card as QACard;
  return {
    id: qa.id,
    deckId: qa.category,
    type: 'qa',
    number: null,
    title: null,
    titleCn: null,
    question: qa.question ?? null,
    answer: qa.answer ?? null,
    description: null,
    approach: null,
    difficulty: qa.difficulty ?? null,
    tags: qa.tags ?? [],
    subTopic: qa.subTopic ?? null,
    source: qa.source ?? null,
    codes: null,
  };
}

function buildBuiltinCardsPayload() {
  return Object.fromEntries(
    Object.entries(BUILTIN_CARD_SOURCES).map(([deckId, cards]) => [
      deckId,
      [...cards, ...readUserCards(deckId)].map(toBackendCard),
    ]),
  );
}

export function syncLocalAppDataToBackend(): Promise<void> {
  if (inflight) return inflight;
  inflight = apiPost('/migrations/import-local-data', {
    ...getLocalAppDataSnapshot(),
    builtinCards: buildBuiltinCardsPayload(),
  })
    .then(() => undefined)
    .catch(() => undefined)
    .finally(() => { inflight = null; });
  return inflight;
}
