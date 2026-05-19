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
}

/** 重建 FTS5 索引（删除旧索引，从 Card 表全量重建） */
export async function rebuildFTS5(): Promise<void> {
  const db = (prisma as any).$queryRawUnsafe || prisma.$executeRawUnsafe;
  try { await db(`DELETE FROM card_fts`); } catch {}
  try { await db(`INSERT INTO card_fts(cardId, deckId, question, answer, tags) SELECT id, deckId, question, answer, tags FROM Card`); } catch {}
}

/** FTS5 关键词搜索 */
export async function fts5Search(query: string, limit: number = 20, deckId?: string): Promise<FTS5Result[]> {
  try {
    // FTS5 MATCH requires special escaping
    const escaped = query.replace(/['"]/g, ' ').trim();
    if (!escaped) return [];

    let sql = '';
    const params: any[] = [];
    if (deckId) {
      sql = 'SELECT cardId, rank FROM card_fts WHERE card_fts MATCH ?1 AND deckId = ?2 ORDER BY rank LIMIT ?3';
      params.push(escaped, deckId, limit);
    } else {
      sql = 'SELECT cardId, rank FROM card_fts WHERE card_fts MATCH ?1 ORDER BY rank LIMIT ?2';
      params.push(escaped, limit);
    }

    const rows = await prisma.$queryRawUnsafe(sql, ...params) as any[];
    return (rows || []).map((r: any) => ({ cardId: r.cardId, rank: r.rank, matchField: 'fts5' }));
  } catch (e) {
    console.error('FTS5 search error:', e);
    return [];
  }
}
