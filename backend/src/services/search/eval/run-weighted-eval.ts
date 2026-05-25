// backend/src/services/search/eval/run-weighted-eval.ts
// Weighted eval using realism classification

import { understandQuery } from '../query-understanding';
import { hybridSearch } from '../hybrid-search';
import { getLP200Cases } from './lp200-cases';
import { GENERATED_CASES } from './lp200-generated';

const fs = require('fs');
const classified = JSON.parse(fs.readFileSync('src/services/search/eval/realism-classified.json', 'utf8'));

interface RealismCase {
  id: string; query: string; realism: string; weight: number;
  productAction: string; expectedResultType: string; rationale: string;
}

interface WeightedResult {
  id: string; query: string; realism: string; weight: number;
  pass: boolean; failureType: string; failureDetail: string;
}

async function main() {
  const allCases: any[] = [...getLP200Cases(), ...GENERATED_CASES];
  const realismMap = new Map<string, RealismCase>();
  for (const r of classified) realismMap.set(r.id, r);

  const results: WeightedResult[] = [];

  for (const c of allCases.slice(0, 200)) {
    const realism = realismMap.get(c.id) || { realism: 'common', weight: 0.7 } as RealismCase;
    const exp = c.expectedUnderstanding || { intent: c.expectedIntent, topic: c.expectedTopic };
    const parsed = await understandQuery(c.query);

    let pass = true;
    let failureType = '';
    let failureDetail = '';

    // Intent check (product-action aligned: only fail if completely wrong)
    if (parsed.intent !== exp.intent) {
      pass = false;
      failureType = 'intent';
      failureDetail = `${parsed.intent}≠${exp.intent}`;
    }

    // Topic check
    if (pass && (parsed.topic || '').toLowerCase() !== (exp.topic || '').toLowerCase()) {
      pass = false;
      failureType = 'topic';
      failureDetail = `${parsed.topic}≠${exp.topic}`;
    }

    // Rewrite mustInclude
    if (pass) {
      const tieredText = [parsed.canonicalTopic, ...parsed.coreKeywords, ...parsed.expandedKeywords].join(' ').toLowerCase();
      const mustInc = c.rewrite?.mustInclude || [];
      const missing = mustInc.filter((w: string) => !tieredText.includes(w.toLowerCase()));
      if (missing.length > 0) {
        pass = false;
        failureType = 'mustInclude';
        failureDetail = `missing: ${missing.join(',')}`;
      }
    }

    // Ranking precision
    if (pass) {
      const results = await hybridSearch({ query: c.query, maxResults: 20, minScore: 0, debug: true });
      const trace = (results as any)._trace || {};
      const merged = trace.merge?.afterDedup || 0;
      const finalCnt = results.length;

      // Merged check
      const maxMerged = c.retrieval?.maxMergedCandidates || 250;
      if (merged > maxMerged) {
        pass = false;
        failureType = 'merged';
        failureDetail = `merged=${merged}>max=${maxMerged}`;
      }

      // Precision check
      if (pass) {
        const mustMatch = c.ranking?.mustMatchAny || [];
        if (mustMatch.length > 0) {
          const topText = results.slice(0, 10).map((r: any) => [r.titleCn, r.title, r.reason, r.snippet, r.deckName, ...(r.tags || [])].filter(Boolean).join(' ')).join(' ').toLowerCase();
          const matched = mustMatch.filter((w: string) => topText.includes(w.toLowerCase()));
          const prec = matched.length / Math.min(10, mustMatch.length);
          if (prec < (c.ranking?.minPrecision || 0.3)) {
            pass = false;
            failureType = 'precision';
            failureDetail = `precision=${prec.toFixed(2)}`;
          }
        }
      }
    }

    results.push({
      id: c.id, query: c.query, realism: realism.realism, weight: realism.weight,
      pass, failureType, failureDetail,
    });
  }

  // Compute metrics
  const total = results.length;
  const totalPassed = results.filter(r => r.pass).length;
  const rawRate = totalPassed / total;

  const byRealism = new Map<string, { total: number; passed: number }>();
  let weightedSum = 0, weightedTotal = 0;
  for (const r of results) {
    const key = r.realism;
    if (!byRealism.has(key)) byRealism.set(key, { total: 0, passed: 0 });
    const entry = byRealism.get(key)!;
    entry.total++;
    if (r.pass) entry.passed++;
    weightedSum += (r.pass ? 1 : 0) * r.weight;
    weightedTotal += r.weight;
  }

  console.log('=== Weighted Eval Report ===\n');
  console.log(`Raw pass rate: ${rawRate.toFixed(1)}% (${totalPassed}/${total})`);
  console.log(`Weighted pass rate: ${(weightedSum / weightedTotal * 100).toFixed(1)}%`);

  for (const [cat, entry] of byRealism) {
    console.log(`  ${cat}: ${entry.passed}/${entry.total} = ${(entry.passed / entry.total * 100).toFixed(1)}%`);
  }

  const coreCommon = (byRealism.get('core') || { passed: 0, total: 0 });
  const cm = (byRealism.get('common') || { passed: 0, total: 0 });
  const coreCommonTotal = coreCommon.total + cm.total;
  const coreCommonPassed = coreCommon.passed + cm.passed;
  console.log(`\nProduct-fit (core+common): ${coreCommonPassed}/${coreCommonTotal} = ${(coreCommonPassed / coreCommonTotal * 100).toFixed(1)}%`);

  // Edge failures detail
  const edgeFails = results.filter(r => r.realism === 'edge' && !r.pass);
  if (edgeFails.length > 0) {
    console.log(`\nEdge failures (${edgeFails.length}):`);
    for (const f of edgeFails) console.log(`  ${f.id}: "${f.query}" — ${f.failureType}: ${f.failureDetail}`);
  }

  // Core/common failures by type
  const productFails = results.filter(r => ['core','common'].includes(r.realism) && !r.pass);
  const byType = new Map<string, number>();
  for (const f of productFails) byType.set(f.failureType, (byType.get(f.failureType) || 0) + 1);
  console.log(`\nProduct-fit failures by type:`);
  for (const [t, c] of byType) console.log(`  ${t}: ${c}`);

  console.log(`\nTotal failures: ${results.filter(r => !r.pass).length}`);
}

main();
