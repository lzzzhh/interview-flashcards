// backend/src/evaluation/runner.ts — AI 搜索评测 Runner（v2: 阈值评测）
//
// 用法：cd backend && npx tsx src/evaluation/runner.ts
// 或：  npm run evaluate

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
import { computeCaseResult, computeGroupMetrics, computeGlobalMetrics, computeThresholdCase, computeThresholdMetrics } from './metrics';
import { printReport, printThresholdReport } from './report';
import type { CaseResult, GroupMetrics, GlobalMetrics, ThresholdCaseResult, ThresholdMetrics } from './types';

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
    console.log(`[eval] LLM ready: ${baseUrl}`);

    if (embBaseUrl && embApiKey && embeddingModel) {
      const embProvider = new OpenAIEmbeddingProvider(embBaseUrl, embApiKey);
      (embProvider as any).defaultModel = embeddingModel;
      setEmbeddingProvider(embProvider);
      console.log(`[eval] Embedding ready: ${embBaseUrl} (${embeddingModel})`);
    } else {
      console.log('[eval] Embedding API 未独立配置 — 使用本地 n-gram 向量');
    }
  } else {
    console.log('[eval] LLM 未配置 — 仅使用关键词+本地向量搜索');
  }

  if (getVectorStore().name === 'noop') {
    const vecStore = new SqliteVecVectorStore();
    setVectorStore(vecStore);
  }
  await initVectorStore();
  console.log(`[eval] Vector store: ${getVectorStore().name}`);
  await initFTS5();
  console.log('[eval] FTS5 initialized');
}

async function runEvaluation() {
  console.log('\n[eval] 初始化搜索组件...');
  await initProviders();

  console.log(`\n[eval] 运行 ${TEST_CASES.length} 条测试用例 (candidateLimit=500)...\n`);

  // 一次性获取大候选池（不需要重复调 API）
  const allHits: { tc: typeof TEST_CASES[0]; hits: any[]; elapsed: number }[] = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    const label = `[${i + 1}/${TEST_CASES.length}] "${tc.query}"`;

    const t0 = performance.now();
    let hits: any[];
    try {
      hits = await hybridSearch({ query: tc.query, maxResults: 100, minScore: 0, candidateLimit: 500 });
    } catch (err: any) {
      console.error(`${label} 搜索失败:`, err.message);
      hits = [];
    }
    const elapsed = performance.now() - t0;
    allHits.push({ tc, hits, elapsed });

    const result = computeCaseResult(tc, hits, elapsed);
    const found = result.primaryHitTop15.length;
    const total = result.primaryRanks.length;
    const ok = result.primaryMissing.length === 0 ? '✓' : '✗';
    console.log(`  ${ok} ${label.padEnd(56)} top15=${found}/${total}  ${Math.round(elapsed)}ms`);
  }

  // 传统指标聚合
  const caseResults: CaseResult[] = allHits.map(a => computeCaseResult(a.tc, a.hits, a.elapsed));
  const groupMap = new Map<string, CaseResult[]>();
  for (const r of caseResults) {
    const list = groupMap.get(r.group) || [];
    list.push(r);
    groupMap.set(r.group, list);
  }
  const groupMetrics: GroupMetrics[] = [];
  for (const [group, results] of groupMap) {
    groupMetrics.push(computeGroupMetrics(group, results));
  }
  const global = computeGlobalMetrics(groupMetrics);
  printReport(caseResults, global);

  // ═══════════ 阈值评测 ═══════════
  console.log('\n═══════════════════ 阈值评测 ═══════════════════');
  console.log('（基于同一批候选池，不同 minScore 过滤）\n');

  const thresholdResults: ThresholdMetrics[] = [];

  for (const threshold of THRESHOLDS) {
    const cases: ThresholdCaseResult[] = allHits.map(a =>
      computeThresholdCase(a.tc, a.hits, threshold)
    );
    const metrics = computeThresholdMetrics(cases, threshold);
    // 补充 MRR / P@5（用阈值过滤后的结果）
    const filteredCases = allHits.map(({ tc, hits, elapsed }) =>
      computeCaseResult(tc, hits.filter(h => h.score >= threshold), elapsed)
    );
    metrics.mrr = filteredCases.reduce((s, c) => {
      const ranks = c.expectationRanks?.filter(r => r > 0) || [];
      return s + (ranks.length > 0 ? 1 / Math.min(...ranks) : 0);
    }, 0) / Math.max(1, filteredCases.length);
    metrics.precisionAt5 = filteredCases.reduce((s, c) => {
      const top5 = c.rankedIds.slice(0, 5);
      const expSet = new Set((c.expectations || []).filter(e => e.grade >= 1).map(e => e.cardId));
      let hits = 0;
      for (const id of top5) { if (expSet.has(id)) hits++; }
      return s + (hits / 5);
    }, 0) / Math.max(1, filteredCases.length);

    thresholdResults.push(metrics);
  }

  printThresholdReport(thresholdResults);

  // 退出码
  process.exit(global.totalMissing > 0 ? 1 : 0);
}

runEvaluation().catch((err) => {
  console.error('[eval] Fatal error:', err);
  process.exit(2);
});
