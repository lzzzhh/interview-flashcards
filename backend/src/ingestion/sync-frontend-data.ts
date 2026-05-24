// Sync frontend data files from DB
import { writeFileSync, readFileSync } from 'fs';
import prisma from '../db/prisma';

const DECK_MAP: Record<string, { file: string; varName: string }> = {
  'machine-learning': { file: 'src/data/machine-learning.ts', varName: 'machineLearningCards' },
  'deep-learning': { file: 'src/data/deep-learning.ts', varName: 'deepLearningCards' },
  'statistics': { file: 'src/data/statistics.ts', varName: 'statisticsCards' },
  'leetcode': { file: 'src/data/leetcode-hot100.ts', varName: 'leetcodeHot100' },
  'agent': { file: 'src/data/agent.ts', varName: 'agentCards' },
  'llm': { file: 'src/data/llm.ts', varName: 'llmCards' },
  'workplace': { file: 'src/data/workplace.ts', varName: 'workplaceCards' },
  'jargon': { file: 'src/data/jargon.ts', varName: 'jargonCards' },
  'vibe-coding': { file: 'src/data/vibe-coding.ts', varName: 'vibeCodingCards' },
};

const PROJECT = '/Users/zhanhuilin/Desktop/interview-flashcards/';

async function main() {
  const cards = await prisma.card.findMany({
    where: { OR: [{ deckId: { in: Object.keys(DECK_MAP) } }] },
    select: {
      id: true, deckId: true, titleCn: true, title: true,
      question: true, answer: true, tags: true, subTopic: true,
      difficulty: true, description: true,
    },
  });

  // Group by deck
  const byDeck = new Map<string, typeof cards>();
  for (const c of cards) {
    const list = byDeck.get(c.deckId) || [];
    list.push(c);
    byDeck.set(c.deckId, list);
  }

  for (const [deckId, deckCards] of byDeck) {
    const cfg = DECK_MAP[deckId];
    if (!cfg || deckId === 'leetcode') continue; // skip leetcode — different card sets

    // Count existing cards in file (normalize leetcode IDs: lc-001 vs lc-1)
    const filePath = PROJECT + cfg.file;
    const existing = readFileSync(filePath, 'utf-8');
    const normalizedExisting = existing.replace(/id:\s*'(lc-)(\d+)'/g, (_m, prefix, num) => `id: '${prefix}${String(Number(num)).padStart(3, '0')}'`);
    const newCards = deckCards.filter(c => {
      const normId = c.id.replace(/^(lc-)(\d+)$/, (_m: string, prefix: string, num: string) => `${prefix}${String(Number(num)).padStart(3, '0')}`);
      return !normalizedExisting.includes(`id: '${normId}'`);
    });

    console.log(`${deckId}: DB has ${deckCards.length}, new: ${newCards.length}`);
    if (newCards.length > 0 && deckId === 'leetcode') {
      console.log('  Sample new IDs:', newCards.slice(0,3).map((c: any) => c.id));
    }

    if (newCards.length === 0) continue;

    // Generate card entries
    const entries = newCards.map(c => {
      const tags = (() => {
        try { const t = JSON.parse(c.tags || '[]'); return Array.isArray(t) ? t : []; }
        catch { return (c.tags || '').split(',').map(s => s.trim()).filter(Boolean); }
      })();
      const titleCn = c.titleCn || '';
      const title = c.title || '';
      const diffNum = parseInt(c.difficulty || '3') || 3;
      const difficultyMap: Record<number, string> = { 1: "'easy'", 2: "'easy'", 3: "'medium'", 4: "'hard'", 5: "'hard'" };
      const diffStr = difficultyMap[diffNum] || "'medium'";

      return `  {
    id: '${c.id}',
    category: '${deckId}',
    question: ${JSON.stringify(c.question || titleCn || title)},
    answer: ${JSON.stringify(c.answer || '')},
    sm2: { state: 'new', easeFactor: 2.5, interval: 0, repetitions: 0, lapses: 0, nextReview: now },
    tags: ${JSON.stringify(tags)},
    ${c.subTopic ? `subTopic: ${JSON.stringify(c.subTopic)},` : ''}
    difficulty: ${diffStr},
    favorited: false,
  }`;
    });

    // Insert new cards before the closing `];` in the export
    const insertAt = existing.lastIndexOf('];');
    if (insertAt < 0) {
      console.log(`  WARN: cannot find ]; in ${cfg.file}`);
      continue;
    }

    const prefix = existing.slice(0, insertAt);
    const suffix = existing.slice(insertAt);
    const newContent = (prefix.trimEnd() + '\n' + entries.join(',\n') + '\n' + suffix).trimEnd() + '\n';

    writeFileSync(filePath, newContent);
    console.log(`  Added ${newCards.length} cards to ${cfg.file}`);
  }

  await prisma.$disconnect();
  console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); });
