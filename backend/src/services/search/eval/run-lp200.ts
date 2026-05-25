// backend/src/services/search/eval/run-lp200.ts
// 200-case learning-path eval — understanding, rewrite, retrieval, ranking, LP quality
import { understandQuery, sanitizeTopic } from '../query-understanding';
import { getConceptEquivalents } from '../concept-graph';
import { matchCardToConcepts } from '../card-concept-matcher';
import { hybridSearch } from '../hybrid-search';

// ── Load all 205 cases (manual 40 + generated 165) ──
import { GENERATED_CASES } from './lp200-generated';
import { getLP200Cases } from './lp200-cases';

// Stats
interface LPResult {
  id: string; query: string; category: string; domain: string; style: string;
  // Understanding
  uPass: boolean; uIntent: string; uTopic: string; uDeckHint: string; uParent: string;
  uExpectedTopic: string; uExpectedDeck: string;
  // Rewrite
  rMustIncOk: boolean; rMustNotOk: boolean; rRecallLen: number; rRerankLen: number;
  // Retrieval
  merged: number; finalCnt: number; mergedFail: boolean;
  // Ranking
  matched: number; top10: number; precision: number;
  // LP quality
  diversityDecks: number; foundationCount: number;
  // Overall
  passed: boolean; failures: string[];
}

function getExpected(c: any): { intent: string; topic: string; deckHint?: string; parent?: string } {
  if (c.expectedUnderstanding) {
    return { intent: c.expectedUnderstanding.intent, topic: c.expectedUnderstanding.topic };
  }
  // Generated cases use flat fields
  return { intent: c.expectedIntent, topic: c.expectedTopic };
}

