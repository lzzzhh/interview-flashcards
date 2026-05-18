import { FastifyInstance } from 'fastify';
import prisma from '../db/prisma';

export async function dashboardRoutes(app: FastifyInstance) {
  const USER_ID = 'demo-user';

  app.get('/api/dashboard', async () => {
    // 所有 decks 统计
    const decks = await prisma.deck.findMany();
    let todayDue = 0;
    let totalCards = 0;
    let learningCount = 0;
    let newCount = 0;

    for (const d of decks) {
      const total = await prisma.card.count({ where: { deckId: d.id } });
      totalCards += total;
      const progressCards = await prisma.cardProgress.findMany({ where: { card: { deckId: d.id }, userId: USER_ID } });
      newCount += Math.max(0, total - progressCards.length);
      todayDue += progressCards.filter(p => p.state !== 'new' && p.nextReview <= new Date()).length;
      learningCount += progressCards.filter(p => p.state === 'learning').length;
    }

    // 简单推荐：返回待复习最多的 3 个模块
    const recommendations = await prisma.cardProgress.groupBy({
      by: ['cardId'],
      where: { userId: USER_ID, state: { not: 'new' }, nextReview: { lte: new Date() } },
    });
    const recCards = await prisma.card.findMany({
      where: { id: { in: recommendations.map(r => r.cardId) } },
      take: 3,
      include: { deck: true },
    });
    const recommended = recCards.map(c => ({
      cardId: c.id,
      deckId: c.deckId,
      deckName: c.deck.name,
      title: c.title || c.titleCn || c.question || c.id,
      number: c.number,
    }));

    return {
      totalCards,
      todayDue,
      todayNewAllowance: newCount,
      learningCount,
      recommended,
    };
  });
}
