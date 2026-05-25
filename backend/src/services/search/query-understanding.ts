// backend/src/services/search/query-understanding.ts
// Pipeline: rawQuery → normalize → intent → slot extraction → sanitizeTopic → protect → concept expansion → keyword tiering → rewrite

import { conceptLookup, getAllTopics, type ConceptEntry } from './concept-dictionary';
import { resolveConceptFromGraph, buildKeywordTiersFromGraphWithLimits } from './concept-graph';

// ── Types ──

export type SearchIntent = 'study' | 'review' | 'lookup' | 'practice' | 'plan' | 'recommend_cards' | 'learning_path';

// ── Protected terms — must not be matched by stopword substrings ──
const PROTECTED_TERMS = new Set([
  '机器学习', '深度学习', '强化学习', '集成学习', '迁移学习', '表示学习', '对比学习', '自监督学习',
  '排序算法', '回溯算法', '图算法', '贪心算法', '搜索算法',
  '注意力机制', '自注意力', '多头注意力',
  '生成对抗网络', '图神经网络', '循环神经网络', '卷积神经网络',
]);

// ── Alias mapping before sanitize ──
const CANONICAL_ALIAS: Record<string, string> = {
  '排序算法': '排序', '回溯算法': '回溯', '图算法': '图', '贪心算法': '贪心',
  '概率论': '概率', '概率统计': '概率',
  '哈希表': '哈希表',
  '优化器': '优化器', '损失函数': '损失函数',
  '数据结构': '数据结构', '算法': '算法',
};

export interface ParsedSearchQuery {
  rawQuery: string;
  intent: SearchIntent;
  topicRaw: string;            // raw extracted from regex/LLM before sanitize
  topic: string;               // sanitized + protected final topic
  canonicalTopic: string;      // concept dictionary canonical form or topic
  deckHint?: string;
  parentCategory?: string;     // parent knowledge domain
  subtopics: string[];
  constraints: { difficulty?: string[]; onlyDue?: boolean; newOnly?: boolean };
  coreKeywords: string[];        // must be in recall + rerank
  expandedKeywords: string[];    // participate in recall, few in rerank
  lowPriorityKeywords: string[]; // not in main recall, only fallback
  prerequisiteKeywords: string[]; // learning-path: foundational concepts
  rewrittenQuery: string;        // final keyword string for retrieval
  recallText: string;            // what goes into recall channels
  rerankText: string;            // what goes into reranker
  confidence: number;
  source: 'regex' | 'llm' | 'fallback';
  topicChangeReason: string;     // why topic changed from topicRaw
  filteredStopwords: string[];   // stopwords removed from query
  conceptSource: 'graph' | 'legacy' | 'fallback';  // where concept info came from
  debug: string;
}

// ── Stopwords ──

const STOPWORDS = new Set([
  '学习', '学', '怎么学', '如何学', '要怎么学', '该怎么学',
  '方法', '教程', '推荐', '卡片', '几张', '几', '个', '给我',
  '知识点', '总结', '资料', '路线', '计划', '入门', '实战', '案例',
  '我想', '我要', '我想学', '我要学', '想学', '想学习',
  '复习', '回顾', '了解', '掌握', '搞懂', '刷', '刷题',
  '区别', '什么时候', '用什么', '怎么', '怎样', '如何', '什么是', '什么叫',
]);

// ── Regex intent patterns ──

const INTENT_PATTERNS: { intent: SearchIntent; patterns: RegExp[] }[] = [
  { intent: 'study',   patterns: [
    // Prefix patterns
    /^(?:如何学习|怎么学习|怎么系统学|要怎么学|该怎么学|我想学|我要学|怎么学|如何学|怎样学|我想|我要|想学|想学习|学|学习)(.+)/,
    // Request/recommend patterns: extract topic from "帮我找X" / "给我一组X"
    /^(?:帮我找|给我一组|给我推荐|帮我推荐|给我)(.+?)(?:相关卡片|的学习清单|几张卡片|的相关内容)?$/,
    // Weakness suffixes (check before broader study suffixes)
    /^(.+?)(?:不太懂|很薄弱|老是搞混|完全没概念)/,
    // Suffix patterns — broad coverage
    /^(.+?)(?:怎么学|如何学|如何学习|怎么学习|怎么入门|如何入门|学习方法|学习路线|入门|从哪里开始学|从哪开始|应该先学什么|先学什么|有哪些卡|怎么补|怎么复习|怎么系统学|为什么|推荐几张卡|推荐几张|推荐卡)/,
  ]},
  { intent: 'review',  patterns: [
    /^(?:复习|回顾|重温|我想复习|我要复习)(.+)/,
    /^(.+)(?:复习|回顾)$/,
    // Weakness review
    /^(.+?)(?:不太懂|很薄弱|老是搞混).*怎么复习/,
    /^(.+?)(?:面试|老是)被问到.*怎么补/,
  ]},
  { intent: 'practice', patterns: [/^(?:刷|刷题|练习|训练)(.+)/, /^(.+)(?:刷|练习|训练)$/] },
  { intent: 'lookup',  patterns: [/^(?:什么是|什么叫|啥是|解释|了解)(.+)/] },
];

