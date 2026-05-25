// backend/src/services/search/concept-dictionary.ts
// Data-driven concept dictionary — reads from SearchTopic table + hardcoded fallback for specific concepts

import prisma from '../../db/prisma';

export interface ConceptEntry {
  topic: string;
  canonicalTopic?: string;
  deckHint?: string;
  parentCategory?: string;
  subtopics: string[];
  coreKeywords: string[];
  expandedKeywords: string[];
  lowPriorityKeywords: string[];
  /** Learning-path: foundational/prerequisite keywords for beginner cards */
  prerequisiteKeywords?: string[];
}

let cachedTopics: ConceptEntry[] | null = null;
let cacheTime = 0;

// ── Hardcoded concept dictionary for specific terms not in DB ──

const STATIC_CONCEPTS: ConceptEntry[] = [
  // Specific ML algorithms
  { topic: 'XGBoost', canonicalTopic: 'XGBoost', deckHint: 'machine-learning', parentCategory: '机器学习',
    subtopics: [], coreKeywords: ['XGBoost', 'extreme gradient boosting'],
    expandedKeywords: ['GBDT', 'gradient boosting', 'boosting', 'decision tree', 'tree boosting', 'regularization', 'feature importance'],
    lowPriorityKeywords: ['机器学习', '分类', '回归'] },
  { topic: 'xgboost', canonicalTopic: 'XGBoost', deckHint: 'machine-learning', parentCategory: '机器学习',
    subtopics: [], coreKeywords: ['XGBoost', 'extreme gradient boosting'],
    expandedKeywords: ['GBDT', 'gradient boosting', 'boosting', 'decision tree', 'tree boosting'],
    lowPriorityKeywords: ['机器学习', '分类', '回归'] },

  { topic: 'LightGBM', canonicalTopic: 'LightGBM', deckHint: 'machine-learning', parentCategory: '机器学习',
    subtopics: [], coreKeywords: ['LightGBM', 'light gbm'],
    expandedKeywords: ['GBDT', 'gradient boosting', 'boosting', 'decision tree', 'leaf-wise'],
    lowPriorityKeywords: ['机器学习'] },
  { topic: 'lightgbm', canonicalTopic: 'LightGBM', deckHint: 'machine-learning', parentCategory: '机器学习',
    subtopics: [], coreKeywords: ['LightGBM', 'light gbm'],
    expandedKeywords: ['GBDT', 'gradient boosting', 'boosting'],
    lowPriorityKeywords: ['机器学习'] },

  { topic: 'CatBoost', canonicalTopic: 'CatBoost', deckHint: 'machine-learning', parentCategory: '机器学习',
    subtopics: [], coreKeywords: ['CatBoost', 'cat boost'],
    expandedKeywords: ['GBDT', 'gradient boosting', 'boosting', 'categorical features'],
    lowPriorityKeywords: ['机器学习'] },
  { topic: 'catboost', canonicalTopic: 'CatBoost', deckHint: 'machine-learning', parentCategory: '机器学习',
    subtopics: [], coreKeywords: ['CatBoost'], expandedKeywords: ['GBDT', 'gradient boosting'], lowPriorityKeywords: ['机器学习'] },

  // Specific concepts
  { topic: '深度学习', canonicalTopic: '深度学习', deckHint: 'deep-learning', parentCategory: '深度学习',
    subtopics: ['CNN', 'RNN', 'Transformer'],
    coreKeywords: ['深度学习', 'deep learning'],
    expandedKeywords: ['CNN', 'RNN', 'LSTM', 'Transformer', '反向传播', '梯度下降', '激活函数', '损失函数'],
    lowPriorityKeywords: [],
    prerequisiteKeywords: ['神经网络', '感知机', '激活函数', '梯度下降', '前馈', '反向传播'] },
  { topic: '集成学习', canonicalTopic: '集成学习', deckHint: 'machine-learning', parentCategory: '机器学习',
    subtopics: ['Bagging', 'Boosting', 'Stacking'],
    coreKeywords: ['集成学习', 'ensemble learning'],
    expandedKeywords: ['Bagging', 'Boosting', 'Stacking', '随机森林', 'GBDT', 'XGBoost', 'LightGBM', 'CatBoost', '梯度提升', '模型融合', '投票法'],
    lowPriorityKeywords: ['机器学习', '分类', '回归', '过拟合', '特征重要性', '特征工程', '特征选择', '降维'],
    prerequisiteKeywords: ['决策树', 'bias-variance', '过拟合', '交叉验证'] },
  { topic: 'ensemble learning', canonicalTopic: '集成学习', deckHint: 'machine-learning', parentCategory: '机器学习',
    subtopics: [], coreKeywords: ['集成学习', 'ensemble learning'],
    expandedKeywords: ['Bagging', 'Boosting', 'Stacking'], lowPriorityKeywords: ['机器学习'] },

  { topic: '哈希表', canonicalTopic: '哈希表', deckHint: 'leetcode', parentCategory: '算法',
    subtopics: ['哈希', 'Map'], coreKeywords: ['哈希表', 'hash table', 'hashmap', 'hash map'],
    expandedKeywords: ['哈希', '散列表', 'dictionary', 'map', 'set', '计数', '频率', '两数之和', '前缀和', '字母异位词'],
    lowPriorityKeywords: ['算法', '数据结构'] },

  { topic: '数组', canonicalTopic: '数组', deckHint: 'leetcode', parentCategory: '算法',
    subtopics: [], coreKeywords: ['数组', 'array'],
    expandedKeywords: ['双指针', '滑动窗口', '前缀和', '矩阵'],
    lowPriorityKeywords: ['算法', '数据结构'] },

  { topic: '动态规划', canonicalTopic: '动态规划', deckHint: 'leetcode', parentCategory: '算法',
    subtopics: [], coreKeywords: ['动态规划', 'DP', 'dynamic programming'],
    expandedKeywords: ['状态转移', '最优子结构', '子问题', '背包', '子序列'],
    lowPriorityKeywords: ['算法'] },

  { topic: 'RAG', canonicalTopic: 'RAG', deckHint: 'agent', parentCategory: 'Agent',
    subtopics: [], coreKeywords: ['RAG', 'retrieval augmented generation'],
    expandedKeywords: ['检索增强生成', 'vector search', 'embedding', 'document retrieval', 'chunking'],
    lowPriorityKeywords: ['AI', '大模型', 'Agent'] },
  { topic: 'rag', canonicalTopic: 'RAG', deckHint: 'agent', parentCategory: 'Agent',
    subtopics: [], coreKeywords: ['RAG', 'retrieval augmented generation'],
    expandedKeywords: ['检索增强生成', 'vector search', 'embedding'],
    lowPriorityKeywords: ['AI', '大模型'] },

  { topic: 'Transformer', canonicalTopic: 'Transformer', deckHint: 'deep-learning', parentCategory: '深度学习',
    subtopics: ['Attention', 'Encoder-Decoder'], coreKeywords: ['Transformer', 'transformer architecture'],
    expandedKeywords: ['attention', 'self-attention', 'multi-head', 'encoder', 'decoder', 'positional encoding'],
    lowPriorityKeywords: ['深度学习', '大模型', 'NLP'] },

  // P2: New concept dictionary entries
  { topic: '假设检验', canonicalTopic: '假设检验', deckHint: 'statistics', parentCategory: '统计学',
    subtopics: [], coreKeywords: ['假设检验', 'hypothesis testing'],
    expandedKeywords: ['p值', 'p-value', '显著性水平', '原假设', '备择假设', 'Type I error', 'Type II error', '置信区间', 't检验', 'z检验'],
    lowPriorityKeywords: ['统计学'] },
  { topic: '强化学习', canonicalTopic: '强化学习', deckHint: 'machine-learning', parentCategory: '机器学习',
    subtopics: [], coreKeywords: ['强化学习', 'reinforcement learning', 'RL'],
    expandedKeywords: ['agent', 'environment', 'reward', 'policy', 'value function', 'Q-learning', 'Bellman equation', 'temporal difference', 'TD learning', 'MDP', 'DQN', 'policy gradient'],
    lowPriorityKeywords: ['机器学习', 'AI'] },
  { topic: 'Q-learning', canonicalTopic: 'Q-learning', deckHint: 'machine-learning', parentCategory: '机器学习',
    subtopics: [], coreKeywords: ['Q-learning', 'Q value', 'Q函数'],
    expandedKeywords: ['Bellman equation', 'temporal difference', 'TD learning', 'Q table', 'DQN', 'policy iteration'],
    lowPriorityKeywords: ['机器学习', '强化学习'] },
  { topic: '置信区间', canonicalTopic: '置信区间', deckHint: 'statistics', parentCategory: '统计学',
    subtopics: [], coreKeywords: ['置信区间', 'confidence interval'],
    expandedKeywords: ['标准误', '抽样分布', '显著性水平', 'z值', '区间估计', '点估计'],
    lowPriorityKeywords: ['统计学'] },
  { topic: '图像分类', canonicalTopic: '图像分类', deckHint: 'deep-learning', parentCategory: '深度学习',
    subtopics: [], coreKeywords: ['图像分类', 'image classification'],
    expandedKeywords: ['CNN', 'ResNet', 'ViT', 'data augmentation', 'transfer learning', 'ImageNet'],
    lowPriorityKeywords: ['深度学习', '计算机视觉'] },
  { topic: 'SQL', canonicalTopic: 'SQL', deckHint: 'statistics', parentCategory: '数据科学',
    subtopics: [], coreKeywords: ['SQL', 'query'],
    expandedKeywords: ['JOIN', 'GROUP BY', 'window function', 'aggregation', '子查询', 'HAVING', 'WHERE', '索引', 'index'],
    lowPriorityKeywords: [] },
  { topic: 'pandas', canonicalTopic: 'pandas', deckHint: 'statistics', parentCategory: '数据科学',
    subtopics: [], coreKeywords: ['pandas', 'dataframe'],
    expandedKeywords: ['groupby', 'merge', 'missing values', 'dropna', 'fillna', 'apply', 'concat', 'pivot table'],
    lowPriorityKeywords: ['Python', '数据科学'] },
  { topic: '数据清洗', canonicalTopic: '数据清洗', deckHint: 'statistics', parentCategory: '数据科学',
    subtopics: [], coreKeywords: ['数据清洗', 'data cleaning'],
    expandedKeywords: ['missing value', 'outlier', 'normalization', '标准化', '编码', '数据预处理'],
    lowPriorityKeywords: [] },
  { topic: '反向传播', canonicalTopic: '反向传播', deckHint: 'deep-learning', parentCategory: '深度学习',
    subtopics: [], coreKeywords: ['反向传播', 'backpropagation'],
    expandedKeywords: ['链式法则', '梯度消失', '梯度爆炸', 'autograd', '计算图'],
    lowPriorityKeywords: ['深度学习'] },
  { topic: '梯度下降', canonicalTopic: '梯度下降', deckHint: 'deep-learning', parentCategory: '深度学习',
    subtopics: [], coreKeywords: ['梯度下降', 'gradient descent'],
    expandedKeywords: ['SGD', 'Adam', '学习率', 'momentum', 'mini-batch', 'convergence', '学习率调度'],
    lowPriorityKeywords: ['深度学习', '优化'] },
  { topic: '贪心', canonicalTopic: '贪心', deckHint: 'leetcode', parentCategory: '算法',
    subtopics: [], coreKeywords: ['贪心', 'greedy'],
    expandedKeywords: ['greedy algorithm', '区间调度', '最优子结构', '货呵问题'],
    lowPriorityKeywords: ['算法'] },
  { topic: 'PCA', canonicalTopic: 'PCA', deckHint: 'machine-learning', parentCategory: '机器学习',
    subtopics: [], coreKeywords: ['PCA', 'principal component analysis'],
    expandedKeywords: ['降维', '特征值', '主成分', 'eigenvalue', '方差解释率', '奇异值分解'],
    lowPriorityKeywords: ['机器学习'] },
  { topic: '正则化', canonicalTopic: '正则化', deckHint: 'machine-learning', parentCategory: '机器学习',
    subtopics: [], coreKeywords: ['正则化', 'regularization'],
    expandedKeywords: ['L1', 'L2', 'lasso', 'ridge', 'dropout', '权重衰减', 'elastic net', 'early stopping'],
    lowPriorityKeywords: ['机器学习'] },
  { topic: '逻辑回归', canonicalTopic: '逻辑回归', deckHint: 'machine-learning', parentCategory: '机器学习',
    subtopics: [], coreKeywords: ['逻辑回归', 'logistic regression'],
    expandedKeywords: ['sigmoid', '二分类', 'softmax', '多分类', 'odds ratio', '对数几率'],
    lowPriorityKeywords: ['机器学习'] },
  { topic: '线性回归', canonicalTopic: '线性回归', deckHint: 'machine-learning', parentCategory: '机器学习',
    subtopics: [], coreKeywords: ['线性回归', 'linear regression'],
    expandedKeywords: ['最小二乘法', 'OLS', 'R方', '残差', '多元回归', '多重共线性'],
    lowPriorityKeywords: ['机器学习'] },
  { topic: '随机森林', canonicalTopic: '随机森林', deckHint: 'machine-learning', parentCategory: '机器学习',
    subtopics: [], coreKeywords: ['随机森林', 'random forest'],
    expandedKeywords: ['决策树', 'bagging', '特征采样', 'out-of-bag', 'random subspace'],
    lowPriorityKeywords: ['机器学习'] },
  { topic: '决策树', canonicalTopic: '决策树', deckHint: 'machine-learning', parentCategory: '机器学习',
    subtopics: [], coreKeywords: ['决策树', 'decision tree'],
    expandedKeywords: ['信息增益', '基尼系数', '剪枝', 'CART', 'ID3', 'C4.5'],
    lowPriorityKeywords: ['机器学习'] },
  { topic: 'KNN', canonicalTopic: 'KNN', deckHint: 'machine-learning', parentCategory: '机器学习',
    subtopics: [], coreKeywords: ['KNN', 'k nearest neighbors'],
    expandedKeywords: ['距离度量', '欧氏距离', '曼哈顿距离', 'KD树', '惰性学习'],
    lowPriorityKeywords: ['机器学习'] },
  { topic: 'KMeans', canonicalTopic: 'KMeans', deckHint: 'machine-learning', parentCategory: '机器学习',
    subtopics: [], coreKeywords: ['KMeans', 'k均值'],
    expandedKeywords: ['聚类', 'elbow method', '轮廓系数', 'kmeans++'],
    lowPriorityKeywords: ['机器学习'] },
];

