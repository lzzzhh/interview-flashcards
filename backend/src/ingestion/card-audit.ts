import prisma from '../db/prisma';

interface CardIssue {
  cardId: string;
  titleCn: string;
  deckId: string;
  issues: string[];
}

async function audit() {
  const cards = await prisma.card.findMany({
    select: {
      id: true, titleCn: true, title: true, deckId: true,
      question: true, answer: true, tags: true,
      searchKeywords: true, subTopic: true, difficulty: true,
    },
  });
  const issues: CardIssue[] = [];

  const GENERIC_KW = ['AI', 'ai', '模型', '数据', '面试', '学习', '系统', '设计', '算法', '应用', '方法', '技术', '开发', '工具', '框架', '平台'];

  for (const c of cards) {
    const cardIssues: string[] = [];

    // Empty title
    if (!c.titleCn?.trim() && !c.title?.trim()) cardIssues.push('empty title/titleCn');

    // Empty question
    if (!c.question?.trim()) cardIssues.push('empty question');

    // Empty answer
    if (!c.answer?.trim()) cardIssues.push('empty answer');

    // Missing searchKeywords
    if (!c.searchKeywords?.trim()) {
      cardIssues.push('missing searchKeywords');
    } else {
      const kws = c.searchKeywords.split(/\s+/).filter(Boolean);
      if (kws.length < 3) cardIssues.push(`too few keywords (${kws.length})`);
      if (kws.every(k => GENERIC_KW.includes(k))) cardIssues.push('all keywords are generic');
    }

    // Missing tags
    if (!c.tags?.trim()) cardIssues.push('missing tags');

    // Missing subTopic
    if (!c.subTopic?.trim()) cardIssues.push('missing subTopic');

    // Missing difficulty
    if (!c.difficulty) cardIssues.push('missing difficulty');

    // Deck doesn't exist
    const validDecks = ['machine-learning','deep-learning','statistics','agent','leetcode','llm','workplace','jargon'];
    if (!validDecks.includes(c.deckId) && !c.deckId?.startsWith('agent-')) {
      cardIssues.push(`unknown deck: ${c.deckId}`);
    }

    if (cardIssues.length > 0) {
      issues.push({
        cardId: c.id,
        titleCn: c.titleCn || c.title || c.id,
        deckId: c.deckId,
        issues: cardIssues,
      });
    }
  }

  // Duplicate detection by similar titleCn
  const titleMap = new Map<string, string[]>();
  for (const c of cards) {
    if (!c.titleCn?.trim()) continue;
    const key = c.titleCn.trim().slice(0, 20);
    const list = titleMap.get(key) || [];
    list.push(c.id);
    titleMap.set(key, list);
  }
  const duplicates: [string, string, string][] = [];
  for (const [key, ids] of titleMap) {
    if (ids.length > 1) {
      const c1 = cards.find(c => c.id === ids[0]);
      duplicates.push([ids[0], ids[1], key + (c1?.deckId ? ` (${c1.deckId})` : '')]);
    }
  }

  // Orphan cards: embedding exists but card doesn't
  const vecCount = await prisma.$queryRawUnsafe(
    "SELECT COUNT(*) as c FROM ai_search_vec WHERE object_type = 'card'"
  ) as any[];
  const orphanVecs = Number(vecCount[0].c) - cards.length;

  // Report
  console.log('\n══════════════════════════════════════');
  console.log('CARD DATABASE AUDIT');
  console.log('══════════════════════════════════════');
  console.log(`  Total cards: ${cards.length}`);
  console.log(`  Cards with issues: ${issues.length}`);
  console.log(`  Duplicate title pairs: ${duplicates.length}`);
  console.log(`  Orphan vectors: ${orphanVecs}`);

  if (issues.length > 0) {
    console.log('\n── Cards with Issues ──');
    for (const ci of issues.slice(0, 30)) {
      console.log(`  ${ci.cardId} | ${ci.titleCn.slice(0, 40)} | ${ci.deckId}`);
      for (const i of ci.issues) console.log(`    - ${i}`);
    }
    if (issues.length > 30) console.log(`  ... +${issues.length - 30} more`);
  }

  if (duplicates.length > 0) {
    console.log('\n── Potential Duplicates ──');
    for (const [a, b, key] of duplicates.slice(0, 10)) {
      console.log(`  ${a} <-> ${b} : "${key}"`);
    }
  }

  // Breakdown by issue type
  const breakdown = new Map<string, number>();
  for (const ci of issues) {
    for (const i of ci.issues) {
      breakdown.set(i, (breakdown.get(i) || 0) + 1);
    }
  }
  console.log('\n── Issue Breakdown ──');
  for (const [k, v] of [...breakdown].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`);
  }

  console.log('\n── Deck Distribution ──');
  const decks = new Map<string, number>();
  for (const c of cards) decks.set(c.deckId, (decks.get(c.deckId) || 0) + 1);
  for (const [k, v] of [...decks].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`);
  }

  await prisma.$disconnect();
  process.exit(0);
}

audit().catch(e => { console.error(e); process.exit(1); });
