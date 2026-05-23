// Export cards for test case generation
import prisma from '../db/prisma';
import { writeFileSync } from 'fs';

async function main() {
  const cards = await prisma.card.findMany({
    select: { id: true, deckId: true, title: true, question: true, titleCn: true },
    orderBy: [{ deckId: 'asc' }, { id: 'asc' }]
  });
  const out = cards.map(c => ({
    id: c.id,
    deck: c.deckId,
    t: (c.title || c.titleCn || c.question || '').slice(0, 100)
  }));
  writeFileSync('/tmp/ff_cards.json', JSON.stringify(out));
  console.log('Exported', out.length, 'cards');
}
main().then(() => process.exit(0));
