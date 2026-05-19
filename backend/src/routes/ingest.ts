// backend/src/routes/ingest.ts — 资料制卡
import { FastifyInstance } from 'fastify';

export async function ingestRoutes(app: FastifyInstance) {
  app.post('/api/ingest/documents', async () => ({
    status: 'not_implemented',
    message: 'Document ingestion will be available in a future release',
  }));

  app.get('/api/ingest/jobs/:id', async (req) => {
    const { id } = req.params as { id: string };
    return { id, status: 'not_found' };
  });
}
