import { readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
(function loadEnv() {
  const p = __dirname + '/../../.env';
  try { for (const l of readFileSync(p,'utf-8').split('\n')) {
    const t = l.trim(); if (!t||t.startsWith('#')) continue;
    const eq = t.indexOf('='); if (eq<0) continue;
    if (!process.env[t.slice(0,eq).trim()]) process.env[t.slice(0,eq).trim()] = t.slice(eq+1).trim();
  }} catch {}
})();

import { setEmbeddingProvider, OpenAIEmbeddingProvider } from '../services/embedding-provider';
import { getVectorStore, SqliteVecVectorStore, setVectorStore, initVectorStore } from '../services/vector/vector-store';
import { initFTS5, rebuildFTS5 } from '../services/search/fts5-search';
import prisma from '../db/prisma';

async function main() {
  setEmbeddingProvider(new OpenAIEmbeddingProvider(process.env.EMBEDDING_BASE_URL!, process.env.EMBEDDING_API_KEY!));
  if (getVectorStore().name === 'noop') setVectorStore(new SqliteVecVectorStore());
  await initVectorStore();
  await initFTS5();

  const before = await prisma.$queryRawUnsafe('SELECT COUNT(*) as c FROM card_fts') as any[];
  console.log('Before:', Number(before[0].c));

  await rebuildFTS5();

  const after = await prisma.$queryRawUnsafe('SELECT COUNT(*) as c FROM card_fts') as any[];
  console.log('After:', Number(after[0].c));

  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
