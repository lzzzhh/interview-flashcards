// backend/src/evaluation/v8-ablation-runner.ts
// v8-parity: Full LLM ablation on fixed bge-m3 baseline
//
// 7 configs:
//   A. baseline-bge-m3        — pure hybridSearch (no LLM, no rewrite, no rescue)
//   B. rewrite-low-conf       — LLM intent + rewrite, low-confidence trigger only
//   C. rewrite-all            — LLM intent + rewrite on all 478 queries
//   D. rewrite-raw-preserved  — same as B, rawQuery explicitly preserved
//   E. rewrite-no-raw         — rewrite WITHOUT rawQuery in second pass
//   F. rescue-off             — control group for rescue (same as B)
//   G. rescue-strict          — LLM rewrite + strict lexical rescue

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
import { understandQuery, summarizeFirstPass } from '../services/search/query-understanding';
import { buildRewriteSearchTexts, rewriteAssistedSearch } from '../services/search/query-rewriter';
import { applyStrictRescue } from '../services/search/lexical-rescue';
import { TEST_CASES } from './test-cases';
import { computeCaseResult, computeGroupMetrics, computeGlobalMetrics } from './metrics';
import type { CaseResult, GroupMetrics, GlobalMetrics } from './types';
import { isLearningPath, printBenchmarkHeader, BASELINE_SEARCH_CONFIG } from './eval-config';
import { toCsvRows, writeCsv } from './eval-csv';

// ── Config Types ──

type LlmTrigger = 'none' | 'low-conf' | 'all';
type RescueMode = 'off' | 'strict';

interface AblationConfig {
  name: string;
  label: string;
  llmTrigger: LlmTrigger;
  useRewrite: boolean;
  preserveRawQuery: boolean;
  rescue: RescueMode;
}

const CONFIGS: AblationConfig[] = [
  { name: 'baseline-bge-m3',       label: 'Baseline (bge-m3)',                     llmTrigger: 'none',     useRewrite: false, preserveRawQuery: true,  rescue: 'off' },
  { name: 'rewrite-low-conf',      label: 'LLM rewrite (low-confidence only)',      llmTrigger: 'low-conf', useRewrite: true,  preserveRawQuery: true,  rescue: 'off' },
  { name: 'rewrite-all',           label: 'LLM rewrite (all queries)',              llmTrigger: 'all',      useRewrite: true,  preserveRawQuery: true,  rescue: 'off' },
  { name: 'rewrite-raw-preserved', label: 'Rewrite rawQuery preserved (sanity)',    llmTrigger: 'low-conf', useRewrite: true,  preserveRawQuery: true,  rescue: 'off' },
  { name: 'rewrite-no-raw',        label: 'Rewrite WITHOUT rawQuery',               llmTrigger: 'low-conf', useRewrite: true,  preserveRawQuery: false, rescue: 'off' },
  { name: 'rescue-off',            label: 'Rescue OFF (control)',                   llmTrigger: 'low-conf', useRewrite: true,  preserveRawQuery: true,  rescue: 'off' },
  { name: 'rescue-strict',         label: 'Strict rescue ON',                       llmTrigger: 'low-conf', useRewrite: true,  preserveRawQuery: true,  rescue: 'strict' },
];

// ── Metrics ──

interface AblationMetrics {
  config: string;
  searchCases: number;
  top15: number;
  top50: number;
  top100: number;
  mrr: number;
  pAt5: number;
  missing: number;
  buried: number;
  llmCalls: number;
  llmCallRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  rescueCount: number;
  // Subsets
  blindSpotTop15: number;
  blindSpotMissing: number;
  blindSpotCases: number;
  longNLTop15: number;
  longNLCases: number;
  diagnosticTop15: number;
  diagnosticCases: number;
  comparisonTop15: number;
  comparisonCases: number;
  studyPlanExcluded: number;
}

