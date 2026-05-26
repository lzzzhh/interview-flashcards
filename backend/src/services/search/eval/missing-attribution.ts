// Missing attribution: classify all release-gate missing cases
import { hybridSearch } from '../hybrid-search';
import { understandQuery } from '../query-understanding';
import { TEST_CASES } from '../../../evaluation/test-cases';

async function main() {
  let absent=0, buried=0, wrongIntent=0, wrongTopic=0, zeroCandidates=0;
  const buriedCases: string[] = [];

  for (let idx=0; idx<TEST_CASES.length; idx++) {
    const c = TEST_CASES[idx];
    const parsed = await understandQuery(c.query);
    const results: any = await hybridSearch({ query: c.query, maxResults: 15, minScore: 0, debug: true });
    const trace = results._trace || {};
    const merged = trace.merge?.afterDedup || 0;
    const pids = new Set(c.primaryIds || []);

    let bestRank = Infinity;
    for (let i=0; i<results.length; i++) {
      if (pids.has(results[i].cardId) && i+1 < bestRank) bestRank = i+1;
    }

    if (bestRank === Infinity) {
      // Missing — check if expected in merged candidates
      // Check full candidate pool
      const allCandidates = results.length > 0 ? results.map((r: any) => r.cardId) : [];
      const matchesInFull = c.primaryIds?.filter((pid: string) => allCandidates.includes(pid)).length || 0;

      if (matchesInFull > 0) {
        buried++;
        if (buriedCases.length < 10) buriedCases.push(`${c.id || idx} "${c.query.slice(0,30)}"`);
      } else if (merged === 0) {
        zeroCandidates++;
      } else if (parsed.intent && (c as any).expectedIntent && parsed.intent !== (c as any).expectedIntent) {
        wrongIntent++;
      } else if (parsed.topic && (c as any).expectedTopic && parsed.topic !== (c as any).expectedTopic) {
        wrongTopic++;
      } else {
        absent++;
      }
    }
  }

  const totalMissing = absent + buried + wrongIntent + wrongTopic + zeroCandidates;
  console.log(`Total missing: ${totalMissing}`);
  console.log(`  absent (not in candidates): ${absent}`);
  console.log(`  buried (in candidates, not top15): ${buried}`);
  console.log(`  zero candidates (no recall): ${zeroCandidates}`);
  console.log(`  wrong intent: ${wrongIntent}`);
  console.log(`  wrong topic: ${wrongTopic}`);

  if (buriedCases.length > 0) {
    console.log('\nSample buried cases:');
    for (const b of buriedCases) console.log(' ', b);
  }
}
main();
