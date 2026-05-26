// Release gate by group — runs full understandQuery + hybridSearch per case, grouped by type
import { hybridSearch } from '../hybrid-search';
import { understandQuery } from '../query-understanding';
import { TEST_CASES } from '../../../evaluation/test-cases';

interface GroupResult {
  group: string; total: number;
  top15: number; top10: number; top5: number;
  mrr: number; missing: number;
  avgMerged: number; p95Merged: number;
  intentDist: Record<string,number>;
  sourceDist: Record<string,number>;
  tierOwnerDist: Record<string,number>;
}

async function runGroup(g: string, cases: any[]): Promise<GroupResult> {
  let top5=0, top10=0, top15=0, missing=0;
  let mrrSum=0;
  const mergedVals: number[] = [];
  const intentDist: Record<string,number>={}, sourceDist: Record<string,number>={}, tierOwnerDist: Record<string,number>={};

  for (const c of cases) {
    const parsed = await understandQuery(c.query);
    intentDist[parsed.intent]=(intentDist[parsed.intent]||0)+1;
    sourceDist[parsed.source]=(sourceDist[parsed.source]||0)+1;
    tierOwnerDist[parsed.tierOwner]=(tierOwnerDist[parsed.tierOwner]||0)+1;

    const results: any = await hybridSearch({ query: c.query, maxResults: 15, minScore: 0, debug: true });
    const trace = results._trace || {};
    mergedVals.push(trace.merge?.afterDedup || 0);

    const pids = new Set(c.primaryIds || []);
    let bestRank = Infinity;
    for (let i=0; i<results.length; i++) {
      if (pids.has(results[i].cardId) && i+1 < bestRank) bestRank = i+1;
    }
    if (bestRank <= 5) top5++;
    if (bestRank <= 10) top10++;
    if (bestRank <= 15) top15++;
    if (bestRank === Infinity) { missing++; }
    else { mrrSum += 1/bestRank; }
  }

  mergedVals.sort((a,b)=>a-b);
  return {
    group: g, total: cases.length, top15, top10, top5,
    mrr: cases.length > 0 ? mrrSum/cases.length : 0, missing,
    avgMerged: Math.round(mergedVals.reduce((a,b)=>a+b,0)/mergedVals.length),
    p95Merged: mergedVals[Math.floor(mergedVals.length*0.95)] || 0,
    intentDist, sourceDist, tierOwnerDist,
  };
}

async function main() {
  const groups = new Map<string, any[]>();
  for (const c of TEST_CASES) {
    const g = c.group || 'unknown';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(c);
  }

  const results: GroupResult[] = [];
  for (const [g, cases] of groups) {
    if (cases.length < 3) continue;
    process.stdout.write(`  ${g} (${cases.length})... `);
    const r = await runGroup(g, cases);
    results.push(r);
    console.log(`Top15=${(r.top15/r.total*100).toFixed(0)}% MRR=${r.mrr.toFixed(2)} missing=${r.missing}`);
  }

  results.sort((a,b)=>b.top15/a.total - a.top15/a.total);
  console.log('\ngroup | cases | Top5 | Top10 | Top15 | MRR | missing | avgMerged | p95');
  console.log('------|-------|------|-------|-------|-----|---------|-----------|-----');
  for (const r of results) {
    console.log(`${r.group.padEnd(24)}| ${String(r.total).padStart(4)} | ${(r.top5/r.total*100).toFixed(0).padStart(3)}% | ${(r.top10/r.total*100).toFixed(0).padStart(4)}% | ${(r.top15/r.total*100).toFixed(0).padStart(4)}% | ${r.mrr.toFixed(2)} | ${String(r.missing).padStart(6)} | ${String(r.avgMerged).padStart(8)} | ${String(r.p95Merged).padStart(4)}`);
  }

  const allT15 = results.reduce((s,r)=>s+r.top15, 0);
  const allT = results.reduce((s,r)=>s+r.total, 0);
  console.log(`\nTotal: ${allT} cases, Top15=${(allT15/allT*100).toFixed(1)}%`);
}
main();
