import { FastifyInstance } from 'fastify';
import prisma from '../db/prisma';

const USER_ID = 'demo-user';

export async function migrationRoutes(app: FastifyInstance) {
  app.post('/api/migrations/import-local-data', async (req, reply) => {
    const body = req.body as any;

    const results: Record<string, number> = { decks: 0, cards: 0, progress: 0, limits: 0, logs: 0 };

    // Import custom Decks
    if (body.customDecks) {
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

    // Import Daily Limits
    if (body.moduleDailyLimits) {
      for (const [deckId, limit] of Object.entries(body.moduleDailyLimits)) {
        await prisma.deckDailyLimit.upsert({
          where: { userId_deckId: { userId: USER_ID, deckId } },
          update: { dailyLimit: limit as number },
          create: { userId: USER_ID, deckId, dailyLimit: limit as number },
        });
        results.limits++;
      }
    }

    // Import Review Logs
    if (body.reviewLogs) {
      for (const [key, logs] of Object.entries(body.reviewLogs)) {
        for (const log of logs as any[]) {
          if (log.cardId) {
            await prisma.reviewLog.create({
              data: {
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

    return { success: true, results };
  });
}
