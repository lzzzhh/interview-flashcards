// Document Chunk Builder — converts DocumentChunk rows into RAG chunks

import prisma from '../../../db/prisma';
import type { RagChunk } from './card-chunk-builder';

export async function buildAllDocumentChunks(): Promise<RagChunk[]> {
  const docs = await prisma.documentChunk.findMany({
    where: { text: { not: '' } },
    take: 500,
    include: { document: { select: { filename: true } } },
  });

  return docs.map(d => ({
    sourceType: 'document' as const,
    sourceId: d.id,
    chunkIndex: d.orderIndex || 0,
    title: d.title || (d as any).document?.filename || `Document chunk ${d.orderIndex}`,
    text: d.text.slice(0, 5000),
    documentId: d.documentId,
    tags: [],
    concepts: [],
    modules: [],
  }));
}
