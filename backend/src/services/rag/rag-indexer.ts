// RAG Indexer — writes chunks to Qdrant and Prisma RagChunkIndex

import prisma from '../../db/prisma';
import { getQdrantClient, getQdrantCollection } from './qdrant-client';
import { embedBatch } from './embedding-service';
import { buildAllCardChunks, type RagChunk } from './chunk-builders/card-chunk-builder';
import { buildJobPostingChunks, buildAllJobPostingChunks } from './chunk-builders/job-posting-chunk-builder';
import crypto from 'crypto';

function hashText(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex').slice(0, 12);
}

function pointId(sourceType: string, sourceId: string, chunkIndex: number, textHash: string): string {
  return `${sourceType}:${sourceId}:${chunkIndex}:${textHash}`;
}

export async function indexChunks(chunks: RagChunk[]): Promise<{ indexed: number; skipped: number; failed: number }> {
  if (chunks.length === 0) return { indexed: 0, skipped: 0, failed: 0 };

  const client = getQdrantClient();
  const collection = getQdrantCollection();
  const embeddingModel = (process.env.EMBEDDING_MODEL || 'bge-m3');

  let indexed = 0;
  let skipped = 0;
  let failed = 0;

  // Process in batches of 32
  for (let i = 0; i < chunks.length; i += 32) {
    const batch = chunks.slice(i, i + 32);

    // Check existing records
    const existingIds = batch.map(c => c.sourceId);
    const existing = await prisma.ragChunkIndex.findMany({
      where: { sourceId: { in: existingIds }, sourceType: batch[0].sourceType, status: 'active' },
      select: { sourceId: true, textHash: true },
    });
    const existingMap = new Map(existing.map(e => [e.sourceId, e.textHash]));

    // Filter out unchanged chunks
    const newChunks = batch.filter(c => {
      const h = hashText(c.text);
      const oldHash = existingMap.get(c.sourceId);
      if (oldHash === h) { skipped++; return false; }
      return true;
    });

    if (newChunks.length === 0) continue;

    // Embed
    const texts = newChunks.map(c => c.text);
    const embeddings = await embedBatch(texts);

    // Write to Qdrant
    const points = newChunks.map((c, idx) => {
      const h = hashText(c.text);
      return {
        id: pointId(c.sourceType, c.sourceId, c.chunkIndex, h),
        vector: embeddings[idx] || new Array(1024).fill(0),
        payload: {
          sourceType: c.sourceType,
          sourceId: c.sourceId,
          chunkIndex: c.chunkIndex,
          title: c.title,
          text: c.text,
          cardId: c.cardId,
          deckId: c.deckId,
          jobPostingId: (c as any).jobPostingId,
          documentId: (c as any).documentId,
          projectId: (c as any).projectId,
          interviewQaId: (c as any).interviewQaId,
          company: (c as any).company,
          role: (c as any).role,
          tags: c.tags,
          concepts: c.concepts,
          modules: c.modules,
          language: 'zh',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          embeddingModel,
          textHash: h,
        },
      };
    });

    try {
      await client.upsert(collection, { points, wait: true });
      indexed += newChunks.length;
    } catch (e: any) {
      console.warn(`[rag-indexer] Upsert failed for batch: ${e.message}`);
      failed += newChunks.length;
      continue;
    }

    // Write Prisma index
    for (const [idx, c] of newChunks.entries()) {
      const h = hashText(c.text);
      const pid = pointId(c.sourceType, c.sourceId, c.chunkIndex, h);
      await prisma.ragChunkIndex.upsert({
        where: { qdrantPointId: pid },
        create: {
          qdrantPointId: pid, collectionName: collection,
          sourceType: c.sourceType, sourceId: c.sourceId,
          cardId: c.cardId, deckId: c.deckId,
          jobPostingId: (c as any).jobPostingId,
          documentId: (c as any).documentId,
          projectId: (c as any).projectId,
          interviewQaId: (c as any).interviewQaId,
          chunkIndex: c.chunkIndex, textHash: h, embeddingModel, status: 'active',
        },
        update: { textHash: h, embeddingModel, status: 'active' },
      });
    }
  }

  return { indexed, skipped, failed };
}

export async function indexAllCards(force: boolean = false) { return indexChunks(await buildAllCardChunks()); }

export async function indexJobPosting(jobPostingId: string) { return indexChunks(await buildJobPostingChunks(jobPostingId)); }

export async function indexAllJobPostings() { return indexChunks(await buildAllJobPostingChunks()); }

export async function indexAllDocuments() {
  // Stub — documents chunk builder to be added
  return { indexed: 0, skipped: 0, failed: 0 };
}

export async function indexAllProjects() {
  // Stub — projects chunk builder to be added
  return { indexed: 0, skipped: 0, failed: 0 };
}

export async function indexAllInterviewQA() {
  // Stub — interview QA chunk builder to be added
  return { indexed: 0, skipped: 0, failed: 0 };
}
