// backend/src/services/neo4j/card-similarity.ts
// Card-to-card similarity via cosine similarity on bge-m3 embeddings → Neo4j SIMILAR_TO edges
//
// Flow:
//   1. Load embedding vectors from ai_search_vec (SQLite)
//   2. Compute cosine similarity between cards
//   3. Upsert SIMILAR_TO edges in Neo4j (symmetric, store only a→b where a.id < b.id)
//   4. Hook into embedding-sync / document-pipeline for auto-update on new cards

import prisma from '../../db/prisma';
import { getVectorStore } from '../vector/vector-store';
import { getNeo4jSession, isNeo4jAvailable } from './neo4j-client';

// ── Config ──

const TOP_K = 10;
const MIN_SIMILARITY = 0.70;
const BATCH_SIZE = 50; // Neo4j batch upsert size
const REBUILD_BATCH = 20;  // Process 20 cards per batch to avoid OOM

// ── Types ──

export interface SimilarCard {
  cardId: string;
  title: string;
  deckId: string;
  subTopic: string | null;
  score: number;
}

interface EmbeddingRecord {
  objectId: string;
  objectType: string;
  embedding: number[];
}

// ── Cosine Similarity ──

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 1e-10 ? dot / denom : 0;
}

// ── Vector Loading ──

/** Load all card embeddings from ai_search_vec in batches to avoid OOM */
async function loadAllCardVectors(): Promise<Map<string, number[]>> {
  const vectorMap = new Map<string, number[]>();
  const BATCH_SIZE = 100;
  try {
    // First, count total vectors
    const countRow = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as cnt FROM ai_search_vec WHERE module = 'ai-search' AND object_type = 'card'`
    ) as any[];
    const total = Number(countRow[0]?.cnt ?? 0);
    
    for (let offset = 0; offset < total; offset += BATCH_SIZE) {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT object_id, embedding FROM ai_search_vec WHERE module = 'ai-search' AND object_type = 'card' LIMIT ? OFFSET ?`,
        BATCH_SIZE, offset,
      ) as any[];
      for (const row of rows) {
        try {
          const vec = typeof row.embedding === 'string'
            ? JSON.parse(row.embedding)
            : row.embedding;
          if (Array.isArray(vec) && vec.length > 10) {
            vectorMap.set(row.object_id, vec);
          }
        } catch { /* skip malformed */ }
      }
    }
  } catch (e: any) {
    console.error(`[card-similarity] Failed to load vectors: ${e.message}`);
  }
  return vectorMap;
}

