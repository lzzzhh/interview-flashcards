// Migration: import all built-in card data into SQLite Card table
// Run from project root: npx tsx backend/src/scripts/migrate-cards-to-sqlite.ts

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL || 'file:./backend/data/flashcards.db' } } });

async function migrate() {
  const existing = await prisma.card.count();
  if (existing > 0) {
    console.log(`Already have ${existing} cards. Skipping.`);
    return;
  }

  // Dynamic imports — frontend data files
  const [
    { leetcodeHot100 },
    { statisticsCards },
    { machineLearningCards },
    { deepLearningCards },
    { llmCards },
    { agentCards },
    { jargonCards },
    { workplaceCards },
    { vibeCodingCards },
  ] = await Promise.all([
    import('../../../src/data/leetcode-hot100'),
    import('../../../src/data/statistics'),
    import('../../../src/data/machine-learning'),
    import('../../../src/data/deep-learning'),
    import('../../../src/data/llm'),
    import('../../../src/data/agent'),
    import('../../../src/data/jargon'),
    import('../../../src/data/workplace'),
    import('../../../src/data/vibe-coding'),
  ]);

  const CARD_MAP: Record<string, any[]> = {
    leetcode: leetcodeHot100,
    statistics: statisticsCards,
    'machine-learning': machineLearningCards,
    'deep-learning': deepLearningCards,
    llm: llmCards,
    agent: agentCards,
    jargon: jargonCards,
    workplace: workplaceCards,
    'vibe-coding': vibeCodingCards,
  };

  let imported = 0;
  for (const [deckId, cards] of Object.entries(CARD_MAP)) {
    await prisma.deck.upsert({
      where: { id: deckId },
      create: { id: deckId, name: deckId, type: 'builtin', sortOrder: Object.keys(CARD_MAP).indexOf(deckId) + 1 },
      update: {},
    });

    for (const card of cards) {
      try {
        const tags = Array.isArray(card.tags) ? card.tags : [];
        const skw = Array.isArray(card.searchKeywords) ? card.searchKeywords : (Array.isArray(card.keywords) ? card.keywords : []);
        await prisma.card.create({
          data: {
            id: card.id,
            deckId,
            type: 'qa',
            question: card.question || card.title || card.titleCn || '',
            answer: card.answer || card.description || card.approach || '',
            title: card.title || card.titleCn || card.question || '',
            titleCn: card.titleCn || null,
            tags: JSON.stringify(tags),
            searchKeywords: JSON.stringify(skw),
            difficulty: card.difficulty || 'medium',
            source: 'builtin',
            subTopic: card.subTopic || null,
          },
        });
        imported++;
      } catch (e: any) {
        console.warn(`  Skip ${card.id}: ${e.message?.slice(0,80)}`);
      }
    }
    console.log(`  ${deckId}: ${Math.min(cards.length, cards.length)} cards`);
  }

  console.log(`\nMigrated ${imported} cards total.`);
  // Rebuild FTS5
  try {
    await prisma.$executeRawUnsafe(`INSERT INTO card_fts(card_fts) VALUES('rebuild')`);
    console.log('FTS5 index rebuilt.');
  } catch {}
}

migrate().then(() => prisma.$disconnect()).catch(e => { console.error(e); process.exit(1); });
