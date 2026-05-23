// backend/src/services/search/query-understanding.ts
// v8: Rule-based + LLM Query Understanding
//
// Intent recognition, concept extraction, rewrite decision.
// Rules handle 80% for free; LLM handles ambiguous/diagnostic/long queries.

// ── Types ──

export type SearchIntent =
  | 'exact_lookup'
  | 'conceptual_search'
  | 'diagnostic'
  | 'comparison'
  | 'study_plan'
  | 'interview_answer'
  | 'implementation'
  | 'ambiguous';

export interface QueryUnderstanding {
  intent: SearchIntent;
  confidence: number;
  normalizedQuery: string;
  coreConcepts: string[];
  aliases: string[];
  expandedQueries: string[];
  targetDecks: string[];
  negativeDecks: string[];
  queryType: 'keyword' | 'short_concept' | 'long_natural_language' | 'mixed' | 'english' | 'ambiguous';
  needsRewrite: boolean;
  needsStudyPlan: boolean;
  needsDiagnosticExpansion: boolean;
  source: 'rule' | 'llm' | 'rule+llm';
}

export interface FirstPassSummary {
  resultCount: number;
  top1Score: number;
  top5AvgScore: number;
  hasVectorMatches: boolean;
  vectorZeroRatio: number;
  deckDiversity: number;
  emptyResult: boolean;
}

// ── Rule-based Intent Detection ──

const DIAGNOSTIC_PATTERNS = [
  /不下降|不收敛|不收敛了|震荡|效果差|效果不好|效果变差|变差|变坏了/i,
  /训练.*不好|训练.*差|训练.*不了|训练.*失败/i,
  /线上.*变差|上线.*变差|上线.*差|部署.*差|部署.*坏/i,
  /怎么排查|原因.*是什么|什么原因|为什么.*不好|为什么.*差/i,
  /数据太少|数据不够|样本不足|标注不够|标注不足/i,
  /参数太多|太复杂|太简单|不够复杂/i,
  /loss.*不降|loss.*高|loss.*大|梯度.*消失|梯度.*爆炸/i,
  /过拟合.*怎么办|欠拟合.*怎么办/i,
];

const COMPARISON_PATTERNS = [
  /区别|对比|比较|vs\.?|选哪个|哪个好|哪个更|优劣|差异|不同点|有什么不同/i,
  /什么时候用|什么情况|适用场景|分别.*什么|分别.*怎么/i,
];

const STUDY_PLAN_PATTERNS = [
  /系统.*学|想学|想入|入门|从零|从0|零基础|怎么学|如何学|如何入门/i,
  /学习路线|学习路径|学习计划|学习规划|推荐.*学/i,
  /转.*算法|转.*数据|转.*开发|转.*工程/i,
  /刷.*题|刷哪|推荐.*题|推荐.*卡片/i,
  /路线|路径|清单|书单|课单/i,
];

const INTERVIEW_PATTERNS = [
  /面试官.*问|面试.*问|面试.*答|面试.*怎么|面试.*如何/i,
  /被问到|被问|怎么回答|如何回答|怎么解释|怎么介绍/i,
  /项目经历|自我介绍|behavioral/i,
];

const IMPLEMENTATION_PATTERNS = [
  /实现|代码|怎么写|编程|算法.*写|算法.*实现/i,
  /写.*题|刷.*题|coding/i,
];

const EXACT_LOOKUP_PATTERNS = [
  /^[A-Za-z0-9\-_]{1,20}$/,  // pure acronym/number
  /^[\\u4e00-\\u9fff]{1,8}$/, // short Chinese term
];

