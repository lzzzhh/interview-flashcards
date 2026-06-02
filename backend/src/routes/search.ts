// backend/src/routes/search.ts — AI 搜索路由
import { FastifyInstance } from 'fastify';
import { hybridSearch } from '../services/search/hybrid-search';
import { neo4jHybridSearch } from '../services/search/neo4j-hybrid-search';
import { neo4jHybridSearchV2 } from '../services/search/neo4j-hybrid-search-v2';
import { neo4jHybridSearchV3 } from '../services/search/neo4j-hybrid-search-v3';
import { neo4jHybridSearchV4 } from '../services/search/neo4j-hybrid-search-v4';
import { neo4jHybridSearchV5 } from '../services/search/neo4j-hybrid-search-v5';
import { buildLearningPlan } from '../services/search/learning-path-pipeline';
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
    const plan = await buildLearningPlan(body.query || '');
    const stagesObj: Record<string, any[]> = {};
    for (const s of plan.stages) {
      stagesObj[s.name] = s.cards.map(c => ({
        cardId: c.cardId,
        deckId: '',
        title: c.titleCn || c.title || c.cardId,
        score: c.score,
        conceptMatch: c.conceptMatch,
        source: 'graph',
      }));
    }
    return {
      plan: { topic: plan.canonicalTopic, stages: stagesObj },
      totalCards: plan.debug.totalCards,
    };
  });

  // Neo4j-enhanced hybrid search (evaluation branch)
  app.post('/api/search/neo4j-hybrid', async (req) => {
    const v = validate(HybridSearchSchema, req.body);
    const body = v.success ? v.data : (req.body as any);

    const start = Date.now();
    const result: any = await neo4jHybridSearch({
      query: body.query || '',
      deckIds: body.deckIds,
      maxResults: body.maxResults ?? body.topK ?? undefined,
      minScore: body.minScore,
      candidateLimit: body.candidateLimit,
      filters: body.filters,
      debug: true,
    });
    const ms = Date.now() - start;

    const trace = (result as any)._neo4jTrace || {};
    const results = result.map((r: any) => { const { _neo4jTrace, ...rest } = r; return rest; });
    trace.timingMs = { ...(trace.timingMs || {}), total: ms };
    return { results, total: results.length, debug: { neo4j: trace } };
  });

  // Neo4j V2 — tiered scoring + evidence gating + diversity (evaluation branch)
  app.post('/api/search/neo4j-hybrid-v2', async (req) => {
    const v = validate(HybridSearchSchema, req.body);
    const body = v.success ? v.data : (req.body as any);

    const start = Date.now();
    const result: any = await neo4jHybridSearchV2({
      query: body.query || '',
      deckIds: body.deckIds,
      maxResults: body.maxResults ?? body.topK ?? undefined,
      minScore: body.minScore,
      candidateLimit: body.candidateLimit,
      filters: body.filters,
      debug: true,
    });
    const ms = Date.now() - start;

    const trace = (result as any)._neo4jTraceV2 || {};
    const results = result.map((r: any) => { const { _neo4jTraceV2, ...rest } = r; return rest; });
    trace.timingMs = { ...(trace.timingMs || {}), total: ms };
    return { results, total: results.length, debug: { neo4jV2: trace } };
  });

  // Neo4j V3 — soft rerank (evaluation branch)
  app.post('/api/search/neo4j-hybrid-v3', async (req) => {
    const v = validate(HybridSearchSchema, req.body);
    const body = v.success ? v.data : (req.body as any);
    const start = Date.now();
    const result: any = await neo4jHybridSearchV3({
      query: body.query || '', deckIds: body.deckIds,
      maxResults: body.maxResults ?? body.topK ?? undefined,
      minScore: body.minScore, candidateLimit: body.candidateLimit,
      filters: body.filters, debug: true,
    });
    const ms = Date.now() - start;
    const trace = (result as any)._neo4jTraceV3 || {};
    const results = result.map((r: any) => { const { _neo4jTraceV3, ...rest } = r; return rest; });
    trace.timingMs = { ...(trace.timingMs || {}), total: ms };
    return { results, total: results.length, debug: { neo4jV3: trace } };
  });

  // Neo4j V4 — enhanced recall (2-hop + bilingual + diverse)
  app.post('/api/search/neo4j-hybrid-v4', async (req) => {
    const v = validate(HybridSearchSchema, req.body);
    const body = v.success ? v.data : (req.body as any);
    const start = Date.now();
    const result: any = await neo4jHybridSearchV4({
      query: body.query || '', deckIds: body.deckIds,
      maxResults: body.maxResults ?? body.topK ?? undefined,
      minScore: body.minScore, candidateLimit: body.candidateLimit,
      filters: body.filters, debug: true,
    });
    const ms = Date.now() - start;
    const trace = (result as any)._neo4jTrace || {};
    const results = result.map((r: any) => { const { _neo4jTrace, ...rest } = r; return rest; });
    trace.timingMs = { ...(trace.timingMs || {}), total: ms };
    return { results, total: results.length, debug: { neo4jV4: trace } };
  });
}
