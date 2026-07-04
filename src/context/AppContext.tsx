// ============================================================
// src/context/AppContext.tsx — 重构版
// cardsById 永远保存完整数据，visibleCardIds 只存筛选结果
// 所有卡片操作通过 cardId，不用 index
// ============================================================

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppState,
  AppAction,
  Category,
  FlashCard,
  LeetCodeCard,
  QACard,
  ReviewLog,
  SM2Record,
  StoredProgress,
  StudyMode,
} from '../types';
import type { CardDTO } from '../api/types';
import { leetcodeHot100 } from '../data/leetcode-hot100';
import { statisticsCards } from '../data/statistics';
import { machineLearningCards } from '../data/machine-learning';
import { deepLearningCards } from '../data/deep-learning';
import { llmCards } from '../data/llm';
import { agentCards } from '../data/agent';
import { jargonCards } from '../data/jargon';
import { workplaceCards } from '../data/workplace';
import { vibeCodingCards } from '../data/vibe-coding';
import { scheduleReview } from '../utils/sm2';
import { loadProgress, saveSettings } from '../utils/storage';
import { loadAppData, saveAppData } from '../utils/nativeStorage';
import { getStudyModeNewLimit, getStudyModeReviewLimit, loadStudyModeConfig, isSprintMode, saveStudyModeConfig } from '../utils/studyModeConfig';
import { syncLocalAppDataToBackend } from '../utils/backendSync';
import { appendReviewLog, countTodayNewLearned, getTodayStudiedCardIds, loadReviewLogs, saveReviewLogs } from '../utils/reviewLogs';
import { shuffle } from '../utils/shuffle';
import {
  getAllModuleLimits,
  getAllModuleReviewLimits,
  getModuleDailyLimit,
  getModuleDailyReviewLimit,
  loadDeletedCustomDecks,
  loadAllCustomCards,
  loadCustomCards,
  loadCustomDecks,
  updateCardInDeck,
} from '../utils/customDecks';
import { getDeletedCardIds, loadDeletedCards, softDeleteCard } from '../utils/cardTrash';
import { CATEGORIES, SUB_MODULES } from '../constants';

// ---- Undo support ----
let lastRating: {
  cardId: string;
  previousSm2: SM2Record;
  previousPlanCardIds: string[] | null;
  previousVisibleCardIds: string[];
  previousVisibleIndex: number;
  previousStudyQueueTotal: number;
  previousStudyQueueCompletedIds: string[];
} | null = null;
export function setLastRating(data: typeof lastRating) { lastRating = data; }
export function getLastRating() { const r = lastRating; lastRating = null; return r; }

