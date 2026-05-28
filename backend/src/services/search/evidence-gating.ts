// backend/src/services/search/evidence-gating.ts
// Evidence-gated filtering pipeline.
//
// Layer sits AFTER reranker, BEFORE final output assembly.
// Uses evidence classification + intent-specific gating config
// to decide which results pass the quality bar.
//
// Pipeline:
//   1. Classify every reranked card as strong/good/weak/off_topic
//   2. Compute dynamic minScore = max(baseMinScore, topScore * topScoreRatio)
//   3. Filter by evidence tier:
//      - off_topic: always removed
//      - weak: accepted only when strong+good < minStrongGoodBeforeWeak (fallback)
//        or when below maxWeakInTop5/maxWeakInTop15 limits
//      - strong/good: always accepted above dynamic minScore
//   4. Enforce Top5 purity: top 5 must all be strong/good
//   5. Return filtered list

import {
  classifyEvidence,
  type EvidenceInput,
  type EvidenceContext,
  type EvidenceResult,
} from './evidence-classifier';
import {
  getGatingConfig,
  intentToConfigKey,
  type IntentGatingConfig,
} from './gating-config';

// ── Types ──

export interface GatedCardInput {
  cardId: string;
  title: string;
  titleCn?: string | null;
  question?: string | null;
  answer?: string | null;
  tags: string[];
  searchKeywords?: string | null;
  deckId: string;
  deckName?: string;
  finalScore: number;
}

export interface GatedResult {
  cardId: string;
  score: number;
  quality: 'strong' | 'good' | 'weak' | 'off_topic';
  reasons: string[];
  passed: boolean;
}

export interface GatingOutput {
  results: GatedResult[];
  stats: {
    total: number;
    passed: number;
    strong: number;
    good: number;
    weak: number;
    offTopic: number;
    dynamicMinScore: number;
    top5Pure: boolean;
    thresholdType: 'base' | 'ratio';
  };
  /** CardIds that were filtered out */
  removed: string[];
}

export interface GatingContext {
  topic: string;
  canonicalTopic: string;
  coreKeywords: string[];
  expandedKeywords: string[];
  deckHint?: string;
  deckIds?: string[];
  intent: string;
}

// ── Pipeline ──