/** Load a single card's embedding */
async function loadCardVector(cardId: string): Promise<number[] | null> {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT embedding FROM ai_search_vec WHERE module = 'ai-search' AND object_type = 'card' AND object_id = ?`,
      cardId,
    ) as any[];
    if (rows.length === 0) return null;
    const emb = rows[0].embedding;
    const vec = typeof emb === 'string' ? JSON.parse(emb) : emb;
    return Array.isArray(vec) && vec.length > 10 ? vec : null;
  } catch {
    return null;
  }
}

// ── Neo4j Operations ──

/** Ensure Card nodes exist in Neo4j for given cardIds */
async function ensureCardNodes(cardIds: string[]): Promise<void> {
  const session = getNeo4jSession();
  if (!session) return;

  // Get card metadata from SQLite
  const cards = await prisma.card.findMany({
    where: { id: { in: cardIds } },
    select: { id: true, deckId: true, subTopic: true, title: true, titleCn: true },
  });

  // Batch merge Card nodes
  for (let i = 0; i < cards.length; i += BATCH_SIZE) {
    const batch = cards.slice(i, i + BATCH_SIZE);
    try {
      await session.run(
        `UNWIND $cards AS card
         MERGE (c:Card {id: card.id})
         SET c.deckId = card.deckId,
             c.subTopic = card.subTopic,
             c.title = card.title,
             c.updated = timestamp()`,
        {
          cards: batch.map(c => ({
            id: c.id,
            deckId: c.deckId,
            subTopic: c.subTopic || '',
            title: (c.titleCn || c.title || c.id).slice(0, 200),
          })),
        },
      );
    } catch (e: any) {
      console.warn(`[card-similarity] ensureCardNodes batch error: ${e.message}`);
    }
  }
}

/** Delete existing SIMILAR_TO edges involving a specific card */
async function deleteCardSimilarities(cardId: string): Promise<void> {
  const session = getNeo4jSession();
  if (!session) return;
  try {
    await session.run(
      `MATCH (c:Card {id: $cardId})-[r:SIMILAR_TO]-()
       DELETE r`,
      { cardId },
    );
  } catch (e: any) {
    console.warn(`[card-similarity] Delete edges error for ${cardId}: ${e.message}`);
  }
}

/** Upsert SIMILAR_TO edges */
async function upsertSimilarities(pairs: Array<{ source: string; target: string; score: number }>): Promise<void> {
  if (pairs.length === 0) return;
  const session = getNeo4jSession();
  if (!session) return;

  for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
    const batch = pairs.slice(i, i + BATCH_SIZE);
    // Ensure both nodes exist first
    const nodeIds = new Set<string>();
    for (const p of batch) { nodeIds.add(p.source); nodeIds.add(p.target); }
    await ensureCardNodes([...nodeIds]);

    try {
      await session.run(
        `UNWIND $pairs AS pair
         MATCH (a:Card {id: pair.source}), (b:Card {id: pair.target})
         MERGE (a)-[r:SIMILAR_TO]->(b)
         SET r.score = pair.score,
             r.deckMatch = (a.deckId = b.deckId),
             r.updated = timestamp()`,
        {
          pairs: batch.map(p => ({ source: p.source, target: p.target, score: Math.round(p.score * 10000) / 10000 })),
        },
      );
    } catch (e: any) {
      console.warn(`[card-similarity] upsert batch error: ${e.message}`);
    }
  }
}

// ── Core Logic ──

/**
 * Compute normalized pairs: source < target (alphabetically)
 * This ensures symmetric similarity is stored only once.
 */
function normalizePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/** Find top-K similar cards for a given vector */
function findTopKSimilar(
  sourceId: string,
  sourceVec: number[],
  allVectors: Map<string, number[]>,
  topK: number = TOP_K,
  minScore: number = MIN_SIMILARITY,
): Array<{ target: string; score: number }> {
  const scored: Array<{ target: string; score: number }> = [];

  for (const [otherId, otherVec] of allVectors) {
    if (otherId === sourceId) continue;
    if (otherVec.length !== sourceVec.length) continue;
    const score = cosineSimilarity(sourceVec, otherVec);
    if (score >= minScore) {
      scored.push({ target: otherId, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

// ── Public API ──

/**
 * Full rebuild: compute similarity for ALL cards and upsert to Neo4j.
 * Uses two-level nested batching to keep memory under control:
 *   - Outer loop: load SOURCE_BATCH vectors
 *   - Inner loop: load TARGET_BATCH vectors
 *   - Compute cross-similarity between the two batches
 * This limits max in-memory vectors to SOURCE_BATCH + TARGET_BATCH.
 */
export async function rebuildAllCardSimilarities(): Promise<{
  cardCount: number;
  edgeCount: number;
  durationMs: number;
  error?: string;
}> {
  if (!isNeo4jAvailable()) {
    return { cardCount: 0, edgeCount: 0, durationMs: 0, error: 'Neo4j not available' };
  }

  const startedAt = Date.now();
  console.log('[card-similarity] Starting full rebuild (batched cross-compute)...');

  // 1. Get all card IDs
  const idRows = await prisma.$queryRawUnsafe(
    `SELECT object_id FROM ai_search_vec WHERE module = 'ai-search' AND object_type = 'card'`
  ) as any[];
  const allCardIds: string[] = idRows.map((r: any) => r.object_id);
  const cardCount = allCardIds.length;
  if (cardCount === 0) {
    return { cardCount: 0, edgeCount: 0, durationMs: Date.now() - startedAt, error: 'No card vectors found' };
  }
  console.log(`[card-similarity] Found ${cardCount} cards`);

  // 2. Clear existing edges
  await clearAllSimilarities();

  // 3. Batch config — keep memory ~10MB
  const SOURCE_BATCH = 50;
  const TARGET_BATCH = 100;
  let totalEdges = 0;

  // 4. Pre-build a Map<cardId, vector> for the source batch
  for (let si = 0; si < allCardIds.length; si += SOURCE_BATCH) {
    const sourceIds = allCardIds.slice(si, si + SOURCE_BATCH);
    const sourceVectors = await loadVectorsForIds(sourceIds);
    if (sourceVectors.size === 0) continue;

    // For each target batch, load vectors and compute cross-similarity
    const batchPairs: Array<{ source: string; target: string; score: number }> = [];
    const pairSet = new Set<string>();

    for (let ti = 0; ti < allCardIds.length; ti += TARGET_BATCH) {
      const targetIds = allCardIds.slice(ti, ti + TARGET_BATCH);
      const targetVectors = await loadVectorsForIds(targetIds);
      if (targetVectors.size === 0) continue;

      // Cross-compute: each source × each target
      for (const [srcId, srcVec] of sourceVectors) {
        for (const [tgtId, tgtVec] of targetVectors) {
          if (srcId === tgtId) continue;
          const score = cosineSimilarity(srcVec, tgtVec);
          if (score < MIN_SIMILARITY) continue;

          // Track top-K per source (we'll filter at the end of outer loop)
          const [s, t] = normalizePair(srcId, tgtId);
          const key = `${s}|${t}`;
          if (!pairSet.has(key)) {
            pairSet.add(key);
            batchPairs.push({ source: s, target: t, score });
          }
        }
      }

      // Release target vectors
      targetVectors.clear();
    }

    // Filter to top-K per source card, then upsert
    if (batchPairs.length > 0) {
      // Group by source
      const bySource = new Map<string, Array<{ target: string; score: number }>>();
      for (const p of batchPairs) {
        // Check both directions
        for (const srcId of sourceIds) {
          if (p.source === srcId || p.target === srcId) {
            const list = bySource.get(srcId) || [];
            const other = p.source === srcId ? p.target : p.source;
            list.push({ target: other, score: p.score });
            bySource.set(srcId, list);
          }
        }
      }

      // Keep top-K per source
      const topPairs: Array<{ source: string; target: string; score: number }> = [];
      const topPairSet = new Set<string>();
      for (const [srcId, scored] of bySource) {
        scored.sort((a, b) => b.score - a.score);
        for (const { target, score } of scored.slice(0, TOP_K)) {
          const [s, t] = normalizePair(srcId, target);
          const key = `${s}|${t}`;
          if (!topPairSet.has(key)) {
            topPairSet.add(key);
            topPairs.push({ source: s, target: t, score });
          }
        }
      }

      if (topPairs.length > 0) {
        console.log(`[card-similarity] Batch ${Math.floor(si / SOURCE_BATCH) + 1}: ${topPairs.length} top-K pairs`);
        await upsertSimilarities(topPairs);
        totalEdges += topPairs.length;
      }
    }

    // Release source vectors
    sourceVectors.clear();

    console.log(`[card-similarity] Progress: ${Math.min(si + SOURCE_BATCH, cardCount)}/${cardCount} (${totalEdges} edges so far)`);
  }

  const durationMs = Date.now() - startedAt;
  console.log(`[card-similarity] Rebuild complete: ${cardCount} cards, ${totalEdges} edges, ${durationMs}ms`);
  return { cardCount, edgeCount: totalEdges, durationMs };
}

/** Load vectors for a batch of card IDs — returns Map<cardId, vector> */
async function loadVectorsForIds(cardIds: string[]): Promise<Map<string, number[]>> {
  const result = new Map<string, number[]>();
  if (cardIds.length === 0) return result;

  try {
    const placeholders = cardIds.map(() => '?').join(',');
    const rows = await prisma.$queryRawUnsafe(
      `SELECT object_id, embedding FROM ai_search_vec WHERE module = 'ai-search' AND object_type = 'card' AND object_id IN (${placeholders})`,
      ...cardIds,
    ) as any[];
    for (const row of rows) {
      try {
        const vec = typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding;
        if (Array.isArray(vec) && vec.length > 10) {
          result.set(row.object_id, vec);
        }
      } catch { /* skip */ }
    }
  } catch (e: any) {
    console.error(`[card-similarity] loadVectorsForIds error: ${e.message}`);
  }
  return result;
}

/** Clear ALL SIMILAR_TO edges */
async function clearAllSimilarities(): Promise<void> {
  const session = getNeo4jSession();
  if (!session) return;
  try {
    await session.run(`MATCH ()-[r:SIMILAR_TO]-() DELETE r`);
    console.log('[card-similarity] Cleared all SIMILAR_TO edges');
  } catch (e: any) {
    console.warn(`[card-similarity] Clear error: ${e.message}`);
  }
}

/**
 * Upsert similarity for a single card (new card or content-changed card).
 * 1. Delete existing edges involving this card
 * 2. Compute its top-K similar cards from all vectors
 * 3. Upsert new edges
 */
export async function upsertCardSimilarity(cardId: string): Promise<{
  edgeCount: number;
  error?: string;
}> {
  if (!isNeo4jAvailable()) {
    return { edgeCount: 0, error: 'Neo4j not available' };
  }

  // 1. Load this card's vector
  const cardVec = await loadCardVector(cardId);
  if (!cardVec) {
    return { edgeCount: 0, error: `No vector found for card ${cardId}` };
  }

  // 2. Load all vectors
  const allVectors = await loadAllCardVectors();
  if (allVectors.size === 0) {
    return { edgeCount: 0, error: 'No card vectors available' };
  }

  // 3. Find top-K
  const topK = findTopKSimilar(cardId, cardVec, allVectors);

  // 4. Delete old edges for this card
  await deleteCardSimilarities(cardId);

  // 5. Normalize and check for existing pairs that might need updating
  // (other cards that have this card in their top-K)
  const pairs: Array<{ source: string; target: string; score: number }> = [];
  for (const { target, score } of topK) {
    const [source, dest] = normalizePair(cardId, target);
    pairs.push({ source, target: dest, score });
  }

  // 6. Also recompute similarity for cards that might have this card as new top-K
  // For now: just ensure the new card's perspective is correct.
  // The full rebuild handles the reverse perspective globally.
  await upsertSimilarities(pairs);

  console.log(`[card-similarity] Card ${cardId}: ${pairs.length} similar cards upserted`);
  return { edgeCount: pairs.length };
}

/**
 * Query similar cards for a given card from Neo4j.
 */
export async function getSimilarCards(cardId: string, limit: number = 10): Promise<SimilarCard[]> {
  const session = getNeo4jSession();
  if (!session) return [];

  try {
    const result = await session.run(
      `MATCH (c:Card {id: $cardId})-[r:SIMILAR_TO]-(other:Card)
       RETURN other.id AS cardId, other.title AS title, other.deckId AS deckId,
              other.subTopic AS subTopic, r.score AS score
       ORDER BY r.score DESC
       LIMIT $limit`,
      { cardId, limit },
    );

    const cards: SimilarCard[] = [];
    for (const record of result.records) {
      cards.push({
        cardId: record.get('cardId'),
        title: record.get('title') || '',
        deckId: record.get('deckId') || '',
        subTopic: record.get('subTopic') || null,
        score: record.get('score'),
      });
    }
    return cards;
  } catch (e: any) {
    console.warn(`[card-similarity] Query error for ${cardId}: ${e.message}`);
    return [];
  }
}

/**
 * Batch query: expand a set of cardIds via similarity graph.
 * For each seed card, find up to `expandPerCard` neighbors.
 * Returns deduplicated list of similar card IDs (excluding seeds).
 */
export async function expandCardIdsViaSimilarity(
  seedCardIds: string[],
  expandPerCard: number = 5,
): Promise<string[]> {
  if (seedCardIds.length === 0) return [];
  const session = getNeo4jSession();
  if (!session) return [];

  try {
    const result = await session.run(
      `MATCH (c:Card)-[r:SIMILAR_TO]-(other:Card)
       WHERE c.id IN $seedIds AND NOT other.id IN $seedIds
       RETURN other.id AS cardId, r.score AS score
       ORDER BY score DESC
       LIMIT ${seedCardIds.length * expandPerCard}`,
      { seedIds: seedCardIds },
    );

    const seen = new Set<string>();
    const expanded: string[] = [];
    for (const record of result.records) {
      const id = record.get('cardId');
      if (!seen.has(id)) {
        seen.add(id);
        expanded.push(id);
      }
    }
    return expanded;
  } catch (e: any) {
    console.warn(`[card-similarity] Expand error: ${e.message}`);
    return [];
  }
}

/**
 * Quick status check — returns counts.
 */
export async function getSimilarityGraphStats(): Promise<{
  cardNodes: number;
  similarityEdges: number;
  available: boolean;
}> {
  if (!isNeo4jAvailable()) {
    return { cardNodes: 0, similarityEdges: 0, available: false };
  }

  const session = getNeo4jSession();
  if (!session) return { cardNodes: 0, similarityEdges: 0, available: false };

  try {
    const [cardRes, edgeRes] = await Promise.all([
      session.run(`MATCH (c:Card) RETURN count(c) AS count`),
      session.run(`MATCH ()-[r:SIMILAR_TO]->() RETURN count(r) AS count`),
    ]);

    return {
      cardNodes: cardRes.records[0]?.get('count').toNumber() || 0,
      similarityEdges: edgeRes.records[0]?.get('count').toNumber() || 0,
      available: true,
    };
  } catch {
    return { cardNodes: 0, similarityEdges: 0, available: false };
  }
}