// ---- 数据源映射 ----
const CARD_DATA: Partial<Record<Category, FlashCard[]>> = {
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

const progressKeyMap: Record<Category, string> = {
  leetcode: 'fc-leetcode-progress',
  statistics: 'fc-stats-progress',
  'machine-learning': 'fc-ml-progress',
  'deep-learning': 'fc-deep-learning-progress',
  llm: 'fc-llm-progress',
  agent: 'fc-agent-progress',
  jargon: 'fc-jargon-progress',
  workplace: 'fc-workplace-progress',
  'vibe-coding': 'fc-vibe-coding-progress',
  java: 'fc-java-progress',
};

const TODAY_STUDY_QUEUE_KEY = 'fc-today-study-queue';

interface TodayStudyQueueSnapshot {
  date: string;
  deckKey: string;
  cardIds: string[];
}

// ---- 合并 progress → cardsById ----
function buildCardsById(category: Category): Record<string, FlashCard> {
  const now = Date.now();
  const deletedIds = getDeletedCardIds();
  // 内置模块
  const rawCards = CARD_DATA[category];
  if (rawCards) {
    const progress = loadProgress(category);
    const result: Record<string, FlashCard> = {};
    for (const card of rawCards) {
      if (deletedIds.has(card.id)) continue;
      const sm2 = normalizeAutoMasteredSm2(progress.sm2[card.id]
        ? { ...card.sm2, ...progress.sm2[card.id] }
        : { ...card.sm2, nextReview: now });
      result[card.id] = { ...card, sm2, favorited: progress.favorited.includes(card.id) };
    }
    // 合并用户新增到内置模块的卡片
    const userCards = loadUserCards(category);
    for (const [id, card] of Object.entries(userCards)) {
      if (deletedIds.has(id)) continue;
      const sm2 = progress.sm2[id] ? { ...card.sm2, ...progress.sm2[id] } : card.sm2;
      result[id] = { ...card, sm2: normalizeAutoMasteredSm2(sm2), favorited: progress.favorited.includes(id) };
    }
    return result;
  }
  
  // 自定义模块
  const customCards = loadCustomCards(category as string);
  const progress = loadProgress(category);
  const result: Record<string, FlashCard> = {};
  for (const card of customCards) {
    if (deletedIds.has(card.id)) continue;
    const saved = progress.sm2[card.id];
    const sm2 = normalizeAutoMasteredSm2(saved
      ? { ...card.sm2, ...saved }
      : { ...card.sm2, nextReview: card.sm2.nextReview || now });
    result[card.id] = { ...card, sm2, favorited: card.favorited || progress.favorited.includes(card.id) };
  }
  return result;
}

function loadUserCards(category: string): Record<string, FlashCard> {
  try {
    const raw = localStorage.getItem(`fc-user-cards-${category}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function isLeetCodeCard(card: FlashCard): card is LeetCodeCard {
  return card.category === 'leetcode';
}

function getSubModuleTopics(sm: { subTopic?: string; subTopics?: string[] }): string[] {
  return Array.from(new Set([sm.subTopic, ...(sm.subTopics ?? [])].filter(Boolean) as string[]));
}

function cardMatchesSubModule(c: FlashCard, sm: { subTopic?: string; subTopics?: string[] }): boolean {
  if (isLeetCodeCard(c)) return false;
  const st = 'subTopic' in c ? c.subTopic : undefined;
  return !!st && getSubModuleTopics(sm).includes(st);
}

function cardMatchesSubModuleTags(c: FlashCard, sm: { subTopic?: string; subTopics?: string[]; tags?: string[] }): boolean {
  if (!sm.tags?.length) return false;
  const tagMatched = (c.tags ?? []).some((t) => sm.tags!.includes(t));
  if (!tagMatched) return false;
  if (isLeetCodeCard(c)) return true;
  const topics = getSubModuleTopics(sm);
  if (topics.length === 0) return true;
  const st = 'subTopic' in c ? c.subTopic : undefined;
  return !!st && topics.includes(st);
}

const REVIEW_STATES = new Set(['learning', 'review', 'relearning']);

function getAutoResolveInterval(): number {
  const value = loadStudyModeConfig()?.autoResolveInterval ?? 90;
  return Number.isFinite(value) ? Math.max(1, value) : 90;
}

function normalizeAutoMasteredSm2(sm2: SM2Record): SM2Record {
  if (sm2.state === 'review' && sm2.interval >= getAutoResolveInterval()) {
    return { ...sm2, state: 'mastered' };
  }
  return sm2;
}

function isResolvedSm2(sm2?: SM2Record): boolean {
  if (!sm2) return false;
  return normalizeAutoMasteredSm2(sm2).state === 'mastered';
}

function isDueReviewSm2(sm2: SM2Record | undefined, now = Date.now()): boolean {
  if (!sm2) return false;
  const normalized = normalizeAutoMasteredSm2(sm2);
  return REVIEW_STATES.has(normalized.state) && normalized.nextReview <= now;
}

function getEffectiveNewLimit(category: Category): number {
  return getStudyModeNewLimit(category, getModuleDailyLimit(category));
}

function getEffectiveReviewLimit(category: Category): number {
  return getStudyModeReviewLimit(category, getModuleDailyReviewLimit(category));
}

// ---- 筛选 visibleCardIds ----
function computeVisibleIds(state: AppState): string[] {
  // Plan study: only show plan cards, no daily limit
  if (state.planCardIds) {
    const completedIds = new Set(state.studyQueueCompletedIds);
    return state.planCardIds.filter(id => {
      const card = state.cardsById[id];
      return !!card && (state.studyQueueIncludesResolved || !isResolvedSm2(card.sm2) || completedIds.has(id));
    });
  }

  let ids = Object.keys(state.cardsById);

  // 学习模式：新学 / 复习
  if (state.studyMode === 'new') {
    ids = ids.filter((id) => {
      const sm2 = state.cardsById[id]?.sm2;
      return !sm2 || sm2.state === 'new';
    });
  } else if (state.studyMode === 'review') {
    // 到期复习卡片（包含 learning、review、relearning 状态）
    ids = ids.filter((id) => {
      const sm2 = state.cardsById[id]?.sm2;
      return isDueReviewSm2(sm2);
    });

    // 重学队列优先排序：relearning → learning → review
    ids = ids.sort((a, b) => {
      const sa = state.cardsById[a]?.sm2?.state;
      const sb = state.cardsById[b]?.sm2?.state;
      const order: Record<string, number> = { relearning: 0, learning: 1, review: 2 };
      return (order[sa ?? ''] ?? 3) - (order[sb ?? ''] ?? 3);
    });
  }

  ids = ids.filter((id) => !isResolvedSm2(state.cardsById[id]?.sm2));

  // 难度
  if (state.filterDifficulty !== 'all') {
    ids = ids.filter((id) => {
      const c = state.cardsById[id];
      const d = isLeetCodeCard(c) ? c.difficulty : c.difficulty ?? 'medium';
      return d === state.filterDifficulty;
    });
  }

  // 子主题 / 标签过滤
  if (state.filterSubTopic !== 'all') {
    const subMods = SUB_MODULES[state.category] || [];
    const sm = subMods.find((s: any) => s.key === state.filterSubTopic);

    if (sm?.tags && sm.tags.length > 0) {
      // LeetCode / QA 卡片: 按标签匹配；QA 可叠加 subTopic 约束做二级细分
      ids = ids.filter((id) => cardMatchesSubModuleTags(state.cardsById[id], sm));
    } else if (sm?.subTopic) {
      // QA 卡片: 按 subTopic 匹配
      ids = ids.filter((id) => cardMatchesSubModule(state.cardsById[id], sm));
    } else if (sm) {
      // "其他专题" / 无标签无 subTopic
      const knownSubTopics = new Set(subMods.flatMap((s: any) => getSubModuleTopics(s)));
      const knownTags = new Set(subMods.filter((s: any) => s.tags).flatMap((s: any) => s.tags!));
      ids = ids.filter((id) => {
        const c = state.cardsById[id];
        if (isLeetCodeCard(c)) {
          if (knownTags.size === 0) return true;
          return !c.tags.some((t) => knownTags.has(t));
        }
        const st = (c as any).subTopic;
        return !st || !knownSubTopics.has(st);
      });
    } else {
      // 自定义专题：按 subTopic 直接匹配（自定义专题的 key 不在 SUB_MODULES 中）
      ids = ids.filter((id) => {
        const c = state.cardsById[id];
        if (isLeetCodeCard(c)) return false;
        return 'subTopic' in c && c.subTopic === state.filterSubTopic;
      });
    }
  }

  // 搜索
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    ids = ids.filter((id) => {
      const c = state.cardsById[id];
      if (isLeetCodeCard(c)) {
        return (
          c.title.toLowerCase().includes(q) ||
          c.titleCn.includes(q) ||
          c.tags.some((t) => t.includes(q)) ||
          c.description.includes(q) ||
          c.approach.includes(q)
        );
      }
      return (
        c.question.includes(q) ||
        c.answer.includes(q) ||
        (c.tags ?? []).some((t) => t.includes(q)) ||
        ((c as any).subTopic ?? '').includes(q)
      );
    });
  }

  // 随机
  if (state.shuffled) {
    ids = shuffle(ids);
  }

  return ids;
}

function getTodayStudyCategoryKeys(deckIds?: string[]): Category[] {
  if (deckIds?.length) {
    return Array.from(new Set(deckIds.filter(Boolean))) as Category[];
  }

  const keys = new Set<Category>();
  for (const category of CATEGORIES) keys.add(category.key);
  for (const deck of loadCustomDecks()) keys.add(deck.id);
  return Array.from(keys);
}

function getTodayStudyDeckKey(deckIds?: string[]): string {
  return getTodayStudyCategoryKeys(deckIds).sort().join('|') || '__empty__';
}

function loadTodayStudyQueueSnapshot(deckIds?: string[], now = Date.now()): string[] | null {
  try {
    const raw = localStorage.getItem(TODAY_STUDY_QUEUE_KEY);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as TodayStudyQueueSnapshot;
    if (snapshot.date !== localDateKey(now)) return null;
    if (snapshot.deckKey !== getTodayStudyDeckKey(deckIds)) return null;
    return Array.isArray(snapshot.cardIds) ? snapshot.cardIds.filter(Boolean) : null;
  } catch {
    return null;
  }
}

function saveTodayStudyQueueSnapshot(deckIds: string[] | undefined, cardIds: string[], now = Date.now()) {
  try {
    const snapshot: TodayStudyQueueSnapshot = {
      date: localDateKey(now),
      deckKey: getTodayStudyDeckKey(deckIds),
      cardIds,
    };
    localStorage.setItem(TODAY_STUDY_QUEUE_KEY, JSON.stringify(snapshot));
  } catch {}
}

function clearTodayStudyQueueSnapshot() {
  try {
    localStorage.removeItem(TODAY_STUDY_QUEUE_KEY);
  } catch {}
}

function collectCardsForTodayStudy(deckIds?: string[]): Record<string, FlashCard> {
  const cardsById: Record<string, FlashCard> = {};
  for (const category of getTodayStudyCategoryKeys(deckIds)) {
    Object.assign(cardsById, buildCardsById(category));
  }
  return cardsById;
}

function getCompletedQueueIds(cardIds: string[], reviewLogs: Record<string, ReviewLog[]>, now: number): string[] {
  const studiedIds = getTodayStudiedCardIds(reviewLogs, now);
  return cardIds.filter((id) => studiedIds.has(id));
}

function countTodayReviewStudied(
  cardIds: Iterable<string>,
  logs: Record<string, ReviewLog[]>,
  now = Date.now(),
): number {
  const today = localDateKey(now);
  const deckCardIds = new Set(cardIds);
  const reviewedIds = new Set<string>();

  for (const [cardId, cardLogs] of Object.entries(logs)) {
    if (!deckCardIds.has(cardId)) continue;
    if (cardLogs.some((log) => log.stateBefore !== 'new' && localDateKey(log.reviewedAt) === today)) {
      reviewedIds.add(cardId);
    }
  }

  return reviewedIds.size;
}

function buildTodayStudyQueue(deckIds?: string[]): { cardsById: Record<string, FlashCard>; cardIds: string[]; completedIds: string[] } {
  const now = Date.now();
  const reviewLogs = loadReviewLogs();
  const savedCardIds = loadTodayStudyQueueSnapshot(deckIds, now);
  if (savedCardIds) {
    const allCardsById = collectCardsForTodayStudy(deckIds);
    const cardsById: Record<string, FlashCard> = {};
    const cardIds: string[] = [];

    for (const id of savedCardIds) {
      const card = allCardsById[id];
      if (!card || cardsById[id]) continue;
      cardsById[id] = card;
      cardIds.push(id);
    }

    return { cardsById, cardIds, completedIds: getCompletedQueueIds(cardIds, reviewLogs, now) };
  }

  const cardsById: Record<string, FlashCard> = {};
  const cardIds: string[] = [];
  const studiedIds = getTodayStudiedCardIds(reviewLogs, now);

  for (const category of getTodayStudyCategoryKeys(deckIds)) {
    const categoryCards = buildCardsById(category);
    const cards = Object.values(categoryCards);
    const cardDeckIds = cards.map((card) => card.id);
    const completedCards = cards.filter((card) => studiedIds.has(card.id));
    const todayNewLearned = countTodayNewLearned(cardDeckIds, reviewLogs, now);
    const todayReviewStudied = countTodayReviewStudied(cardDeckIds, reviewLogs, now);
    const remainingNewLimit = Math.max(0, getEffectiveNewLimit(category) - todayNewLearned);
    const remainingReviewLimit = Math.max(0, getEffectiveReviewLimit(category) - todayReviewStudied);
    const dueCards = cards
      .filter((card) => !studiedIds.has(card.id) && isDueReviewSm2(card.sm2, now))
      .slice(0, remainingReviewLimit);
    const newCards = cards
      .filter((card) => !studiedIds.has(card.id) && (!card.sm2.state || card.sm2.state === 'new'))
      .slice(0, remainingNewLimit);

    for (const card of [...completedCards, ...dueCards, ...newCards]) {
      if (cardsById[card.id]) continue;
      cardsById[card.id] = card;
      cardIds.push(card.id);
    }
  }

  saveTodayStudyQueueSnapshot(deckIds, cardIds, now);
  return { cardsById, cardIds, completedIds: getCompletedQueueIds(cardIds, reviewLogs, now) };
}

function buildStudyQueueFromCards(cards: FlashCard[]): { cardsById: Record<string, FlashCard>; cardIds: string[]; completedIds: string[] } {
  const cardsById: Record<string, FlashCard> = {};
  const cardIds: string[] = [];

  for (const card of cards) {
    if (cardsById[card.id]) continue;
    if (isResolvedSm2(card.sm2)) continue;
    cardsById[card.id] = card;
    cardIds.push(card.id);
  }

  return { cardsById, cardIds, completedIds: [] };
}

/** 从 API CardDTO 转换为 FlashCard */
function dtoToFlashCard(dto: CardDTO): FlashCard {
  if (dto.type === 'leetcode') {
    const sm2 = normalizeAutoMasteredSm2({
      state: (dto.progress?.state as any) || 'new',
      easeFactor: dto.progress?.easeFactor ?? 2.5,
      interval: dto.progress?.intervalDays ?? 0,
      repetitions: dto.progress?.repetitions ?? 0,
      lapses: dto.progress?.lapses ?? 0,
      nextReview: dto.progress?.nextReview ? new Date(dto.progress.nextReview).getTime() : Date.now(),
      stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0,
    });
    return {
      id: dto.id,
      category: 'leetcode' as const,
      number: dto.number || 0,
      title: dto.title || '',
      titleCn: dto.titleCn || dto.title || '',
      description: dto.description || '',
      approach: dto.approach || '',
      difficulty: (dto.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
      tags: dto.tags,
      codes: dto.codes || undefined,
      sm2,
      favorited: dto.progress?.favorited ?? false,
      userNotes: dto.progress?.userNotes ?? undefined,
    };
  }
  const sm2 = normalizeAutoMasteredSm2({
    state: (dto.progress?.state as any) || 'new',
    easeFactor: dto.progress?.easeFactor ?? 2.5,
    interval: dto.progress?.intervalDays ?? 0,
    repetitions: dto.progress?.repetitions ?? 0,
    lapses: dto.progress?.lapses ?? 0,
    nextReview: dto.progress?.nextReview ? new Date(dto.progress.nextReview).getTime() : Date.now(),
    stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0,
  });
  return {
    id: dto.id,
    category: dto.deckId as QACard['category'],
    question: dto.question || '',
    answer: dto.answer || '',
    tags: dto.tags,
    subTopic: dto.subTopic || undefined,
    difficulty: (dto.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
    source: dto.source || undefined,
    sm2,
    favorited: dto.progress?.favorited ?? false,
    userNotes: dto.progress?.userNotes ?? undefined,
  };
}

// 为了 Step 3/4 导出
export { dtoToFlashCard };

function toTimestamp(value: unknown, fallback = Date.now()): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' || value instanceof Date) {
    const time = new Date(value).getTime();
    if (Number.isFinite(time)) return time;
  }
  return fallback;
}

function apiLogToReviewLog(log: any): ReviewLog | null {
  if (!log?.cardId || log.rating == null) return null;
  return {
    id: log.id || `log-${Date.now()}`,
    cardId: log.cardId,
    reviewedAt: toTimestamp(log.reviewedAt),
    rating: log.rating,
    stateBefore: log.stateBefore || 'new',
    stateAfter: log.stateAfter || 'new',
    intervalBefore: log.intervalBefore ?? 0,
    intervalAfter: log.intervalAfter ?? 0,
    easeBefore: log.easeBefore ?? 2.5,
    easeAfter: log.easeAfter ?? 2.5,
    elapsedDays: log.elapsedDays ?? 0,
    scheduledDays: log.scheduledDays ?? log.intervalAfter ?? 0,
  };
}

function localDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hashText(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(i) | 0;
  }
  return Math.abs(hash).toString(36);
}

function createManualMasteredLog(cardId: string, previousSm2: SM2Record, nextSm2: SM2Record): ReviewLog {
  const now = Date.now();
  const elapsedDays = previousSm2.lastReviewedAt ? Math.max(0, (now - previousSm2.lastReviewedAt) / 86400000) : 0;
  return {
    id: `manual-mastered-${localDateKey(now)}-${hashText(cardId)}`,
    cardId,
    reviewedAt: now,
    rating: 5,
    stateBefore: previousSm2.state,
    stateAfter: nextSm2.state,
    intervalBefore: previousSm2.interval,
    intervalAfter: nextSm2.interval,
    easeBefore: previousSm2.easeFactor,
    easeAfter: nextSm2.easeFactor,
    elapsedDays: Math.round(elapsedDays * 100) / 100,
    scheduledDays: nextSm2.interval,
  };
}

function removeTodayManualMasteredLog(cardId: string, now = Date.now()): ReviewLog | null {
  const logs = loadReviewLogs();
  const cardLogs = logs[cardId] ?? [];
  const today = localDateKey(now);
  const index = cardLogs.findLastIndex((log) =>
    log.id.startsWith('manual-mastered-') &&
    log.stateAfter === 'mastered' &&
    localDateKey(log.reviewedAt) === today
  );
  if (index < 0) return null;

  const [removed] = cardLogs.splice(index, 1);
  if (cardLogs.length > 0) logs[cardId] = cardLogs;
  else delete logs[cardId];
  saveReviewLogs(logs);
  return removed;
}

function restoreSm2BeforeManualMastered(card: FlashCard, log: ReviewLog, now = Date.now()): SM2Record {
  const restored: SM2Record = {
    ...card.sm2,
    state: log.stateBefore,
    interval: log.intervalBefore,
    easeFactor: log.easeBefore,
    repetitions: Math.max(0, card.sm2.repetitions - 1),
    nextReview: now,
    scheduledDays: log.intervalBefore,
  };

  if (log.stateBefore === 'new') {
    restored.interval = 0;
    restored.nextReview = now;
    restored.scheduledDays = 0;
    delete restored.lastReviewedAt;
  }

  return restored;
}

function createLastRatingSnapshot(state: AppState, cardId: string, previousSm2: SM2Record): typeof lastRating {
  return {
    cardId,
    previousSm2: { ...previousSm2 },
    previousPlanCardIds: state.planCardIds ? [...state.planCardIds] : null,
    previousVisibleCardIds: [...state.visibleCardIds],
    previousVisibleIndex: state.currentVisibleIndex,
    previousStudyQueueTotal: state.studyQueueTotal,
    previousStudyQueueCompletedIds: [...state.studyQueueCompletedIds],
  };
}

function clampVisibleIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(index, total - 1));
}

function findNextUncompletedIndex(visibleCardIds: string[], completedIds: Set<string>, fromIndex: number): number {
  if (visibleCardIds.length === 0) return 0;

  for (let i = fromIndex; i < visibleCardIds.length; i += 1) {
    if (!completedIds.has(visibleCardIds[i])) return i;
  }

  for (let i = 0; i < fromIndex; i += 1) {
    if (!completedIds.has(visibleCardIds[i])) return i;
  }

  return clampVisibleIndex(fromIndex, visibleCardIds.length);
}

function removeAnsweredCardFromStudyQueue(state: AppState, cardId: string): AppState {
  if (state.studyMode === 'choose' && !state.planCardIds) {
    const visibleCardIds = computeVisibleIds(state);
    return {
      ...state,
      visibleCardIds,
      currentVisibleIndex: clampVisibleIndex(state.currentVisibleIndex, visibleCardIds.length),
    };
  }

  const completedIds = new Set(state.studyQueueCompletedIds);
  if (state.planCardIds?.includes(cardId)) completedIds.add(cardId);
  const nextState = {
    ...state,
    studyQueueCompletedIds: Array.from(completedIds),
  };
  const visibleCardIds = computeVisibleIds(nextState);

  return {
    ...nextState,
    visibleCardIds,
    currentVisibleIndex: findNextUncompletedIndex(
      visibleCardIds,
      completedIds,
      clampVisibleIndex(state.currentVisibleIndex + 1, visibleCardIds.length),
    ),
  };
}

// ---- Reducer ----
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_API_SOURCE':
      return { ...state, apiSource: action.payload };
    case 'LOADED_QUEUE': {
      const cardsById: Record<string, FlashCard> = {};
      // Merge localStorage SM-2 progress onto API-loaded cards
      const category = action.payload.cards[0]?.category || state.category;
      const progress = loadProgressFromLS(category as Category);
      for (const card of action.payload.cards) {
        const saved = progress.sm2[card.id];
        cardsById[card.id] = saved
          ? { ...card, sm2: normalizeAutoMasteredSm2({ ...card.sm2, ...saved }), favorited: progress.favorited.includes(card.id) }
          : card;
      }
      const nextState = {
        ...state,
        loading: false,
        cardsById,
        category,
        studyMode: (state.studyMode !== 'choose' ? state.studyMode : 'choose') as StudyMode,
        showApproach: false,
        showCode: false,
        qaAnswerVisible: false,
        studyQueueCountsTowardDaily: true,
        studyQueueIncludesResolved: false,
      };
      const visibleCardIds = computeVisibleIds(nextState);
      return {
        ...nextState,
        visibleCardIds,
        currentVisibleIndex: 0,
        studyQueueTotal: nextState.studyMode === 'choose' ? 0 : visibleCardIds.length,
        studyQueueCompletedIds: [],
      };
    }

    /** Helper: load progress from localStorage without card data */
    function loadProgressFromLS(category: Category): { sm2: Record<string, any>; favorited: string[] } {
      try {
        const keyMap: Record<string, string> = {
          leetcode: 'fc-leetcode-progress', statistics: 'fc-stats-progress',
          'machine-learning': 'fc-ml-progress', 'deep-learning': 'fc-deep-learning-progress',
          llm: 'fc-llm-progress', agent: 'fc-agent-progress',
          jargon: 'fc-jargon-progress', workplace: 'fc-workplace-progress',
          'vibe-coding': 'fc-vibe-coding-progress',
          java: 'fc-java-progress',
        };
        const key = keyMap[category] || `fc-progress-${category}`;
        const raw = localStorage.getItem(key);
        if (raw) {
          const p = JSON.parse(raw);
          return { sm2: p.sm2 || {}, favorited: p.favorited || [] };
        }
      } catch {}
      return { sm2: {}, favorited: [] };
    }
    case 'API_RATE_SUCCESS': {
      const card = state.cardsById[action.payload.cardId];
      if (!card) return state;
      if (state.studyQueueCompletedIds.includes(action.payload.cardId)) return state;
      setLastRating(createLastRatingSnapshot(state, action.payload.cardId, card.sm2));
      const progress = action.payload.progress ?? {};
      const newSm2: SM2Record = normalizeAutoMasteredSm2({
        ...card.sm2,
        state: progress.state || 'new',
        easeFactor: progress.easeFactor ?? 2.5,
        interval: progress.intervalDays ?? progress.interval ?? 0,
        repetitions: progress.repetitions ?? 0,
        lapses: progress.lapses ?? 0,
        nextReview: toTimestamp(progress.nextReview),
        lastReviewedAt: progress.lastReviewedAt ? toTimestamp(progress.lastReviewedAt) : Date.now(),
      });
      const apiLog = apiLogToReviewLog(action.payload.log);
      if (apiLog && state.studyQueueCountsTowardDaily !== false) appendReviewLog(apiLog);
      const updated = {
        ...state,
        cardsById: { ...state.cardsById, [action.payload.cardId]: { ...card, sm2: newSm2 } },
        showApproach: false,
        showCode: false,
        qaAnswerVisible: false,
      };
      return removeAnsweredCardFromStudyQueue(updated, action.payload.cardId);
    }
    case 'SET_CATEGORY': {
      const nextState = {
        ...state,
        category: action.payload,
        cardsById: {},  // Cards loaded from API via SubModulePicker / LOADED_QUEUE
        showApproach: false,
        showCode: false,
        qaAnswerVisible: false,
        filterDifficulty: 'all' as const,
        filterSubTopic: 'all' as const,
        searchQuery: '',
        shuffled: false,
        reviewMode: false,
        studyMode: 'choose' as const,
        planCardIds: null,
        studyQueueTotal: 0,
        studyQueueCompletedIds: [],
        studyQueueCountsTowardDaily: true,
        studyQueueIncludesResolved: false,
      };
      return { ...nextState, visibleCardIds: computeVisibleIds(nextState), currentVisibleIndex: 0 };
    }

    case 'GO_TO':
      return {
        ...state,
        currentVisibleIndex: Math.max(0, Math.min(action.payload, state.visibleCardIds.length - 1)),
        qaAnswerVisible: false,
        showApproach: false,
        showCode: false,
      };

    case 'NEXT':
      return {
        ...state,
        currentVisibleIndex: Math.min(state.currentVisibleIndex + 1, state.visibleCardIds.length - 1),
        qaAnswerVisible: false,
        showApproach: false,
        showCode: false,
      };

    case 'PREV':
      return {
        ...state,
        currentVisibleIndex: Math.max(state.currentVisibleIndex - 1, 0),
        qaAnswerVisible: false,
        showApproach: false,
        showCode: false,
      };

    case 'TOGGLE_APPROACH':
      return { ...state, showApproach: !state.showApproach };

    case 'TOGGLE_CODE':
      return { ...state, showCode: !state.showCode };

    case 'TOGGLE_QA_ANSWER':
      return { ...state, qaAnswerVisible: !state.qaAnswerVisible };

    case 'TOGGLE_MASTERED': {
      const card = state.cardsById[action.payload];
      if (!card) return state;
      const isCurrentlyMastered = card.sm2?.state === 'mastered';
      const isQueueCompleted = state.studyQueueCompletedIds.includes(action.payload);
      if (isQueueCompleted && !isCurrentlyMastered) return state;
      const countsTowardDaily = state.studyQueueCountsTowardDaily !== false;
      const previousSm2 = { ...card.sm2 };
      const now = Date.now();
      const restoredManualLog = isCurrentlyMastered && countsTowardDaily
        ? removeTodayManualMasteredLog(action.payload, now)
        : null;
      const newSm2: SM2Record = isCurrentlyMastered
        ? restoredManualLog
          ? restoreSm2BeforeManualMastered(card, restoredManualLog, now)
          : { ...card.sm2, state: 'review' as const, interval: 1, nextReview: now + 86400000 }
        : {
          ...card.sm2,
          state: 'mastered' as const,
          interval: 999,
          repetitions: card.sm2.repetitions + 1,
          nextReview: now + 999 * 86400000,
          lastReviewedAt: now,
          scheduledDays: 999,
        };
      const nextCard = { ...card, sm2: newSm2 };
      if (!isCurrentlyMastered && countsTowardDaily) appendReviewLog(createManualMasteredLog(card.id, previousSm2, newSm2));
      persistCardProgress(nextCard);
      const completedIds = new Set(state.studyQueueCompletedIds);
      if (!isCurrentlyMastered && state.planCardIds?.includes(action.payload)) completedIds.add(action.payload);
      if (isCurrentlyMastered && restoredManualLog && state.planCardIds?.includes(action.payload)) completedIds.delete(action.payload);
      const nextState = {
        ...state,
        studyQueueCompletedIds: Array.from(completedIds),
        cardsById: { ...state.cardsById, [action.payload]: nextCard },
        showApproach: false,
        showCode: false,
        qaAnswerVisible: false,
      };
      const visibleCardIds = computeVisibleIds(nextState);
      const nextIndex = !isCurrentlyMastered && state.planCardIds?.includes(action.payload)
        ? findNextUncompletedIndex(
          visibleCardIds,
          completedIds,
          clampVisibleIndex(state.currentVisibleIndex + 1, visibleCardIds.length),
        )
        : clampVisibleIndex(state.currentVisibleIndex, visibleCardIds.length);
      return {
        ...nextState,
        visibleCardIds,
        currentVisibleIndex: nextIndex,
      };
    }

    case 'TOGGLE_FAVORITE': {
      const card = state.cardsById[action.payload];
      if (!card) return state;
      return {
        ...state,
        cardsById: {
          ...state.cardsById,
          [action.payload]: { ...card, favorited: !card.favorited },
        },
      };
    }

    case 'RATE_CARD': {
      const { cardId, rating, clientReviewId } = action.payload;
      const card = state.cardsById[cardId];
      if (!card) return state;
      if (state.studyQueueCompletedIds.includes(cardId)) return state;
      if (isResolvedSm2(card.sm2)) return state;
      // 保存原始状态用于撤回
      setLastRating(createLastRatingSnapshot(state, cardId, card.sm2));
      const modeConfig = loadStudyModeConfig();
      const countsTowardDaily = state.studyQueueCountsTowardDaily !== false;
      const result = scheduleReview(cardId, card.sm2, rating, {
        sprint: isSprintMode(),
        autoResolveInterval: modeConfig?.autoResolveInterval ?? 90,
      });
      if (countsTowardDaily) appendReviewLog(result.log);
      // 持久化评分进度到 localStorage
      const key = progressKeyMap[card.category] ?? `fc-${card.category}-progress`;
      try {
        const raw = localStorage.getItem(key);
        const prev: StoredProgress = raw ? JSON.parse(raw) : { sm2: {}, mastered: [], favorited: [] };
        prev.sm2[cardId] = result.sm2;
        localStorage.setItem(key, JSON.stringify(prev));
      } catch {}
      if (countsTowardDaily) {
        fetch('http://localhost:3001/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardId,
            rating,
            clientReviewId,
            sprint: isSprintMode(),
            autoResolveInterval: modeConfig?.autoResolveInterval ?? 90,
          }),
        }).catch(() => {});
      }
      const updated = {
        ...state,
        cardsById: {
          ...state.cardsById,
          [cardId]: { ...card, sm2: result.sm2 },
        },
        showApproach: false,
        showCode: false,
        qaAnswerVisible: false,
      };
      return removeAnsweredCardFromStudyQueue(updated, cardId);
    }

    case 'SET_FILTER_DIFFICULTY': {
      const next = { ...state, filterDifficulty: action.payload, showApproach: false, showCode: false, qaAnswerVisible: false };
      return { ...next, visibleCardIds: computeVisibleIds(next), currentVisibleIndex: 0 };
    }

    case 'SET_FILTER_SUBTOPIC': {
      const next = { ...state, filterSubTopic: action.payload, showApproach: false, showCode: false, qaAnswerVisible: false };
      return { ...next, visibleCardIds: computeVisibleIds(next), currentVisibleIndex: 0 };
    }

    case 'SET_SEARCH': {
      const next = { ...state, searchQuery: action.payload, showApproach: false, showCode: false, qaAnswerVisible: false };
      return { ...next, visibleCardIds: computeVisibleIds(next), currentVisibleIndex: 0 };
    }

    case 'TOGGLE_DARK': {
      const next = !state.isDark;
      saveSettings({ isDark: next, lastCategory: state.category });
      return { ...state, isDark: next };
    }

    case 'TOGGLE_STATS':
      return { ...state, showStats: !state.showStats };

    case 'TOGGLE_REVIEW_MODE': {
      const nextReview = !state.reviewMode;
      const next = { ...state, reviewMode: nextReview, showApproach: false, showCode: false, qaAnswerVisible: false };
      return { ...next, visibleCardIds: computeVisibleIds(next), currentVisibleIndex: 0 };
    }

    case 'SHUFFLE': {
      const next = { ...state, shuffled: true, showApproach: false, showCode: false, qaAnswerVisible: false };
      return { ...next, visibleCardIds: computeVisibleIds(next), currentVisibleIndex: 0 };
    }

    case 'RESET_ORDER': {
      const next = { ...state, shuffled: false, showApproach: false, showCode: false, qaAnswerVisible: false };
      return { ...next, visibleCardIds: computeVisibleIds(next), currentVisibleIndex: 0 };
    }

    case 'ADD_CARD': {
      const card = action.payload;
      // 持久化到内置模块的用户卡片区
      const isBuiltIn = Object.keys(CARD_DATA).includes(card.category);
      if (isBuiltIn) {
        const key = `fc-user-cards-${card.category}`;
        const existing = loadUserCards(card.category);
        existing[card.id] = card;
        try { localStorage.setItem(key, JSON.stringify(existing)); } catch {}
      } else if (loadCustomDecks().some((deck) => deck.id === card.category)) {
        updateCardInDeck(card.category, card as QACard);
      }
      return {
        ...state,
        cardsById: { ...state.cardsById, [card.id]: card },
      };
    }

    case 'UPDATE_CARD': {
      const card = action.payload;
      const isBuiltIn = Object.keys(CARD_DATA).includes(card.category);
      if (isBuiltIn) {
        const key = `fc-user-cards-${card.category}`;
        const existing = loadUserCards(card.category);
        existing[card.id] = card;
        try { localStorage.setItem(key, JSON.stringify(existing)); } catch {}
      } else if (loadCustomDecks().some((deck) => deck.id === card.category)) {
        updateCardInDeck(card.category, card as QACard);
      }
      return {
        ...state,
        cardsById: { ...state.cardsById, [card.id]: card },
      };
    }

    case 'DELETE_CARD': {
      const newCards = { ...state.cardsById };
      const removed = newCards[action.payload];
      if (removed) {
        softDeleteCard(removed);
        delete newCards[action.payload];
      }
      return {
        ...state,
        cardsById: newCards,
      };
    }

    case 'SET_DAILY_NEW_LIMIT':
      return { ...state, dailyNewLimit: action.payload };
    case 'SET_DAILY_REVIEW_LIMIT':
      return { ...state, dailyReviewLimit: action.payload };

    case 'SET_STUDY_MODE': {
      const next = { 
        ...state, 
        studyMode: action.payload,
        filterSubTopic: action.payload === 'choose' ? 'all' : state.filterSubTopic,
        planCardIds: action.payload === 'choose' ? null : state.planCardIds,
        studyQueueCompletedIds: action.payload === 'choose' ? [] : state.studyQueueCompletedIds,
        studyQueueCountsTowardDaily: action.payload === 'choose' ? true : state.studyQueueCountsTowardDaily,
        studyQueueIncludesResolved: action.payload === 'choose' ? false : state.studyQueueIncludesResolved,
        showApproach: false,
        showCode: false,
        qaAnswerVisible: false,
      };
      const visibleCardIds = computeVisibleIds(next);
      return {
        ...next,
        visibleCardIds,
        currentVisibleIndex: 0,
        studyQueueTotal: action.payload === 'choose' ? 0 : visibleCardIds.length,
      };
    }

    case 'UNDO_LAST_RATING': {
      const last = getLastRating();
      if (!last || !state.cardsById[last.cardId]) return state;
      const cardsById = {
        ...state.cardsById,
        [last.cardId]: { ...state.cardsById[last.cardId], sm2: last.previousSm2 },
      };
      const visibleCardIds = last.previousVisibleCardIds.filter((id) => id in cardsById);
      return {
        ...state,
        cardsById,
        planCardIds: last.previousPlanCardIds,
        visibleCardIds,
        currentVisibleIndex: clampVisibleIndex(last.previousVisibleIndex, visibleCardIds.length),
        studyQueueTotal: last.previousStudyQueueTotal,
        studyQueueCompletedIds: last.previousStudyQueueCompletedIds,
        qaAnswerVisible: false,
        showApproach: false,
        showCode: false,
      };
    }

    case 'JUMP_TO_CARD': {
      const { category: cat, cardId } = action.payload;
      const cardsById = buildCardsById(cat);
      const nextState: AppState = {
        ...state,
        category: cat,
        cardsById,
        showApproach: false,
        showCode: false,
        qaAnswerVisible: false,
        filterDifficulty: 'all' as const,
        filterSubTopic: 'all' as const,
        searchQuery: '',
        shuffled: false,
        reviewMode: false,
        studyMode: 'review' as const,
        planCardIds: null,
        studyQueueCompletedIds: [],
        studyQueueCountsTowardDaily: true,
        studyQueueIncludesResolved: false,
      };
      const visibleIds = computeVisibleIds(nextState);
      const idx = visibleIds.indexOf(cardId);
      return {
        ...nextState,
        visibleCardIds: visibleIds,
        currentVisibleIndex: idx >= 0 ? idx : 0,
        studyQueueTotal: visibleIds.length,
      };
    }

    case 'START_TODAY_STUDY': {
      const existingCards = state.planCardIds
        ? state.planCardIds.map((id) => state.cardsById[id]).filter(Boolean) as FlashCard[]
        : [];
      const { cardsById, cardIds, completedIds } = action.payload?.cards?.length
        ? buildStudyQueueFromCards([...existingCards, ...action.payload.cards])
        : buildTodayStudyQueue(action.payload?.deckIds);
      const next = {
        ...state,
        cardsById,
        planCardIds: cardIds,
        studyQueueCompletedIds: completedIds,
        studyQueueCountsTowardDaily: true,
        studyQueueIncludesResolved: false,
        studyMode: 'new' as const,
        shuffled: false,
        showApproach: false,
        showCode: false,
        qaAnswerVisible: false,
        filterDifficulty: 'all' as const,
        filterSubTopic: 'all' as const,
        searchQuery: '',
        studyQueueTotal: cardIds.length,
      };
      const visibleCardIds = computeVisibleIds(next);
      return {
        ...next,
        visibleCardIds,
        currentVisibleIndex: findNextUncompletedIndex(visibleCardIds, new Set(completedIds), 0),
        studyQueueTotal: cardIds.length,
      };
    }

    case 'START_PLAN_STUDY': {
      // Load cards from all decks needed by the plan
      const allCardsById: Record<string, FlashCard> = { ...state.cardsById };
      const neededDecks = new Set(action.payload.cardIds.map(id => {
        const prefix = id.split('-')[0];
        const deckMap: Record<string, string> = { lc: 'leetcode', stats: 'statistics', ml: 'machine-learning', dl: 'deep-learning', llm: 'llm', agent: 'agent', jargon: 'jargon', wp: 'workplace', vc: 'vibe-coding' };
        return deckMap[prefix] || prefix;
      }));
      for (const deck of neededDecks) {
        Object.assign(allCardsById, buildCardsById(deck as Category));
      }
      const next = {
        ...state,
        cardsById: allCardsById,
        planCardIds: action.payload.cardIds,
        studyMode: 'new' as const,
        shuffled: false,
        studyQueueTotal: action.payload.cardIds.length,
        studyQueueCompletedIds: [],
        studyQueueCountsTowardDaily: true,
        studyQueueIncludesResolved: false,
      };
      const visibleCardIds = computeVisibleIds(next);
      return { ...next, visibleCardIds, currentVisibleIndex: 0, studyQueueTotal: visibleCardIds.length };
    }
    case 'START_SINGLE_CARD_STUDY': {
      const card = {
        ...action.payload.card,
        sm2: normalizeAutoMasteredSm2(action.payload.card.sm2),
      } as FlashCard;
      const next = {
        ...state,
        category: card.category,
        cardsById: { ...state.cardsById, [card.id]: card },
        planCardIds: [card.id],
        studyQueueCompletedIds: [],
        studyQueueCountsTowardDaily: action.payload.countTowardsDaily !== false,
        studyQueueIncludesResolved: true,
        studyMode: 'new' as const,
        shuffled: false,
        showApproach: false,
        showCode: false,
        qaAnswerVisible: false,
        filterDifficulty: 'all' as const,
        filterSubTopic: 'all' as const,
        searchQuery: '',
        studyQueueTotal: 1,
      };
      const visibleCardIds = computeVisibleIds(next);
      return {
        ...next,
        visibleCardIds,
        currentVisibleIndex: 0,
        studyQueueTotal: visibleCardIds.length || 1,
      };
    }
    case 'STOP_PLAN_STUDY': {
      const next = {
        ...state,
        planCardIds: null,
        studyMode: 'choose' as const,
        studyQueueTotal: 0,
        studyQueueCompletedIds: [],
        studyQueueCountsTowardDaily: true,
        studyQueueIncludesResolved: false,
      };
      return { ...next, visibleCardIds: computeVisibleIds(next), currentVisibleIndex: 0 };
    }

    case 'SET_STUDY_MODE_CONFIG': {
      saveStudyModeConfig(action.payload);
      clearTodayStudyQueueSnapshot();
      const next = { ...state };
      return { ...next, visibleCardIds: computeVisibleIds(next), currentVisibleIndex: clampVisibleIndex(state.currentVisibleIndex, computeVisibleIds(next).length) };
    }

    default:
      return state;
  }
}

// ---- Helpers ----
export function getMasteredIds(cardsById: Record<string, FlashCard>): string[] {
  return Object.values(cardsById)
    .filter((c) => c.sm2.state === 'mastered')
    .map((c) => c.id);
}

export function getFavoritedIds(cardsById: Record<string, FlashCard>): string[] {
  return Object.values(cardsById).filter((c) => c.favorited).map((c) => c.id);
}

// ---- Initial State ----
function createInitialState(): AppState {
  const settings = (() => {
    try { return JSON.parse(localStorage.getItem('fc-settings') || '{}'); }
    catch { return {}; }
  })();
  const category = settings.lastCategory ?? 'leetcode';

  return {
    category,
    cardsById: {},  // cards loaded from API on demand
    visibleCardIds: [],
    currentVisibleIndex: 0,
    studyQueueTotal: 0,
    studyQueueCompletedIds: [],
    studyQueueCountsTowardDaily: true,
    studyQueueIncludesResolved: false,
    showApproach: false,
    showCode: false,
    qaAnswerVisible: false,
    filterDifficulty: 'all',
    filterSubTopic: 'all',
    searchQuery: '',
    isDark: settings.isDark ?? false,
    showStats: false,
    shuffled: false,
    reviewMode: false,
    dailyNewLimit: 20,
    dailyReviewLimit: 100,
    studyMode: 'choose',
    loading: false,
    apiSource: false,
    planCardIds: null,
  };
}

// ---- Context ----
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  currentCard: FlashCard | null;
  visibleCards: FlashCard[];
  masteredIds: string[];
  favoritedIds: string[];
  dueCountByCategory: Record<Category, number>;
  totalDue: number;
  totalNew: number;
  dataReady: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);
  const [dataReady, setDataReady] = useState(false);

  // 启动时从 data.json 恢复进度到 localStorage
  const hasLoadedData = useRef(false);
  useEffect(() => {
    loadAppData().then((data) => {
      hasLoadedData.current = true;
      setDataReady(true);
      // 重建 cardsById，使用刚从文件恢复的进度
      dispatch({ type: 'SET_CATEGORY', payload: data.settings?.lastCategory ?? state.category });
    });
  }, []);

  // 初始化时触发可见卡片计算
  useEffect(() => {
    dispatch({ type: 'SET_FILTER_DIFFICULTY', payload: 'all' });
  }, []);

  // persist dark mode class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.isDark);
  }, [state.isDark]);

  // 持久化（数据未从文件恢复前跳过，防止空数据覆盖 data.json）
  useEffect(() => {
    if (!hasLoadedData.current) return;

    saveProgressByCardCategory(Object.values(state.cardsById));

    // Tauri 文件存储（v2 schema）
    const allData = loadAllProgress();
    const allLimits = getAllModuleLimits() as Record<string, number>;
    const allReviewLimits = getAllModuleReviewLimits() as Record<string, number>;
    saveAppData({
      schemaVersion: 2,
      progress: allData,
      settings: { isDark: state.isDark, lastCategory: state.category },
      stats: { sessions: [] },
      customDecks: loadCustomDecks().map((d: any) => ({ id: d.id, name: d.name, icon: d.icon, description: d.description || '' })),
      customCards: loadAllCustomCards(),
      moduleDailyLimits: allLimits,
      moduleDailyReviewLimits: allReviewLimits,
      studyModeConfig: loadStudyModeConfig(),
      reviewLogs: loadReviewLogs(),
      deletedCustomDecks: loadDeletedCustomDecks(),
      deletedCards: loadDeletedCards(),
    } as any).then(() => syncLocalAppDataToBackend()).catch(() => {});
  }, [state.cardsById, state.category, state.isDark]);

  const currentCard = state.visibleCardIds.length > 0
    ? state.cardsById[state.visibleCardIds[state.currentVisibleIndex]] ?? null
    : null;

  const visibleCards = useMemo(
    () => state.visibleCardIds.map((id) => state.cardsById[id]).filter(Boolean) as FlashCard[],
    [state.visibleCardIds, state.cardsById],
  );

  const masteredIds = useMemo(() => getMasteredIds(state.cardsById), [state.cardsById]);
  const favoritedIds = useMemo(() => getFavoritedIds(state.cardsById), [state.cardsById]);

  // Due counts
  const dueCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [cat, allCards] of Object.entries(CARD_DATA) as [Category, FlashCard[]][]) {
      const progress = loadProgress(cat);
      counts[cat] = allCards.filter((c) => {
        const sm2 = progress.sm2[c.id] ?? c.sm2;
        return isDueReviewSm2(sm2);
      }).length;
    }
    for (const deck of loadCustomDecks()) {
      const progress = loadProgress(deck.id);
      counts[deck.id] = loadCustomCards(deck.id).filter((card) => {
        const sm2 = progress.sm2[card.id] ?? card.sm2;
        return isDueReviewSm2(sm2);
      }).length;
    }
    return counts as Record<Category, number>;
  }, [state.cardsById]);

  const totalDue = useMemo(() => Object.values(dueCountByCategory).reduce((a, b) => a + b, 0), [dueCountByCategory]);

  // 新卡片总数（从 localStorage 读取真实状态）
  const totalNew = useMemo(() => {
    let count = 0;
    for (const [cat, allCards] of Object.entries(CARD_DATA) as [Category, FlashCard[]][]) {
      const progress = loadProgress(cat);
      count += allCards.filter((c) => {
        const sm2 = progress.sm2[c.id];
        return !sm2 || sm2.state === 'new';
      }).length;
    }
    for (const deck of loadCustomDecks()) {
      const progress = loadProgress(deck.id);
      count += loadCustomCards(deck.id).filter((card) => {
        const sm2 = progress.sm2[card.id] ?? card.sm2;
        return !sm2.state || sm2.state === 'new';
      }).length;
    }
    return count;
  }, [state.cardsById]);

  const value: AppContextValue = {
    state,
    dispatch,
    currentCard,
    visibleCards,
    masteredIds,
    favoritedIds,
    dueCountByCategory,
    totalDue,
    totalNew,
    dataReady,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

// ---- helpers ----
function saveProgressToLS(category: Category, progress: StoredProgress) {
  try {
    const key = progressKeyMap[category] ?? `fc-${category}-progress`;
    localStorage.setItem(key, JSON.stringify(progress));
  } catch {}
}

function persistCardProgress(card: FlashCard) {
  const previous = loadProgress(card.category);
  const mastered = new Set(previous.mastered ?? []);
  const favorited = new Set(previous.favorited ?? []);
  const nextProgress: StoredProgress = {
    sm2: { ...previous.sm2, [card.id]: card.sm2 },
    mastered: [],
    favorited: [],
  };

  if (card.sm2.state === 'mastered') mastered.add(card.id);
  else mastered.delete(card.id);

  if (card.favorited) favorited.add(card.id);
  else favorited.delete(card.id);

  nextProgress.mastered = Array.from(mastered);
  nextProgress.favorited = Array.from(favorited);
  saveProgressToLS(card.category, nextProgress);
}

function saveProgressByCardCategory(cards: FlashCard[]) {
  const grouped = new Map<Category, FlashCard[]>();
  for (const card of cards) {
    const group = grouped.get(card.category) ?? [];
    group.push(card);
    grouped.set(card.category, group);
  }

  for (const [category, categoryCards] of grouped) {
    const previous = loadProgress(category);
    const touchedIds = new Set(categoryCards.map((card) => card.id));
    const mastered = new Set((previous.mastered ?? []).filter((id) => !touchedIds.has(id)));
    const favorited = new Set((previous.favorited ?? []).filter((id) => !touchedIds.has(id)));
    const nextProgress: StoredProgress = {
      sm2: { ...previous.sm2 },
      mastered: [],
      favorited: [],
    };

    for (const card of categoryCards) {
      nextProgress.sm2[card.id] = card.sm2;
      if (card.sm2.state === 'mastered') mastered.add(card.id);
      if (card.favorited) favorited.add(card.id);
    }

    nextProgress.mastered = Array.from(mastered);
    nextProgress.favorited = Array.from(favorited);
    saveProgressToLS(category, nextProgress);
  }
}

function loadAllProgress(): Record<string, StoredProgress> {
  const result: Record<string, StoredProgress> = {};
  for (const key of Object.values(progressKeyMap)) {
    try {
      result[key] = JSON.parse(localStorage.getItem(key) || '{"sm2":{},"mastered":[],"favorited":[]}');
    } catch {
      result[key] = { sm2: {}, mastered: [], favorited: [] };
    }
  }
  return result;
}
