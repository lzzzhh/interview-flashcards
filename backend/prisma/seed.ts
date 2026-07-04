// backend/prisma/seed.ts
// 从现有前端数据文件导入内置卡片到数据库

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 内置模块定义
const BUILTIN_DECKS = [
  { id: 'leetcode', name: '力扣', sortOrder: 1 },
  { id: 'statistics', name: '统计学', sortOrder: 2 },
  { id: 'machine-learning', name: '机器学习', sortOrder: 3 },
  { id: 'deep-learning', name: '深度学习', sortOrder: 4 },
  { id: 'llm', name: '大模型', sortOrder: 5 },
  { id: 'agent', name: 'Agent', sortOrder: 6 },
  { id: 'jargon', name: '黑话', sortOrder: 7 },
  { id: 'workplace', name: '职场', sortOrder: 8 },
  { id: 'vibe-coding', name: 'Vibe Coding', sortOrder: 9 },
  { id: 'java', name: 'Java 面试', sortOrder: 10 },
];

// 直接从前端数据文件构建的卡片数据
// eslint-disable-next-line @typescript-eslint/no-require-imports
const leetcodeCards = require('../../src/data/leetcode-hot100');
const statsCards = require('../../src/data/statistics');
const mlCards = require('../../src/data/machine-learning');
const dlCards = require('../../src/data/deep-learning');
const llmCards = require('../../src/data/llm');
const agentCards = require('../../src/data/agent');
const jargonCards = require('../../src/data/jargon');
const workplaceCards = require('../../src/data/workplace');
const vibeCards = require('../../src/data/vibe-coding');

interface CardInput {
  id: string;
  category?: string;
  number?: number;
  title?: string;
  titleCn?: string;
  question?: string;
  answer?: string;
  description?: string;
  approach?: string;
  difficulty?: string;
  tags?: string[];
  subTopic?: string;
  source?: string;
  codes?: Record<string, string>;
}

const CARD_MAP: Record<string, CardInput[]> = {
  leetcode: leetcodeCards.leetcodeHot100 || [],
  statistics: statsCards.statisticsCards || [],
  'machine-learning': mlCards.machineLearningCards || [],
  'deep-learning': dlCards.deepLearningCards || [],
  llm: llmCards.llmCards || [],
  agent: agentCards.agentCards || [],
  jargon: jargonCards.jargonCards || [],
  workplace: workplaceCards.workplaceCards || [],
  'vibe-coding': vibeCards.vibeCodingCards || [],
  java: [],
};

async function main() {
  console.log('🌱 Seeding database...');

  // Upsert decks
  for (const deck of BUILTIN_DECKS) {
    await prisma.deck.upsert({
      where: { id: deck.id },
      update: { name: deck.name, sortOrder: deck.sortOrder },
      create: { id: deck.id, name: deck.name, type: 'builtin', sortOrder: deck.sortOrder },
    });
    console.log(`  Deck: ${deck.id}`);
  }

  // Upsert cards
  let totalCards = 0;
  for (const [deckId, cards] of Object.entries(CARD_MAP)) {
    if (!Array.isArray(cards)) continue;
    const incomingIds = new Set(cards.map((card) => card.id).filter(Boolean));
    const existingCards = await prisma.card.findMany({ where: { deckId }, select: { id: true } });
    const deletedIds = existingCards.map((card) => card.id).filter((id) => !incomingIds.has(id));
    if (deletedIds.length > 0) {
      await prisma.reviewLog.deleteMany({ where: { cardId: { in: deletedIds } } });
      await prisma.cardProgress.deleteMany({ where: { cardId: { in: deletedIds } } });
      await prisma.card.deleteMany({ where: { id: { in: deletedIds } } });
      console.log(`  Removed ${deletedIds.length} stale cards from ${deckId}`);
    }

    for (const card of cards) {
      await prisma.card.upsert({
        where: { id: card.id },
        update: {
          deckId,
          type: deckId === 'leetcode' ? 'leetcode' : 'qa',
          number: card.number || null,
          title: card.title || null,
          titleCn: card.titleCn || null,
          question: card.question || null,
          answer: card.answer || null,
          description: card.description || null,
          approach: card.approach || null,
          difficulty: card.difficulty || null,
          tags: card.tags ? JSON.stringify(card.tags) : null,
          subTopic: card.subTopic || null,
          source: card.source || null,
          codes: card.codes ? JSON.stringify(card.codes) : null,
        },
        create: {
          id: card.id,
          deckId,
          type: deckId === 'leetcode' ? 'leetcode' : 'qa',
          number: card.number || null,
          title: card.title || null,
          titleCn: card.titleCn || null,
          question: card.question || null,
          answer: card.answer || null,
          description: card.description || null,
          approach: card.approach || null,
          difficulty: card.difficulty || null,
          tags: card.tags ? JSON.stringify(card.tags) : null,
          subTopic: card.subTopic || null,
          source: card.source || null,
          codes: card.codes ? JSON.stringify(card.codes) : null,
        },
      });
      totalCards++;
    }
  }

  console.log(`✅ Seeded ${totalCards} cards across ${BUILTIN_DECKS.length} decks`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
