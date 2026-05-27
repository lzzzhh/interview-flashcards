// Audit Agent-group failures: classify each by root cause
import { hybridSearch } from '../hybrid-search';
import { understandQuery } from '../query-understanding';
import { TEST_CASES } from '../../../evaluation/test-cases';

async function main() {
  const agentCases = TEST_CASES.filter(c => c.group?.includes('Agent'));
  console.log(`Total Agent cases: ${agentCases.length}`);

  let cardExists=0, cardGap=0, broader=0, primaryMismatch=0;
  const details: string[] = [];

  for (const c of agentCases) {
    const parsed = await understandQuery(c.query);
    const results: any = await hybridSearch({ query: c.query, maxResults: 15, minScore: 0, debug: true });
    const pids = new Set(c.primaryIds || []);
    let bestRank = Infinity;
    let equivalentCardId = '';

    for (let i=0; i<results.length; i++) {
      const r = results[i];
      if (pids.has(r.cardId)) { bestRank = Math.min(bestRank, i+1); }
      // Check for equivalent Agent cards
      if (!equivalentCardId && (r.deckId?.startsWith('agent') || r.deckId?.startsWith('ag') || r.tags?.includes('Agent'))) {
        equivalentCardId = r.cardId;
      }
    }

    if (bestRank <= 15) continue; // passed

    if (equivalentCardId) {
      primaryMismatch++;
      details.push(`  primaryMismatch: "${c.query.slice(0,40)}" → expected=${c.primaryIds?.slice(0,2)} found equiv=${equivalentCardId}`);
    } else if (results.length >= 3) {
      cardGap++;
      details.push(`  cardGap: "${c.query.slice(0,40)}" → ${results.length} results, no Agent cards`);
    } else if (results.length === 0) {
      broader++;
      details.push(`  noRecall: "${c.query.slice(0,40)}" → 0 results`);
    } else {
      broader++;
      details.push(`  broader: "${c.query.slice(0,40)}" → ${results.length} results`);
    }
  }

  console.log(`\nFailed: ${primaryMismatch+cardGap+broader}`);
  console.log(`  primaryId mismatch: ${primaryMismatch} (equiv Agent card exists)`);
  console.log(`  card gap: ${cardGap} (no equiv Agent card)`);
  console.log(`  broader/0-recall: ${broader}`);
  console.log('\nDetails:');
  for (const d of details) console.log(d);
}
main();
