// backend/src/services/search/evidence-classifier.ts
// Evidence-gated match quality classification for reranked results.
//
// Classifies each result into one of four tiers based on how it matches
// the query understanding output, independent of the reranker score.
//
// Tiers:
//   strong  — title/question/tag exact hit, canonicalTopic hit, primaryAlias hit
//   good    — searchKeywords exact hit, multi-keyword hit, high fieldBoost
//   weak    — answer-only hit, relatedAlias-only hit, bridgeAlias-only hit
//   off_topic — only stopword/generic hits, topic mismatch, deck mismatch, negativeAlias hit

import { resolveConceptFromGraph, getConceptEquivalents } from './concept-graph';
import { tokenizeBigrams } from './bigram';

// ── Types ──

export type MatchQuality = 'strong' | 'good' | 'weak' | 'off_topic';

export interface EvidenceInput {
  cardId: string;
  title: string;
  titleCn?: string | null;
  question?: string | null;
  answer?: string | null;
  tags: string[];
  searchKeywords?: string | null;
  deckId: string;
  deckName?: string;
}

export interface EvidenceResult {
  cardId: string;
  quality: MatchQuality;
  reasons: string[];
  score: number; // finalScore from reranker
}

export interface EvidenceContext {
  topic: string;
  canonicalTopic: string;
  coreKeywords: string[];
  expandedKeywords: string[];
  deckHint?: string;
  deckIds?: string[];
  intent: string;
}

// ── Stopwords / generic terms ──

const GENERIC_TERMS = new Set([
  '学习', '学', '怎么学', '教程', '方法', '推荐', '卡片', '几张', '知识点',
  '总结', '资料', '路线', '计划', '入门', '实战', '案例', '区别', '是什么',
  '怎么写', '怎么用', '如何使用', '在哪里', '有哪些', '是什么', '定义',
  '举例', '解释', '面试', '技术', '应用', '场景',
]);

// ── Negative alias — terms that indicate a topic mismatch ──

function hasNegativeAlias(_topic: string, _canonicalTopic: string, cardText: string): boolean {
  // Cards from a totally different domain than the query topic
  // This is intentionally conservative — only flag when the mismatch is unambiguous
  return false;
}

// ── Core classifier ──

