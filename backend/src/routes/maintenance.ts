// backend/src/routes/maintenance.ts — 维护路由（FTS5 重建、向量索引维护）

import { FastifyInstance } from 'fastify';
import { rebuildFTS5 } from '../services/search/fts5-search';
import { getVectorStore } from '../services/vector/vector-store';
import { syncCardEmbeddings } from '../services/vector/embedding-sync';
import { rebuildLocalEmbeddings } from '../services/vector/local-embedding';
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

  // 使用本地 n-gram 向量重建（无需外部 API）
  app.post('/api/maintenance/rebuild-local-vectors', async () => {
    const result = await rebuildLocalEmbeddings();
    return { success: true, ...result };
  });

  // 全量同步所有卡片 embedding
  app.post('/api/maintenance/sync-all-embeddings', async () => {
    try {
      const cards = await prisma.card.findMany({ select: { id: true } });
      const cardIds = cards.map(c => c.id);
      const count = await syncCardEmbeddings(cardIds);
      return { success: true, totalCards: cardIds.length, syncedCount: count };
    } catch (err) {
      return { success: false, totalCards: 0, syncedCount: 0, error: (err as Error).message };
    }
  });

  // 检查 embedding 服务状态
  app.get('/api/maintenance/embedding-status', async () => {
    const { getEmbeddingProvider } = await import('../services/embedding-provider');
    const provider = getEmbeddingProvider();
    if (!provider) return { available: false, reason: 'Embedding provider not configured' };
    try {
      const res = await provider.embed({ model: (provider as any).defaultModel || 'text-embedding-3-small', texts: ['test'] });
      return { available: true, dimension: res.dimension, provider: provider.name };
    } catch (err) {
      return { available: false, reason: `Embedding API error: ${(err as Error).message}`, provider: provider.name };
    }
  });

  // 查看向量存储状态
  app.get('/api/maintenance/vector-status', async () => {
    const store = getVectorStore();
    try {
      const count = await prisma.$queryRawUnsafe<[{ cnt: number }]>(
        'SELECT COUNT(*) as cnt FROM ai_search_vec',
      );
      return {
        vectorStore: store.name,
        vectorCount: Number(count[0]?.cnt ?? 0),
      };
    } catch {
      return { vectorStore: store.name, vectorCount: 0 };
    }
  });

  // 向量模块列表
  app.get('/api/maintenance/vector-modules', async () => {
    const store = getVectorStore();
    if ('listModules' in store) {
      const modules = await (store as any).listModules();
      return { modules };
    }
    return { modules: [{ module: 'ai-search', count: 0 }] };
  });

  // 模块内向量列表（分页）
  app.get('/api/maintenance/vector-list', async (req) => {
    const { module, offset, limit } = req.query as { module?: string; offset?: string; limit?: string };
    const store = getVectorStore();
    if ('listVectors' in store) {
      const vectors = await (store as any).listVectors(module || 'ai-search', parseInt(offset || '0'), parseInt(limit || '50'));
      return { vectors, module: module || 'ai-search' };
    }
    return { vectors: [], module: module || 'ai-search' };
  });
}
