import { FastifyInstance } from 'fastify';
import prisma from '../db/prisma';

export async function dashboardRoutes(app: FastifyInstance) {
  const USER_ID = 'demo-user';

  app.get('/api/dashboard', async () => {
    // 批量获取所有统计数据，避免 N+1
    const [totalCardsResult, allProgress] = await Promise.all([
      prisma.$queryRawUnsafe<[{ count: number }]>(
        'SELECT COUNT(*) as count FROM Card',
      ),
      prisma.cardProgress.findMany({
        where: { userId: USER_ID },
        select: { cardId: true, state: true, nextReview: true },
      }),
    ]);

    const totalCards = Number(totalCardsResult[0]?.count ?? 0);

    const now = new Date();
    const studiedIds = new Set(allProgress.filter(p => p.state !== 'new').map(p => p.cardId));
    const newCount = Math.max(0, totalCards - studiedIds.size);
    const todayDue = allProgress.filter(p => p.state !== 'new' && p.nextReview <= now).length;
    const learningCount = allProgress.filter(p => p.state === 'learning').length;

    // 推荐：返回到期复习最多的 3 张卡片
    const dueCardIds = allProgress
      .filter(p => p.state !== 'new' && p.nextReview <= now)
      .slice(0, 3)
      .map(p => p.cardId);

    const recCards = dueCardIds.length > 0
      ? await prisma.card.findMany({
          where: { id: { in: dueCardIds } },
          take: 3,
          include: { deck: true },
        })
      : [];

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