// ── Main entry point ──

export async function understandQuery(rawQuery: string): Promise<ParsedSearchQuery> {
  const q = rawQuery.trim();
  let topicRaw = '';
  let intent: SearchIntent = 'lookup';
  let source: ParsedSearchQuery['source'] = 'fallback';
  let debugMsg = '';

  // ── Step 1: Regex intent + topic extraction ──
  for (const group of INTENT_PATTERNS) {
    for (const pattern of group.patterns) {
      const match = q.match(pattern);
      if (match) {
        const rawMatch = (match[1] || match.length > 1 ? match[1] : '').trim();
        // P3: alias resolution before sanitize
        topicRaw = CANONICAL_ALIAS[rawMatch] || sanitizeTopic(rawMatch);
        intent = group.intent;
        source = 'regex';
        debugMsg = `regex: intent=${intent}, topicRaw="${topicRaw}"`;
        break;
      }
    }
    if (topicRaw) break;
  }

  // ── Step 2: If no regex match, try dict match from full query ──
  if (!topicRaw) {
    const words = q.split(/[，,\s]+/).filter(w => w.length >= 2);
    for (const word of words) {
      const clean = sanitizeTopic(word);
      const concept = await conceptLookup(clean);
      if (concept) {
        topicRaw = clean;
        intent = 'study';
        source = 'regex';
        debugMsg = `dict match: "${clean}"`;
        break;
      }
    }
  }

  // ── Step 3: LLM fallback ──
  if (!topicRaw) {
    const llmResult = await llmFullParse(q);
    if (llmResult) {
      topicRaw = sanitizeTopic(llmResult.topic);
      intent = llmResult.intent;
      source = 'llm';
      debugMsg = `llm: topic="${llmResult.topic}"`;
    }
  }

  // ── Step 4: Final fallback ──
  if (!topicRaw) {
    topicRaw = q;
    intent = 'lookup';
    source = 'fallback';
    debugMsg = 'fallback: raw query';
  }

  // ── Step 5: Protect specific topic ──
  const protectedTopic = protectSpecificTopic(q, topicRaw);

  // ── Step 6: Concept expansion (graph for canonical/deckHint, legacy for keywords) ──
  const graphResolved = resolveConceptFromGraph(protectedTopic);
  let conceptSource: ParsedSearchQuery['conceptSource'] = 'fallback';
  // Always load legacy dict for keyword coverage, graph only supplements canonical/deckHint
  const concept = await conceptLookup(protectedTopic);
  let canonicalTopic: string;
  
  if (graphResolved.conceptGraphHit) {
    conceptSource = 'graph';
    canonicalTopic = graphResolved.canonicalTopic;
  } else if (concept) {
    conceptSource = 'legacy';
    canonicalTopic = concept?.canonicalTopic || concept?.topic || protectedTopic;
  } else {
    conceptSource = 'fallback';
    canonicalTopic = protectedTopic;
  }

  const topicChangeReason = buildTopicChangeReason(topicRaw, protectedTopic, canonicalTopic);

  // ── Step 7: Keyword tiering ──
  // Primary: legacy dict (proven eval coverage). Supplementary: graph adds extra keywords.
  let coreKeywords: string[], expandedKeywords: string[], lowPriorityKeywords: string[], prerequisiteKeywords: string[];
  
  // Base keywords always from legacy dict (if available)
  const baseCore = concept?.coreKeywords?.length
    ? [...new Set([canonicalTopic, ...concept.coreKeywords])]
    : [canonicalTopic];
  const baseExpanded = concept?.expandedKeywords ? [...concept.expandedKeywords] : [];
  const baseLow = concept?.lowPriorityKeywords || [];
  const basePrereq = concept?.prerequisiteKeywords || [];
  
  // If graph hit, supplement with graph-derived keywords (not replace)
  if (graphResolved.conceptGraphHit) {
    const graphTiers = buildKeywordTiersFromGraphWithLimits(graphResolved.graphNodeId!, intent === 'study' ? 'learning-path' : 'search');
    // Graph core: only add new keywords not already in base
    coreKeywords = [...new Set([...baseCore, ...graphTiers.coreKeywords])];
    // Graph expanded: only add new, respecting max
    const graphNew = graphTiers.expandedKeywords.filter(k => !baseExpanded.includes(k));
    expandedKeywords = [...baseExpanded, ...graphNew].slice(0, 16);
    // Low priority: merge both
    lowPriorityKeywords = [...new Set([...baseLow, ...graphTiers.lowPriorityKeywords])];
    // Prerequisites: merge both, graph may have more via relations
    prerequisiteKeywords = [...new Set([...basePrereq, ...graphTiers.prerequisiteKeywords])];
  } else {
    coreKeywords = baseCore;
    expandedKeywords = baseExpanded;
    lowPriorityKeywords = baseLow;
    prerequisiteKeywords = basePrereq;
  }

  // ── Step 8: Build recall/rerank text ──
  // IMPORTANT: always include topicRaw + sanitized raw query as fallback terms
  const rawNoStopwords = q.split(/[\s，,。！!？?]+/).filter(w => w.length >= 2 && !isStopword(w));
  const allExpanded = [...coreKeywords, ...expandedKeywords, ...rawNoStopwords];
  const recallText = [...new Set(allExpanded.filter(k => !isStopword(k)))].join(' ');
  const rerankText = [...new Set([...coreKeywords, ...expandedKeywords.slice(0, 5), ...rawNoStopwords.slice(0, 2)].filter(k => !isStopword(k)))].join(' ');

  // ── Step 9: Filtered stopwords ──
  const filteredStopwords = [...STOPWORDS].filter(s => q.includes(s));

  return {
    rawQuery: q,
    intent, topicRaw, topic: protectedTopic, canonicalTopic,
    deckHint: concept?.deckHint,
    parentCategory: concept?.parentCategory,
    subtopics: concept?.subtopics || [],
    constraints: intent === 'review' ? { onlyDue: true } : {},
    coreKeywords, expandedKeywords, lowPriorityKeywords,
    prerequisiteKeywords: concept?.prerequisiteKeywords || [],
    rewrittenQuery: recallText,
    recallText, rerankText,
    confidence: source !== 'fallback' ? 0.8 : 0.2,
    source, topicChangeReason, filteredStopwords,
    conceptSource,
    debug: debugMsg,
  };
}

