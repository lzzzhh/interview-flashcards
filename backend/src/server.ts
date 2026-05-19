import Fastify from 'fastify';
import cors from '@fastify/cors';
import { deckRoutes } from './routes/decks';
import { dashboardRoutes } from './routes/dashboard';
import { reviewRoutes } from './routes/reviews';
import { studyRoutes } from './routes/study';
import { cardRoutes } from './routes/cards';
import { migrationRoutes } from './routes/migrations';
import { ingestRoutes } from './routes/ingest';
import { searchRoutes } from './routes/search';
import { cardDraftRoutes } from './routes/card-drafts';
import { initFTS5 } from './services/search/fts5-search';

const app = Fastify({ logger: true });
const PORT = parseInt(process.env.PORT || '3001', 10);

async function start() {
  await app.register(cors, { origin: true });
  await app.register(deckRoutes);
  await app.register(dashboardRoutes);
  await app.register(reviewRoutes);
  await app.register(studyRoutes);
  await app.register(cardRoutes);
  await app.register(migrationRoutes);
  await app.register(ingestRoutes);
  await app.register(searchRoutes);
  await app.register(cardDraftRoutes);

  // 初始化 FTS5 索引
  initFTS5().catch(() => {});

  app.get('/api/health', async () => ({ ok: true }));

  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`Backend running on http://localhost:${PORT}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
