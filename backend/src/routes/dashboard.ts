import { FastifyInstance } from 'fastify';
import prisma from '../db/prisma';
import { rebuildStatsSnapshot } from '../services/stats-snapshot';

export async function dashboardRoutes(app: FastifyInstance) {
  const USER_ID = 'demo-user';

  app.get('/api/dashboard', async () => {
    const snapshot = await rebuildStatsSnapshot(USER_ID);
    // 批量获取所有统计数据，避免 N+1
    const [allProgress] = await Promise.all([
      prisma.cardProgress.findMany({
        where: { userId: USER_ID },
        select: { cardId: true, state: true, nextReview: true },
      }),
    ]);

    const now = new Date();
    const reviewStates = new Set(['learning', 'review', 'relearning']);

    // 推荐：返回到期复习最多的 3 张卡片
    const dueCardIds = allProgress
      .filter(p => reviewStates.has(p.state) && p.nextReview <= now)
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
      totalCards: snapshot.global.totalCards,
      todayDue: snapshot.global.todayReviewRemaining,
      todayNewAllowance: snapshot.global.todayNewRemaining,
      learningCount: snapshot.global.learningCards,
      recommended,
    };
  });
}
