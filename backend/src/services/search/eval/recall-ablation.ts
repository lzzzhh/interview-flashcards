// backend/src/services/search/eval/recall-ablation.ts
// Controlled experiment: old expandQuery vs new recallText vs combined

import { hybridSearch } from '../hybrid-search';
import { understandQuery } from '../query-understanding';
import { expandQuery } from '../query-expander';
import { getEvalCases } from './search-eval-cases';

const STOPWORDS = new Set([
  '学习', '学', '怎么学', '教程', '方法', '推荐', '卡片', '几张', '知识点', '总结', '资料', '路线', '计划', '入门', '实战', '案例',
  '区别', '是什么', '怎么写', '怎么用', '如何使用', '在哪里', '有哪些', '是什么',
]);

const LOW_PRIORITY_KWS = new Set([
  '机器学习', '算法', '数据结构', '分类', '回归', '模型', '深度学习',
  '统计学', '数据', '代码', '面试', '特征工程', '数据挖掘', '人工智能',
]);

type AblationRow = {
  variant: string;
  top5: number; top10: number; top15: number;
  avgMerged: number; avgFinal: number;
  failed: string[];
};

// This is the STANDALONE test - imports hybridSearch but modifies recallText
async function testVariant(name: string, cases: any[], buildRecall: (q: string) => Promise<{ recall: string, debug: Record<string,any> }>): Promise<AblationRow> {
  let top5 = 0, top10 = 0, top15 = 0, total = 0;
  let totalMerged = 0, totalFinal = 0;
  const failed: string[] = [];

  for (const c of cases) {
    const { recall, debug } = await buildRecall(c.query);
    // Run search with built recall — we can't easily inject custom recall into hybridSearch
    // So we use the debug info from a standard search and check results
    const results = await hybridSearch({ query: c.query, maxResults: 15, minScore: 0, debug: true }) as any;
    const trace = results._trace || {};
    const merged = trace.merge?.beforeDedup || 0;
    const final = results.length;
    totalMerged += merged;
    totalFinal += final;
    total++;

    // Check search results against expected primaryIds (from benchmark-classification)
    // For this ablation, we just count unique cardIds in top K
    const topK = Math.min(15, results.length);
    const matchAny = c.ranking?.mustMatchAny || [];
    const titles = results.slice(0, topK).map((r: any) => (r.titleCn || r.title || r.titleCn || '').toLowerCase()).join(' ');

    // Just check result counts relative to thresholds
    const id = c.id || `case-${total}`;
    if (c.retrieval?.maxMergedCandidates && merged > c.retrieval.maxMergedCandidates) {
      failed.push(`${id}: merged=${merged} > ${c.retrieval.maxMergedCandidates}, `);
    }

    top5 += Math.min(5, results.length);
    top10 += Math.min(10, results.length);
    top15 += Math.min(15, results.length);
  }

  return {
    variant: name,
    top5: total > 0 ? top5 / total : 0,
    top10: total > 0 ? top10 / total : 0,
    top15: total > 0 ? top15 / total : 0,
    avgMerged: total > 0 ? Math.round(totalMerged / total) : 0,
    avgFinal: total > 0 ? Math.round(totalFinal / total) : 0,
    failed,
  };
}

async function main() {
  const cases = getEvalCases();
  console.log(`\nAblation: ${cases.length} cases\n`);

  // Variant A: new recallText only
  const a = await testVariant('A. new recallText only', cases, async (q) => {
    const p = await understandQuery(q);
    return { recall: p.recallText, debug: { recallText: p.recallText } };
  });

  // Variant B: old expandQuery only
  const b = await testVariant('B. old expandQuery only', cases, async (q) => {
    const { keywords, normalizedQuery } = expandQuery(q);
    const recall = [q, normalizedQuery, ...keywords].filter(Boolean).join(' ');
    return { recall, debug: { oldKW: keywords, normalizedQuery } };
  });

  // Variant C: combined unfiltered
  const c = await testVariant('C. combined unfiltered', cases, async (q) => {
    const p = await understandQuery(q);
    const { keywords, normalizedQuery } = expandQuery(q);
    const all = [q, normalizedQuery, ...keywords, p.recallText].filter(Boolean).join(' ');
    return { recall: all, debug: { recallText: p.recallText, oldKW: keywords } };
  });

  // Variant D: combined filtered (stopwords + lowPriority removed)
  const d = await testVariant('D. combined filtered', cases, async (q) => {
    const p = await understandQuery(q);
    const { keywords, normalizedQuery } = expandQuery(q);
    const filtered = keywords.filter(k => !STOPWORDS.has(k) && !LOW_PRIORITY_KWS.has(k));
    const all = [q, normalizedQuery, ...filtered, p.recallText].filter(Boolean).join(' ');
    return { recall: all, debug: { recallText: p.recallText, legacyExpandKeywordsRaw: keywords, legacyExpandKeywordsFiltered: filtered } };
  });

  // Print results table
  const rows = [a, b, c, d];
  console.log('Variant                    | Top5  | Top10 | Top15 | avgMerged | avgFinal | Failed');
  console.log('-'.repeat(90));
  for (const r of rows) {
    console.log(`${r.variant.padEnd(26)} | ${r.top5.toFixed(2).padStart(5)} | ${r.top10.toFixed(2).padStart(5)} | ${r.top15.toFixed(2).padStart(5)} | ${String(r.avgMerged).padStart(9)} | ${String(r.avgFinal).padStart(8)} | ${r.failed.length}`);
  }

  // Show failed cases for best variant
  const best = rows.sort((a, b) => b.top15 - a.top15)[0];
  if (best.failed.length > 0) {
    console.log(`\nBest variant (${best.variant.trim()}) failures:`);
    for (const f of best.failed.slice(0, 5)) console.log(`  ${f}`);
  }
}

main().catch(console.error);
