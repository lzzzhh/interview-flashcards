import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { deckRoutes } from './routes/decks';
import { dashboardRoutes } from './routes/dashboard';
import { reviewRoutes } from './routes/reviews';
import { studyRoutes } from './routes/study';
import { cardRoutes } from './routes/cards';
import { migrationRoutes } from './routes/migrations';
import { searchRoutes } from './routes/search';
import { jobPrepRoutes } from './routes/job-prep';
import { maintenanceRoutes } from './routes/maintenance';
import { settingsRoutes } from './routes/settings';
import { statsRoutes } from './routes/stats';
import { learningPlanRoutes } from './routes/learning-plans';
import { documentRoutes, ingestRedirectRoutes } from './routes/documents';
import { initFTS5 } from './services/search/fts5-search';
import { setLLMProvider, OpenAIChatProvider } from './services/llm-provider';
import { setEmbeddingProvider, OpenAIEmbeddingProvider, getEmbeddingProvider } from './services/embedding-provider';
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
  const embBaseUrl = await readConfig('embedding_base_url', 'EMBEDDING_BASE_URL');
  const embApiKey = await readConfig('embedding_api_key', 'EMBEDDING_API_KEY');
  const embeddingModel = (await readConfig('embedding_model', 'EMBEDDING_MODEL')) || 'bge-m3';

  if (baseUrl && apiKey) {
    const llmProvider = new OpenAIChatProvider(baseUrl, apiKey, model);
    setLLMProvider(llmProvider);
    console.log(`[providers] LLM ready: ${baseUrl} (model: ${model})`);

    if (embBaseUrl && embApiKey && embeddingModel) {
      const embProvider = new OpenAIEmbeddingProvider(embBaseUrl, embApiKey);
      (embProvider as any).defaultModel = embeddingModel;
      setEmbeddingProvider(embProvider);
      console.log(`[providers] Embedding ready: ${embBaseUrl} (model: ${embeddingModel})`);
      
      // 预热：后台发送一次 embedding 请求加载模型到内存
      warmupEmbedding(embProvider, embeddingModel).then(() => { warmupDone = true; }).catch(() => {});
    } else {
      console.log('[providers] Embedding API 未独立配置 — 使用本地 n-gram 向量');
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

/** 预热 bge-m3：发送一次虚拟 embedding 请求，加载模型到内存 */
async function warmupEmbedding(provider: any, model: string) {
  const t0 = Date.now();
  try {
    await provider.embed({ model, texts: ['warmup'] });
    console.log(`[warmup] bge-m3 preheated (${Date.now() - t0}ms)`);
  } catch (e: any) {
    console.log(`[warmup] preheat failed (Ollama may not be running): ${e.message}`);
  }
}

let warmupDone = false;

async function start() {
  // 依赖注入：LLM + Embedding（先读 .env，再读 DB 覆盖）
  await initLLMProviders();

  await app.register(cors, { origin: true });
  await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB max
  await app.register(deckRoutes);
  await app.register(dashboardRoutes);
  await app.register(reviewRoutes);
  await app.register(studyRoutes);
  await app.register(cardRoutes);
  await app.register(migrationRoutes);
  await app.register(searchRoutes);
  await app.register(jobPrepRoutes);
  await app.register(maintenanceRoutes);
  await app.register(settingsRoutes);
  await app.register(statsRoutes);
  await app.register(learningPlanRoutes);
  await app.register(ingestRedirectRoutes);
  await app.register(documentRoutes);

  // 初始化 FTS5 索引
  initFTS5().catch(() => {});

  // 初始化向量存储
  await initVectorStore().catch((e) => console.warn('[vector] init failed:', e));

  app.get('/api/health', async () => ({ ok: true, warmupDone }));

  // ── 模型下载 ──
  let pullState: { status: 'idle' | 'pulling' | 'done' | 'error'; progress: number; message: string; error?: string } =
    { status: 'idle', progress: 0, message: '' };

  // 检查 bge-m3 是否已在本地 Ollama 中
  app.get('/api/models/bge-m3-status', async () => {
    try {
      const res = await fetch('http://localhost:11434/api/tags');
      if (!res.ok) return { available: false, reason: 'ollama_unreachable' };
      const data = await res.json() as any;
      const names: string[] = (data.models || []).map((m: any) => m.name);
      const has = names.some((n: string) => n.startsWith('bge-m3'));
      return { available: has, reason: has ? undefined : 'model_not_found' };
    } catch {
      return { available: false, reason: 'ollama_unreachable' };
    }
  });

  // 启动 bge-m3 下载（通过 Ollama HTTP API 流式拉取）
  app.post('/api/models/pull-bge-m3', async (_req, reply) => {
    if (pullState.status === 'pulling') {
      return reply.send({ ok: true, alreadyPulling: true, ...pullState });
    }
    pullState = { status: 'pulling', progress: 0, message: '正在连接 Ollama 服务...' };

    // 后台拉取
    (async () => {
      try {
        const res = await fetch('http://localhost:11434/api/pull', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'bge-m3', stream: true }),
        });
        if (!res.ok) throw new Error(`Ollama pull 返回 HTTP ${res.status}`);
        const reader = res.body?.getReader();
        if (!reader) throw new Error('无法读取拉取流');
        const decoder = new TextDecoder();
        let buf = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() || '';
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const j = JSON.parse(line);
              if (j.total && j.completed !== undefined) {
                pullState.progress = Math.min(100, Math.round((j.completed / j.total) * 100));
                pullState.message = j.status || '下载中...';
              }
            } catch { /* skip partial JSON */ }
          }
        }
        pullState = { status: 'done', progress: 100, message: '下载完成' };
        // 预热模型
        const provider = getEmbeddingProvider();
        if (provider) warmupEmbedding(provider, (provider as any).defaultModel || 'bge-m3').then(() => { warmupDone = true; }).catch(() => {});
      } catch (e: any) {
        pullState = { status: 'error', progress: pullState.progress, message: '', error: e.message };
      }
    })();

    return reply.send({ ok: true, ...pullState });
  });

  // 查询下载进度
  app.get('/api/models/pull-status', async () => pullState);

  // 手动预热端点（前端打开 AI 搜索时调用）
  app.post('/api/health/warmup', async () => {
    if (warmupDone) return { ok: true, warmupDone: true, message: 'already warm' };
    const provider = getEmbeddingProvider();
    if (!provider) return { ok: false, message: 'no embedding provider' };
    try {
      await warmupEmbedding(provider, (provider as any).defaultModel || 'bge-m3');
      warmupDone = true;
      return { ok: true, warmupDone: true };
    } catch (e: any) {
      return { ok: false, message: e.message };
    }
  });

  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`Backend running on http://localhost:${PORT}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
