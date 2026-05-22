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

  constructor(tableName = 'ai_search_vec') {
    this.tableName = tableName;
  }

  /** 初始化向量表 */
  async init(): Promise<void> {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        module TEXT NOT NULL DEFAULT 'ai-search',
        object_id TEXT NOT NULL,
        object_type TEXT NOT NULL DEFAULT 'card',
        field TEXT NOT NULL DEFAULT 'full',
        embedding TEXT NOT NULL,
        dimension INTEGER NOT NULL DEFAULT 1024,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);
    // Indices
    try { await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_${this.tableName}_module ON ${this.tableName}(module)`); } catch {}
    try { await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_${this.tableName}_object ON ${this.tableName}(object_id, field)`); } catch {}
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
  async upsert(objectId: string, objectType: string, vector: number[], field: string = 'full'): Promise<number> {
    const emb = this.serialize(vector);
    await prisma.$executeRawUnsafe(
      `INSERT OR REPLACE INTO ${this.tableName} (module, object_id, object_type, field, embedding, dimension) VALUES (?, ?, ?, ?, ?, ?)`,
      'ai-search', objectId, objectType, field, emb, vector.length,
    );
    return vector.length;
  }

  /** 批量插入 */
  async upsertBatch(items: { objectId: string; objectType: string; vector: number[]; field?: string }[]): Promise<void> {
    if (items.length === 0) return;
    const stmts = items.map(() => `(?, ?, ?, ?, ?, ?)`).join(', ');
    const params: any[] = [];
    for (const item of items) {
      params.push('ai-search', item.objectId, item.objectType, item.field || 'full', this.serialize(item.vector), item.vector.length);
    }
    await prisma.$executeRawUnsafe(
      `INSERT OR REPLACE INTO ${this.tableName} (module, object_id, object_type, field, embedding, dimension) VALUES ${stmts}`,
      ...params,
    );
  }

  /** 向量搜索 */
  async search(vector: number[], topK: number, filter?: { objectType?: string; deckId?: string; field?: string; module?: string }): Promise<VectorSearchResult[]> {
    const module = filter?.module || 'ai-search';
    const field = filter?.field;
    
    let rows: any[];
    if (field) {
      rows = await prisma.$queryRawUnsafe(
        `SELECT object_id, object_type, embedding FROM ${this.tableName} WHERE module = ? AND field = ? AND object_type = ?`,
        module, field, filter?.objectType || 'card',
      ) as any[];
    } else if (filter?.objectType) {
      rows = await prisma.$queryRawUnsafe(
        `SELECT object_id, object_type, embedding FROM ${this.tableName} WHERE module = ? AND object_type = ?`,
        module, filter.objectType,
      ) as any[];
    } else {
      rows = await prisma.$queryRawUnsafe(
        `SELECT object_id, object_type, embedding FROM ${this.tableName} WHERE module = ?`,
        module,
      ) as any[];
    }

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

  /** 获取模块列表 */
  async listModules(): Promise<{ module: string; count: number }[]> {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT module, COUNT(*) as cnt FROM ${this.tableName} GROUP BY module`
    ) as any[];
    return (rows || []).map((r: any) => ({ module: r.module, count: r.cnt }));
  }

  /** 获取模块向量列表（分页） */
  async listVectors(module: string, offset: number = 0, limit: number = 50): Promise<{ objectId: string; objectType: string; field: string; dimension: number }[]> {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT object_id, object_type, field, dimension FROM ${this.tableName} WHERE module = ? LIMIT ? OFFSET ?`,
      module, limit, offset,
    ) as any[];
    return (rows || []).map((r: any) => ({
      objectId: r.object_id,
      objectType: r.object_type,
      field: r.field,
      dimension: r.dimension,
    }));
  }

  /** 按状态清理 */
  async cleanup(): Promise<number> {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT v.object_id, v.object_type, v.field FROM ${this.tableName} v
       LEFT JOIN EmbeddingRecord er ON v.object_id = er.objectId AND v.object_type = er.objectType
       WHERE er.status = 'pending_delete' OR er.id IS NULL`
    ) as any[];
    if (rows.length === 0) return 0;
    for (const row of rows) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM ${this.tableName} WHERE object_id = ? AND object_type = ? AND field = ?`,
        row.object_id, row.object_type, row.field,
      );
    }
    return rows.length;
  }

  /** 重建所有向量索引（删除后重建） */
  async rebuild(): Promise<number> {
    await prisma.$executeRawUnsafe(`DELETE FROM ${this.tableName}`);
    const cards = await prisma.$queryRawUnsafe(`SELECT id FROM Card`) as any[];
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
