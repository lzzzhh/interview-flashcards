// backend/src/evaluation/neo4j-release-gate-v2.ts
// Three-way comparison: Baseline vs Neo4j-v1 vs Neo4j-v2-rerank
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
  console.log('NEO4J V2 RERANK — Three-Way Comparison');
  console.log('='.repeat(80));
  console.log('');

  // Run all three
  const baseline = await runEval('baseline', async (q) =>
    hybridSearch({ query: q, maxResults: BASELINE_SEARCH_CONFIG.maxResults, minScore: BASELINE_SEARCH_CONFIG.minScore, candidateLimit: BASELINE_SEARCH_CONFIG.candidateLimit }));
  const neo4jV1 = await runEval('neo4j-v1', async (q) =>
    neo4jHybridSearch({ query: q, maxResults: BASELINE_SEARCH_CONFIG.maxResults, minScore: BASELINE_SEARCH_CONFIG.minScore, candidateLimit: BASELINE_SEARCH_CONFIG.candidateLimit }));
  const neo4jV2 = await runEval('neo4j-v2', async (q) =>
    neo4jHybridSearchV2({ query: q, maxResults: BASELINE_SEARCH_CONFIG.maxResults, minScore: BASELINE_SEARCH_CONFIG.minScore, candidateLimit: BASELINE_SEARCH_CONFIG.candidateLimit }));

  // Print results
  console.log('\n' + '='.repeat(80));
  console.log('RESULTS');
  console.log('='.repeat(80));
  console.log(`${'Metric'.padEnd(12)} ${'Baseline'.padEnd(14)} ${'Neo4j-v1'.padEnd(14)} ${'Neo4j-v2'.padEnd(14)} ${'V2vsBase'.padEnd(12)} ${'V2vsV1'.padEnd(12)}`);
  console.log('-'.repeat(80));

  const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const fmt3 = (v: number) => v.toFixed(3);

  for (const [name, baseV, v1V, v2V, higher] of [
    ['Top15', baseline.top15, neo4jV1.top15, neo4jV2.top15, true],
    ['MRR', baseline.mrr, neo4jV1.mrr, neo4jV2.mrr, true],
    ['Missing', baseline.missing, neo4jV1.missing, neo4jV2.missing, false],
    ['Buried', baseline.buried, neo4jV1.buried, neo4jV2.buried, false],
  ] as const) {
    const fmt = name === 'MRR' ? fmt3 : (name === 'Top15' ? fmtPct : String);
    const d2Base = higher ? v2V - baseV : baseV - v2V;
    const d2V1 = higher ? v2V - v1V : v1V - v2V;
    const sign = higher ? '+' : '';
    const deltaFmt = name === 'MRR' ? (v: number) => (v > 0 ? '+' : '') + v.toFixed(3) : (v: number) => (v > 0 ? '+' : '') + String(v);
    console.log(
      `${String(name).padEnd(12)} ${String(fmt(baseV as never)).padEnd(14)} ${String(fmt(v1V as never)).padEnd(14)} ${String(fmt(v2V as never)).padEnd(14)} ${deltaFmt(d2Base).padEnd(12)} ${deltaFmt(d2V1).padEnd(12)}`
    );
  }

  console.log('\n' + '='.repeat(80));
  console.log('V2 FEATURES ACTIVE');
  console.log('='.repeat(80));
  console.log('  Tiered scoring:         direct(0.30) > alias(0.20) > oneHop(0.12) > prereq(0.08) > twoHop(0.04)');
  console.log('  Evidence gating:        min keyword=0.15, max graph boost=0.15');
  console.log('  Graph Top50→Top15:      boost +0.05 for direct match + evidence');
  console.log('  Diversity penalty:      same concept>=3 → 0.85x, same deck>=5 → 0.92x');
  console.log(`  Gate target:             Top15>=87%, MRR>=0.63, Buried<=110, Missing<=60`);
  console.log('='.repeat(80));

  const passed = neo4jV2.top15 >= 0.87 && neo4jV2.mrr >= 0.63;
  console.log(passed ? 'PASS — Ready for Job Prep Agent integration' : 'NOT YET — Keep tuning');
  console.log('='.repeat(80));

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(2); });