export function ruleBasedIntent(query: string): QueryUnderstanding {
  const q = query.trim();
  const qi = q.toLowerCase();

  // Detect query type
  let queryType: QueryUnderstanding['queryType'] = 'keyword';
  if (qi.match(/^[a-z0-9\-_]{1,20}$/)) queryType = 'keyword';
  else if (q.length <= 10) queryType = 'short_concept';
  else if (q.length > 30 && /[,，.。!！?？、\s]/.test(q)) queryType = 'long_natural_language';
  else if (/[a-zA-Z]/.test(q) && /[\u4e00-\u9fff]/.test(q)) queryType = 'mixed';
  else if (/^[a-zA-Z0-9\s\-_.,!?]+$/.test(q) && q.length > 5) queryType = 'english';
  else queryType = 'short_concept';

  // Detect intent
  let intent: SearchIntent = 'conceptual_search';
  let confidence = 0.60;
  let needsRewrite = false;
  let needsStudyPlan = false;
  let needsDiagnosticExpansion = false;

  // Study plan — highest priority, most distinctive
  if (STUDY_PLAN_PATTERNS.some(p => p.test(qi))) {
    intent = 'study_plan';
    confidence = 0.85;
    needsRewrite = true;
    needsStudyPlan = true;
  }
  // Diagnostic
  else if (DIAGNOSTIC_PATTERNS.some(p => p.test(qi))) {
    intent = 'diagnostic';
    confidence = 0.80;
    needsRewrite = true;
    needsDiagnosticExpansion = true;
  }
  // Comparison
  else if (COMPARISON_PATTERNS.some(p => p.test(qi))) {
    intent = 'comparison';
    confidence = 0.75;
    needsRewrite = true;
  }
  // Interview
  else if (INTERVIEW_PATTERNS.some(p => p.test(qi))) {
    intent = 'interview_answer';
    confidence = 0.70;
    needsRewrite = true;
  }
  // Implementation
  else if (IMPLEMENTATION_PATTERNS.some(p => p.test(qi))) {
    intent = 'implementation';
    confidence = 0.70;
  }
  // Ambiguous short query
  else if (EXACT_LOOKUP_PATTERNS.some(p => p.test(q)) && q.length <= 3) {
    intent = 'ambiguous';
    confidence = 0.40;
  }
  // Exact lookup (short, high confidence)
  else if (EXACT_LOOKUP_PATTERNS.some(p => p.test(q))) {
    intent = 'exact_lookup';
    confidence = 0.85;
  }

  // Build concepts & aliases from existing QE
  let keywords: string[] = [];
  let deckIds: string[] = [];
  try {
    // Import expandQuery dynamically to avoid circular deps
    const { expandQuery } = require('./query-expander');
    const expanded = expandQuery(q);
    keywords = expanded.keywords || [];
    deckIds = expanded.deckIds || [];
  } catch { 
    const terms = q.split(/[\s,，、]+/).filter(t => t.length >= 2 && t.length <= 20);
    keywords = [...new Set(terms)].slice(0, 8);
  }

  return {
    intent,
    confidence,
    normalizedQuery: q,
    coreConcepts: keywords.slice(0, 8),
    aliases: [],
    expandedQueries: [],
    targetDecks: deckIds.slice(0, 3),
    negativeDecks: [],
    queryType,
    needsRewrite,
    needsStudyPlan,
    needsDiagnosticExpansion,
    source: 'rule',
  };
}

// ── LLM Intent Classification ──

const LLM_INTENT_PROMPT = `Classify this search query into an intent. Output ONLY JSON, no explanation.

Allowed intents: exact_lookup, conceptual_search, diagnostic, comparison, study_plan, interview_answer, implementation, ambiguous
Allowed decks: leetcode, statistics, machine-learning, deep-learning, llm, agent, vibe-coding, jargon, workplace

Query: "{{query}}"

Output JSON:
{
  "intent": "...",
  "confidence": 0.0,
  "normalizedQuery": "...",
  "coreConcepts": ["..."],
  "aliases": ["..."],
  "expandedQueries": ["..."],
  "targetDecks": ["..."],
  "negativeDecks": [],
  "queryType": "keyword|short_concept|long_natural_language|mixed|english|ambiguous",
  "needsRewrite": true,
  "needsStudyPlan": false,
  "needsDiagnosticExpansion": false
}

Rules:
- Do NOT answer the query. Only classify intent and extract concepts.
- If query is about system learning / study roadmap, intent=study_plan.
- If query is about diagnosing why something goes wrong, intent=diagnostic.
- If query is about comparing two things, intent=comparison.
- If query is short and ambiguous (e.g. "FC"), intent=ambiguous.
- coreConcepts max 8, aliases max 8, expandedQueries max 3.
- targetDecks only from allowed list. Use empty array if uncertain.
- Do NOT hallucinate decks.`;

