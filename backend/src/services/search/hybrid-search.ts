// backend/src/services/search/hybrid-search.ts — Hybrid RAG 搜索编排

import prisma from '../../db/prisma';
import { getVectorStore } from '../vector/vector-store';
import { fts5Search } from './fts5-search';
import { getEmbeddingProvider } from '../embedding-provider';

interface HybridSearchInput {
  query: string;
  deckIds?: string[];
  topK: number;
  filters?: {
    difficulty?: string[];
    onlyDue?: boolean;
    includeWeakCards?: boolean;
  };
}

interface CardMatch {
  cardId: string;
  title: string;
  deckId: string;
  tags: string[];
  score: number;
  matchType: 'vector' | 'keyword' | 'hybrid' | 'due';
  reason: string;
  due?: boolean;
  lapses?: number;
}

const USER_ID = 'demo-user';

export async function hybridSearch(input: HybridSearchInput): Promise<CardMatch[]> {
  const provider = getEmbeddingProvider();
  const vectorStore = getVectorStore();
  const results: CardMatch[] = [];

  // 1. Vector search (if embedding provider available)
  if (provider && vectorStore.name !== 'noop') {
    try {
      const emb = await provider.embed({ model: 'text-embedding-3-small', texts: [input.query] });
      if (emb.embeddings.length > 0) {
        const vecResults = await vectorStore.search(emb.embeddings[0], input.topK * 2);
        for (const r of vecResults) {
          results.push({ cardId: r.objectId, title: '', deckId: '', tags: [], score: r.score, matchType: 'vector', reason: '语义匹配' });
        }
      }
    } catch { /* skip vector if unavailable */ }
  }

  // 2. FTS5 keyword search
  const ftsResults = await fts5Search(input.query, input.topK);
  for (const r of ftsResults) {
    if (!results.find(x => x.cardId === r.cardId)) {
      results.push({ cardId: r.cardId, title: '', deckId: '', tags: [], score: 1 / (1 + Number(r.rank)), matchType: 'keyword', reason: '关键词匹配' });
    } else {
      const existing = results.find(x => x.cardId === r.cardId)!;
      existing.score += 1 / (1 + Number(r.rank));
      existing.matchType = 'hybrid';
      existing.reason = '语义+关键词匹配';
    }
  }

  // 3. Fetch card details from DB
  if (results.length > 0) {
    const cardIds = results.map(r => r.cardId);
    const cards = await prisma.card.findMany({ where: { id: { in: cardIds } } });
    for (const card of cards) {
      const match = results.find(r => r.cardId === card.id);
      if (match) {
        match.title = card.title || card.titleCn || card.question || card.id;
        match.deckId = card.deckId;
        match.tags = card.tags ? JSON.parse(card.tags) : [];
      }
    }

    // 4. Business rerank: SM-2 status
    const progresses = await prisma.cardProgress.findMany({ where: { userId: USER_ID, cardId: { in: cardIds } } });
    for (const p of progresses) {
      const match = results.find(r => r.cardId === p.cardId);
      if (match && p.state !== 'new' && p.nextReview <= new Date()) {
        match.matchType = 'due';
        match.reason = '到期复习';
        match.due = true;
        match.lapses = p.lapses;
        match.score += 0.5; // boost due cards
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, input.topK);
}