async function runOne(c: any, idx: number): Promise<LPResult> {
  const failures: string[] = [];
  const exp = getExpected(c);
  
  // 1. Understanding (with acceptable sets)
  const parsed = await understandQuery(c.query);
  const acceptableIntent = c.expectedUnderstanding?.acceptableIntent || [exp.intent];
  const intentOk = acceptableIntent.includes(parsed.intent);
  const acceptableTopic = c.expectedUnderstanding?.acceptableTopic || [exp.topic];
  const topicOk = acceptableTopic.some((t: string) => (parsed.topic || '').toLowerCase() === t.toLowerCase());
  const uPass = intentOk && topicOk;
  if (!uPass) {
    if (parsed.intent !== exp.intent) failures.push(`intent: ${parsed.intent}≠${exp.intent}`);
    if ((parsed.topic || '').toLowerCase() !== (exp.topic || '').toLowerCase()) failures.push(`topic: ${parsed.topic}≠${exp.topic}`);
  }

  // 2. Rewrite
  // 2. Rewrite: check against tiered keywords only (not raw query terms)
  const rMustInc = c.rewrite?.mustInclude || [];
  const rMustNot = c.rewrite?.mustNotInclude || [];
  const tieredTokens = new Set([parsed.canonicalTopic, ...parsed.coreKeywords, ...parsed.expandedKeywords].flatMap(t => t.toLowerCase().split(/\s+/)));
  // Build concept-level alias set from graph for mustInclude matching
  const graphMatchedConcepts = new Set<string>();
  for (const t of [parsed.canonicalTopic, ...parsed.coreKeywords]) {
    const equivs = getConceptEquivalents(t);
    for (const e of equivs.equivalentTerms) graphMatchedConcepts.add(e.toLowerCase());
    for (const a of equivs.aliases) graphMatchedConcepts.add(a.toLowerCase());
  }
  const rMustIncOk = rMustInc.every((w: string) => {
    const wl = w.toLowerCase();
    if (tieredTokens.has(wl)) return true;
    const words = wl.split(/\s+/);
    if (words.length > 1) return words.every(wr => tieredTokens.has(wr));
    // Concept-level matching: check if keyword is a graph alias of the parsed topic
    if (graphMatchedConcepts.has(wl)) return true;
    return false;
  });
  const rMustNotOk = !rMustNot.some((w: string) => tieredTokens.has(w.toLowerCase()));
  if (!rMustIncOk) failures.push(`mustInclude failed: ${rMustInc.filter((w: string) => !tieredTokens.has(w.toLowerCase())).join(',')}`);
  if (!rMustNotOk) failures.push(`mustNotInclude failed: ${rMustNot.filter((w: string) => tieredTokens.has(w.toLowerCase())).join(',')}`);

  // 3. Search (merged cap by topic granularity)
  const results: any = await hybridSearch({ query: c.query, maxResults: 20, minScore: 0, debug: true });
  const trace = results._trace || {};
  const merged = trace.merge?.afterDedup || 0;
  const finalCnt = results.length;
  // Topic granularity: broad topics get higher cap
  const granularity = c.topicGranularity || 'specific';
  const capByGranularity: Record<string, number> = { specific: 200, medium: 250, broad: 350, compare: 300 };
  const maxMerged = c.retrieval?.maxMergedCandidates || capByGranularity[granularity] || 250;
  const mergedFail = merged > maxMerged;
  if (mergedFail) failures.push(`merged: ${merged} > ${c.retrieval.maxMergedCandidates}`);

  // 4. Ranking (with card-concept matching for concept-level precision)
  const mustMatch = c.ranking?.mustMatchAny || c.mustMatchAny || [];
  const top10 = results.slice(0, 10);
  // Text-based matching (title, tags, snippet, reason, deckName)
  const top10Text = top10.map((r: any) => {
    const parts = [r.titleCn, r.title, r.reason, r.snippet, r.deckName];
    if (Array.isArray(r.tags)) parts.push(...r.tags);
    return parts.filter(Boolean).join(' ').toLowerCase();
  }).join(' ');
  // Concept-level matching: each result card's fields matched against graph aliases
  const matchedConceptIds = new Set<string>();
  for (const r of top10) {
    const cardFields: any = { cardId: r.cardId, title: r.title, titleCn: r.titleCn, tags: r.tags, searchKeywords: r.searchKeywords, question: r.snippet, answer: r.answer };
    const matched = matchCardToConcepts(cardFields);
    for (const mc of matched) matchedConceptIds.add(mc.conceptId);
  }
  const conceptText = [...matchedConceptIds].join(' ').toLowerCase();
  const combinedText = top10Text + ' ' + conceptText;
  const matched = mustMatch.filter((w: string) => combinedText.includes(w.toLowerCase())).length;
  const precision = mustMatch.length > 0 ? Math.min(1, matched / Math.min(10, mustMatch.length)) : 0;
  const rankFail = (c.ranking?.minPrecision || 0.3) && precision < (c.ranking?.minPrecision || 0.3);
  if (rankFail) failures.push(`precision: ${precision.toFixed(2)} < ${c.ranking.minPrecision}`);

  // 5. LP quality
  const deckIds = new Set(top10.map((r: any) => r.deckId));
  const diversityDecks = deckIds.size;
  const foundationCount = top10.filter((r: any) => {
    const t = (r.titleCn || r.title || '').toLowerCase();
    return /入门|基础|基础概念|overview|introduction|foundation/i.test(t);
  }).length;

  return {
    id: c.id, query: c.query.slice(0, 50), category: c.category || '?', domain: c.domain || '?', style: c.style || '?',
    uPass, uIntent: parsed.intent, uTopic: parsed.topic, uDeckHint: parsed.deckHint || '', uParent: parsed.parentCategory || '',
    uExpectedTopic: exp.topic, uExpectedDeck: exp.deckHint || '',
    rMustIncOk, rMustNotOk, rRecallLen: parsed.recallText.length, rRerankLen: parsed.rerankText.length,
    merged, finalCnt, mergedFail,
    matched, top10: Math.min(10, finalCnt), precision,
    diversityDecks, foundationCount,
    passed: failures.length === 0, failures,
  };
}