function computeAblationMetrics(
  results: CaseResult[],
  config: AblationConfig,
  llmCalls: number,
  rescueCount: number,
  latencies: number[],
): AblationMetrics {
  // Filter search cases
  const searchResults = results.filter(r => !isLearningPath(r.group));
  const groupMap = new Map<string, CaseResult[]>();
  for (const r of searchResults) groupMap.set(r.group, [...(groupMap.get(r.group) || []), r]);
  const groups: GroupMetrics[] = [];
  for (const [g, rs] of groupMap) groups.push(computeGroupMetrics(g, rs));

  const n = groups.reduce((s, g) => s + g.caseCount, 0);
  const top15 = n > 0 ? groups.reduce((s, g) => s + g.hitRateTop15 * g.caseCount, 0) / n : 0;
  const top50 = n > 0 ? groups.reduce((s, g) => s + g.hitRateTop50 * g.caseCount, 0) / n : 0;
  const top100 = n > 0 ? groups.reduce((s, g) => s + g.hitRateTop100 * g.caseCount, 0) / n : 0;
  const mrr = n > 0 ? groups.reduce((s, g) => s + g.avgMRR * g.caseCount, 0) / n : 0;
  const pAt5 = n > 0 ? groups.reduce((s, g) => s + g.avgPrecisionAt5 * g.caseCount, 0) / n : 0;
  const missing = groups.reduce((s, g) => s + g.totalMissing, 0);
  const buried = groups.reduce((s, g) => s + g.totalBuried, 0);

  const avgLat = latencies.length > 0 ? Math.round(latencies.reduce((s, l) => s + l, 0) / latencies.length) : 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const p95 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : 0;

  // Subset: embedding blind spot (vector=0 queries)
  const blindKeywords = ['为什么要shuffle', '数据和直觉不一致', 'CLIP多模态', '新功能是否', '协方差', 'ETL流程', 'ML里如何处理'];
  const blindResults = searchResults.filter(r => blindKeywords.some(k => r.query.includes(k)));
  const blindTop15 = blindResults.length > 0
    ? blindResults.filter(r => r.primaryHitTop15.length > 0).length / blindResults.length : 0;
  const blindMissing = blindResults.reduce((s, r) => s + r.primaryMissing.length, 0);

  // Subset: long natural language (>20 chars)
  const longNL = searchResults.filter(r => r.query.length > 20);
  const longNLTop15 = longNL.length > 0
    ? longNL.filter(r => r.primaryHitTop15.length > 0).length / longNL.length : 0;

  // Subset: diagnostic queries
  const diagnosticResults = searchResults.filter(r =>
    r.query.includes('怎么') || r.query.includes('为什么') || r.query.includes('排查') ||
    r.query.includes('解决') || r.query.includes('处理') || r.query.includes('办'));
  const diagTop15 = diagnosticResults.length > 0
    ? diagnosticResults.filter(r => r.primaryHitTop15.length > 0).length / diagnosticResults.length : 0;

  // Subset: comparison queries
  const comparisonResults = searchResults.filter(r =>
    r.query.includes('区别') || r.query.includes('对比') || r.query.includes('哪个') ||
    r.query.includes('还是') || r.query.includes('vs') || r.query.includes('比较') ||
    r.query.includes('不同'));
  const compTop15 = comparisonResults.length > 0
    ? comparisonResults.filter(r => r.primaryHitTop15.length > 0).length / comparisonResults.length : 0;

  const lpCount = results.filter(r => isLearningPath(r.group)).length;

  return {
    config: config.name,
    searchCases: n,
    top15, top50, top100, mrr, pAt5, missing, buried,
    llmCalls,
    llmCallRate: results.length > 0 ? llmCalls / results.length : 0,
    avgLatencyMs: avgLat,
    p95LatencyMs: p95,
    rescueCount,
    blindSpotTop15: blindTop15,
    blindSpotMissing: blindMissing,
    blindSpotCases: blindResults.length,
    longNLTop15: longNLTop15,
    longNLCases: longNL.length,
    diagnosticTop15: diagTop15,
    diagnosticCases: diagnosticResults.length,
    comparisonTop15: compTop15,
    comparisonCases: comparisonResults.length,
    studyPlanExcluded: lpCount,
  };
}

// ── Init ──

async function initProviders() {
  const bu = process.env.LLM_BASE_URL, ak = process.env.LLM_API_KEY;
  let llmProvider: any = null;
  if (bu && ak) {
    llmProvider = new OpenAIChatProvider(bu, ak);
    (llmProvider as any).defaultModel = process.env.LLM_MODEL || 'deepseek-chat';
    setLLMProvider(llmProvider);
  }
  const ebu = process.env.EMBEDDING_BASE_URL, eak = process.env.EMBEDDING_API_KEY;
  if (ebu && eak) {
    const ep = new OpenAIEmbeddingProvider(ebu, eak);
    (ep as any).defaultModel = process.env.EMBEDDING_MODEL || 'bge-m3';

    // Hardened: smoke test embedding
    try {
      const smoke = await ep.embed({ model: (ep as any).defaultModel, texts: ['smoke'] });
      console.error(`[ablation] Embedding verified: model=${(ep as any).defaultModel} dim=${smoke.dimension}`);
    } catch (e: any) {
      console.error(`[ablation] FATAL: Embedding smoke test failed: ${e?.message}`);
      console.error('[ablation]   Previous ablation was invalid due to silent fallback to n-gram.');
      process.exit(3);
    }

    setEmbeddingProvider(ep);
  } else {
    console.error('[ablation] FATAL: No embedding provider configured.');
    process.exit(3);
  }
  if (getVectorStore().name === 'noop') setVectorStore(new SqliteVecVectorStore());
  await initVectorStore(); await initFTS5();
  return llmProvider;
}

