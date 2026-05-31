// backend/src/routes/settings.ts — API 配置（运行时读写）

import { FastifyInstance } from 'fastify';
import prisma from '../db/prisma';
import { setLLMProvider, OpenAIChatProvider } from '../services/llm-provider';
import { setEmbeddingProvider, OpenAIEmbeddingProvider } from '../services/embedding-provider';

/** 从数据库读取配置值 */
async function getConfig(key: string): Promise<string | null> {
  const row = await prisma.appConfig.findUnique({ where: { key } });
  return row?.value ?? null;
}

/** 写入配置 */
async function setConfig(key: string, value: string): Promise<void> {
  await prisma.appConfig.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

/** 重新初始化 LLM/Embedding Provider */
function reinitProviders() {
  Promise.all([
    getConfig('llm_base_url'),
    getConfig('llm_api_key'),
    getConfig('llm_model'),
    getConfig('embedding_model'),
  ]).then(([baseUrl, apiKey, model, embeddingModel]) => {
    if (baseUrl && apiKey) {
      const provider = new OpenAIChatProvider(baseUrl, apiKey, model || 'deepseek-chat');
      setLLMProvider(provider);

      // DeepSeek 不原生支持 embedding，但仍可尝试
      const embProvider = new OpenAIEmbeddingProvider(baseUrl, apiKey);
      (embProvider as any).defaultModel = embeddingModel || 'text-embedding-3-small';
      setEmbeddingProvider(embProvider);

      console.log(`[settings] Providers reinitialized: ${baseUrl} (${model})`);
    }
  }).catch(() => {});
}

export async function settingsRoutes(app: FastifyInstance) {
  // 获取所有配置（脱敏）
  app.get('/api/settings', async () => {
    const keys = ['llm_base_url', 'llm_api_key', 'llm_model', 'embedding_model'];
    const configs = await prisma.appConfig.findMany({
      where: { key: { in: keys } },
    });
    const map: Record<string, string> = {};
    for (const c of configs) map[c.key] = c.value;

    return {
      baseUrl: map['llm_base_url'] || process.env.LLM_BASE_URL || '',
      model: map['llm_model'] || process.env.LLM_MODEL || 'deepseek-chat',
      embeddingModel: map['embedding_model'] || process.env.EMBEDDING_MODEL || '',
      hasKey: !!(map['llm_api_key'] || process.env.LLM_API_KEY),
      // 不返回完整 key，只返回是否已设置
    };
  });

  // 更新配置
  app.post('/api/settings', async (req, reply) => {
    const body = req.body as any;

    if (body.baseUrl) await setConfig('llm_base_url', body.baseUrl);
    if (body.apiKey) await setConfig('llm_api_key', body.apiKey);
    if (body.model) await setConfig('llm_model', body.model);
    if (body.embeddingModel) await setConfig('embedding_model', body.embeddingModel);

    // 重新初始化 provider
    reinitProviders();

    return { ok: true };
  });
}
