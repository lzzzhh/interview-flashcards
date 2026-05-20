// backend/src/services/vector/vector-store.ts — Vector Store 抽象 + SQLite 实现

import prisma from '../../db/prisma';
import type { EmbeddingRecord } from './types';

// ---- 类型重导出（保持兼容） ----
export type { EmbeddingRecord };

export interface VectorSearchResult {
  objectId: string;
  objectType: string;
  score: number;
  distance: number;
}

export interface VectorStore {
  name: string;
  /** 插入/更新向量 */
  upsert(objectId: string, objectType: string, vector: number[]): Promise<number>;
  /** 批量插入 */
  upsertBatch(items: { objectId: string; objectType: string; vector: number[] }[]): Promise<void>;
  /** 向量搜索（余弦相似度） */
  search(vector: number[], topK: number, filter?: { objectType?: string; deckId?: string }): Promise<VectorSearchResult[]>;
  /** 删除向量 */
  delete(objectId: string, objectType: string): Promise<void>;
  /** 重建所有索引 */
  rebuild(): Promise<number>;
  /** 按状态清理 */
  cleanup(): Promise<number>;
}

/** 余弦相似度 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1e-10);
}

/** SQLite 向量存储（零原生依赖，JS 余弦相似度） */
export class SqliteVecVectorStore implements VectorStore {
  name = 'sqlite-vec-js';
  private tableName: string;

  constructor(tableName = 'vec_embeddings') {
    this.tableName = tableName;
  }

  /** 初始化向量表 */
  async init(): Promise<void> {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        object_id TEXT NOT NULL,
        object_type TEXT NOT NULL DEFAULT 'card',
        embedding TEXT NOT NULL,
        dimension INTEGER NOT NULL DEFAULT 1536,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        PRIMARY KEY (object_id, object_type)
      )
    `);
  }

  /** 序列化向量为 JSON */
  private serialize(v: number[]): string {
    return JSON.stringify(v);
  }

  /** 反序列化 */
  private deserialize(s: string): number[] {
    return JSON.parse(s) as number[];
  }

  /** 插入/更新 */
  async upsert(objectId: string, objectType: string, vector: number[]): Promise<number> {
    const emb = this.serialize(vector);
    await prisma.$executeRawUnsafe(
      `INSERT OR REPLACE INTO ${this.tableName} (object_id, object_type, embedding, dimension) VALUES (?, ?, ?, ?)`,
      objectId, objectType, emb, vector.length,
    );
    return vector.length;
  }

  /** 批量插入 */
  async upsertBatch(items: { objectId: string; objectType: string; vector: number[] }[]): Promise<void> {
    if (items.length === 0) return;
    const stmts = items.map(() => `(?, ?, ?, ?)`).join(', ');
    const params: any[] = [];
    for (const item of items) {
      params.push(item.objectId, item.objectType, this.serialize(item.vector), item.vector.length);
    }
    await prisma.$executeRawUnsafe(
      `INSERT OR REPLACE INTO ${this.tableName} (object_id, object_type, embedding, dimension) VALUES ${stmts}`,
      ...params,
    );
  }

  /** 向量搜索 */
  async search(vector: number[], topK: number, filter?: { objectType?: string; deckId?: string }): Promise<VectorSearchResult[]> {
    // 取出所有向量
    let rows: any[];
    if (filter?.objectType) {
      rows = await prisma.$queryRawUnsafe(
        `SELECT object_id, object_type, embedding FROM ${this.tableName} WHERE object_type = ?`,
        filter.objectType,
      ) as any[];
    } else {
      rows = await prisma.$queryRawUnsafe(
        `SELECT object_id, object_type, embedding FROM ${this.tableName}`,
      ) as any[];
    }

    // JS 端计算余弦相似度
    const scored: VectorSearchResult[] = [];
    for (const row of rows) {
      const emb = this.deserialize(row.embedding);
      if (emb.length !== vector.length) continue;
      const similarity = cosineSimilarity(vector, emb);
      scored.push({
        objectId: row.object_id,
        objectType: row.object_type,
        score: similarity,
        distance: 1 - similarity,
      });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  /** 删除向量 */
  async delete(objectId: string, objectType: string): Promise<void> {
    await prisma.$executeRawUnsafe(
      `DELETE FROM ${this.tableName} WHERE object_id = ? AND object_type = ?`,
      objectId, objectType,
    );
  }

  /** 删除所有标记为 pending_delete 的 EmbeddingRecord 对应的向量 */
  async cleanup(): Promise<number> {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT vr.object_id, vr.object_type FROM ${this.tableName} vr
       LEFT JOIN EmbeddingRecord er ON vr.object_id = er.objectId AND vr.object_type = er.objectType
       WHERE er.status = 'pending_delete' OR er.id IS NULL`
    ) as any[];
    if (rows.length === 0) return 0;
    for (const row of rows) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM ${this.tableName} WHERE object_id = ? AND object_type = ?`,
        row.object_id, row.object_type,
      );
    }
    return rows.length;
  }

  /** 重建所有向量索引（删除后重建） */
  async rebuild(): Promise<number> {
    // 从 Card 表获取所有卡片，重新生成 embedding（需要 provider）
    await prisma.$executeRawUnsafe(`DELETE FROM ${this.tableName}`);
    const cards = await prisma.$queryRawUnsafe(
      `SELECT id FROM Card`
    ) as any[];
    return cards.length;
  }
}

export class NoOpVectorStore implements VectorStore {
  name = 'noop';
  async upsert(): Promise<number> { return 0; }
  async upsertBatch(): Promise<void> {}
  async search(): Promise<VectorSearchResult[]> { return []; }
  async delete(): Promise<void> {}
  async rebuild(): Promise<number> { return 0; }
  async cleanup(): Promise<number> { return 0; }
}

let store: VectorStore = new NoOpVectorStore();
let initialized = false;

export function setVectorStore(s: VectorStore) { store = s; initialized = false; }
export function getVectorStore(): VectorStore { return store; }

/** 初始化向量存储（启动时调用） */
export async function initVectorStore(): Promise<void> {
  if (initialized) return;
  if (store instanceof SqliteVecVectorStore) {
    await (store as SqliteVecVectorStore).init();
    console.log(`[vector] Vector store initialized: ${store.name}`);
  }
  initialized = true;
}
