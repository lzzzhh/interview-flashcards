// backend/src/evaluation/neo4j-release-gate.ts
// Side-by-side evaluation: baseline (static graph) vs Neo4j graph-enhanced search.
// Usage: npm run evaluate:neo4j-gate

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
import { neo4jHybridSearchV4 } from '../services/search/neo4j-hybrid-search-v4';
import { isNeo4jAvailable, getNeo4jStatus } from '../services/neo4j/neo4j-client';
import { TEST_CASES } from './test-cases';
import { computeCaseResult } from './metrics';
import { BASELINE_SEARCH_CONFIG } from './eval-config';
import { getMeta } from './benchmark-classification';

const BASELINE = {
  top15: 0.886,
  mrr: 0.674,
  missing: 25,
};

interface EvalResult {
  top15: number;
  mrr: number;
  missing: number;
  buried: number;
  caseCount: number;
  groupResults: Map<string, { hits: number; count: number; top5Hits: number }>;
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

async function runEval(
  label: string,
  searchFn: (query: string) => Promise<any[]>,
): Promise<EvalResult> {
  let top15Hits = 0;
  let caseCount = 0;
  let totalMissing = 0;
  let totalBuried = 0;
  let mrrSum = 0;
  let mrrCount = 0;

  const groupResults = new Map<string, { hits: number; count: number; top5Hits: number }>();

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
    if (ranks.length > 0) {
      mrrSum += 1 / Math.min(...ranks);
      mrrCount++;
    }

    // Per-group tracking
    const group = meta.group || 'other';
    const g = groupResults.get(group) || { hits: 0, count: 0, top5Hits: 0 };
    g.count++;
    if (cr.primaryHitTop15.length > 0) g.hits++;
    if (cr.primaryHitTop5?.length > 0) g.top5Hits++;
    groupResults.set(group, g);

    if (caseCount <= 3 || caseCount % 50 === 0) {
      process.stdout.write(`\r[${label}] ${caseCount} cases...`);
    }
  }
  process.stdout.write(`\r[${label}] ${caseCount} cases complete.\n`);

  return {
    top15: top15Hits / caseCount,
    mrr: mrrCount > 0 ? mrrSum / mrrCount : 0,
    missing: totalMissing,
    buried: totalBuried,
    caseCount,
    groupResults,
  };
}

