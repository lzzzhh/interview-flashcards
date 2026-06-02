// RAG Routes — Qdrant lifecycle, indexing, and search

import { FastifyInstance } from 'fastify';
import { qdrantHealthCheck, qdrantInitCollection, qdrantCheckIndex } from '../services/rag/qdrant-lifecycle';
import { ragSearch, type RagSearchParams } from '../services/rag/rag-search';
import { indexAllCards } from '../services/rag/rag-indexer';

export async function ragRoutes(app: FastifyInstance) {
  // Qdrant health
  app.get('/api/rag/qdrant/health', async () => {
    return qdrantHealthCheck();
  });

  // Init collection
  app.post('/api/rag/qdrant/init', async () => {
    return qdrantInitCollection();
  });

  // Check index status
  app.post('/api/rag/qdrant/check-index', async () => {
    return qdrantCheckIndex();
  });

  // Index cards
  app.post('/api/rag/index/cards', async (req) => {
    const { force } = (req.body as any) || {};
    return indexAllCards(!!force);
  });

  // Index all (currently cards only, extend later)
  app.post('/api/rag/index/all', async (req) => {
    const { force } = (req.body as any) || {};
    return indexAllCards(!!force);
  });

  // RAG search
  app.post('/api/rag/search', async (req) => {
    const body = req.body as any;
    const params: RagSearchParams = {
      query: body.query || '',
      sourceTypes: body.sourceTypes,
      filters: body.filters,
      topK: body.topK || 50,
    };
    const results = await ragSearch(params);
    return { results, total: results.length };
  });
}
