// backend/src/evaluation/neo4j-release-gate-v2.ts
// Four-way comparison: Baseline vs Neo4j-v1 vs Neo4j-v2 vs Neo4j-v3-soft-rerank
// Usage: npm run evaluate:neo4j-gate (for v1) or this file for three-way

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
import { setEmbeddingProvider, OpenAIEmbeddingProvider } from '../services/embedding-provider';
import { getVectorStore, SqliteVecVectorStore, setVectorStore, initVectorStore } from '../services/vector/vector-store';
import { initFTS5 } from '../services/search/fts5-search';
import { hybridSearch } from '../services/search/hybrid-search';
import { neo4jHybridSearch } from '../services/search/neo4j-hybrid-search';
import { neo4jHybridSearchV2 } from '../services/search/neo4j-hybrid-search-v2';
import { neo4jHybridSearchV3 } from '../services/search/neo4j-hybrid-search-v3';
import { TEST_CASES } from './test-cases';
import { computeCaseResult } from './metrics';
import { BASELINE_SEARCH_CONFIG } from './eval-config';
import { getMeta } from './benchmark-classification';

interface EvalResult {
  top15: number;
  mrr: number;
  missing: number;
  buried: number;
  caseCount: number;
}

async function init() {
  const llm = new OpenAIChatProvider(process.env.LLM_BASE_URL!, process.env.LLM_API_KEY!);
  (llm as any).defaultModel = process.env.LLM_MODEL || 'deepseek-chat';
  setLLMProvider(llm);
  if (process.env.EMBEDDING_BASE_URL && process.env.EMBEDDING_API_KEY) {
    const ep = new OpenAIEmbeddingProvider(process.env.EMBEDDING_BASE_URL!, process.env.EMBEDDING_API_KEY!);
    (ep as any).defaultModel = process.env.EMBEDDING_MODEL || 'bge-m3';
    setEmbeddingProvider(ep);
  }
  if (getVectorStore().name === 'noop') setVectorStore(new SqliteVecVectorStore());
  await initVectorStore();
  await initFTS5();
}

async function runEval(label: string, searchFn: (query: string) => Promise<any[]>): Promise<EvalResult> {
  let top15Hits = 0;
  let caseCount = 0;
  let totalMissing = 0;
  let totalBuried = 0;
  let mrrSum = 0;
  let mrrCount = 0;

  for (const tc of TEST_CASES) {
    const meta = getMeta(tc.query);
    if (meta.benchmarkScope !== 'search') continue;

    const searchQuery = tc.normalizedQuery || tc.query;
    const hits = await searchFn(searchQuery);
    const cr = computeCaseResult(tc, hits, 0);

    caseCount++;
    if (cr.primaryHitTop15.length > 0) top15Hits++;
    totalMissing += cr.primaryMissing.length;
    if (cr.primaryBuried?.length) totalBuried += cr.primaryBuried.length;

    const ranks = (cr.expectationRanks || cr.primaryRanks).filter((r: number) => r > 0);
    if (ranks.length > 0) { mrrSum += 1 / Math.min(...ranks); mrrCount++; }

    if (caseCount % 50 === 0) process.stdout.write(`\r[${label}] ${caseCount} cases...`);
  }
  process.stdout.write(`\r[${label}] ${caseCount} cases complete.\n`);
  return { top15: top15Hits / caseCount, mrr: mrrCount > 0 ? mrrSum / mrrCount : 0, missing: totalMissing, buried: totalBuried, caseCount };
}

