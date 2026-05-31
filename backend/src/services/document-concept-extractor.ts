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

语言要求：
- conceptName 如果是公认英文技术名词，保留英文原名，例如 XGBoost、K-Means、Transformer、RAG。
- definition、keyPoints、examples、prerequisites、commonConfusions 使用简体中文。
- candidateTags 使用中文标签为主，同时保留关键英文术语标签。
- 把专有技术名词、算法名、模型名保留英文，不要硬翻译成生硬中文。
- sourceRefs.quote 保留原文，不要翻译。

术语保留规则：
以下类型必须保留英文：
1. 全大写缩写：SQL、AUC、ROC、GPU、API、MLE、PCA、SVM、RAG、RLHF、BERT、GPT
2. 含数字或符号的技术词：BERT-base、GPT-4、L2、top-k、n-1、λ
3. 算法/模型/库名：XGBoost、K-Means、LightGBM、PyTorch、TensorFlow
4. 英文专有名词短语：Random Forest、Gradient Boosting、Support Vector Machine
可以补中文解释，但不要替换英文名称。

输出 JSON 示例：
{
  "concepts": [
    {
      "conceptName": "XGBoost",
      "definition": "XGBoost 是一种基于梯度提升树的集成学习算法，通过加入正则化和二阶泰勒展开来提升精度和速度。",
      "keyPoints": ["基于 Gradient Boosting 框架", "使用正则化防止过拟合", "支持自定义损失函数"],
      "examples": ["在 Kaggle 竞赛中被广泛使用"],
      "formulas": [],
      "prerequisites": ["决策树", "集成学习", "梯度下降"],
      "commonConfusions": ["XGBoost 不是深度学习模型，是基于树的集成方法"],
      "candidateTags": ["机器学习", "集成学习", "XGBoost", "boosting"],
      "confidence": 0.9,
      "sourceRefs": [{"quote": "原文英文片段"}]
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
