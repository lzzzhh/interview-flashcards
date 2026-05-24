// backend/src/services/search/eval/run-search-eval.ts
// Search evaluation runner — tests query understanding, rewrite, retrieval, ranking

import { hybridSearch } from '../hybrid-search';
import { understandQuery } from '../query-understanding';
import { getEvalCases } from './search-eval-cases';
import type { EvalCase, EvalResult } from './search-eval-types';

export async function runSearchEval(): Promise<{ summary: string; results: EvalResult[]; passRate: number }> {
  const cases = getEvalCases();
  const results: EvalResult[] = [];

  for (const c of cases) {
    const result = await evalCase(c);
    results.push(result);
  }

  const passed = results.filter(r => r.pass).length;
  const passRate = results.length > 0 ? passed / results.length : 0;
  const failed = results.filter(r => !r.pass);

  let log = '\n══════════════════════════════════════\n';
  log += `Search Eval: ${passed}/${results.length} passed (${(passRate * 100).toFixed(1)}%)\n`;
  log += '══════════════════════════════════════\n\n';

  if (failed.length > 0) {
    log += `FAILURES (${failed.length}):\n\n`;
    for (const r of failed) {
      log += `[FAIL] ${r.id}\n`;
      log += `query: ${r.failures.join('\n       ')}\n\n`;
    }
  }

  console.log(log);
  return { summary: log, results, passRate };
}

async function evalCase(c: EvalCase): Promise<EvalResult> {
  const failures: string[] = [];

  // 1. Query understanding
  const parsed = await understandQuery(c.query);
  const uPass = parsed.intent === c.expectedUnderstanding.intent
    && parsed.topic.toLowerCase() === c.expectedUnderstanding.topic.toLowerCase()
    && (!c.expectedUnderstanding.deckHint || parsed.deckHint === c.expectedUnderstanding.deckHint)
    && (!c.expectedUnderstanding.parentCategory || parsed.parentCategory === c.expectedUnderstanding.parentCategory);

  if (!uPass) {
    const lines: string[] = [];
    if (parsed.intent !== c.expectedUnderstanding.intent) lines.push(`expected intent: ${c.expectedUnderstanding.intent}, actual: ${parsed.intent}`);
    if (parsed.topic.toLowerCase() !== c.expectedUnderstanding.topic.toLowerCase()) lines.push(`expected topic: ${c.expectedUnderstanding.topic}, actual: ${parsed.topic}`);
    if (c.expectedUnderstanding.deckHint && parsed.deckHint !== c.expectedUnderstanding.deckHint) lines.push(`expected deckHint: ${c.expectedUnderstanding.deckHint}, actual: ${parsed.deckHint}`);
    if (c.expectedUnderstanding.parentCategory && parsed.parentCategory !== c.expectedUnderstanding.parentCategory) lines.push(`expected parentCategory: ${c.expectedUnderstanding.parentCategory}, actual: ${parsed.parentCategory}`);
    failures.push(`Understanding: ${lines.join('; ')}`);
  }

  // 2. Rewrite
  const mustIncludeFailed = c.rewrite.mustInclude.filter(w =>
    !parsed.recallText.toLowerCase().includes(w.toLowerCase()));
  const mustNotIncludeFailed = c.rewrite.mustNotInclude.filter(w =>
    parsed.recallText.toLowerCase().includes(w.toLowerCase()));

  if (mustIncludeFailed.length > 0) failures.push(`Rewrite mustInclude failed: ${mustIncludeFailed.join(', ')}`);
  if (mustNotIncludeFailed.length > 0) failures.push(`Rewrite mustNotInclude failed: ${mustNotIncludeFailed.join(', ')}`);

  // 3. Retrieval
  const searchResults = await hybridSearch({ query: c.query, maxResults: 50, minScore: 0.25, debug: true });
  const trace = (searchResults as any)._trace || {};
  const mergedCandidates = trace.merge?.beforeDedup || 0;
  const finalResults = searchResults.length;
  let retrievalPassed = true;

  if (c.retrieval.maxMergedCandidates && mergedCandidates > c.retrieval.maxMergedCandidates) {
    failures.push(`Merged candidates: ${mergedCandidates}, expected <= ${c.retrieval.maxMergedCandidates}`);
    retrievalPassed = false;
  }
  if (c.retrieval.minFinalResults && finalResults < c.retrieval.minFinalResults) {
    failures.push(`Final results: ${finalResults}, expected >= ${c.retrieval.minFinalResults}`);
    retrievalPassed = false;
  }
  if (c.retrieval.maxFinalResults && finalResults > c.retrieval.maxFinalResults) {
    failures.push(`Final results: ${finalResults}, expected <= ${c.retrieval.maxFinalResults}`);
    retrievalPassed = false;
  }

  // 4. Ranking
  const topK = searchResults.slice(0, c.ranking.topK);
  const topTitles = topK.map((r: any) => (r.titleCn || r.title || '').toLowerCase()).join(' ');
  const matchedCount = c.ranking.mustMatchAny.filter(w => topTitles.includes(w.toLowerCase())).length;
  const precision = matchedCount / Math.min(c.ranking.topK, c.ranking.mustMatchAny.length);
  const rankingPassed = precision >= c.ranking.minPrecision;

  if (!rankingPassed) {
    failures.push(`TopK precision: ${precision.toFixed(2)}, expected >= ${c.ranking.minPrecision}`);
  }

  return {
    id: c.id,
    pass: failures.length === 0,
    failures,
    understanding: {
      expected: c.expectedUnderstanding,
      actual: { intent: parsed.intent, topic: parsed.topic, deckHint: parsed.deckHint, parentCategory: parsed.parentCategory },
      passed: uPass,
    },
    rewrite: { mustIncludeFailed, mustNotIncludeFailed },
    retrieval: { mergedCandidates, finalResults, retrievalPassed },
    ranking: { topK: c.ranking.topK, matchedCount, precision, rankingPassed },
  };
}

// Auto-run if called directly
if (process.argv[1]?.endsWith('run-search-eval.ts')) {
  runSearchEval().catch(console.error);
}