const STATIC_LOOKUP = new Map<string, ConceptEntry>();
for (const c of STATIC_CONCEPTS) {
  STATIC_LOOKUP.set(c.topic.toLowerCase(), c);
}

async function loadDBTopics(): Promise<ConceptEntry[]> {
  if (cachedTopics && Date.now() - cacheTime < 300_000) return cachedTopics;
  const rows = await prisma.searchTopic.findMany({ where: { enabled: true }, orderBy: { tagCount: 'desc' } });
  cachedTopics = rows.map(r => ({
    topic: r.name, deckHint: r.deckHint || undefined,
    subtopics: safeParse(r.subtopics),
    coreKeywords: safeParse(r.keywords),
    expandedKeywords: [],
    lowPriorityKeywords: [],
  }));
  cacheTime = Date.now();
  return cachedTopics;
}

function safeParse(s: string): string[] { try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; } }

export async function conceptLookup(term: string): Promise<ConceptEntry | undefined> {
  const tLower = term.toLowerCase().trim();
  if (!tLower) return undefined;

  // 1. Static dictionary (specific concepts)
  const staticMatch = STATIC_LOOKUP.get(tLower);
  if (staticMatch) return staticMatch;

  // 2. DB topics (broader card-tag-based topics)
  const dbTopics = await loadDBTopics();
  for (const t of dbTopics) {
    if (t.topic.toLowerCase() === tLower) return t;
  }
  for (const t of dbTopics) {
    if (t.coreKeywords.some(k => k.toLowerCase() === tLower)) return t;
  }

  return undefined;
}

export async function getAllTopics(): Promise<string[]> {
  return [...STATIC_LOOKUP.keys(), ...(await loadDBTopics()).map(t => t.topic)];
}
