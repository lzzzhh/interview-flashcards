import { getLLMProvider } from './llm-provider';
import type { ExtractedConceptData, CardDraftData, SourceRef } from './document-parser/types';

const DRAFT_PROMPT = `你是 flashcard 草稿生成器。

任务：
根据 extracted concept 和 source chunk 生成可审核的卡片草稿。

限制：
- 一张卡只问一个知识点。
- question 必须明确、单点、可复习。
- answer 必须基于 source。
- 不要把整段原文复制成 answer。
- 不要加入 source 中没有的信息。
- 如果资料不足，status=needs_review。
- 每张卡必须保留 sourceRefs。

卡片类型：
- definition: 什么是 X？定义+核心含义
- principle: X 的原理是什么？机制+理论基础
- procedure: 如何执行 X？步骤
- formula: 公式 X 表示什么？变量解释+使用场景
- comparison: X 和 Y 有什么区别？对比维度
- application: X 用在什么场景？典型应用
- example: 举例说明 X
- pitfall: 学习 X 容易误解什么？常见误区

输出要求：
每张卡必须包含以下字段：

semantic meta 字段说明：
- canonicalConcept：卡片对应的核心概念名称（如 "K-Means"、"反向传播"），同一概念用同一名称
- learningObjective：学习目标枚举值，从以下选一个：
  definition | principle | procedure | formula | comparison | application | example | pitfall
- atomicFacts：用简短句子列出这张卡覆盖的原子知识，每句一个事实，用于去重判断
- answerScope：简述这张卡回答的角度/范围，用于辨别是否和目标卡重复

每张卡只能有一个 learningObjective。
同一个 concept 下如果有相同 learningObjective 的卡，说明重复。

输出 JSON：
{
  "drafts": [
    {
      "type": "definition|principle|procedure|formula|comparison|application|example|pitfall",
      "question": "...",
      "answer": "...",
      "tags": ["tag1"],
      "searchKeywords": ["keyword1"],
      "canonicalTopic": null,
      "canonicalConcept": "核心概念名",
      "learningObjective": "definition",
      "atomicFacts": ["事实1", "事实2"],
      "answerScope": "回答角度",
      "confidence": 0.0-1.0,
      "status": "draft|needs_review",
      "sourceRefs": [{"quote": "原文片段"}]
    }
  ]
}`;

export async function generateDrafts(
  concept: ExtractedConceptData,
  sourceText: string,
  chunkRefs?: SourceRef[],
): Promise<CardDraftData[]> {
  const llm = getLLMProvider();
  if (!llm) throw new Error('LLM provider not initialized');

  const response = await llm.chat({
    model: process.env.LLM_MODEL || 'deepseek-chat',
    messages: [
      { role: 'system', content: DRAFT_PROMPT },
      {
        role: 'user',
        content: `Concept: ${concept.conceptName}
Definition: ${concept.definition || '(not provided)'}
Key points: ${concept.keyPoints.join('; ')}
Examples: ${(concept.examples || []).join('; ')}
Formulas: ${(concept.formulas || []).join('; ')}
Tags: ${concept.candidateTags.join(', ')}

Source text:\n${sourceText}`,
      },
    ],
    temperature: 0.3,
    responseFormat: 'json_object',
  });

  try {
    const parsed = JSON.parse(response.text);
    if (!parsed.drafts || !Array.isArray(parsed.drafts)) return [];
    // Use chunk-level sourceRefs as ground truth (LLM-generated quotes may not match block text)
    const groundRefs = chunkRefs && chunkRefs.length > 0 ? chunkRefs : (concept.sourceRefs || []);

    return parsed.drafts.map((d: any) => ({
      type: d.type || 'concept',
      question: d.question || '',
      answer: d.answer || '',
      tags: (d.tags || []).slice(0, 8),
      searchKeywords: (d.searchKeywords || []).slice(0, 8),
      canonicalTopic: d.canonicalTopic || null,
      canonicalConcept: d.canonicalConcept || d.canonicalTopic || d.type || null,
      learningObjective: d.learningObjective || null,
      atomicFacts: d.atomicFacts || [],
      answerScope: d.answerScope || null,
      confidence: d.confidence ?? 0.5,
      status: d.status === 'needs_review' ? 'needs_review' as const : 'draft' as const,
      sourceRefs: groundRefs.map(r => ({
        ...r,
        documentId: concept.documentId || r.documentId || '',
        quote: r.quote || '',
      })),
    }));
  } catch {
    return [];
  }
}
