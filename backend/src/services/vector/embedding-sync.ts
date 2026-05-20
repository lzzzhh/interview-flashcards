// backend/src/services/vector/embedding-sync.ts — 卡片 Embedding 自动同步

import prisma from '../../db/prisma';
import { getEmbeddingProvider } from '../embedding-provider';
import { getVectorStore } from './vector-store';

/** 构建卡片索引文本（用于 embedding） */
export function buildCardIndexText(card: { question?: string | null; answer?: string | null; title?: string | null; titleCn?: string | null; tags?: string | null; description?: string | null }): string {
  const parts: string[] = [];
  if (card.titleCn) parts.push(card.titleCn);
  if (card.title) parts.push(card.title);
  if (card.question) parts.push(card.question);
  if (card.answer) parts.push(card.answer);
  if (card.description) parts.push(card.description);
  return parts.join(' ').slice(0, 4096);
}

/** 为单张卡片生成并写入 embedding */
export async function syncCardEmbedding(cardId: string): Promise<void> {
  const provider = getEmbeddingProvider();
  const store = getVectorStore();
  if (!provider || store.name === 'noop') return;

  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card) return;

  const text = buildCardIndexText(card);
  if (!text.trim()) return;

  try {
    const res = await provider.embed({ model: (provider as any).defaultModel || 'text-embedding-3-small', texts: [text] });
    if (res.embeddings.length > 0) {
      await store.upsert(cardId, 'card', res.embeddings[0]);

      // 记录到 EmbeddingRecord 表
      await prisma.embeddingRecord.upsert({
        where: { objectType_objectId_model: { objectType: 'card', objectId: cardId, model: res.dimension ? `emb-${res.dimension}` : 'embedding' } },
        create: {
          id: `emb-${cardId}-${Date.now()}`,
          objectType: 'card',
          objectId: cardId,
          provider: provider.name,
          model: (provider as any).defaultModel || 'text-embedding-3-small',
          dimension: res.dimension || res.embeddings[0].length,
          vectorStore: store.name,
          vectorTable: 'vec_embeddings',
          vectorRowId: 0,
          status: 'active',
          textHash: simpleHash(text),
        },
        update: {
          dimension: res.dimension || res.embeddings[0].length,
          status: 'active',
        },
      });
    }
  } catch (err) {
    console.error(`[embedding-sync] sync failed for card ${cardId}:`, (err as Error).message);
  }
}

/** 为多张卡片批量生成并写入 embedding */
export async function syncCardEmbeddings(cardIds: string[]): Promise<number> {
  const provider = getEmbeddingProvider();
  const store = getVectorStore();
  if (!provider || store.name === 'noop') return 0;

  const cards = await prisma.card.findMany({ where: { id: { in: cardIds } } });
  if (cards.length === 0) return 0;

  const texts = cards.map(c => buildCardIndexText(c));
  const validTexts = texts.filter(t => t.trim());

  if (validTexts.length === 0) return 0;

  try {
    const res = await provider.embed({ model: (provider as any).defaultModel || 'text-embedding-3-small', texts: validTexts });
    const items: { objectId: string; objectType: string; vector: number[] }[] = [];
    for (let i = 0; i < res.embeddings.length; i++) {
      const card = cards[i];
      if (card && res.embeddings[i]) {
        items.push({ objectId: card.id, objectType: 'card', vector: res.embeddings[i] });
      }
    }
    await store.upsertBatch(items);
    return items.length;
  } catch (err) {
    console.error('[embedding-sync] batch sync failed:', (err as Error).message);
    return 0;
  }
}

/** 删除卡片的 embedding */
export async function deleteCardEmbedding(cardId: string): Promise<void> {
  const store = getVectorStore();
  if (store.name === 'noop') return;
  try {
    await store.delete(cardId, 'card');
    await prisma.embeddingRecord.deleteMany({ where: { objectType: 'card', objectId: cardId } });
  } catch { /* ignore */ }
}

function simpleHash(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return hash.toString(16);
}
