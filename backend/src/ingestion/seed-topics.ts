// backend/src/ingestion/seed-topics.ts
// Aggregates Card.tags → SearchTopic table (data-driven concept dictionary)
import prisma from '../db/prisma';

// Manual mapping: tag patterns → canonical topic + deck hint
// Everything here comes from the actual Card.tags data.
interface TopicSeed {
  name: string; deckHint: string;
  tagPatterns: string[];   // any card tag matching these → this topic
  subtopics: string[];     // topic refinement sub-categories
  extraKeywords: string[]; // additional search keywords
}

const TOPIC_SEEDS: TopicSeed[] = [
  { name: '数组', deckHint: 'leetcode', tagPatterns: ['数组', 'array', '双指针', '滑动窗口', '前缀和', '矩阵'], subtopics: ['双指针', '滑动窗口', '前缀和'], extraKeywords: ['two pointer', 'sliding window', 'prefix sum'] },
  { name: '哈希表', deckHint: 'leetcode', tagPatterns: ['哈希', '哈希表', 'hash', 'Map', 'Set', '散列', '计数'], subtopics: ['哈希', 'Map'], extraKeywords: ['hash table', 'hashmap'] },
  { name: '字符串', deckHint: 'leetcode', tagPatterns: ['字符串', 'string', '回文', '正则', 'KMP', '子串'], subtopics: ['回文', '子串'], extraKeywords: ['palindrome', 'substring'] },
  { name: '动态规划', deckHint: 'leetcode', tagPatterns: ['动态规划', 'DP', '背包', '状态转移', '记忆化', 'dp'], subtopics: ['背包', '记忆化'], extraKeywords: ['dynamic programming', 'knapsack', 'memo'] },
  { name: '链表', deckHint: 'leetcode', tagPatterns: ['链表', 'linked list', '反转', '合并'], subtopics: ['反转', '合并'], extraKeywords: ['linked list', 'reverse'] },
  { name: '树', deckHint: 'leetcode', tagPatterns: ['树', 'tree', '二叉树', 'BST', '遍历', '二叉'], subtopics: ['二叉树', '遍历'], extraKeywords: ['binary tree', 'traversal', 'DFS', 'BFS'] },
  { name: '栈', deckHint: 'leetcode', tagPatterns: ['栈', 'stack', '单调栈', '括号', '表达式'], subtopics: ['单调栈'], extraKeywords: ['monotonic stack'] },
  { name: '队列', deckHint: 'leetcode', tagPatterns: ['队列', 'queue', '单调队列'], subtopics: ['单调队列'], extraKeywords: ['monotonic queue'] },
  { name: '图', deckHint: 'leetcode', tagPatterns: ['图', 'graph', '拓扑', 'BFS', 'DFS', '并查集', '最短路径'], subtopics: ['拓扑排序', '最短路径', '并查集'], extraKeywords: ['Dijkstra', 'union find', 'topological sort'] },
  { name: '排序', deckHint: 'leetcode', tagPatterns: ['排序', 'sort', '快排', '归并', '堆排', '桶排'], subtopics: ['快排', '归并'], extraKeywords: ['quick sort', 'merge sort', 'heap sort'] },
  { name: '二分', deckHint: 'leetcode', tagPatterns: ['二分', 'binary search', '二分查找'], subtopics: [], extraKeywords: ['binary search', 'lower bound'] },
  { name: '递归', deckHint: 'leetcode', tagPatterns: ['递归', 'recursion', '回溯', '分治'], subtopics: ['回溯', '分治'], extraKeywords: ['backtracking', 'divide conquer'] },
  { name: '深度学习', deckHint: 'deep-learning', tagPatterns: ['深度学习', 'deep learning', 'CNN', 'RNN', 'LSTM', 'transformer', '反向传播', '损失函数', '梯度', '激活函数'], subtopics: ['CNN', 'RNN', 'Transformer', '反向传播'], extraKeywords: ['backprop', 'activation', 'loss', 'batch norm', 'dropout', 'attention'] },
  { name: '机器学习', deckHint: 'machine-learning', tagPatterns: ['机器学习', 'machine learning', 'ML', '回归', '分类', '聚类', '降维', '过拟合', '特征', 'SVM', '随机森林', '决策树', 'GBDT', 'XGBoost', '集成', '贝叶斯', 'bagging', 'boosting'], subtopics: ['回归', '分类', '聚类', '降维', '过拟合'], extraKeywords: ['regression', 'classification', 'overfitting', 'cross validation', 'random forest', 'decision tree', 'ensemble'] },
  { name: '统计学', deckHint: 'statistics', tagPatterns: ['统计', 'statistics', '概率', '分布', '假设检验', '置信区间', '方差', '贝叶斯'], subtopics: ['假设检验', '分布', '概率'], extraKeywords: ['probability', 'distribution', 'hypothesis', 'p value', 'confidence interval'] },
  { name: '大模型', deckHint: 'llm', tagPatterns: ['LLM', '大模型', 'GPT', 'transformer', '预训练', '微调', 'RLHF', 'prompt', 'tokenizer'], subtopics: ['GPT', '预训练', '微调'], extraKeywords: ['pretrain', 'fine tune', 'decoder', 'encoder'] },
  { name: 'Agent', deckHint: 'agent', tagPatterns: ['Agent', '智能体', '工具调用', 'ReAct', '多Agent', 'RAG', 'memory', 'planning'], subtopics: ['ReAct', '工具调用', 'RAG'], extraKeywords: ['tool use', 'function call', 'multi agent'] },
  { name: 'SQL', deckHint: 'machine-learning', tagPatterns: ['SQL', '数据库', '索引', 'JOIN', '窗口函数'], subtopics: ['JOIN', '索引'], extraKeywords: ['query', 'index', 'group by'] },
  { name: 'Git', deckHint: 'workplace', tagPatterns: ['Git', '版本控制', '分支', 'merge', 'rebase'], subtopics: [], extraKeywords: ['version control', 'commit'] },
];

