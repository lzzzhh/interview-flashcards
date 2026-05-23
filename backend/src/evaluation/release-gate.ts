// backend/src/evaluation/release-gate.ts
// Release Gate — validates current metrics against normalized official baseline.
// Usage: npm run evaluate:gate

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
import { TEST_CASES } from './test-cases';
import { computeCaseResult } from './metrics';
import { BASELINE_SEARCH_CONFIG } from './eval-config';
import { getMeta } from './benchmark-classification';

// ── Baseline ──
const BASELINE = {
  top15: 0.886,
  mrr: 0.674,
  missing: 25,
};

// ── Gate Thresholds ──
const GATES = {
  top15: { min: 0.883, label: 'Top15' },
  mrr: { min: 0.669, label: 'MRR' },
  missing: { max: 27, label: 'Missing' },
};

interface GateResult {
  metric: string;
  expected: string;
  actual: string;
  delta: string;
  passed: boolean;
}

async function init() {
  const llm = new OpenAIChatProvider(process.env.LLM_BASE_URL!, process.env.LLM_API_KEY!);
  (llm as any).defaultModel = process.env.LLM_MODEL || 'deepseek-chat';
  setLLMProvider(llm);
  const ep = new OpenAIEmbeddingProvider(process.env.EMBEDDING_BASE_URL!, process.env.EMBEDDING_API_KEY!);
  (ep as any).defaultModel = process.env.EMBEDDING_MODEL || 'bge-m3';
  setEmbeddingProvider(ep);
  if (getVectorStore().name === 'noop') setVectorStore(new SqliteVecVectorStore());
  await initVectorStore();
  await initFTS5();
}

async function checkDbReadiness(): Promise<boolean> {
  const cardCount = await prisma.card.count();
  const noKw = await prisma.card.count({
    where: { OR: [{ searchKeywords: null }, { searchKeywords: '' }] }
  });
  const vecCount = await prisma.$queryRawUnsafe(
    "SELECT COUNT(*) as c FROM ai_search_vec WHERE object_type = 'card'"
  ) as any[];
  const ftsCount = await prisma.$queryRawUnsafe(
    "SELECT COUNT(*) as c FROM card_fts"
  ) as any[];
  return noKw === 0 && Number(vecCount[0].c) === cardCount && Number(ftsCount[0].c) === cardCount;
}

async function checkValidate(): Promise<{ errors: number; warnings: number }> {
  try {
    const { execSync } = await import('child_process');
    const output = execSync('npx tsx src/evaluation/validate.ts', {
      cwd: __dirname + '/../..',
      timeout: 30_000,
    }).toString();
    const errMatch = output.match(/Errors:\s+(\d+)/);
    const warnMatch = output.match(/Warnings:\s+(\d+)/);
    return {
      errors: errMatch ? parseInt(errMatch[1]) : -1,
      warnings: warnMatch ? parseInt(warnMatch[1]) : -1,
    };
  } catch (e: any) {
    // validate exits 1 if errors > 0, parse from stderr
    const output = e.stdout?.toString() || e.stderr?.toString() || '';
    const errMatch = output.match(/Errors:\s+(\d+)/);
    const warnMatch = output.match(/Warnings:\s+(\d+)/);
    return {
      errors: errMatch ? parseInt(errMatch[1]) : -1,
      warnings: warnMatch ? parseInt(warnMatch[1]) : -1,
    };
  }
}

