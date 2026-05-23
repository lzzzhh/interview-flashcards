// Quick buried diagnosis — top buried cards at rank 16-30 with score breakdown
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

async function init() {
  const bu = process.env.LLM_BASE_URL, ak = process.env.LLM_API_KEY;
  if (bu && ak) setLLMProvider(new OpenAIChatProvider(bu, ak));
  const ebu = process.env.EMBEDDING_BASE_URL, eak = process.env.EMBEDDING_API_KEY;
  if (ebu && eak) setEmbeddingProvider(new OpenAIEmbeddingProvider(ebu, eak));
  if (getVectorStore().name === 'noop') setVectorStore(new SqliteVecVectorStore());
  await initVectorStore(); await initFTS5();
}

async function main() {
  console.error('[buried-diag] init...');
  await init();

  const targets = ['agent-10','ml-126','stats-102','ml-134','ml-136','stats-136','agent-2','agent-25','ml-142','ml-157','stats-24','ml-176','llm-26','ml-10','ml-138','stats-180','llm-12','ml-104','ml-110'];

  for (const cardId of targets) {
    // Find a test case where this card is buried
    let found = false;
    for (const tc of TEST_CASES) {
      if (!tc || !tc.primaryIds || !tc.primaryIds.includes(cardId)) continue;
      const hits = await hybridSearch({ query: tc.query, maxResults: 100, minScore: 0, candidateLimit: 500 });
      const result = computeCaseResult(tc, hits, 0);
      const rank = result.rankedIds.indexOf(cardId);
      if (rank < 0 || rank > 30 || rank < 15) continue;

      const hit = hits[rank];
      const sb = hit?.scoreBreakdown;
      console.log(cardId + ' rank=' + (rank+1) + ' score=' + hit.score.toFixed(3) + ' group=' + tc.group + ' \"' + tc.query.slice(0,40) + '\"');
      if (sb) {
        console.log('  v=' + sb.vectorScore.toFixed(3) + ' kw=' + sb.keywordScore.toFixed(3) + ' field=' + sb.fieldBoost.toFixed(3) + ' learn=' + sb.learningBoost.toFixed(3) + ' deckB=' + sb.deckBoost.toFixed(3) + ' lex=' + sb.lexicalBoost.toFixed(3));
      }
      // Show top 3 competing above
      for (let j = 0; j < Math.min(rank, 3); j++) {
        const h = hits[j];
        console.log('  > #' + (j+1) + ' ' + h.cardId + ' ' + h.deckId + ' score=' + h.score.toFixed(3) + ' \"' + h.title.slice(0,40) + '\"');
      }
      console.log('');
      found = true;
      break;
    }
    if (!found) console.error(cardId + ': no rank 16-30 case found\n');
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
