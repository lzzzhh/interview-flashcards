// backend/src/routes/search.ts — AI 搜索路由
import { FastifyInstance } from 'fastify';
import { hybridSearch, learningPlanSearch } from '../services/search/hybrid-search';
import { fts5Search } from '../services/search/fts5-search';
import { HybridSearchSchema, validate } from './schemas';

export async function searchRoutes(app: FastifyInstance) {
  app.post('/api/search/hybrid', async (req) => {
    const v = validate(HybridSearchSchema, req.body);
    const body = v.success ? v.data : (req.body as any);

    const start = Date.now();
    const result: any = await hybridSearch({
      query: body.query || '',
      deckIds: body.deckIds,
      maxResults: body.maxResults ?? body.topK ?? undefined,
      minScore: body.minScore,
      candidateLimit: body.candidateLimit,
      filters: body.filters,
      debug: true, // always collect trace
    });
    const ms = Date.now() - start;

    const trace = result._trace || {};
    delete result._trace;
    trace.timingMs = { ...(trace.timingMs || {}), total: ms };
    return { results: result, total: result.length, debug: trace };
  });

  app.get('/api/search/keyword', async (req) => {
    const { q, limit, deckId } = req.query as { q?: string; limit?: string; deckId?: string };
    const results = await fts5Search(q || '', parseInt(limit || '20'), deckId);
    return { results, total: results.length };
  });

  app.post('/api/search/learning-plan', async (req) => {
    const body = req.body as any;
    const plan = await learningPlanSearch({
      query: body.query || '',
      deckIds: body.deckIds,
      filters: body.filters,
    });
    return { plan, total: plan.totalCards };
  });
}
