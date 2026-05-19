// backend/src/routes/search.ts — AI 搜索路由
import { FastifyInstance } from 'fastify';
import { hybridSearch } from '../services/search/hybrid-search';
import { fts5Search } from '../services/search/fts5-search';

export async function searchRoutes(app: FastifyInstance) {
  app.post('/api/search/hybrid', async (req) => {
    const body = req.body as any;
    const results = await hybridSearch({
      query: body.query || '',
      deckIds: body.deckIds,
      topK: body.topK || 20,
      filters: body.filters,
    });
    return { results, total: results.length };
  });

  app.get('/api/search/keyword', async (req) => {
    const { q, limit, deckId } = req.query as { q?: string; limit?: string; deckId?: string };
    const results = await fts5Search(q || '', parseInt(limit || '20'), deckId);
    return { results, total: results.length };
  });
}
