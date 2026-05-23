// backend/src/services/ingestion/search-readiness.ts
// Card Import Search Readiness Pipeline
//
// Ensures every card is searchable after import:
// 1. searchKeywords non-empty (auto-generated if missing)
// 2. bge-m3 embedding exists
// 3. FTS5 entry exists
// 4. Title exact smoke test passes (card found via title search)
// 5. Concept smoke test (card found via relevant keyword search)

import prisma from '../../db/prisma';
import { syncCardEmbedding } from '../vector/embedding-sync';
import { hybridSearch } from '../search/hybrid-search';
import { getEmbeddingProvider } from '../embedding-provider';
import { rebuildFTS5 } from '../search/fts5-search';

// ═══════════════════════════════════════════════════════
// Step 1: searchKeywords auto-generation
// ═══════════════════════════════════════════════════════

const STOP_WORDS = new Set([
  '的', '了', '是', '在', '和', '也', '都', '就', '要', '会', '能', '有', '人', '这', '中', '大',
  '不', '为', '上', '个', '们', '到', '说', '时', '去', '出', '以', '及', '对', '与', '或',
  'the', 'a', 'an', 'is', 'of', 'to', 'in', 'for', 'on', 'with', 'and', 'or', 'it',
  'be', 'as', 'at', 'by', 'from', 'that', 'this', 'are', 'was', 'but', 'not',
]);

export function generateSearchKeywords(card: {
  title?: string | null;
  titleCn?: string | null;
  question?: string | null;
  answer?: string | null;
  tags?: string | null;
  description?: string | null;
  subTopic?: string | null;
  deckId?: string | null;
}): string {
  const sources: string[] = [];

  // Title (highest weight)
  if (card.titleCn) sources.push(card.titleCn);
  if (card.title) sources.push(card.title);

  // Question / Answer
  if (card.question) sources.push(card.question);
  if (card.answer) {
    // Truncate answer to first 300 chars
    sources.push(card.answer.slice(0, 300));
  }

  // Tags
  if (card.tags) {
    try {
      const tags = JSON.parse(card.tags);
      if (Array.isArray(tags)) sources.push(tags.join(' '));
    } catch {
      sources.push(card.tags);
    }
  }

  // Description / subTopic
  if (card.description) sources.push(card.description.slice(0, 200));
  if (card.subTopic) sources.push(card.subTopic);

  const combined = sources.join(' ');

  // Extract meaningful terms
  const terms = new Set<string>();

  // Split by common delimiters
  const chunks = combined
    .split(/[，,。.、\s\n\t;；：:！!？?()（）【】\[\]《》""'']+/)
    .filter(t => t.length >= 2)
    .filter(t => !STOP_WORDS.has(t.toLowerCase()));

  for (const t of chunks) {
    // Keep Chinese terms (2+ chars) and English terms (3+ chars)
    if (/[\u4e00-\u9fff]/.test(t) && t.length >= 2) terms.add(t);
    if (/^[a-zA-Z]/.test(t) && t.length >= 3) terms.add(t.toLowerCase());
  }

  // Add deck-context terms
  if (card.deckId) {
    const deckContext: Record<string, string[]> = {
      'machine-learning': ['ML', '机器学习', '模型', '训练', '特征'],
      'deep-learning': ['DL', '深度学习', '神经网络', 'CNN', 'RNN', 'Transformer'],
      'statistics': ['统计', '概率', '假设检验', '回归', '分布'],
      'leetcode': ['算法', '数据结构', 'LeetCode', '面试'],
      'llm': ['LLM', '大模型', 'GPT', 'BERT', 'fine-tune'],
      'agent': ['Agent', '智能体', 'RAG', '工具调用'],
      'vibe-coding': ['AI编程', 'Cursor', 'Copilot', '代码生成'],
    };
    const contextTerms = deckContext[card.deckId] || [];
    for (const ct of contextTerms) terms.add(ct);
  }

  return [...terms].join(' ');
}

export async function upsertSearchKeywords(cardId: string): Promise<string> {
  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card) return '';

  const keywords = generateSearchKeywords(card);
  if (!keywords) return '';

  await prisma.card.update({
    where: { id: cardId },
    data: { searchKeywords: keywords },
  });

  return keywords;
}

// ═══════════════════════════════════════════════════════
// Step 2: Embedding verification
// ═══════════════════════════════════════════════════════

export async function verifyEmbedding(cardId: string): Promise<{ exists: boolean; dimension: number; model: string }> {
  const provider = getEmbeddingProvider();
  const model = provider ? (provider as any).defaultModel || 'unknown' : 'none';

  try {
    const rows = await prisma.$queryRawUnsafe(
      "SELECT embedding FROM ai_search_vec WHERE object_type = 'card' AND object_id = ?",
      cardId
    ) as any[];

    if (!rows || rows.length === 0) return { exists: false, dimension: 0, model };

    const buf = rows[0].embedding;
    const byteLength = typeof buf === 'string' ? buf.length / 2 : buf?.length || 0;
    const dimension = byteLength / 4; // float32 = 4 bytes

    return { exists: true, dimension, model };
  } catch {
    return { exists: false, dimension: 0, model };
  }
}

// ═══════════════════════════════════════════════════════
// Step 3: FTS5 verification
// ═══════════════════════════════════════════════════════

