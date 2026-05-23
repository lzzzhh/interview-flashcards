// backend/src/evaluation/regression-review.ts
// Content Expansion Regression Review
// Compares frozen baseline vs current with 39 new cards

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
import { isLearningPath, BASELINE_SEARCH_CONFIG } from './eval-config';

const NEW_CARD_IDS = new Set([
  // Batch 1
  'ml-190','ml-191','ml-192','dl-33','dl-34','dl-35',
  'ml-193','ml-194','ml-195','ml-196','ml-197','ml-198',
  'wp-77','wp-78','wp-79','ml-199','ml-200','ml-201',
  // Batch 2
  'dl-36','dl-37','dl-38','dl-39','dl-40','dl-41',
  'agent-27','agent-28','agent-29','stats-200','stats-201','stats-202',
  // Batch 3
  'wp-80','wp-81','wp-82','ml-202','ml-203','ml-204','ml-205','ml-206','ml-207',
]);

interface CaseDiff {
  query: string;
  group: string;
  primaryIds: string[];
  oldTop15: string[];
  newTop15: string[];
  oldHit: boolean;
  newHit: boolean;
  maxRankDrop: number;
  newCardsInTop15: string[];
  pushedOutPrimaryIds: string[];
  classification: string;
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

function getTop15CardIds(hits: any[]): string[] {
  return hits.slice(0, 15).map((h: any) => h.cardId).filter(Boolean);
}

async function classify(newCardsInTop15: string[], pushedPrimaryIds: string[], oldHit: boolean, newHit: boolean): Promise<string> {
  if (newCardsInTop15.length === 0) return 'unrelated_fluctuation';
  if (!oldHit && newHit) return 'improvement';
  if (oldHit && !newHit) {
    // Check if pushed-out cards are the same topic as new cards
    for (const ncId of newCardsInTop15) {
      const nc = await prisma.card.findUnique({ where: { id: ncId } });
      if (!nc) continue;
      for (const pid of pushedPrimaryIds) {
        const pc = await prisma.card.findUnique({ where: { id: pid } });
        if (!pc) continue;
        // Same deck + overlapping subTopic → duplicate/overlap
        if (nc.deckId === pc.deckId && nc.subTopic === pc.subTopic) return 'duplicate_or_overlap';
        // Same deck but different subTopic → competition
        if (nc.deckId === pc.deckId) return 'benign_new_card_competition';
      }
    }
    return 'bad_new_card_noise';
  }
  if (newCardsInTop15.length > 0 && pushedPrimaryIds.length === 0) return 'benign_new_card_competition';
  return 'unclassified';
}

async function main() {
  await init();

  const diffs: CaseDiff[] = [];

  // Phase 1: Run with all cards (current)
  console.log('[regression] Phase 1: Current (754 cards)...');
  const currentResults: { query: string; hits: any[]; result: any }[] = [];
  for (const tc of TEST_CASES) {
    if (isLearningPath(tc.group || '')) continue;
    const hits = await hybridSearch({
      query: tc.query,
      maxResults: BASELINE_SEARCH_CONFIG.maxResults,
      minScore: BASELINE_SEARCH_CONFIG.minScore,
      candidateLimit: BASELINE_SEARCH_CONFIG.candidateLimit,
    });
    const result = computeCaseResult(tc, hits, 0);
    currentResults.push({ query: tc.query, hits, result });
  }

  // Phase 2: Delete new cards, run frozen
  console.log('[regression] Phase 2: Frozen (715 cards)...');
  // Soft-delete: delete embeddings for new cards
  for (const cid of NEW_CARD_IDS) {
    try { await prisma.$executeRawUnsafe("DELETE FROM ai_search_vec WHERE object_id = ? AND object_type = 'card'", cid); } catch {}
    try { await prisma.$executeRawUnsafe("DELETE FROM card_fts WHERE cardId = ?", cid); } catch {}
  }

  const frozenResults: { query: string; hits: any[]; result: any }[] = [];
  for (const tc of TEST_CASES) {
    if (isLearningPath(tc.group || '')) continue;
    const hits = await hybridSearch({
      query: tc.query,
      maxResults: BASELINE_SEARCH_CONFIG.maxResults,
      minScore: BASELINE_SEARCH_CONFIG.minScore,
      candidateLimit: BASELINE_SEARCH_CONFIG.candidateLimit,
    });
    const result = computeCaseResult(tc, hits, 0);
    frozenResults.push({ query: tc.query, hits, result });
  }

  // Restore new cards
  console.log('[regression] Restoring new cards...');
  const { syncCardEmbedding } = await import('../services/vector/embedding-sync');
  for (const cid of NEW_CARD_IDS) {
    await syncCardEmbedding(cid);
  }
  // Rebuild FTS5 for new cards
  try { await prisma.$executeRawUnsafe(`INSERT INTO card_fts(cardId, deckId, question, answer, tags, searchKeywords) SELECT id, deckId, COALESCE(question,''), COALESCE(answer,''), COALESCE(tags,''), COALESCE(searchKeywords,'') FROM Card WHERE id IN (${[...NEW_CARD_IDS].map(() => '?').join(',')})`, ...[...NEW_CARD_IDS]); } catch {}

  // Phase 3: Compare
  console.log('[regression] Comparing...\n');

  for (const tc of TEST_CASES) {
    if (isLearningPath(tc.group || '')) continue;
    const cur = currentResults.find(r => r.query === tc.query);
    const fro = frozenResults.find(r => r.query === tc.query);
    if (!cur || !fro) continue;

    const oldTop15 = getTop15CardIds(fro.hits);
    const newTop15 = getTop15CardIds(cur.hits);
    const oldHit = fro.result.primaryMissing.length === 0;
    const newHit = cur.result.primaryMissing.length === 0;

    // Rank changes
    let maxRankDrop = 0;
    const pushedOutPrimaryIds: string[] = [];
    for (const pid of tc.primaryIds || []) {
      const oldIdx = fro.hits.findIndex((h: any) => h.cardId === pid);
      const newIdx = cur.hits.findIndex((h: any) => h.cardId === pid);
      const oldRank = oldIdx >= 0 ? oldIdx + 1 : -1;
      const newRank = newIdx >= 0 ? newIdx + 1 : -1;
      if (oldRank > 0 && (newRank > oldRank || newRank === -1)) {
        maxRankDrop = Math.max(maxRankDrop, newRank - oldRank);
      }
      if (oldRank > 0 && oldRank <= 15 && (newRank > 15 || newRank === -1)) {
        pushedOutPrimaryIds.push(pid);
      }
    }

    // New cards in top15
    const newCardsInTop15 = newTop15.filter(id => NEW_CARD_IDS.has(id));

    const classification = await classify(newCardsInTop15, pushedOutPrimaryIds, oldHit, newHit);

    if (oldHit !== newHit || maxRankDrop > 10 || newCardsInTop15.length > 0 || pushedOutPrimaryIds.length > 0) {
      diffs.push({
        query: tc.query,
        group: tc.group || 'unknown',
        primaryIds: tc.primaryIds || [],
        oldTop15: oldTop15.slice(0, 5),
        newTop15: newTop15.slice(0, 5),
        oldHit,
        newHit,
        maxRankDrop,
        newCardsInTop15,
        pushedOutPrimaryIds,
        classification,
      });
    }
  }

  // Print report
  console.log('═'.repeat(80));
  console.log('CONTENT EXPANSION REGRESSION REVIEW');
  console.log('═'.repeat(80));
  console.log(`  Total diffs: ${diffs.length}`);
  console.log('');

  const oldHitNewMiss = diffs.filter(d => d.oldHit && !d.newHit);
  const rankDrops = diffs.filter(d => d.maxRankDrop > 10);
  const newCardIntrusions = diffs.filter(d => d.newCardsInTop15.length > 0);

  console.log(`  old=hit → new=miss:  ${oldHitNewMiss.length}`);
  console.log(`  rank drop > 10:      ${rankDrops.length}`);
  console.log(`  new cards in top15:  ${newCardIntrusions.length}`);
  console.log('');

  if (oldHitNewMiss.length > 0) {
    console.log('── OLD HIT → NEW MISS (critical) ──');
    for (const d of oldHitNewMiss) {
      console.log(`  "${d.query.slice(0, 55)}"`);
      console.log(`    class: ${d.classification}`);
      console.log(`    pushed out: [${d.pushedOutPrimaryIds.join(', ')}]`);
      console.log(`    new cards in top15: [${d.newCardsInTop15.join(', ')}]`);
    }
    console.log('');
  }

  // Group by classification
  const byClass = new Map<string, CaseDiff[]>();
  for (const d of diffs) {
    const list = byClass.get(d.classification) || [];
    list.push(d);
    byClass.set(d.classification, list);
  }

  console.log('── By Classification ──');
  for (const [cls, list] of byClass) {
    console.log(`  ${cls}: ${list.length}`);
    for (const d of list.slice(0, 5)) {
      console.log(`    "${d.query.slice(0, 50)}" → pushed=[${d.pushedOutPrimaryIds.join(',')}] new=[${d.newCardsInTop15.join(',')}]`);
    }
    if (list.length > 5) console.log(`    ... and ${list.length - 5} more`);
  }
  console.log('');

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