// ── sanitizeTopic ──
// Removes intent prefixes, request modifiers, tails after punctuation

export function sanitizeTopic(raw: string): string {
  let t = raw.trim();

  // Remove intent prefixes (order matters: longer first)
  t = t.replace(/^(怎么学习|要怎么学|该怎么学|怎么学|如何学习|如何学|怎样学|我想了解|我想学|我要学|我想|我要|想学|想学习|学|学习|了解|掌握|搞懂|刷|复习|回顾|入门)\s*/i, '');

  // Remove request tails after punctuation
  t = t.replace(/[，,。！!？?\s]+.*$/s, '');

  // Remove trailing modifiers
  t = t.replace(/\s*(学习方法|方法|教程|知识点|总结|资料|路线|计划|入门|实战|案例|卡片|推荐|的区别|什么时候|用什么|怎么|怎样|如何|给我)$/g, '');

  t = t.trim();

  // Strip compound negation prefixes + pronouns
  t = t.replace(/^(?:我|我对|面试|最近)(?:不会|不懂|不太懂|很薄弱|老是搞混|完全没概念|总答不好)\s*/i, '');
  t = t.replace(/^(?:我对|我)\s*/, '');

  // Alias resolution (after stripping to match clean topic)
  t = CANONICAL_ALIAS[t] || t;

  // Capitalization normalization
  if (/^[a-zA-Z]/.test(t)) {
    const known: Record<string, string> = { xgboost: 'XGBoost', lightgbm: 'LightGBM', catboost: 'CatBoost', rag: 'RAG', cnn: 'CNN', rnn: 'RNN', lstm: 'LSTM', gpt: 'GPT', svm: 'SVM', gbdt: 'GBDT', llm: 'LLM' };
    if (known[t.toLowerCase()]) return known[t.toLowerCase()];
  }

  return t;
}

