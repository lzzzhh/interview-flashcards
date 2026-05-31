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

语言要求：
- 无论 source chunk 是中文还是英文，question、answer、atomicFacts、answerScope 必须使用简体中文。
- 专有技术名词、算法名、模型名、库名、协议名、缩写词保留英文原文，不要硬翻译。
- 例如：XGBoost、K-Means、KMeans、Random Forest、Transformer、RAG、LoRA、PyTorch、CUDA、SQL、AUC、ROC 保留英文。
- 可以在首次出现时使用「中文解释 + 英文术语」格式，例如「梯度提升树 XGBoost」。
- 不要把专有名词翻译成生硬中文，例如不要把 XGBoost 翻译成"极端梯度提升"作为唯一名称。
- sourceRefs.quote 必须保留原始文本，不要翻译。

术语保留规则：
以下类型必须保留英文：
1. 全大写缩写：SQL、AUC、ROC、GPU、API、MLE、PCA、SVM、RAG、RLHF、BERT、GPT
2. 含数字或符号的技术词：BERT-base、GPT-4、L2、top-k、n-1、λ
3. 算法/模型/库名：XGBoost、K-Means、LightGBM、PyTorch、TensorFlow、scikit-learn
4. 英文专有名词短语：Random Forest、Gradient Boosting、Support Vector Machine
可以补中文解释，但不要替换英文名称。

输出要求：
每张卡必须包含以下字段：

semantic meta 字段说明：
- canonicalConcept：公认技术名词保留英文，如 XGBoost、K-Means、Transformer、RAG
- learningObjective：学习目标枚举值，从以下选一个：
  definition | principle | procedure | formula | comparison | application | example | pitfall
- atomicFacts：用简短中文句子列出这张卡覆盖的原子知识，技术名词保留英文
- answerScope：简述这张卡回答的角度/范围

每张卡只能有一个 learningObjective。
同一个 concept 下如果有相同 learningObjective 的卡，说明重复。

输出 JSON 示例：
{
  "drafts": [
    {
      "type": "definition",
      "question": "XGBoost 是什么？",
      "answer": "XGBoost 是一种基于梯度提升树的集成学习方法，核心思想是逐步训练新树来修正已有模型的误差。相比传统 GBDT，XGBoost 加入了正则化项和二阶泰勒展开来提升精度和速度。",
      "tags": ["机器学习", "集成学习", "XGBoost"],
      "searchKeywords": ["XGBoost", "梯度提升树", "boosting", "GBDT", "集成学习"],
      "canonicalTopic": "机器学习",
      "canonicalConcept": "XGBoost",
      "learningObjective": "definition",
      "atomicFacts": ["XGBoost 属于梯度提升树方法", "XGBoost 通过正则化和二阶展开提升模型表现"],
      "answerScope": "定义和核心思想",
      "confidence": 0.9,
      "status": "draft",
      "sourceRefs": [{"quote": "原始英文片段"}]
    }
  ]
}`;

export async function generateDrafts(
  concept: ExtractedConceptData,
  sourceText: string,
  chunkRefs?: SourceRef[],
): Promise<CardDraftData[]> {
  const llm = getLLMProvider();
  if (!llm) throw new Error('llm_not_configured: LLM provider not initialized. Please configure LLM_API_KEY and LLM_BASE_URL.');

  const model = llm.defaultModel || process.env.LLM_MODEL || 'deepseek-chat';
  const response = await llm.chat({
    model,
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
