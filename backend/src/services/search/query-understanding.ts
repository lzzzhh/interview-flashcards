// backend/src/services/search/query-understanding.ts
// Pipeline: raw query → intent detection → slot extraction → validation → query rewrite → concept expansion
// Uses regex for common patterns; falls back to LLM for rewrite + ambiguous cases.

import { conceptLookup, getAllTopics } from './concept-dictionary';

// ── Types ──

export type SearchIntent = 'study' | 'review' | 'lookup' | 'practice' | 'plan';

export interface ParsedSearchQuery {
  intent: SearchIntent;
  topic: string;
  deckHint?: string;
  subtopics: string[];
  keywords: string[];
  rewrittenQuery: string;    // keyword string for retrieval (no口语noise)
  constraints: {
    difficulty?: string[];
    onlyDue?: boolean;
    newOnly?: boolean;
  };
  confidence: number;
  rawQuery: string;
  debug: string;
}

// ── Regex intent patterns ──

interface IntentPattern {
  intent: SearchIntent;
  patterns: RegExp[];
}

const INTENT_PATTERNS: IntentPattern[] = [
  { intent: 'study',   patterns: [/^(?:怎么学|如何学|怎么学习|我想|我要|我想学|我要学|想学|想学习|学|学习)(.+)/, /^(.+)(?:怎么学|如何学|如何学习|怎么学习|学习方法)$/] },
  { intent: 'review',  patterns: [/^(?:复习|回顾|重温|我想复习|我要复习)(.+)/, /^(.+)(?:复习|回顾)$/] },
  { intent: 'practice', patterns: [/^(?:刷|刷题|练习|训练)(.+)/, /^(.+)(?:刷题|练习|训练)$/] },
  { intent: 'lookup',  patterns: [/^(?:什么是|什么叫|啥是|解释)(.+)/] },
  { intent: 'plan',    patterns: [/^(?:制定|生成|帮我|帮我制定|帮我生成|给我)(?:一个|一份)?(?:学习|复习)?计划(?:.*)?(.+)/] },
];

/** Main entry point */
export async function understandQuery(rawQuery: string): Promise<ParsedSearchQuery> {
  const q = rawQuery.trim();

  // ── Step 1: Regex intent + topic extraction ──
  for (const group of INTENT_PATTERNS) {
    for (const pattern of group.patterns) {
      const match = q.match(pattern);
      if (match) {
        const topicRaw = (match[1] || '').trim();
        const concept = await conceptLookup(topicRaw);
        if (concept) {
          const rewritten = await llmRewrite(topicRaw, q, {
            topic: topicRaw,  // keep original topic
            keywords: [...new Set([...concept.keywords, topicRaw])],
            subtopics: concept.subtopics,
          });
          return buildResult(group.intent, topicRaw, concept, q, rewritten || [...concept.keywords, topicRaw].join(' '), `regex+dict: topic="${topicRaw}"`);
        }
        // No dict match — try LLM rewrite
        const rewritten = await llmRewrite(topicRaw, q, undefined);
        return buildResult(group.intent, topicRaw, undefined, q, rewritten || topicRaw, `regex: topic="${topicRaw}", no dict`);
      }
    }
  }

  // ── Step 2: Try dict match from full query ──
  const dictMatch = await matchAnyTopic(q);
  if (dictMatch) {
    const concept = await conceptLookup(dictMatch.topic);
    return buildResult('lookup', dictMatch.topic, concept, q, q, `dict match: "${dictMatch.topic}"`);
  }

  // ── Step 3: LLM full parse ──
  const llmResult = await llmFullParse(q);
  if (llmResult) return llmResult;

  // ── Step 4: Fallback ──
  return buildResult('lookup', q, undefined, q, q, 'fallback: raw query');
}

// ── LLM rewrite ──

