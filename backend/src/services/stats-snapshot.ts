import prisma from '../db/prisma';

export interface StatsSnapshotRow {
  userId: string;
  scopeType: 'global' | 'deck';
  scopeId: string;
  label: string;
  totalCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  relearningCards: number;
  dueCards: number;
  startedCards: number;
  masteredCards: number;
  masteryRate: number;
  favoritedCards: number;
  todayNewLimit: number;
  todayNewRemaining: number;
  todayReviewLimit: number;
  todayReviewRemaining: number;
  todayStudiedCards: number;
  todayReviewCount: number;
  todayCorrectCount: number;
  todayWrongCount: number;
  correctRate: number | null;
  streak: number;
  updatedAt: string;
}

export interface StatsSnapshotResponse {
  global: StatsSnapshotRow;
  decks: StatsSnapshotRow[];
  updatedAt: string;
}

type DeckRow = { id: string; name: string; type: string; sortOrder: number };
type CardProgressRow = {
  id: string;
  deckId: string;
  state: string | null;
  nextReview: string | Date | null;
  lastReviewedAt: string | Date | null;
  favorited: number | boolean | null;
};
type LimitRow = { deckId: string; dailyLimit?: number; dailyReviewLimit?: number };
type LogRow = {
  cardId: string;
  deckId: string;
  rating: number;
  stateBefore: string;
  stateAfter: string;
  intervalAfter: number | null;
  nextReviewAfter: string | Date | null;
  reviewedAt: string | Date;
};
type EffectiveCardState = {
  state: string;
  nextReview: string | Date | null;
};

