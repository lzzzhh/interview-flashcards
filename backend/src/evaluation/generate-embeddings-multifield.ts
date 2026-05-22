// backend/src/evaluation/generate-embeddings-multifield.ts — 字段级多向量生成
//
// 每张卡片生成 4 个向量：title / question / answer / keyword
// 用法: cd backend && npx tsx src/evaluation/generate-embeddings-multifield.ts

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
import { getVectorStore, SqliteVecVectorStore, setVectorStore } from '../services/vector/vector-store';
import prisma from '../db/prisma';

const BATCH_SIZE = 10; // smaller batch since each card = 4 texts

function buildFieldTexts(card: any): { field: string; text: string }[] {
  const fields: { field: string; text: string }[] = [];

  // title vector: titleCn + title
  const titleText = [card.titleCn, card.title].filter(Boolean).join(' ');
  if (titleText.trim()) fields.push({ field: 'title', text: titleText });

  // question vector: question only
  if (card.question?.trim()) fields.push({ field: 'question', text: card.question });

  // answer vector: answer + description + approach
  const answerText = [card.answer, card.description, card.approach].filter(Boolean).join(' ');
  if (answerText.trim()) fields.push({ field: 'answer', text: answerText });

  // keyword vector: tags + searchKeywords
  const keywordText = [card.tags, card.searchKeywords].filter(Boolean).join(' ');
  if (keywordText.trim()) fields.push({ field: 'keyword', text: keywordText });

  return fields;
}

async function main() {
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

  const vecStore = new SqliteVecVectorStore();
  setVectorStore(vecStore);
  await vecStore.init();
  console.log('[embed] Vector store ready');

  // Get all cards with all searchable fields
  const cards = await prisma.$queryRawUnsafe(
    `SELECT id, titleCn, title, question, answer, description, approach, tags, searchKeywords FROM Card`
  ) as any[];

  console.log(`[embed] ${cards.length} cards × up to 4 fields`);

  // Clear existing ai-search module vectors
  await prisma.$executeRawUnsafe(`DELETE FROM ai_search_vec WHERE module = 'ai-search'`);
  console.log('[embed] Cleared existing vectors');

  let totalFields = 0;
  let done = 0;

  for (let i = 0; i < cards.length; i += BATCH_SIZE) {
    const batch = cards.slice(i, i + BATCH_SIZE);
    const allTexts: { cardId: string; field: string; text: string }[] = [];

    for (const card of batch) {
      const fields = buildFieldTexts(card);
      for (const f of fields) {
        allTexts.push({ cardId: card.id, field: f.field, text: f.text });
      }
    }

    if (allTexts.length === 0) continue;

    try {
      const texts = allTexts.map(t => t.text);
      const resp = await embProvider.embed({ model: embModel, texts });
      const items: { objectId: string; objectType: string; vector: number[]; field: string }[] = [];

      for (let j = 0; j < allTexts.length; j++) {
        if (resp.embeddings[j]) {
          items.push({
            objectId: allTexts[j].cardId,
            objectType: 'card',
            field: allTexts[j].field,
            vector: resp.embeddings[j],
          });
        }
      }

      if (items.length > 0) {
        await vecStore.upsertBatch(items);
      }

      totalFields += items.length;
      done += batch.length;
      const pct = Math.round((done / cards.length) * 100);
      process.stdout.write(`\r[embed] ${done}/${cards.length} cards (${pct}%) — ${totalFields} vectors`);
    } catch (err: any) {
      console.error(`\n[embed] Batch ${i}-${i + BATCH_SIZE} failed:`, err.message);
    }
  }

  console.log(`\n[embed] Done! ${totalFields} field vectors for ${done} cards`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
