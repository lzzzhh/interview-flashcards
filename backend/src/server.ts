import Fastify from 'fastify';
import cors from '@fastify/cors';
import { deckRoutes } from './routes/decks';
import { dashboardRoutes } from './routes/dashboard';

const app = Fastify({ logger: true });
const PORT = parseInt(process.env.PORT || '3001', 10);

async function start() {
  await app.register(cors, { origin: true });
  await app.register(deckRoutes);
  await app.register(dashboardRoutes);

  app.get('/api/health', async () => ({ ok: true }));

  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`Backend running on http://localhost:${PORT}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
