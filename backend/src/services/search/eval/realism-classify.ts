// backend/src/services/search/eval/realism-classify.ts
// Classifies all 200 eval cases by realism, product fit, and weight.
// Outputs updated case arrays with classification fields.

import { getLP200Cases } from './lp200-cases';
import { GENERATED_CASES } from './lp200-generated';

interface RealismCase {
  id: string;
  query: string;
  realism: 'core' | 'common' | 'edge' | 'out_of_scope';
  weight: number;
  productAction: string;
  expectedResultType: string;
  rationale: string;
}

function classify(c: any): RealismCase {
  const q: string = (c.query || '').toLowerCase();
  const id = c.id || '';

  // Out of scope: pure Q&A without card/learning signal
  const qaOnly = /^什么是|^什么叫|^啥是|^解释|^为什么$/.test(q);
  const noCardSignal = !/卡片|学习|怎么学|入门|推荐|路线|计划|复习|补|不会|不懂|薄弱|搞混|刷|帮我|给我/.test(q);

  if (qaOnly && noCardSignal) {
    return { id, query: c.query, realism: 'out_of_scope', weight: 0,
      productAction: 'search_cards', expectedResultType: 'out_of_scope',
      rationale: 'Pure Q&A — no card/learning intent signal' };
  }

  // Core: high-frequency real user learning intents
  const corePatterns = [
    /怎么学/, /如何学/, /怎样学/, /我想学/, /我要学/, /想学/,
    /入门/, /学习路线/, /学习路径/, /从零开始学/,
    /怎么补/, /怎么复习/, /推荐.*卡/, /帮我.*卡/, /给我.*卡/,
    /不会.*怎么/, /怎么系统学/, /从哪里开始学/,
  ];
  const isCore = corePatterns.some(p => p.test(q));

  // Common: real but more complex expressions
  const commonPatterns = [
    /面试.*答不好/, /面试.*被问到/, /我对.*薄弱/,
    /总搞混/, /老是搞混/, /怎么看/, /什么时候用/,
    /和.*区别/, /和.*区分/, /和.*推荐/,
    /推荐几张/, /找几张/, /有哪些卡/,
  ];
  const isCommon = commonPatterns.some(p => p.test(q));

  // Edge: no topic or very unusual
  const edgePatterns = [
    /应该先学/, /先看哪些/, /看了几遍还是不懂/,
    /完全没概念/, /学习路径是什么/,
  ];
  const isEdge = edgePatterns.some(p => p.test(q));

  if (isCore) {
    return { id, query: c.query, realism: 'core', weight: 1.0,
      productAction: contains(q, '推荐') || contains(q, '帮我') ? 'recommend_cards' :
                     contains(q, '补') || contains(q, '复习') || contains(q, '不会') ? 'review_weakness' :
                     contains(q, '区别') || contains(q, '区分') ? 'compare_cards' : 'create_plan',
      expectedResultType: 'cards_or_plan',
      rationale: 'Core: high-frequency learning intent query' };
  }

  if (isCommon) {
    return { id, query: c.query, realism: 'common', weight: 0.7,
      productAction: contains(q, '区别') || contains(q, '区分') || contains(q, '什么时候用') ? 'compare_cards' :
                     contains(q, '薄弱') || contains(q, '答不好') ? 'review_weakness' : 'search_cards',
      expectedResultType: 'cards_or_plan',
      rationale: 'Common: real but more complex user expression' };
  }

  if (isEdge) {
    return { id, query: c.query, realism: 'edge', weight: 0.3,
      productAction: contains(q, '应该') || contains(q, '先看') ? 'clarify' : 'create_plan',
      expectedResultType: contains(q, '应该') || contains(q, '先看') ? 'clarification' : 'cards_or_plan',
      rationale: 'Edge: no clear topic or unusual query pattern' };
  }

  // Default: common
  return { id, query: c.query, realism: 'common', weight: 0.7,
    productAction: 'search_cards', expectedResultType: 'cards',
    rationale: 'Default: standard card search query' };
}

function contains(text: string, word: string): boolean {
  return text.includes(word);
}

async function main() {
  const allCases = [...getLP200Cases(), ...GENERATED_CASES];
  const classified: RealismCase[] = [];

  for (const c of allCases.slice(0, 200)) {
    classified.push(classify(c));
  }

  const counts: Record<string, number> = { core: 0, common: 0, edge: 0, out_of_scope: 0 };
  for (const r of classified) counts[r.realism]++;

  console.log('=== Realism Classification ===');
  console.log(`Total: ${classified.length}`);
  console.log(`Core: ${counts.core} | Common: ${counts.common} | Edge: ${counts.edge} | Out: ${counts.out_of_scope}`);

  // Output as JSON for eval runner
  const fs = require('fs');
  fs.writeFileSync(
    'src/services/search/eval/realism-classified.json',
    JSON.stringify(classified, null, 2)
  );

  // Print first 5 of each category
  for (const [cat, items] of Object.entries(
    classified.reduce((acc: Record<string, RealismCase[]>, r) => {
      if (!acc[r.realism]) acc[r.realism] = [];
      acc[r.realism].push(r);
      return acc;
    }, {})
  )) {
    console.log(`\n${cat} (${items.length}):`);
    for (const item of items.slice(0, 3)) {
      console.log(`  ${item.id}: "${item.query.slice(0,40)}" — ${item.productAction} | ${item.rationale}`);
    }
  }
}

main();
