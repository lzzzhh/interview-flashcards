import { FastifyInstance } from 'fastify';
import prisma from '../db/prisma';

const USER_ID = 'demo-user';

export async function studyRoutes(app: FastifyInstance) {
  app.get('/api/study/queue', async (req) => {
    const { deckId, mode } = req.query as { deckId?: string; mode?: string };
    if (!deckId || !mode) return { cards: [], total: 0 };

    if (mode === 'review') {
      // 到期卡片（state != new 且 nextReview <= now）
      const cards = await prisma.card.findMany({
        where: {
          deckId,
          progress: {
            some: {
              userId: USER_ID,
              state: { not: 'new' },
              nextReview: { lte: new Date() },
            },
          },
        },
        orderBy: { id: 'asc' },
      });
      return { cards, total: cards.length, mode: 'review' };
    }

    if (mode === 'new') {
      // 新卡片：没有 progress 或 progress.state = new
      const limit = await prisma.deckDailyLimit.findUnique({
        where: { userId_deckId: { userId: USER_ID, deckId } },
      });
      const dailyLimit = limit?.dailyLimit || 20;

      const progressedCardIds = (await prisma.cardProgress.findMany({
        where: { userId: USER_ID, card: { deckId } },
        select: { cardId: true },
      })).map(p => p.cardId);

      const cards = await prisma.card.findMany({
        where: { deckId, id: { notIn: progressedCardIds } },
        take: dailyLimit,
        orderBy: { id: 'asc' },
      });
      return { cards, total: cards.length, mode: 'new', dailyLimit };
    }

    return { cards: [], total: 0 };
  });
}
