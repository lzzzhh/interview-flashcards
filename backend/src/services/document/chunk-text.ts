// backend/src/services/document/chunk-text.ts — 文本分块（句子级 + token 感知）

import { createHash } from 'crypto';

export interface ChunkResult {
  chunkIndex: number;
  text: string;
  tokenCount: number;
  hash: string;
}

/**
 * 按句子切分文本，每块 512-1024 tokens，10-20% 重叠
 */
export function chunkText(fullText: string, options?: {
  maxTokens?: number;
  minTokens?: number;
  overlapRatio?: number;
}): ChunkResult[] {
  const maxTokens = options?.maxTokens || 1024;
  const minTokens = options?.minTokens || 512;
  const overlapRatio = options?.overlapRatio || 0.15;

  const sentences = splitSentences(fullText);
  const chunks: ChunkResult[] = [];
  let currentChunk: string[] = [];
  let currentTokens = 0;
  let overlapBuffer: string[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const sent = sentences[i];
    const sentTokens = estimateTokens(sent);

    if (currentTokens + sentTokens > maxTokens && currentTokens >= minTokens) {
      // Finalize current chunk
      chunks.push(makeChunk(chunks.length, currentChunk.join('')));
      // Start new chunk with overlap
      const overlapCount = Math.floor(currentChunk.length * overlapRatio);
      overlapBuffer = currentChunk.slice(-overlapCount);
      currentChunk = [...overlapBuffer, sent];
      currentTokens = estimateTokens(currentChunk.join(''));
    } else {
      currentChunk.push(sent);
      currentTokens += sentTokens;
    }
  }

  // Final chunk
  if (currentChunk.length > 0) {
    chunks.push(makeChunk(chunks.length, currentChunk.join('')));
  }

  return chunks;
}

function splitSentences(text: string): string[] {
  // 按中英文句号、问号、感叹号、换行切分
  const result: string[] = [];
  let current = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    current += ch;
    // 句子结束符
    if (ch === '。' || ch === '？' || ch === '！' || ch === '.' || ch === '?' || ch === '!' ||
        ch === '\n' || ch === '；' || ch === ';') {
      if (current.trim()) {
        result.push(current);
        current = '';
      }
    }
  }
  if (current.trim()) result.push(current);
  return result;
}

function estimateTokens(text: string): number {
  // 粗略估算：中文 1 字 ≈ 0.5 token，英文 1 word ≈ 1.3 token
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = text.replace(/[\u4e00-\u9fff]/g, '').split(/\s+/).filter(w => w.length > 0).length;
  return Math.ceil(chineseChars * 0.5 + englishWords * 1.3);
}

function makeChunk(index: number, text: string): ChunkResult {
  return {
    chunkIndex: index,
    text: text.trim(),
    tokenCount: estimateTokens(text),
    hash: createHash('sha256').update(text).digest('hex').slice(0, 16),
  };
}
