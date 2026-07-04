import { FastifyInstance } from 'fastify';
import prisma from '../db/prisma';
import { ensureStatsSnapshotStorage, rebuildStatsSnapshot } from '../services/stats-snapshot';

const USER_ID = 'demo-user';

const BUILTIN_DECKS: Record<string, { name: string; sortOrder: number }> = {
  leetcode: { name: '力扣', sortOrder: 1 },
  statistics: { name: '统计学', sortOrder: 2 },
  'machine-learning': { name: '机器学习', sortOrder: 3 },
  'deep-learning': { name: '深度学习', sortOrder: 4 },
  llm: { name: '大模型', sortOrder: 5 },
  agent: { name: 'Agent', sortOrder: 6 },
  jargon: { name: '黑话', sortOrder: 7 },
  workplace: { name: '职场', sortOrder: 8 },
  'vibe-coding': { name: 'Vibe Coding', sortOrder: 9 },
  java: { name: 'Java 面试', sortOrder: 10 },
};

function asCardArray(value: unknown): any[] {
  return Array.isArray(value) ? value.filter((card) => card && typeof card.id === 'string') : [];
}

function nullableText(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function jsonOrNull(value: unknown): string | null {
  if (value == null) return null;
  return JSON.stringify(value);
}

function nonNegativeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function hasStudyModeConfig(value: unknown): value is {
  selectedDecks?: unknown;
  dailyQuota?: Record<string, unknown>;
  dailyReviewMultiplier?: unknown;
} {
  return !!value && typeof value === 'object' && 'dailyQuota' in value;
}

async function importStudyModeLimits(config: {
  selectedDecks?: unknown;
  dailyQuota?: Record<string, unknown>;
  dailyReviewMultiplier?: unknown;
}, results: Record<string, number>): Promise<void> {
  const decks = await prisma.deck.findMany({ select: { id: true } });
  const selectedDecks = Array.isArray(config.selectedDecks)
    ? new Set(config.selectedDecks.filter((id): id is string => typeof id === 'string'))
    : new Set<string>();
  const quota = config.dailyQuota && typeof config.dailyQuota === 'object' ? config.dailyQuota : {};
  const quotaKeys = new Set(Object.keys(quota));
  const multiplier = nonNegativeNumber(config.dailyReviewMultiplier, 5);

  for (const deck of decks) {
    const selected = selectedDecks.size > 0
      ? selectedDecks.has(deck.id)
      : quotaKeys.has(deck.id);
    const newLimit = selected ? nonNegativeNumber(quota[deck.id], 0) : 0;
    const reviewLimit = newLimit * multiplier;

    await prisma.deckDailyLimit.upsert({
      where: { userId_deckId: { userId: USER_ID, deckId: deck.id } },
      update: { dailyLimit: newLimit },
      create: { userId: USER_ID, deckId: deck.id, dailyLimit: newLimit },
    });
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO "DeckDailyReviewLimit" ("userId", "deckId", "dailyReviewLimit")
        VALUES (?, ?, ?)
        ON CONFLICT("userId", "deckId") DO UPDATE SET
          "dailyReviewLimit" = excluded."dailyReviewLimit"
      `,
      USER_ID,
      deck.id,
      reviewLimit,
    );
    results.limits++;
    results.reviewLimits++;
  }
}

async function deleteCardsById(cardIds: string[], results: Record<string, number>): Promise<void> {
  if (cardIds.length === 0) return;
  await prisma.reviewLog.deleteMany({ where: { cardId: { in: cardIds } } });
  await prisma.cardProgress.deleteMany({ where: { cardId: { in: cardIds } } });
  await prisma.card.deleteMany({ where: { id: { in: cardIds } } });
  results.deletedCards += cardIds.length;
}

async function reconcileBuiltinCards(builtinCards: Record<string, unknown>, results: Record<string, number>): Promise<void> {
  const incomingDeckIds = new Set(Object.keys(builtinCards));

  for (const deckId of incomingDeckIds) {
    const meta = BUILTIN_DECKS[deckId] ?? { name: deckId, sortOrder: 50 };
    await prisma.deck.upsert({
      where: { id: deckId },
      update: { name: meta.name, type: 'builtin', sortOrder: meta.sortOrder },
      create: { id: deckId, name: meta.name, type: 'builtin', sortOrder: meta.sortOrder },
    });
    results.decks++;
  }

  for (const [deckId, rawCards] of Object.entries(builtinCards)) {
    const cards = asCardArray(rawCards);
    const incomingCardIds = new Set(cards.map((card) => card.id));
    const existingCards = await prisma.card.findMany({ where: { deckId }, select: { id: true } });
    const deletedIds = existingCards.map((card) => card.id).filter((id) => !incomingCardIds.has(id));
    await deleteCardsById(deletedIds, results);

    for (const card of cards) {
      const type = card.type === 'leetcode' || deckId === 'leetcode' ? 'leetcode' : 'qa';
      const data = {
        deckId,
        type,
        number: nullableNumber(card.number),
        title: nullableText(card.title),
        titleCn: nullableText(card.titleCn),
        question: nullableText(card.question),
        answer: nullableText(card.answer),
        description: nullableText(card.description),
        approach: nullableText(card.approach),
        difficulty: nullableText(card.difficulty),
        tags: Array.isArray(card.tags) ? JSON.stringify(card.tags) : null,
        subTopic: nullableText(card.subTopic),
        source: nullableText(card.source),
        codes: jsonOrNull(card.codes),
      };

      await prisma.card.upsert({
        where: { id: card.id },
        update: data,
        create: { id: card.id, ...data },
      });
      results.cards++;
      results.builtinCards++;
    }
  }

  const staleBuiltinDecks = await prisma.deck.findMany({
    where: { type: 'builtin', id: { notIn: Array.from(incomingDeckIds) } },
    select: { id: true },
  });
  for (const deck of staleBuiltinDecks) {
    const cards = await prisma.card.findMany({ where: { deckId: deck.id }, select: { id: true } });
    await deleteCardsById(cards.map((card) => card.id), results);
    results.staleBuiltinDecks++;
  }
}

export async function migrationRoutes(app: FastifyInstance) {
  app.post('/api/migrations/import-local-data', async (req, reply) => {
    const body = req.body as any;
    await ensureStatsSnapshotStorage();

    const results: Record<string, number> = { decks: 0, cards: 0, builtinCards: 0, progress: 0, limits: 0, reviewLimits: 0, logs: 0, deletedCards: 0, deletedDecks: 0, staleBuiltinDecks: 0, skippedLimits: 0, skippedReviewLimits: 0 };

    // Keep backend card catalog aligned with the cards the frontend can actually show.
    if (body.builtinCards && typeof body.builtinCards === 'object') {
      await reconcileBuiltinCards(body.builtinCards, results);
    }

    // Import custom Decks
    if (body.customDecks) {
      const incomingDeckIds = new Set(body.customDecks.map((d: any) => d.id));
      const existingCustomDecks = await prisma.deck.findMany({ where: { type: 'custom' }, select: { id: true } });
      for (const deck of existingCustomDecks) {
        if (incomingDeckIds.has(deck.id)) continue;
        const cards = await prisma.card.findMany({ where: { deckId: deck.id }, select: { id: true } });
        const cardIds = cards.map((card) => card.id);
        if (cardIds.length > 0) {
          await prisma.reviewLog.deleteMany({ where: { cardId: { in: cardIds } } });
          await prisma.cardProgress.deleteMany({ where: { cardId: { in: cardIds } } });
          await prisma.card.deleteMany({ where: { id: { in: cardIds } } });
          results.deletedCards += cardIds.length;
        }
        await prisma.deckDailyLimit.deleteMany({ where: { userId: USER_ID, deckId: deck.id } });
        await prisma.$executeRawUnsafe('DELETE FROM "DeckDailyReviewLimit" WHERE userId = ? AND deckId = ?', USER_ID, deck.id);
        await prisma.deck.delete({ where: { id: deck.id } }).catch(() => {});
        results.deletedDecks++;
      }

      for (const d of body.customDecks) {
        await prisma.deck.upsert({
          where: { id: d.id },
          update: { name: d.name, type: 'custom' },
          create: { id: d.id, name: d.name, type: 'custom', sortOrder: 100 + (body.customDecks.indexOf(d)) },
        });
        results.decks++;
      }
    }

    // Import custom Cards
    if (body.customCards) {
      for (const [deckId, cards] of Object.entries(body.customCards)) {
        const incomingCardIds = new Set((cards as any[]).map((card) => card.id).filter(Boolean));
        const existingCards = await prisma.card.findMany({ where: { deckId }, select: { id: true } });
        const deletedIds = existingCards.map((card) => card.id).filter((id) => !incomingCardIds.has(id));
        if (deletedIds.length > 0) {
          await prisma.reviewLog.deleteMany({ where: { cardId: { in: deletedIds } } });
          await prisma.cardProgress.deleteMany({ where: { cardId: { in: deletedIds } } });
          await prisma.card.deleteMany({ where: { id: { in: deletedIds } } });
          results.deletedCards += deletedIds.length;
        }

        for (const card of cards as any[]) {
          await prisma.card.upsert({
            where: { id: card.id },
            update: { deckId, question: card.question, answer: card.answer, difficulty: card.difficulty, tags: card.tags ? JSON.stringify(card.tags) : null },
            create: { id: card.id, deckId, type: 'qa', question: card.question, answer: card.answer, difficulty: card.difficulty || null, tags: card.tags ? JSON.stringify(card.tags) : null },
          });
          results.cards++;
        }
      }
    }

    // Import Progress
    if (body.progress) {
      for (const [key, prog] of Object.entries(body.progress)) {
        const p = prog as any;
        if (p.sm2) {
          for (const [cardId, sm2] of Object.entries(p.sm2)) {
            const card = await prisma.card.findUnique({ where: { id: cardId }, select: { id: true } });
            if (!card) continue;
            const s = sm2 as any;
            await prisma.cardProgress.upsert({
              where: { userId_cardId: { userId: USER_ID, cardId } },
              update: { state: s.state, easeFactor: s.easeFactor, intervalDays: s.interval || s.intervalDays, repetitions: s.repetitions, lapses: s.lapses, nextReview: new Date(s.nextReview || Date.now()), lastReviewedAt: s.lastReviewedAt ? new Date(s.lastReviewedAt) : null },
              create: { userId: USER_ID, cardId, state: s.state || 'new', easeFactor: s.easeFactor || 2.5, intervalDays: s.interval || s.intervalDays || 0, repetitions: s.repetitions || 0, lapses: s.lapses || 0, nextReview: new Date(s.nextReview || Date.now()), lastReviewedAt: s.lastReviewedAt ? new Date(s.lastReviewedAt) : null },
            });
            results.progress++;
          }
        }
      }
    }

    // Import Daily Limits. Learning mode is the source of truth when present.
    if (hasStudyModeConfig(body.studyModeConfig)) {
      await importStudyModeLimits(body.studyModeConfig, results);
    } else if (body.moduleDailyLimits) {
      for (const [deckId, limit] of Object.entries(body.moduleDailyLimits)) {
        const deck = await prisma.deck.findUnique({ where: { id: deckId }, select: { id: true } });
        if (!deck) {
          results.skippedLimits++;
          continue;
        }
        await prisma.deckDailyLimit.upsert({
          where: { userId_deckId: { userId: USER_ID, deckId } },
          update: { dailyLimit: limit as number },
          create: { userId: USER_ID, deckId, dailyLimit: limit as number },
        });
        results.limits++;
      }
    }

    // Import Daily Review Limits
    if (!hasStudyModeConfig(body.studyModeConfig) && body.moduleDailyReviewLimits) {
      for (const [deckId, limit] of Object.entries(body.moduleDailyReviewLimits)) {
        const deck = await prisma.deck.findUnique({ where: { id: deckId }, select: { id: true } });
        if (!deck) {
          results.skippedReviewLimits++;
          continue;
        }
        await prisma.$executeRawUnsafe(
          `
            INSERT INTO "DeckDailyReviewLimit" ("userId", "deckId", "dailyReviewLimit")
            VALUES (?, ?, ?)
            ON CONFLICT("userId", "deckId") DO UPDATE SET
              "dailyReviewLimit" = excluded."dailyReviewLimit"
          `,
          USER_ID,
          deckId,
          Math.max(0, Number(limit) || 0),
        );
        results.reviewLimits++;
      }
    }

    // Import Review Logs
    if (body.reviewLogs) {
      for (const [key, logs] of Object.entries(body.reviewLogs)) {
        for (const log of logs as any[]) {
          if (log.cardId) {
            const card = await prisma.card.findUnique({ where: { id: log.cardId }, select: { id: true } });
            if (!card) continue;
            await prisma.reviewLog.upsert({
              where: { id: log.id || `mig-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
              update: {},
              create: {
                id: log.id || `mig-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                userId: USER_ID, cardId: log.cardId,
                reviewedAt: new Date(log.reviewedAt || Date.now()),
                rating: log.rating || 4,
                stateBefore: log.stateBefore || 'new', stateAfter: log.stateAfter || 'review',
                intervalBefore: log.intervalBefore || 0, intervalAfter: log.intervalAfter || 1,
                easeBefore: log.easeBefore || 2.5, easeAfter: log.easeAfter || 2.5,
                elapsedDays: log.elapsedDays || 0, scheduledDays: log.scheduledDays || 0,
              },
            });
            results.logs++;
          }
        }
      }
    }

    const snapshot = await rebuildStatsSnapshot(USER_ID);
    return { success: true, results, snapshot };
  });
}
