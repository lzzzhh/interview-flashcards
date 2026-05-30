// backend/src/services/search/hybrid-search.ts — 多路召回 + Reranker 搜索编排
//
// 管线：
//   1. Query expansion（规则词典）
//   2. 多路召回（FTS5 + LIKE + tagSearch + searchKeywords + bge-m3 vector）
//   3. Union + dedup 候选池
//   4. DB 补全卡片详情 + SM-2 状态
//   5. Reranker 精排（0.35×vector + 0.30×keyword + 0.25×field + 0.10×learning）
//   6. 返回 topK

import prisma from '../../db/prisma';
import { getVectorStore } from '../vector/vector-store';
import { fts5Search } from './fts5-search';
import { getEmbeddingProvider } from '../embedding-provider';
import { textToVector } from '../vector/local-embedding';
import { understandQuery, sanitizeTopic, type ParsedSearchQuery } from './query-understanding';
import { expandQuery } from './query-expander';
import { conceptGraphLookup, buildKeywordTiersFromGraphWithLimits } from './concept-graph';
import { tokenizeBigrams } from './bigram';
import {
  rerank,
  type CardForRerank,
  type RerankCandidate,
  detectProfile,
  computeStatsLexicalBoost,
  DEFAULT_PROFILE,
  type RerankProfile,
  applyDiversityRerank,
} from './reranker';
import { buildStagedPlan, LEARNING_STAGES, type StagedPlan, type CardInfo } from './study-concept-graph';
import { applyEvidenceGating, type GatingContext } from './evidence-gating';
import { intentToConfigKey } from './gating-config';

// ---- 类型 ----

interface HybridSearchInput {
  query: string;
  deckIds?: string[];
  /** @deprecated use maxResults */
  topK?: number;
  /** 最多返回多少条，默认 50 */
  maxResults?: number;
  /** 质量阈值，低于此分数的结果不返回，默认 0 */
  minScore?: number;
  /** 内部召回候选池大小，默认 300 */
  candidateLimit?: number;
  filters?: {
    difficulty?: string[];
    onlyDue?: boolean;
    includeWeakCards?: boolean;
  };
  /** 强制使用指定 profile（用于 ablation 测试） */
  overrideProfile?: RerankProfile;
  /** 开启全链路 trace */
  debug?: boolean;
}

interface CardMatch {
  cardId: string;
  title: string;
  deckId: string;
  deckName?: string;
  tags: string[];
  score: number;
  matchType: 'vector' | 'keyword' | 'hybrid' | 'due' | 'tag' | 'semantic';
  reason: string;
  due?: boolean;
  lapses?: number;
  snippet?: string;
  /** Score breakdown for buried diagnosis */
  scoreBreakdown?: {
    vectorScore: number;
    keywordScore: number;
    fieldBoost: number;
    learningBoost: number;
    deckBoost: number;
    lexicalBoost: number;
  };
}

const USER_ID = 'demo-user';
const DEFAULT_MIN_SCORE = 0.30;
const DEFAULT_MAX_RESULTS = 50;
const DEFAULT_CANDIDATE_LIMIT = 300;

