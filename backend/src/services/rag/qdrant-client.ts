// Qdrant client singleton — lazy init

import { QdrantClient } from '@qdrant/js-client-rest';

let client: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient {
  if (!client) {
    const url = process.env.QDRANT_URL || 'http://localhost:6333';
    client = new QdrantClient({ url });
  }
  return client;
}

export function getQdrantCollection(): string {
  return process.env.QDRANT_COLLECTION || 'interview_flashcards_rag_chunks';
}

export function getQdrantVectorSize(): number {
  return parseInt(process.env.QDRANT_VECTOR_SIZE || '1024', 10);
}
