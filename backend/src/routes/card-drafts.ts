// backend/src/routes/card-drafts.ts — 卡片草稿 CRUD
import { FastifyInstance } from 'fastify';
import prisma from '../db/prisma';
import { generateCardDrafts, saveCardDrafts } from '../services/ingestion/generate-card-drafts';

export async function cardDraftRoutes(app: FastifyInstance) {
  // 从 SourceDocument 生成草稿
  app.post('/api/card-drafts/generate', async (req, reply) => {
    const { sourceId, deckId } = req.body as any;
    if (!sourceId || !deckId) return reply.status(400).send({ error: 'sourceId and deckId required' });

    const source = await prisma.sourceDocument.findUnique({
      where: { id: sourceId },
      include: { chunks: { orderBy: { chunkIndex: 'asc' } } },
    });
    if (!source) return reply.status(404).send({ error: 'Source not found' });

    const chunkList = source.chunks.map(c => ({ id: c.id, text: c.text, chunkIndex: c.chunkIndex }));
    const drafts = await generateCardDrafts(sourceId, deckId, chunkList);
    const count = await saveCardDrafts(sourceId, deckId, drafts);

    return { generated: count, sourceId, deckId };
  });

  // 列出草稿
  app.get('/api/card-drafts', async (req) => {
    const { sourceId, status, deckId } = req.query as any;
    const where: any = {};
    if (sourceId) where.sourceId = sourceId;
    if (status) where.status = status;
    if (deckId) where.deckId = deckId;

    const drafts = await prisma.cardDraft.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { drafts, total: drafts.length };
  });

  // 审核通过单张
  app.post('/api/card-drafts/:id/approve', async (req, reply) => {
    const { id } = req.params as { id: string };
    const draft = await prisma.cardDraft.findUnique({ where: { id } });
    if (!draft) return reply.status(404).send({ error: 'Draft not found' });

    // 写入 Card
    await prisma.card.create({
      data: {
        id: `card-${Date.now()}`,
        deckId: draft.deckId,
        type: draft.type,
        question: draft.question,
        answer: draft.answer,
        tags: draft.tags,
        difficulty: draft.difficulty,
        subTopic: draft.subTopic,
      },
    });

    await prisma.cardDraft.update({ where: { id }, data: { status: 'approved' } });
    return { approved: true, draftId: id };
  });

  // 批量审核通过
  app.post('/api/card-drafts/approve-batch', async (req, reply) => {
    const { ids } = req.body as { ids: string[] };
    if (!ids || ids.length === 0) return reply.status(400).send({ error: 'ids required' });

    let count = 0;
    for (const id of ids) {
      const draft = await prisma.cardDraft.findUnique({ where: { id } });
      if (!draft) continue;
      await prisma.card.create({
        data: {
          id: `card-${Date.now()}-${count}`,
          deckId: draft.deckId,
          type: draft.type,
          question: draft.question,
          answer: draft.answer,
          tags: draft.tags,
          difficulty: draft.difficulty,
          subTopic: draft.subTopic,
        },
      });
      await prisma.cardDraft.update({ where: { id }, data: { status: 'approved' } });
      count++;
    }
    return { approved: count };
  });

  // 拒绝草稿
  app.post('/api/card-drafts/:id/reject', async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.cardDraft.update({ where: { id }, data: { status: 'rejected' } });
    return { rejected: true };
  });

  // 删除草稿
  app.delete('/api/card-drafts/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.cardDraft.delete({ where: { id } });
    return { deleted: true };
  });
}
