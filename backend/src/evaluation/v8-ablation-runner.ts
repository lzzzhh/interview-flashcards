// backend/src/evaluation/v8-ablation-runner.ts
// v8: Compare v7 baseline vs query-understanding + rewrite-assisted search
//
// Configs:
//   A: v7 baseline hybridSearch (no changes)
//   B: rule intent routing (no LLM)
//   C: intent router + rewrite second pass (no LLM)
//   D: intent router + rewrite + lexical rescue (no LLM)

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
import { ruleBasedIntent, understandQuery, summarizeFirstPass } from '../services/search/query-understanding';
import { buildRewriteSearchTexts, rewriteAssistedSearch } from '../services/search/query-rewriter';
import { applyLexicalRescue } from '../services/search/lexical-rescue';
import { TEST_CASES } from './test-cases';
import { computeCaseResult, computeGroupMetrics, computeGlobalMetrics } from './metrics';
import type { CaseResult, GroupMetrics, GlobalMetrics } from './types';

type AblationConfig = {
  name: string;
  label: string;
  useRewrite: boolean;
  useLexicalRescue: boolean;
};

const CONFIGS: AblationConfig[] = [
  { name: 'v7-baseline', label: 'v7 baseline hybridSearch', useRewrite: false, useLexicalRescue: false },
  { name: 'rule-intent', label: 'rule intent routing', useRewrite: false, useLexicalRescue: false },
  { name: 'rewrite', label: 'intent + rewrite second pass', useRewrite: true, useLexicalRescue: false },
  { name: 'rewrite+rescue', label: 'intent + rewrite + lexical rescue', useRewrite: true, useLexicalRescue: true },
];

async function initProviders() {
  const bu = process.env.LLM_BASE_URL, ak = process.env.LLM_API_KEY;
  if (bu && ak) setLLMProvider(new OpenAIChatProvider(bu, ak));
  const ebu = process.env.EMBEDDING_BASE_URL, eak = process.env.EMBEDDING_API_KEY;
  if (ebu && eak) setEmbeddingProvider(new OpenAIEmbeddingProvider(ebu, eak));
  if (getVectorStore().name === 'noop') setVectorStore(new SqliteVecVectorStore());
  await initVectorStore(); await initFTS5();
}

function computeMetrics(results: CaseResult[]) {
  const isLP = (g: string) => g === 'learning-path' || g.startsWith('学习路径') || g.startsWith('学习路径-');
  const searchResults = results.filter(r => !isLP(r.group));

  const groupMap = new Map<string, CaseResult[]>();
  for (const r of searchResults) groupMap.set(r.group, [...(groupMap.get(r.group) || []), r]);

  const groups: GroupMetrics[] = [];
  for (const [g, rs] of groupMap) groups.push(computeGroupMetrics(g, rs));

  // Use EXACT same weighted average as main runner
  const searchCaseCount = groups.reduce((s, g) => s + g.caseCount, 0);
  const searchTop15 = searchCaseCount > 0
    ? groups.reduce((s, g) => s + g.hitRateTop15 * g.caseCount, 0) / searchCaseCount : 0;
  const searchTop50 = searchCaseCount > 0
    ? groups.reduce((s, g) => s + g.hitRateTop50 * g.caseCount, 0) / searchCaseCount : 0;
  const searchMRR = searchCaseCount > 0
    ? groups.reduce((s, g) => s + g.avgMRR * g.caseCount, 0) / searchCaseCount : 0;
  const searchMissing = groups.reduce((s, g) => s + g.totalMissing, 0);
  const searchBuried = groups.reduce((s, g) => s + g.totalBuried, 0);

  const global: GlobalMetrics = {
    group: '全部', caseCount: searchCaseCount,
    hitRateTop15: searchTop15, hitRateTop50: searchTop50, hitRateTop100: 0,
    avgPrecisionAt5: 0, avgMRR: searchMRR, avgDeckHitRateTop15: 0,
    avgResponseTimeMs: 0, totalMissing: searchMissing, totalBuried: searchBuried,
    totalPrimaries: groups.reduce((s, g) => s + g.totalPrimaries, 0), groups,
  };

  // Blind spot subset
  const blindKeywords = ['shuffle', '参数太多', '损失函数不下', '数据太少', '生成模型', '数据和直觉',
    '噪声标签', 'Momentum', '传统ML', '协方差', '新功能是否对留存', 'CLIP', 'few-shot', 'Chain-of-Thought',
    'LangChain', 'ML里如何处理', 'ETL', '什么是指标体系', '为什么要shuffle'];
  const blindResults = searchResults.filter(r => blindKeywords.some(k => r.query.includes(k)));
  const blindSearchTop15 = blindResults.length > 0
    ? blindResults.filter(r => r.primaryHitTop15.length > 0).length / blindResults.length : 0;
  const blindMissing = blindResults.reduce((s, r) => s + r.primaryMissing.length, 0);

  return { global, blindSpot: { hitRateTop15: blindSearchTop15, totalMissing: blindMissing, totalCases: blindResults.length } };
}

