// backend/src/services/vector/local-embedding.ts — 本地文本向量化（无需外部 API）
// 使用 character n-gram + feature hashing 生成固定维度向量

import { getVectorStore } from './vector-store';
import prisma from '../../db/prisma';

const VECTOR_DIM = 256; // 向量维度（小数据集够用）

/** 构建卡片索引文本 */
function buildCardIndexText(card: { question?: string | null; answer?: string | null; title?: string | null; titleCn?: string | null; description?: string | null }): string {
  const parts: string[] = [];
  if (card.titleCn) parts.push(card.titleCn);
  if (card.title) parts.push(card.title);
  if (card.question) parts.push(card.question);
  if (card.answer) parts.push(card.answer);
  if (card.description) parts.push(card.description);
  return parts.join(' ');
}

/** 从文本提取 n-gram token */
function extractTokens(text: string): string[] {
  const tokens: string[] = [];

  // 1. 空格分隔的词（英文/数字）
  const words = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  for (const w of words) {
    if (w.length >= 2) tokens.push(`w:${w}`);
  }

  // 2. 中文字符 bigram
  const cleaned = text.replace(/[\s\d\p{P}]/gu, '');
  for (let i = 0; i < cleaned.length - 1; i++) {
    tokens.push(`b:${cleaned[i]}${cleaned[i + 1]}`);
  }

  // 3. 中文字符 trigram
  for (let i = 0; i < cleaned.length - 2; i++) {
    tokens.push(`t:${cleaned[i]}${cleaned[i + 1]}${cleaned[i + 2]}`);
  }

  return tokens;
}

/** 简单 hash 函数 (djb2) */
function hashToken(token: string): number {
  let hash = 5381;
  for (let i = 0; i < token.length; i++) {
    hash = ((hash << 5) + hash) ^ token.charCodeAt(i);
    hash |= 0; // 32-bit
  }
  return Math.abs(hash) % VECTOR_DIM;
}

/** 将文本转为固定维度向量 */
export function textToVector(text: string): number[] {
  const vec = new Array(VECTOR_DIM).fill(0);
  const tokens = extractTokens(text);
  if (tokens.length === 0) return vec;

  for (const token of tokens) {
    const dim = hashToken(token);
    vec[dim] += 1;
  }

  // L2 归一化
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < vec.length; i++) vec[i] /= norm;
  }

  return vec;
}

/** 为单张卡片生成本地向量 */
export async function localSyncCardEmbedding(cardId: string): Promise<void> {
  const store = getVectorStore();
  if (store.name === 'noop') return;

  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card) return;

  const text = buildCardIndexText(card);
  if (!text.trim()) return;

  const vec = textToVector(text);
  await store.upsert(cardId, 'card', vec);
}

/** 批量生成卡片本地向量 */
export async function localSyncCardEmbeddings(cardIds: string[]): Promise<number> {
  const store = getVectorStore();
  if (store.name === 'noop') return 0;

  const cards = await prisma.card.findMany({ where: { id: { in: cardIds } } });
  if (cards.length === 0) return 0;

  const items: { objectId: string; objectType: string; vector: number[] }[] = [];
  for (const card of cards) {
    const text = buildCardIndexText(card);
    if (!text.trim()) continue;
    items.push({ objectId: card.id, objectType: 'card', vector: textToVector(text) });
  }

  if (items.length > 0) {
    await store.upsertBatch(items);
  }
  return items.length;
}

/** 全量重建所有卡片的本地向量 */
export async function rebuildLocalEmbeddings(): Promise<{ total: number; synced: number }> {
  const store = getVectorStore();
  if (store.name === 'noop') return { total: 0, synced: 0 };

  // 清空现有向量
  try { await prisma.$executeRawUnsafe(`DELETE FROM vec_embeddings`); } catch {}

  const cards = await prisma.card.findMany({ select: { id: true } });
  const cardIds = cards.map(c => c.id);
  const synced = await localSyncCardEmbeddings(cardIds);
  return { total: cardIds.length, synced };
}

/** 生成查询向量并搜索 */
export async function localVectorSearch(query: string, topK: number): Promise<{ objectId: string; score: number }[]> {
  const store = getVectorStore();
  if (store.name === 'noop') return [];

  const queryVec = textToVector(query);
  const results = await store.search(queryVec, topK);
  return results.map(r => ({ objectId: r.objectId, score: r.score }));
}
