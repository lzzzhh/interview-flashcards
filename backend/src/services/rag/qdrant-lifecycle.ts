// Qdrant lifecycle — health check, collection init, index status

import { getQdrantClient, getQdrantCollection, getQdrantVectorSize } from './qdrant-client';
import prisma from '../../db/prisma';

export async function qdrantHealthCheck(): Promise<{ running: boolean; url: string; collectionReady: boolean }> {
  try {
    const client = getQdrantClient();
    const collection = getQdrantCollection();
    // Use raw fetch for health check — more reliable than JS client
    const url = process.env.QDRANT_URL || 'http://localhost:6333';
    const healthRes = await fetch(`${url}/`);
    const running = healthRes.ok;

    let collectionReady = false;
    if (running) {
      try {
        await client.getCollection(collection);
        collectionReady = true;
      } catch { /* collection not found */ }
    }
    return { running, url, collectionReady };
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
  try {
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
  } catch (e: any) {
    // Table might not exist — schema not yet pushed
    console.warn(`[rag] RagChunkIndex check failed: ${e.message}`);
    return {
      collectionName: getQdrantCollection(),
      totalIndexed: 0,
      bySourceType: {},
      staleCount: 0,
      ready: false,
    };
  }
}