// ── P1: Token-level stopword check (protects compound terms) ──
function isStopword(word: string): boolean {
  if (PROTECTED_TERMS.has(word)) return false;
  if (STOPWORDS.has(word)) return true;
  return false;
}

// ── P0: Clarification result ──
function buildClarifyResult(q: string): ParsedSearchQuery {
  return {
    rawQuery: q, intent: 'learning_path', topicRaw: '', topic: '', canonicalTopic: '',
    deckHint: undefined, parentCategory: undefined, subtopics: [],
    constraints: {}, coreKeywords: [], expandedKeywords: [], lowPriorityKeywords: [], prerequisiteKeywords: [],
    rewrittenQuery: '', recallText: '', rerankText: '',
    confidence: 0, source: 'regex', topicChangeReason: 'needsClarification: no topic in learning_path query',
    filteredStopwords: [], conceptSource: 'fallback', debug: 'needsClarification',
  };
}

// ── protectSpecificTopic ──
// If rawQuery contains a specific concept, topic must preserve it

const SPECIFIC_TERMS = ['xgboost', 'XGBoost', 'lightgbm', 'LightGBM', 'catboost', 'CatBoost',
  '集成学习', 'ensemble learning', '哈希表', 'hash table', '数组', '动态规划', 'DP',
  'Transformer', 'RAG', 'CNN', 'RNN', 'LSTM', 'GRU', 'GPT', 'BERT', 'GAN',
  'SVM', 'GBDT', 'XGBoost', 'KNN', 'PCA', 'AUC', 'ROC',
  '二叉树', '链表', '栈', '队列', '图', '堆', '最小生成树',
];

function protectSpecificTopic(rawQuery: string, topic: string): string {
  const lower = rawQuery.toLowerCase();
  const tLower = topic.toLowerCase();

  for (const term of SPECIFIC_TERMS) {
    if (lower.includes(term.toLowerCase())) {
      // The raw query mentions this specific term
      if (tLower !== term.toLowerCase() && !tLower.includes(term.toLowerCase())) {
        // Topic lost the specificity — restore it
        const known: Record<string, string> = { xgboost: 'XGBoost', lightgbm: 'LightGBM', catboost: 'CatBoost', rag: 'RAG', cnn: 'CNN', rnn: 'RNN', lstm: 'LSTM', gpt: 'GPT', svm: 'SVM', gbdt: 'GBDT', llm: 'LLM', dp: '动态规划', gan: 'GAN', knn: 'KNN', pca: 'PCA', auc: 'AUC', roc: 'ROC' };
        return known[term.toLowerCase()] || term;
      }
    }
  }
  return topic;
}

// ── Helpers ──

function buildTopicChangeReason(topicRaw: string, protectedTopic: string, canonicalTopic: string): string {
  const parts: string[] = [];
  if (protectedTopic !== topicRaw) parts.push(`sanitize: "${topicRaw}" → "${protectedTopic}"`);
  if (canonicalTopic !== protectedTopic) parts.push(`canonicalize: "${protectedTopic}" → "${canonicalTopic}"`);
  return parts.join(' | ') || 'no change';
}

// ── LLM full parse ──

async function llmFullParse(query: string): Promise<{ intent: SearchIntent; topic: string; rewrittenQuery: string } | null> {
  const knownTopics = (await getAllTopics()).join(', ');
  const prompt = `你是搜索意图解析器。提取用户想学习的具体概念。

已知话题：${knownTopics}

查询："${query}"

返回JSON：
{
  "intent": "study|review|lookup|practice|plan|recommend_cards",
  "topic": "具体概念名（如XGBoost、哈希表、集成学习，不是机器学习这种大类）",
  "rewrittenQuery": "检索关键词（空格分隔，不含学习/教程/推荐/卡片等请求词）"
}

只返回JSON。`;

  try {
    const res = await fetch(`${process.env.LLM_BASE_URL || 'https://api.deepseek.com'}/v1/chat/completions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({ model: process.env.LLM_MODEL || 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 200, temperature: 0 }),
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    const text = data.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.topic || parsed.topic.trim().length === 0) return null;
    return { intent: parsed.intent || 'lookup', topic: parsed.topic.trim(), rewrittenQuery: parsed.rewrittenQuery || '' };
  } catch { return null; }
}
