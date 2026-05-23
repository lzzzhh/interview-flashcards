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

import { setLLMProvider, OpenAIChatProvider } from '../services/llm-provider';
import { setEmbeddingProvider, OpenAIEmbeddingProvider } from '../services/embedding-provider';
import { getVectorStore, SqliteVecVectorStore, setVectorStore, initVectorStore } from '../services/vector/vector-store';
import { initFTS5 } from '../services/search/fts5-search';
import { hybridSearch } from '../services/search/hybrid-search';
import { TEST_CASES } from './test-cases';
import { computeCaseResult } from './metrics';
import { execSync } from 'child_process';

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

  const gitHash = execSync('git rev-parse --short HEAD').toString().trim();

  console.log('═'.repeat(70));
  console.log('RUNNER PARITY CHECK');
  console.log('═'.repeat(70));
  console.log('  git commit:', gitHash);
  console.log('  DATABASE_URL:', process.env.DATABASE_URL || '(default)');
  console.log('  embedding:', process.env.EMBEDDING_BASE_URL, '/', process.env.EMBEDDING_MODEL);
  console.log('  candidateLimit: 500');
  console.log('  maxResults: 100');
  console.log('  minScore: 0');
  console.log('  test cases:', TEST_CASES.length);
  const isLP = (g: string) => g === 'learning-path' || g.startsWith('学习路径');
  const searchCases = TEST_CASES.filter(tc => !isLP(tc.group));
  const lpCases = TEST_CASES.filter(tc => isLP(tc.group));
  console.log('  search cases:', searchCases.length);
  console.log('  learning-path cases:', lpCases.length);
  console.log('═'.repeat(70));

  for (let i = 0; i < 15; i++) {
    const tc = TEST_CASES[i];
    const hits = await hybridSearch({ query: tc.query, maxResults: 100, minScore: 0, candidateLimit: 500 });
    const cr = computeCaseResult(tc, hits, 0);
    const top15Ids = cr.primaryHitTop15;
    const missingIds = cr.primaryMissing;
    const buriedIds = cr.primaryBuried;
    const ok = tc.group === 'learning-path' ? 'LP' : (cr.primaryMissing.length === 0 ? '✓' : '✗');
    console.log(`${ok} "${tc.query.slice(0,45)}" | group=${tc.group} | top15=${top15Ids.length}/${(tc.primaryIds||[]).length} | missing=[${missingIds.join(',')}] | buried=[${buriedIds.join(',')}]`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
