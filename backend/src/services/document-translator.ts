// Detect and translate English-predominant card drafts to Simplified Chinese
// Preserves technical nouns and sourceRefs.quote (not translated)

import { getLLMProvider } from './llm-provider';
import type { CardDraftData } from './document-parser/types';

const TRANSLATE_PROMPT = `你是技术内容中英翻译器。将以下内容翻译为简体中文。

术语保留规则（必须保留以下英文原文，不要翻译）：
全大写缩写：SQL、AUC、ROC、GPU、API、MLE、PCA、SVM、RAG、RLHF、BERT、GPT、CNN、RNN、LSTM、GRU、GAN、ML、DL、LLM、NLP、CV、DQN、PPO、MCMC、ANOVA、A/B
含数字/符号词：BERT-base、GPT-4、L2、top-k、n-1、λ、η、θ、μ、σ、ε
算法/模型/库名：XGBoost、K-Means、KMeans、LightGBM、PyTorch、TensorFlow、scikit-learn、NumPy、Pandas、Matplotlib、Seaborn、OpenCV、HuggingFace
英文专有短语：Random Forest、Gradient Boosting、Support Vector Machine、Kernel Density Estimation、Maximum Likelihood、Confusion Matrix、Naive Bayes、Decision Tree、Linear Regression、Logistic Regression、Principal Component Analysis、t-SNE、Batch Normalization、Layer Normalization、Self-Attention、Multi-Head Attention、Positional Encoding、Cross-Entropy、Mean Squared Error、Backpropagation、Stochastic Gradient Descent
可以补中文解释，但不要替换英文名称。

输出 JSON 数组，每个元素对应输入的一条草稿：
{
  "translations": [
    {"question": "中文问题", "answer": "中文答案", "atomicFacts": ["事实1"], "answerScope": "中文范围"}
  ]
}`;

export function isPredominantlyEnglish(text: string): boolean {
  if (!text) return false;
  const cleaned = text.replace(/[\s\d\p{P}]/gu, '');
  const ascii = (cleaned.match(/[a-zA-Z]/g) || []).length;
  const cjk = (cleaned.match(/[\u4e00-\u9fff]/g) || []).length;
  return ascii > 0 && ascii > cjk * 2;
}

export interface TranslationEntry {
  question: string;
  answer: string;
  atomicFacts: string[];
  answerScope: string;
}

export async function translateDrafts(drafts: CardDraftData[]): Promise<CardDraftData[]> {
  const llm = getLLMProvider();
  if (!llm) return drafts;

  const needTranslation = drafts.filter(d =>
    isPredominantlyEnglish(d.question) || isPredominantlyEnglish(d.answer)
  );
  if (needTranslation.length === 0) return drafts;

  const BATCH_SIZE = 10;
  const allTranslated = new Map<string, TranslationEntry>();

  for (let i = 0; i < needTranslation.length; i += BATCH_SIZE) {
    const batch = needTranslation.slice(i, i + BATCH_SIZE);
    const userContent = batch.map((d, idx) =>
      `${idx + 1}. question: ${d.question}\n   answer: ${d.answer.slice(0, 300)}\n   atomicFacts: ${(d.atomicFacts || []).join('; ')}\n   answerScope: ${d.answerScope || ''}`
    ).join('\n\n');

    try {
      const model = llm.defaultModel || process.env.LLM_MODEL || 'deepseek-chat';
      const response = await llm.chat({
        model,
        messages: [
          { role: 'system', content: TRANSLATE_PROMPT },
          { role: 'user', content: userContent },
        ],
        temperature: 0.1,
        responseFormat: 'json_object',
      });

      const parsed = JSON.parse(response.text);
      if (parsed.translations && Array.isArray(parsed.translations)) {
        for (let j = 0; j < batch.length && j < parsed.translations.length; j++) {
          allTranslated.set(batch[j].question, parsed.translations[j]);
        }
      }
    } catch (e) {
      console.warn(`[translator] batch translation failed for ${batch.length} drafts: ${(e as any)?.message || e}`);
    }
  }

  // Merge translations back
  return drafts.map(d => {
    const tr = allTranslated.get(d.question);
    if (!tr) return d;
    return {
      ...d,
      question: tr.question || d.question,
      answer: tr.answer || d.answer,
      atomicFacts: tr.atomicFacts?.length ? tr.atomicFacts : d.atomicFacts,
      answerScope: tr.answerScope || d.answerScope,
    };
  });
}