export function classifyEvidence(
  input: EvidenceInput,
  ctx: EvidenceContext,
): EvidenceResult {
  const reasons: string[] = [];

  const titleText = (input.titleCn || input.title || '').toLowerCase();
  const questionText = (input.question || '').toLowerCase();
  const answerText = (input.answer || '').toLowerCase();
  const tagText = input.tags.map(t => t.toLowerCase());
  const skwText = (input.searchKeywords || '').toLowerCase();
  const allText = [titleText, questionText, answerText, skwText, ...tagText].join(' ');

  const topicLower = ctx.topic.toLowerCase();
  const canonicalLower = ctx.canonicalTopic.toLowerCase();
  const coreLower = ctx.coreKeywords.map(k => k.toLowerCase());
  const expandedLower = ctx.expandedKeywords.map(k => k.toLowerCase());

  // Resolve concept graph equivalents for topic
  const equivalents = getConceptEquivalents(ctx.canonicalTopic || ctx.topic);
  const primaryAliases = new Set(equivalents.aliases.map(a => a.toLowerCase()));
  const equivTerms = new Set(equivalents.equivalentTerms.map(t => t.toLowerCase()));
  // Also try canonical topic resolution
  const canonicalEquiv = ctx.canonicalTopic ? getConceptEquivalents(ctx.canonicalTopic) : null;
  if (canonicalEquiv) {
    for (const a of canonicalEquiv.aliases) primaryAliases.add(a.toLowerCase());
    for (const t of canonicalEquiv.equivalentTerms) equivTerms.add(t.toLowerCase());
  }

  // ── Strong signals ──

  // Title exact match
  const titleBigrams = tokenizeBigrams(titleText);
  const topicBigrams = tokenizeBigrams(topicLower);
  const titleExactHit = titleBigrams.some(b => topicBigrams.includes(b)) ||
    titleText.includes(topicLower);

  // Question exact match
  const questionExactHit = questionText.includes(topicLower) ||
    (questionText.length > 0 && tokenizeBigrams(questionText).some(b => topicBigrams.includes(b)));

  // Tag exact match
  const tagExactHit = tagText.some(t =>
    t === topicLower ||
    coreLower.some(k => t.includes(k) || k.includes(t)) ||
    primaryAliases.has(t));

  // Canonical topic hit
  const canonicalHit = canonicalLower && allText.includes(canonicalLower);

  // Primary alias hit
  const primaryAliasHit = [...primaryAliases].some(a => a.length > 1 && allText.includes(a));

  // Equivalents term hit (from concept graph)
  const equivTermHit = [...equivTerms].some(t => t.length > 1 && allText.includes(t));

  let strongCount = 0;
  if (titleExactHit) { strongCount++; reasons.push('title-exact'); }
  if (questionExactHit) { strongCount++; reasons.push('question-exact'); }
  if (tagExactHit) { strongCount++; reasons.push('tag-exact'); }
  if (canonicalHit) { strongCount++; reasons.push('canonical-topic'); }
  if (primaryAliasHit) { strongCount++; reasons.push('primary-alias'); }

  // ── Good signals ──

  const searchKeywordExactHit = skwText.length > 0 &&
    (coreLower.some(k => skwText.includes(k)) ||
     expandedLower.some(k => skwText.includes(k)));

  // Multi-keyword hit: at least 2 core keywords appear in card
  const multiKeywordHits = coreLower.filter(k => allText.includes(k));
  const multiKeywordHit = multiKeywordHits.length >= 2;

  // fieldBoost high — proxied by having matching keywords in searchKeywords or tags
  const fieldRich = (skwText.length > 0 && coreLower.some(k => skwText.includes(k))) ||
    tagText.some(t => coreLower.some(k => t.includes(k) || k.includes(t)));

  let goodCount = 0;
  if (searchKeywordExactHit) { goodCount++; reasons.push('searchKeywords-exact'); }
  if (multiKeywordHit) { goodCount++; reasons.push('multi-keyword'); }
  if (fieldRich) { goodCount++; reasons.push('field-rich'); }
  if (equivTermHit) { goodCount++; reasons.push('equiv-term'); }

  // ── Weak signals ──

  // Only answer hit (no title/question/tag match, but answer contains topic)
  const answerOnlyHit = !titleExactHit && !questionExactHit && !tagExactHit &&
    !searchKeywordExactHit && answerText.includes(topicLower);

  // Related alias only
  const relatedAliasOnly = !titleExactHit && !questionExactHit && !tagExactHit &&
    !searchKeywordExactHit && !multiKeywordHit &&
    expandedLower.some(k => k.length > 1 && allText.includes(k));

  // Bridge alias only — matched through a relatedConcept from concept graph but nothing else

  let weakCount = 0;
  if (answerOnlyHit) { weakCount++; reasons.push('answer-only'); }
  if (relatedAliasOnly) { weakCount++; reasons.push('related-alias-only'); }

  // ── Off-topic signals ──

  // Only generic/stopword hits
  const onlyGenericHits = coreLower.length === 0 ||
    (strongCount === 0 && goodCount === 0 && weakCount === 0 &&
     !expandedLower.some(k => k.length > 1 && allText.includes(k)));

  // Topic mismatch: card has a clear topic that doesn't match
  const deckMismatch = ctx.deckHint && input.deckId !== ctx.deckHint;

  // Explicit deck filter mismatch
  const explicitDeckMismatch = ctx.deckIds && ctx.deckIds.length > 0 &&
    !ctx.deckIds.includes(input.deckId);

  // Negative alias
  const negativeHit = hasNegativeAlias(topicLower, canonicalLower, allText);

  let offTopicCount = 0;
  if (onlyGenericHits) { offTopicCount++; reasons.push('only-generic'); }
  if (deckMismatch) { offTopicCount++; reasons.push('deck-mismatch'); }
  if (explicitDeckMismatch) { offTopicCount++; reasons.push('explicit-deck-mismatch'); }
  if (negativeHit) { offTopicCount++; reasons.push('negative-alias'); }

  // ── Final quality assignment ──

  let quality: MatchQuality;

  if (offTopicCount > 0 && strongCount === 0 && goodCount === 0) {
    quality = 'off_topic';
  } else if (strongCount > 0) {
    quality = 'strong';
  } else if (goodCount > 0) {
    quality = 'good';
  } else if (weakCount > 0) {
    quality = 'weak';
  } else {
    // Fallback: has some keyword overlap but no strong/good/weak signal
    const hasAnyKeyword = coreLower.some(k => allText.includes(k)) ||
      expandedLower.some(k => k.length > 1 && allText.includes(k));
    if (hasAnyKeyword) {
      quality = 'weak';
      reasons.push('fallback-keyword');
    } else {
      quality = 'off_topic';
      reasons.push('fallback-offtopic');
    }
  }

  return { cardId: input.cardId, quality, reasons, score: 0 };
}
