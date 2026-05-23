// Fix old primaryIds that were always wrong for these coverage_gap queries.
// The old IDs (stats-X, ml-X) were auto-assigned and never matched the query intent.
// New dedicated cards are the correct primaryIds.

import { readFileSync, writeFileSync } from 'fs';

const testCasesPath = __dirname + '/test-cases.ts';
let content = readFileSync(testCasesPath, 'utf-8');

const fixes: { query: string; oldPrimaryIds: string; newPrimaryIds: string }[] = [
  // CAP理论: stats-126 was never a CAP theory card
  { query: 'CAP理论为什么不能三者兼得', oldPrimaryIds: '["stats-126"]', newPrimaryIds: '["ml-190","ml-191"]' },
  // 图数据库: stats-3 was never a graph database card
  { query: '什么时候用图数据库', oldPrimaryIds: '["stats-3"]', newPrimaryIds: '["dl-33","dl-34"]' },
  // 北极星指标: stats-116/163 were never about north star metrics
  { query: '什么是指标体系北极星', oldPrimaryIds: '["stats-116","stats-163"]', newPrimaryIds: '["wp-77","wp-78"]' },
  // ETL ELT: stats-125/116 were never ETL cards
  { query: 'ETL ELT数据集成区别', oldPrimaryIds: '["stats-125","stats-116"]', newPrimaryIds: '["ml-196","ml-197"]' },
  // ETL pipeline: stats-149/152 were never pipeline cards
  { query: 'ETL流程pipeline最佳实践', oldPrimaryIds: '["stats-149","stats-152"]', newPrimaryIds: '["ml-197","ml-196"]' },
  // 大厂技术面: ml-134/136 were never career cards
  { query: '改简历准备大厂技术面', oldPrimaryIds: '["ml-134","ml-136"]', newPrimaryIds: '["wp-80","wp-81"]' },
  // ML面试记忆: ml-110/112 were never about spaced repetition
  { query: '机器学习面试记了又忘怎么办', oldPrimaryIds: '["ml-110","ml-112"]', newPrimaryIds: '["ml-202","ml-203"]' },
  // 传统ML: ml-19/18 are fine but new cards are better primary matches
  { query: '传统ML还有没有必要学', oldPrimaryIds: '["ml-19","ml-18"]', newPrimaryIds: '["ml-205","ml-206"]' },
  // 图像分割部署: dl-6 was never about mobile deployment
  { query: '图像分割手机端部署选什么模型', oldPrimaryIds: '["dl-6"]', newPrimaryIds: '["dl-36","dl-37"]' },
  // 风控建模: stats-3 was never about fraud detection
  { query: '风控建模一般用什么算法', oldPrimaryIds: '["stats-3"]', newPrimaryIds: '["ml-199","ml-200"]' },
  // AI客服隐私: agent-10/11 were never about email privacy
  { query: '用AI回复客户邮件隐私怎么保证', oldPrimaryIds: '["agent-10","agent-11"]', newPrimaryIds: '["agent-27","agent-28"]' },
];

for (const f of fixes) {
  // Find the line with this query
  const regex = new RegExp(`(query: "${f.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}",.*?primaryIds: )${f.oldPrimaryIds.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  const before = content;
  content = content.replace(regex, `$1${f.newPrimaryIds}`);
  if (content !== before) {
    console.log('FIXED:', f.query.slice(0, 40));
  } else {
    console.log('NOT FOUND:', f.query.slice(0, 40));
  }
}

writeFileSync(testCasesPath, content);
console.log('Done. Updated test-cases.ts');