async function llmRewrite(
  topicRaw: string,
  rawQuery: string,
  concept?: { topic: string; keywords: string[]; subtopics: string[] },
): Promise<string | null> {
  const dictWords = concept ? [...concept.keywords, ...concept.subtopics].join(', ') : '';
  const prompt = concept
    ? `用户搜索: "${rawQuery}"\n识别话题: ${concept.topic}\n扩展词: ${dictWords}\n\n请输出一个面向搜索引擎的关键词串（空格分隔），去除"我想学/我要学/怎么学"等口语前缀。只返回关键词，不要其他内容。长度不超过300字。`
    : `用户搜索: "${rawQuery}"\n\n请输出一个面向搜索引擎的关键词串（空格分隔），去除"我想学/我要学/怎么学"等口语前缀。只返回关键词，不要其他内容。长度不超过300字。`;

  try {
    const res = await fetch(
      `${process.env.LLM_BASE_URL || 'https://api.deepseek.com'}/v1/chat/completions`,
      { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY}` },
        body: JSON.stringify({ model: process.env.LLM_MODEL || 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 120, temperature: 0 }) },
    );
    if (!res.ok) return null;
    const data = await res.json() as any;
    const text = (data.choices?.[0]?.message?.content || '').trim();
    if (!text || text.length === 0 || text.length > 300) return null;
    // Validate: no口语 prefix
    if (/^(我想|我要|我想学|怎么学|帮我|给我|请问)/.test(text)) return null;
    return text;
  } catch {
    return null;
  }
}

// ── LLM full parse ──

async function llmFullParse(query: string): Promise<ParsedSearchQuery | null> {
  const knownTopics = (await getAllTopics()).join(', ');
  const prompt = `你是搜索意图解析器。分析查询并返回JSON。

已知话题：${knownTopics}

查询："${query}"

返回JSON：
{
  "intent": "study|review|lookup|practice|plan",
  "topic": "话题名（必须是已知话题或查询关键词）",
  "rewrittenQuery": "面向搜索的关键词串（空格分隔，去除口语前缀，不超过300字）",
  "confidence": 0.0-1.0
}

要求：topic不能为空/含口语前缀，只返回JSON。`;

  try {
    const res = await fetch(
      `${process.env.LLM_BASE_URL || 'https://api.deepseek.com'}/v1/chat/completions`,
      { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY}` },
        body: JSON.stringify({ model: process.env.LLM_MODEL || 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 300, temperature: 0 }) },
    );
    if (!res.ok) return null;
    const data = await res.json() as any;
    const text = data.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as { intent: string; topic: string; rewrittenQuery: string; confidence: number };
    if (!parsed.topic || parsed.topic.trim().length === 0) return null;
    if (/^(我想|我要|我想学|怎么学|如何学)/.test(parsed.topic.trim())) return null;
    const rewritten = (parsed.rewrittenQuery || '').trim();
    if (rewritten && (rewritten.length === 0 || rewritten.length > 300 || /^(我想|我要|我想学|怎么学|帮我|给我|请问)/.test(rewritten))) return null;
    const intent = (['study', 'review', 'lookup', 'practice', 'plan'].includes(parsed.intent) ? parsed.intent : 'lookup') as SearchIntent;
    const concept = await conceptLookup(parsed.topic.trim());
    return buildResult(
      intent,
      parsed.topic.trim(),
      concept,
      query,
      rewritten || concept?.keywords.join(' ') || query,
      `llm: topic="${parsed.topic.trim()}"`,
    );
  } catch {
    return null;
  }
}

// ── Helpers ──

async function matchAnyTopic(query: string): Promise<{ topic: string } | null> {
  const words = query.split(/\s+/).filter(w => w.length >= 2);
  for (const word of words) {
    const concept = await conceptLookup(word);
    if (concept) return { topic: word };
  }
  return null;
}

function buildResult(
  intent: SearchIntent,
  topic: string,
  concept: { topic: string; subtopics: string[]; keywords: string[]; deckHint?: string } | undefined,
  rawQuery: string,
  rewrittenQuery: string,
  debug: string,
): ParsedSearchQuery {
  return {
    intent,
    topic,
    deckHint: concept?.deckHint,
    subtopics: concept?.subtopics || [],
    keywords: concept?.keywords || [topic],
    rewrittenQuery: rewrittenQuery || topic,
    constraints: intent === 'review' ? { onlyDue: true } : {},
    confidence: concept ? 0.9 : 0.5,
    rawQuery,
    debug,
  };
}
