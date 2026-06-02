// Card chunk builder — one card = one chunk (up to 800-1200 chars)

import prisma from '../../../db/prisma';

export interface RagChunk {
  sourceType: 'card' | 'job_posting' | 'document' | 'project' | 'interview_qa';
  sourceId: string;
  chunkIndex: number;
  title: string;
  text: string;
  cardId?: string;
  deckId?: string;
  jobPostingId?: string;
  documentId?: string;
  projectId?: string;
  interviewQaId?: string;
  company?: string;
  role?: string;
  tags: string[];
  concepts: string[];
  modules: string[];
}

function safeJson(s: any): any[] {
  if (!s) return [];
  if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } }
  return Array.isArray(s) ? s : [];
}

function canonicalTopic(card: any): string {
  const topics = safeJson(card.searchKeywords);
  if (topics.length > 0) return topics[0];
  return card.title || card.titleCn || card.id;
}

export async function buildAllCardChunks(): Promise<RagChunk[]> {
  const cards = await prisma.card.findMany({ include: { deck: true } });
  const chunks: RagChunk[] = [];

  for (const card of cards) {
    let answer = card.answer || '';
    // Truncate long answers
    if (answer.length > 1200) answer = answer.slice(0, 1200);

    const text = [
      `标题：${canonicalTopic(card)}`,
      `模块：${(card as any).deck?.name || card.deckId}`,
      `标签：${safeJson(card.tags).join('、')}`,
      card.question ? `\n问题：\n${card.question}` : '',
      answer ? `\n答案：\n${answer}` : '',
    ].filter(Boolean).join('\n');

    chunks.push({
      sourceType: 'card',
      sourceId: card.id,
      chunkIndex: 0,
      title: canonicalTopic(card),
      text,
      cardId: card.id,
      deckId: card.deckId,
      tags: safeJson(card.tags),
      concepts: [card.canonicalTopic || canonicalTopic(card)],
      modules: [card.deckId],
    });
  }

  return chunks;
}
