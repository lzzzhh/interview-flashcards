// backend/src/evaluation/missing-diag.ts — Full missing card diagnosis
//
// For each missing card, outputs: query, group, primaryId, normalized query,
// expanded keywords, whether it entered FTS5/searchKeywords/vector channels,
// and root cause classification.

import { readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
function loadEnv() {
  const envPath = __dirname + '/../../.env';
  try {
    for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      if (!process.env[trimmed.slice(0, eq).trim()])
        process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  } catch {}
}
loadEnv();

import { setLLMProvider, OpenAIChatProvider } from '../services/llm-provider';
import { setEmbeddingProvider, OpenAIEmbeddingProvider, getEmbeddingProvider } from '../services/embedding-provider';
import { getVectorStore, SqliteVecVectorStore, setVectorStore, initVectorStore } from '../services/vector/vector-store';
import { initFTS5 } from '../services/search/fts5-search';
import { hybridSearch } from '../services/search/hybrid-search';
import { expandQuery, normalizeQuery } from '../services/search/query-expander';
import { TEST_CASES } from './test-cases';
import { computeCaseResult } from './metrics';
import prisma from '../db/prisma';

async function initProviders() {
  const baseUrl = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || 'deepseek-chat';
  const embBaseUrl = process.env.EMBEDDING_BASE_URL;
  const embApiKey = process.env.EMBEDDING_API_KEY;

  if (baseUrl && apiKey) {
    const p = new OpenAIChatProvider(baseUrl, apiKey);
    (p as any).defaultModel = model;
    setLLMProvider(p);
  }
  if (embBaseUrl && embApiKey) {
    const embModel = process.env.EMBEDDING_MODEL || 'bge-m3';
    setEmbeddingProvider(new OpenAIEmbeddingProvider(embBaseUrl, embApiKey));
    (getEmbeddingProvider as any).defaultModel = embModel;
  }
  if (getVectorStore().name === 'noop') {
    setVectorStore(new SqliteVecVectorStore());
  }
  await initVectorStore();
  await initFTS5();
}

type FailCause = 
  | 'data_missing'       // card not in DB
  | 'alias_missing'      // query uses alias not in card's searchKeywords
  | 'normalize_failed'   // long query normalization stripped key terms
  | 'deck_inference_failed' // QE didn't infer correct deck, deckBoost didn't activate
  | 'vector_failed'      // bge-m3 couldn't match semantics
  | 'label_too_narrow';  // test case expects wrong card for this query

interface MissingDetail {
  query: string;
  group: string;
  cardId: string;
  normalizedQuery: string;
  expandedKeywords: string[];
  expandedDecks: string[];
  cardTitle: string;
  cardDeck: string;
  cardSearchKeywords: string;
  inFTS5: boolean;
  inSearchKeywords: boolean;
  inVector: boolean;
  vectorRank: number;  // -1 if not in vector results
  cause: FailCause;
}

async function main() {
  console.error('[missing-diag] Initializing...');
  await initProviders();

  const details: MissingDetail[] = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    if (!tc) continue;

    const { keywords, deckIds, normalizedQuery } = expandQuery(tc.query);
    const hits = await hybridSearch({ query: tc.query, maxResults: 100, minScore: 0, candidateLimit: 500 });
    const result = computeCaseResult(tc, hits, 0);

    for (const missingId of result.primaryMissing) {
      const card = await prisma.card.findUnique({
        where: { id: missingId },
        select: { id: true, titleCn: true, title: true, deckId: true, searchKeywords: true },
      });

      // Channel participation
      const inFTS5 = hits.some(h => h.cardId === missingId && (h.matchType === 'keyword' || h.matchType === 'hybrid'));
      const inVector = hits.some(h => h.cardId === missingId && (h.matchType === 'semantic' || h.matchType === 'vector'));
      // searchKeywords channel: check if card's searchKeywords contain any expanded term
      const skw = (card?.searchKeywords || '').toLowerCase();
      const allTerms = (tc.query + ' ' + keywords.join(' ')).toLowerCase();
      const inSearchKeywords = allTerms.split(/\s+/).some(t => t.length >= 2 && skw.includes(t));

      // Vector rank
      const vecRank = hits.findIndex(h => h.cardId === missingId);

      // Root cause classification
      let cause: FailCause = 'alias_missing';
      if (!card) {
        cause = 'data_missing';
      } else if (normalizedQuery && normalizedQuery !== tc.query && normalizedQuery.length < tc.query.length * 0.5) {
        cause = 'normalize_failed';
      } else if (!deckIds.includes(card.deckId) && card.deckId !== 'unknown') {
        cause = 'deck_inference_failed';
      } else if (!inFTS5 && !inSearchKeywords && vecRank < 0) {
        cause = 'vector_failed';
      } else if (!inSearchKeywords) {
        cause = 'alias_missing';
      }

      details.push({
        query: tc.query,
        group: tc.group,
        cardId: missingId,
        normalizedQuery: normalizedQuery || '',
        expandedKeywords: keywords.slice(0, 15),
        expandedDecks: deckIds,
        cardTitle: card ? (card.titleCn || card.title || '?').slice(0, 60) : '(not found)',
        cardDeck: card?.deckId || 'unknown',
        cardSearchKeywords: (card?.searchKeywords || '').slice(0, 100),
        inFTS5,
        inSearchKeywords,
        inVector,
        vectorRank: vecRank,
        cause,
      });
    }

    console.error(`  [${i+1}/${TEST_CASES.length}] "${tc.query.slice(0,40)}" missing=${result.primaryMissing.length}`);
  }

  // ── Report ──
  console.log(JSON.stringify({
    total: details.length,
    byCause: Object.fromEntries(
      [...new Set(details.map(d => d.cause))]
        .map(c => [c, details.filter(d => d.cause === c).length])
    ),
    byCard: Object.fromEntries(
      [...new Set(details.map(d => d.cardId))]
        .map(id => [id, details.filter(d => d.cardId === id).length])
        .sort((a, b) => b[1] - a[1])
    ),
    details: details.map(d => ({
      q: d.query.slice(0, 50),
      g: d.group,
      id: d.cardId,
      cause: d.cause,
      title: d.cardTitle,
      deck: d.cardDeck,
      fts5: d.inFTS5,
      skw: d.inSearchKeywords,
      vec: d.inVector,
      vRank: d.vectorRank,
    })),
  }, null, 2));

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