async function main() {
  await init();
  console.log('='.repeat(80));
  console.log('NEO4J V3 SOFT RERANK — Four-Way Comparison');
  console.log('='.repeat(80));
  console.log('');

  // Run all three
  const baseline = await runEval('baseline', async (q) =>
    hybridSearch({ query: q, maxResults: BASELINE_SEARCH_CONFIG.maxResults, minScore: BASELINE_SEARCH_CONFIG.minScore, candidateLimit: BASELINE_SEARCH_CONFIG.candidateLimit }));
  const neo4jV1 = await runEval('neo4j-v1', async (q) =>
    neo4jHybridSearch({ query: q, maxResults: BASELINE_SEARCH_CONFIG.maxResults, minScore: BASELINE_SEARCH_CONFIG.minScore, candidateLimit: BASELINE_SEARCH_CONFIG.candidateLimit }));
  const neo4jV2 = await runEval('neo4j-v2', async (q) =>
    neo4jHybridSearchV2({ query: q, maxResults: BASELINE_SEARCH_CONFIG.maxResults, minScore: BASELINE_SEARCH_CONFIG.minScore, candidateLimit: BASELINE_SEARCH_CONFIG.candidateLimit }));
  const neo4jV3 = await runEval('neo4j-v3', async (q) =>
    neo4jHybridSearchV3({ query: q, maxResults: BASELINE_SEARCH_CONFIG.maxResults, minScore: BASELINE_SEARCH_CONFIG.minScore, candidateLimit: BASELINE_SEARCH_CONFIG.candidateLimit }));

  // Print results
  console.log('\n' + '='.repeat(80));
  console.log('RESULTS');
  console.log('='.repeat(80));
  console.log(`${'Metric'.padEnd(12)} ${'Baseline'.padEnd(14)} ${'Neo4j-v1'.padEnd(14)} ${'Neo4j-v2'.padEnd(14)} ${'Neo4j-v3'.padEnd(14)}`);
  console.log('-'.repeat(80));

  const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const fmt3 = (v: number) => v.toFixed(3);

  for (const [name, baseV, v1V, v2V, v3V, higher] of [
    ['Top15', baseline.top15, neo4jV1.top15, neo4jV2.top15, neo4jV3.top15, true],
    ['MRR', baseline.mrr, neo4jV1.mrr, neo4jV2.mrr, neo4jV3.mrr, true],
    ['Missing', baseline.missing, neo4jV1.missing, neo4jV2.missing, neo4jV3.missing, false],
    ['Buried', baseline.buried, neo4jV1.buried, neo4jV2.buried, neo4jV3.buried, false],
  ] as const) {
    const fmt = name === 'MRR' ? (v: number) => v.toFixed(3) : (name === 'Top15' ? (v: number) => `${(v*100).toFixed(1)}%` : String);
    console.log(
      `${String(name).padEnd(12)} ${String(fmt(baseV as never)).padEnd(14)} ${String(fmt(v1V as never)).padEnd(14)} ${String(fmt(v2V as never)).padEnd(14)} ${String(fmt(v3V as never)).padEnd(14)}`
    );
  }

  console.log('\n' + '='.repeat(80));
  console.log('V3 FEATURES ACTIVE');
  console.log('='.repeat(80));
  console.log('  Soft gating:           threshold=0.08, below -> x0.35 (not zero)');
  console.log('  Graph boost cap:       0.25');
  console.log('  Diversity penalty:     OFF');
  console.log('  Soft promote:          direct/alias only, rank 16-40 -> 8-15, +0.04');
  console.log(`  Gate target:            Top15>=87%, MRR>=0.62, Buried<=120, Missing<=60`);
  console.log('='.repeat(80));

  const passed = neo4jV3.top15 >= 0.87 && neo4jV3.mrr >= 0.62;
  console.log(passed ? 'PASS — Ready for Job Prep Agent integration' : 'NOT YET — Keep tuning');
  console.log(`Baseline:  Top15=${(baseline.top15*100).toFixed(1)}% MRR=${baseline.mrr.toFixed(3)}`);
  console.log(`Neo4j-v1:  Top15=${(neo4jV1.top15*100).toFixed(1)}% MRR=${neo4jV1.mrr.toFixed(3)}`);
  console.log(`Neo4j-v2:  Top15=${(neo4jV2.top15*100).toFixed(1)}% MRR=${neo4jV2.mrr.toFixed(3)}`);
  console.log(`Neo4j-v3:  Top15=${(neo4jV3.top15*100).toFixed(1)}% MRR=${neo4jV3.mrr.toFixed(3)}`);
  console.log('='.repeat(80));

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(2); });
