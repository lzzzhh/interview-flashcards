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
    await db(`CREATE VIRTUAL TABLE IF NOT EXISTS card_fts USING fts5(cardId UNINDEXED, deckId UNINDEXED, question, answer, tags, searchKeywords, tokenize='unicode61')`);
  } catch { /* may already exist */ }
  try {
    await db(`CREATE TRIGGER IF NOT EXISTS card_fts_insert AFTER INSERT ON Card BEGIN
      INSERT INTO card_fts(cardId, deckId, question, answer, tags, searchKeywords)
      VALUES (new.id, new.deckId, new.question, new.answer, new.tags, new.searchKeywords);
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
      INSERT INTO card_fts(cardId, deckId, question, answer, tags, searchKeywords)
      VALUES (new.id, new.deckId, new.question, new.answer, new.tags, new.searchKeywords);
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
  try { await prisma.$executeRawUnsafe(`DELETE FROM card_fts`); } catch {}
  try { await prisma.$executeRawUnsafe(`INSERT INTO card_fts(cardId, deckId, question, answer, tags, searchKeywords) SELECT id, deckId, COALESCE(question,''), COALESCE(answer,''), COALESCE(tags,''), COALESCE(searchKeywords,'') FROM Card`); } catch {}
  try { await prisma.$executeRawUnsafe(`DELETE FROM source_chunk_fts`); } catch {}
  try { await prisma.$executeRawUnsafe(`INSERT INTO source_chunk_fts(chunkId, sourceId, text) SELECT id, sourceId, text FROM SourceChunk`); } catch {}
}

/** FTS5 关键词搜索 */
export async function fts5Search(query: string, limit: number = 20, deckId?: string): Promise<FTS5Result[]> {
  try {
    const escaped = query.replace(/['"]/g, ' ').trim();
    if (!escaped) return [];

    // For Chinese-containing queries → LIKE only (no FTS5, avoids column-name + ranking noise)
    if (/[\u4e00-\u9fff]/.test(escaped)) {
      const terms = extractChineseTerms(escaped);
      if (!process.env.EVAL_SUPPRESS_DEBUG) console.log("likeSearch terms:", terms, "limit:", limit); const lsr = await likeSearch(terms, limit); if (!process.env.EVAL_SUPPRESS_DEBUG) console.log("likeSearch returned:", lsr.length); return lsr;
    }

    // Pure English/Latin: use FTS5 (quote terms to avoid column-name conflicts)
    const engTerms = escaped.split(/\s+/).filter(t => t.length > 0);
    const engQuoted = engTerms.map(t => `"${t.replace(/"/g, '""')}"`).join(' ');
    if (!engQuoted) return [];

    const sql = deckId
      ? 'SELECT cardId, rank FROM card_fts WHERE card_fts MATCH ? AND deckId = ? ORDER BY rank LIMIT ?'
      : 'SELECT cardId, rank FROM card_fts WHERE card_fts MATCH ? ORDER BY rank LIMIT ?';
    const params: any[] = deckId ? [engQuoted, deckId, limit] : [engQuoted, limit];

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

// ---- Internal Helpers ----

/** Raw FTS5 search helper — quote each term to avoid column-name conflicts */
async function fts5RawSearch(escaped: string, limit: number, deckId?: string): Promise<FTS5Result[]> {
  // Quote each term for FTS5 MATCH: "term1" "term2" ...
  const terms = escaped.split(/\s+/).filter(t => t.length > 0);
  const quoted = terms.map(t => `"${t.replace(/"/g, '""')}"`).join(' ');
  if (!quoted) return [];

  const sql = deckId
    ? 'SELECT cardId, rank FROM card_fts WHERE card_fts MATCH ? AND deckId = ? ORDER BY rank LIMIT ?'
    : 'SELECT cardId, rank FROM card_fts WHERE card_fts MATCH ? ORDER BY rank LIMIT ?';
  const params: any[] = deckId ? [quoted, deckId, limit] : [quoted, limit];
  try {
    const rows = await prisma.$queryRawUnsafe(sql, ...params) as any[];
    return (rows || []).map((r: any) => ({ cardId: r.cardId, rank: r.rank, matchField: 'fts5' }));
  } catch {
    return [];
  }
}

