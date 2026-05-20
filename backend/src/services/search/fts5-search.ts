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

    // For Chinese-containing queries
    if (/[\u4e00-\u9fff]/.test(escaped)) {
      // Split: English/Latin terms → FTS5, Chinese terms → LIKE
      const allTerms = escaped.split(/\s+/).filter(t => t.length > 0);
      const hasLatin = allTerms.some(t => /[a-zA-Z]/.test(t));

      if (hasLatin) {
        // Mixed query: FTS5 for Latin/English terms, LIKE for Chinese terms
        const latinTerms = allTerms.filter(t => /[a-zA-Z]/.test(t)).join(' ');
        const cjkTerms = allTerms.filter(t => /[\u4e00-\u9fff]/.test(t));

        // Run both in parallel
        const [ftsResults, likeResults] = await Promise.all([
          latinTerms ? fts5RawSearch(latinTerms, limit, deckId) : Promise.resolve([] as FTS5Result[]),
          cjkTerms.length > 0 ? likeSearch(cjkTerms, limit) : Promise.resolve([] as FTS5Result[]),
        ]);

        // Merge: deduplicate, FTS5 first, then LIKE
        const results = [...ftsResults];
        const seen = new Set(results.map(r => r.cardId));
        for (const lr of likeResults) {
          if (!seen.has(lr.cardId)) {
            results.push(lr);
            seen.add(lr.cardId);
          }
        }
        return results;
      }

      // Pure Chinese: LIKE with smart term extraction
      const terms = extractChineseTerms(escaped);
      console.log("likeSearch terms:", terms, "limit:", limit); const lsr = await likeSearch(terms, limit); console.log("likeSearch returned:", lsr.length); return lsr;
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

// ---- Internal Helpers ----

/** Raw FTS5 search helper */
async function fts5RawSearch(escaped: string, limit: number, deckId?: string): Promise<FTS5Result[]> {
  const sql = deckId
    ? 'SELECT cardId, rank FROM card_fts WHERE card_fts MATCH ? AND deckId = ? ORDER BY rank LIMIT ?'
    : 'SELECT cardId, rank FROM card_fts WHERE card_fts MATCH ? ORDER BY rank LIMIT ?';
  const params: any[] = deckId ? [escaped, deckId, limit] : [escaped, limit];
  const rows = await prisma.$queryRawUnsafe(sql, ...params) as any[];
  return (rows || []).map((r: any) => ({ cardId: r.cardId, rank: r.rank, matchField: 'fts5' }));
}

/** LIKE search helper: runs separate queries per term to avoid result crowding */
async function likeSearch(terms: string[], limit: number): Promise<FTS5Result[]> {
  if (terms.length === 0) return [];

  // For multiple terms, run separate queries and merge to avoid shorter/noisy terms crowding out good matches
  const seen = new Set<string>();
  const results: FTS5Result[] = [];

  for (const t of terms.slice(0, 4)) { // max 4 terms
    const rows = await prisma.$queryRawUnsafe(
      `SELECT id as cardId, 1 as rank FROM Card WHERE question LIKE ? OR titleCn LIKE ? OR title LIKE ? OR answer LIKE ? OR tags LIKE ? LIMIT ?`,
      `%${t}%`, `%${t}%`, `%${t}%`, `%${t}%`, `%${t}%`, limit,
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
  if (spaceTerms.length > 1) return spaceTerms;

  const phrase = spaceTerms[0] || escaped;
  const expanded = new Set<string>();
  expanded.add(phrase);

  let stripped = phrase
    .replace(/^(怎么|如何|什么样|什么|有没有|能不能|可以|应该|需要|为什么|请问|怎样)/, '')
    .replace(/(呢|吗|啊|吧|的|了|是)$/, '');
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