export async function seedTopics() {
  console.log('[seed] Building topic dictionary from Card.tags...');

  // 1. Fetch all unique tags from Card table
  const rows = await prisma.$queryRawUnsafe(
    `SELECT DISTINCT tags FROM Card WHERE tags IS NOT NULL AND tags != ''`
  ) as { tags: string }[];

  const allTags = new Set<string>();
  for (const row of rows) {
    try {
      const tags: string[] = JSON.parse(row.tags);
      for (const t of tags) allTags.add(t.trim());
    } catch {}
  }
  console.log(`[seed] Found ${allTags.size} unique card tags`);

  // 2. Map tags to topics
  const topicMap = new Map<string, { tagCount: number; allTags: Set<string> }>();

  for (const seed of TOPIC_SEEDS) {
    topicMap.set(seed.name, { tagCount: 0, allTags: new Set() });
  }

  // Count how many cards match each topic
  for (const tag of allTags) {
    const tagLower = tag.toLowerCase();
    for (const seed of TOPIC_SEEDS) {
      if (seed.tagPatterns.some(p => tagLower === p.toLowerCase() || tagLower.includes(p.toLowerCase()) || p.toLowerCase().includes(tagLower))) {
        const t = topicMap.get(seed.name)!;
        t.tagCount++;
        t.allTags.add(tag);
      }
    }
  }

  // 3. Upsert SearchTopic rows
  let created = 0, updated = 0;

  for (const seed of TOPIC_SEEDS) {
    const info = topicMap.get(seed.name)!;
    if (info.tagCount === 0) continue;

    const keywords = [
      ...new Set([...seed.tagPatterns, ...info.allTags, ...seed.extraKeywords])
    ];
    const subtopics = seed.subtopics;

    const existing = await prisma.searchTopic.findUnique({ where: { name: seed.name } });
    if (existing) {
      await prisma.searchTopic.update({
        where: { name: seed.name },
        data: { keywords: JSON.stringify(keywords), subtopics: JSON.stringify(subtopics), tagCount: info.tagCount, deckHint: seed.deckHint },
      });
      updated++;
    } else {
      await prisma.searchTopic.create({
        data: {
          name: seed.name, deckHint: seed.deckHint,
          keywords: JSON.stringify(keywords), subtopics: JSON.stringify(subtopics),
          tagCount: info.tagCount, enabled: true,
        },
      });
      created++;
    }
  }

  console.log(`[seed] Topics: ${created} created, ${updated} updated`);
  await prisma.$disconnect();
}

// Run directly
if (process.argv[1]?.endsWith('seed-topics.ts')) {
  seedTopics().catch(console.error);
}