/** LIKE search helper: runs separate queries per term to avoid result crowding */
async function likeSearch(terms: string[], limit: number): Promise<FTS5Result[]> {
  if (terms.length === 0) return [];

  // For multiple terms, run separate queries and merge to avoid shorter/noisy terms crowding out good matches
  const seen = new Set<string>();
  const results: FTS5Result[] = [];

  for (const t of terms.slice(0, 4)) { // max 4 terms
    const rows = await prisma.$queryRawUnsafe(
      `SELECT id as cardId, 1 as rank FROM Card WHERE question LIKE ? OR titleCn LIKE ? OR title LIKE ? OR answer LIKE ? OR description LIKE ? OR approach LIKE ? OR tags LIKE ? OR searchKeywords LIKE ? OR subTopic LIKE ? LIMIT ?`,
      `%${t}%`, `%${t}%`, `%${t}%`, `%${t}%`, `%${t}%`, `%${t}%`, `%${t}%`, `%${t}%`, `%${t}%`, limit,
    ) as any[];
    for (const row of (rows || [])) {
      if (!seen.has(row.cardId)) {
        results.push({ cardId: row.cardId, rank: row.rank, matchField: 'like' });
        seen.add(row.cardId);
      }
    }
  }
  return results;
}

/** Extract meaningful Chinese terms: strip qualifiers, progressive truncation */
function extractChineseTerms(escaped: string): string[] {
  const spaceTerms = escaped.split(/\s+/).filter(t => t.length > 0);
  if (spaceTerms.length > 1) {
    const prefix = /^(我想|我要|我想学|我要学|怎么学|怎么学习|什么|什么是|有没有|能不能|可以|应该|需要|为什么|请问|如何|怎样|怎么样)/;
    const stripped = new Set(spaceTerms.map(t => t.replace(prefix, '')).filter(t => t.length >= 2));
    // Add bigrams from stripped terms as fallback
    for (const term of [...stripped]) {
      for (let i = 0; i < term.length - 1; i++) stripped.add(term.slice(i, i + 2));
    }
    return [...stripped];
  }

  const phrase = spaceTerms[0] || escaped;
  const expanded = new Set<string>();
  expanded.add(phrase);
  // Also add each individual char-bigram as fallback
  if (phrase.length >= 2) {
    for (let i = 0; i < phrase.length - 1; i++) expanded.add(phrase.slice(i, i + 2));
  }

  let stripped = phrase
    .replace(/^(我想|我要|我想学|我要学|我想了解|怎么学|怎么学习|什么|什么是|有没有|能不能|可以|应该|需要|为什么|请问|如何|怎样|怎么样)/, '')
    .replace(/(呢|吗|啊|吧|的|了|是|怎么学|如何学)$/, '');
  if (stripped.length >= 2 && stripped !== phrase) expanded.add(stripped);

  const cjkOnly = stripped.replace(/[^\u4e00-\u9fff]/g, '');
  if (cjkOnly.length >= 2 && cjkOnly !== stripped) expanded.add(cjkOnly);

  // Try: first N chars (remove suffix) + last N chars (remove prefix)
  if (cjkOnly.length >= 4) {
    expanded.add(cjkOnly.slice(0, -1)); // remove last char: "双指针算" → useful
    expanded.add(cjkOnly.slice(1));     // remove first char: "指针算法" → useful
  }
  if (cjkOnly.length >= 5) {
    expanded.add(cjkOnly.slice(0, -2)); // remove last 2 chars: "双指针" → useful!
    expanded.add(cjkOnly.slice(2));     // remove first 2 chars: "针算法" → less useful
  }

  // Clean up debug logs
  const all = [...expanded];
  all.sort((a, b) => b.length - a.length);
  return all.slice(0, 4);
}
