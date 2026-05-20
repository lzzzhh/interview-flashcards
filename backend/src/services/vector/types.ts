// backend/src/services/vector/types.ts — Vector 类型定义

export interface EmbeddingRecord {
  id: string;
  objectType: string;
  objectId: string;
  provider: string;
  model: string;
  dimension: number;
  vectorStore: string;
  vectorTable: string;
  status: string;
  textHash: string;
  createdAt: Date;
}