export async function llmIntentClassify(
  query: string,
  llmProvider?: any,
): Promise<QueryUnderstanding | null> {
  if (!llmProvider) return null;

  try {
    const prompt = LLM_INTENT_PROMPT.replace('{{query}}', query);
    const response = await llmProvider.chat({
      model: (llmProvider as any).defaultModel || 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a query understanding module. Output only JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const text = response.content || response.message?.content || '';
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      intent: parsed.intent || 'conceptual_search',
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      normalizedQuery: parsed.normalizedQuery || query,
      coreConcepts: (parsed.coreConcepts || []).slice(0, 8),
      aliases: (parsed.aliases || []).slice(0, 8),
      expandedQueries: (parsed.expandedQueries || []).slice(0, 3),
      targetDecks: (parsed.targetDecks || []).filter((d: string) =>
        ['leetcode','statistics','machine-learning','deep-learning','llm','agent','vibe-coding','jargon','workplace'].includes(d)
      ),
      negativeDecks: [],
      queryType: parsed.queryType || 'short_concept',
      needsRewrite: parsed.needsRewrite !== false,
      needsStudyPlan: parsed.needsStudyPlan === true,
      needsDiagnosticExpansion: parsed.needsDiagnosticExpansion === true,
      source: 'llm',
    };
  } catch {
    return null;
  }
}

// ── Main understandQuery ──

export async function understandQuery(
  query: string,
  firstPass?: FirstPassSummary,
  llmProvider?: any,
): Promise<QueryUnderstanding> {
  // 1. Always run rule-based first
  const ruleResult = ruleBasedIntent(query);

  // 2. Check if we need LLM
  const needsLLM = shouldCallLLM(query, firstPass, ruleResult);

  if (!needsLLM || !llmProvider) {
    return ruleResult;
  }

  // 3. LLM fallback
  const llmResult = await llmIntentClassify(query, llmProvider);
  if (!llmResult) return ruleResult;

  // 4. Merge: LLM overrides intent if confidence is higher
  return {
    ...ruleResult,
    intent: llmResult.confidence > ruleResult.confidence ? llmResult.intent : ruleResult.intent,
    confidence: Math.max(ruleResult.confidence, llmResult.confidence),
    coreConcepts: [...new Set([...ruleResult.coreConcepts, ...llmResult.coreConcepts])].slice(0, 8),
    aliases: [...new Set([...ruleResult.aliases, ...llmResult.aliases])].slice(0, 8),
    expandedQueries: [...new Set([...ruleResult.expandedQueries, ...llmResult.expandedQueries])].slice(0, 3),
    targetDecks: [...new Set([...ruleResult.targetDecks, ...llmResult.targetDecks])],
    normalizedQuery: llmResult.normalizedQuery || ruleResult.normalizedQuery,
    needsRewrite: ruleResult.needsRewrite || llmResult.needsRewrite,
    needsStudyPlan: ruleResult.needsStudyPlan || llmResult.needsStudyPlan,
    needsDiagnosticExpansion: ruleResult.needsDiagnosticExpansion || llmResult.needsDiagnosticExpansion,
    source: 'rule+llm',
  };
}

// ── LLM Trigger Logic ──

function shouldCallLLM(
  query: string,
  firstPass?: FirstPassSummary,
  ruleResult?: QueryUnderstanding,
): boolean {
  // Never call LLM for exact short terms
  if (ruleResult?.intent === 'exact_lookup' && ruleResult.confidence > 0.80) return false;

  // Call if first pass is low confidence
  if (firstPass) {
    if (firstPass.emptyResult) return true;
    if (firstPass.resultCount < 3) return true;
    if (firstPass.top1Score < 0.35) return true;
    if (firstPass.top5AvgScore < 0.30) return true;
    if (firstPass.vectorZeroRatio > 0.7) return true;
    if (firstPass.deckDiversity < 0.2 && firstPass.resultCount < 10) return true;
  }

  // Call for these intent types
  if (ruleResult?.intent === 'diagnostic') return true;
  if (ruleResult?.intent === 'ambiguous') return true;
  if (ruleResult?.intent === 'interview_answer' && query.length > 20) return true;
  if (ruleResult?.intent === 'comparison' && query.length > 15) return true;

  // Call for long natural language queries
  if (ruleResult?.queryType === 'long_natural_language') return true;

  return false;
}

// ── First Pass Summary ──

export function summarizeFirstPass(hits: Array<{ score: number; deckId: string }>): FirstPassSummary {
  if (hits.length === 0) {
    return {
      resultCount: 0, top1Score: 0, top5AvgScore: 0,
      hasVectorMatches: false, vectorZeroRatio: 1,
      deckDiversity: 0, emptyResult: true,
    };
  }

  const scores = hits.map(h => h.score).sort((a, b) => b - a);
  const top5 = scores.slice(0, 5);
  const top1 = scores[0];
  const top5Avg = top5.reduce((s, v) => s + v, 0) / top5.length;

  const decks = new Set(hits.map(h => h.deckId));
  const deckDiversity = decks.size / Math.min(9, hits.length);

  return {
    resultCount: hits.length,
    top1Score: top1,
    top5AvgScore: top5Avg,
    hasVectorMatches: true,
    vectorZeroRatio: 0,
    deckDiversity,
    emptyResult: false,
  };
}
