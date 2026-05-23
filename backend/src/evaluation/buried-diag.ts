import { hybridSearch } from '../services/search/hybrid-search';
import { TEST_CASES } from '../evaluation/test-cases';
import { computeCaseResult } from '../evaluation/metrics';

async function main() {
  const targets = ['agent-10', 'ml-126', 'ml-157', 'stats-149', 'llm-23', 'stats-152', 'stats-116', 'ml-142'];
  for (const id of targets) {
    const tcs = TEST_CASES.filter(c => c && c.primaryIds && c.primaryIds.includes(id));
    if (tcs.length === 0) { console.log(id + ': no test case found'); continue; }
    const tc = tcs[0];
    const hits = await hybridSearch({ query: tc.query, maxResults: 100, minScore: 0, candidateLimit: 500 });
    const result = computeCaseResult(tc, hits, 0);
    const rank = result.rankedIds.indexOf(id);
    if (rank < 0) { console.log(id + ': NOT FOUND in ' + tc.query.slice(0,40)); continue; }
    const sb = hits[rank]?.scoreBreakdown;
    console.log(id + ' rank=' + (rank+1) + ' score=' + result.rankedScores[rank].toFixed(3) + '  group=' + tc.group + '  query=\"' + tc.query.slice(0,40) + '\"');
    if (sb) {
      console.log('  v=' + sb.vectorScore.toFixed(3) + ' kw=' + sb.keywordScore.toFixed(3) + ' field=' + sb.fieldBoost.toFixed(3) + ' deckB=' + sb.deckBoost.toFixed(3) + ' lex=' + sb.lexicalBoost.toFixed(3));
    }
    // Show competing cards above this one
    const topN = Math.min(rank, 3);
    for (let i = 0; i < topN; i++) {
      console.log('  > #' + (i+1) + ' ' + hits[i].cardId + ' ' + hits[i].deckId + ' score=' + hits[i].score.toFixed(3) + ' ' + hits[i].title.slice(0,45));
    }
    console.log('');
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
