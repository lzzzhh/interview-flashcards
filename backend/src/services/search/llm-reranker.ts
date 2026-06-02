// LLM-based reranker for Neo4j search — pair-wise relevance scoring
// Uses one LLM call per query (batch of Top50 candidates) for efficiency

import { getLLMProvider } from '../llm-provider';

interface CardForLLMRerank {
  cardId: string;
  title: string;
  question?: string;
  answer?: string;
  tags: string[];
  searchKeywords: string[];
  deckName?: string;
  matchedConcepts: string[];
}

interface LLMRerankResult {
  cardId: string;
  relevance: number; // 0-5
  reason: string;
}

const RERANK_PROMPT = `You are a relevance judge for a technical interview flashcard search system.
For each candidate card, rate how well it answers the user's query on a 0-5 scale:

5 = Directly answers the query / perfectly matches the core concept
4 = Highly relevant, should be in Top15
3 = Relevant but more like background knowledge
2 = Weakly relevant, surface-level keyword match only
1 = Only has lexical overlap, not conceptually relevant
0 = Not relevant at all

Output a JSON array: [{"cardId":"...","relevance":N,"reason":"brief"}]
Order by relevance descending.`;

export async function llmRerankTopK(
  query: string,
  candidates: CardForLLMRerank[],
  topK: number = 15,
): Promise<LLMRerankResult[]> {
  const provider = getLLMProvider();
  if (!provider || candidates.length === 0) return [];

  // Build batch prompt with all candidates
  const candidateLines = candidates.map((c, i) =>
    `[${i}] cardId="${c.cardId}" | deck="${c.deckName || '?'}" | concepts="${c.matchedConcepts.slice(0,3).join(', ')}"\n` +
    `    title="${(c.title || '').slice(0,80)}"\n` +
    `    question="${(c.question || '').slice(0,120)}"\n` +
    `    answer="${(c.answer || '').slice(0,200)}"\n` +
    `    tags="${c.tags.slice(0,5).join(', ')}"\n` +
    `    keywords="${c.searchKeywords.slice(0,5).join(', ')}"`
  ).join('\n\n');

  const prompt = `${RERANK_PROMPT}\n\nUser query: "${query}"\n\nCandidates:\n${candidateLines}\n\nRate ALL ${candidates.length} candidates. Return JSON array.`;

  try {
    const response = await provider.chat({
      model: provider.defaultModel,
      messages: [
        { role: 'system', content: RERANK_PROMPT },
        { role: 'user', content: prompt.split('\n').slice(3).join('\n') },
      ],
      temperature: 0.1,
      maxTokens: candidates.length * 80,
      responseFormat: 'json_object',
    });

    // Parse LLM output
    const text = response.text.trim();
    // Try to extract JSON array
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('[llm-rerank] No JSON array in response, returning empty');
      return [];
    }

    const ratings = JSON.parse(jsonMatch[0]) as Array<{ cardId: string; relevance: number; reason?: string }>;
    return ratings
      .filter(r => typeof r.relevance === 'number' && r.relevance >= 0 && r.relevance <= 5)
      .map(r => ({
        cardId: r.cardId,
        relevance: r.relevance,
        reason: r.reason || '',
      }));
  } catch (e: any) {
    console.warn(`[llm-rerank] Failed: ${e.message}`);
    return [];
  }
}

/** Normalize 0-5 relevance to 0-1 score */
export function normalizeLLMScore(relevance: number): number {
  return Math.min(Math.max(relevance / 5, 0), 1);
}
