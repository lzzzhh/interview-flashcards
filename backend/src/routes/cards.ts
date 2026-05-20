import { FastifyInstance } from 'fastify';
import prisma from '../db/prisma';
import { syncCardEmbedding, deleteCardEmbedding } from '../services/vector/embedding-sync';
import { CreateCardSchema, UpdateCardSchema, validate } from './schemas';

export async function cardRoutes(app: FastifyInstance) {
  // POST /api/cards — 新增卡片
  app.post('/api/cards', async (req, reply) => {
    const v = validate(CreateCardSchema, req.body);
    if (!v.success) return reply.status(400).send({ error: v.error });
    const body = v.data;
    if (!body.id || !body.deckId) {
      return reply.status(400).send({ error: 'id and deckId required' });
    }
    const exists = await prisma.card.findUnique({ where: { id: body.id } });
    if (exists) return reply.status(409).send({ error: 'Card already exists' });

    const card = await prisma.card.create({
      data: {
        id: body.id, deckId: body.deckId, type: body.type || 'qa',
        number: body.number || null, title: body.title || null,
        titleCn: body.titleCn || null, question: body.question || null,
        answer: body.answer || null, description: body.description || null,
        approach: body.approach || null, difficulty: body.difficulty || null,
        tags: body.tags ? JSON.stringify(body.tags) : null,
        subTopic: body.subTopic || null, source: body.source || null,
        codes: body.codes ? JSON.stringify(body.codes) : null,
      },
    });
    // 异步同步 embedding（不阻塞请求）
    syncCardEmbedding(card.id).catch(() => {});
    return card;
  });

  // PATCH /api/cards/:cardId — 更新卡片
  app.patch('/api/cards/:cardId', async (req, reply) => {
    const { cardId } = req.params as { cardId: string };
    const v = validate(UpdateCardSchema, req.body);
    const body = v.success ? v.data : (req.body as any);
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return reply.status(404).send({ error: 'Not found' });

    const updated = await prisma.card.update({
      where: { id: cardId },
      data: {
        title: body.title ?? card.title,
        titleCn: body.titleCn ?? card.titleCn,
        question: body.question ?? card.question,
        answer: body.answer ?? card.answer,
        description: body.description ?? card.description,
        approach: body.approach ?? card.approach,
        difficulty: body.difficulty ?? card.difficulty,
        tags: body.tags ? JSON.stringify(body.tags) : card.tags,
        subTopic: body.subTopic ?? card.subTopic,
        source: body.source ?? card.source,
      },
    });
    // 异步同步 embedding
    syncCardEmbedding(cardId).catch(() => {});
    return updated;
  });

  // DELETE /api/cards/:cardId — 删除卡片
  app.delete('/api/cards/:cardId', async (req, reply) => {
    const { cardId } = req.params as { cardId: string };
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return reply.status(404).send({ error: 'Not found' });

    // 删除关联的 progress 和 logs
    await prisma.cardProgress.deleteMany({ where: { cardId } });
    await prisma.reviewLog.deleteMany({ where: { cardId } });
    await prisma.card.delete({ where: { id: cardId } });

    // 异步清理 embedding
    deleteCardEmbedding(cardId).catch(() => {});

    return { deleted: true };
  });
}
