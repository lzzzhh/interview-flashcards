// backend/src/services/vector/vector-store.ts — Vector Store 抽象

export interface VectorSearchResult {
  objectId: string;
  objectType: string;
  score: number;
  vectorRowId: number;
}

export interface VectorStore {
  name: string;
  /** 插入/更新向量 */
  upsert(objectId: string, objectType: string, vector: number[], metadata?: Record<string, string>): Promise<number>;
  /** 批量插入 */
  upsertBatch(items: { objectId: string; objectType: string; vector: number[] }[]): Promise<void>;
  /** 向量搜索 */
  search(vector: number[], topK: number, filter?: { objectType?: string; deckId?: string }): Promise<VectorSearchResult[]>;
  /** 删除向量 */
  delete(objectId: string, objectType: string): Promise<void>;
  /** 按状态删除（pending_delete） */
  cleanup(): Promise<number>;
}

/** 默认空实现，后续用 sqlite-vec 替换 */
export class NoOpVectorStore implements VectorStore {
  name = 'noop';
  async upsert(): Promise<number> { return 0; }
  async upsertBatch(): Promise<void> {}
  async search(): Promise<VectorSearchResult[]> { return []; }
  async delete(): Promise<void> {}
  async cleanup(): Promise<number> { return 0; }
}

let store: VectorStore = new NoOpVectorStore();

export function setVectorStore(s: VectorStore) { store = s; }
export function getVectorStore(): VectorStore { return store; }
