// backend/src/routes/stats.ts — 学习统计 API（从统计投影表读取）
import { FastifyInstance } from 'fastify';
import prisma from '../db/prisma';
import { rebuildStatsSnapshot } from '../services/stats-snapshot';

const USER_ID = 'demo-user';

export async function statsRoutes(app: FastifyInstance) {
  app.get('/api/stats/snapshot', async (req) => {
    const tz = (req.query as any).timezone || 'Australia/Sydney';
    return rebuildStatsSnapshot(USER_ID, tz);
  });

  app.post('/api/stats/rebuild', async (req) => {
    const tz = (req.body as any)?.timezone || 'Australia/Sydney';
    return rebuildStatsSnapshot(USER_ID, tz);
  });

  /** Directly upsert daily limits into SQLite tables for stats snapshot */
  app.post('/api/stats/set-deck-limits', async (req) => {
    const { limits } = req.body as any;
    if (!limits || typeof limits !== 'object') {
      return { error: 'limits object required' };
    }
    for (const [deckId, config] of Object.entries(limits)) {
      const cfg = config as any;
      if (typeof cfg.newLimit === 'number') {
        await prisma.deckDailyLimit.upsert({
          where: { userId_deckId: { userId: USER_ID, deckId } },
          update: { dailyLimit: cfg.newLimit },
          create: { userId: USER_ID, deckId, dailyLimit: cfg.newLimit },
        });
      }
      if (typeof cfg.reviewLimit === 'number') {
        await prisma.$executeRawUnsafe(
          'INSERT INTO "DeckDailyReviewLimit" ("userId", "deckId", "dailyReviewLimit") VALUES (?, ?, ?) ON CONFLICT("userId", "deckId") DO UPDATE SET "dailyReviewLimit" = excluded."dailyReviewLimit"',
          USER_ID, deckId, cfg.reviewLimit,
        );
      }
    }
    return { ok: true };
  });

  // Backward-compatible shape for older callers.
  app.get('/api/stats/overview', async (req) => {
    const tz = (req.query as any).timezone || 'Australia/Sydney';
    const snapshot = await rebuildStatsSnapshot(USER_ID, tz);
    const global = snapshot.global;
    return {
      totalCards: global.totalCards,
      dueCards: global.dueCards,
      streak: global.streak,
      stageCounts: {
        new: global.newCards,
        learning: global.learningCards,
        review: global.reviewCards,
        relearning: global.relearningCards,
      },
      masteredCards: global.masteredCards,
      masteryRate: global.masteryRate,
      today: {
        reviewCount: global.todayReviewCount,
        uniqueCardCount: global.todayStudiedCards,
        correctCount: global.todayCorrectCount,
        wrongCount: global.todayWrongCount,
        correctRate: global.correctRate,
      },
      moduleStats: snapshot.decks
        .filter((deck) => deck.totalCards > 0)
        .map((deck) => ({
          key: deck.scopeId,
          label: deck.label,
          total: deck.totalCards,
          started: deck.startedCards,
        })),
    };
  });
}
