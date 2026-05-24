// backend/src/services/search/query-understanding.ts
// Parses natural language search queries into structured intent + topic + keywords.
// Uses regex for common patterns; falls back to LLM for ambiguous queries.

import { conceptLookup, getAllTopics } from './concept-dictionary';

// ── Types ──

export type SearchIntent = 'study' | 'review' | 'lookup' | 'practice' | 'plan';

export interface ParsedSearchQuery {
  intent: SearchIntent;
  topic: string;          // normalized topic (concept dictionary key or raw phrase)
  deckHint?: string;      // suggested deck
  subtopics: string[];    // sub-topic refinements
  keywords: string[];     // expansion keywords
  constraints: {
    difficulty?: string[];
    onlyDue?: boolean;
    newOnly?: boolean;
  };
  confidence: number;     // 0-1, higher = more confident regex matched
  rawQuery: string;       // original input
  debug: string;          // how was this parsed?
}

// ── Regex patterns ──

interface IntentPattern {
  intent: SearchIntent;
  patterns: RegExp[];
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: 'study',
    patterns: [
      /^(?:我想|我要|我想学|我要学|想学|想学习|学|学习)(.+)/,
      /^(.+)(?:怎么学|如何学|如何学习|怎么学习|学习方法)$/,
    ],
  },
  {
    intent: 'review',
    patterns: [
      /^(?:复习|回顾|重温)(.+)/,
      /^(?:我想复习|我要复习)(.+)/,
      /^(.+)(?:复习|回顾)$/,
    ],
  },
  {
    intent: 'practice',
    patterns: [
      /^(?:刷|刷题|练习|训练)(.+)/,
      /^(.+)(?:刷题|练习|训练)$/,
    ],
  },
  {
    intent: 'lookup',
    patterns: [
      /^(?:什么是|什么叫|什么是|啥是|解释)(.+)/,
    ],
  },
  {
    intent: 'plan',
    patterns: [
      /^(?:制定|生成|帮我|帮我制定|帮我生成|给我)(?:一个|一份)?(?:学习|复习)?计划(?:.*)?(.+)/,
    ],
  },
];

/** Main entry point: parse a raw query into structured form. */
export async function understandQuery(rawQuery: string): Promise<ParsedSearchQuery> {
  const q = rawQuery.trim();

  // ── Regex parsing ──
  for (const group of INTENT_PATTERNS) {
    for (const pattern of group.patterns) {
      const match = q.match(pattern);
      if (match) {
        const topicRaw = match[1]?.trim() || '';
        const result = resolveFromTopic(topicRaw, group.intent, q);
        if (result) return result;
        // Topic extraction failed — continue trying other patterns
      }
    }
  }

  // ── Fallback: try to match any known topic ──
  const topicMatch = matchAnyTopic(q);
  if (topicMatch) {
    const resolved = resolveFromTopic(topicMatch.topic, 'lookup', q);
    if (resolved) return { ...resolved, confidence: Math.min(resolved.confidence, 0.5) };
  }

  // ── LLM fallback ──
  const llmResult = await llmUnderstanding(q);
  if (llmResult) return llmResult;

  // ── Final fallback: raw query as lookup ──
  return {
    intent: 'lookup',
    topic: q,
    subtopics: [],
    keywords: [q],
    constraints: {},
    confidence: 0.1,
    rawQuery: q,
    debug: 'fallback: raw query as lookup',
  };
}

// ── Helpers ──

function resolveFromTopic(
  topicRaw: string,
  intent: SearchIntent,
  rawQuery: string,
): ParsedSearchQuery | null {
  // Strip trailing noise
  let topic = topicRaw
    .replace(/[，,。\.！!？?\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!topic || topic.length < 1) return null;

  // Remove trailing intent words
  topic = topic.replace(/(怎么学|如何学|怎么学习|复习|回顾|学习)$/g, '').trim();
  if (!topic) return null;

  // Concept dictionary lookup
  const concept = conceptLookup(topic);
  if (concept) {
    return {
      intent,
      topic: concept.topic,
      deckHint: concept.deckHint,
      subtopics: concept.subtopics,
      keywords: concept.keywords,
      constraints: intent === 'review' ? { onlyDue: true } : {},
      confidence: 0.9,
      rawQuery,
      debug: `regex: intent=${intent}, topic="${concept.topic}" from "${topicRaw}"`,
    };
  }

  // No concept match — use raw topic
  return {
    intent,
    topic,
    subtopics: [],
    keywords: [topic],
    constraints: intent === 'review' ? { onlyDue: true } : {},
    confidence: 0.6,
    rawQuery,
    debug: `regex: intent=${intent}, topic="${topic}", no concept match`,
  };
}

function matchAnyTopic(query: string): { topic: string } | null {
  const words = query.split(/\s+/).filter(w => w.length >= 2);
  for (const word of words) {
    const concept = conceptLookup(word);
    if (concept) return { topic: word };
  }
  return null;
}

// ── LLM fallback ──

async function llmUnderstanding(query: string): Promise<ParsedSearchQuery | null> {
  const knownTopics = getAllTopics().join(', ');
  const prompt = `你是一个搜索意图解析器。分析用户查询并提取以下字段：

已知话题：${knownTopics}

用户查询："${query}"

请返回 JSON：
{
  "intent": "study" | "review" | "lookup" | "practice" | "plan",
  "topic": "话题名称（必须是已知话题或查询中的关键词）",
  "confidence": 0.0-1.0
}

要求：
- topic 不能为空
- topic 不能包含"我想学"、"我要学"、"怎么学"等前缀
- 如果查询没有明确话题，confidence 设为 0
- 只返回 JSON，不要其他文字`;

  try {
    const res = await fetch(
      `${process.env.LLM_BASE_URL || 'https://api.deepseek.com'}/v1/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.LLM_MODEL || 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0,
        }),
      },
    );

    if (!res.ok) return null;
    const data = await res.json() as any;
    const text = data.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as {
      intent: string; topic: string; confidence: number;
    };

    // Validate
    if (!parsed.topic || parsed.topic.trim().length === 0) return null;
    const invalidPrefix = /^(我想|我要|我想学|怎么学|如何学)/;
    if (invalidPrefix.test(parsed.topic.trim())) return null;

    const intent = (['study', 'review', 'lookup', 'practice', 'plan'].includes(parsed.intent)
      ? parsed.intent : 'lookup') as SearchIntent;
    const topic = parsed.topic.trim();
    const concept = conceptLookup(topic);

    return {
      intent,
      topic: concept?.topic || topic,
      deckHint: concept?.deckHint,
      subtopics: concept?.subtopics || [],
      keywords: concept?.keywords || [topic],
      constraints: intent === 'review' ? { onlyDue: true } : {},
      confidence: Math.min(parsed.confidence || 0.5, 0.7),
      rawQuery: query,
      debug: `llm: intent=${intent}, topic="${topic}", confidence=${parsed.confidence}`,
    };
  } catch (e) {
    console.error('[query-understanding] LLM failed:', (e as Error).message?.slice(0, 100));
    return null;
  }
}
