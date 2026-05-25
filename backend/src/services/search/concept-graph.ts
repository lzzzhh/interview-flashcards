// backend/src/services/search/concept-graph.ts
// Lightweight in-memory concept graph for query understanding, keyword tiering,
// learning-path prerequisite expansion, and eval concept-level matching.

export type RelationType = 'parent' | 'child' | 'prerequisite' | 'related' | 'alias' | 'implementation' | 'contrast' | 'foundation' | 'advanced';

export interface Relation { type: RelationType; target: string; weight?: number; }

export interface ConceptNode {
  id: string; canonical: string; aliases: string[];
  deckHint?: string; parentCategory?: string;
  coreKeywords: string[]; searchAliases: string[];
  relations: Relation[];
}

export interface KeywordTiers {
  coreKeywords: string[]; expandedKeywords: string[];
  prerequisiteKeywords: string[]; lowPriorityKeywords: string[];
}

// ── Graph Construction ──

const NODES: ConceptNode[] = [
  // ====== 机器学习概念 ======
  { id: 'ensemble', canonical: '集成学习', aliases: ['集成学习', 'ensemble learning'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['集成学习', 'ensemble learning'], searchAliases: ['ensemble', '模型融合', '元学习', 'meta learning'],
    relations: [
      { type: 'parent', target: 'ml' },
      { type: 'child', target: 'bagging' }, { type: 'child', target: 'boosting' }, { type: 'child', target: 'stacking' },
      { type: 'implementation', target: 'random_forest' }, { type: 'implementation', target: 'gbdt' }, { type: 'implementation', target: 'xgboost' },
      { type: 'related', target: 'decision_tree' }, { type: 'related', target: 'overfitting' }, { type: 'related', target: 'feature_importance' },
    ]},
  { id: 'xgboost', canonical: 'XGBoost', aliases: ['XGBoost', 'xgboost', 'extreme gradient boosting'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['XGBoost', 'extreme gradient boosting'], searchAliases: ['xgboost', 'xgb', 'extreme gradient boosting'],
    relations: [
      { type: 'parent', target: 'gbdt' }, { type: 'parent', target: 'boosting' },
      { type: 'child', target: 'ml' }, { type: 'related', target: 'random_forest' }, { type: 'related', target: 'feature_importance' },
      { type: 'related', target: 'regularization' },
    ]},
  { id: 'random_forest', canonical: '随机森林', aliases: ['随机森林', 'random forest'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['随机森林', 'random forest'], searchAliases: ['random forest', 'rf', 'bagging ensemble'],
    relations: [
      { type: 'parent', target: 'bagging' }, { type: 'child', target: 'decision_tree' },
      { type: 'related', target: 'feature_importance' }, { type: 'contrast', target: 'gbdt' },
    ]},
  { id: 'bagging', canonical: 'Bagging', aliases: ['Bagging', 'bagging', 'bootstrap aggregating'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['Bagging', 'bootstrap'], searchAliases: ['bagging', 'bootstrap', 'bootstrap aggregating'],
    relations: [
      { type: 'parent', target: 'ensemble' },
      { type: 'child', target: 'random_forest' },
      { type: 'related', target: 'overfitting' },
    ]},
  { id: 'boosting', canonical: 'Boosting', aliases: ['Boosting', 'boosting'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['Boosting', '梯度提升', 'gradient boosting'], searchAliases: ['boosting', 'gradient boosting', 'sequential', '加法模型'],
    relations: [
      { type: 'parent', target: 'ensemble' },
      { type: 'child', target: 'gbdt' },
      { type: 'related', target: 'overfitting' },
    ]},
  { id: 'gbdt', canonical: 'GBDT', aliases: ['GBDT', 'gradient boosted decision trees'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['GBDT', 'gradient boosting'], searchAliases: ['gbdt', 'gradient boosting', 'mart', 'tree boosting'],
    relations: [
      { type: 'parent', target: 'boosting' },
      { type: 'child', target: 'xgboost' },
      { type: 'related', target: 'decision_tree' },
    ]},
  { id: 'decision_tree', canonical: '决策树', aliases: ['决策树', 'decision tree'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['决策树', 'decision tree'], searchAliases: ['decision tree', 'cart', 'c45', 'id3', 'tree model'],
    relations: [
      { type: 'foundation', target: 'random_forest' }, { type: 'foundation', target: 'gbdt' },
      { type: 'related', target: 'overfitting' }, { type: 'related', target: 'regularization' },
    ]},
  { id: 'overfitting', canonical: '过拟合', aliases: ['过拟合', 'overfitting'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['过拟合', 'overfitting'], searchAliases: ['overfitting', 'overfit', 'bias variance', 'high variance', '泛化'],
    relations: [
      { type: 'related', target: 'regularization' }, { type: 'related', target: 'decision_tree' },
      { type: 'related', target: 'cross_validation' },
    ]},
  { id: 'regularization', canonical: '正则化', aliases: ['正则化', 'regularization'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['正则化', 'regularization'], searchAliases: ['regularization', 'L1', 'L2', 'ridge', 'lasso', 'elastic net', 'dropout', 'weight decay'],
    relations: [
      { type: 'related', target: 'overfitting' },
    ]},
  { id: 'feature_importance', canonical: '特征重要性', aliases: ['特征重要性', 'feature importance'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['特征重要性', 'feature importance'], searchAliases: ['feature importance', 'shap', 'impurity', 'permutation', 'importance score'],
    relations: [
      { type: 'related', target: 'random_forest' }, { type: 'related', target: 'xgboost' },
    ]},

  // ====== 图算法 ======
  { id: 'graph_algorithm', canonical: '图算法', aliases: ['图算法', '图', 'graph algorithm', 'graph'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['图算法', 'graph algorithm'], searchAliases: ['graph', '图', 'graphtheory', '图论'],
    relations: [
      { type: 'child', target: 'bfs' }, { type: 'child', target: 'dfs' },
      { type: 'child', target: 'shortest_path' }, { type: 'child', target: 'topo_sort' },
    ]},
  { id: 'bfs', canonical: 'BFS', aliases: ['BFS', '广度优先搜索', 'breadth first search'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['BFS', '广度优先搜索', 'breadth first search'], searchAliases: ['bfs', '广度', 'breadth first', '层序', 'level order', 'queue'],
    relations: [
      { type: 'parent', target: 'graph_algorithm' }, { type: 'contrast', target: 'dfs' },
      { type: 'related', target: 'shortest_path' },
    ]},
  { id: 'dfs', canonical: 'DFS', aliases: ['DFS', '深度优先搜索', 'depth first search'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['DFS', '深度优先搜索', 'depth first search'], searchAliases: ['dfs', '深度', 'depth first', 'backtrack', '递归', 'stack'],
    relations: [
      { type: 'parent', target: 'graph_algorithm' }, { type: 'contrast', target: 'bfs' },
      { type: 'related', target: 'backtracking' },
    ]},
  { id: 'shortest_path', canonical: '最短路', aliases: ['最短路', 'shortest path'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['最短路', 'shortest path'], searchAliases: ['shortest path', 'Dijkstra', 'Bellman Ford', 'Floyd', 'A*'],
    relations: [
      { type: 'parent', target: 'graph_algorithm' },
      { type: 'related', target: 'bfs' },
    ]},
  { id: 'topo_sort', canonical: '拓扑排序', aliases: ['拓扑排序', 'topological sort'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['拓扑排序', 'topological sort'], searchAliases: ['topological', 'topo', 'DAG', 'indegree', '入度'],
    relations: [
      { type: 'parent', target: 'graph_algorithm' },
      { type: 'related', target: 'bfs' }, { type: 'related', target: 'dfs' },
    ]},

  // ====== 数据结构 ======
  { id: 'hash_table', canonical: '哈希表', aliases: ['哈希表', 'hash table'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['哈希表', 'hash table', 'hashmap', 'hash map'], searchAliases: ['hash', '散列', 'map', 'dict', 'dictionary', 'set'],
    relations: [
      { type: 'related', target: 'array' }, { type: 'contrast', target: 'two_pointer' },
    ]},
  { id: 'array', canonical: '数组', aliases: ['数组', 'array'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['数组', 'array'], searchAliases: ['array', 'list', 'vector', '连续', '下标', '索引'],
    relations: [
      { type: 'related', target: 'hash_table' },
      { type: 'related', target: 'two_pointer' }, { type: 'related', target: 'sliding_window' },
      { type: 'foundation', target: 'dynamic_programming' },
    ]},
  { id: 'two_pointer', canonical: '双指针', aliases: ['双指针', 'two pointer'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['双指针', 'two pointer'], searchAliases: ['two pointer', '对撞', '快慢', '相向', '同向'],
    relations: [
      { type: 'related', target: 'sliding_window' }, { type: 'contrast', target: 'hash_table' },
    ]},
  { id: 'sliding_window', canonical: '滑动窗口', aliases: ['滑动窗口', 'sliding window'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['滑动窗口', 'sliding window'], searchAliases: ['sliding window', '窗口', '定长', '不定长'],
    relations: [
      { type: 'related', target: 'two_pointer' },
    ]},
  { id: 'dynamic_programming', canonical: '动态规划', aliases: ['动态规划', 'DP', 'dynamic programming'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['动态规划', 'DP', 'dynamic programming'], searchAliases: ['dp', '状态转移', '最优子结构', '子问题', '背包', '子序列'],
    relations: [
      { type: 'foundation', target: 'array' },
    ]},

  // ====== LLM/Agent ======
  { id: 'transformer', canonical: 'Transformer', aliases: ['Transformer', 'transformer'], deckHint: 'deep-learning', parentCategory: '深度学习',
    coreKeywords: ['Transformer', 'transformer architecture'], searchAliases: ['transformer', 'attention is all you need'],
    relations: [
      { type: 'child', target: 'attention' },
      { type: 'foundation', target: 'rag' }, { type: 'foundation', target: 'agent' },
    ]},
  { id: 'attention', canonical: 'Attention', aliases: ['Attention', '注意力机制', 'attention mechanism'], deckHint: 'deep-learning', parentCategory: '深度学习',
    coreKeywords: ['Attention', '注意力', 'attention mechanism'], searchAliases: ['attention', 'self attention', 'multi head', 'qkv', 'query key value'],
    relations: [
      { type: 'parent', target: 'transformer' },
      { type: 'implementation', target: 'transformer' },
    ]},
  { id: 'rag', canonical: 'RAG', aliases: ['RAG', 'retrieval augmented generation'], deckHint: 'agent', parentCategory: 'Agent',
    coreKeywords: ['RAG', 'retrieval augmented generation'], searchAliases: ['rag', '检索增强', 'vector search', 'knowledge base', 'embedding'],
    relations: [
      { type: 'related', target: 'embedding' }, { type: 'related', target: 'vector_db' },
      { type: 'contrast', target: 'agent' },
    ]},
  { id: 'agent', canonical: 'Agent', aliases: ['Agent', '智能体', 'AI Agent'], deckHint: 'agent', parentCategory: 'Agent',
    coreKeywords: ['Agent', '智能体', 'AI agent'], searchAliases: ['agent', '智能体', 'autonomous', 'ReAct', 'tool use', 'function calling', 'planning', 'memory'],
    relations: [
      { type: 'contrast', target: 'rag' },
      { type: 'related', target: 'rag' },
    ]},
  { id: 'embedding', canonical: 'Embedding', aliases: ['Embedding', '嵌入', '向量表示'], deckHint: 'agent', parentCategory: '大模型',
    coreKeywords: ['Embedding', '嵌入', '向量'], searchAliases: ['embedding', 'vector', 'representation', 'sentence embedding'],
    relations: [
      { type: 'related', target: 'vector_db' }, { type: 'related', target: 'rag' },
    ]},
  { id: 'vector_db', canonical: 'Vector DB', aliases: ['Vector DB', '向量数据库'], deckHint: 'agent', parentCategory: '大模型',
    coreKeywords: ['Vector DB', '向量数据库'], searchAliases: ['vector db', 'Milvus', 'Pinecone', 'Faiss', 'ANN', 'approximate nearest neighbor', '索引'],
    relations: [
      { type: 'related', target: 'embedding' },
    ]},

  // Parent categories (kept separate, never used as canonicalTopic)
  { id: 'ml', canonical: '机器学习', aliases: ['机器学习', 'machine learning'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['机器学习', 'machine learning'], searchAliases: ['ml', 'machine learning', 'predictive modeling', 'statistical learning'],
    relations: [
      { type: 'child', target: 'ensemble' },
    ]},
  { id: 'backtracking', canonical: '回溯', aliases: ['回溯', '回溯算法', 'backtracking'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['回溯', 'backtracking'], searchAliases: ['backtracking', '递归', 'DFS', '剪枝', 'permutation', 'combination'],
    relations: [{ type: 'related', target: 'dfs' }] },
  { id: 'reinforcement_learning', canonical: '强化学习', aliases: ['强化学习', 'reinforcement learning', 'RL'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['强化学习', 'reinforcement learning', 'RL'], searchAliases: ['rl', 'agent', 'environment', 'reward', 'Q-learning', 'policy', 'value', 'Bellman'],
    relations: [{ type: 'related', target: 'ml' }] },
  { id: 'pca', canonical: 'PCA', aliases: ['PCA', 'principal component analysis'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['PCA', 'principal component analysis'], searchAliases: ['pca', '降维', 'eigenvalue', '主成分', 'variance'],
    relations: [] },
  { id: 'feature_engineering', canonical: '特征工程', aliases: ['特征工程', 'feature engineering'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['特征工程', 'feature engineering'], searchAliases: ['feature', '特征选择', '特征提取', '特征缩放', '编码', '缺失值'],
    relations: [] },
  { id: 'cross_validation', canonical: '交叉验证', aliases: ['交叉验证', 'cross validation'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['交叉验证', 'cross validation'], searchAliases: ['cross val', 'k-fold', 'holdout', 'LOOCV'],
    relations: [{ type: 'related', target: 'overfitting' }] },
  { id: 'logistic_regression', canonical: '逻辑回归', aliases: ['逻辑回归', 'logistic regression'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['逻辑回归', 'logistic regression'], searchAliases: ['logistic', 'sigmoid', '二分类', 'odds'],
    relations: [] },
  { id: 'linear_regression', canonical: '线性回归', aliases: ['线性回归', 'linear regression'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['线性回归', 'linear regression'], searchAliases: ['linear', 'OLS', 'least squares', 'R方'],
    relations: [] },
  { id: 'knn', canonical: 'KNN', aliases: ['KNN', 'k nearest neighbors'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['KNN', 'k nearest neighbors'], searchAliases: ['knn', '距离', '欧氏', '惰性学习'],
    relations: [] },
  { id: 'kmeans', canonical: 'KMeans', aliases: ['KMeans', 'k均值'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['KMeans', 'k均值'], searchAliases: ['kmeans', '聚类', 'elbow', '轮廓系数'],
    relations: [] },
  { id: 'svm', canonical: 'SVM', aliases: ['SVM', 'support vector machine'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['SVM', 'support vector machine'], searchAliases: ['svm', '核函数', '最大间隔', 'KKT'],
    relations: [] },
  { id: 'cnn', canonical: 'CNN', aliases: ['CNN', 'convolutional neural network'], deckHint: 'deep-learning', parentCategory: '深度学习',
    coreKeywords: ['CNN', 'convolutional neural network'], searchAliases: ['cnn', '卷积', 'pooling', 'feature map'],
    relations: [] },
  { id: 'rnn', canonical: 'RNN', aliases: ['RNN', 'recurrent neural network', 'LSTM'], deckHint: 'deep-learning', parentCategory: '深度学习',
    coreKeywords: ['RNN', 'recurrent neural network', 'LSTM'], searchAliases: ['rnn', 'lstm', 'gru', '序列', 'sequence'],
    relations: [] },
  { id: 'batchnorm', canonical: 'BatchNorm', aliases: ['BatchNorm', 'batch normalization'], deckHint: 'deep-learning', parentCategory: '深度学习',
    coreKeywords: ['BatchNorm', 'batch normalization'], searchAliases: ['batchnorm', 'normalization', 'layernorm'],
    relations: [] },
  { id: 'dropout', canonical: 'Dropout', aliases: ['Dropout', 'drop out'], deckHint: 'deep-learning', parentCategory: '深度学习',
    coreKeywords: ['Dropout'], searchAliases: ['dropout', 'inverted'],
    relations: [{ type: 'related', target: 'regularization' }] },
  { id: 'optimizer', canonical: '优化器', aliases: ['优化器', 'optimizer'], deckHint: 'deep-learning', parentCategory: '深度学习',
    coreKeywords: ['优化器', 'optimizer'], searchAliases: ['SGD', 'Adam', 'RMSprop', 'momentum', '学习率'],
    relations: [] },
  { id: 'loss_function', canonical: '损失函数', aliases: ['损失函数', 'loss function'], deckHint: 'deep-learning', parentCategory: '深度学习',
    coreKeywords: ['损失函数', 'loss function'], searchAliases: ['交叉熵', 'MSE', 'hinge', 'focal'],
    relations: [] },
  { id: 'dl', canonical: '深度学习', aliases: ['深度学习', 'deep learning'], deckHint: 'deep-learning', parentCategory: '深度学习',
    coreKeywords: ['深度学习', 'deep learning'], searchAliases: ['deep learning', '神经网络', '反向传播', 'gradient'],
    relations: [{ type: 'child', target: 'cnn' }, { type: 'child', target: 'rnn' }, { type: 'child', target: 'transformer' }] },
  { id: 'sql', canonical: 'SQL', aliases: ['SQL'], deckHint: 'statistics', parentCategory: '数据科学',
    coreKeywords: ['SQL'], searchAliases: ['sql', 'query', 'join', 'group by', 'window', '索引'],
    relations: [] },
  { id: 'data_science', canonical: '数据科学', aliases: ['数据科学', 'data science'], deckHint: 'statistics', parentCategory: '数据科学',
    coreKeywords: ['数据科学', 'data science'], searchAliases: ['data science', 'SQL', 'Python', 'pandas', '统计'],
    relations: [] },
];

// ── Graph Index ──
const nodeById = new Map<string, ConceptNode>();
const nodeByAlias = new Map<string, string>(); // alias → id

for (const n of NODES) {
  nodeById.set(n.id, n);
  nodeByAlias.set(n.canonical.toLowerCase(), n.id);
  for (const a of n.aliases) nodeByAlias.set(a.toLowerCase(), n.id);
}

// ── Helpers ──

function walkEdges(fromId: string, types: RelationType[], depth: number): Set<string> {
  const visited = new Set<string>();
  const queue: Array<{ id: string; d: number }> = [{ id: fromId, d: 0 }];
  visited.add(fromId);
  while (queue.length > 0) {
    const { id, d } = queue.shift()!;
    if (d >= depth) continue;
    const node = nodeById.get(id);
    if (!node) continue;
    for (const r of node.relations) {
      if (!types.includes(r.type)) continue;
      const next = r.target;
      if (!visited.has(next)) {
        visited.add(next);
        queue.push({ id: next, d: d + 1 });
      }
    }
  }
  visited.delete(fromId);
  return visited;
}

// ── Public API ──

/** Look up concept node by any alias */
export function conceptGraphLookup(term: string): ConceptNode | undefined {
  const id = nodeByAlias.get(term.toLowerCase());
  return id ? nodeById.get(id) : undefined;
}

/** Check if term matches any concept (for eval concept-level matching) */
export function conceptGraphMatches(term: string, conceptId: string): boolean {
  const id = nodeByAlias.get(term.toLowerCase());
  if (!id) return false;
  if (id === conceptId) return true;
  const root = nodeById.get(conceptId);
  if (!root) return false;
  return root.aliases.some(a => a.toLowerCase() === term.toLowerCase());
}

/** Get all aliases for a concept (for eval concept-level matching) */
export function getConceptAliases(conceptId: string): string[] {
  const node = nodeById.get(conceptId);
  if (!node) return [];
  return [...node.aliases, ...node.searchAliases];
}

/** Build tiered keywords from graph traversal */
export function buildKeywordTiersFromGraph(
  topicId: string,
  mode: 'search' | 'learning_path' = 'search'
): KeywordTiers {
  const node = nodeById.get(topicId);
  if (!node) {
    return { coreKeywords: [], expandedKeywords: [], prerequisiteKeywords: [], lowPriorityKeywords: [] };
  }

  const core = new Set(node.coreKeywords);
  const expanded = new Set<string>();
  const prereq = new Set<string>();
  const lowPrio = new Set<string>();

  const maxDepth = mode === 'learning_path' ? 2 : 1;
  // Parent category → lowPriority only
  const parents = walkEdges(topicId, ['parent'], 1);
  for (const pid of parents) {
    const pn = nodeById.get(pid);
    if (pn) {
      if (pn.parentCategory === pn.canonical) {
        // This is a broad parent category — only low priority
        for (const k of pn.coreKeywords) lowPrio.add(k);
        for (const k of pn.searchAliases) lowPrio.add(k);
      }
    }
  }

  // Children → expanded (search mode) or core (LP mode)
  const children = walkEdges(topicId, ['child'], 2);
  for (const cid of children) {
    const cn = nodeById.get(cid);
    if (cn) {
      for (const k of cn.coreKeywords) { if (!core.has(k)) expanded.add(k); }
    }
  }

  // Learning-path specific
  if (mode === 'learning_path') {
    const foundation = walkEdges(topicId, ['foundation'], 2);
    for (const fid of foundation) {
      const fn = nodeById.get(fid);
      if (fn) { for (const k of fn.coreKeywords) prereq.add(k); for (const k of fn.searchAliases) prereq.add(k); }
    }

    const prerequisites = walkEdges(topicId, ['prerequisite'], 2);
    for (const pid of prerequisites) {
      const pn = nodeById.get(pid);
      if (pn) { for (const k of pn.coreKeywords) prereq.add(k); }
    }
  }

  // Related → expanded (search) or prereq (LP)
  const related = walkEdges(topicId, ['related', 'implementation'], 2);
  for (const rid of related) {
    const rn = nodeById.get(rid);
    if (rn) {
      if (mode === 'learning_path') {
        for (const k of rn.coreKeywords) prereq.add(k);
      } else {
        for (const k of rn.searchAliases) expanded.add(k);
      }
    }
  }

  // Contrast → expanded (informational)
  const contrasts = walkEdges(topicId, ['contrast'], 1);
  for (const cid of contrasts) {
    const cn = nodeById.get(cid);
    if (cn) {
      for (const k of cn.coreKeywords) { if (!core.has(k)) expanded.add(k); }
    }
  }

  return {
    coreKeywords: [...core],
    expandedKeywords: [...expanded],
    prerequisiteKeywords: mode === 'learning_path' ? [...prereq] : [],
    lowPriorityKeywords: [...lowPrio],
  };
}

/** Get graph trace info for debug */
export function getGraphTrace(topicId: string) {
  const node = nodeById.get(topicId);
  if (!node) return { hit: false };
  return {
    hit: true, nodeId: node.id, canonical: node.canonical,
    parentCategory: node.parentCategory,
    relationsUsed: node.relations.map(r => `${r.type}:${r.target}`),
  };
}

// ── Adapter Interfaces ──

export interface GraphResolveResult {
  conceptGraphHit: boolean;
  graphNodeId?: string;
  canonicalTopic: string;
  aliases: string[];
  deckHint?: string;
  parentCategory?: string;
  matchedAlias?: string;
  confidence: number;
}

export interface RelatedConcept {
  id: string;
  canonical: string;
  relationType: RelationType;
  weight: number;
}

/** Resolve a raw topic string through the concept graph */
export function resolveConceptFromGraph(rawTopic: string): GraphResolveResult {
  const id = nodeByAlias.get(rawTopic.toLowerCase());
  if (!id) {
    return { conceptGraphHit: false, canonicalTopic: rawTopic, aliases: [], confidence: 0 };
  }
  const node = nodeById.get(id)!;
  return {
    conceptGraphHit: true,
    graphNodeId: node.id,
    canonicalTopic: node.canonical,
    aliases: [...node.aliases],
    deckHint: node.deckHint,
    parentCategory: node.parentCategory,
    matchedAlias: rawTopic !== node.canonical ? rawTopic : undefined,
    confidence: 0.9,
  };
}

/** Get all equivalent terms (aliases + searchAliases) for a concept */
export function getConceptEquivalents(topicOrId: string): { canonical: string; aliases: string[]; equivalentTerms: string[] } {
  const node = nodeById.get(topicOrId) || nodeById.get(nodeByAlias.get(topicOrId.toLowerCase()) || '');
  if (!node) return { canonical: topicOrId, aliases: [], equivalentTerms: [topicOrId] };
  return {
    canonical: node.canonical,
    aliases: [...node.aliases],
    equivalentTerms: [...node.aliases, ...node.searchAliases],
  };
}

/** Get related concepts by relation type */
export function getRelatedConcepts(
  topicId: string,
  relationTypes: RelationType[] = ['related', 'child', 'implementation'],
  maxDepth: number = 1
): RelatedConcept[] {
  const visited = walkEdges(topicId, relationTypes, maxDepth);
  const result: RelatedConcept[] = [];
  for (const vid of visited) {
    const vnode = nodeById.get(vid);
    if (vnode) {
      const rel = vnode.relations.find(r => r.target === topicId);
      result.push({
        id: vnode.id, canonical: vnode.canonical,
        relationType: rel?.type || 'related',
        weight: rel?.weight || 0.5,
      });
    }
  }
  return result;
}

/** Build tiered keywords with token limits */
export function buildKeywordTiersFromGraphWithLimits(
  topicId: string,
  mode: 'search' | 'learning-path' | 'compare' = 'search'
): KeywordTiers & { graphRelationsUsed: string[] } {
  const node = nodeById.get(topicId);
  if (!node) return { coreKeywords: [], expandedKeywords: [], prerequisiteKeywords: [], lowPriorityKeywords: [], graphRelationsUsed: [] };

  const maxDepth = mode === 'learning-path' ? 2 : 1;
  const core = new Set(node.coreKeywords);
  const expanded = new Set<string>();
  const prereq = new Set<string>();
  const lowPrio = new Set<string>();
  const relUsed: string[] = [];

  // Parent → lowPriority only (never in main recall)
  const parents = walkEdges(topicId, ['parent'], 1);
  for (const pid of parents) {
    const pn = nodeById.get(pid);
    if (pn) {
      if (pn.parentCategory === pn.canonical) {
        for (const k of pn.coreKeywords) lowPrio.add(k);
        for (const k of pn.searchAliases) lowPrio.add(k);
        relUsed.push(`parent:${pid}`);
      }
    }
  }

  // Children → expanded
  const children = walkEdges(topicId, ['child'], maxDepth);
  for (const cid of children) {
    const cn = nodeById.get(cid);
    if (cn) {
      for (const k of cn.coreKeywords) { if (!core.has(k)) expanded.add(k); }
      relUsed.push(`child:${cid}`);
    }
  }

  // Learning-path specific
  if (mode === 'learning-path') {
    const foundation = walkEdges(topicId, ['foundation'], maxDepth);
    for (const fid of foundation) {
      const fn = nodeById.get(fid);
      if (fn) { for (const k of fn.coreKeywords) prereq.add(k); for (const k of fn.searchAliases) prereq.add(k); relUsed.push(`foundation:${fid}`); }
    }
    const prerequisites = walkEdges(topicId, ['prerequisite'], maxDepth);
    for (const pid of prerequisites) {
      const pn = nodeById.get(pid);
      if (pn) { for (const k of pn.coreKeywords) prereq.add(k); relUsed.push(`prerequisite:${pid}`); }
    }
  }

  // Related/implementation → expanded
  const related = walkEdges(topicId, ['related', 'implementation'], maxDepth);
  for (const rid of related) {
    const rn = nodeById.get(rid);
    if (rn) {
      if (mode === 'learning-path') {
        for (const k of rn.coreKeywords) prereq.add(k);
      } else {
        for (const k of rn.searchAliases) expanded.add(k);
      }
      relUsed.push(`${rn.relations.find(r => r.target === topicId)?.type || 'related'}:${rid}`);
    }
  }

  // Contrast → expanded (informational, small)
  if (mode === 'compare') {
    const contrasts = walkEdges(topicId, ['contrast'], 1);
    for (const cid of contrasts) {
      const cn = nodeById.get(cid);
      if (cn) { for (const k of cn.coreKeywords) { if (!core.has(k)) expanded.add(k); } relUsed.push(`contrast:${cid}`); }
    }
  }

  // Apply limits
  const MAX_EXPANDED = 16, MAX_PREREQ = 12, MAX_LOW = 8;
  return {
    coreKeywords: [...core],
    expandedKeywords: [...expanded].slice(0, MAX_EXPANDED),
    prerequisiteKeywords: mode === 'learning-path' ? [...prereq].slice(0, MAX_PREREQ) : [],
    lowPriorityKeywords: [...lowPrio].slice(0, MAX_LOW),
    graphRelationsUsed: relUsed,
  };
}
