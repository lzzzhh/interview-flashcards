import { readFileSync, writeFileSync } from 'fs';
import { TEST_CASES } from './src/evaluation/test-cases';

let content = readFileSync('src/evaluation/test-cases.ts', 'utf-8');

const fixes: [string, string, string][] = [
  ['损失函数', 'primaryIds: [\"ml-1\", \"ml-5\", \"ml-142\", \"ml-144\"]', 'primaryIds: [\"ml-1\", \"ml-53\", \"ml-142\", \"ml-143\"]'],
  ['风控建模一般用什么算法', 'primaryIds: [\"ml-103\", \"ml-128\", \"ml-146\"]', 'primaryIds: [\"ml-128\"]'],
  ['怎么设计数据指标体系', 'primaryIds: [\"stats-116\", \"stats-130\", \"stats-159\"]', 'primaryIds: [\"stats-167\", \"stats-168\", \"jargon-33\"]'],
  ['时间序列季节性怎么处理', 'primaryIds: [\"stats-86\", \"stats-88\", \"stats-90\"]', 'primaryIds: [\"stats-88\", \"stats-90\", \"stats-91\"]'],
  ['AUC PR-AUC区别什么情况用哪个', 'primaryIds: [\"ml-109\", \"ml-126\", \"ml-133\"]', 'primaryIds: [\"ml-9\", \"ml-49\", \"ml-137\"]'],
  ['One-hot Encoding有什么问题', 'primaryIds: [\"ml-120\", \"ml-121\", \"ml-14\"]', 'primaryIds: [\"ml-14\", \"ml-28\", \"ml-42\"]'],
  ['ROC AUC曲线解释', 'primaryIds: [\"ml-109\", \"ml-126\", \"ml-133\"]', 'primaryIds: [\"ml-9\", \"ml-49\", \"ml-137\"]'],
  ['AUC和F1衡量指标的区别', 'primaryIds: [\"ml-109\", \"ml-126\", \"ml-133\"]', 'primaryIds: [\"ml-9\", \"ml-49\", \"ml-185\"]'],
  ['MSE和MAE损失函数对比', 'primaryIds: [\"ml-121\", \"ml-122\", \"ml-144\"]', 'primaryIds: [\"ml-53\", \"ml-60\", \"ml-72\"]'],
  ['Mini Batch vs Full Batch训练', 'primaryIds: [\"ml-1\", \"ml-11\", \"ml-115\"]', 'primaryIds: [\"ml-1\", \"ml-11\", \"ml-58\"]'],
  ['One-Hot和Target Encoding', 'primaryIds: [\"ml-120\", \"ml-121\", \"ml-129\"]', 'primaryIds: [\"ml-14\", \"ml-135\", \"ml-178\"]'],
  ['离线评估和在线实验的差异', 'primaryIds: [\"ml-108\", \"ml-137\", \"ml-153\"]', 'primaryIds: [\"ml-137\", \"ml-153\", \"ml-163\"]'],
  ['ONNX TensorRT哪个快', 'primaryIds: [\"llm-21\", \"llm-26\", \"llm-25\"]', 'primaryIds: [\"llm-21\", \"llm-26\", \"llm-23\"]'],
  ['Spark join操作特别慢怎么办', 'primaryIds: [\"stats-144\", \"stats-180\", \"stats-187\"]', 'primaryIds: [\"stats-180\", \"stats-187\"]'],
  ['Label Encoding ordinal', 'primaryIds: [\"ml-108\", \"ml-120\", \"ml-121\"]', 'primaryIds: [\"ml-14\", \"ml-135\", \"ml-178\"]'],
];

// For each fix, find the test case by query and replace its primaryIds
let count = 0;
for (const [query, oldPids, newPids] of fixes) {
  const tc = TEST_CASES.find(c => c && c.query && c.query.includes(query));
  if (!tc) { console.log('NOT IN TS: ' + query); continue; }

  // Build old line pattern: query, group, primaryIds
  const oldPidsStr = tc.primaryIds ? JSON.stringify(tc.primaryIds) : '[]';
  const oldSidsStr = tc.secondaryIds ? JSON.stringify(tc.secondaryIds) : '[]';
  
  // Find the exact line in content that matches this test case
  const qEsc = tc.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const gEsc = tc.group.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Just replace the primaryIds in the full content
  if (content.includes('primaryIds: ' + oldPidsStr)) {
    content = content.replace('primaryIds: ' + oldPidsStr, 'primaryIds: ' + newPids);
    count++;
    console.log('Fixed: ' + query);
  } else {
    // Try finding the line more loosely
    const searchStr = 'primaryIds: [' + tc.primaryIds?.join(', ') + ']';
    const replStr = 'primaryIds: ' + newPids;
    if (content.includes(searchStr)) {
      content = content.replace(searchStr, replStr);
      count++;
      console.log('Fixed (loose): ' + query);
    } else {
      console.log('NOT FOUND in file: ' + query + ' — looking for ' + searchStr.slice(0, 80));
    }
  }
}

writeFileSync('src/evaluation/test-cases.ts', content);
console.log('Total: ' + count);

// Verify
import { TEST_CASES as TC2 } from './src/evaluation/test-cases';
console.log('Verification count: ' + TC2.length);
