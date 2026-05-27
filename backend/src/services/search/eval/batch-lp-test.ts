// Batch test: run all LP queries through pipeline, check trace correctness
import { buildLearningPlan, LearningPlan } from '../learning-path-pipeline';
import { TEST_CASES } from '../../../evaluation/test-cases';

async function main() {
  const lpCases = TEST_CASES.filter(c => c.group === 'learning-path');
  const results: { query: string; topic: string; stages: number; cards: number; ok: boolean; issue: string }[] = [];

  for (const c of lpCases) {
    const plan = await buildLearningPlan(c.query);
    const pids = new Set(c.primaryIds || []);
    let pidHit = plan.stages.some(s => s.cards.some(card => pids.has(card.cardId)));

    let ok = true;
    let issue = '';

    if (!plan.graphNodeId) { ok = false; issue = 'no graph node'; }
    else if (plan.stages.length === 0) { ok = false; issue = 'zero stages'; }
    else if (plan.debug.totalCards < 3) { ok = false; issue = `only ${plan.debug.totalCards} cards`; }
    else if (plan.metrics.stageCoverage < 0.5) { ok = false; issue = `stage cov ${(plan.metrics.stageCoverage*100).toFixed(0)}%`; }

    results.push({
      query: c.query.slice(0, 40),
      topic: plan.canonicalTopic || plan.topic,
      stages: plan.stages.length,
      cards: plan.debug.totalCards,
      ok,
      issue: issue || (pidHit ? 'pid hit' : 'pid miss (equiv ok)'),
    });
  }

  const passed = results.filter(r => r.ok).length;
  console.log(`\nLP Pipeline Test: ${passed}/${results.length} (${(passed/results.length*100).toFixed(1)}%)`);
  console.log(`avg stages: ${(results.reduce((s,r)=>s+r.stages,0)/results.length).toFixed(1)} | avg cards: ${(results.reduce((s,r)=>s+r.cards,0)/results.length).toFixed(1)}`);
  
  console.log('\n--- ALL RESULTS ---');
  for (const r of results) {
    console.log(`${r.ok ? '✓' : '✗'} [${r.stages}s/${r.cards}c] "${r.query}" → ${r.topic} | ${r.issue}`);
  }
}
main();
