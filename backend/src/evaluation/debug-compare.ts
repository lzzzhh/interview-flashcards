import { hybridSearch } from '../services/search/hybrid-search';
import { OpenAIEmbeddingProvider } from '../services/llm-provider';
import { setEmbeddingProvider } from '../services/llm-provider';
import { getVectorStore, setVectorStore, initVectorStore } from '../services/vector-store';
import { SqliteVecVectorStore } from '../services/sqlite-vec-vector-store';
import { initFTS5 } from '../services/search/fts5-search';
import { TEST_CASES } from './test-cases';
import { computeCaseResult } from './metrics';

async function main() {
  const embProvider = new OpenAIEmbeddingProvider('http://localhost:11434', 'ollama');
  (embProvider as any).defaultModel = 'bge-m3';
  setEmbeddingProvider(embProvider);
  setVectorStore(new SqliteVecVectorStore());
  await initVectorStore();
  await initFTS5();

  let hits = 0, total = 0;
  for (let i = 0; i < 10; i++) {
    const tc = TEST_CASES[i];
    const results = await hybridSearch({ query: tc.query, maxResults: 100, minScore: 0, candidateLimit: 500 });
    const cr = computeCaseResult(tc, results, 100);
    const f = cr.primaryHitTop15.length;
    const w = (tc.primaryIds || []).length;
    const ok = f > 0 ? '✓' : '✗';
    console.log(ok, tc.query.slice(0,50), `top15=${f}/${w}`, `totalHits=${results.length}`);
    if (f > 0) hits++;
    total++;
  }
  console.log(`\nHit: ${hits}/${total} = ${(hits/total*100).toFixed(1)}%`);
}
main().catch(console.error);
