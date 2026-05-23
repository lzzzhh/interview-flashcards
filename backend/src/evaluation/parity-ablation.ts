// Quick parity: run the FIXED ablation baseline on 15 queries
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

import { setLLMProvider, OpenAIChatProvider } from '../services/llm-provider';
import { setEmbeddingProvider, OpenAIEmbeddingProvider } from '../services/embedding-provider';
import { getVectorStore, SqliteVecVectorStore, setVectorStore, initVectorStore } from '../services/vector/vector-store';
import { initFTS5 } from '../services/search/fts5-search';
import { hybridSearch } from '../services/search/hybrid-search';
import { TEST_CASES } from './test-cases';
import { computeCaseResult } from './metrics';

async function init() {
  const llmProvider = new OpenAIChatProvider(process.env.LLM_BASE_URL!, process.env.LLM_API_KEY!);
  (llmProvider as any).defaultModel = process.env.LLM_MODEL || 'deepseek-chat';
  setLLMProvider(llmProvider);
  const ep = new OpenAIEmbeddingProvider(process.env.EMBEDDING_BASE_URL!, process.env.EMBEDDING_API_KEY!);
  (ep as any).defaultModel = process.env.EMBEDDING_MODEL || 'bge-m3';
  setEmbeddingProvider(ep);
  if (getVectorStore().name === 'noop') setVectorStore(new SqliteVecVectorStore());
  await initVectorStore();
  await initFTS5();
}

async function main() {
  await init();
  for (let i = 0; i < 15; i++) {
    const tc = TEST_CASES[i];
    const hits = await hybridSearch({ query: tc.query, maxResults: 100, minScore: 0, candidateLimit: 500 });
    const cr = computeCaseResult(tc, hits, 0);
    const isLP = tc.group === 'learning-path';
    const ok = isLP ? 'LP' : (cr.primaryMissing.length === 0 ? '✓' : '✗');
    console.log(`${ok} A "${tc.query.slice(0,45)}" | top15=${cr.primaryHitTop15.length}/${(tc.primaryIds||[]).length} | miss=[${cr.primaryMissing.join(',')}]`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
