#!/usr/bin/env npx tsx
// backend/src/ingestion/readiness-cli.ts
// CLI for Card Import Search Readiness Pipeline
//
// Usage:
//   npx tsx src/ingestion/readiness-cli.ts check <cardId>    — check one card
//   npx tsx src/ingestion/readiness-cli.ts fix <cardId>      — fix one card
//   npx tsx src/ingestion/readiness-cli.ts fix-all            — fix all cards
//   npx tsx src/ingestion/readiness-cli.ts gaps               — detect coverage gaps
//   npx tsx src/ingestion/readiness-cli.ts audit              — audit all cards

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
import { initFTS5, rebuildFTS5 } from '../services/search/fts5-search';
import {
  checkCardReadiness, makeCardReady, makeAllCardsReady,
  verifyFTS5, verifyEmbedding, upsertSearchKeywords,
} from '../services/ingestion/search-readiness';
import { detectCoverageGaps, printGapReport } from '../services/ingestion/coverage-gap-detector';

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
  const cmd = process.argv[2];
  const arg = process.argv[3];

  await init();

  switch (cmd) {
    case 'check': {
      if (!arg) { console.error('Usage: readiness-cli.ts check <cardId>'); process.exit(1); }
      const report = await checkCardReadiness(arg);
      console.log(JSON.stringify(report, null, 2));
      process.exit(report.allPassed ? 0 : 1);
    }

    case 'fix': {
      if (!arg) { console.error('Usage: readiness-cli.ts fix <cardId>'); process.exit(1); }
      console.error(`[readiness] Making card ${arg} ready...`);
      const report = await makeCardReady(arg);
      console.log(JSON.stringify(report, null, 2));
      process.exit(report.allPassed ? 0 : 1);
    }

    case 'fix-all': {
      console.error('[readiness] Making all cards search-ready...');
      const result = await makeAllCardsReady();
      console.log(`\nDone: ${result.passed}/${result.total} passed`);
      if (result.failed.length > 0) {
        console.log(`Failed (${result.failed.length}): ${result.failed.join(', ')}`);
      }
      process.exit(result.failed.length > 0 ? 1 : 0);
    }

    case 'gaps': {
      console.error('[readiness] Detecting coverage gaps...');
      const gaps = await detectCoverageGaps();
      printGapReport(gaps);
      const cg = gaps.filter(g => g.classification === 'coverage_gap');
      process.exit(cg.length > 0 ? 1 : 0);
    }

    case 'audit': {
      console.error('[readiness] Auditing all cards...');
      const { writeFileSync, mkdirSync, existsSync } = await import('fs');
      const reportDir = __dirname + '/../../../reports/readiness';
      if (!existsSync(reportDir)) mkdirSync(reportDir, { recursive: true });

      const cards = await prisma.card.findMany({ select: { id: true, searchKeywords: true, titleCn: true, createdAt: true } });
      let noKw = 0, noEmb = 0, noFts = 0;
      const badCards: string[] = [];
      for (const c of cards) {
        if (!c.searchKeywords?.trim()) noKw++;
        const emb = await verifyEmbedding(c.id);
        if (!emb.exists) noEmb++;
        const fts = await verifyFTS5(c.id);
        if (!fts) noFts++;
        if (!c.searchKeywords?.trim() || !emb.exists || !fts) badCards.push(c.id);
      }
      const ready = cards.length - Math.max(noKw, noEmb, noFts);

      // Gaps (skipped — use `npm run readiness:gaps` for full gap detection)
      const cgCount = -1; // not computed, use separate command

      console.log(`  Total cards: ${cards.length}`);
      console.log(`  Missing searchKeywords: ${noKw}`);
      console.log(`  Missing embedding:      ${noEmb}`);
      console.log(`  Missing FTS5:           ${noFts}`);
      console.log(`  Ready:                  ${ready}`);
      console.log(`  Coverage gaps:          ${cgCount}`);

      // Generate report
      const report = `# Import Readiness Report

**Generated**: ${new Date().toISOString()}

## Summary

| Metric | Value |
|--------|-------|
| Total cards | ${cards.length} |
| With searchKeywords | ${cards.length - noKw} |
| Missing searchKeywords | ${noKw} |
| With embeddings | ${cards.length - noEmb} |
| Missing embeddings | ${noEmb} |
| In FTS5 | ${cards.length - noFts} |
| Missing FTS5 | ${noFts} |
| Fully ready | ${ready} |
| Coverage gaps remaining | ${cgCount} |
| Ready % | ${((ready / cards.length) * 100).toFixed(1)}% |

## Metadata Warnings

${badCards.length > 0 ? badCards.map(id => `- ${id}: not fully ready`).join('\n') : '- None — all cards ready'}

## Recommended Next Actions

${noKw > 0 ? '- Run `npm run readiness:fix-all` to generate missing searchKeywords\n' : ''}${noEmb > 0 ? '- Run embedding sync for cards missing embeddings\n' : ''}${noFts > 0 ? '- Run `npm run readiness:fix-all` to rebuild FTS5\n' : ''}${cgCount > 0 ? '- Review coverage gaps with `npm run readiness:gaps`\n' : ''}${badCards.length === 0 ? '- No action needed — DB is fully ready\n' : ''}
`;
      writeFileSync(reportDir + '/import-readiness-report.md', report);
      console.log(`  Report: ${reportDir}/import-readiness-report.md`);

      process.exit(noKw > 0 || noEmb > 0 || noFts > 0 ? 1 : 0);
    }

    default:
      console.error('Usage: readiness-cli.ts <check|fix|fix-all|gaps|audit> [cardId]');
      process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
