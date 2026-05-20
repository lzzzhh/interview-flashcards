import { FastifyInstance } from 'fastify';
import prisma from '../db/prisma';
import { toCardDTO } from '../modules/cards/card.mapper';

const USER_ID = 'demo-user';

export async function studyRoutes(app: FastifyInstance) {
  app.get('/api/study/queue', async (req) => {
    const { deckId, mode } = req.query as { deckId?: string; mode?: string };
    if (!deckId || !mode) return { cards: [], total: 0 };

    if (mode === 'review') {
      const cards = await prisma.card.findMany({
        where: {
          deckId,
          progress: { some: { userId: USER_ID, state: { not: 'new' }, nextReview: { lte: new Date() } } },
        },
        include: { progress: { where: { userId: USER_ID } } },
        orderBy: { id: 'asc' },
      });
      return { cards: cards.map(toCardDTO), total: cards.length, mode: 'review' };
    }

    if (mode === 'new') {
      const limit = await prisma.deckDailyLimit.findUnique({
        where: { userId_deckId: { userId: USER_ID, deckId } },
      });
      const dailyLimit = limit?.dailyLimit || 20;

      const studiedIds = (await prisma.cardProgress.findMany({
        where: { userId: USER_ID, card: { deckId }, state: { not: 'new' } },
        select: { cardId: true },
      })).map(p => p.cardId);

      const cards = await prisma.card.findMany({
        where: { deckId, id: { notIn: studiedIds } },
        include: { progress: { where: { userId: USER_ID } } },
        take: dailyLimit,
        orderBy: { id: 'asc' },
      });
      return { cards: cards.map(toCardDTO), total: cards.length, mode: 'new', dailyLimit };
    }

    return { cards: [], total: 0 };
  });
}
