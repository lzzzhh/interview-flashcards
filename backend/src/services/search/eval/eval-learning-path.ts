// Evaluate learning-path pipeline against release-gate learning-path cases
import { buildLearningPlan } from '../learning-path-pipeline';
import { TEST_CASES } from '../../../evaluation/test-cases';

type FailureClass = 'missing_graph_topic' | 'missing_prerequisite_edge' | 'missing_foundation_edge'
  | 'missing_card_coverage' | 'duplicate_stage_cards' | 'benchmark_policy_issue' | 'ok';

interface CaseResult {
  id: string; query: string; topic: string; stageCount: number; totalCards: number;
  stageCoverage: number; foundationCoverage: number; requiredCoverage: number;
  dupRate: number; emptyStages: number; failureClass: FailureClass; detail: string;
}

async function main() {
  const lpCases = TEST_CASES.filter(c => c.group === 'learning-path');
  const results: CaseResult[] = [];

  for (const c of lpCases) {
    const plan = await buildLearningPlan(c.query);
    const pids = new Set(c.primaryIds || []);
    let pidHit = false;
    for (const s of plan.stages) {
      for (const card of s.cards) {
        if (pids.has(card.cardId)) { pidHit = true; break; }
      }
    }

    let failureClass: FailureClass = 'ok';
    let detail = '';

    if (!plan.graphNodeId) {
      failureClass = 'missing_graph_topic';
      detail = `no graph node for "${plan.canonicalTopic || plan.topic}"`;
    } else if (plan.stages.length === 0) {
      failureClass = 'missing_card_coverage';
      detail = '0 stages generated';
    } else if (plan.stages.filter(s => s.name === '基础入门').length === 0 && plan.stages.length < 3) {
      failureClass = 'missing_prerequisite_edge';
      detail = 'no foundation/prerequisite edges';
    } else if (plan.metrics.duplicateConceptRate > 0.5) {
      failureClass = 'duplicate_stage_cards';
      detail = `dup rate ${(plan.metrics.duplicateConceptRate*100).toFixed(0)}%`;
    } else if (plan.metrics.stageCoverage < 0.5) {
      failureClass = 'missing_card_coverage';
      detail = `stage coverage ${(plan.metrics.stageCoverage*100).toFixed(0)}%`;
    }

    results.push({
      id: (c as any).id || '', query: c.query.slice(0, 50), topic: plan.canonicalTopic,
      stageCount: plan.stages.length, totalCards: plan.debug.totalCards,
      stageCoverage: plan.metrics.stageCoverage, foundationCoverage: plan.metrics.foundationCoverage,
      requiredCoverage: plan.metrics.requiredConceptCoverage, dupRate: plan.metrics.duplicateConceptRate,
      emptyStages: plan.metrics.emptyStageCount, failureClass, detail,
    });
  }

  // Summary
  const passThreshold = (r: CaseResult) => r.failureClass === 'ok' || r.failureClass === 'missing_prerequisite_edge';
  const passed = results.filter(passThreshold).length;
  const passRate = (passed / results.length * 100).toFixed(1);

  console.log(`\n=== Learning-Path Eval: ${passed}/${results.length} (${passRate}%) ===`);
  console.log(`  avg stages: ${(results.reduce((s,r)=>s+r.stageCount,0)/results.length).toFixed(1)}`);
  console.log(`  avg cards: ${(results.reduce((s,r)=>s+r.totalCards,0)/results.length).toFixed(1)}`);
  console.log(`  stage coverage: ${(results.reduce((s,r)=>s+r.stageCoverage,0)/results.length*100).toFixed(0)}%`);
  console.log(`  foundation coverage: ${(results.reduce((s,r)=>s+r.foundationCoverage,0)/results.length*100).toFixed(0)}%`);
  console.log(`  empty stages: ${results.reduce((s,r)=>s+r.emptyStages,0)}`);

  const fails = results.filter(r => r.failureClass !== 'ok');
  console.log(`\nFailures (${fails.length}):`);
  for (const r of fails.slice(0, 15)) {
    console.log(`  [${r.failureClass}] "${r.query}" → topic=${r.topic} | ${r.detail}`);
  }

  // Failure breakdown
  const byClass: Record<string, number> = {};
  for (const r of fails) byClass[r.failureClass] = (byClass[r.failureClass]||0)+1;
  console.log('\nBy failure class:');
  for (const [k,v] of Object.entries(byClass)) console.log(`  ${k}: ${v}`);
}
main();
