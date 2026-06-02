// Qdrant lifecycle — health check, collection init, index status

import { getQdrantClient, getQdrantCollection, getQdrantVectorSize } from './qdrant-client';
import prisma from '../../db/prisma';

export async function qdrantHealthCheck(): Promise<{ running: boolean; url: string; collectionReady: boolean }> {
  try {
    const client = getQdrantClient();
    const collection = getQdrantCollection();
    const health = await client.healthCheck();
    let collectionReady = false;
    try {
      await client.getCollection(collection);
      collectionReady = true;
    } catch { /* collection not found */ }
    return {
      running: health?.status === 'ok' || health?.title === 'qdrant - vector search engine',
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      collectionReady,
    };
  } catch {
    return { running: false, url: process.env.QDRANT_URL || 'http://localhost:6333', collectionReady: false };
  }
}

export async function qdrantInitCollection(): Promise<{ created: boolean }> {
  const client = getQdrantClient();
  const collection = getQdrantCollection();
  const vectorSize = getQdrantVectorSize();

  try {
    await client.getCollection(collection);
    return { created: false };
  } catch {
    await client.createCollection(collection, {
      vectors: { size: vectorSize, distance: 'Cosine' },
    });
    return { created: true };
  }
}

export async function qdrantCheckIndex(): Promise<{
  collectionName: string;
  totalIndexed: number;
  bySourceType: Record<string, number>;
  staleCount: number;
  ready: boolean;
}> {
  const totalIndexed = await prisma.ragChunkIndex.count({ where: { status: 'active' } });
  const staleCount = await prisma.ragChunkIndex.count({ where: { status: 'stale' } });
  const rows = await prisma.ragChunkIndex.groupBy({
    by: ['sourceType'],
    where: { status: 'active' },
    _count: { id: true },
  });
  const bySourceType: Record<string, number> = {};
  for (const r of rows) bySourceType[r.sourceType] = r._count.id;
  return {
    collectionName: getQdrantCollection(),
    totalIndexed,
    bySourceType,
    staleCount,
    ready: totalIndexed > 0,
  };
}