// ── Run One Config ──

async function runConfig(config: AblationConfig, llmProvider: any): Promise<{ metrics: AblationMetrics; results: CaseResult[] }> {
  console.error(`\n[ablation] ${config.label}...`);
  const results: CaseResult[] = [];
  let llmCalls = 0;
  let rescueCount = 0;
  const latencies: number[] = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    if (!tc) continue;
    const t0 = performance.now();
    let hits: any[];

    if (config.llmTrigger === 'none') {
      // Baseline: pure hybridSearch
      hits = await hybridSearch({
        query: tc.query,
        maxResults: BASELINE_SEARCH_CONFIG.maxResults,
        minScore: BASELINE_SEARCH_CONFIG.minScore,
        candidateLimit: BASELINE_SEARCH_CONFIG.candidateLimit,
      });
    } else {
      // First pass for query understanding
      let firstPass = await hybridSearch({
        query: tc.query, maxResults: 50, minScore: 0.30, candidateLimit: 300,
      });
      const summary = summarizeFirstPass(firstPass);

      // Should we call LLM?
      let shouldCall = config.llmTrigger === 'all';
      if (config.llmTrigger === 'low-conf') {
        // Low confidence: call if first pass has few results or results are low quality
        const hasLowQuality = summary.topVectorScore < 0.35 || summary.resultCount < 5;
        const isLongQuery = tc.query.length > 15;
        shouldCall = hasLowQuality || isLongQuery;
      }

      const understanding = shouldCall
        ? await understandQuery(tc.query, summary, llmProvider)
        : await understandQuery(tc.query, summary, undefined);

      if (understanding.source === 'rule+llm') llmCalls++;

      // Full search for eval
      firstPass = await hybridSearch({
        query: tc.query,
        maxResults: BASELINE_SEARCH_CONFIG.maxResults,
        minScore: BASELINE_SEARCH_CONFIG.minScore,
        candidateLimit: BASELINE_SEARCH_CONFIG.candidateLimit,
      });

      if (config.useRewrite && (understanding.needsRewrite || understanding.needsDiagnosticExpansion)) {
        const searchTexts = config.preserveRawQuery
          ? buildRewriteSearchTexts(tc.query, understanding)
          : buildRewriteSearchTexts(tc.query, understanding).filter(t => t !== tc.query);

        // Manual rewrite using filtered searchTexts
        if (searchTexts.length <= 1) {
          hits = firstPass;
        } else {
          hits = await rewriteAssistedSearch(tc.query, understanding, firstPass, {
            maxResults: BASELINE_SEARCH_CONFIG.maxResults,
            minScore: BASELINE_SEARCH_CONFIG.minScore,
            candidateLimit: BASELINE_SEARCH_CONFIG.candidateLimit,
          });
        }
      } else {
        hits = firstPass;
      }

      if (config.rescue === 'strict') {
        const rescueResult = applyStrictRescue(hits, understanding);
        hits = rescueResult.hits;
        rescueCount += rescueResult.rescued;
      }
    }

    const elapsed = performance.now() - t0;
    latencies.push(elapsed);
    results.push(computeCaseResult(tc, hits, elapsed));

    if (i % 50 === 0 || i === TEST_CASES.length - 1) {
      console.error(`  [${i+1}/${TEST_CASES.length}] ...`);
    }
  }

  const metrics = computeAblationMetrics(results, config, llmCalls, rescueCount, latencies);
  console.error(`  LLM calls: ${llmCalls}/${TEST_CASES.length} (${(metrics.llmCallRate * 100).toFixed(1)}%)  rescue: ${rescueCount}`);
  return { metrics, results };
}

// ── Print ──

