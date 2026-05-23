// backend/src/evaluation/smoke-new-cards.ts
// Smoke test for recently imported/updated cards.
// Usage: npm run evaluate:smoke-new-cards [--since <ISO>] [--limit <n>]

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

interface SmokeResult {
  cardId: string;
  titleCn: string;
  passed: boolean;
  hardFailed: boolean;
  checks: { name: string; passed: boolean; severity: 'hard_fail' | 'warning'; detail: string }[];
}

const HARD_FAIL_CHECKS = ['searchKeywords', 'FTS5', 'embedding', 'titleCn smoke', 'title smoke'];
const WARNING_CHECKS = ['subTopic smoke', 'keyword smoke'];

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

async function main() {
  await init();

  // Parse args
  const args = process.argv.slice(2);
  let since: Date | null = null;
  let limit = 20;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--since' && args[i+1]) { since = new Date(args[i+1]); i++; }
    if (args[i] === '--limit' && args[i+1]) { limit = parseInt(args[i+1]); i++; }
  }

  // Find cards to test
  const where: any = { orderBy: { createdAt: 'desc' as const }, take: limit };
  if (since) {
    where.where = { createdAt: { gte: since } };
    delete where.take;
  }

  const cards = await prisma.card.findMany({
    ...where,
    select: { id: true, titleCn: true, title: true, searchKeywords: true, subTopic: true, deckId: true },
  });

  console.log(`\n[eval] Smoke testing ${cards.length} cards${since ? ` (since ${since.toISOString()})` : ''}...\n`);

  const results: SmokeResult[] = [];

  for (const card of cards) {
    const checks: SmokeResult['checks'] = [];

    // 1. searchKeywords non-empty
    const hasKw = (card.searchKeywords || '').trim().length > 0;
    checks.push({ name: 'searchKeywords', passed: hasKw, severity: 'hard_fail', detail: hasKw ? 'non-empty' : 'empty' });

    // 2. FTS5 entry
    let ftsExists = false;
    try {
      const fts = await prisma.$queryRawUnsafe("SELECT cardId FROM card_fts WHERE cardId = ?", card.id) as any[];
      ftsExists = fts.length > 0;
    } catch {}
    checks.push({ name: 'FTS5', passed: ftsExists, severity: 'hard_fail', detail: ftsExists ? 'exists' : 'missing' });

    // 3. Embedding
    let embExists = false;
    try {
      const emb = await prisma.$queryRawUnsafe(
        "SELECT embedding FROM ai_search_vec WHERE object_type = 'card' AND object_id = ?", card.id
      ) as any[];
      embExists = emb.length > 0;
    } catch {}
    checks.push({ name: 'embedding', passed: embExists, severity: 'hard_fail', detail: embExists ? 'exists' : 'missing' });

    // 4. Title exact smoke (use titleCn)
    if (card.titleCn) {
      const hits = await hybridSearch({ query: card.titleCn, maxResults: 15, minScore: 0, candidateLimit: 300 });
      const idx = hits.findIndex((h: any) => h.cardId === card.id);
      const inTop15 = idx >= 0 && idx < 15;
      checks.push({ name: 'titleCn smoke', passed: inTop15, severity: 'hard_fail', detail: inTop15 ? `rank ${idx+1}` : `rank ${idx >= 0 ? idx+1 : 'N/A'}` });
    }

    // 5. Title smoke (English)
    if (card.title && card.title !== card.titleCn) {
      const hits = await hybridSearch({ query: card.title, maxResults: 15, minScore: 0, candidateLimit: 300 });
      const idx = hits.findIndex((h: any) => h.cardId === card.id);
      const inTop15 = idx >= 0 && idx < 15;
      checks.push({ name: 'title smoke', passed: inTop15, severity: 'hard_fail', detail: inTop15 ? `rank ${idx+1}` : `rank ${idx >= 0 ? idx+1 : 'N/A'}` });
    }

    // 6. searchKeywords query smoke
    if (hasKw) {
      const kwTerms = card.searchKeywords!.split(/\s+/).filter(Boolean).slice(0, 4).join(' ');
      if (kwTerms) {
        const hits = await hybridSearch({ query: kwTerms, maxResults: 50, minScore: 0, candidateLimit: 300 });
        const idx = hits.findIndex((h: any) => h.cardId === card.id);
        const inTop50 = idx >= 0 && idx < 50;
        checks.push({ name: 'keyword smoke', passed: inTop50, severity: 'warning', detail: inTop50 ? `rank ${idx+1}` : `rank ${idx >= 0 ? idx+1 : 'N/A'}` });
      }
    }

    // 7. Concept/subTopic smoke
    if (card.subTopic) {
      const hits = await hybridSearch({ query: card.subTopic, maxResults: 50, minScore: 0, candidateLimit: 300 });
      const idx = hits.findIndex((h: any) => h.cardId === card.id);
      const inTop50 = idx >= 0 && idx < 50;
      checks.push({ name: 'subTopic smoke', passed: inTop50, severity: 'warning', detail: inTop50 ? `rank ${idx+1}` : `rank ${idx >= 0 ? idx+1 : 'N/A'}` });
    }

    const allPassed = checks.every(c => c.passed);
    const hardFailed = checks.some(c => c.severity === 'hard_fail' && !c.passed);
    results.push({ cardId: card.id, titleCn: card.titleCn || card.id, passed: allPassed, hardFailed, checks });
  }

  // Report
  const passed = results.filter(r => r.passed);
  const hardFailed = results.filter(r => r.hardFailed);
  const warningsOnly = results.filter(r => !r.passed && !r.hardFailed);

  console.log('═'.repeat(70));
  console.log(`Smoke Test Results: ${passed.length}/${results.length} hard-pass, ${hardFailed.length} hard-fail, ${warningsOnly.length} warning-only`);
  console.log('═'.repeat(70));

  if (hardFailed.length > 0) {
    console.log('\nHard failures:');
    for (const r of hardFailed) {
      console.log(`\n  ${r.cardId} — "${r.titleCn.slice(0, 60)}"`);
      for (const c of r.checks.filter(c => c.severity === 'hard_fail' && !c.passed)) {
        console.log(`    ✗ ${c.name}: ${c.detail}`);
      }
    }
  }

  if (warningsOnly.length > 0) {
    console.log('\nWarnings (not hard-fail):');
    for (const r of warningsOnly) {
      console.log(`\n  ${r.cardId} — "${r.titleCn.slice(0, 60)}"`);
      for (const c of r.checks.filter(c => !c.passed)) {
        console.log(`    ⚠ ${c.name}: ${c.detail}`);
      }
    }
  }

  console.log('');
  await prisma.$disconnect();
  process.exit(hardFailed.length > 0 ? 1 : 0);

  // Summary counts
  const failReasons = new Map<string, number>();
  for (const r of failed) {
    for (const c of r.checks.filter(c => !c.passed)) {
      failReasons.set(c.name, (failReasons.get(c.name) || 0) + 1);
    }
  }
  if (failReasons.size > 0) {
    console.log('\nFailure breakdown:');
    for (const [reason, count] of failReasons) {
      console.log(`  ${reason}: ${count}`);
    }
  }

  console.log('');
  await prisma.$disconnect();
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(2); });