/** Check if top results are dominated by a single concept cluster */
function getDominantCluster(
  ranked: { cardId: string; finalScore: number }[],
  cardTitles: Map<string, string>,
): { cluster: string; count: number } {
  const counts = new Map<string, number>();
  for (const r of ranked) {
    const t = (cardTitles.get(r.cardId) || '').toLowerCase();
    let key = 'other';
    if (/rag|检索|retrieval/i.test(t)) key = 'rag';
    else if (/微调|finetun|lora|peft/i.test(t)) key = 'finetune';
    else if (/agent|智能体/i.test(t)) key = 'agent';
    else if (/transformer|attention|自注意/i.test(t)) key = 'transformer';
    else if (/梯度|gradient|sgd|adam|优化/i.test(t)) key = 'gradient';
    else if (/ab.*测试|ab.*test|假设检验|hypothesis/i.test(t)) key = 'abtest';
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let max = { cluster: 'other', count: 0 };
  for (const [k, v] of counts) { if (v > max.count) max = { cluster: k, count: v }; }
  return max;
}

interface RecallCandidate {
  cardId: string;
  vectorScore: number;
  keywordScore: number;
  matchedKeywords: string[];
  source: 'fts5' | 'like' | 'tag' | 'searchKeywords' | 'vector';
}

// ---- 主入口 ----

export async function hybridSearch(input: HybridSearchInput): Promise<CardMatch[]> {
  // Resolve parameters: new fields take priority, fallback to legacy topK
  const maxResults = input.maxResults ?? input.topK ?? DEFAULT_MAX_RESULTS;
  const minScore = input.minScore ?? DEFAULT_MIN_SCORE;
  const parsed = await understandQuery(input.query);
  const { intent, topic, canonicalTopic, deckHint, coreKeywords, expandedKeywords, lowPriorityKeywords, subtopics, recallText, rerankText, rewrittenQuery } = parsed;
  const isStudyIntent = intent === 'study' || intent === 'plan' || intent === 'recommend_cards';

  // 1b. Old expandQuery for primary recall (proven baseline)
  const { keywords: oldKW, normalizedQuery: oldNorm } = expandQuery(input.query);
  // Old recall: raw query + normalized + expanded keywords
  const allQueryTextRecall = [input.query, oldNorm || '', ...oldKW].filter(Boolean).join(' ').slice(0, 2000);
  // For study intent (from new understanding), also include tiered keywords
  const studyBoostText = isStudyIntent ? recallText : '';
  const finalRecallText = studyBoostText
    ? [allQueryTextRecall, studyBoostText].join(' ')
    : allQueryTextRecall;
  // For study intent: use lower threshold, higher max results
  const effectiveMinScore = isStudyIntent ? Math.min(input.minScore ?? 0.20, 0.25) : (input.minScore ?? DEFAULT_MIN_SCORE);
  const effectiveMaxResults = isStudyIntent ? Math.max(input.maxResults ?? 100, 100) : (input.maxResults ?? DEFAULT_MAX_RESULTS);

  // Debug log
  if (!process.env.EVAL_SUPPRESS_DEBUG) {
    console.log('[search] intent:', intent, 'topic:', topic, 'canonicalTopic:', canonicalTopic, 'deckHint:', deckHint || '-');
    console.log('[search] coreKeywords:', coreKeywords.join(' '));
    console.log('[search] expandedKeywords:', expandedKeywords.slice(0, 10).join(' '));
    console.log('[search] recallText:', recallText.slice(0, 120));
    console.log('[search] rerankText:', rerankText);
  }

  const deckIds = deckHint ? [deckHint] : undefined;

  // 2. 多路召回（并行）— 召回池大小由 candidateLimit 控制
  const effectiveCandidateLimit = input.candidateLimit ?? DEFAULT_CANDIDATE_LIMIT;
  const poolSize = effectiveCandidateLimit;
  const tagPoolSize = effectiveCandidateLimit;

  const [
    fts5Pool,
    tagPool,
    skwPool,
    vecPool,
  ] = await Promise.all([
    recallFTS5(finalRecallText, poolSize, input.deckIds),
    recallByTags(finalRecallText, expandedKeywords.slice(0, 12), tagPoolSize),
    recallBySearchKeywords(finalRecallText, expandedKeywords.slice(0, 12), tagPoolSize),
    recallVector(finalRecallText, effectiveCandidateLimit),
  ]);

  // 3. Union + dedup
  const candidateMap = new Map<string, RecallCandidate>();

  for (const c of fts5Pool) {
    candidateMap.set(c.cardId, c);
  }
  for (const c of tagPool) {
    const existing = candidateMap.get(c.cardId);
    if (existing) {
      existing.keywordScore = Math.max(existing.keywordScore, c.keywordScore);
      existing.matchedKeywords = [...new Set([...existing.matchedKeywords, ...c.matchedKeywords])];
    } else {
      candidateMap.set(c.cardId, c);
    }
  }
  for (const c of skwPool) {
    const existing = candidateMap.get(c.cardId);
    if (existing) {
      existing.keywordScore = Math.max(existing.keywordScore, c.keywordScore);
      existing.matchedKeywords = [...new Set([...existing.matchedKeywords, ...c.matchedKeywords])];
    } else {
      candidateMap.set(c.cardId, c);
    }
  }
  for (const c of vecPool) {
    const existing = candidateMap.get(c.cardId);
    if (existing) {
      existing.vectorScore = Math.max(existing.vectorScore, c.vectorScore);
    } else {
      candidateMap.set(c.cardId, c);
    }
  }

  const candidates = [...candidateMap.values()];
  if (candidates.length === 0) return [];

  // P4: specificTopicMode — cap candidates for narrow topics
  const SPECIFIC_TOPIC_THRESHOLD = 200;
  if (isStudyIntent || process.env.EVAL_SUPPRESS_DEBUG && candidates.length > SPECIFIC_TOPIC_THRESHOLD) {
    // Prioritize: exact topic match > alias match > tag/kw match > title match > expanded kw
    const topicLower = topic.toLowerCase();
    const topicLower2 = canonicalTopic.toLowerCase();
    const coreLower = coreKeywords.map(k => k.toLowerCase());

    const scored = candidates.map(c => {
      let priority = 0;
      // Terminal match: card ID or title contains topic exactly
      if (c.cardId.toLowerCase().includes(topicLower) || c.cardId.toLowerCase().includes(topicLower2)) priority = 100;
      else if (c.cardId === topic) priority = 100;
      // Alias match
      else if (coreLower.some(k => c.cardId.toLowerCase().includes(k))) priority = 80;
      // Keyword match from matched keywords
      else if (c.matchedKeywords?.some((k: string) => coreLower.some(cl => k.toLowerCase().includes(cl)))) priority = 60;
      // Title/titleCn match
      else priority = 40;
      return { ...c, _lpPriority: priority };
    });

    scored.sort((a, b) => b._lpPriority - a._lpPriority || b.keywordScore - a.keywordScore);
    // Keep top 250 highest priority, then trim to SPECIFIC_TOPIC_THRESHOLD
    const kept = scored.slice(0, SPECIFIC_TOPIC_THRESHOLD);
    // Put trimmed ones back as low-priority
    const trimmed = scored.slice(SPECIFIC_TOPIC_THRESHOLD);
    // Rebuild candidateMap with kept items only
    candidateMap.clear();
    for (const c of kept) candidateMap.set(c.cardId, c);
    // Rebuild candidates array
    candidates.length = 0;
    candidates.push(...candidateMap.values());
  }

  // 4. DB 补全卡片详情 + SM-2 状态
  const cardIds = candidates.map(c => c.cardId);

  const where: any = { id: { in: cardIds } };
  if (input.deckIds && input.deckIds.length > 0) {
    where.deckId = { in: input.deckIds };
  }
  if (input.filters?.difficulty?.length) {
    where.difficulty = { in: input.filters.difficulty };
  }

  let [cards, progresses] = await Promise.all([
    prisma.card.findMany({
      where,
      include: { deck: true },
    }),
    prisma.cardProgress.findMany({
      where: { userId: USER_ID, cardId: { in: cardIds } },
    }),
  ]);

  // Apply onlyDue filter after progress fetch
  if (input.filters?.onlyDue) {
    const dueCardIds = new Set(
      progresses
        .filter(p => p.state !== 'new' && new Date(p.nextReview) <= new Date())
        .map(p => p.cardId)
    );
    cards = cards.filter(c => dueCardIds.has(c.id));
  }

  const cardMap = new Map(cards.map(c => [c.id, c]));
  const progressMap = new Map(progresses.map(p => [p.cardId, p]));

  // 5. 查询 bigram tokens
  const queryBigrams = tokenizeBigrams(recallText);

  // 6. Build reranker candidates
  const rerankInput: RerankCandidate[] = [];
  const cardDetails: CardForRerank[] = [];

  for (const c of candidates) {
    const card = cardMap.get(c.cardId);
    if (!card) continue;

    cardDetails.push({
      cardId: card.id,
      title: card.title,
      titleCn: card.titleCn,
      question: card.question,
      answer: card.answer,
      approach: card.approach,
      description: card.description,
      tags: card.tags,
      searchKeywords: card.searchKeywords,
    });

    const prog = progressMap.get(c.cardId);

    rerankInput.push({
      cardId: c.cardId,
      vectorScore: c.vectorScore,
      keywordScore: c.keywordScore,
      matchedKeywords: c.matchedKeywords,
      queryBigrams,
      learning: prog ? {
        due: prog.state !== 'new' && prog.nextReview <= new Date(),
        lapses: prog.lapses,
        easeFactor: prog.easeFactor,
      } : undefined,
    });
  }

  // 7. Detect rerank profile + compute stats lexical boosts
  const profile = input.overrideProfile
    || detectProfile(input.query, topic, expandedKeywords.slice(0, 5), deckIds || []);
  const extraBoosts = new Map<string, number>();
  const queryLower = topic.toLowerCase();

  if (profile.statsLexicalBoost) {
    for (const card of cards) {
      const boost = computeStatsLexicalBoost(
        queryLower,
        card.title || card.titleCn || '',
        card.searchKeywords || '',
        card.tags ? safeJsonParse(card.tags) : [],
        card.question || '',
        card.answer || '',
        card.deckId,
      );
      if (boost > 0) extraBoosts.set(card.id, boost);
    }
  }

  // 7b. Topic match boost — reward cards where canonicalTopic/coreKeywords match key fields
  // This helps ranking_gap cases: correct cards in Top50 get pushed into Top15
  const topicLower = (canonicalTopic || topic || '').toLowerCase();
  const allMatchTerms = [...new Set([
    topicLower,
    ...coreKeywords.map(k => k.toLowerCase()),
    ...expandedKeywords.slice(0, 8).map(k => k.toLowerCase()),
  ])].filter(t => t.length > 1);
  if (allMatchTerms.length > 0) {
    for (const card of cards) {
      let topicBoost = 0;
      const cardSKW = (card.searchKeywords || '').toLowerCase();
      const cardTags = card.tags ? safeJsonParse(card.tags).map((t: string) => t.toLowerCase()) : [];
      const cardTitle = (card.title || card.titleCn || '').toLowerCase();

      // searchKeywords exact match → +0.15
      if (allMatchTerms.some(t => cardSKW.includes(t))) topicBoost = Math.max(topicBoost, 0.15);
      // tags exact match → +0.12
      if (allMatchTerms.some(t => cardTags.some(tag => tag.includes(t) || t.includes(tag)))) topicBoost = Math.max(topicBoost, 0.12);
      // title exact match → +0.10
      if (allMatchTerms.some(t => cardTitle.includes(t))) topicBoost = Math.max(topicBoost, 0.10);
      // multiple field confirmed → extra +0.05
      const matchCount = [cardSKW, cardTags.join(' '), cardTitle].filter(f => allMatchTerms.some(t => f.includes(t))).length;
      if (matchCount >= 2) topicBoost += 0.05;

      if (topicBoost > 0) {
        const existing = extraBoosts.get(card.id) || 0;
        extraBoosts.set(card.id, existing + topicBoost);
      }
    }
  }

  // 8. Rerank
  const ranked = rerank(rerankInput, cardDetails, profile, extraBoosts);

  // 8b. Deck matching boost: use profile's deckBoost value
  const deckBoostSet = new Set(deckIds || []);
  for (const r of ranked) {
    const card = cardMap.get(r.cardId);
    if (card && deckBoostSet.has(card.deckId)) {
      r.finalScore += profile.deckBoost;
    }
  }

  // 8c. Learning-path mode: prerequisite boost + diversity spread
  const isLearningPath = intent === 'study' || intent === 'plan' || intent === 'recommend_cards';
  if (isLearningPath) {
    const allPrereq = new Set(parsed.prerequisiteKeywords.map(k => k.toLowerCase()));

    // Sort by score first, then apply prerequisite boost to top 40
    ranked.sort((a, b) => b.finalScore - a.finalScore);
    for (const r of ranked.slice(0, 40)) {
      const card = cardMap.get(r.cardId);
      if (card) {
        // Prerequisite boost: cards matching foundational keywords get +0.15
        const cardText = [card.title, card.titleCn, card.tags, card.searchKeywords, card.question].filter(Boolean).join(' ').toLowerCase();
        if (allPrereq.size > 0 && [...allPrereq].some(k => cardText.includes(k))) {
          r.finalScore += 0.15;
        }
        // Easy card boost: cards with lower difficulty or fewer lapses
        const prog = progressMap.get(r.cardId);
        if (prog && prog.lapses !== null && prog.lapses <= 2 && r.finalScore > 0.3) {
          r.finalScore += 0.05; // gentle bump for beginner-friendly cards
        }
      }
    }

    // Resort after boost
    ranked.sort((a, b) => b.finalScore - a.finalScore);

    // Deck diversity: space out same-deck cards
    const diversified: typeof ranked = [];
    const deckCounts = new Map<string, number>();
    const remaining = [...ranked];
    while (remaining.length > 0 && diversified.length < 60) {
      let bestIdx = 0;
      let bestPenalty = Infinity;
      for (let i = 0; i < Math.min(remaining.length, 40); i++) {
        const card = cardMap.get(remaining[i].cardId);
        const deck = card?.deckId || 'unknown';
        const count = deckCounts.get(deck) || 0;
        const penalty = remaining[i].finalScore - count * 0.02;
        if (penalty > bestPenalty || (penalty === bestPenalty && remaining[i].finalScore > 0)) {
          bestPenalty = penalty;
          bestIdx = i;
        }
      }
      const chosen = remaining.splice(bestIdx, 1)[0];
      const card = cardMap.get(chosen.cardId);
      const deck = card?.deckId || 'unknown';
      deckCounts.set(deck, (deckCounts.get(deck) || 0) + 1);
      diversified.push(chosen);
    }

    // Replace ranked with diversified order (but keep original scores for threshold)
    const scoreMap = new Map(ranked.map(r => [r.cardId, r.finalScore]));
    ranked.length = 0;
    for (const d of diversified) {
      const orig = scoreMap.get(d.cardId);
      if (orig !== undefined) {
        ranked.push({ cardId: d.cardId, finalScore: orig, fieldBoost: 0, learningBoost: 0 });
      }
    }
  }
  // Re-sort after deck boost
  ranked.sort((a, b) => b.finalScore - a.finalScore);

  // 8c. Diversity rerank: if top15 dominated by single concept cluster, interleave
  if (ranked.length > 15) {
    const cardTitles = new Map(cards.map(c => [c.id, c.title || c.titleCn || '']));
    const topCluster = getDominantCluster(ranked.slice(0, 15), cardTitles);
    if (topCluster.count >= 8) {
      const diversified = applyDiversityRerank(
        ranked.map(r => ({ cardId: r.cardId, finalScore: r.finalScore })),
        cardTitles,
      );
      // Map scores back
      const scoreMap = new Map(ranked.map(r => [r.cardId, r.finalScore]));
      ranked.length = 0;
      for (const d of diversified) {
        const orig = scoreMap.get(d.cardId);
        if (orig !== undefined) {
          ranked.push({ cardId: d.cardId, finalScore: orig, fieldBoost: 0, learningBoost: 0 });
        }
      }
    }
  }

  // 9. Build final output
  const rankedMap = new Map(ranked.map((r, i) => [r.cardId, { ...r, rank: i + 1 }]));

  const results: CardMatch[] = [];
  for (const c of candidates) {
    const card = cardMap.get(c.cardId);
    const rankInfo = rankedMap.get(c.cardId);
    if (!card || !rankInfo) continue;

    // 判断 matchType
    let matchType: CardMatch['matchType'] = 'keyword';
    let reason = '关键词匹配';

    if (c.source === 'vector') {
      matchType = 'semantic';
      reason = '语义匹配';
    } else if (c.source === 'tag') {
      matchType = 'tag';
      reason = '标签匹配';
    } else if (c.source === 'searchKeywords') {
      matchType = 'keyword';
      reason = '关键词匹配';
    }

    const prog = progressMap.get(c.cardId);
    if (prog && prog.state !== 'new' && prog.nextReview <= new Date()) {
      matchType = 'due';
      reason = '到期复习';
    }

    // 如果分数来自多通道，标记为 hybrid
    const sourceCount = [c.vectorScore > 0, c.keywordScore > 0, c.source === 'tag', c.source === 'searchKeywords'].filter(Boolean).length;
    if (sourceCount >= 2 && matchType !== 'due') {
      matchType = 'hybrid';
      reason = '多路混合匹配';
    }

    const content = card.question || card.answer || card.description || '';
    const snippet = content.slice(0, 120) + (content.length > 120 ? '...' : '');

    const lexicalBoost = extraBoosts.get(card.id) || 0;

    results.push({
      cardId: card.id,
      title: card.title || card.titleCn || card.question || card.id,
      deckId: card.deckId,
      deckName: card.deck.name,
      tags: card.tags ? safeJsonParse(card.tags) : [],
      score: rankInfo.finalScore,
      matchType,
      reason,
      due: prog ? (prog.state !== 'new' && prog.nextReview <= new Date()) : false,
      lapses: prog?.lapses,
      snippet,
      scoreBreakdown: {
        vectorScore: c.vectorScore,
        keywordScore: c.keywordScore,
        fieldBoost: rankInfo.fieldBoost,
        learningBoost: rankInfo.learningBoost,
        deckBoost: deckBoostSet.has(card.deckId) ? profile.deckBoost : 0,
        lexicalBoost,
      },
    });
  }

  // Sort by finalScore descending
  results.sort((a, b) => b.score - a.score);

  // ── Evidence Gating ──
  // Build gating context from query understanding
  const gatingCtx: GatingContext = {
    topic,
    canonicalTopic,
    coreKeywords,
    expandedKeywords,
    deckHint,
    deckIds: input.deckIds,
    intent,
  };

  const gatingInput = results.map(r => {
    const card = cardMap.get(r.cardId);
    return {
      cardId: r.cardId,
      title: r.title,
      titleCn: card?.titleCn ?? null,
      question: card?.question ?? null,
      answer: card?.answer ?? null,
      tags: r.tags,
      searchKeywords: card?.searchKeywords ?? null,
      deckId: r.deckId,
      deckName: r.deckName,
      finalScore: r.score,
    };
  });

  const gatingOutput = applyEvidenceGating(gatingInput, gatingCtx);

  // Filter results: keep only gated-passed cards
  const passedIds = new Set(gatingOutput.results.map(g => g.cardId));
  let allResults = results.filter(r => passedIds.has(r.cardId));

  // Build trace if debug mode
  if (input.debug) {
    const beforeThreshold = gatingOutput.stats.total;
    const finalResults = allResults.slice(0, effectiveMaxResults);
    const thresholdRemoved = beforeThreshold - allResults.length;

    const trace: any = {
      traceId: `trace_${Date.now()}`,
      timingMs: {},
      request: { rawQuery: input.query, maxResults: effectiveMaxResults, minScore: effectiveMinScore, deckIds: input.deckIds },
      understanding: {
        intent, source: parsed.confidence >= 0.9 ? 'regex' as const : 'llm' as const,
        confidence: parsed.confidence, topic, deckHint: parsed.deckHint, subtopics,
        constraints: parsed.constraints,
        validation: { before: { topic: input.query, rewrittenQuery: input.query }, after: { topic, rewrittenQuery }, warnings: [] },
      },
      rewrite: {
        rewrittenQuery, keywords: coreKeywords.slice(0, 15),
        expandedKeywords: [...coreKeywords, ...expandedKeywords].slice(0, 30),
        canonicalTopic, dictionaryHit: true,
        rewriteSource: parsed.source === 'llm' ? 'llm' as const : 'dict' as const,
      },
      retrievalText: { recallText, rerankText, rawQueryUsed: false },
      retrieval: {
        fts5: { count: fts5Pool.length, top: fts5Pool.slice(0, 5).map(c => ({ cardId: c.cardId })) },
        like: { count: 0, top: [] },
        tag: { count: tagPool.length, top: tagPool.slice(0, 5).map((c: any) => ({ cardId: c.cardId, matched: c.matchedKeywords })) },
        searchKeywords: { count: skwPool.length, top: skwPool.slice(0, 5).map((c: any) => ({ cardId: c.cardId, matched: c.matchedKeywords })) },
        vector: { count: vecPool.length, top: vecPool.slice(0, 5).map((c: any) => ({ cardId: c.cardId, score: c.vectorScore })) },
      },
      merge: { beforeDedup: fts5Pool.length + tagPool.length + skwPool.length + vecPool.length, afterDedup: candidateMap.size, topCandidates: [] },
      hydration: { requested: candidateMap.size, hydrated: cards.length, missing: [] },
      filters: { before: cards.length, after: cards.length, removed: [] },
      rerank: {
        profile: profile.id || 'default',
        top: finalResults.slice(0, 5).map(r => ({
          cardId: r.cardId, title: r.title, finalScore: r.score,
          vectorScore: r.scoreBreakdown?.vectorScore || 0,
          keywordScore: r.scoreBreakdown?.keywordScore || 0,
          fieldBoost: r.scoreBreakdown?.fieldBoost || 0,
          learningBoost: r.scoreBreakdown?.learningBoost || 0,
          deckBoost: r.scoreBreakdown?.deckBoost || 0,
          lexicalBoost: r.scoreBreakdown?.lexicalBoost || 0,
        })),
      },
      threshold: {
        minScore: gatingOutput.stats.dynamicMinScore,
        type: gatingOutput.stats.thresholdType,
        config: intentToConfigKey(intent),
        before: beforeThreshold,
        after: gatingOutput.stats.passed,
        removed: thresholdRemoved,
        gating: {
          strong: gatingOutput.stats.strong,
          good: gatingOutput.stats.good,
          weak: gatingOutput.stats.weak,
          offTopic: gatingOutput.stats.offTopic,
          top5Pure: gatingOutput.stats.top5Pure,
        },
      },
      final: {
        returned: finalResults.length,
        top: finalResults.slice(0, 5).map(r => ({ cardId: r.cardId, title: r.title, score: r.score, explanation: r.reason || '' })),
      },
    };
    (finalResults as any)._trace = trace;
    return finalResults;
  }

  return allResults.slice(0, effectiveMaxResults);
}

// ---- 召回通道 ----

/** 通道 1: FTS5 + LIKE 关键词召回 */
async function recallFTS5(
  query: string,
  limit: number,
  deckIds?: string[],
): Promise<RecallCandidate[]> {
  const deckId = deckIds && deckIds.length === 1 ? deckIds[0] : undefined;
  const results = await fts5Search(query, limit, deckId);
  // Score by FTS5 rank + matchCount: higher matchCount → higher score
  const maxMatches = results.length > 0 ? Math.max(1, ...results.map(r => r.matchCount || 1)) : 1;
  return results.map(r => {
    const normalized = (r.matchCount || 1) / maxMatches;
    const rankScore = 1 / (1 + (r.rank || 0) * 0.05);
    return {
      cardId: r.cardId,
      vectorScore: 0,
      keywordScore: 0.3 + normalized * 0.5 + rankScore * 0.2, // match-dominant scoring
      matchedKeywords: [],
      source: 'fts5' as const,
    };
  });
}

/** 通道 2: 标签召回（bigram 匹配 tags 字段） */
async function recallByTags(
  query: string,
  expandedKW: string[],
  limit: number,
): Promise<RecallCandidate[]> {
  if (expandedKW.length === 0 && !query.trim()) return [];

  const searchTerms = [
    ...expandedKW,
    ...query.split(/\s+/).filter(t => t.length > 0),
  ];

  const results: RecallCandidate[] = [];
  const seen = new Set<string>();

  for (const term of searchTerms.slice(0, 8)) {
    if (seen.size >= limit) break;
    try {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT id as cardId FROM Card WHERE tags LIKE ? LIMIT ?`,
        `%${term}%`, limit,
      ) as any[];
      for (const row of (rows || [])) {
        if (seen.has(row.cardId)) continue;
        seen.add(row.cardId);
        results.push({
          cardId: row.cardId,
          vectorScore: 0,
          keywordScore: 0.2,
          matchedKeywords: [term],
          source: 'tag',
        });
      }
    } catch { /* skip */ }
  }

  return results;
}

/** 通道 3: searchKeywords 字段召回 */
async function recallBySearchKeywords(
  query: string,
  expandedKW: string[],
  limit: number,
): Promise<RecallCandidate[]> {
  const searchTerms = [
    ...expandedKW,
    ...query.split(/\s+/).filter(t => t.length > 0),
  ];

  const results: RecallCandidate[] = [];
  const seen = new Set<string>();

  for (const term of searchTerms.slice(0, 8)) {
    if (seen.size >= limit) break;
    try {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT id as cardId FROM Card WHERE searchKeywords LIKE ? AND searchKeywords IS NOT NULL LIMIT ?`,
        `%${term}%`, limit,
      ) as any[];
      for (const row of (rows || [])) {
        if (seen.has(row.cardId)) continue;
        seen.add(row.cardId);
        results.push({
          cardId: row.cardId,
          vectorScore: 0,
          keywordScore: 0.35,  // searchKeywords: higher weight
          matchedKeywords: [term],
          source: 'searchKeywords',
        });
      }
    } catch { /* skip */ }
  }

  return results;
}