const DEFAULT_USER_ID = 'demo-user';
const GLOBAL_SCOPE_ID = 'all';
const BUILTIN_DECK_LABELS: Record<string, string> = {
  leetcode: '力扣',
  statistics: '统计学',
  'machine-learning': '机器学习',
  'deep-learning': '深度学习',
  llm: '大模型',
  agent: 'Agent',
  jargon: '黑话',
  workplace: '职场',
  'vibe-coding': 'Vibe Coding',
  java: 'Java 面试',
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function dateKeyInTimezone(value: string | Date, timezone: string): string {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function emptyRow(
  userId: string,
  scopeType: 'global' | 'deck',
  scopeId: string,
  label: string,
  updatedAt: string,
): StatsSnapshotRow {
  return {
    userId,
    scopeType,
    scopeId,
    label,
    totalCards: 0,
    newCards: 0,
    learningCards: 0,
    reviewCards: 0,
    relearningCards: 0,
    dueCards: 0,
    startedCards: 0,
    masteredCards: 0,
    masteryRate: 0,
    favoritedCards: 0,
    todayNewLimit: 0,
    todayNewRemaining: 0,
    todayReviewLimit: 0,
    todayReviewRemaining: 0,
    todayStudiedCards: 0,
    todayReviewCount: 0,
    todayCorrectCount: 0,
    todayWrongCount: 0,
    correctRate: null,
    streak: 0,
    updatedAt,
  };
}

async function ensureColumn(table: string, column: string, ddl: string): Promise<void> {
  const rows = await prisma.$queryRawUnsafe<{ name: string }[]>(`PRAGMA table_info("${table}")`);
  if (!rows.some((row) => row.name === column)) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN ${ddl}`);
  }
}

export async function ensureStatsSnapshotStorage(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DeckDailyReviewLimit" (
      "userId" TEXT NOT NULL,
      "deckId" TEXT NOT NULL,
      "dailyReviewLimit" INTEGER NOT NULL DEFAULT 100,
      PRIMARY KEY ("userId", "deckId"),
      FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "StudyStatsSnapshot" (
      "userId" TEXT NOT NULL,
      "scopeType" TEXT NOT NULL,
      "scopeId" TEXT NOT NULL,
      "label" TEXT NOT NULL,
      "totalCards" INTEGER NOT NULL DEFAULT 0,
      "newCards" INTEGER NOT NULL DEFAULT 0,
      "learningCards" INTEGER NOT NULL DEFAULT 0,
      "reviewCards" INTEGER NOT NULL DEFAULT 0,
      "relearningCards" INTEGER NOT NULL DEFAULT 0,
      "dueCards" INTEGER NOT NULL DEFAULT 0,
      "startedCards" INTEGER NOT NULL DEFAULT 0,
      "masteredCards" INTEGER NOT NULL DEFAULT 0,
      "masteryRate" REAL NOT NULL DEFAULT 0,
      "favoritedCards" INTEGER NOT NULL DEFAULT 0,
      "todayNewLimit" INTEGER NOT NULL DEFAULT 0,
      "todayNewRemaining" INTEGER NOT NULL DEFAULT 0,
      "todayReviewLimit" INTEGER NOT NULL DEFAULT 0,
      "todayReviewRemaining" INTEGER NOT NULL DEFAULT 0,
      "todayStudiedCards" INTEGER NOT NULL DEFAULT 0,
      "todayReviewCount" INTEGER NOT NULL DEFAULT 0,
      "todayCorrectCount" INTEGER NOT NULL DEFAULT 0,
      "todayWrongCount" INTEGER NOT NULL DEFAULT 0,
      "correctRate" REAL,
      "streak" INTEGER NOT NULL DEFAULT 0,
      "updatedAt" DATETIME NOT NULL,
      PRIMARY KEY ("userId", "scopeType", "scopeId")
    )
  `);

  await ensureColumn('StudyStatsSnapshot', 'startedCards', '"startedCards" INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('StudyStatsSnapshot', 'masteredCards', '"masteredCards" INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('StudyStatsSnapshot', 'masteryRate', '"masteryRate" REAL NOT NULL DEFAULT 0');
  await ensureColumn('StudyStatsSnapshot', 'favoritedCards', '"favoritedCards" INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('StudyStatsSnapshot', 'todayReviewLimit', '"todayReviewLimit" INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('StudyStatsSnapshot', 'todayReviewRemaining', '"todayReviewRemaining" INTEGER NOT NULL DEFAULT 0');
}

function finalizeRow(row: StatsSnapshotRow): StatsSnapshotRow {
  row.startedCards = Math.max(
    row.startedCards,
    row.learningCards + row.reviewCards + row.relearningCards + row.masteredCards,
  );
  row.masteryRate = row.totalCards > 0 ? round2((row.masteredCards / row.totalCards) * 100) : 0;
  row.correctRate = row.todayReviewCount > 0 ? round2((row.todayCorrectCount / row.todayReviewCount) * 100) : null;
  return row;
}

function timestampOf(value: string | Date | null | undefined): number {
  if (!value) return 0;
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function validCardState(value: string | null | undefined): string {
  return ['learning', 'review', 'relearning', 'mastered'].includes(value || '') ? value as string : 'new';
}

function inferNextReviewFromLog(log: LogRow): Date | null {
  const reviewedAt = timestampOf(log.reviewedAt);
  if (!reviewedAt || typeof log.intervalAfter !== 'number' || !Number.isFinite(log.intervalAfter)) return null;
  return new Date(reviewedAt + log.intervalAfter * 86400000);
}

function getEffectiveCardState(card: CardProgressRow, latestLog?: LogRow): EffectiveCardState {
  const progressState = validCardState(card.state);
  const progressTime = timestampOf(card.lastReviewedAt);
  const logTime = latestLog ? timestampOf(latestLog.reviewedAt) : 0;

  if (latestLog && (progressState === 'new' || logTime >= progressTime)) {
    return {
      state: validCardState(latestLog.stateAfter),
      nextReview: latestLog.nextReviewAfter ?? inferNextReviewFromLog(latestLog) ?? card.nextReview,
    };
  }

  return { state: progressState, nextReview: card.nextReview };
}

function addToGlobal(global: StatsSnapshotRow, row: StatsSnapshotRow): void {
  global.totalCards += row.totalCards;
  global.newCards += row.newCards;
  global.learningCards += row.learningCards;
  global.reviewCards += row.reviewCards;
  global.relearningCards += row.relearningCards;
  global.dueCards += row.dueCards;
  global.startedCards += row.startedCards;
  global.masteredCards += row.masteredCards;
  global.favoritedCards += row.favoritedCards;
  global.todayNewLimit += row.todayNewLimit;
  global.todayNewRemaining += row.todayNewRemaining;
  global.todayReviewLimit += row.todayReviewLimit;
  global.todayReviewRemaining += row.todayReviewRemaining;
  global.todayStudiedCards += row.todayStudiedCards;
  global.todayReviewCount += row.todayReviewCount;
  global.todayCorrectCount += row.todayCorrectCount;
  global.todayWrongCount += row.todayWrongCount;
}

async function upsertSnapshotRow(row: StatsSnapshotRow): Promise<void> {
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "StudyStatsSnapshot" (
        "userId", "scopeType", "scopeId", "label",
        "totalCards", "newCards", "learningCards", "reviewCards", "relearningCards",
        "dueCards", "startedCards", "masteredCards", "masteryRate", "favoritedCards",
        "todayNewLimit", "todayNewRemaining", "todayReviewLimit", "todayReviewRemaining",
        "todayStudiedCards", "todayReviewCount", "todayCorrectCount", "todayWrongCount",
        "correctRate", "streak", "updatedAt"
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT("userId", "scopeType", "scopeId") DO UPDATE SET
        "label" = excluded."label",
        "totalCards" = excluded."totalCards",
        "newCards" = excluded."newCards",
        "learningCards" = excluded."learningCards",
        "reviewCards" = excluded."reviewCards",
        "relearningCards" = excluded."relearningCards",
        "dueCards" = excluded."dueCards",
        "startedCards" = excluded."startedCards",
        "masteredCards" = excluded."masteredCards",
        "masteryRate" = excluded."masteryRate",
        "favoritedCards" = excluded."favoritedCards",
        "todayNewLimit" = excluded."todayNewLimit",
        "todayNewRemaining" = excluded."todayNewRemaining",
        "todayReviewLimit" = excluded."todayReviewLimit",
        "todayReviewRemaining" = excluded."todayReviewRemaining",
        "todayStudiedCards" = excluded."todayStudiedCards",
        "todayReviewCount" = excluded."todayReviewCount",
        "todayCorrectCount" = excluded."todayCorrectCount",
        "todayWrongCount" = excluded."todayWrongCount",
        "correctRate" = excluded."correctRate",
        "streak" = excluded."streak",
        "updatedAt" = excluded."updatedAt"
    `,
    row.userId,
    row.scopeType,
    row.scopeId,
    row.label,
    row.totalCards,
    row.newCards,
    row.learningCards,
    row.reviewCards,
    row.relearningCards,
    row.dueCards,
    row.startedCards,
    row.masteredCards,
    row.masteryRate,
    row.favoritedCards,
    row.todayNewLimit,
    row.todayNewRemaining,
    row.todayReviewLimit,
    row.todayReviewRemaining,
    row.todayStudiedCards,
    row.todayReviewCount,
    row.todayCorrectCount,
    row.todayWrongCount,
    row.correctRate,
    row.streak,
    row.updatedAt,
  );
}

export async function rebuildStatsSnapshot(
  userId = DEFAULT_USER_ID,
  timezone = 'Australia/Sydney',
): Promise<StatsSnapshotResponse> {
  await ensureStatsSnapshotStorage();

  const now = new Date();
  const updatedAt = now.toISOString();
  const todayKey = dateKeyInTimezone(now, timezone);

  const [decks, cards, newLimits, reviewLimits, logs] = await Promise.all([
    prisma.$queryRawUnsafe<DeckRow[]>('SELECT id, name, type, sortOrder FROM "Deck" ORDER BY sortOrder ASC'),
    prisma.$queryRawUnsafe<CardProgressRow[]>(
      `
        SELECT c.id, c.deckId, cp.state, cp.nextReview, cp.lastReviewedAt, cp.favorited
        FROM "Card" c
        LEFT JOIN "CardProgress" cp ON c.id = cp.cardId AND cp.userId = ?
      `,
      userId,
    ),
    prisma.$queryRawUnsafe<LimitRow[]>(
      'SELECT deckId, dailyLimit FROM "DeckDailyLimit" WHERE userId = ?',
      userId,
    ),
    prisma.$queryRawUnsafe<LimitRow[]>(
      'SELECT deckId, dailyReviewLimit FROM "DeckDailyReviewLimit" WHERE userId = ?',
      userId,
    ),
    prisma.$queryRawUnsafe<LogRow[]>(
      `
        SELECT
          l.cardId,
          c.deckId,
          l.rating,
          l.stateBefore,
          l.stateAfter,
          l.intervalAfter,
          l.nextReviewAfter,
          l.reviewedAt
        FROM "ReviewLog" l
        INNER JOIN "Card" c ON c.id = l.cardId
        WHERE l.userId = ?
      `,
      userId,
    ),
  ]);

  const dailyLimitByDeck = new Map(newLimits.map((row) => [row.deckId, Number(row.dailyLimit ?? 20)]));
  const dailyReviewLimitByDeck = new Map(reviewLimits.map((row) => [row.deckId, Number(row.dailyReviewLimit ?? 100)]));
  const rowsByDeck = new Map<string, StatsSnapshotRow>();
  const latestLogByCard = new Map<string, LogRow>();

  for (const log of logs) {
    const current = latestLogByCard.get(log.cardId);
    if (!current || timestampOf(log.reviewedAt) > timestampOf(current.reviewedAt)) {
      latestLogByCard.set(log.cardId, log);
    }
  }

  for (const deck of decks) {
    rowsByDeck.set(
      deck.id,
      emptyRow(
        userId,
        'deck',
        deck.id,
        BUILTIN_DECK_LABELS[deck.id] || deck.name || deck.id,
        updatedAt,
      ),
    );
  }

  for (const card of cards) {
    const row = rowsByDeck.get(card.deckId);
    if (!row) continue;
    const effective = getEffectiveCardState(card, latestLogByCard.get(card.id));
    const state = effective.state;
    row.totalCards += 1;
    if (state === 'learning') row.learningCards += 1;
    else if (state === 'review') row.reviewCards += 1;
    else if (state === 'relearning') row.relearningCards += 1;
    else if (state === 'mastered') row.masteredCards += 1;
    else row.newCards += 1;

    if (['learning', 'review', 'relearning'].includes(state || '') && effective.nextReview && new Date(effective.nextReview).getTime() <= now.getTime()) {
      row.dueCards += 1;
    }
    if (card.favorited === true || card.favorited === 1) row.favoritedCards += 1;
  }

  const todayStudiedByDeck = new Map<string, Set<string>>();
  const todayNewLearnedByDeck = new Map<string, Set<string>>();
  let globalStreak = 0;
  const logDateKeys = new Set<string>();

  for (const log of logs) {
    const logDay = dateKeyInTimezone(log.reviewedAt, timezone);
    logDateKeys.add(logDay);
    if (logDay !== todayKey) continue;

    const row = rowsByDeck.get(log.deckId);
    if (!row) continue;
    row.todayReviewCount += 1;
    if (log.rating >= 3) row.todayCorrectCount += 1;
    else row.todayWrongCount += 1;

    const studied = todayStudiedByDeck.get(log.deckId) ?? new Set<string>();
    studied.add(log.cardId);
    todayStudiedByDeck.set(log.deckId, studied);

    if (log.stateBefore === 'new') {
      const learned = todayNewLearnedByDeck.get(log.deckId) ?? new Set<string>();
      learned.add(log.cardId);
      todayNewLearnedByDeck.set(log.deckId, learned);
    }
  }

  let streakCheck = new Date(now);
  if (!logDateKeys.has(todayKey)) streakCheck.setDate(streakCheck.getDate() - 1);
  while (true) {
    const key = dateKeyInTimezone(streakCheck, timezone);
    if (!logDateKeys.has(key)) break;
    globalStreak += 1;
    streakCheck.setDate(streakCheck.getDate() - 1);
  }

  const deckRows = Array.from(rowsByDeck.values());
  for (const row of deckRows) {
    row.todayNewLimit = row.totalCards > 0 ? dailyLimitByDeck.get(row.scopeId) ?? 20 : 0;
    row.todayReviewLimit = row.totalCards > 0 ? dailyReviewLimitByDeck.get(row.scopeId) ?? 100 : 0;
    const learnedToday = todayNewLearnedByDeck.get(row.scopeId)?.size ?? 0;
    const reviewedToday = logs.filter((log) => (
      log.deckId === row.scopeId
      && log.stateBefore !== 'new'
      && dateKeyInTimezone(log.reviewedAt, timezone) === todayKey
    )).length;
    row.todayNewRemaining = Math.max(0, Math.min(row.newCards, row.todayNewLimit - learnedToday));
    row.todayReviewRemaining = Math.max(0, Math.min(row.dueCards, row.todayReviewLimit - reviewedToday));
    row.todayStudiedCards = todayStudiedByDeck.get(row.scopeId)?.size ?? 0;
    row.streak = globalStreak;
    finalizeRow(row);
  }

  const global = emptyRow(userId, 'global', GLOBAL_SCOPE_ID, '全部', updatedAt);
  for (const row of deckRows) addToGlobal(global, row);
  global.streak = globalStreak;
  finalizeRow(global);

  await prisma.$executeRawUnsafe(
    'DELETE FROM "StudyStatsSnapshot" WHERE userId = ? AND scopeType = ?',
    userId,
    'deck',
  );

  await upsertSnapshotRow(global);
  for (const row of deckRows) await upsertSnapshotRow(row);

  return { global, decks: deckRows, updatedAt };
}

export async function readStatsSnapshot(userId = DEFAULT_USER_ID): Promise<StatsSnapshotResponse> {
  await ensureStatsSnapshotStorage();
  const rows = await prisma.$queryRawUnsafe<StatsSnapshotRow[]>(
    `
      SELECT * FROM "StudyStatsSnapshot"
      WHERE userId = ?
      ORDER BY CASE scopeType WHEN 'global' THEN 0 ELSE 1 END, scopeId ASC
    `,
    userId,
  );
  const global = rows.find((row) => row.scopeType === 'global' && row.scopeId === GLOBAL_SCOPE_ID)
    ?? emptyRow(userId, 'global', GLOBAL_SCOPE_ID, '全部', new Date().toISOString());
  const decks = rows.filter((row) => row.scopeType === 'deck');
  return { global, decks, updatedAt: global.updatedAt };
}
