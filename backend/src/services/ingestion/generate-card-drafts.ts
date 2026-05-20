// backend/src/services/ingestion/generate-card-drafts.ts — LLM 生成卡片草稿

import { getLLMProvider } from '../llm-provider';
import type { ParsedDocument } from '../document/parser-gateway';
import prisma from '../../db/prisma';

interface CardDraftInput {
  question: string;
  answer: string;
  tags?: string[];
  difficulty?: string;
  reason?: string;
}

/**
 * 从文档块生成卡片草稿
 * 每个 chunk 请求 LLM 生成 1-3 张 QA 卡片
 */
export async function generateCardDrafts(
  sourceId: string,
  deckId: string,
  chunks: { id: string; text: string; chunkIndex: number }[],
): Promise<CardDraftInput[]> {
  const provider = getLLMProvider();
  if (!provider) throw new Error('LLM provider not configured');

  const allDrafts: CardDraftInput[] = [];

  for (const chunk of chunks) {
    const prompt = `你是一个面试题库生成器。请从以下文本中提取关键知识点，生成 1-3 张问答卡片。

每张卡片格式：
Q: 问题（简洁明确，适合面试复习）
A: 答案（完整解释，包含关键概念和细节）
TAG: 标签（用逗号分隔，不超过3个）
DIFF: 难度（easy/medium/hard）

文本内容：
${chunk.text.slice(0, 3000)}

请只输出卡片，不要其他内容。`;

    try {
      const res = await provider.chat({
        model: (provider as any).defaultModel || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        maxTokens: 2048,
      });

      const drafts = parseDraftResponse(res.text);
      for (const d of drafts) {
        allDrafts.push({ ...d, reason: `从 chunk ${chunk.chunkIndex} 生成` });
      }
    } catch (err) {
      console.error(`[generate-card-drafts] chunk ${chunk.chunkIndex} (source: ${sourceId}) failed:`, (err as Error).message || err);
    }
  }

  return dedupeDrafts(allDrafts);
}

function parseDraftResponse(text: string): CardDraftInput[] {
  const drafts: CardDraftInput[] = [];
  const blocks = text.split(/(?=Q[:：])/);
  for (const block of blocks) {
    const qMatch = block.match(/Q[:：]\s*(.+?)(?=\n|A[:：]|TAG[:：]|DIFF[:：]|$)/s);
    const aMatch = block.match(/A[:：]\s*(.+?)(?=\n|TAG[:：]|DIFF[:：]|Q[:：]|$)/s);
    const tagMatch = block.match(/TAG[:：]\s*(.+)/);
    const diffMatch = block.match(/DIFF[:：]\s*(.+)/);

    if (qMatch && aMatch) {
      drafts.push({
        question: qMatch[1].trim(),
        answer: aMatch[1].trim(),
        tags: tagMatch ? tagMatch[1].split(/[,，]/).map(t => t.trim()).filter(Boolean) : undefined,
        difficulty: diffMatch ? diffMatch[1].trim().toLowerCase() : undefined,
      });
    }
  }
  return drafts;
}

function dedupeDrafts(drafts: CardDraftInput[]): CardDraftInput[] {
  const seen = new Set<string>();
  return drafts.filter(d => {
    const key = d.question.slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 将草稿保存到数据库
 */
export async function saveCardDrafts(sourceId: string, deckId: string, drafts: CardDraftInput[]): Promise<number> {
  let count = 0;
  for (const draft of drafts) {
    await prisma.cardDraft.create({
      data: {
        id: `draft-${Date.now()}-${count}`,
        sourceId,
        deckId,
        question: draft.question,
        answer: draft.answer,
        tags: draft.tags ? JSON.stringify(draft.tags) : null,
        difficulty: draft.difficulty,
        reason: draft.reason,
        status: 'draft',
        qualityScore: qualityScore(draft),
      },
    });
    count++;
  }
  return count;
}

function qualityScore(draft: CardDraftInput): number {
  let score = 5;
  if (draft.question.length < 10) score -= 2;
  if (draft.answer.length < 20) score -= 2;
  if (!draft.tags || draft.tags.length === 0) score -= 1;
  return Math.max(1, score);
}