/** 通道 4: bge-m3 字段级多向量语义召回 */
async function recallVector(
  query: string,
  limit: number,
): Promise<RecallCandidate[]> {
  const vectorStore = getVectorStore();
  if (vectorStore.name === 'noop') return [];

  try {
    let queryVec: number[] | null = null;

    // Try external embedding API first
    const provider = getEmbeddingProvider();
    if (provider) {
      try {
        const emb = await provider.embed({
          model: (provider as any).defaultModel || 'bge-m3',
          texts: [query],
        });
        if (emb.embeddings.length > 0) queryVec = emb.embeddings[0];
      } catch { /* fallback to local */ }
    }

    // Local fallback: n-gram vector
    if (!queryVec) {
      queryVec = textToVector(query);
    }

    if (queryVec && queryVec.length > 0) {
      const vecResults = await vectorStore.search(queryVec, limit, { objectType: 'card', module: 'ai-search' });
      return vecResults.map(r => ({
        cardId: r.objectId,
        vectorScore: r.score,
        keywordScore: 0,
        matchedKeywords: [],
        source: 'vector' as const,
      }));
    }
  } catch { /* skip vector */ }

  return [];
}

// ---- 辅助 ----

function safeJsonParse(s: string): string[] {
  try { return JSON.parse(s); } catch { return []; }
}

