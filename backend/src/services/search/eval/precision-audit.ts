// Precision audit v2: hydrate card titles before checking purity
import { buildLearningPlan } from '../learning-path-pipeline';
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  // Sample 5 LP cases that pass
  const queries = ['怎么学xgboost','RAG学习路线','机器学习入门','深度学习怎么学','Prompt Engineering怎么入行'];
  
  let top5Relevant = 0, top5Total = 0;
  let offTopicCards = 0, totalCards = 0;

  for (const q of queries) {
    const plan = await buildLearningPlan(q);
    if (!plan.graphNodeId) { console.log(q + ': no graph node'); continue; }

    console.log(`\n${q} → ${plan.canonicalTopic} (${plan.stages.length} stages)`);

    for (const stage of plan.stages) {
      const stageConcepts = new Set(stage.concepts.map((c: string) => c.toLowerCase()));
      const stageWords = new Set(stage.concepts.flatMap((c: string) => c.toLowerCase().split(/\s+/)));
      console.log(`  [${stage.name}] concepts: ${stage.concepts.slice(0,3).join(', ')}`);

      for (let i = 0; i < Math.min(5, stage.cards.length); i++) {
        const cardId = stage.cards[i].cardId;
        // Hydrate card title
        const card = await p.card.findUnique({ where: { id: cardId }, select: { titleCn: true, title: true, searchKeywords: true } });
        const title = card?.titleCn || card?.title || cardId;
        const skw = (card?.searchKeywords || '').toLowerCase();
        const titleLower = title.toLowerCase();
        // Match: title OR searchKeywords contain stage concept words
        const titleMatch = [...stageWords].filter(w => titleLower.includes(w)).length;
        const skwMatch = [...stageWords].filter(w => skw.includes(w)).length;
        const matchCount = Math.max(titleMatch, skwMatch);

        const mark = matchCount >= 2 ? '✓' : matchCount >= 1 ? '~' : '✗';
        if (matchCount < 2) {
          console.log(`    ${mark} "${title.slice(0,50)}" (match=${matchCount}) ← ${stage.cards[i].conceptMatch}`);
        }

        top5Total++;
        if (matchCount >= 2) top5Relevant++;
        if (matchCount === 0) offTopicCards++;
        totalCards++;
      }
    }
  }

  console.log(`\n=== Precision Summary ===`);
  console.log(`Precision@5: ${(top5Relevant/top5Total*100).toFixed(1)}% (${top5Relevant}/${top5Total})`);
  console.log(`Off-Topic Rate: ${(offTopicCards/totalCards*100).toFixed(1)}% (${offTopicCards}/${totalCards})`);
  await p.$disconnect();
}
main();
