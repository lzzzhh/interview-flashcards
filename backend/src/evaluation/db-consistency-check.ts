#!/usr/bin/env npx tsx
// backend/src/evaluation/db-consistency-check.ts
// Verify DB state consistency between runs. Uses Prisma.

import { readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
function loadEnv() {
  const p = __dirname + '/../../.env';
  try { for (const l of readFileSync(p,'utf-8').split('\n')) {
    const t = l.trim(); if (!t||t.startsWith('#')) continue;
    const eq = t.indexOf('='); if (eq<0) continue;
    if (!process.env[t.slice(0,eq).trim()]) process.env[t.slice(0,eq).trim()] = t.slice(eq+1).trim();
  }} catch {}
}
loadEnv();

import prisma from '../db/prisma';
import { setLLMProvider, OpenAIChatProvider } from '../services/llm-provider';
import { setEmbeddingProvider, OpenAIEmbeddingProvider } from '../services/embedding-provider';
import { getVectorStore, SqliteVecVectorStore, setVectorStore, initVectorStore } from '../services/vector/vector-store';
import { initFTS5 } from '../services/search/fts5-search';
import { TEST_CASES } from './test-cases';

async function main() {
  // Init providers like main runner
  const llmProvider = new OpenAIChatProvider(process.env.LLM_BASE_URL!, process.env.LLM_API_KEY!);
  (llmProvider as any).defaultModel = process.env.LLM_MODEL || 'deepseek-chat';
  setLLMProvider(llmProvider);
  const ep = new OpenAIEmbeddingProvider(process.env.EMBEDDING_BASE_URL!, process.env.EMBEDDING_API_KEY!);
  (ep as any).defaultModel = process.env.EMBEDDING_MODEL || 'bge-m3';
  setEmbeddingProvider(ep);

  if (getVectorStore().name === 'noop') setVectorStore(new SqliteVecVectorStore());
  await initVectorStore();
  await initFTS5();

  console.log('═'.repeat(60));
  console.log('DB CONSISTENCY CHECK');
  console.log('═'.repeat(60));
  console.log('  DATABASE_URL:', process.env.DATABASE_URL || '(default)');
  console.log('  embedding:', process.env.EMBEDDING_BASE_URL, '/', process.env.EMBEDDING_MODEL);
  console.log('  vector store:', getVectorStore().name);

  // Card count
  const cardCount = await prisma.card.count();
  console.log('  Card count:', cardCount);

  // AI-search-eligible cards (all cards with vector entries)
  const eligible = await prisma.$queryRawUnsafe(
    "SELECT COUNT(DISTINCT object_id) as c FROM ai_search_vec WHERE object_type = 'card'"
  ) as any[];
  console.log('  AI-search eligible cards:', Number(eligible[0].c));

  // card_fts count (raw SQL)
  const ftsResult = await prisma.$queryRawUnsafe('SELECT COUNT(*) as c FROM card_fts') as any[];
  console.log('  card_fts count:', Number(ftsResult[0].c));

  // ai_search_vec count
  const vecResult = await prisma.$queryRawUnsafe(
    "SELECT COUNT(*) as c FROM ai_search_vec WHERE object_type = 'card'"
  ) as any[];
  console.log('  ai_search_vec count:', Number(vecResult[0].c));

  // PrimaryIds check
  const allPrimaryIds = new Set<string>();
  for (const tc of TEST_CASES) {
    for (const pid of tc.primaryIds || []) allPrimaryIds.add(pid);
  }
  const missingCards: string[] = [];
  for (const pid of allPrimaryIds) {
    const row = await prisma.card.findUnique({ where: { id: pid }, select: { id: true } });
    if (!row) missingCards.push(pid);
  }
  console.log('  Unique primaryIds:', allPrimaryIds.size);
  console.log('  Missing primaryIds in DB:', missingCards.length,
    missingCards.length > 0 ? `[${missingCards.join(', ')}]` : '✓');

  // Cards without searchKeywords
  const noKw = await prisma.card.count({
    where: {
      OR: [
        { searchKeywords: null },
        { searchKeywords: '' },
      ]
    }
  });
  console.log('  Cards without searchKeywords:', noKw);

  // Sample vector check
  const vecSample = await prisma.$queryRawUnsafe(
    "SELECT object_id FROM ai_search_vec WHERE object_type = 'card' LIMIT 3"
  ) as any[];
  console.log('  Sample vectored cards:', vecSample.map((r: any) => r.object_id).join(', '));

  await prisma.$disconnect();
  console.log('═'.repeat(60));
}

main().catch(e => { console.error(e); process.exit(1); });
