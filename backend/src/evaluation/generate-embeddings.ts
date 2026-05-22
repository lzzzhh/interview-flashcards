// backend/src/evaluation/generate-embeddings.ts — 全量生成 bge-m3 卡片向量
//
// 用法: cd backend && npx tsx src/evaluation/generate-embeddings.ts

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 手动加载 .env
function loadEnv() {
  const envPath = resolve(__dirname, '../../.env');
  try {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}
loadEnv();

import { setEmbeddingProvider, OpenAIEmbeddingProvider } from '../services/embedding-provider';
import { getVectorStore, SqliteVecVectorStore, setVectorStore, initVectorStore } from '../services/vector/vector-store';
import prisma from '../db/prisma';

const BATCH_SIZE = 20;

/** 构建卡片搜索文本（与 hybrid-search 保持一致） */
function buildCardText(card: any): string {
  return [
    card.titleCn,
    card.title,
    card.question,
    card.answer,
    card.description,
    card.approach,
    card.tags,
    card.searchKeywords,
  ].filter(Boolean).join(' ');
}

async function main() {
  // Init embedding provider
  const embBaseUrl = process.env.EMBEDDING_BASE_URL;
  const embApiKey = process.env.EMBEDDING_API_KEY;
  const embModel = process.env.EMBEDDING_MODEL || 'bge-m3';

  if (!embBaseUrl || !embApiKey) {
    console.error('[embed] EMBEDDING_BASE_URL and EMBEDDING_API_KEY required');
    process.exit(1);
  }

  const embProvider = new OpenAIEmbeddingProvider(embBaseUrl, embApiKey);
  (embProvider as any).defaultModel = embModel;
  setEmbeddingProvider(embProvider);
  console.log(`[embed] Provider: ${embBaseUrl} (${embModel})`);

  // Init vector store
  const vecStore = new SqliteVecVectorStore();
  setVectorStore(vecStore);
  await vecStore.init();
  console.log('[embed] Vector store ready');

  // Get all cards
  const cards = await prisma.$queryRawUnsafe(
    `SELECT id, titleCn, title, question, answer, description, approach, tags, searchKeywords FROM Card`
  ) as any[];

  console.log(`[embed] ${cards.length} cards to embed`);

  // Clear existing
  await prisma.$executeRawUnsafe(`DELETE FROM ai_search_vec WHERE module = 'ai-search'`);
  console.log('[embed] Cleared existing vectors');

  // Batch embed
  let done = 0;
  for (let i = 0; i < cards.length; i += BATCH_SIZE) {
    const batch = cards.slice(i, i + BATCH_SIZE);
    const texts = batch.map(buildCardText);

    try {
      const resp = await embProvider.embed({ model: embModel, texts });
      const items: { objectId: string; objectType: string; vector: number[] }[] = [];

      for (let j = 0; j < batch.length; j++) {
        if (resp.embeddings[j]) {
          items.push({
            objectId: batch[j].id,
            objectType: 'card',
            vector: resp.embeddings[j],
          });
        }
      }

      if (items.length > 0) {
        await vecStore.upsertBatch(items);
      }

      done += batch.length;
      const pct = Math.round((done / cards.length) * 100);
      process.stdout.write(`\r[embed] ${done}/${cards.length} (${pct}%)`);
    } catch (err: any) {
      console.error(`\n[embed] Batch ${i}-${i + BATCH_SIZE} failed:`, err.message);
    }
  }

  console.log(`\n[embed] Done! ${done} vectors stored`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
