// Job Posting Chunk Builder — splits JD text into chunks for RAG

import prisma from '../../../db/prisma';
import type { RagChunk } from './card-chunk-builder';

const CHUNK_SIZE = 600;
const CHUNK_OVERLAP = 100;

function splitChunks(text: string, posting: { id: string; company?: string | null; role?: string | null; title?: string | null }): RagChunk[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  const chunks: RagChunk[] = [];
  let start = 0;
  let idx = 0;

  while (start < cleaned.length) {
    const end = Math.min(start + CHUNK_SIZE, cleaned.length);
    const chunkText = cleaned.slice(start, end);
    chunks.push({
      sourceType: 'job_posting',
      sourceId: posting.id,
      chunkIndex: idx,
      title: posting.title || `${posting.company || ''} ${posting.role || ''}`,
      text: chunkText,
      jobPostingId: posting.id,
      company: posting.company || undefined,
      role: posting.role || undefined,
      tags: [],
      concepts: [],
      modules: [],
    });
    idx++;
    start = end - CHUNK_OVERLAP;
    if (start < 0) start = 0;
    if (start >= cleaned.length - 10) break;
  }

  return chunks;
}

export async function buildJobPostingChunks(jobPostingId: string): Promise<RagChunk[]> {
  const posting = await prisma.jobPostingSnapshot.findUnique({ where: { id: jobPostingId } });
  if (!posting) return [];
  const text = posting.cleanedText || posting.rawText;
  if (!text) return [];
  return splitChunks(text, posting);
}

export async function buildAllJobPostingChunks(): Promise<RagChunk[]> {
  const postings = await prisma.jobPostingSnapshot.findMany({ where: { rawText: { not: '' } } });
  const allChunks: RagChunk[] = [];
  for (const p of postings) {
    const text = p.cleanedText || p.rawText;
    if (text) allChunks.push(...splitChunks(text, p));
  }
  return allChunks;
}
