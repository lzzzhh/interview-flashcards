// Job Posting Chunk Builder — splits JD text into chunks for RAG

import prisma from '../../../db/prisma';
import type { RagChunk } from './card-chunk-builder';

const CHUNK_SIZE = 600; // Chinese characters
const CHUNK_OVERLAP = 100;

function splitChunks(text: string, sourceId: string, sourceType: 'job_posting'): RagChunk[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  const chunks: RagChunk[] = [];
  let start = 0;
  let idx = 0;

  while (start < cleaned.length) {
    const end = Math.min(start + CHUNK_SIZE, cleaned.length);
    const chunkText = cleaned.slice(start, end);
    chunks.push({
      sourceType,
      sourceId,
      chunkIndex: idx,
      title: '',
      text: chunkText,
      cardId: undefined as any,
      deckId: '',
      tags: [],
      concepts: [],
      modules: [],
    });
    idx++;
    start = end - CHUNK_OVERLAP;
    if (start < 0) start = 0;
    // Prevent infinite loop on short text
    if (start >= cleaned.length - 10) break;
  }

  return chunks;
}

export async function buildJobPostingChunks(jobPostingId: string): Promise<RagChunk[]> {
  const posting = await prisma.jobPostingSnapshot.findUnique({ where: { id: jobPostingId } });
  if (!posting) return [];

  const text = posting.cleanedText || posting.rawText;
  if (!text) return [];

  const chunks = splitChunks(text, jobPostingId, 'job_posting');
  // Enrich with metadata
  for (const c of chunks) {
    c.title = posting.title || `${posting.company || ''} ${posting.role || ''}`;
  }
  return chunks;
}

export async function buildAllJobPostingChunks(): Promise<RagChunk[]> {
  const postings = await prisma.jobPostingSnapshot.findMany({ where: { rawText: { not: '' } } });
  const allChunks: RagChunk[] = [];
  for (const p of postings) {
    const text = p.cleanedText || p.rawText;
    if (text) allChunks.push(...splitChunks(text, p.id, 'job_posting'));
  }
  return allChunks;
}