function printTable(allMetrics: AblationMetrics[]) {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    V8 ABLATION RESULTS (bge-m3 parity)                   ║');
  console.log('╠══════════════════════════════════════════════════════════════════════════╣');
  console.log('║ Config                 Top15  Top50  MRR    Miss  Bury  LLM%  Resc Lat ║');
  console.log('╠══════════════════════════════════════════════════════════════════════════╣');

  for (const m of allMetrics) {
    const name = m.config.padEnd(21);
    const t15 = (m.top15 * 100).toFixed(1).padStart(5);
    const t50 = (m.top50 * 100).toFixed(1).padStart(5);
    const mr = m.mrr.toFixed(3).padStart(6);
    const miss = String(m.missing).padStart(4);
    const bury = String(m.buried).padStart(4);
    const llmPct = (m.llmCallRate * 100).toFixed(1).padStart(4);
    const resc = String(m.rescueCount).padStart(4);
    const lat = String(m.avgLatencyMs).padStart(4);
    console.log(`║ ${name} ${t15}% ${t50}% ${mr} ${miss} ${bury} ${llmPct}% ${resc} ${lat}ms ║`);
  }

  console.log('╠══════════════════════════════════════════════════════════════════════════╣');
  console.log('║ Subsets (excl learning-path)                                            ║');
  console.log('╠══════════════════════════════════════════════════════════════════════════╣');
  console.log('║ Config                 Blind    LongNL  Diag    Comp                    ║');
  console.log('╠══════════════════════════════════════════════════════════════════════════╣');

  for (const m of allMetrics) {
    const name = m.config.padEnd(21);
    const blind = (m.blindSpotTop15 * 100).toFixed(1).padStart(6);
    const longNL = (m.longNLTop15 * 100).toFixed(1).padStart(6);
    const diag = (m.diagnosticTop15 * 100).toFixed(1).padStart(6);
    const comp = (m.comparisonTop15 * 100).toFixed(1).padStart(6);
    console.log(`║ ${name} ${blind}% ${longNL}% ${diag}% ${comp}%  ║`);
  }

  console.log('╚══════════════════════════════════════════════════════════════════════════╝');
  console.log('');
}

function printPerSubset(allMetrics: AblationMetrics[]) {
  for (const m of allMetrics) {
    console.log(`── ${m.config} ──`);
    console.log(`  Search (${m.searchCases}): Top15=${(m.top15*100).toFixed(1)}% Top50=${(m.top50*100).toFixed(1)}% MRR=${m.mrr.toFixed(3)} Missing=${m.missing} Buried=${m.buried}`);
    console.log(`  Blind spot (${m.blindSpotCases}): Top15=${(m.blindSpotTop15*100).toFixed(1)}% Missing=${m.blindSpotMissing}`);
    console.log(`  Long NL (${m.longNLCases}): Top15=${(m.longNLTop15*100).toFixed(1)}%`);
    console.log(`  Diagnostic (${m.diagnosticCases}): Top15=${(m.diagnosticTop15*100).toFixed(1)}%`);
    console.log(`  Comparison (${m.comparisonCases}): Top15=${(m.comparisonTop15*100).toFixed(1)}%`);
    console.log(`  Study plan excluded: ${m.studyPlanExcluded}`);
    console.log(`  LLM: ${m.llmCalls} calls (${(m.llmCallRate*100).toFixed(1)}%)  Rescue: ${m.rescueCount}  Latency: avg=${m.avgLatencyMs}ms p95=${m.p95LatencyMs}ms`);
    console.log('');
  }
}

// ── CSV Export ──

function exportConfigCsv(configName: string, results: CaseResult[]) {
  const pidMap = new Map<string, string>();
  const sidMap = new Map<string, string>();
  for (const tc of TEST_CASES) {
    pidMap.set(tc.query, (tc.primaryIds || []).join('|'));
    sidMap.set(tc.query, (tc.secondaryIds || []).join('|'));
  }
  writeCsv(`/tmp/ablation_${configName}.csv`, toCsvRows(results), pidMap, sidMap);
}

// ── Main ──

async function main() {
  console.error('[v8-ablation] Init...');

  // Embedding guard: verify model
  const embModel = process.env.EMBEDDING_MODEL || 'bge-m3';
  if (embModel !== 'bge-m3') {
    console.error(`[v8-ablation] WARNING: EMBEDDING_MODEL=${embModel}, expected bge-m3. Results may differ from parity baseline.`);
  }

  const llmProvider = await initProviders();

  // Header
  const searchCases = TEST_CASES.filter(tc => !isLearningPath(tc.group));
  const lpCases = TEST_CASES.filter(tc => isLearningPath(tc.group));
  const cgCases = TEST_CASES.filter(tc => tc.group === 'coverage-gap' || tc.group?.startsWith('coverage_gap'));
  printBenchmarkHeader(TEST_CASES.length, searchCases.length, lpCases.length, cgCases.length, {
    'runner': 'v8-ablation-runner.ts (v8-parity)',
    'embed_model': embModel,
    'embed_url': process.env.EMBEDDING_BASE_URL || '(not set)',
  });

  const allMetrics: AblationMetrics[] = [];

  for (const config of CONFIGS) {
    const { metrics, results } = await runConfig(config, llmProvider);
    allMetrics.push(metrics);
    exportConfigCsv(config.name, results);
  }

  printTable(allMetrics);
  printPerSubset(allMetrics);

  console.log('CSVs:');
  for (const c of CONFIGS) {
    console.log(`  /tmp/ablation_${c.name}.csv`);
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
