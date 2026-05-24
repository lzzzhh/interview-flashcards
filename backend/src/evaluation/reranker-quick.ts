// Quick reranker sanity check on 5 blind_spot queries
import { execSync } from 'child_process';
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

import prisma from '../db/prisma';
import { setEmbeddingProvider, OpenAIEmbeddingProvider } from '../services/embedding-provider';
import { getVectorStore, SqliteVecVectorStore, setVectorStore, initVectorStore } from '../services/vector/vector-store';
import { initFTS5 } from '../services/search/fts5-search';
import { hybridSearch } from '../services/search/hybrid-search';

async function init() {
  const ep = new OpenAIEmbeddingProvider(process.env.EMBEDDING_BASE_URL!, process.env.EMBEDDING_API_KEY!);
  (ep as any).defaultModel = process.env.EMBEDDING_MODEL || 'bge-m3';
  setEmbeddingProvider(ep);
  if (getVectorStore().name === 'noop') setVectorStore(new SqliteVecVectorStore());
  await initVectorStore();
  await initFTS5();
}

async function main() {
  await init();
  const queries: [string, string[]][] = [
    ['为什么要shuffle数据', ['stats-187']],
    ['CLIP多模态对比学习', ['ml-119','ml-122']],
    ['Chain-of-Thought在GPT4中', ['llm-11']],
    ['few-shot为什么给例子就能学', ['ml-110']],
    ['Momentum为什么能加速收敛', ['dl-30']],
  ];

  const pyPath = '/opt/anaconda3/bin/python3';

  for (const [query, targetIds] of queries) {
    const hits = await hybridSearch({ query, maxResults: 100, minScore: 0, candidateLimit: 500 });
    const top50 = hits.slice(0, 50);

    console.log(`\n── ${query.slice(0,30)} ──`);

    // Baseline ranks
    for (const tid of targetIds) {
      const idx = top50.findIndex((h: any) => h.cardId === tid);
      console.log(`  Baseline: ${tid} rank=${idx >= 0 ? idx+1 : 'miss'} score=${idx >= 0 ? top50[idx].score?.toFixed(3) : '-'}`);
    }

    // bge-reranker-v2-m3
    const docs = top50.map((h: any) => 
      `${(h as any).titleCn || h.title || ''} ${h.question || ''} ${h.tags?.join(' ')||''}`.slice(0, 300)
    );

    const script = `
from sentence_transformers import CrossEncoder
import json
model = CrossEncoder("BAAI/bge-reranker-v2-m3", device="mps")
query = ${JSON.stringify(query)}
docs = ${JSON.stringify(docs)}
pairs = [[query, doc] for doc in docs]
scores = model.predict(pairs, show_progress_bar=False)
scored = sorted(enumerate(scores.tolist()), key=lambda x: -x[1])
print(json.dumps({"results": [{"index": i, "score": float(s)} for i, s in scored[:15]]}))
`;
    try {
      const out = execSync(`${pyPath} -c "${script.replace(/"/g, '\\"')}"`, { timeout: 30_000, maxBuffer: 10_000_000 });
      const rr = JSON.parse(out.toString().trim());
      for (const tid of targetIds) {
        const idx = top50.findIndex((h: any) => h.cardId === tid);
        if (idx >= 0) {
          const rrIdx = rr.results.findIndex((r: any) => r.index === idx);
          console.log(`  Reranker: ${tid} rerank-rank=${rrIdx >= 0 ? rrIdx+1 : 'miss'} rerank-score=${rrIdx >= 0 ? rr.results[rrIdx].score.toFixed(4) : '-'}`);
        }
      }
    } catch (e: any) {
      console.error(`  Error: ${e.message?.slice(0, 60)}`);
    }
  }
  await prisma.$disconnect();
}

main();
