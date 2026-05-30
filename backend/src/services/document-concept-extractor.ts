import { getLLMProvider } from './llm-provider';
import type { DocumentChunk, ExtractedConceptData, SourceRef } from './document-parser/types';

const EXTRACTION_PROMPT = `你是知识卡片生成系统的概念抽取器。

任务：
从给定 source chunk 中抽取适合做 flashcard 的知识点。

限制：
- 只能使用 source chunk 中明确出现或直接支持的信息。
- 不要添加外部知识。
- 不要编造定义、例子、公式。
- 如果内容不完整，降低 confidence。
- 如果概念只是随口提到，不要抽为主概念。
- 每个概念必须给出 sourceRefs（直接用 chunk 中的 sourceRefs 片段）。

输出 JSON：
{
  "concepts": [
    {
      "conceptName": "概念名称",
      "definition": "定义",
      "keyPoints": ["要点1", "要点2"],
      "examples": ["例子1"],
      "formulas": ["公式1"],
      "prerequisites": ["前置知识"],
      "commonConfusions": ["常见混淆"],
      "candidateTags": ["标签1"],
      "confidence": 0.0-1.0,
      "sourceRefs": [{"quote": "原文片段"}]
    }
  ]
}`;

export async function extractConcepts(
  chunk: DocumentChunk,
): Promise<ExtractedConceptData[]> {
  const llm = getLLMProvider();
  if (!llm) throw new Error('llm_not_configured: LLM provider not initialized. Please configure LLM_API_KEY and LLM_BASE_URL.');

  const model = llm.defaultModel || process.env.LLM_MODEL || 'deepseek-chat';
  const response = await llm.chat({
    model,
    messages: [
      { role: 'system', content: EXTRACTION_PROMPT },
      { role: 'user', content: `Source chunk:\n\n${chunk.text}` },
    ],
    temperature: 0.3,
    responseFormat: 'json_object',
  });

  try {
    const parsed = JSON.parse(response.text);
    if (!parsed.concepts || !Array.isArray(parsed.concepts)) return [];
    return parsed.concepts.map((c: any) => ({
      documentId: chunk.documentId,
      conceptName: c.conceptName || '',
      definition: c.definition,
      keyPoints: c.keyPoints || [],
      examples: c.examples,
      formulas: c.formulas,
      prerequisites: c.prerequisites,
      commonConfusions: c.commonConfusions,
      candidateTags: (c.candidateTags || []).slice(0, 8),
      confidence: c.confidence ?? 0.5,
      sourceRefs: (c.sourceRefs || []).map((sr: any) => {
        const chunkRef = chunk.sourceRefs.find(r => r.blockId === sr.blockId || r.quote === sr.quote);
        return {
          documentId: chunk.documentId,
          filename: chunkRef?.filename || '',
          pageNumber: sr.pageNumber || chunkRef?.pageNumber || undefined,
          blockId: sr.blockId || chunkRef?.blockId || undefined,
          bbox: sr.bbox || chunkRef?.bbox || undefined,
          quote: sr.quote || chunkRef?.quote || '',
          source: sr.source || chunkRef?.source || 'pdf_text',
          confidence: sr.confidence ?? chunkRef?.confidence ?? undefined,
        };
      }),
    }));
  } catch {
    return [];
  }
}
