// backend/src/services/search/hybrid-search.ts — Hybrid RAG 搜索编排

import prisma from '../../db/prisma';
import { getVectorStore } from '../vector/vector-store';
import { fts5Search } from './fts5-search';
import { getEmbeddingProvider } from '../embedding-provider';
import { textToVector } from '../vector/local-embedding';

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
  deckName?: string;
  tags: string[];
  score: number;
  matchType: 'vector' | 'keyword' | 'hybrid' | 'due';
  reason: string;
  due?: boolean;
  lapses?: number;
  snippet?: string;
}

const USER_ID = 'demo-user';

export async function hybridSearch(input: HybridSearchInput): Promise<CardMatch[]> {
  const results: CardMatch[] = [];

  // 1. Vector search (embedding API or local fallback)
  const provider = getEmbeddingProvider();
  const vectorStore = getVectorStore();
  if (vectorStore.name !== 'noop') {
    try {
      let queryVec: number[] | null = null;

      // Try external embedding API first
      if (provider) {
        try {
          const emb = await provider.embed({ model: (provider as any).defaultModel || 'text-embedding-3-small', texts: [input.query] });
          if (emb.embeddings.length > 0) queryVec = emb.embeddings[0];
        } catch { /* fallback to local */ }
      }

      // Local fallback: n-gram vector
      if (!queryVec) {
        queryVec = textToVector(input.query);
      }

      if (queryVec && queryVec.length > 0) {
        const vecResults = await vectorStore.search(queryVec, input.topK * 2);
        for (const r of vecResults) {
          results.push({ cardId: r.objectId, title: '', deckId: '', tags: [], score: r.score, matchType: 'vector', reason: '语义匹配' });
        }
      }
    } catch { /* skip vector if unavailable */ }
  }

  // 2. FTS5 keyword search
  const deckId = input.deckIds && input.deckIds.length === 1 ? input.deckIds[0] : undefined;
  const ftsResults = await fts5Search(input.query, input.topK * 2, deckId);
  for (const r of ftsResults) {
    const baseScore = Math.max(0.1, 1 / (1 + Math.abs(Number(r.rank || 0)) * 0.01));
    if (!results.find(x => x.cardId === r.cardId)) {
      results.push({ cardId: r.cardId, title: '', deckId: '', tags: [], score: baseScore, matchType: 'keyword', reason: '关键词匹配' });
    } else {
      const existing = results.find(x => x.cardId === r.cardId)!;
      existing.score += baseScore;
      existing.matchType = 'hybrid';
      existing.reason = '语义+关键词匹配';
    }
  }

    // 3. Fetch card details from DB
    if (results.length > 0) {
      const cardIds = results.map(r => r.cardId);
      const where: any = { id: { in: cardIds } };
      if (input.deckIds && input.deckIds.length > 0) {
        where.deckId = { in: input.deckIds };
      }
      const cards = await prisma.card.findMany({
        where,
        include: { deck: true },
      });
      for (const card of cards) {
        const match = results.find(r => r.cardId === card.id);
        if (match) {
          match.title = card.title || card.titleCn || card.question || card.id;
          match.deckId = card.deckId;
          match.deckName = card.deck.name;
          match.tags = card.tags ? JSON.parse(card.tags) : [];
          // 生成高亮片段：优先显示 question，截取前 100 字符
          const content = card.question || card.answer || card.description || '';
          match.snippet = content.slice(0, 120) + (content.length > 120 ? '...' : '');
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