export function applyEvidenceGating(
  cards: GatedCardInput[],
  ctx: GatingContext,
): GatingOutput {
  if (cards.length === 0) {
    return {
      results: [],
      stats: { total: 0, passed: 0, strong: 0, good: 0, weak: 0, offTopic: 0, dynamicMinScore: 0, top5Pure: true, thresholdType: 'base' },
      removed: [],
    };
  }

  // Step 1: Get gating config for this intent
  const configKey = intentToConfigKey(ctx.intent);
  const config = getGatingConfig()[configKey];

  // Step 2: Compute dynamic minScore
  const topScore = cards[0]?.finalScore ?? 0;
  const ratioThreshold = topScore * config.topScoreRatio;
  const dynamicMinScore = Math.max(config.baseMinScore, topScore * config.topScoreRatio);
  const thresholdType: 'base' | 'ratio' = dynamicMinScore === config.baseMinScore ? 'base' : 'ratio';

  // Step 3: Classify every card
  const evidenceCtx: EvidenceContext = {
    topic: ctx.topic,
    canonicalTopic: ctx.canonicalTopic,
    coreKeywords: ctx.coreKeywords,
    expandedKeywords: ctx.expandedKeywords,
    deckHint: ctx.deckHint,
    deckIds: ctx.deckIds,
    intent: ctx.intent,
  };

  const classified: EvidenceResult[] = cards.map(c => {
    const input: EvidenceInput = {
      cardId: c.cardId,
      title: c.title,
      titleCn: c.titleCn,
      question: c.question,
      answer: c.answer,
      tags: c.tags,
      searchKeywords: c.searchKeywords,
      deckId: c.deckId,
      deckName: c.deckName,
    };
    return classifyEvidence(input, evidenceCtx);
  });

  // Step 4: Split by tier
  const strongGood: EvidenceResult[] = [];
  const weak: EvidenceResult[] = [];
  const offTopic: EvidenceResult[] = [];

  for (const c of classified) {
    switch (c.quality) {
      case 'strong':
      case 'good':
        strongGood.push(c);
        break;
      case 'weak':
        weak.push(c);
        break;
      case 'off_topic':
        offTopic.push(c);
        break;
    }
  }

  // Step 5: Apply gating rules
  const scoreMap = new Map(cards.map(c => [c.cardId, c.finalScore]));
  const passed: GatedResult[] = [];
  const removedCardIds: string[] = [];

  // 5a. strong/good: pass if above dynamic minScore
  for (const c of strongGood) {
    const score = scoreMap.get(c.cardId) ?? 0;
    if (score >= dynamicMinScore) {
      passed.push({ cardId: c.cardId, score, quality: c.quality, reasons: c.reasons, passed: true });
    } else {
      removedCardIds.push(c.cardId);
    }
  }

  // 5b. weak: pass ONLY if strong+good < minStrongGoodBeforeWeak (fallback mode)
  const strongGoodPassed = passed.filter(r => r.quality === 'strong' || r.quality === 'good').length;
  const needWeakFallback = strongGoodPassed < config.minStrongGoodBeforeWeak;

  if (needWeakFallback && config.allowWeakFallback) {
    // Fallback: allow weak cards to fill in, respecting score threshold
    const weakAboveThreshold = weak.filter(c => {
      const score = scoreMap.get(c.cardId) ?? 0;
      return score >= dynamicMinScore;
    });

    // Sort weak by score desc
    weakAboveThreshold.sort((a, b) => (scoreMap.get(b.cardId) ?? 0) - (scoreMap.get(a.cardId) ?? 0));

    for (const c of weakAboveThreshold) {
      const score = scoreMap.get(c.cardId) ?? 0;
      passed.push({ cardId: c.cardId, score, quality: c.quality, reasons: c.reasons, passed: true });
    }
  } else if (!needWeakFallback) {
    // Strong+good are sufficient: only allow weak cards within maxWeak limits
    // Sort weak by score desc
    weak.sort((a, b) => (scoreMap.get(b.cardId) ?? 0) - (scoreMap.get(a.cardId) ?? 0));

    // First, sort all passed by score desc so we can enforce Top5 purity
    passed.sort((a, b) => b.score - a.score);

    // Count weak cards that would be in top 5
    const top5WeakCount = passed.slice(0, 5).filter(r => r.quality === 'weak').length;
    const weakSlotsTop5 = Math.max(0, config.maxWeakInTop5 - top5WeakCount);

    let weakAdded = 0;
    for (const c of weak) {
      const score = scoreMap.get(c.cardId) ?? 0;
      if (score < dynamicMinScore) {
        removedCardIds.push(c.cardId);
        continue;
      }

      // Check maxWeakInTop5/top15 limits
      const projectedIndex = passed.length + weakAdded;
      if (projectedIndex < 5 && weakSlotsTop5 <= 0) {
        removedCardIds.push(c.cardId);
        continue;
      }
      if (projectedIndex < 15 && weakAdded >= config.maxWeakInTop15) {
        removedCardIds.push(c.cardId);
        continue;
      }

      passed.push({ cardId: c.cardId, score, quality: c.quality, reasons: c.reasons, passed: true });
      weakAdded++;
    }
  } else {
    // Fallback disabled for weak
    for (const c of weak) {
      removedCardIds.push(c.cardId);
    }
  }

  // Step 6: off_topic — always removed
  for (const c of offTopic) {
    removedCardIds.push(c.cardId);
  }

  // Step 7: Sort by score desc and enforce Top5 purity
  passed.sort((a, b) => b.score - a.score);

  // Top5 purity: if any weak card is in top 5, move it down after last strong/good in top 5
  const top5HasWeak = passed.slice(0, 5).some(r => r.quality === 'weak');
  if (top5HasWeak) {
    const strongGoodTop5: GatedResult[] = [];
    const weakTop5: GatedResult[] = [];
    const rest: GatedResult[] = [];

    for (let i = 0; i < passed.length; i++) {
      if (i < 5) {
        if (passed[i].quality === 'weak') {
          weakTop5.push(passed[i]);
        } else {
          strongGoodTop5.push(passed[i]);
        }
      } else {
        rest.push(passed[i]);
      }
    }

    // Reconstruct: strongGoodTop5 first, then fill remaining top5 slots from rest
    const remainingSlots = 5 - strongGoodTop5.length;
    const fillFromRest = rest.slice(0, remainingSlots);

    // Rebuild: strongGoodTop5 + fillFromRest + weakTop5 + remaining rest
    passed.length = 0;
    passed.push(...strongGoodTop5);
    passed.push(...fillFromRest);
    passed.push(...weakTop5);
    passed.push(...rest.slice(remainingSlots));
  }

  const top5Pure = !passed.slice(0, 5).some(r => r.quality === 'weak');

  // Step 8: Stats
  const finalStrong = passed.filter(r => r.quality === 'strong').length;
  const finalGood = passed.filter(r => r.quality === 'good').length;
  const finalWeak = passed.filter(r => r.quality === 'weak').length;

  return {
    results: passed,
    stats: {
      total: cards.length,
      passed: passed.length,
      strong: finalStrong,
      good: finalGood,
      weak: finalWeak,
      offTopic: offTopic.length,
      dynamicMinScore,
      top5Pure,
      thresholdType,
    },
    removed: removedCardIds,
  };
}