async function runConfig(config: AblationConfig) {
  console.error(`\n[ablation] ${config.label}...`);
  const results: CaseResult[] = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    if (!tc) continue;

    const t0 = performance.now();
    let hits: any[];

    if (!config.useRewrite && !config.useLexicalRescue) {
      // Baseline: direct hybridSearch
      hits = await hybridSearch({ query: tc.query, maxResults: 100, minScore: 0, candidateLimit: 500 });
    } else {
      // v8: intent routing
      const understanding = ruleBasedIntent(tc.query);

      // First pass
      const firstPass = await hybridSearch({ query: tc.query, maxResults: 100, minScore: 0, candidateLimit: 500 });

      if (config.useRewrite && understanding.needsRewrite) {
        const rewriteInput = { maxResults: 100, minScore: 0, candidateLimit: 500 };
        const rewriteHits = await rewriteAssistedSearch(tc.query, understanding, firstPass, rewriteInput);
        hits = rewriteHits;
      } else {
        hits = firstPass;
      }

      if (config.useLexicalRescue) {
        hits = applyLexicalRescue(hits, understanding);
      }
    }

    const elapsed = performance.now() - t0;
    results.push(computeCaseResult(tc, hits, elapsed));

    const found = hits.filter((h: any) => tc.primaryIds?.includes(h.cardId) && hits.indexOf(h) < 15).length;
    const total = tc.primaryIds?.length || 0;
    const ok = results[results.length-1].primaryMissing.length === 0 ? '✓' : '✗';
    console.error(`  ${ok} [${i+1}/${TEST_CASES.length}] "${tc.query.slice(0,40)}"  top15=${found}/${total}`);
  }

  return computeMetrics(results);
}

async function main() {
  console.error('[v8-ablation] Init...');
  await initProviders();

  const allResults: { config: AblationConfig; metrics: ReturnType<typeof computeMetrics> }[] = [];

  for (const config of CONFIGS) {
    const metrics = await runConfig(config);
    allResults.push({ config, metrics });
  }

  // Print comparison table
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║           V8 ABLATION COMPARISON                    ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║ Config              Top15  Top50  MRR    Miss  Bury ║');
  console.log('╠══════════════════════════════════════════════════════╣');

  for (const { config, metrics } of allResults) {
    const g = metrics.global;
    console.log(`║ ${config.name.padEnd(19)} ${(g.hitRateTop15*100).toFixed(1).padStart(5)}% ${(g.hitRateTop50*100).toFixed(1).padStart(5)}% ${g.avgMRR.toFixed(3).padStart(6)} ${String(g.totalMissing).padStart(4)} ${String(g.totalBuried).padStart(4)} ║`);
  }

  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║ Blind Spot Subset (' + allResults[0].metrics.blindSpot.totalCases + ' cases)              ║');

  for (const { config, metrics } of allResults) {
    const b = metrics.blindSpot;
    console.log(`║ ${config.name.padEnd(19)} ${(b.hitRateTop15*100).toFixed(1).padStart(5)}%   ---  ${String(b.totalMissing).padStart(4)}   --- ║`);
  }

  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
