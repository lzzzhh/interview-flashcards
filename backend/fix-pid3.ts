import { TEST_CASES } from './src/evaluation/test-cases';
import { writeFileSync } from 'fs';

const pidFixes: Record<string, string[]> = {
  '损失函数': ['ml-1', 'ml-53', 'ml-142', 'ml-143'],
  '风控建模一般用什么算法': ['ml-128'],
  '怎么设计数据指标体系': ['stats-167', 'stats-168', 'jargon-33'],
  '时间序列季节性怎么处理': ['stats-88', 'stats-90', 'stats-91'],
  'AUC PR-AUC区别什么情况用哪个': ['ml-9', 'ml-49', 'ml-137'],
  'One-hot Encoding有什么问题': ['ml-14', 'ml-28', 'ml-42'],
  'ROC AUC曲线解释': ['ml-9', 'ml-49', 'ml-137'],
  'AUC和F1衡量指标的区别': ['ml-9', 'ml-49', 'ml-185'],
  'MSE和MAE损失函数对比': ['ml-53', 'ml-60', 'ml-72'],
  'Mini Batch vs Full Batch训练': ['ml-1', 'ml-11', 'ml-58'],
  'One-Hot和Target Encoding': ['ml-14', 'ml-135', 'ml-178'],
  '离线评估和在线实验的差异': ['ml-137', 'ml-153', 'ml-163'],
  'ONNX TensorRT哪个快': ['llm-21', 'llm-26', 'llm-23'],
  'Spark join操作特别慢怎么办': ['stats-180', 'stats-187'],
  'Label Encoding ordinal': ['ml-14', 'ml-135', 'ml-178'],
};

let count = 0;
for (const tc of TEST_CASES) {
  if (!tc || !tc.query) continue;
  for (const [q, newPids] of Object.entries(pidFixes)) {
    if (tc.query.includes(q) && tc.primaryIds) {
      tc.primaryIds = newPids;
      tc.secondaryIds = (tc.secondaryIds || []).filter(id => !newPids.includes(id));
      count++;
      break;
    }
  }
}

// Rebuild file
const header = `// backend/src/evaluation/test-cases.ts — ${TEST_CASES.length} 条 AI 搜索评测测试集
//
// Cleaned + label-audited + primaryId-fixed
//
// 牌组 ID：leetcode=力扣, statistics=统计学, machine-learning=机器学习
//          deep-learning=深度学习, llm=大模型, agent=Agent
//          vibe-coding=Vibe Coding, jargon=黑话, workplace=职场

import type { TestCase } from './types';

export const TEST_CASES: TestCase[] = [
`;

const entries = TEST_CASES.map(tc => {
  if (!tc) return '';
  const pid = JSON.stringify(tc.primaryIds || []);
  const sid = JSON.stringify(tc.secondaryIds || []);
  const decks = JSON.stringify(tc.acceptableDecks || []);
  const concepts = JSON.stringify(tc.acceptableConcepts || []);
  return `  { query: ${JSON.stringify(tc.query)}, group: ${JSON.stringify(tc.group)}, primaryIds: ${pid}, secondaryIds: ${sid}, acceptableDecks: ${decks}, acceptableConcepts: ${concepts} },\n`;
}).join('\n');

const footer = '\n];\n';
writeFileSync('src/evaluation/test-cases.ts', header + entries + footer);

console.log('Fixed ' + count + ' primaryIds');
console.log('Total: ' + TEST_CASES.length);