async function main() {
  const manual = getLP200Cases();
  const generated = GENERATED_CASES.map((c: any) => ({
    id: c.id, query: c.query,
    expectedIntent: c.expectedIntent, expectedTopic: c.expectedTopic,
    expectedDeckHint: c.expectedDeckHint, expectedParent: c.expectedParent || c.expectedDeckParent,
    rewrite: {
      mustInclude: c.mustMatchAny.slice(0, 2),
      mustNotInclude: ['学习', '教程', '推荐', '卡片', '几张'],
    },
    retrieval: { maxMergedCandidates: c.maxMerged, minFinalResults: c.minFinal },
    ranking: { topK: 10, mustMatchAny: c.mustMatchAny, minPrecision: 0.3 },
    category: c.category, domain: c.domain, style: c.style,
  }));
  const all = [...manual, ...generated].slice(0, 200);
  console.log(`Running LP200 eval: ${all.length} cases...\n`);

  const results: LPResult[] = [];
  for (let i = 0; i < all.length; i++) {
    const r = await runOne(all[i], i);
    results.push(r);
    if (i % 20 === 0) console.log(`  [${i}/${all.length}] ${r.passed ? '✓' : '✗'} ${r.id}: ${r.query}`);
  }

  // ── Report ──
  const passed = results.filter(r => r.passed);
  const overallTop20 = results.reduce((s, r) => s + r.top10, 0) / results.length;
  const avgMerged = results.reduce((s, r) => s + r.merged, 0) / results.length;
  const avgFinal = results.reduce((s, r) => s + r.finalCnt, 0) / results.length;
  const mergedVals = results.map(r => r.merged).sort((a, b) => a - b);
  const p95Merged = mergedVals[Math.floor(mergedVals.length * 0.95)];

  console.log('\n═══════════════════ REPORT ═══════════════════');
  console.log(`Total cases: ${all.length}  |  Passed: ${passed.length}/${all.length} (${(passed.length/all.length*100).toFixed(1)}%)`);
  console.log(`Avg Top10: ${overallTop20.toFixed(1)}  |  Avg Merged: ${avgMerged.toFixed(0)}  |  P95 Merged: ${p95Merged}  |  Avg Final: ${avgFinal.toFixed(0)}`);
  console.log('');

  // By category
  const cats = [...new Set(results.map(r => r.category))];
  for (const cat of cats.sort()) {
    const cr = results.filter(r => r.category === cat);
    console.log(`${cat}: ${cr.filter(r=>r.passed).length}/${cr.length} passed, avgMerged=${(cr.reduce((s,r)=>s+r.merged,0)/cr.length).toFixed(0)}`);
  }
  console.log('');

  // By domain
  const doms = [...new Set(results.map(r => r.domain))];
  for (const d of doms.sort()) {
    const dr = results.filter(r => r.domain === d);
    console.log(`${d}: ${dr.filter(r=>r.passed).length}/${dr.length} passed, avgMerged=${(dr.reduce((s,r)=>s+r.merged,0)/dr.length).toFixed(0)}`);
  }
  console.log('');

  // Failures
  const failed = results.filter(r => !r.passed);
  if (failed.length > 0) {
    console.log(`FAILURES (${failed.length}):`);
    // Group by failure root cause
    const groups: Record<string, LPResult[]> = {};
    for (const f of failed) {
      const key = f.failures[0]?.split(':')[0] || 'other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    }
    for (const [key, gr] of Object.entries(groups)) {
      console.log(`  ${key} (${gr.length}):`);
      for (const f of gr.slice(0, 3)) {
        console.log(`    ${f.id}: "${f.query}" → topic=${f.uTopic} expected=${f.uExpectedTopic} merged=${f.merged}`);
      }
    }
  }
}

main().catch(console.error);
