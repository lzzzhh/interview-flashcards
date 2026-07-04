// backend/src/services/search/study-concept-graph.ts
// P7: 5-stage learning plan — concept → staged card recommendations

// ── Stage Definitions ──

export const LEARNING_STAGES = [
  '基础入门',
  '核心方法',
  '对比选择',
  '面试考点',
  '复习练习',
] as const;

export type LearningStage = typeof LEARNING_STAGES[number];

interface StageRule {
  stage: LearningStage;
  /** Title/concept keywords that indicate this stage */
  patterns: RegExp[];
  /** Min cards to return per stage */
  minCards: number;
  /** Max cards to return per stage */
  maxCards: number;
}

const STAGE_RULES: StageRule[] = [
  {
    stage: '基础入门',
    patterns: [
      /入门|基础|概述|介绍|什么是|定义|概念|初学|新手|简介|理解|认识|了解/i,
      /fundamental|introduction|basics|overview|beginner|getting.?started/i,
    ],
    minCards: 5,
    maxCards: 10,
  },
  {
    stage: '核心方法',
    patterns: [
      /核心|主要|关键|算法|方法|原理|机制|实现|技术|模型|架构|流程|推导|公式|计算/i,
      /core|algorithm|method|principle|mechanism|implementation|technique|architecture/i,
    ],
    minCards: 5,
    maxCards: 12,
  },
  {
    stage: '对比选择',
    patterns: [
      /对比|区别|比较|vs|选择|优劣|适用|场景|差异|不同|优缺点|对比分析|对比总结|选型/i,
      /comparison|difference|vs|trade.?off|pros.?cons|advantage|disadvantage|choose|selection/i,
    ],
    minCards: 3,
    maxCards: 8,
  },
  {
    stage: '面试考点',
    patterns: [
      /面试|常见|考点|总结|必考|经典|重点|考察|要点|高频|常考|核心概念|面试题/i,
      /interview|common|summary|frequent|key.?point|essential|classic/i,
    ],
    minCards: 3,
    maxCards: 10,
  },
  {
    stage: '复习练习',
    patterns: [
      /复习|回顾|刷题|练习|巩固|整理|清单|总结|备忘|速查|手册|题目|习题/i,
      /review|practice|exercise|problem|quiz|cheat.?sheet|checklist|recap/i,
    ],
    minCards: 3,
    maxCards: 10,
  },
];

// ── Stage Classification ──

export interface CardInfo {
  cardId: string;
  title: string;
  deckId: string;
  score: number;
  tags: string[];
  searchKeywords?: string;
  question?: string;
  answer?: string;
}

/**
 * Classify a card into a learning stage based on its content.
 * Returns the best-matching stage and a confidence score.
 */
export function classifyCard(card: CardInfo): { stage: LearningStage; confidence: number } {
  const text = [
    card.title || '',
    card.searchKeywords || '',
    card.question || '',
    card.answer || '',
    card.tags.join(' '),
  ].join(' ').toLowerCase();

  let bestStage: LearningStage = '核心方法'; // default
  let bestScore = 0;

  for (const rule of STAGE_RULES) {
    let matches = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) matches++;
    }
    const score = matches / Math.max(1, rule.patterns.length);
    if (score > bestScore) {
      bestScore = score;
      bestStage = rule.stage;
    }
  }

  return { stage: bestStage, confidence: bestScore };
}

// ── Staged Plan Builder ──

export interface StagedPlanItem {
  cardId: string;
  title: string;
  deckId: string;
  deckName?: string;
  score: number;
  stage: LearningStage;
  stageIndex: number;
  snippet: string;
  state: string;
  priority: number;
}

export interface StagedPlan {
  topic: string;
  stages: Record<LearningStage, StagedPlanItem[]>;
  totalCards: number;
  stageBalance: number;  // 0-1, higher = more balanced
}

/**
 * Organize search results into a 5-stage learning plan.
 * Each stage gets 3-5 cards, with stage-appropriate filtering.
 */
export function buildStagedPlan(
  topic: string,
  cards: CardInfo[],
  progressMap: Map<string, { state: string; intervalDays: number; nextReview: number }>,
): StagedPlan {
  const now = Date.now();
  const stages: Record<string, StagedPlanItem[]> = {};
  for (const s of LEARNING_STAGES) stages[s] = [];

  // Classify each card
  for (const card of cards) {
    const { stage } = classifyCard(card);
    const prog = progressMap.get(card.cardId);
    const state = prog?.state || 'new';
    const nextReview = prog?.nextReview || 0;

    let priority: number;
    if (state === 'new') priority = 0;
    else if (['learning', 'review', 'relearning'].includes(state) && nextReview <= now) priority = 1;
    else if (['learning', 'review', 'relearning'].includes(state) && nextReview <= now + 3 * 86400000) priority = 2;
    else priority = 3;

    stages[stage].push({
      cardId: card.cardId,
      title: card.title,
      deckId: card.deckId,
      score: card.score,
      stage,
      stageIndex: LEARNING_STAGES.indexOf(stage),
      snippet: (card.question || card.answer || '').slice(0, 100),
      state,
      priority,
    });
  }

  // Sort within each stage: priority asc, then score desc
  for (const s of LEARNING_STAGES) {
    stages[s].sort((a, b) => a.priority - b.priority || b.score - a.score);
  }

  // Cap each stage to maxCards
  const capped: Record<LearningStage, StagedPlanItem[]> = {} as any;
  let total = 0;
  for (const rule of STAGE_RULES) {
    const stageCards = stages[rule.stage].slice(0, rule.maxCards);
    capped[rule.stage] = stageCards;
    total += stageCards.length;
  }

  // Stage balance: entropy over stage distribution
  const counts = LEARNING_STAGES.map(s => capped[s].length);
  const sum = counts.reduce((a, b) => a + b, 0);
  const balance = sum > 0
    ? 1 - counts.reduce((s, c) => s + (c / sum) * Math.log2(Math.max(c / sum, 0.01)), 0) / Math.log2(5)
    : 0;

  return {
    topic,
    stages: capped,
    totalCards: total,
    stageBalance: balance,
  };
}
