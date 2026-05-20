// backend/src/services/search/fts5-search.ts — SQLite FTS5 关键词搜索

import prisma from '../../db/prisma';

/** FTS5 搜索结果 */
export interface FTS5Result {
  cardId: string;
  rank: number;
  matchField: string;
}

/** 初始化 FTS5 表和触发器 */
export async function initFTS5(): Promise<void> {
  const db = (prisma as any).$queryRawUnsafe || prisma.$executeRawUnsafe;
  // Card FTS5
  try {
    await db(`CREATE VIRTUAL TABLE IF NOT EXISTS card_fts USING fts5(cardId UNINDEXED, deckId UNINDEXED, question, answer, tags, tokenize='unicode61')`);
  } catch { /* may already exist */ }
  try {
    await db(`CREATE TRIGGER IF NOT EXISTS card_fts_insert AFTER INSERT ON Card BEGIN
      INSERT INTO card_fts(cardId, deckId, question, answer, tags)
      VALUES (new.id, new.deckId, new.question, new.answer, new.tags);
    END`);
  } catch {}
  try {
    await db(`CREATE TRIGGER IF NOT EXISTS card_fts_delete AFTER DELETE ON Card BEGIN
      DELETE FROM card_fts WHERE cardId = old.id;
    END`);
  } catch {}
  try {
    await db(`CREATE TRIGGER IF NOT EXISTS card_fts_update AFTER UPDATE ON Card BEGIN
      DELETE FROM card_fts WHERE cardId = old.id;
      INSERT INTO card_fts(cardId, deckId, question, answer, tags)
      VALUES (new.id, new.deckId, new.question, new.answer, new.tags);
    END`);
  } catch {}

  // SourceChunk FTS5
  try {
    await db(`CREATE VIRTUAL TABLE IF NOT EXISTS source_chunk_fts USING fts5(chunkId UNINDEXED, sourceId UNINDEXED, text, tokenize='unicode61')`);
  } catch { /* may already exist */ }
  try {
    await db(`CREATE TRIGGER IF NOT EXISTS source_chunk_fts_insert AFTER INSERT ON SourceChunk BEGIN
      INSERT INTO source_chunk_fts(chunkId, sourceId, text)
      VALUES (new.id, new.sourceId, new.text);
    END`);
  } catch {}
  try {
    await db(`CREATE TRIGGER IF NOT EXISTS source_chunk_fts_delete AFTER DELETE ON SourceChunk BEGIN
      DELETE FROM source_chunk_fts WHERE chunkId = old.id;
    END`);
  } catch {}
}

/** 重建 FTS5 索引 */
export async function rebuildFTS5(): Promise<void> {
  const db = (prisma as any).$queryRawUnsafe || prisma.$executeRawUnsafe;
  try { await db(`DELETE FROM card_fts`); } catch {}
  try { await db(`INSERT INTO card_fts(cardId, deckId, question, answer, tags) SELECT id, deckId, question, answer, tags FROM Card`); } catch {}
  try { await db(`DELETE FROM source_chunk_fts`); } catch {}
  try { await db(`INSERT INTO source_chunk_fts(chunkId, sourceId, text) SELECT id, sourceId, text FROM SourceChunk`); } catch {}
}

/** FTS5 关键词搜索 */
export async function fts5Search(query: string, limit: number = 20, deckId?: string): Promise<FTS5Result[]> {
  try {
    const escaped = query.replace(/['"]/g, ' ').trim();
    if (!escaped) return [];

    // For Chinese queries: skip FTS5 (unicode61 tokenizer splits CJK into individual chars causing noise)
    // Use LIKE with space-separated term OR matching
    if (/[\u4e00-\u9fff]/.test(escaped)) {
      const terms = escaped.split(/\s+/).filter(t => t.length > 0);
      const orClauses = terms.map(() => '(question LIKE ? OR titleCn LIKE ? OR title LIKE ? OR answer LIKE ?)').join(' OR ');
      const likeParams: string[] = [];
      for (const t of terms) {
        likeParams.push(`%${t}%`, `%${t}%`, `%${t}%`, `%${t}%`);
      }
      const likeRows = await prisma.$queryRawUnsafe(
        `SELECT id as cardId, 1 as rank FROM Card WHERE ${orClauses} LIMIT ?`,
        ...likeParams, limit,
      ) as any[];
      return (likeRows || []).map((r: any) => ({ cardId: r.cardId, rank: r.rank, matchField: 'like' }));
    }

    // Pure English/Latin: use FTS5
    let sql = '';
    const params: any[] = [];
    if (deckId) {
      sql = 'SELECT cardId, rank FROM card_fts WHERE card_fts MATCH ? AND deckId = ? ORDER BY rank LIMIT ?';
      params.push(escaped, deckId, limit);
    } else {
      sql = 'SELECT cardId, rank FROM card_fts WHERE card_fts MATCH ? ORDER BY rank LIMIT ?';
      params.push(escaped, limit);
    }

    const rows = await prisma.$queryRawUnsafe(sql, ...params) as any[];
    return (rows || []).map((r: any) => ({ cardId: r.cardId, rank: r.rank, matchField: 'fts5' }));
  } catch (e) {
    console.error('FTS5 search error:', e);
    return [];
  }
}

/** SourceChunk FTS5 搜索 */
export async function sourceChunkSearch(query: string, limit: number = 10, sourceId?: string): Promise<{ chunkId: string; sourceId: string; rank: number; textSnippet: string }[]> {
  try {
    const escaped = query.replace(/['"]/g, ' ').trim();
    if (!escaped) return [];

    let sql: string;
    const params: any[] = [];
    if (sourceId) {
      sql = `SELECT chunkId, sourceId, rank, snippet(source_chunk_fts, 2, '<mark>', '</mark>', '...', 32) as snippet FROM source_chunk_fts WHERE source_chunk_fts MATCH ? AND sourceId = ? ORDER BY rank LIMIT ?`;
      params.push(escaped, sourceId, limit);
    } else {
      sql = `SELECT chunkId, sourceId, rank, snippet(source_chunk_fts, 2, '<mark>', '</mark>', '...', 32) as snippet FROM source_chunk_fts WHERE source_chunk_fts MATCH ? ORDER BY rank LIMIT ?`;
      params.push(escaped, limit);
    }

    const rows = await prisma.$queryRawUnsafe(sql, ...params) as any[];
    return (rows || []).map((r: any) => ({
      chunkId: r.chunkId,
      sourceId: r.sourceId,
      rank: r.rank,
      textSnippet: r.snippet || '',
    }));
  } catch {
    return [];
  }
}
