// backend/src/routes/card-drafts.ts — 卡片草稿 CRUD
import { FastifyInstance } from 'fastify';
import prisma from '../db/prisma';
import { generateCardDrafts, saveCardDrafts } from '../services/ingestion/generate-card-drafts';
import { syncCardEmbedding } from '../services/vector/embedding-sync';
import { GenerateDraftsSchema, ApproveBatchSchema, validate } from './schemas';

export async function cardDraftRoutes(app: FastifyInstance) {
  // 从 SourceDocument 生成草稿
  app.post('/api/card-drafts/generate', async (req, reply) => {
    const v = validate(GenerateDraftsSchema, req.body);
    if (!v.success) return reply.status(400).send({ error: v.error });
    const { sourceId, deckId } = v.data;

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

    const result = await prisma.$transaction(async (tx) => {
      const draft = await tx.cardDraft.findUnique({ where: { id } });
      if (!draft) throw { status: 404, message: 'Draft not found' };

      // 确保目标牌组存在，不存在则自动创建
      const deck = await tx.deck.findUnique({ where: { id: draft.deckId } });
      if (!deck) {
        await tx.deck.create({
          data: { id: draft.deckId, name: draft.deckId, sortOrder: 99 },
        });
      }

      const cardId = `card-${Date.now()}`;
      await tx.card.create({
        data: {
          id: cardId,
          deckId: draft.deckId,
          type: draft.type,
          question: draft.question,
          answer: draft.answer,
          tags: draft.tags,
          difficulty: draft.difficulty,
          subTopic: draft.subTopic,
        },
      });

      await tx.cardDraft.update({ where: { id }, data: { status: 'approved' } });
      return { cardId, draft };
    });

    // 同步 FTS5 索引
    try {
      await prisma.$executeRawUnsafe(
        `INSERT OR REPLACE INTO card_fts(cardId, deckId, question, answer, tags)
         SELECT id, deckId, question, answer, tags FROM Card WHERE id = '${result.cardId}'`
      );
    } catch {}
    // 异步同步 embedding
    syncCardEmbedding(result.cardId).catch(() => {});
    return { approved: true, draftId: id, cardId: result.cardId };
  });

  // 批量审核通过
  app.post('/api/card-drafts/approve-batch', async (req, reply) => {
    const v = validate(ApproveBatchSchema, req.body);
    if (!v.success) return reply.status(400).send({ error: v.error });
    const { ids } = v.data;

    const result = await prisma.$transaction(async (tx) => {
      const cardIds: string[] = [];
      for (const id of ids) {
        const draft = await tx.cardDraft.findUnique({ where: { id } });
        if (!draft) continue;

        // 确保目标牌组存在
        const deck = await tx.deck.findUnique({ where: { id: draft.deckId } });
        if (!deck) {
          await tx.deck.create({
            data: { id: draft.deckId, name: draft.deckId, sortOrder: 99 },
          });
        }

        const cardId = `card-${Date.now()}-${cardIds.length}`;
        await tx.card.create({
          data: {
            id: cardId,
            deckId: draft.deckId,
            type: draft.type,
            question: draft.question,
            answer: draft.answer,
            tags: draft.tags,
            difficulty: draft.difficulty,
            subTopic: draft.subTopic,
          },
        });
        await tx.cardDraft.update({ where: { id }, data: { status: 'approved' } });
        cardIds.push(cardId);
      }
      return cardIds;
    });

    // 同步 FTS5 索引
    if (result.length > 0) {
      try {
        const values = result.map(() => '(SELECT id, deckId, question, answer, tags FROM Card WHERE id = ?)').join(' UNION ALL ');
        await prisma.$executeRawUnsafe(
          `INSERT OR REPLACE INTO card_fts(cardId, deckId, question, answer, tags) ${values}`,
          ...result
        );
      } catch {}
    }
    // 异步同步 embedding
    for (const cardId of result) {
      syncCardEmbedding(cardId).catch(() => {});
    }

    return { approved: result.length, cardIds: result };
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