async function main() {
  await init();

  console.log('═'.repeat(60));
  console.log('RELEASE GATE');
  console.log('═'.repeat(60));

  const results: GateResult[] = [];

  // 0. Validate
  const validateResult = await checkValidate();
  results.push({
    metric: 'Validation errors',
    expected: '0',
    actual: String(validateResult.errors),
    delta: '',
    passed: validateResult.errors === 0,
  });
  results.push({
    metric: 'Validation warnings',
    expected: 'any (info)',
    actual: String(validateResult.warnings),
    delta: '',
    passed: true, // warnings don't fail gate
  });

  // Run evaluation
  console.log('\n[eval] Running search benchmark (430 search cases)...\n');

  let searchTop15Hits = 0;
  let searchCaseCount = 0;
  let totalMissing = 0;
  let mrrSum = 0;
  let mrrCount = 0;

  for (const tc of TEST_CASES) {
    const meta = getMeta(tc.query);
    tc.benchmarkScope = meta.benchmarkScope;
    tc.normalizedQuery = tc.normalizedQuery || meta.normalizedQuery;
    if (meta.benchmarkScope !== 'search') continue;

    const searchQuery = tc.normalizedQuery || tc.query;
    const hits = await hybridSearch({
      query: searchQuery,
      maxResults: BASELINE_SEARCH_CONFIG.maxResults,
      minScore: BASELINE_SEARCH_CONFIG.minScore,
      candidateLimit: BASELINE_SEARCH_CONFIG.candidateLimit,
    });
    const cr = computeCaseResult(tc, hits, 0);

    searchCaseCount++;
    if (cr.primaryHitTop15.length > 0) searchTop15Hits++;
    totalMissing += cr.primaryMissing.length;

    // MRR
    const ranks = (cr.expectationRanks || cr.primaryRanks).filter((r: number) => r > 0);
    if (ranks.length > 0) {
      mrrSum += 1 / Math.min(...ranks);
      mrrCount++;
    }
  }

  const top15 = searchTop15Hits / searchCaseCount;
  const mrr = mrrCount > 0 ? mrrSum / mrrCount : 0;

  // Check gates
  results.push({
    metric: 'Top15',
    expected: `>= ${(GATES.top15.min * 100).toFixed(1)}%`,
    actual: `${(top15 * 100).toFixed(1)}%`,
    delta: `${(top15 - BASELINE.top15 > 0 ? '+' : '')}${((top15 - BASELINE.top15) * 100).toFixed(1)}pp`,
    passed: top15 >= GATES.top15.min,
  });

  results.push({
    metric: 'MRR',
    expected: `>= ${GATES.mrr.min.toFixed(3)}`,
    actual: mrr.toFixed(3),
    delta: `${(mrr - BASELINE.mrr > 0 ? '+' : '')}${(mrr - BASELINE.mrr).toFixed(3)}`,
    passed: mrr >= GATES.mrr.min,
  });

  results.push({
    metric: 'Missing',
    expected: `<= ${GATES.missing.max}`,
    actual: String(totalMissing),
    delta: `${totalMissing - BASELINE.missing > 0 ? '+' : ''}${totalMissing - BASELINE.missing}`,
    passed: totalMissing <= GATES.missing.max,
  });

  const dbReady = await checkDbReadiness();
  results.push({
    metric: 'DB readiness',
    expected: 'all green',
    actual: dbReady ? 'all green' : 'NOT READY',
    delta: '',
    passed: dbReady,
  });

  // Print results
  console.log('═'.repeat(60));
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.metric.padEnd(15)} expected=${r.expected.padEnd(12)} actual=${r.actual.padEnd(12)} delta=${r.delta}`);
  }

  const allPassed = results.every(r => r.passed);
  const hasValidationErrors = validateResult.errors > 0;

  console.log('═'.repeat(60));
  if (hasValidationErrors) {
    console.log('FAIL — validation errors found');
  } else if (allPassed) {
    console.log('PASS — all gates passed');
  } else {
    console.log('FAIL — check items above');
  }
  if (!hasValidationErrors && allPassed && validateResult.warnings > 0) {
    console.log('(PASS_WITH_WARNINGS — validation has warnings)');
  }
  if (!allPassed || hasValidationErrors) {
    const failed = results.filter(r => !r.passed);
    for (const f of failed) {
      console.log(`  ${f.metric}: expected ${f.expected}, got ${f.actual} (${f.delta})`);
    }
  }
  console.log('═'.repeat(60));

  await prisma.$disconnect();
  process.exit(allPassed ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(2); });
