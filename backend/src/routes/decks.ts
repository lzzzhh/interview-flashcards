import { FastifyInstance } from 'fastify';
import prisma from '../db/prisma';

export async function deckRoutes(app: FastifyInstance) {
  const USER_ID = 'demo-user';

  // GET /api/decks — 所有牌组及统计
  app.get('/api/decks', async () => {
    const decks = await prisma.deck.findMany({ orderBy: { sortOrder: 'asc' } });
    const result = [];
    for (const d of decks) {
      const total = await prisma.card.count({ where: { deckId: d.id } });
      const limit = await prisma.deckDailyLimit.findUnique({ where: { userId_deckId: { userId: USER_ID, deckId: d.id } } });
      const progressCards = await prisma.cardProgress.findMany({ where: { card: { deckId: d.id }, userId: USER_ID } });

      const studiedCount = progressCards.filter(p => p.state !== 'new').length;
      const newCount = total - studiedCount;
      const dueCount = progressCards.filter(p => p.state !== 'new' && p.nextReview <= new Date()).length;
      const learningCount = progressCards.filter(p => p.state === 'learning').length;
      const reviewCount = progressCards.filter(p => p.state === 'review').length;
      const relearningCount = progressCards.filter(p => p.state === 'relearning').length;
      const favoritedCount = progressCards.filter(p => p.favorited).length;

      result.push({
        id: d.id,
        name: d.name,
        type: d.type,
        sortOrder: d.sortOrder,
        stats: {
          total,
          newCount: Math.max(0, newCount),
          learningCount,
          reviewCount,
          relearningCount,
          dueCount,
          favoritedCount,
          dailyLimit: limit?.dailyLimit || 20,
        },
      });
    }
    return { decks: result };
  });

  // GET /api/decks/:deckId/cards
  app.get('/api/decks/:deckId/cards', async (req) => {
    const { deckId } = req.params as { deckId: string };
    const query = req.query as { limit?: string; offset?: string; search?: string };
    const limit = parseInt(query.limit || '50', 10);
    const offset = parseInt(query.offset || '0', 10);
    const where: any = { deckId };
    if (query.search) where.OR = [
      { title: { contains: query.search } },
      { titleCn: { contains: query.search } },
      { question: { contains: query.search } },
    ];
    const [cards, total] = await Promise.all([
      prisma.card.findMany({ where, skip: offset, take: limit }),
      prisma.card.count({ where }),
    ]);
    return { cards, total, limit, offset };
  });

  // GET /api/decks/:deckId/stats
  app.get('/api/decks/:deckId/stats', async (req) => {
    const { deckId } = req.params as { deckId: string };
    const total = await prisma.card.count({ where: { deckId } });
    const limit = await prisma.deckDailyLimit.findUnique({ where: { userId_deckId: { userId: USER_ID, deckId } } });
    const progressCards = await prisma.cardProgress.findMany({ where: { card: { deckId }, userId: USER_ID } });
    const studiedCount = progressCards.filter(p => p.state !== 'new').length;
    const newCount = Math.max(0, total - studiedCount);
    const dueCount = progressCards.filter(p => p.state !== 'new' && p.nextReview <= new Date()).length;
    return {
      deckId, total,
      newCount, dueCount,
      learningCount: progressCards.filter(p => p.state === 'learning').length,
      reviewCount: progressCards.filter(p => p.state === 'review').length,
      relearningCount: progressCards.filter(p => p.state === 'relearning').length,
      dailyLimit: limit?.dailyLimit || 20,
    };
  });
}
