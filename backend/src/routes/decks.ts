import { FastifyInstance } from 'fastify';
import prisma from '../db/prisma';
import { toCardDTO } from '../modules/cards/card.mapper';

export async function deckRoutes(app: FastifyInstance) {
  const USER_ID = 'demo-user';

  // GET /api/decks — 所有牌组及统计
  app.get('/api/decks', async () => {
    const decks = await prisma.deck.findMany({ orderBy: { sortOrder: 'asc' } });

    if (decks.length === 0) return { decks: [] };

    // 批量查询，一次获取所有数据
    const deckIds = decks.map(d => d.id);
    const [cardCounts, limits, allProgress] = await Promise.all([
      // 每个 deck 的卡片数量
      prisma.$queryRawUnsafe<{ deckId: string; cnt: number }[]>(
        `SELECT deckId, COUNT(*) as cnt FROM Card WHERE deckId IN (${deckIds.map(() => '?').join(',')}) GROUP BY deckId`,
        ...deckIds,
      ),
      // 每日限制
      prisma.deckDailyLimit.findMany({
        where: { userId: USER_ID, deckId: { in: deckIds } },
      }),
      // 所有进度
      prisma.cardProgress.findMany({
        where: { userId: USER_ID, card: { deckId: { in: deckIds } } },
        select: { cardId: true, state: true, nextReview: true, favorited: true },
      }),
    ]);

    // 构建查询结果索引
    const countMap = new Map<string, number>();
    for (const row of cardCounts) countMap.set(row.deckId, Number(row.cnt));

    const limitMap = new Map<string, number>();
    for (const l of limits) limitMap.set(l.deckId, l.dailyLimit);

    const now = new Date();
    const result = decks.map(d => {
      const total = countMap.get(d.id) || 0;
      const dailyLimit = limitMap.get(d.id) || 20;

      // 注意：allProgress 包含了所有 deck 的数据，这里不做二次过滤
      // 因为 cardProgress query 已通过 card.deckId { in: deckIds } 过滤
      // 但返回的是所有 deck 的混合数据，我们需要知道每个 progress 属于哪个 deck
      // 最简单的方式：通过 cardId 的 deck 归属来判断
      // 但这样又回到了 N+1...
      //
      // 更优方案：用 JOIN 查 card.deckId
      return {
        id: d.id,
        name: d.name,
        type: d.type,
        sortOrder: d.sortOrder,
        stats: {
          total,
          newCount: total, // 临时值，下面修正
          learningCount: 0,
          reviewCount: 0,
          relearningCount: 0,
          dueCount: 0,
          favoritedCount: 0,
          dailyLimit,
        },
      };
    });

    // 用 JOIN 一次性计算每个 deck 的统计
    const statsRows = await prisma.$queryRawUnsafe<{
      deckId: string;
      newCnt: string;
      learningCnt: string;
      reviewCnt: string;
      relearningCnt: string;
      dueCnt: string;
      favCnt: string;
    }[]>(
      `SELECT
        c.deckId as deckId,
        SUM(CASE WHEN cp.cardId IS NULL THEN 1 ELSE 0 END) as newCnt,
        SUM(CASE WHEN cp.state = 'learning' THEN 1 ELSE 0 END) as learningCnt,
        SUM(CASE WHEN cp.state = 'review' THEN 1 ELSE 0 END) as reviewCnt,
        SUM(CASE WHEN cp.state = 'relearning' THEN 1 ELSE 0 END) as relearningCnt,
        SUM(CASE WHEN cp.state != 'new' AND cp.nextReview <= ? THEN 1 ELSE 0 END) as dueCnt,
        SUM(CASE WHEN cp.favorited = 1 THEN 1 ELSE 0 END) as favCnt
      FROM Card c
      LEFT JOIN CardProgress cp ON c.id = cp.cardId AND cp.userId = ?
      WHERE c.deckId IN (${deckIds.map(() => '?').join(',')})
      GROUP BY c.deckId`,
      now.toISOString(), USER_ID, ...deckIds,
    );

    // 应用统计数据
    const statsMap = new Map<string, any>();
    for (const row of statsRows) statsMap.set(row.deckId, row);

    for (const r of result) {
      const s = statsMap.get(r.id);
      if (s) {
        r.stats.newCount = Number(s.newCnt);
        r.stats.learningCount = Number(s.learningCnt);
        r.stats.reviewCount = Number(s.reviewCnt);
        r.stats.relearningCount = Number(s.relearningCnt);
        r.stats.dueCount = Number(s.dueCnt);
        r.stats.favoritedCount = Number(s.favCnt);
      }
    }

    return { decks: result };
  });

  // GET /api/decks/:deckId/cards
  app.get('/api/decks/:deckId/cards', async (req) => {
    const { deckId } = req.params as { deckId: string };
    const query = req.query as { limit?: string; offset?: string; search?: string; includeProgress?: string };
    const limit = parseInt(query.limit || '50', 10);
    const offset = parseInt(query.offset || '0', 10);
    const includeProgress = query.includeProgress !== 'false';
    const where: any = { deckId };
    if (query.search) where.OR = [
      { title: { contains: query.search } },
      { titleCn: { contains: query.search } },
      { question: { contains: query.search } },
    ];
    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where, skip: offset, take: limit,
        include: includeProgress ? { progress: { where: { userId: USER_ID } } } : undefined,
      }),
      prisma.card.count({ where }),
    ]);
    return { cards: cards.map(toCardDTO), total, limit, offset };
  });

  // GET /api/decks/:deckId/stats
  app.get('/api/decks/:deckId/stats', async (req) => {
    const { deckId } = req.params as { deckId: string };

    const [total, statsRow, limit] = await Promise.all([
      prisma.card.count({ where: { deckId } }),
      prisma.$queryRawUnsafe<{
        newCnt: string; learningCnt: string; reviewCnt: string; relearningCnt: string; dueCnt: string;
      }[]>(
        `SELECT
          SUM(CASE WHEN cp.cardId IS NULL THEN 1 ELSE 0 END) as newCnt,
          SUM(CASE WHEN cp.state = 'learning' THEN 1 ELSE 0 END) as learningCnt,
          SUM(CASE WHEN cp.state = 'review' THEN 1 ELSE 0 END) as reviewCnt,
          SUM(CASE WHEN cp.state = 'relearning' THEN 1 ELSE 0 END) as relearningCnt,
          SUM(CASE WHEN cp.state != 'new' AND cp.nextReview <= ? THEN 1 ELSE 0 END) as dueCnt
        FROM Card c
        LEFT JOIN CardProgress cp ON c.id = cp.cardId AND cp.userId = ?
        WHERE c.deckId = ?`,
        new Date().toISOString(), USER_ID, deckId,
      ),
      prisma.deckDailyLimit.findUnique({ where: { userId_deckId: { userId: USER_ID, deckId } } }),
    ]);

    const s = statsRow[0] || { newCnt: '0', learningCnt: '0', reviewCnt: '0', relearningCnt: '0', dueCnt: '0' };
    return {
      deckId, total,
      newCount: Number(s.newCnt),
      dueCount: Number(s.dueCnt),
      learningCount: Number(s.learningCnt),
      reviewCount: Number(s.reviewCnt),
      relearningCount: Number(s.relearningCnt),
      dailyLimit: limit?.dailyLimit || 20,
    };
  });
}
