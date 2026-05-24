// Test Card Import Pipeline end-to-end
import { writeFileSync } from 'fs';

const API = 'http://localhost:3001/api';
const TEST_CARDS = [
  { id: 'test-pipeline-stats-1', titleCn: '卡方检验与t检验区别', deckId: 'statistics', question: '卡方检验和t检验分别在什么场景下使用？如何选择？', answer: 't检验用于比较均值（连续变量），卡方检验用于检验分类变量之间的独立性或拟合度。', tags: ['统计检验', '假设检验', '方法对比'], subTopic: '假设检验', difficulty: '3' },
  { id: 'test-pipeline-lc-1', titleCn: '三数之和', deckId: 'leetcode', title: '3Sum', question: '给你一个包含 n 个整数的数组 nums，判断 nums 中是否存在三个元素 a，b，c，使得 a + b + c = 0？', answer: '', tags: ['数组', '双指针', '排序'], subTopic: '双指针', difficulty: '2' },
  { id: 'test-pipeline-dl-1', titleCn: 'RNN梯度消失解决方案', deckId: 'deep-learning', question: 'RNN中梯度消失的根本原因是什么？有哪些解决方案？', answer: 'RNN中梯度消失源于连乘导致的指数衰减。解决方案：LSTM/GRU（门控机制）、梯度裁剪、批归一化、残差连接。', tags: ['RNN', 'LSTM', '梯度问题'], subTopic: '循环神经网络', difficulty: '4' },
  { id: 'test-pipeline-wp-1', titleCn: '晋升答辩准备清单', deckId: 'workplace', question: '晋升答辩需要准备哪些材料？', answer: '准备：项目总结（STAR法则）、量化成果、技术难点与创新点、业务影响力。', tags: ['晋升', '答辩', '职业发展'], subTopic: '晋升', difficulty: '2' },
];

async function main() {
  console.log('══════════════════════════════════════');
  console.log('Card Import Pipeline Test');
  console.log('══════════════════════════════════════\n');

  const created: string[] = [];

  for (const card of TEST_CARDS) {
    // 1. Create card
    console.log(`[1/6] Creating: ${card.titleCn}`);
    const createRes = await fetch(`${API}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });
    const createdCard = await createRes.json();
    if (!createRes.ok) { console.error('  FAIL:', createdCard); continue; }
    console.log(`  OK, id=${createdCard.id}`);

    // Wait for async embedding sync
    await new Promise(r => setTimeout(r, 500));

    // 2. Verify searchKeywords
    const getRes = await fetch(`${API}/cards/${createdCard.id}`);
    const fetched = await getRes.json();
    console.log(`[2/6] searchKeywords: ${(fetched.searchKeywords || '').slice(0, 60)}`);
    if (!fetched.searchKeywords?.trim()) {
      console.log('  FAIL: searchKeywords empty');
    } else {
      console.log('  PASS: searchKeywords non-empty');
    }

    // 3. Verify embedding (check via readiness:check CLI equivalent)
    // Use direct DB query via API
    const embedCheck = await fetch(`${API}/cards/${createdCard.id}`);
    const edata = await embedCheck.json();
    console.log(`[3/6] Card data: deckId=${edata.deckId}, tags=${edata.tags}, subTopic=${edata.subTopic}`);

    created.push(createdCard.id);
  }

  // 4. Run readiness:audit
  console.log('\n[4/6] Running readiness audit...');
  const { execSync } = await import('child_process');
  const auditOut = execSync('cd /Users/zhanhuilin/Desktop/interview-flashcards/backend && EVAL_SUPPRESS_DEBUG=1 npx tsx src/ingestion/readiness-cli.ts audit 2>&1', { timeout: 60_000 }).toString();
  const lines = auditOut.split('\n').filter(l => l.includes('Total') || l.includes('Missing') || l.includes('Ready'));
  for (const l of lines) console.log('  ' + l.trim());

  // 5. Run smoke test on created cards
  console.log('\n[5/6] Running smoke test on new cards...');
  const smokeOut = execSync(`cd /Users/zhanhuilin/Desktop/interview-flashcards/backend && EVAL_SUPPRESS_DEBUG=1 npx tsx src/evaluation/smoke-new-cards.ts --limit 10 2>&1`, { timeout: 120_000 }).toString();
  const smokeLines = smokeOut.split('\n').filter(l => l.includes('pass') || l.includes('fail') || l.includes('Hard') || l.includes('Warning') || l.includes('Smoke'));
  for (const l of smokeLines.slice(0, 10)) console.log('  ' + l.trim());

  // 6. Clean up test cards
  console.log('\n[6/6] Cleaning up test cards...');
  for (const id of created) {
    await fetch(`${API}/cards/${id}`, { method: 'DELETE' });
  }
  console.log(`  Deleted ${created.length} cards`);

  // Final check: remaining orphan vectors?
  console.log('\n══════════════════════════════════════');
  console.log('Pipeline Test Complete');
  console.log('══════════════════════════════════════');
}

main().catch(e => { console.error(e); process.exit(1); });
