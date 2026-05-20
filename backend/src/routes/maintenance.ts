// backend/src/routes/maintenance.ts — 维护路由（FTS5 重建、向量索引维护）

import { FastifyInstance } from 'fastify';
import { rebuildFTS5 } from '../services/search/fts5-search';
import { getVectorStore } from '../services/vector/vector-store';
import { syncCardEmbeddings } from '../services/vector/embedding-sync';
import prisma from '../db/prisma';

export async function maintenanceRoutes(app: FastifyInstance) {
  // 重建 FTS5 索引
  app.post('/api/maintenance/rebuild-fts5', async () => {
    await rebuildFTS5();
    return { success: true };
  });

  // 重建向量索引（清空后重建）
  app.post('/api/maintenance/rebuild-vectors', async () => {
    const store = getVectorStore();
    const count = await store.rebuild();
    return { success: true, deletedCount: count };
  });

  // 清理孤立向量
  app.post('/api/maintenance/cleanup-vectors', async () => {
    const store = getVectorStore();
    const count = await store.cleanup();
    return { success: true, cleanedCount: count };
  });

  // 全量同步所有卡片 embedding
  app.post('/api/maintenance/sync-all-embeddings', async () => {
    const cards = await prisma.card.findMany({ select: { id: true } });
    const cardIds = cards.map(c => c.id);
    const count = await syncCardEmbeddings(cardIds);
    return { success: true, totalCards: cardIds.length, syncedCount: count };
  });

  // 查看向量存储状态
  app.get('/api/maintenance/vector-status', async () => {
    const store = getVectorStore();
    try {
      const count = await prisma.$queryRawUnsafe<[{ cnt: number }]>(
        'SELECT COUNT(*) as cnt FROM vec_embeddings',
      );
      const embeddingRecords = await prisma.embeddingRecord.count({ where: { status: 'active' } });
      return {
        vectorStore: store.name,
        vectorCount: Number(count[0]?.cnt ?? 0),
        embeddingRecords,
      };
    } catch {
      return { vectorStore: store.name, vectorCount: 0, embeddingRecords: 0 };
    }
  });
}
