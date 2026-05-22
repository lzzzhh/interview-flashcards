// backend/src/evaluation/runner.ts — AI 搜索评测 Runner
//
// 用法：cd backend && npx tsx src/evaluation/runner.ts
// 或：  npm run evaluate

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ---- 手动加载 .env（tsx 不会自动 load） ----
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
  } catch { /* .env not found, use existing env */ }
}
loadEnv();

// ---- 依赖初始化（与 server.ts 相同顺序） ----
import { setLLMProvider, OpenAIChatProvider } from '../services/llm-provider';
import { setEmbeddingProvider, OpenAIEmbeddingProvider } from '../services/embedding-provider';
import { getVectorStore, SqliteVecVectorStore, setVectorStore, initVectorStore } from '../services/vector/vector-store';
import { initFTS5 } from '../services/search/fts5-search';
import { hybridSearch } from '../services/search/hybrid-search';
import { TEST_CASES } from './test-cases';
import { computeCaseResult, computeGroupMetrics, computeGlobalMetrics } from './metrics';
import { printReport } from './report';
import type { CaseResult, GroupMetrics, GlobalMetrics } from './types';

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

  // 初始化向量存储
  if (getVectorStore().name === 'noop') {
    const vecStore = new SqliteVecVectorStore();
    setVectorStore(vecStore);
  }
  await initVectorStore();
  console.log(`[eval] Vector store: ${getVectorStore().name}`);

  // 初始化 FTS5
  await initFTS5();
  console.log('[eval] FTS5 initialized');
}

async function runEvaluation() {
  console.log('\n[eval] 初始化搜索组件...');
  await initProviders();

  console.log(`\n[eval] 运行 ${TEST_CASES.length} 条测试用例...\n`);

  const caseResults: CaseResult[] = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    const label = `[${i + 1}/${TEST_CASES.length}] "${tc.query}"`;

    const t0 = performance.now();
    let hits: any[];
    try {
      hits = await hybridSearch({ query: tc.query, topK: 100 });
    } catch (err: any) {
      console.error(`${label} 搜索失败:`, err.message);
      hits = [];
    }
    const elapsed = performance.now() - t0;

    const result = computeCaseResult(tc, hits, elapsed);
    caseResults.push(result);

    // 实时进度
    const found = result.primaryHitTop15.length;
    const total = result.primaryRanks.length;
    const ok = result.primaryMissing.length === 0 ? '✓' : '✗';
    console.log(`  ${ok} ${label.padEnd(56)} top15=${found}/${total}  ${Math.round(elapsed)}ms`);
  }

  // 分组聚合
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

  // 输出报告
  printReport(caseResults, global);

  // 退出码：有 missing 则非零
  process.exit(global.totalMissing > 0 ? 1 : 0);
}

runEvaluation().catch((err) => {
  console.error('[eval] Fatal error:', err);
  process.exit(2);
});
