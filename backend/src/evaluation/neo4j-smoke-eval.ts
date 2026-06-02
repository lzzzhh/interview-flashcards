// Quick smoke eval: 50 test cases, 3 branches
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
import { setLLMProvider, OpenAIChatProvider } from '../services/llm-provider';
import { getVectorStore, SqliteVecVectorStore, setVectorStore, initVectorStore } from '../services/vector/vector-store';
import { initFTS5 } from '../services/search/fts5-search';
import { hybridSearch } from '../services/search/hybrid-search';
import { neo4jHybridSearch } from '../services/search/neo4j-hybrid-search';
import { neo4jHybridSearchV2 } from '../services/search/neo4j-hybrid-search-v2';
import { TEST_CASES } from './test-cases';
import { computeCaseResult } from './metrics';
import { BASELINE_SEARCH_CONFIG } from './eval-config';
import { getMeta } from './benchmark-classification';

async function init() {
  setLLMProvider(new OpenAIChatProvider(process.env.LLM_BASE_URL!, process.env.LLM_API_KEY!));
  if (getVectorStore().name === 'noop') setVectorStore(new SqliteVecVectorStore());
  await initVectorStore();
  await initFTS5();
}

async function evalN(label: string, fn: any) {
  let top15=0, cc=0, missing=0, buried=0, mrrS=0, mrrC=0;
  const cases = TEST_CASES.filter(c => getMeta(c.query).benchmarkScope === 'search').slice(0, 50);
  for (const tc of cases) {
    const q = tc.normalizedQuery || tc.query;
    const hits = await fn({ query: q, maxResults: BASELINE_SEARCH_CONFIG.maxResults, minScore: BASELINE_SEARCH_CONFIG.minScore, candidateLimit: BASELINE_SEARCH_CONFIG.candidateLimit });
    const cr = computeCaseResult(tc, hits, 0);
    cc++;
    if (cr.primaryHitTop15.length > 0) top15++;
    missing += cr.primaryMissing.length;
    if (cr.primaryBuried?.length) buried += cr.primaryBuried.length;
    const ranks = (cr.expectationRanks || cr.primaryRanks).filter((r: number) => r > 0);
    if (ranks.length > 0) { mrrS += 1 / Math.min(...ranks); mrrC++; }
    if (cc % 10 === 0) process.stderr.write(`\r[${label}] ${cc}/50`);
  }
  process.stderr.write(`\r[${label}] ${cc}/50 done\n`);
  return { top15: top15/cc, mrr: mrrC>0?mrrS/mrrC:0, missing, buried, cc };
}

async function main() {
  await init();
  console.log('Running 50-case smoke eval...\n');
  const b = await evalN('baseline', hybridSearch);
  const v1 = await evalN('neo4j-v1', neo4jHybridSearch);
  const v2 = await evalN('neo4j-v2', neo4jHybridSearchV2);
  console.log('');
  console.log('Metric      Baseline     Neo4j-v1     Neo4j-v2     V2vsBase');
  console.log(`Top15       ${(b.top15*100).toFixed(1)}%         ${(v1.top15*100).toFixed(1)}%         ${(v2.top15*100).toFixed(1)}%         ${(v2.top15-b.top15>0?'+':'')}${((v2.top15-b.top15)*100).toFixed(1)}pp`);
  console.log(`MRR         ${b.mrr.toFixed(3)}        ${v1.mrr.toFixed(3)}        ${v2.mrr.toFixed(3)}        ${(v2.mrr-b.mrr>0?'+':'')}${(v2.mrr-b.mrr).toFixed(3)}`);
  console.log(`Missing     ${b.missing}           ${v1.missing}           ${v2.missing}           ${v2.missing-b.missing>0?'+':''}${v2.missing-b.missing}`);
  console.log(`Buried      ${b.buried}           ${v1.buried}           ${v2.buried}           ${v2.buried-b.buried>0?'+':''}${v2.buried-b.buried}`);
  console.log(`\nCases: ${b.cc}`);
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
