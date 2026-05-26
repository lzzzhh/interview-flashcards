// Export all cases (477 release-gate + 200 product-fit) as JSON → ~/Downloads/eval-per-case.json
import { hybridSearch } from '../hybrid-search';
import { understandQuery } from '../query-understanding';
import { TEST_CASES } from '../../../evaluation/test-cases';
import { getLP200Cases } from './lp200-cases';
import { GENERATED_CASES } from './lp200-generated';
import { writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

interface CaseResult {
  id: string;
  dataset: string;
  group: string;
  query: string;
  intent: string;
  topic: string;
  canonicalTopic: string;
  source: string;
  tierOwner: string;
  conceptSource: string;
  coreKeywords: string[];
  expandedKeywords: string[];
  prerequisiteKeywords: string[];
  top15: number;
  top10: number;
  top5: number;
  bestRank: number | null;
  mrr: number;
  merged: number;
  finalCnt: number;
  missing: boolean;
}

async function evalCase(idx: number, c: any, dataset: string): Promise<CaseResult> {
  const parsed = await understandQuery(c.query);
  const searchResult: any = await hybridSearch({ query: c.query, maxResults: 15, minScore: 0, debug: true });
  const trace = searchResult._trace || {};
  const merged = trace.merge?.afterDedup || 0;
  const finalCnt = searchResult.length;

  const pids = new Set(c.primaryIds || []);
  let bestRank: number | null = null;
  for (let i = 0; i < searchResult.length; i++) {
    if (pids.has(searchResult[i].cardId)) { bestRank = i + 1; break; }
  }

  return {
    id: `${dataset}-${idx + 1}`,
    dataset,
    group: c.group || 'product-fit',
    query: c.query,
    intent: parsed.intent,
    topic: parsed.topic || '',
    canonicalTopic: parsed.canonicalTopic,
    source: parsed.source,
    tierOwner: parsed.tierOwner,
    conceptSource: parsed.conceptSource || 'unknown',
    coreKeywords: parsed.coreKeywords.slice(0, 8),
    expandedKeywords: parsed.expandedKeywords.slice(0, 4),
    prerequisiteKeywords: parsed.prerequisiteKeywords || [],
    top15: bestRank !== null && bestRank <= 15 ? 1 : 0,
    top10: bestRank !== null && bestRank <= 10 ? 1 : 0,
    top5: bestRank !== null && bestRank <= 5 ? 1 : 0,
    bestRank,
    mrr: bestRank ? 1 / bestRank : 0,
    merged, finalCnt,
    missing: bestRank === null,
  };
}

async function main() {
  const results: CaseResult[] = [];

  // 1. Release gate (477 cases)
  for (let idx = 0; idx < TEST_CASES.length; idx++) {
    const r = await evalCase(idx, TEST_CASES[idx], 'release-gate');
    results.push(r);
    if ((idx + 1) % 100 === 0) console.log(`  release-gate: ${idx + 1}/${TEST_CASES.length}...`);
  }

  // 2. Product-fit (200 cases)
  const lpCases = [...getLP200Cases(), ...GENERATED_CASES].slice(0, 200);
  for (let idx = 0; idx < lpCases.length; idx++) {
    const r = await evalCase(idx, lpCases[idx], 'product-fit');
    results.push(r);
    if ((idx + 1) % 50 === 0) console.log(`  product-fit: ${idx + 1}/${lpCases.length}...`);
  }

  const outPath = join(homedir(), 'Downloads', 'eval-per-case.json');
  writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nDone — ${results.length} cases → ${outPath}`);
}
main();