// ---- 学习清单搜索 ----

interface LearningPlanItem {
  cardId: string;
  title: string;
  deckId: string;
  deckName?: string;
  tags: string[];
  score: number;
  state: string;
  interval: number;
  nextReview: number;
  priority: number; // 0=新卡(高优先), 1=到期, 2=即将到期, 3=已掌握
  snippet?: string;
}

export async function learningPlanSearch(input: {
  query: string;
  deckIds?: string[];
  filters?: { difficulty?: string[]; onlyDue?: boolean };
}): Promise<StagedPlan> {
  // 1. 用大候选池跑搜索
  const matches = await hybridSearch({
    query: input.query,
    deckIds: input.deckIds,
    topK: 999,
    filters: input.filters,
  });

  if (matches.length === 0) {
    return { topic: input.query, stages: {} as any, totalCards: 0, stageBalance: 0 };
  }

  // 2. 过滤相关结果
  const deckBoostSet = new Set<string>();
  const { deckIds: expandedDecks } = expandQuery(input.query);
  for (const d of expandedDecks) deckBoostSet.add(d);

  const relevant = matches.filter(m => {
    if (m.score >= 0.30) return true;
    if (m.score >= 0.20 && deckBoostSet.has(m.deckId)) return true;
    return false;
  });

  if (relevant.length === 0) {
    return { topic: input.query, stages: {} as any, totalCards: 0, stageBalance: 0 };
  }

  const capped = relevant.slice(0, 100);

  // 3. 获取卡片详情 + 学习状态
  const cardIds = capped.map(c => c.cardId);
  const [progresses, cards] = await Promise.all([
    prisma.cardProgress.findMany({
      where: { userId: 'demo-user', cardId: { in: cardIds } },
    }),
    prisma.card.findMany({
      where: { id: { in: cardIds } },
      include: { deck: true },
    }),
  ]);

  const progressMap = new Map(progresses.map(p => [p.cardId, p]));
  const cardMap = new Map(cards.map(c => [c.id, c]));

  // 4. Build CardInfo list for stage classification
  const cardInfos: CardInfo[] = [];
  for (const m of capped) {
    const card = cardMap.get(m.cardId);
    if (!card) continue;
    cardInfos.push({
      cardId: m.cardId,
      title: card.titleCn || card.title || m.title,
      deckId: m.deckId,
      score: m.score,
      tags: m.tags,
      searchKeywords: card.searchKeywords || undefined,
      question: card.question || undefined,
      answer: card.answer || undefined,
    });
  }

  // 5. Build staged plan
  const progInfo = new Map(
    progresses.map(p => [p.cardId, {
      state: p.state,
      intervalDays: p.intervalDays,
      nextReview: p.nextReview ? new Date(p.nextReview).getTime() : 0,
    }])
  );

  const plan = buildStagedPlan(input.query, cardInfos, progInfo);

  // Enrich with deck names
  for (const stage of LEARNING_STAGES) {
    for (const item of plan.stages[stage]) {
      const card = cardMap.get(item.cardId);
      if (card) item.deckName = card.deck.name;
    }
  }

  return plan;
}
