import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('src/evaluation/test-cases.ts', 'utf-8');

const fixes: [string, string, string][] = [
  ['岛屿问题', 'primaryIds: [\"lc-052\", \"lc-040\"]', 'primaryIds: [\"lc-052\"]'],
  ['损失函数\", group: \"关键词-机器学习', 'primaryIds: [\"ml-1\", \"ml-5\", \"ml-142\", \"ml-144\"]', 'primaryIds: [\"ml-1\", \"ml-53\", \"ml-142\", \"ml-143\"]'],
  ['迁移学习', 'primaryIds: [\"ml-149\", \"ml-147\"]', 'primaryIds: [\"ml-149\", \"ml-151\", \"ml-177\"]'],
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
  ['贪心搜索和束搜索对比', 'primaryIds: [\"llm-22\", \"llm-25\"]', 'primaryIds: [\"llm-22\"]'],
  ['Spark join操作特别慢怎么办', 'primaryIds: [\"stats-144\", \"stats-180\", \"stats-187\"]', 'primaryIds: [\"stats-180\", \"stats-187\"]'],
  ['Label Encoding ordinal', 'primaryIds: [\"ml-108\", \"ml-120\", \"ml-121\"]', 'primaryIds: [\"ml-14\", \"ml-135\", \"ml-178\"]'],
];

let count = 0;
for (const [query, old, replacement] of fixes) {
  if (content.includes(old)) {
    content = content.replace(old, replacement);
    count++;
    console.log('Fixed: ' + query);
  } else {
    console.log('NOT FOUND: ' + query);
  }
}

writeFileSync('src/evaluation/test-cases.ts', content);
console.log('Total: ' + count);