async function main() {
  await init();

  console.log('='.repeat(70));
  console.log('NEO4J RELEASE GATE — Side-by-Side Evaluation');
  console.log('='.repeat(70));

  // Check Neo4j availability
  const neo4jStatus = getNeo4jStatus();
  console.log(`[neo4j] Available: ${neo4jStatus.available}${neo4jStatus.error ? ` (${neo4jStatus.error})` : ''}`);
  console.log('');

  // Run baseline
  console.log('[baseline] Running hybrid search...');
  const baselineResult = await runEval('baseline', async (query) => {
    return hybridSearch({
      query,
      maxResults: BASELINE_SEARCH_CONFIG.maxResults,
      minScore: BASELINE_SEARCH_CONFIG.minScore,
      candidateLimit: BASELINE_SEARCH_CONFIG.candidateLimit,
    });
  });

  // Run Neo4j
  console.log('[neo4j] Running neo4j-hybrid search...');
  const neo4jResult = await runEval('neo4j-v1', async (query) => {
    return neo4jHybridSearch({
      query,
      maxResults: BASELINE_SEARCH_CONFIG.maxResults,
      minScore: BASELINE_SEARCH_CONFIG.minScore,
      candidateLimit: BASELINE_SEARCH_CONFIG.candidateLimit,
    });
  });

  console.log('[neo4j-v4] Running V4 enhanced recall search...');
  const neo4jV4Result = await runEval('neo4j-v4', async (query) => {
    return neo4jHybridSearchV4({
      query,
      maxResults: BASELINE_SEARCH_CONFIG.maxResults,
      minScore: BASELINE_SEARCH_CONFIG.minScore,
      candidateLimit: BASELINE_SEARCH_CONFIG.candidateLimit,
    });
  });

  // Print comparison
  console.log('\n' + '='.repeat(70));
  console.log('RESULTS');
  console.log('='.repeat(70));

  const metrics = [
    { name: 'Top15', base: baselineResult.top15, neo: neo4jResult.top15, fmt: (v: number) => `${(v * 100).toFixed(1)}%`, higher: true },
    { name: 'MRR', base: baselineResult.mrr, neo: neo4jResult.mrr, fmt: (v: number) => v.toFixed(3), higher: true },
    { name: 'Missing', base: baselineResult.missing, neo: neo4jResult.missing, fmt: (v: number) => String(v), higher: false },
    { name: 'Buried', base: baselineResult.buried, neo: neo4jResult.buried, fmt: (v: number) => String(v), higher: false },
  ];

  console.log(`${'Metric'.padEnd(10)} ${'Baseline'.padEnd(12)} ${'Neo4j-v1'.padEnd(12)} ${'Neo4j-v4'.padEnd(12)}`);
  console.log('-'.repeat(70));

  for (const m of ['Top15', 'MRR', 'Missing', 'Buried'] as const) {
    const baseVal = m === 'Top15' ? baselineResult.top15 : m === 'MRR' ? baselineResult.mrr : m === 'Missing' ? baselineResult.missing : baselineResult.buried;
    const v1Val = m === 'Top15' ? neo4jResult.top15 : m === 'MRR' ? neo4jResult.mrr : m === 'Missing' ? neo4jResult.missing : neo4jResult.buried;
    const v4Val = m === 'Top15' ? neo4jV4Result.top15 : m === 'MRR' ? neo4jV4Result.mrr : m === 'Missing' ? neo4jV4Result.missing : neo4jV4Result.buried;
    const fmt = m === 'MRR' ? (v: number) => v.toFixed(3) : m === 'Top15' ? (v: number) => `${(v*100).toFixed(1)}%` : String;
    console.log(`${m.padEnd(10)} ${String(fmt(baseVal)).padEnd(12)} ${String(fmt(v1Val)).padEnd(12)} ${String(fmt(v4Val)).padEnd(12)}`);
  }

  // Per-group results
  console.log('\n' + '='.repeat(70));
  console.log('PER-GROUP Top15');
  console.log('='.repeat(70));
  console.log(`${'Group'.padEnd(20)} ${'Baseline'.padEnd(12)} ${'Neo4j'.padEnd(12)} ${'Cases'.padEnd(8)}`);

  const allGroups = new Set([...baselineResult.groupResults.keys(), ...neo4jResult.groupResults.keys()]);
  for (const group of [...allGroups].sort()) {
    const bg = baselineResult.groupResults.get(group);
    const ng = neo4jResult.groupResults.get(group);
    const bTop15 = bg && bg.count > 0 ? bg.hits / bg.count : 0;
    const nTop15 = ng && ng.count > 0 ? ng.hits / ng.count : 0;
    const cases = bg?.count || ng?.count || 0;
    console.log(
      `${group.slice(0, 20).padEnd(20)} ${(bTop15 * 100).toFixed(0).padEnd(12)} ${(nTop15 * 100).toFixed(0).padEnd(12)} ${String(cases).padEnd(8)}`
    );
  }

  console.log('\n' + '='.repeat(70));
  console.log(`Baseline:  Top15=${(baselineResult.top15*100).toFixed(1)}% MRR=${baselineResult.mrr.toFixed(3)} Missing=${baselineResult.missing}`);
  console.log(`Neo4j-v1:  Top15=${(neo4jResult.top15*100).toFixed(1)}% MRR=${neo4jResult.mrr.toFixed(3)} Missing=${neo4jResult.missing}`);
  console.log(`Neo4j-v4:  Top15=${(neo4jV4Result.top15*100).toFixed(1)}% MRR=${neo4jV4Result.mrr.toFixed(3)} Missing=${neo4jV4Result.missing}`);
  console.log('='.repeat(70));

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(2); });
