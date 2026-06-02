// RAG Routes — Qdrant lifecycle, indexing, and search

import { FastifyInstance } from 'fastify';
import { qdrantHealthCheck, qdrantInitCollection, qdrantCheckIndex } from '../services/rag/qdrant-lifecycle';
import { ragSearch, type RagSearchParams } from '../services/rag/rag-search';
import { indexAllCards, indexAllJobPostings, indexAllDocuments, indexAllProjects, indexAllInterviewQA } from '../services/rag/rag-indexer';

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

  // Index all — cards + job postings + documents + projects + interview QA
  app.post('/api/rag/index/all', async (req) => {
    const { force } = (req.body as any) || {};
    const [cards, postings, docs, projects, qa] = await Promise.all([
      indexAllCards(!!force).catch(() => ({ indexed: 0, skipped: 0, failed: 0 })),
      indexAllJobPostings().catch(() => ({ indexed: 0, skipped: 0, failed: 0 })),
      indexAllDocuments().catch(() => ({ indexed: 0, skipped: 0, failed: 0 })),
      indexAllProjects().catch(() => ({ indexed: 0, skipped: 0, failed: 0 })),
      indexAllInterviewQA().catch(() => ({ indexed: 0, skipped: 0, failed: 0 })),
    ]);
    return {
      cards: cards.indexed, jobPostings: postings.indexed, documents: docs.indexed,
      projects: projects.indexed, interviewQA: qa.indexed,
      total: cards.indexed + postings.indexed + docs.indexed + projects.indexed + qa.indexed,
    };
  });

  // Index job postings
  app.post('/api/rag/index/job-postings', async (req) => {
    return indexAllJobPostings();
  });

  // Qdrant start — start Qdrant container on demand
  app.post('/api/rag/qdrant/start', async () => {
    try {
      const { execSync } = await import('child_process');
      const composeFile = process.env.QDRANT_COMPOSE_FILE || 'docker-compose.qdrant.yml';
      execSync(`docker compose -f ${composeFile} up -d`, { timeout: 30000, cwd: process.cwd() });
      // Wait for ready
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          const check = await fetch(`${process.env.QDRANT_URL || 'http://localhost:6335'}/`);
          if (check.ok) return { started: true };
        } catch { /* waiting */ }
      }
      return { started: false, error: 'Timed out' };
    } catch (e: any) {
      return { started: false, error: e.message };
    }
  });

  // RAG search
  app.post('/api/rag/search', async (req) => {
    const body = req.body as any;
    const results = await ragSearch({
      query: body.query || '', sourceTypes: body.sourceTypes, filters: body.filters, topK: body.topK || 50,
    });
    return { results, total: results.length };
  });

  // Embedding health
  app.get('/api/rag/embedding/health', async () => {
    try {
      const res = await fetch('http://localhost:11434/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'bge-m3', prompt: 'health check' }),
        signal: AbortSignal.timeout(5000),
      });
      return { ready: res.ok };
    } catch {
      return { ready: false };
    }
  });

  // Start Ollama on demand
  app.post('/api/rag/embedding/start', async () => {
    try {
      const { execSync } = await import('child_process');
      // Check if Ollama is already running
      const healthRes = await fetch('http://localhost:11434/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'bge-m3', prompt: 'start check' }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => null);

      if (healthRes?.ok) return { started: true, alreadyRunning: true };

      // Try to start Ollama via open -a (macOS app)
      execSync('open -a Ollama 2>/dev/null || open /Applications/Ollama.app 2>/dev/null || true', { timeout: 5000 });
      // Wait for it to be ready
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 1000));
        try {
          const check = await fetch('http://localhost:11434/api/embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'bge-m3', prompt: 'check' }),
            signal: AbortSignal.timeout(3000),
          });
          if (check.ok) return { started: true };
        } catch { /* still waiting */ }
      }
      return { started: false, error: 'Ollama did not start within 20s' };
    } catch (e: any) {
      return { started: false, error: e.message };
    }
  });
}
