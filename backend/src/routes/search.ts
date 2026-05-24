// backend/src/routes/search.ts — AI 搜索路由
import { FastifyInstance } from 'fastify';
import { hybridSearch, learningPlanSearch } from '../services/search/hybrid-search';
import { fts5Search } from '../services/search/fts5-search';
import { understandQuery } from '../services/search/query-understanding';
import { HybridSearchSchema, validate } from './schemas';

export async function searchRoutes(app: FastifyInstance) {
  app.post('/api/search/hybrid', async (req) => {
    const v = validate(HybridSearchSchema, req.body);
    const body = v.success ? v.data : (req.body as any);
    const start = Date.now();
    const results = await hybridSearch({
      query: body.query || '',
      deckIds: body.deckIds,
      maxResults: body.maxResults ?? body.topK ?? undefined,
      minScore: body.minScore,
      candidateLimit: body.candidateLimit,
      filters: body.filters,
    });
    const ms = Date.now() - start;

    // Debug: parse query to return intent info
    const parsed = await understandQuery(body.query || '');
    return {
      results,
      total: results.length,
      debug: {
        ms,
        rawQuery: parsed.rawQuery,
        intent: parsed.intent,
        topic: parsed.topic,
        deckHint: parsed.deckHint || null,
        rewrittenQuery: parsed.rewrittenQuery,
        keywords: parsed.keywords.slice(0, 10),
        confidence: parsed.confidence,
        parseMethod: parsed.debug,
        recallText: [parsed.rewrittenQuery, parsed.topic, ...parsed.keywords.slice(0, 5)].filter(Boolean).join(' ').slice(0, 200),
        rerankText: [parsed.topic, ...parsed.keywords.slice(0, 3)].filter(Boolean).join(' '),
        resultCount: results.length,
      },
    };
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
