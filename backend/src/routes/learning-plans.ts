// backend/src/routes/learning-plans.ts — 学习计划 CRUD + LLM 生成
import { FastifyInstance } from 'fastify';
import prisma from '../db/prisma';

const USER_ID = 'demo-user';

export async function learningPlanRoutes(app: FastifyInstance) {
  // GET /api/learning-plans — 列表
  app.get('/api/learning-plans', async () => {
    const plans = await prisma.learningPlan.findMany({
      where: { userId: USER_ID },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, query: true, createdAt: true, updatedAt: true },
    });
    return plans.map(p => ({
      ...p,
      itemCount: 0, // lazy: item count from items JSON
    }));
  });

  // GET /api/learning-plans/:id — 详情
  app.get('/api/learning-plans/:id', async (req) => {
    const { id } = req.params as { id: string };
    const plan = await prisma.learningPlan.findFirst({
      where: { id, userId: USER_ID },
    });
    if (!plan) return { error: 'Not found' };
    return {
      ...plan,
      items: safeParse(plan.items),
    };
  });

  // POST /api/learning-plans — 保存
  app.post('/api/learning-plans', async (req) => {
    const { title, query, items } = req.body as {
      title: string; query: string; items: { cardId: string; deckId: string; title: string }[];
    };
    const plan = await prisma.learningPlan.create({
      data: {
        userId: USER_ID,
        title: title || query,
        query,
        items: JSON.stringify(items),
      },
    });
    return { ...plan, items };
  });

  // DELETE /api/learning-plans/:id
  app.delete('/api/learning-plans/:id', async (req) => {
    const { id } = req.params as { id: string };
    await prisma.learningPlan.deleteMany({ where: { id, userId: USER_ID } });
    return { ok: true };
  });

  // POST /api/learning-plans/:id/generate — LLM 生成学习计划
  app.post('/api/learning-plans/:id/generate', async (req) => {
    const { id } = req.params as { id: string };
    const plan = await prisma.learningPlan.findFirst({ where: { id, userId: USER_ID } });
    if (!plan) return { error: 'Not found' };

    const items = safeParse(plan.items);
    if (!items.length) return { error: 'No cards in plan' };

    // Build prompt for LLM
    const cardList = items.map((item: any, i: number) =>
      `${i + 1}. [${item.deckId}] ${item.title}`
    ).join('\n');

    const prompt = `你是一个学习规划师。以下是用户要学习的卡片列表：

${cardList}

请制定一个学习计划：
1. 按知识点依赖关系排序（先基础后高级）
2. 拆成每天的学习任务（每天3-5张卡）
3. 每周留一天复习
4. 总时长不超过14天

输出格式：
第N天（主题）
· 卡片标题1
· 卡片标题2

直接输出计划文本，不要多余的解释。`;

    try {
      // Try LLM first
      const llmRes = await fetch(`${process.env.LLM_BASE_URL || 'https://api.deepseek.com'}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.LLM_MODEL || 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });

      if (llmRes.ok) {
        const llmData = await llmRes.json() as any;
        const studyPlan = llmData.choices?.[0]?.message?.content || '';
        if (studyPlan) {
          await prisma.learningPlan.update({
            where: { id },
            data: { studyPlan, updatedAt: new Date() },
          });
          return { studyPlan };
        }
      }
    } catch (e) {
      console.error('[learning-plan] LLM failed:', (e as Error).message?.slice(0, 100));
    }

    // Fallback: rule-based plan
    const fallbackPlan = buildFallbackPlan(items);
    await prisma.learningPlan.update({
      where: { id },
      data: { studyPlan: fallbackPlan, updatedAt: new Date() },
    });
    return { studyPlan: fallbackPlan };
  });
}

function safeParse(input: string): any[] {
  try { const v = JSON.parse(input); return Array.isArray(v) ? v : []; }
  catch { return []; }
}

function buildFallbackPlan(items: { deckId: string; title: string }[]): string {
  let plan = '';
  let day = 1;
  for (let i = 0; i < items.length; i += 4) {
    const batch = items.slice(i, i + 4);
    plan += `第${day}天\n`;
    for (const card of batch) plan += `· ${card.title}\n`;
    plan += '\n';
    if ((day + 1) % 7 === 0) { plan += `第${day + 1}天（复习）\n\n`; day++; }
    day++;
  }
  return plan.trim();
}
