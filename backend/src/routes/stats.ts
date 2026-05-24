// backend/src/routes/stats.ts — 学习统计 API（纯后端计算）
import { FastifyInstance } from 'fastify';
import prisma from '../db/prisma';

const USER_ID = 'demo-user';
const BUILTIN_DECK_LABELS: Record<string, string> = {
  leetcode: '力扣', statistics: '统计学', 'machine-learning': '机器学习',
  'deep-learning': '深度学习', llm: '大模型', agent: 'Agent',
  jargon: '黑话', workplace: '职场', 'vibe-coding': 'Vibe Coding',
};

export async function statsRoutes(app: FastifyInstance) {
  // GET /api/stats/overview — 所有统计一次性返回
  app.get('/api/stats/overview', async (req) => {
    const tz = (req.query as any).timezone || 'Australia/Sydney';
    const now = new Date();
    const today = getDateInTZ(now, tz);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ── 1. Total cards ──
    const totalCards = await prisma.card.count();

    // ── 2. Progress stages ──
    const stageCounts = {
      new: 0, learning: 0, review: 0, relearning: 0,
    };
    // Cards with no progress = new
    const withProgress = await prisma.cardProgress.groupBy({
      by: ['state'],
      where: { userId: USER_ID },
      _count: true,
    });
    let progressTotal = 0;
    for (const row of withProgress) {
      const key = row.state as keyof typeof stageCounts;
      if (key in stageCounts) stageCounts[key] = row._count;
      progressTotal += row._count;
    }
    stageCounts.new = totalCards - progressTotal;

    // ── 3. Due cards ──
    const dueCards = await prisma.cardProgress.count({
      where: { userId: USER_ID, state: { not: 'new' }, nextReview: { lte: now } },
    });

    // ── 4. Today's reviews ──
    const todayLogs = await prisma.reviewLog.findMany({
      where: { userId: USER_ID, reviewedAt: { gte: today, lt: tomorrow } },
    });
    const todayReviewCount = todayLogs.length;
    const todayCorrectCount = todayLogs.filter(l => l.rating >= 3).length;
    const todayWrongCount = todayLogs.length - todayCorrectCount;
    const uniqueCardIds = new Set(todayLogs.map(l => l.cardId));
    const todayStats = {
      reviewCount: todayReviewCount,
      uniqueCardCount: uniqueCardIds.size,
      correctCount: todayCorrectCount,
      wrongCount: todayWrongCount,
      correctRate: todayReviewCount > 0
        ? Math.round((todayCorrectCount / todayReviewCount) * 10000) / 100
        : null,
    };

    // ── 5. Streak ──
    const allDates = await prisma.reviewLog.findMany({
      where: { userId: USER_ID },
      select: { reviewedAt: true },
      distinct: ['reviewedAt'],
      orderBy: { reviewedAt: 'desc' },
    });
    const dateSet = new Set(allDates.map(d =>
      getDateInTZ(d.reviewedAt, tz).toISOString().slice(0, 10)
    ));
    let streak = 0;
    const check = new Date(today);
    const todayKey = check.toISOString().slice(0, 10);
    if (dateSet.has(todayKey)) {
      while (true) {
        if (dateSet.has(check.toISOString().slice(0, 10))) {
          streak++;
          check.setDate(check.getDate() - 1);
        } else break;
      }
    }

    // ── 6. Module breakdown ──
    const decks = await prisma.deck.findMany({ where: { type: 'builtin' }, orderBy: { sortOrder: 'asc' } });
    const moduleMap = new Map(decks.map(d => [d.id, { label: BUILTIN_DECK_LABELS[d.id] || d.name, total: 0, started: 0 }]));
    const cardCounts = await prisma.card.groupBy({ by: ['deckId'], _count: true });
    for (const row of cardCounts) {
      const m = moduleMap.get(row.deckId);
      if (m) m.total = row._count;
    }
    const startedCounts = await prisma.cardProgress.groupBy({
      by: ['cardId'],
      where: { userId: USER_ID, card: { deckId: { in: [...moduleMap.keys()] } } },
    });
    // Count unique cardIds per deck using a sub-approach: group by card's deckId
    // Simpler: just join card info
    const progressWithDeck = await prisma.cardProgress.findMany({
      where: { userId: USER_ID },
      select: { cardId: true, card: { select: { deckId: true } } },
    });
    for (const p of progressWithDeck) {
      const m = moduleMap.get(p.card.deckId);
      if (m) m.started++;
    }
    const moduleStats = [...moduleMap.entries()]
      .filter(([_, v]) => v.total > 0)
      .map(([key, v]) => ({ key, label: v.label, total: v.total, started: Math.min(v.started, v.total) }));

    return {
      totalCards,
      dueCards,
      streak,
      stageCounts,
      masteredCards: stageCounts.review,
      masteryRate: totalCards > 0 ? Math.round((stageCounts.review / totalCards) * 10000) / 100 : 0,
      today: todayStats,
      moduleStats,
    };
  });
}

function getDateInTZ(date: Date, tz: string): Date {
  const s = date.toLocaleString('en-CA', { timeZone: tz }).slice(0, 10);
  return new Date(s + 'T00:00:00');
}
