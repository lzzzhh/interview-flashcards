// backend/src/services/search/eval/diag-learning-path.ts
// Detailed diagnosis of learning-path failed cases

import { hybridSearch } from '../hybrid-search';
import { understandQuery } from '../query-understanding';

async function main() {
  // Just use inline known learning-path cases
  const lpQueries = [
    { id: 'AB实验', q: 'AB实验平台学习路线', primaryIds: ['stats-102','stats-116'] },
    { id: 'Agent开发', q: 'Agent开发学习路线', primaryIds: ['agent-21','agent-3'] },
    { id: 'RAG学习', q: 'RAG学习路线', primaryIds: ['agent-10','agent-11'] },
    { id: 'CV图像分类', q: 'CV图像分类学习路线', primaryIds: ['dl-6','ml-155'] },
    { id: 'LLM大模型', q: 'LLM大模型学习路线', primaryIds: ['llm-10','llm-18'] },
    { id: '深度学习入门', q: '深度学习入门路线', primaryIds: ['dl-1','dl-2'] },
    { id: '机器学习入门', q: '机器学习入门路线', primaryIds: ['ml-1','ml-2'] },
    { id: '数据科学入门', q: '数据科学入门路线', primaryIds: ['stats-5','stats-6'] },
  ];

  console.log('Learning-path diagnosis');
  console.log('='.repeat(60));

  for (const c of lpQueries) {
    console.log(`\n[${c.id}] "${c.q}"`);
    console.log(`  expected: ${c.primaryIds.join(', ')}`);
    const parsed = await understandQuery(c.q);
    console.log(`  topic: ${parsed.topic}, intent: ${parsed.intent}, canonicalTopic: ${parsed.canonicalTopic}`);
    console.log(`  deckHint: ${parsed.deckHint}, parent: ${parsed.parentCategory}`);
    console.log(`  recallText: ${parsed.recallText.slice(0, 100)}`);
    console.log(`  source: ${parsed.source}`);
    const results: any = await hybridSearch({ query: c.q, maxResults: 20, minScore: 0, debug: true });
    const trace = results._trace || {};
    const topIds = results.slice(0, 20).map((r: any) => r.cardId);
    const found = c.primaryIds.filter(id => topIds.includes(id));
    const missing = c.primaryIds.filter(id => !topIds.includes(id));
    console.log(`  found: ${found.join(', ') || '(none)'}`);
    console.log(`  missing: ${missing.join(', ') || '(none)'}`);
    console.log(`  merge: ${trace.merge?.beforeDedup}→${trace.merge?.afterDedup} | final: ${results.length}`);
  }
}

main().catch(console.error);
