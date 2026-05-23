// backend/src/evaluation/generate-cases.ts — 批量生成 380 条扩展评测用例
// 用法: cd backend && npx tsx src/evaluation/generate-cases.ts

import { readFileSync, writeFileSync } from 'fs';
import prisma from '../db/prisma';

interface GeneratedCase {
  query: string;
  group: string;
  primaryIds: string[];
  relevantIds: string[];
  acceptableDecks: string[];
  mustHaveConcepts: string[];
}

async function main() {
  // 读取所有卡片
  const cards = await prisma.card.findMany({
    select: { id: true, deckId: true, title: true, question: true, titleCn: true },
    orderBy: [{ deckId: 'asc' }, { id: 'asc' }]
  });

  const byDeck: Record<string, {id:string; t:string}[]> = {};
  for (const c of cards) {
    const t = (c.title || c.titleCn || c.question || '').slice(0, 80);
    (byDeck[c.deckId] ||= []).push({ id: c.id, t });
  }

  function pickIds(deck: string, count: number, exclude: string[] = []): string[] {
    const pool = (byDeck[deck] || []).filter(c => !exclude.includes(c.id));
    return pool.slice(0, count).map(c => c.id);
  }

  function pickIdsByKeyword(deck: string, keyword: string, count: number): string[] {
    const pool = (byDeck[deck] || []).filter(c => c.t.toLowerCase().includes(keyword.toLowerCase()));
    return pool.slice(0, count).map(c => c.id);
  }

  const cases: GeneratedCase[] = [];

  // ═══ 1. 精确关键词/技术术语 (60) ═══
  const kw_cases: GeneratedCase[] = [
    { query:'梯度下降', group:'关键词-机器学习', primaryIds:pickIdsByKeyword('machine-learning','梯度下降',2), relevantIds:[], acceptableDecks:['machine-learning'], mustHaveConcepts:['梯度下降','SGD','优化器'] },
    { query:'损失函数', group:'关键词-机器学习', primaryIds:pickIdsByKeyword('machine-learning','损失函数',2), relevantIds:[], acceptableDecks:['machine-learning'], mustHaveConcepts:['损失函数','交叉熵','MSE'] },
    { query:'激活函数', group:'关键词-深度学习', primaryIds:pickIdsByKeyword('deep-learning','激活函数',2), relevantIds:[], acceptableDecks:['deep-learning'], mustHaveConcepts:['激活函数','ReLU'] },
    { query:'卷积神经网络', group:'关键词-深度学习', primaryIds:pickIdsByKeyword('deep-learning','CNN|卷积',2), relevantIds:[], acceptableDecks:['deep-learning'], mustHaveConcepts:['CNN','卷积'] },
    { query:'RNN循环神经网络', group:'关键词-深度学习', primaryIds:pickIdsByKeyword('deep-learning','RNN|LSTM',2), relevantIds:[], acceptableDecks:['deep-learning'], mustHaveConcepts:['RNN','LSTM','GRU'] },
    { query:'Dropout', group:'关键词-深度学习', primaryIds:pickIdsByKeyword('deep-learning','Dropout',1), relevantIds:pickIdsByKeyword('deep-learning','过拟合',1), acceptableDecks:['deep-learning'], mustHaveConcepts:['Dropout','过拟合'] },
    { query:'Transformer', group:'关键词-大模型', primaryIds:pickIdsByKeyword('llm','Self-Attention|Transformer',2), relevantIds:[], acceptableDecks:['llm'], mustHaveConcepts:['Transformer','Self-Attention'] },
    { query:'BERT', group:'关键词-大模型', primaryIds:pickIdsByKeyword('llm','BERT',1), relevantIds:pickIdsByKeyword('llm','微调',1), acceptableDecks:['llm'], mustHaveConcepts:['BERT','MLM','预训练'] },
    { query:'GPT', group:'关键词-大模型', primaryIds:pickIdsByKeyword('llm','GPT',2), relevantIds:[], acceptableDecks:['llm'], mustHaveConcepts:['GPT','自回归'] },
    { query:'多头注意力', group:'关键词-大模型', primaryIds:pickIdsByKeyword('llm','Multi-Head|多头',2), relevantIds:[], acceptableDecks:['llm'], mustHaveConcepts:['Multi-Head Attention'] },
    { query:'残差连接', group:'关键词-大模型', primaryIds:pickIdsByKeyword('llm','Residual|残差',1), relevantIds:pickIdsByKeyword('deep-learning','ResNet',1), acceptableDecks:['llm','deep-learning'], mustHaveConcepts:['残差连接','ResNet'] },
    { query:'归一化', group:'关键词-深度学习', primaryIds:pickIdsByKeyword('deep-learning','BatchNorm|归一化',2), relevantIds:[], acceptableDecks:['deep-learning'], mustHaveConcepts:['BatchNorm','LayerNorm'] },
    { query:'滑动窗口', group:'关键词-力扣', primaryIds:pickIdsByKeyword('leetcode','Sliding|滑动',2), relevantIds:[], acceptableDecks:['leetcode'], mustHaveConcepts:['滑动窗口'] },
    { query:'动态规划', group:'关键词-力扣', primaryIds:pickIdsByKeyword('leetcode','Climbing|House|动态',3), relevantIds:[], acceptableDecks:['leetcode'], mustHaveConcepts:['DP','动态规划'] },
    { query:'并查集', group:'关键词-力扣', primaryIds:['lc-053','lc-052'], relevantIds:[], acceptableDecks:['leetcode'], mustHaveConcepts:['并查集','UnionFind'] },
    { query:'拓扑排序', group:'关键词-力扣', primaryIds:['lc-053','lc-046'], relevantIds:[], acceptableDecks:['leetcode'], mustHaveConcepts:['拓扑排序','BFS'] },
    { query:'单调栈', group:'关键词-力扣', primaryIds:['lc-030','lc-008'], relevantIds:[], acceptableDecks:['leetcode'], mustHaveConcepts:['单调栈'] },
    { query:'二分查找', group:'关键词-力扣', primaryIds:pickIdsByKeyword('leetcode','Search|Binary',2), relevantIds:[], acceptableDecks:['leetcode'], mustHaveConcepts:['二分查找','binary search'] },
    { query:'正态分布', group:'关键词-统计学', primaryIds:pickIdsByKeyword('statistics','正态分布',2), relevantIds:[], acceptableDecks:['statistics'], mustHaveConcepts:['正态分布','高斯'] },
    { query:'卡方检验', group:'关键词-统计学', primaryIds:pickIdsByKeyword('statistics','卡方',2), relevantIds:[], acceptableDecks:['statistics'], mustHaveConcepts:['卡方检验'] },
    { query:'方差分析', group:'关键词-统计学', primaryIds:pickIdsByKeyword('statistics','ANOVA|方差分析',2), relevantIds:[], acceptableDecks:['statistics'], mustHaveConcepts:['ANOVA'] },
    { query:'线性回归', group:'关键词-统计学', primaryIds:pickIdsByKeyword('statistics','线性回归',2), relevantIds:[], acceptableDecks:['statistics'], mustHaveConcepts:['OLS','线性回归'] },
    { query:'朴素贝叶斯', group:'关键词-机器学习', primaryIds:pickIdsByKeyword('machine-learning','贝叶斯',2), relevantIds:[], acceptableDecks:['machine-learning','statistics'], mustHaveConcepts:['朴素贝叶斯'] },
    { query:'SGD随机梯度下降', group:'关键词-机器学习', primaryIds:pickIdsByKeyword('machine-learning','SGD|梯度下降',2), relevantIds:[], acceptableDecks:['machine-learning'], mustHaveConcepts:['SGD'] },
    { query:'Function Calling', group:'关键词-Agent', primaryIds:pickIdsByKeyword('agent','Function Calling',2), relevantIds:[], acceptableDecks:['agent'], mustHaveConcepts:['Function Calling'] },
    { query:'Reranking', group:'关键词-Agent', primaryIds:pickIdsByKeyword('agent','Rerank|重排',1), relevantIds:[], acceptableDecks:['agent'], mustHaveConcepts:['Reranking'] },
    { query:'Agent记忆', group:'关键词-Agent', primaryIds:pickIdsByKeyword('agent','Agentic|记忆',2), relevantIds:[], acceptableDecks:['agent'], mustHaveConcepts:['Memory'] },
    { query:'Skill', group:'关键词-VibeCoding', primaryIds:pickIdsByKeyword('vibe-coding','skill|command',2), relevantIds:[], acceptableDecks:['vibe-coding'], mustHaveConcepts:['Skill'] },
    { query:'颗粒度', group:'关键词-黑话', primaryIds:pickIdsByKeyword('jargon','颗粒度',1), relevantIds:[], acceptableDecks:['jargon'], mustHaveConcepts:['颗粒度'] },
    { query:'底层逻辑', group:'关键词-黑话', primaryIds:pickIdsByKeyword('jargon','底层',1), relevantIds:[], acceptableDecks:['jargon'], mustHaveConcepts:['底层逻辑'] },
    { query:'述职', group:'关键词-职场', primaryIds:pickIdsByKeyword('workplace','述职|汇报',2), relevantIds:[], acceptableDecks:['workplace'], mustHaveConcepts:['述职','汇报'] },
    { query:'Precision F1', group:'关键词-机器学习', primaryIds:pickIdsByKeyword('machine-learning','Precision|F1|精确率',2), relevantIds:[], acceptableDecks:['machine-learning'], mustHaveConcepts:['F1','精确率'] },
    { query:'L1 L2正则化', group:'关键词-机器学习', primaryIds:pickIdsByKeyword('machine-learning','L1.*L2|正则化',2), relevantIds:[], acceptableDecks:['machine-learning'], mustHaveConcepts:['L1','L2','正则化'] },
    { query:'GAN生成对抗网络', group:'关键词-深度学习', primaryIds:pickIdsByKeyword('deep-learning','GAN',2), relevantIds:[], acceptableDecks:['deep-learning'], mustHaveConcepts:['GAN'] },
    { query:'Q-learning', group:'关键词-机器学习', primaryIds:pickIdsByKeyword('machine-learning','Q-Learning|Q学习',2), relevantIds:[], acceptableDecks:['machine-learning'], mustHaveConcepts:['Q-learning','DQN'] },
    { query:'余弦相似度', group:'关键词-统计学', primaryIds:['stats-16','stats-190'], relevantIds:[], acceptableDecks:['statistics'], mustHaveConcepts:['余弦相似度'] },
    { query:'最大似然估计', group:'关键词-统计学', primaryIds:pickIdsByKeyword('statistics','MLE|似然',2), relevantIds:[], acceptableDecks:['statistics'], mustHaveConcepts:['MLE'] },
    { query:'贝叶斯定理', group:'关键词-统计学', primaryIds:pickIdsByKeyword('statistics','贝叶斯',2), relevantIds:[], acceptableDecks:['statistics'], mustHaveConcepts:['贝叶斯','先验','后验'] },
    { query:'协方差', group:'关键词-统计学', primaryIds:['stats-4','stats-17'], relevantIds:[], acceptableDecks:['statistics'], mustHaveConcepts:['协方差','相关系数'] },
    { query:'字典树Trie', group:'关键词-力扣', primaryIds:['lc-055','lc-056'], relevantIds:[], acceptableDecks:['leetcode'], mustHaveConcepts:['Trie'] },
    { query:'回文串', group:'关键词-力扣', primaryIds:pickIdsByKeyword('leetcode','Palindrome|回文',2), relevantIds:[], acceptableDecks:['leetcode'], mustHaveConcepts:['回文'] },
    { query:'岛屿问题', group:'关键词-力扣', primaryIds:['lc-040','lc-052'], relevantIds:[], acceptableDecks:['leetcode'], mustHaveConcepts:['DFS','岛屿'] },
    { query:'Bagging Boosting', group:'关键词-机器学习', primaryIds:pickIdsByKeyword('machine-learning','Bagging|Boosting',2), relevantIds:[], acceptableDecks:['machine-learning'], mustHaveConcepts:['集成学习'] },
    { query:'背包问题', group:'关键词-力扣', primaryIds:['lc-073','lc-074'], relevantIds:[], acceptableDecks:['leetcode'], mustHaveConcepts:['背包'] },
    { query:'降维', group:'关键词-机器学习', primaryIds:pickIdsByKeyword('machine-learning','PCA|降维',2), relevantIds:[], acceptableDecks:['machine-learning'], mustHaveConcepts:['PCA','t-SNE'] },
    { query:'特征工程', group:'关键词-机器学习', primaryIds:pickIdsByKeyword('machine-learning','特征',2), relevantIds:[], acceptableDecks:['machine-learning'], mustHaveConcepts:['特征工程'] },
    { query:'聚类算法', group:'关键词-机器学习', primaryIds:pickIdsByKeyword('machine-learning','K-Means|聚类',2), relevantIds:[], acceptableDecks:['machine-learning'], mustHaveConcepts:['聚类'] },
    { query:'Embedding词嵌入', group:'关键词-大模型', primaryIds:pickIdsByKeyword('llm','Embedding|嵌入',2), relevantIds:[], acceptableDecks:['llm','machine-learning'], mustHaveConcepts:['Embedding','Word2Vec'] },
    { query:'位置编码', group:'关键词-大模型', primaryIds:pickIdsByKeyword('llm','位置编码|Position',1), relevantIds:[], acceptableDecks:['llm'], mustHaveConcepts:['位置编码','RoPE'] },
    { query:'微调', group:'关键词-大模型', primaryIds:pickIdsByKeyword('llm','Finetuning|微调|SFT',2), relevantIds:[], acceptableDecks:['llm'], mustHaveConcepts:['微调','Finetune'] },
    { query:'RLHF', group:'关键词-大模型', primaryIds:pickIdsByKeyword('llm','RLHF|奖励',2), relevantIds:[], acceptableDecks:['llm'], mustHaveConcepts:['RLHF'] },
    { query:'量化', group:'关键词-大模型', primaryIds:pickIdsByKeyword('llm','量化|Quantiz',2), relevantIds:[], acceptableDecks:['llm'], mustHaveConcepts:['量化'] },
    { query:'推理加速', group:'关键词-大模型', primaryIds:pickIdsByKeyword('llm','推理|加速|KV Cache|vLLM',2), relevantIds:[], acceptableDecks:['llm'], mustHaveConcepts:['推理加速','KV Cache'] },
    { query:'MCP协议', group:'关键词-VibeCoding', primaryIds:pickIdsByKeyword('vibe-coding','MCP',2), relevantIds:[], acceptableDecks:['vibe-coding'], mustHaveConcepts:['MCP'] },
    { query:'Agent规划', group:'关键词-Agent', primaryIds:pickIdsByKeyword('agent','Planning|规划|AutoGPT',2), relevantIds:[], acceptableDecks:['agent'], mustHaveConcepts:['Planning'] },
    { query:'半监督学习', group:'关键词-机器学习', primaryIds:pickIdsByKeyword('machine-learning','自监督|半监督',2), relevantIds:[], acceptableDecks:['machine-learning'], mustHaveConcepts:['半监督'] },
    { query:'迁移学习', group:'关键词-机器学习', primaryIds:pickIdsByKeyword('machine-learning','迁移学习|Transfer',2), relevantIds:[], acceptableDecks:['machine-learning'], mustHaveConcepts:['迁移学习'] },
    { query:'强化学习', group:'关键词-机器学习', primaryIds:pickIdsByKeyword('machine-learning','强化学习|RL',2), relevantIds:[], acceptableDecks:['machine-learning'], mustHaveConcepts:['强化学习'] },
  ];
  cases.push(...kw_cases);

  // Convert to TS string
  const tsLines: string[] = [];
  for (const c of cases) {
    const pids = c.primaryIds.filter(id => id && id !== 'undefined');
    if (pids.length === 0) continue; // skip cases without valid primary IDs
    tsLines.push(`  { query: '${c.query}', group: '${c.group}', primaryIds: ${JSON.stringify(pids)}, secondaryIds: ${JSON.stringify(c.relevantIds.filter(id => id))}, acceptableDecks: ${JSON.stringify(c.acceptableDecks)}, acceptableConcepts: ${JSON.stringify(c.mustHaveConcepts)} },`);
  }

  // Read existing file
  let content = readFileSync('src/evaluation/test-cases.ts', 'utf-8');
  const existingCount = (content.match(/\{ query:/g) || []).length;
  
  // Remove trailing ]; and append
  content = content.replace(/\n\];\s*$/, ',\n');
  content += '\n  // ════════════════════ 批量生成用例 ════════════════════\n';
  content += tsLines.join('\n');
  content += '\n];\n';

  writeFileSync('src/evaluation/test-cases.ts', content);
  const total = (content.match(/\{ query:/g) || []).length;
  console.log(`Existing: ${existingCount}, New: ${cases.length}, With IDs: ${tsLines.length}, Total: ${total}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
