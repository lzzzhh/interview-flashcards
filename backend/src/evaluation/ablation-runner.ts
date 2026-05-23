// backend/src/evaluation/ablation-runner.ts — Rerank Profile Ablation Study
//
// 用法：cd backend && PROFILE=keyword-heavy npx tsx src/evaluation/ablation-runner.ts
// 或批量：PROFILE=default npx tsx ...    (baseline)
//        PROFILE=keyword-heavy npx tsx ... (global kw-heavy)
//        PROFILE=auto npx tsx ...          (auto-detect stats profile)
//        PROFILE=stats-only npx tsx ...    (force stats profile for all)
//
// 输出 JSON 到 stdout，供后续对比。

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
function loadEnv() {
  const envPath = resolve(__dirname, '../../.env');
  try {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* .env not found */ }
}
loadEnv();

import { setLLMProvider, OpenAIChatProvider } from '../services/llm-provider';
import { setEmbeddingProvider, OpenAIEmbeddingProvider } from '../services/embedding-provider';
import { getVectorStore, SqliteVecVectorStore, setVectorStore, initVectorStore } from '../services/vector/vector-store';
import { initFTS5 } from '../services/search/fts5-search';
import { hybridSearch } from '../services/search/hybrid-search';
import { TEST_CASES } from './test-cases';
import { computeCaseResult, computeGroupMetrics, computeGlobalMetrics } from './metrics';
import type { CaseResult, GroupMetrics, GlobalMetrics } from './types';
import {
  DEFAULT_PROFILE,
  KEYWORD_HEAVY_PROFILE,
  STATS_PROFILE,
  type RerankProfile,
} from '../services/search/reranker';

// Redirect all debug output to stderr, keep stdout clean for JSON
const origLog = console.log;
const origInfo = console.info;
console.log = (...args: any[]) => process.stderr.write(args.join(' ') + '\n');
console.info = (...args: any[]) => process.stderr.write(args.join(' ') + '\n');

const THRESHOLDS = [0.20, 0.25, 0.30, 0.35, 0.40];

async function initProviders() {
  const baseUrl = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || 'deepseek-chat';
  const embBaseUrl = process.env.EMBEDDING_BASE_URL;
  const embApiKey = process.env.EMBEDDING_API_KEY;
  const embeddingModel = process.env.EMBEDDING_MODEL || 'BAAI/bge-m3';

  if (baseUrl && apiKey) {
    const llmProvider = new OpenAIChatProvider(baseUrl, apiKey);
    (llmProvider as any).defaultModel = model;
    setLLMProvider(llmProvider);
    if (embBaseUrl && embApiKey && embeddingModel) {
      const embProvider = new OpenAIEmbeddingProvider(embBaseUrl, embApiKey);
      (embProvider as any).defaultModel = embeddingModel;
      setEmbeddingProvider(embProvider);
    }
  }
  if (getVectorStore().name === 'noop') {
    const vecStore = new SqliteVecVectorStore();
    setVectorStore(vecStore);
  }
  await initVectorStore();
  await initFTS5();
}

function pickProfile(name: string): { profile: RerankProfile | null; label: string } {
  switch (name) {
    case 'default': return { profile: DEFAULT_PROFILE, label: 'baseline (default profile)' };
    case 'keyword-heavy': return { profile: KEYWORD_HEAVY_PROFILE, label: 'global keyword-heavy (V0.25/K0.30)' };
    case 'stats-only': return { profile: STATS_PROFILE, label: 'force stats profile for all' };
    case 'auto': return { profile: null, label: 'auto-detect (stats queries get stats profile)' };
    default: return { profile: DEFAULT_PROFILE, label: `unknown "${name}", using default` };
  }
}

async function runAblation() {
  const profileName = process.env.PROFILE || 'default';
  const { profile, label } = pickProfile(profileName);

  console.error(`[ablation] Profile: ${label}`);
  await initProviders();

  const results: CaseResult[] = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    const t0 = performance.now();
    let hits: any[];
    try {
      hits = await hybridSearch({
        query: tc.query,
        maxResults: 100,
        minScore: 0,
        candidateLimit: 500,
        overrideProfile: profile ?? undefined,
      });
    } catch (err: any) {
      hits = [];
    }
    const elapsed = performance.now() - t0;
    const result = computeCaseResult(tc, hits, elapsed);
    results.push(result);

    const found = result.primaryHitTop15.length;
    const total = result.primaryRanks.length;
    const ok = result.primaryMissing.length === 0 ? '✓' : '✗';
    console.error(`  ${ok} [${i + 1}/${TEST_CASES.length}] "${tc.query.slice(0, 50)}"  top15=${found}/${total}  ${Math.round(elapsed)}ms`);
  }

  // Aggregation
  const groupMap = new Map<string, CaseResult[]>();
  for (const r of results) {
    const list = groupMap.get(r.group) || [];
    list.push(r);
    groupMap.set(r.group, list);
  }
  const groupMetrics: GroupMetrics[] = [];
  for (const [group, grpResults] of groupMap) {
    groupMetrics.push(computeGroupMetrics(group, grpResults));
  }
  const global = computeGlobalMetrics(groupMetrics);

  // Threshold metrics
  const thresholdMetrics: any[] = [];
  for (const threshold of THRESHOLDS) {
    const filtered = results.map(r => {
      const filteredHits = [...Array(r.totalResults)].map((_, idx) => ({
        cardId: r.rankedIds[idx],
        score: r.rankedScores[idx],
      })).filter(h => h.score >= threshold);
      // Simplified compute
      const expectations = r.expectations || [];
      const expSet = new Set(expectations.filter(e => e.grade >= 2).map(e => e.cardId));
      const found = filteredHits.filter(h => expSet.has(h.cardId)).length;
      const totalExp = expSet.size;
      return {
        resultCount: filteredHits.length,
        strongFound: found,
        totalStrongExpected: totalExp,
      };
    });

    const totalResults = filtered.reduce((s, c) => s + c.resultCount, 0);
    const totalStrong = filtered.reduce((s, c) => s + c.strongFound, 0);
    const totalStrongExp = filtered.reduce((s, c) => s + c.totalStrongExpected, 0);
    const emptyCount = filtered.filter(c => c.resultCount === 0).length;

    thresholdMetrics.push({
      threshold,
      recallStrong: totalStrongExp > 0 ? totalStrong / totalStrongExp : 0,
      emptyRate: emptyCount / Math.max(1, results.length),
    });
  }

  // Output JSON
  const output = {
    profile: profileName,
    label,
    global: {
      caseCount: global.caseCount,
      hitRateTop15: global.hitRateTop15,
      hitRateTop50: global.hitRateTop50,
      hitRateTop100: global.hitRateTop100,
      avgMRR: global.avgMRR,
      avgPrecisionAt5: global.avgPrecisionAt5,
      totalMissing: global.totalMissing,
      totalBuried: global.totalBuried,
      avgResponseTimeMs: global.avgResponseTimeMs,
    },
    groups: groupMetrics.map(g => ({
      group: g.group,
      caseCount: g.caseCount,
      hitRateTop15: g.hitRateTop15,
      hitRateTop50: g.hitRateTop50,
      avgMRR: g.avgMRR,
      totalMissing: g.totalMissing,
      totalBuried: g.totalBuried,
    })),
    thresholds: thresholdMetrics,
  };

  process.stdout.write(JSON.stringify(output));
  process.exit(0);
}

runAblation().catch((err) => {
  console.error('[ablation] Fatal error:', err);
  process.exit(2);
});
