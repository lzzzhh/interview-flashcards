import { FastifyInstance } from 'fastify';
import prisma from '../db/prisma';
import { scheduleReview, createDefaultSM2 } from '../services/sm2';

const USER_ID = 'demo-user';

export async function reviewRoutes(app: FastifyInstance) {
  app.post('/api/reviews', async (req, reply) => {
    const { cardId, rating } = req.body as { cardId: string; rating: number };
    if (!cardId || rating < 1 || rating > 5) {
      return reply.status(400).send({ error: 'Invalid cardId or rating (1-5)' });
    }

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return reply.status(404).send({ error: 'Card not found' });

    // 读取或创建 progress
    let progress = await prisma.cardProgress.findUnique({
      where: { userId_cardId: { userId: USER_ID, cardId } },
    });

    const sm2Record = progress
      ? { state: progress.state, easeFactor: progress.easeFactor, intervalDays: progress.intervalDays, repetitions: progress.repetitions, lapses: progress.lapses, nextReview: progress.nextReview, lastReviewedAt: progress.lastReviewedAt || undefined }
      : createDefaultSM2();

    const result = scheduleReview(cardId, sm2Record, rating);

    // 事务：progress + log 原子性
    const [updated] = await prisma.$transaction([
      prisma.cardProgress.upsert({
        where: { userId_cardId: { userId: USER_ID, cardId } },
        update: {
          state: result.sm2.state, easeFactor: result.sm2.easeFactor,
          intervalDays: result.sm2.intervalDays, repetitions: result.sm2.repetitions,
          lapses: result.sm2.lapses, nextReview: result.sm2.nextReview,
          lastReviewedAt: result.sm2.lastReviewedAt || new Date(),
        },
        create: {
          userId: USER_ID, cardId,
          state: result.sm2.state, easeFactor: result.sm2.easeFactor,
          intervalDays: result.sm2.intervalDays, repetitions: result.sm2.repetitions,
          lapses: result.sm2.lapses, nextReview: result.sm2.nextReview,
          lastReviewedAt: result.sm2.lastReviewedAt || new Date(),
        },
      }),
      prisma.reviewLog.create({
        data: {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId: USER_ID, cardId,
          reviewedAt: result.log.reviewedAt, rating: result.log.rating,
          stateBefore: result.log.stateBefore, stateAfter: result.log.stateAfter,
          intervalBefore: result.log.intervalBefore, intervalAfter: result.log.intervalAfter,
          easeBefore: result.log.easeBefore, easeAfter: result.log.easeAfter,
          elapsedDays: result.log.elapsedDays, scheduledDays: result.log.scheduledDays,
        },
      }),
    ]);

    return {
      cardId,
      progress: updated ? {
        state: updated.state, easeFactor: updated.easeFactor,
        intervalDays: updated.intervalDays, repetitions: updated.repetitions,
        lapses: updated.lapses, nextReview: updated.nextReview,
      } : null,
    };
  });
}
