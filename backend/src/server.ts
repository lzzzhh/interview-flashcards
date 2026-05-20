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
import { jobPrepRoutes } from './routes/job-prep';
import { maintenanceRoutes } from './routes/maintenance';
import { settingsRoutes } from './routes/settings';
import { initFTS5 } from './services/search/fts5-search';
import { setLLMProvider, OpenAIChatProvider } from './services/llm-provider';
import { setEmbeddingProvider, OpenAIEmbeddingProvider } from './services/embedding-provider';
import { getVectorStore, SqliteVecVectorStore, setVectorStore, initVectorStore } from './services/vector/vector-store';
import prisma from './db/prisma';

const app = Fastify({ logger: true });
const PORT = parseInt(process.env.PORT || '3001', 10);

/** 从 DB 或环境变量读取配置值 */
async function readConfig(key: string, envKey: string): Promise<string | null> {
  try {
    const row = await prisma.appConfig.findUnique({ where: { key } });
    if (row?.value) return row.value;
  } catch { /* table might not exist yet */ }
  return process.env[envKey] || null;
}

/** 初始化 LLM + Embedding Provider */
async function initLLMProviders() {
  const baseUrl = await readConfig('llm_base_url', 'LLM_BASE_URL');
  const apiKey = await readConfig('llm_api_key', 'LLM_API_KEY');
  const model = (await readConfig('llm_model', 'LLM_MODEL')) || 'deepseek-chat';
  const embeddingModel = (await readConfig('embedding_model', 'EMBEDDING_MODEL')) || '';

  if (baseUrl && apiKey) {
    const llmProvider = new OpenAIChatProvider(baseUrl, apiKey);
    (llmProvider as any).defaultModel = model;
    setLLMProvider(llmProvider);
    console.log(`[providers] LLM ready: ${baseUrl} (model: ${model})`);

    if (embeddingModel) {
      const embProvider = new OpenAIEmbeddingProvider(baseUrl, apiKey);
      (embProvider as any).defaultModel = embeddingModel;
      setEmbeddingProvider(embProvider);
      console.log(`[providers] Embedding ready: ${baseUrl} (model: ${embeddingModel})`);
    }
  } else {
    console.warn('[providers] LLM/Embedding not configured — AI features disabled');
    console.warn('[providers] Set via UI (Settings page) or .env: LLM_BASE_URL + LLM_API_KEY');
  }

  // 初始化 SQLite 向量存储
  if (getVectorStore().name === 'noop') {
    const vecStore = new SqliteVecVectorStore();
    setVectorStore(vecStore);
  }
}

async function start() {
  // 依赖注入：LLM + Embedding（先读 .env，再读 DB 覆盖）
  await initLLMProviders();

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
  await app.register(jobPrepRoutes);
  await app.register(maintenanceRoutes);
  await app.register(settingsRoutes);

  // 初始化 FTS5 索引
  initFTS5().catch(() => {});

  // 初始化向量存储
  await initVectorStore().catch((e) => console.warn('[vector] init failed:', e));

  app.get('/api/health', async () => ({ ok: true }));

  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`Backend running on http://localhost:${PORT}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
