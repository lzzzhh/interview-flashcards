// backend/src/routes/reviews.ts — 评分 + 学习统计 API
import { FastifyInstance } from 'fastify';
import prisma from '../db/prisma';

const USER_ID = 'demo-user';

export async function reviewRoutes(app: FastifyInstance) {
  // POST /api/reviews — 评分（atomic: review log + progress update）
  app.post('/api/reviews', async (req, reply) => {
    const { cardId, rating } = req.body as { cardId: string; rating: number };
    if (!cardId || rating == null) {
      return reply.status(400).send({ error: 'cardId and rating required' });
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      const old = await tx.cardProgress.findUnique({
        where: { userId_cardId: { userId: USER_ID, cardId } },
      });

      // Calculate new SM2 state
      const oldState: any = old || {
        state: 'new', easeFactor: 2.5, intervalDays: 0,
        repetitions: 0, lapses: 0, nextReview: now,
      };
      const newSm2 = calculateSM2(oldState, rating);

      // Write review log
      await tx.reviewLog.create({
        data: {
          id: `rl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId: USER_ID,
          cardId,
          rating,
          reviewedAt: now,
          stateBefore: oldState.state,
          stateAfter: newSm2.state,
          easeBefore: oldState.easeFactor,
          easeAfter: newSm2.easeFactor,
          intervalBefore: oldState.intervalDays,
          intervalAfter: newSm2.intervalDays,
          repetitionsBefore: old?.repetitions ?? 0,
          repetitionsAfter: newSm2.repetitions,
          lapsesBefore: old?.lapses ?? 0,
          lapsesAfter: newSm2.lapses,
          nextReviewBefore: old?.nextReview,
          nextReviewAfter: newSm2.nextReview,
          elapsedDays: old?.lastReviewedAt
            ? Math.round((now.getTime() - new Date(old.lastReviewedAt).getTime()) / 86400000 * 10) / 10
            : 0,
          scheduledDays: newSm2.intervalDays,
        },
      });

      // Upsert progress
      await tx.cardProgress.upsert({
        where: { userId_cardId: { userId: USER_ID, cardId } },
        update: {
          state: newSm2.state,
          easeFactor: newSm2.easeFactor,
          intervalDays: newSm2.intervalDays,
          repetitions: newSm2.repetitions,
          lapses: newSm2.lapses,
          nextReview: newSm2.nextReview,
          lastReviewedAt: now,
        },
        create: {
          userId: USER_ID,
          cardId,
          state: newSm2.state,
          easeFactor: newSm2.easeFactor,
          intervalDays: newSm2.intervalDays,
          repetitions: newSm2.repetitions,
          lapses: newSm2.lapses,
          nextReview: newSm2.nextReview,
          lastReviewedAt: now,
        },
      });
    });

    return { ok: true };
  });

  // GET /api/stats/today?timezone=Australia/Sydney
  app.get('/api/stats/today', async (req) => {
    const tz = (req.query as any).timezone || 'Australia/Sydney';
    const today = getDateInTZ(new Date(), tz);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const logs = await prisma.reviewLog.findMany({
      where: {
        userId: USER_ID,
        reviewedAt: { gte: today, lt: tomorrow },
      },
      include: { card: { select: { id: true, titleCn: true, title: true, question: true, deckId: true, tags: true } } },
      orderBy: { reviewedAt: 'desc' },
    });

    const correctCount = logs.filter(l => l.rating >= 3).length;
    const uniqueCardIds = new Set(logs.map(l => l.cardId));

    return {
      date: today.toISOString().slice(0, 10),
      reviewCount: logs.length,
      uniqueCardCount: uniqueCardIds.size,
      correctCount,
      wrongCount: logs.length - correctCount,
      accuracy: logs.length > 0 ? Math.round((correctCount / logs.length) * 10000) / 10000 : 0,
      reviewedCards: logs.map(l => ({
        cardId: l.cardId,
        title: (l.card.titleCn || l.card.title || l.card.question || '').slice(0, 60),
        deckId: l.card.deckId,
        rating: l.rating,
        reviewedAt: l.reviewedAt.toISOString(),
      })),
    };
  });

  // GET /api/stats/streak?timezone=Australia/Sydney
  app.get('/api/stats/streak', async (req) => {
    const tz = (req.query as any).timezone || 'Australia/Sydney';
    const dates = await prisma.reviewLog.findMany({
      where: { userId: USER_ID },
      select: { reviewedAt: true },
      distinct: ['reviewedAt'],
      orderBy: { reviewedAt: 'desc' },
    });

    const dateSet = new Set(dates.map(d => {
      const localDate = getDateInTZ(d.reviewedAt, tz);
      return localDate.toISOString().slice(0, 10);
    }));

    let streak = 0;
    const today = getDateInTZ(new Date(), tz);
    const check = new Date(today);

    while (true) {
      const key = check.toISOString().slice(0, 10);
      if (dateSet.has(key)) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else {
        break;
      }
    }

    // Check if today has reviews (for streak count)
    const todayKey = today.toISOString().slice(0, 10);
    if (!dateSet.has(todayKey)) streak = 0;

    return { streak };
  });
}

// ── SM2 calculation ──

function calculateSM2(old: any, rating: number) {
  let { easeFactor, intervalDays, repetitions, lapses, state } = old;
  if (rating < 3) {
    lapses = (lapses || 0) + 1;
    repetitions = 0;
    intervalDays = 1;
    easeFactor = Math.max(1.3, (easeFactor || 2.5) - 0.2);
    state = 'relearning';
  } else {
    repetitions = (repetitions || 0) + 1;
    easeFactor = (easeFactor || 2.5) + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    easeFactor = Math.max(1.3, easeFactor);
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
    state = repetitions === 1 ? 'learning' : 'review';
  }
  const nextReview = new Date(Date.now() + intervalDays * 86400000);
  return { state, easeFactor, intervalDays, repetitions, lapses, nextReview };
}

function getDateInTZ(date: Date, tz: string): Date {
  const s = date.toLocaleString('en-CA', { timeZone: tz }).slice(0, 10);
  return new Date(s + 'T00:00:00');
}