export async function verifyFTS5(cardId: string): Promise<boolean> {
  try {
    const rows = await prisma.$queryRawUnsafe(
      "SELECT cardId FROM card_fts WHERE cardId = ?", cardId
    ) as any[];
    return rows && rows.length > 0;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════
// Step 4: Smoke tests
// ═══════════════════════════════════════════════════════

export interface SmokeResult {
  passed: boolean;
  query: string;
  rank: number;
  score: number;
  cardId: string;
}

/** Title exact smoke test: search by card title, verify card in top15 */
export async function titleSmokeTest(cardId: string): Promise<SmokeResult> {
  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card) return { passed: false, query: '', rank: -1, score: 0, cardId };

  // Try titleCn first, then title
  const query = card.titleCn || card.title || '';
  if (!query) return { passed: false, query: '', rank: -1, score: 0, cardId };

  const hits = await hybridSearch({
    query,
    maxResults: 15,
    minScore: 0,
    candidateLimit: 300,
  });

  const idx = hits.findIndex(h => h.cardId === cardId);
  const rank = idx >= 0 ? idx + 1 : -1;
  const score = idx >= 0 ? hits[idx].score : 0;

  return {
    passed: rank > 0 && rank <= 15,
    query: query.slice(0, 80),
    rank,
    score,
    cardId,
  };
}

/** Concept smoke test: search by generated concept keywords */
export async function conceptSmokeTest(cardId: string): Promise<SmokeResult> {
  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card) return { passed: false, query: '', rank: -1, score: 0, cardId };

  // Build concept query from searchKeywords
  const keywords = (card.searchKeywords || '').split(/\s+/).filter(Boolean);
  if (keywords.length === 0) return { passed: false, query: '', rank: -1, score: 0, cardId };

  // Use first 3 keywords as concept query
  const query = keywords.slice(0, 3).join(' ');
  if (!query) return { passed: false, query: '', rank: -1, score: 0, cardId };

  const hits = await hybridSearch({
    query,
    maxResults: 50,
    minScore: 0,
    candidateLimit: 300,
  });

  const idx = hits.findIndex(h => h.cardId === cardId);
  const rank = idx >= 0 ? idx + 1 : -1;
  const score = idx >= 0 ? hits[idx].score : 0;

  return {
    passed: rank > 0 && rank <= 50,
    query: query.slice(0, 80),
    rank,
    score,
    cardId,
  };
}

// ═══════════════════════════════════════════════════════
// Full readiness check
// ═══════════════════════════════════════════════════════

export interface ReadinessReport {
  cardId: string;
  searchKeywords: { ok: boolean; value: string };
  embedding: { ok: boolean; exists: boolean; dimension: number; model: string };
  fts5: { ok: boolean };
  titleSmoke: SmokeResult;
  conceptSmoke: SmokeResult;
  allPassed: boolean;
  issues: string[];
}

export async function checkCardReadiness(cardId: string): Promise<ReadinessReport> {
  const issues: string[] = [];

  // 1. searchKeywords
  const card = await prisma.card.findUnique({ where: { id: cardId } });
  const kw = card?.searchKeywords || '';
  if (!kw) {
    issues.push('searchKeywords empty — run upsertSearchKeywords');
  }

  // 2. Embedding
  const emb = await verifyEmbedding(cardId);
  if (!emb.exists) {
    issues.push('embedding missing — run syncCardEmbedding');
  } else if (emb.dimension !== 1024) {
    issues.push(`embedding dimension ${emb.dimension}, expected 1024 (bge-m3)`);
  }

  // 3. FTS5
  const ftsOk = await verifyFTS5(cardId);
  if (!ftsOk) {
    issues.push('FTS5 entry missing — run rebuildFTS5');
  }

  // 4. Smoke tests
  const titleSmoke = await titleSmokeTest(cardId);
  if (!titleSmoke.passed) {
    issues.push(`title smoke failed: query="${titleSmoke.query.slice(0,40)}" rank=${titleSmoke.rank}`);
  }

  const conceptSmoke = await conceptSmokeTest(cardId);
  if (!conceptSmoke.passed) {
    issues.push(`concept smoke failed: query="${conceptSmoke.query.slice(0,40)}" rank=${conceptSmoke.rank}`);
  }

  return {
    cardId,
    searchKeywords: { ok: kw.length > 0, value: kw.slice(0, 100) },
    embedding: { ok: emb.exists && emb.dimension === 1024, ...emb },
    fts5: { ok: ftsOk },
    titleSmoke,
    conceptSmoke,
    allPassed: issues.length === 0,
    issues,
  };
}

/** Make a card search-ready: keywords → embedding → FTS5 → smoke */
export async function makeCardReady(cardId: string): Promise<ReadinessReport> {
  // 1. searchKeywords
  const kw = await upsertSearchKeywords(cardId);

  // 2. Embedding (this also triggers FTS5 rebuild via DB triggers on update)
  await syncCardEmbedding(cardId);

  // 3. Verify FTS5 (should be auto-populated by triggers after searchKeywords update)
  const ftsOk = await verifyFTS5(cardId);
  if (!ftsOk) {
    await rebuildFTS5(); // force full rebuild if trigger didn't fire
  }

  // 4. Re-verify
  return checkCardReadiness(cardId);
}

/** Batch: make all cards search-ready */
export async function makeAllCardsReady(): Promise<{ total: number; passed: number; failed: string[] }> {
  const cards = await prisma.card.findMany({ select: { id: true } });
  let passed = 0;
  const failed: string[] = [];

  for (let i = 0; i < cards.length; i++) {
    const report = await makeCardReady(cards[i].id);
    if (report.allPassed) passed++;
    else failed.push(cards[i].id);
    if (i % 50 === 0) console.error(`[readiness] ${i}/${cards.length} cards processed`);
  }

  return { total: cards.length, passed, failed };
}
