// backend/src/services/search/concept-dictionary.ts
// Topic → keywords, deck hints, and subtopic expansion for query understanding.

export interface ConceptEntry {
  topic: string;           // normalized topic name
  deckHint?: string;       // suggested deck ID
  subtopics: string[];     // sub-topics for refinement
  keywords: string[];      // expansion keywords for recall
}

const CONCEPTS: ConceptEntry[] = [
  { topic: '数组',      deckHint: 'leetcode', subtopics: ['双指针', '滑动窗口', '前缀和', '二分', '排序'],        keywords: ['array', '数组', '双指针', 'two pointer', '滑动窗口', 'sliding window', '前缀和', 'prefix sum', '二分', 'binary search','排序'] },
  { topic: '哈希表',    deckHint: 'leetcode', subtopics: ['哈希', 'Map', 'Set'],                                   keywords: ['hash', '哈希', '散列表', 'hash table', 'hashmap', 'map', 'set', '计数', '两数之和'] },
  { topic: '字符串',    deckHint: 'leetcode', subtopics: ['回文', '正则', 'KMP'],                                  keywords: ['string', '字符串', 'substring', '回文', 'palindrome', 'KMP', '正则'] },
  { topic: '双指针',    deckHint: 'leetcode', subtopics: ['快慢指针', '对撞指针', '滑动窗口'],                     keywords: ['双指针', 'two pointer', '快慢指针', 'fast slow', '对撞指针', '滑动窗口'] },
  { topic: '动态规划',  deckHint: 'leetcode', subtopics: ['背包', 'DP', '状态转移', '记忆化'],                     keywords: ['动态规划', 'DP', 'dynamic programming', '状态转移', '备忘录', 'memo', '背包', 'knapsack', '子序列', 'subsequence'] },
  { topic: '链表',      deckHint: 'leetcode', subtopics: ['反转', '合并', '快慢指针', '环形'],                     keywords: ['linked list', '链表', '反转', 'reverse', '合并', 'merge', '环形'] },
  { topic: '树',        deckHint: 'leetcode', subtopics: ['二叉树', 'BST', '遍历', 'DFS', 'BFS'],                  keywords: ['tree', '二叉树', 'binary tree', 'BST', '遍历', 'traversal', 'DFS', 'BFS', '层次'] },
  { topic: '栈',        deckHint: 'leetcode', subtopics: ['单调栈', '表达式'],                                    keywords: ['stack', '栈', '单调栈', 'monotonic', '表达式', '括号'] },
  { topic: '队列',      deckHint: 'leetcode', subtopics: ['单调队列', 'BFS'],                                     keywords: ['queue', '队列', '单调队列', 'BFS'] },
  { topic: '图',        deckHint: 'leetcode', subtopics: ['BFS', 'DFS', '拓扑排序', '最短路径'],                  keywords: ['graph', '图', 'BFS', 'DFS', '拓扑排序', 'topological', '最短路径', 'Dijkstra', '并查集', 'union find'] },
  { topic: '递归',      deckHint: 'leetcode', subtopics: ['回溯', '分治'],                                        keywords: ['recursion', '递归', '回溯', 'backtracking', '分治', 'divide conquer'] },
  { topic: '二分',      deckHint: 'leetcode', subtopics: ['二分查找', '二分答案'],                                keywords: ['binary search', '二分', '二分查找', '二分答案', 'lower bound', 'upper bound'] },
  { topic: '排序',      deckHint: 'leetcode', subtopics: ['快排', '归并', '堆排', '桶排'],                         keywords: ['sort', '排序', '快排', 'quick sort', '归并', 'merge sort', '堆排', 'heap sort', '桶排', 'topological'] },
  { topic: '深度学习',  deckHint: 'deep-learning', subtopics: ['CNN', 'RNN', 'Transformer', '反向传播', '损失函数'], keywords: ['深度学习', 'deep learning', 'CNN', 'RNN', 'LSTM', 'transformer', 'attention', '反向传播', 'backprop', '损失', 'loss', '激活函数', 'activation', '梯度', 'gradient', 'batch norm', 'dropout'] },
  { topic: '机器学习',  deckHint: 'machine-learning', subtopics: ['回归', '分类', '聚类', '降维', '过拟合'],        keywords: ['机器学习', 'machine learning', 'ML', '模型', '训练', '特征', 'feature', '过拟合', 'overfitting', '交叉验证', 'cross validation', '回归', 'regression', '分类', 'classification', 'SVM', '随机森林', 'random forest', '决策树', 'decision tree','集成','ensemble','bagging','boosting','GBDT','XGBoost','LightGBM','CatBoost'] },
  { topic: '统计学',    deckHint: 'statistics', subtopics: ['假设检验', '回归', '分布', '贝叶斯'],                  keywords: ['统计', 'statistics', '概率', 'probability', '分布', 'distribution', '假设检验', 'hypothesis', 'p value', '置信区间', 'confidence interval', '贝叶斯', 'bayesian', '回归', 'regression', '方差', 'variance'] },
  { topic: '大模型',    deckHint: 'llm', subtopics: ['GPT', 'Transformer', 'RLHF', 'Prompt'],                      keywords: ['LLM', '大模型', 'GPT', '预训练', 'pretrain', 'fine tune', '微调', 'RLHF', 'prompt', 'tokenizer', 'decoder', 'encoder'] },
  { topic: 'Agent',     deckHint: 'agent', subtopics: ['ReAct', '工具调用', '多Agent'],                            keywords: ['agent', '智能体', 'tool use', '工具调用', 'function call', 'ReAct', 'multi agent', 'planning', 'memory', 'RAG'] },
  { topic: 'SQL',       deckHint: 'machine-learning', subtopics: ['JOIN', '索引', '窗口函数'],                     keywords: ['SQL', '查询', '索引', 'index', 'JOIN', '窗口函数', '聚合', 'group by', 'having'] },
];

const byTopic = new Map<string, ConceptEntry>();
for (const c of CONCEPTS) {
  byTopic.set(c.topic, c);
  // Index by keywords too
  for (const kw of c.keywords) byTopic.set(kw, c);
}

/** Look up concept by any term (topic or keyword). */
export function conceptLookup(term: string): ConceptEntry | undefined {
  // Exact match
  const exact = byTopic.get(term);
  if (exact) return exact;
  // Case-insensitive
  for (const [k, v] of byTopic) {
    if (k.toLowerCase() === term.toLowerCase()) return v;
  }
  // Substring match (shortest first)
  let best: ConceptEntry | undefined;
  for (const [k, v] of byTopic) {
    if (k.includes(term) || term.includes(k)) {
      if (!best || k.length < (best.topic || '').length) best = v;
    }
  }
  return best;
}

export function getAllTopics(): string[] {
  return CONCEPTS.map(c => c.topic);
}
