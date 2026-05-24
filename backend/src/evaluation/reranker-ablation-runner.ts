// backend/src/evaluation/reranker-ablation-runner.ts
// bge-reranker-v2-m3 ablation (sentence-transformers via Python bridge)

import { readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn, ChildProcess } from 'child_process';
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
import { setEmbeddingProvider, OpenAIEmbeddingProvider } from '../services/embedding-provider';
import { getVectorStore, SqliteVecVectorStore, setVectorStore, initVectorStore } from '../services/vector/vector-store';
import { initFTS5 } from '../services/search/fts5-search';
import { hybridSearch } from '../services/search/hybrid-search';
import { TEST_CASES } from './test-cases';
import { computeCaseResult } from './metrics';
import { BASELINE_SEARCH_CONFIG } from './eval-config';
import { getMeta } from './benchmark-classification';

// ── Python bridge ──
class RerankerBridge {
  private proc: ChildProcess;
  private pending: Map<number, (r: any) => void> = new Map();
  private nextId = 0;
  private buffer = '';

  constructor() {
    const pyPath = '/opt/anaconda3/bin/python3';
    const scriptPath = __dirname + '/reranker-bridge.py';
    this.proc = spawn(pyPath, [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });

    this.proc.stdout!.on('data', (chunk: Buffer) => {
      this.buffer += chunk.toString();
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.id !== undefined && this.pending.has(data.id)) {
            this.pending.get(data.id)!(data);
            this.pending.delete(data.id);
          }
        } catch {}
      }
    });

    this.proc.stderr!.on('data', (chunk: Buffer) => {
      const msg = chunk.toString().trim();
      if (msg && !msg.startsWith('Warning')) console.error(`  [reranker] ${msg}`);
    });
  }

  async waitReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('reranker bridge timeout')), 120_000);
      this.pending.set(0, (_data: any) => { clearTimeout(timeout); resolve(); });
    });
  }

  async rerank(query: string, documents: string[], topN: number): Promise<{ index: number; score: number }[]> {
    const id = ++this.nextId;
    return new Promise((resolve) => {
      const timeout = setTimeout(() => { this.pending.delete(id); resolve([]); }, 10_000);
      this.pending.set(id, (data: any) => {
        clearTimeout(timeout);
        resolve((data.results || []).map((r: any) => ({ index: r.index, score: r.score })));
      });
      this.proc.stdin!.write(JSON.stringify({ id, query, documents, top_n: topN }) + '\n');
    });
  }

  kill() { this.proc.kill(); }
}

async function init() {
  const ep = new OpenAIEmbeddingProvider(process.env.EMBEDDING_BASE_URL!, process.env.EMBEDDING_API_KEY!);
  (ep as any).defaultModel = process.env.EMBEDDING_MODEL || 'bge-m3';
  setEmbeddingProvider(ep);
  if (getVectorStore().name === 'noop') setVectorStore(new SqliteVecVectorStore());
  await initVectorStore();
  await initFTS5();
}

async function main() {
  await init();

  console.log('[reranker-ablation] Starting Python bridge...');
  const bridge = new RerankerBridge();
  await bridge.waitReady();
  console.log('[reranker-ablation] Bridge ready.\n');

  const blindSpotQueries = new Set([
    '为什么要shuffle数据', 'CLIP多模态对比学习', 'Chain-of-Thought在GPT4中',
    'few-shot为什么给例子就能学', 'Momentum为什么能加速收敛',
  ]);

  let bsTotal = 0, bsBaselineHits = 0, bsRerankHits = 0;
  let searchTotal = 0, baselineHits = 0, rerankHits = 0;
  let baselineMRR = 0, rerankMRR = 0, mrrCount = 0;
  const t0 = Date.now();

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    const meta = getMeta(tc.query);
    tc.benchmarkScope = meta.benchmarkScope;
    tc.normalizedQuery = tc.normalizedQuery || meta.normalizedQuery;
    if (meta.benchmarkScope !== 'search') continue;

    const searchQuery = tc.normalizedQuery || tc.query;
    const isBlind = blindSpotQueries.has(tc.query);

    const rawHits = (await hybridSearch({
      query: searchQuery,
      maxResults: BASELINE_SEARCH_CONFIG.maxResults,
      minScore: BASELINE_SEARCH_CONFIG.minScore,
      candidateLimit: BASELINE_SEARCH_CONFIG.candidateLimit,
    })).slice(0, 50);

    const baseResult = computeCaseResult(tc, rawHits, 0);

    // bge-reranker: cross-encode top 50
    const documents = rawHits.map((h: any) =>
      `${h.title || ''} ${(h as any).titleCn || ''} ${h.question || ''} ${h.tags?.join(' ') || ''} ${h.searchKeywords || ''}`.slice(0, 500)
    );

    let reranked = rawHits;
    try {
      const rr = await bridge.rerank(searchQuery, documents, 50);
      if (rr.length > 0) {
        // Reorder all 50 by rerank score, keep original as fallback
        const scoreMap = new Map(rr.map(r => [r.index, r.score]));
        const withScores = rawHits.map((h: any, idx: number) => ({
          ...h, _rerankScore: scoreMap.get(idx) ?? h.score,
        }));
        reranked = withScores.sort((a: any, b: any) => b._rerankScore - a._rerankScore);
      }
    } catch (e: any) {
      console.error(`  Rerank error [${i}]: ${e.message?.slice(0,60)}`);
    }

    const rerankResult = computeCaseResult(tc, reranked, 0);

    searchTotal++;
    if (baseResult.primaryHitTop15.length > 0) baselineHits++;
    if (rerankResult.primaryHitTop15.length > 0) rerankHits++;

    const baseRanks = (baseResult as any).primaryRanks?.filter((r: number) => r > 0) || [];
    const rerankRanks = (rerankResult as any).primaryRanks?.filter((r: number) => r > 0) || [];
    if (baseRanks.length > 0) baselineMRR += 1 / Math.min(...baseRanks);
    if (rerankRanks.length > 0) rerankMRR += 1 / Math.min(...rerankRanks);
    mrrCount++;

    if (isBlind) {
      bsTotal++;
      if (baseResult.primaryHitTop15.length > 0) bsBaselineHits++;
      if (rerankResult.primaryHitTop15.length > 0) bsRerankHits++;
    }

    if (i % 50 === 0) process.stdout.write(`  [${i}/478] `);
  }

  bridge.kill();

  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('bge-reranker-v2-m3 ABLATION');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Search cases: ${searchTotal}  |  Time: ${((Date.now()-t0)/1000).toFixed(0)}s`);
  console.log('');
  console.log(`  Top15 baseline:   ${(baselineHits/searchTotal*100).toFixed(1)}%  (${baselineHits}/${searchTotal})`);
  console.log(`  Top15 bge-rerank: ${(rerankHits/searchTotal*100).toFixed(1)}%  (${rerankHits}/${searchTotal})`);
  console.log(`  MRR  baseline:    ${(baselineMRR/mrrCount).toFixed(4)}`);
  console.log(`  MRR  bge-rerank:  ${(rerankMRR/mrrCount).toFixed(4)}`);
  console.log('');
  console.log(`  Blind spot (${bsTotal}): baseline=${(bsBaselineHits/bsTotal*100).toFixed(1)}%  reranker=${(bsRerankHits/bsTotal*100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════════════════════');

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
