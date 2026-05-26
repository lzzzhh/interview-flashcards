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
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'xgboost', canonical: 'XGBoost', aliases: ['XGBoost', 'xgboost', 'extreme gradient boosting'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['XGBoost', 'extreme gradient boosting'], searchAliases: ['xgboost', 'xgb', 'extreme gradient boosting'],
    relations: [
      { type: 'parent', target: 'gbdt' }, { type: 'parent', target: 'boosting' },
      { type: 'child', target: 'ml' }, { type: 'related', target: 'random_forest' }, { type: 'related', target: 'feature_importance' },
      { type: 'related', target: 'regularization' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'random_forest', canonical: '随机森林', aliases: ['随机森林', 'random forest'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['随机森林', 'random forest'], searchAliases: ['random forest', 'rf', 'bagging ensemble'],
    relations: [
      { type: 'parent', target: 'bagging' }, { type: 'child', target: 'decision_tree' },
      { type: 'related', target: 'feature_importance' }, { type: 'contrast', target: 'gbdt' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'bagging', canonical: 'Bagging', aliases: ['Bagging', 'bagging', 'bootstrap aggregating'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['Bagging', 'bootstrap'], searchAliases: ['bagging', 'bootstrap', 'bootstrap aggregating'],
    relations: [
      { type: 'parent', target: 'ensemble' },
      { type: 'child', target: 'random_forest' },
      { type: 'related', target: 'overfitting' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'boosting', canonical: 'Boosting', aliases: ['Boosting', 'boosting'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['Boosting', '梯度提升', 'gradient boosting'], searchAliases: ['boosting', 'gradient boosting', 'sequential', '加法模型'],
    relations: [
      { type: 'parent', target: 'ensemble' },
      { type: 'child', target: 'gbdt' },
      { type: 'related', target: 'overfitting' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'gbdt', canonical: 'GBDT', aliases: ['GBDT', 'gradient boosted decision trees'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['GBDT', 'gradient boosting'], searchAliases: ['gbdt', 'gradient boosting', 'mart', 'tree boosting'],
    relations: [
      { type: 'parent', target: 'boosting' },
      { type: 'child', target: 'xgboost' },
      { type: 'related', target: 'decision_tree' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'decision_tree', canonical: '决策树', aliases: ['决策树', 'decision tree'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['决策树', 'decision tree'], searchAliases: ['decision tree', 'cart', 'c45', 'id3', 'tree model'],
    relations: [
      { type: 'foundation', target: 'random_forest' }, { type: 'foundation', target: 'gbdt' },
      { type: 'related', target: 'overfitting' }, { type: 'related', target: 'regularization' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'overfitting', canonical: '过拟合', aliases: ['过拟合', 'overfitting'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['过拟合', 'overfitting'], searchAliases: ['overfitting', 'overfit', 'bias variance', 'high variance', '泛化'],
    relations: [
      { type: 'related', target: 'regularization' }, { type: 'related', target: 'decision_tree' },
      { type: 'related', target: 'cross_validation' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'regularization', canonical: '正则化', aliases: ['正则化', 'regularization'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['正则化', 'regularization'], searchAliases: ['regularization', 'L1', 'L2', 'ridge', 'lasso', 'elastic net', 'dropout', 'weight decay'],
    relations: [
      { type: 'related', target: 'overfitting' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'feature_importance', canonical: '特征重要性', aliases: ['特征重要性', 'feature importance'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['特征重要性', 'feature importance'], searchAliases: ['feature importance', 'shap', 'impurity', 'permutation', 'importance score'],
    relations: [
      { type: 'related', target: 'random_forest' }, { type: 'related', target: 'xgboost' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },

  // ====== 图算法 ======
  { id: 'graph_algorithm', canonical: '图算法', aliases: ['图算法', '图', 'graph algorithm', 'graph', 'graph theory', '图论'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['图算法', 'graph algorithm'], searchAliases: ['graph', '图', 'graphtheory', '图论'],
    relations: [
      { type: 'child', target: 'bfs' }, { type: 'child', target: 'dfs' },
      { type: 'child', target: 'shortest_path' }, { type: 'child', target: 'topo_sort' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'bfs', canonical: 'BFS', aliases: ['BFS', '广度优先搜索', 'breadth first search'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['BFS', '广度优先搜索', 'breadth first search'], searchAliases: ['bfs', '广度', 'breadth first', '层序', 'level order', 'queue'],
    relations: [
      { type: 'parent', target: 'graph_algorithm' }, { type: 'contrast', target: 'dfs' },
      { type: 'related', target: 'shortest_path' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'dfs', canonical: 'DFS', aliases: ['DFS', '深度优先搜索', 'depth first search'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['DFS', '深度优先搜索', 'depth first search'], searchAliases: ['dfs', '深度', 'depth first', 'backtrack', '递归', 'stack'],
    relations: [
      { type: 'parent', target: 'graph_algorithm' }, { type: 'contrast', target: 'bfs' },
      { type: 'related', target: 'backtracking' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'shortest_path', canonical: '最短路', aliases: ['最短路', 'shortest path'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['最短路', 'shortest path'], searchAliases: ['shortest path', 'Dijkstra', 'Bellman Ford', 'Floyd', 'A*'],
    relations: [
      { type: 'parent', target: 'graph_algorithm' },
      { type: 'related', target: 'bfs' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'topo_sort', canonical: '拓扑排序', aliases: ['拓扑排序', 'topological sort'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['拓扑排序', 'topological sort'], searchAliases: ['topological', 'topo', 'DAG', 'indegree', '入度'],
    relations: [
      { type: 'parent', target: 'graph_algorithm' },
      { type: 'related', target: 'bfs' }, { type: 'related', target: 'dfs' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },

  // ====== 数据结构 ======
  { id: 'hash_table', canonical: '哈希表', aliases: ['哈希表', 'hash table'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['哈希表', 'hash table', 'hashmap', 'hash map'], searchAliases: ['hash', '散列', 'map', 'dict', 'dictionary', 'set'],
    relations: [
      { type: 'related', target: 'array' }, { type: 'contrast', target: 'two_pointer' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'array', canonical: '数组', aliases: ['数组', 'array'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['数组', 'array'], searchAliases: ['array', 'list', 'vector', '连续', '下标', '索引'],
    relations: [
      { type: 'related', target: 'hash_table' },
      { type: 'related', target: 'two_pointer' }, { type: 'related', target: 'sliding_window' },
      { type: 'foundation', target: 'dynamic_programming' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'two_pointer', canonical: '双指针', aliases: ['双指针', 'two pointer'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['双指针', 'two pointer'], searchAliases: ['two pointer', '对撞', '快慢', '相向', '同向'],
    relations: [
      { type: 'related', target: 'sliding_window' }, { type: 'contrast', target: 'hash_table' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'sliding_window', canonical: '滑动窗口', aliases: ['滑动窗口', 'sliding window'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['滑动窗口', 'sliding window'], searchAliases: ['sliding window', '窗口', '定长', '不定长'],
    relations: [
      { type: 'related', target: 'two_pointer' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'dynamic_programming', canonical: '动态规划', aliases: ['动态规划', 'DP', 'dynamic programming'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['动态规划', 'DP', 'dynamic programming'], searchAliases: ['dp', '状态转移', '最优子结构', '子问题', '背包', '子序列'],
    relations: [
      { type: 'foundation', target: 'array' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },

  // ====== LLM/Agent ======
  { id: 'transformer', canonical: 'Transformer', aliases: ['Transformer', 'transformer'], deckHint: 'deep-learning', parentCategory: '深度学习',
    coreKeywords: ['Transformer', 'transformer architecture'], searchAliases: ['transformer', 'attention is all you need'],
    relations: [
      { type: 'child', target: 'attention' },
      { type: 'foundation', target: 'rag' }, { type: 'foundation', target: 'agent' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'attention', canonical: 'Attention', aliases: ['Attention', '注意力机制', 'attention mechanism'], deckHint: 'deep-learning', parentCategory: '深度学习',
    coreKeywords: ['Attention', '注意力', 'attention mechanism'], searchAliases: ['attention', 'self attention', 'multi head', 'qkv', 'query key value'],
    relations: [
      { type: 'parent', target: 'transformer' },
      { type: 'implementation', target: 'transformer' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'rag', canonical: 'RAG', aliases: ['RAG', 'retrieval augmented generation'], deckHint: 'agent', parentCategory: 'Agent',
    coreKeywords: ['RAG', 'retrieval augmented generation'], searchAliases: ['rag', '检索增强', 'vector search', 'knowledge base', 'embedding'],
    relations: [
      { type: 'related', target: 'embedding' }, { type: 'related', target: 'vector_db' },
      { type: 'contrast', target: 'agent' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'agent', canonical: 'Agent', aliases: ['Agent', '智能体', 'AI Agent'], deckHint: 'agent', parentCategory: 'Agent',
    coreKeywords: ['Agent', '智能体', 'AI agent'], searchAliases: ['agent', '智能体', 'autonomous', 'ReAct', 'tool use', 'function calling', 'planning', 'memory', 'react', 'tool call', '工具调用'],
    relations: [
      { type: 'contrast', target: 'rag' },
      { type: 'related', target: 'rag' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'embedding', canonical: 'Embedding', aliases: ['Embedding', '嵌入', '向量表示'], deckHint: 'agent', parentCategory: '大模型',
    coreKeywords: ['Embedding', '嵌入', '向量'], searchAliases: ['embedding', 'vector', 'representation', 'sentence embedding'],
    relations: [
      { type: 'related', target: 'vector_db' }, { type: 'related', target: 'rag' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
  { id: 'vector_db', canonical: 'Vector DB', aliases: ['Vector DB', '向量数据库'], deckHint: 'agent', parentCategory: '大模型',
    coreKeywords: ['Vector DB', '向量数据库'], searchAliases: ['vector db', 'Milvus', 'Pinecone', 'Faiss', 'ANN', 'approximate nearest neighbor', '索引'],
    relations: [
      { type: 'related', target: 'embedding' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },

  // Parent categories (kept separate, never used as canonicalTopic)
  { id: 'ml', canonical: '机器学习', aliases: ['机器学习', 'machine learning'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['机器学习', 'machine learning'], searchAliases: ['ml', 'machine learning', 'predictive modeling', 'statistical learning', '监督学习', 'supervised', '无监督学习', 'unsupervised', '过拟合', 'overfitting'],
    relations: [
      { type: 'child', target: 'ensemble' },
    ],
    migrationStatus: 'manual', domain: 'machine-learning',
  },
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
    coreKeywords: ['特征工程', 'feature engineering'], searchAliases: ['feature', '特征选择', '特征提取', '特征缩放', '编码', '缺失值', '特征工程'],
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
    coreKeywords: ['SQL'], searchAliases: ['sql', 'query', 'join', 'group by', 'window', '索引', 'WHERE', 'SELECT', 'HAVING'],
    relations: [] },
  { id: 'data_science', canonical: '数据科学', aliases: ['数据科学', 'data science'], deckHint: 'statistics', parentCategory: '数据科学',
    coreKeywords: ['数据科学', 'data science'], searchAliases: ['data science', 'SQL', 'Python', 'pandas', '统计'],
    relations: [] },

  // ── Generated (84 nodes) ──
  { id: 'lightgbm', canonical: 'LightGBM',
    aliases: ['LightGBM', 'lightgbm'],
    deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['LightGBM', 'light gbm'], searchAliases: ['LightGBM', 'light gbm'],
    relations: [],
    migrationStatus: 'generated', domain: 'machine-learning',
  },
  { id: 'catboost', canonical: 'CatBoost',
    aliases: ['CatBoost', 'catboost'],
    deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['CatBoost'], searchAliases: ['CatBoost'],
    relations: [],
    migrationStatus: 'generated', domain: 'machine-learning',
  },
  { id: 'qlearning', canonical: 'Q-learning',
    aliases: ['Q-learning'],
    deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['Q-learning', 'Q value', 'Q函数'], searchAliases: ['Q-learning', 'Q value', 'Q函数'],
    relations: [],
    migrationStatus: 'generated', domain: 'machine-learning',
  },
  { id: 'pandas', canonical: 'pandas',
    aliases: ['pandas'],
    deckHint: 'statistics', parentCategory: '数据科学',
    coreKeywords: ['pandas', 'dataframe'], searchAliases: ['pandas', 'dataframe'],
    relations: [],
    migrationStatus: 'generated', domain: 'data-science-statistics',
  },
  { id: 'leetcode', canonical: 'LeetCode',
    aliases: ['LeetCode'],
    deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['LeetCode', '刷题', '算法'], searchAliases: ['LeetCode', '刷题', '算法'],
    relations: [],
    migrationStatus: 'generated', domain: 'leetcode',
  },
  { id: 'layernorm', canonical: 'LayerNorm',
    aliases: ['LayerNorm'],
    deckHint: 'deep-learning', parentCategory: '深度学习',
    coreKeywords: ['LayerNorm', 'layer normalization'], searchAliases: ['LayerNorm', 'layer normalization'],
    relations: [],
    migrationStatus: 'generated', domain: 'deep-learning',
  },
  { id: 'prompt', canonical: 'Prompt',
    aliases: ['Prompt'],
    deckHint: 'llm', parentCategory: '大模型',
    coreKeywords: ['Prompt', '提示词', 'prompt engineering'], searchAliases: ['Prompt', '提示词', 'prompt engineering'],
    relations: [],
    migrationStatus: 'generated', domain: 'llm-agent-rag',
  },
  { id: 'prompt', canonical: 'Prompt',
    aliases: ['Prompt', 'Prompt Engineering'],
    deckHint: 'llm', parentCategory: '大模型',
    coreKeywords: ['Prompt', 'prompt engineering', '提示工程'], searchAliases: ['Prompt', 'prompt engineering', '提示工程'],
    relations: [],
    migrationStatus: 'generated', domain: 'llm-agent-rag',
  },
  { id: 'finetuning', canonical: 'Fine-tuning',
    aliases: ['Fine-tuning'],
    deckHint: 'llm', parentCategory: '大模型',
    coreKeywords: ['Fine-tuning', '微调', 'fine tune'], searchAliases: ['Fine-tuning', '微调', 'fine tune'],
    relations: [],
    migrationStatus: 'generated', domain: 'llm-agent-rag',
  },
  { id: 'function_calling', canonical: 'Function Calling',
    aliases: ['Function Calling'],
    deckHint: 'agent', parentCategory: 'Agent',
    coreKeywords: ['Function Calling', '工具调用', 'tool use'], searchAliases: ['Function Calling', '工具调用', 'tool use'],
    relations: [],
    migrationStatus: 'generated', domain: 'llm-agent-rag',
  },
  { id: 'vibecoding', canonical: 'VibeCoding',
    aliases: ['VibeCoding'],
    deckHint: 'vibe-coding', parentCategory: 'VibeCoding',
    coreKeywords: ['VibeCoding', 'Vibe Coding'], searchAliases: ['VibeCoding', 'Vibe Coding'],
    relations: [],
    migrationStatus: 'generated', domain: 'workplace-vibecoding',
  },
  { id: 'git', canonical: 'Git',
    aliases: ['Git'],
    deckHint: 'workplace', parentCategory: '',
    coreKeywords: ['Git', '版本控制', '分支', 'merge', 'rebase', 'longitudinal', 'ChiMerge', 'BASE', 'version control', 'commit'], searchAliases: ['Git', '版本控制', '分支'],
    relations: [],
    migrationStatus: 'generated', domain: 'workplace-vibecoding',
  },

  // ── Generated (0 nodes) ──


  // ── Generated (26 nodes) ──
  { id: 'hypothesis_test', canonical: '假设检验', aliases: ['假设检验', 'hypothesis testing', '统计检验', 'Hypothesis Testing'],
    deckHint: 'statistics', parentCategory: '统计学',
    coreKeywords: ['假设检验', 'hypothesis testing'], searchAliases: ['假设检验','hypothesis testing','p值','p-value','显著性','t检验','t-test','z检验','卡方','ANOVA','F检验','第一类错误','第二类错误','拒绝域'],
    relations: [], migrationStatus: 'generated', domain: 'data-science-statistics',
  },
  { id: 'confidence_interval', canonical: '置信区间', aliases: ['置信区间'],
    deckHint: 'statistics', parentCategory: '统计学',
    coreKeywords: ['置信区间', 'confidence interval'], searchAliases: ['置信区间', 'confidence interval'],
    relations: [], migrationStatus: 'generated', domain: 'data-science-statistics',
  },
  { id: 'image_classification', canonical: '图像分类', aliases: ['图像分类'],
    deckHint: 'deep-learning', parentCategory: '深度学习',
    coreKeywords: ['图像分类', 'image classification'], searchAliases: ['图像分类', 'image classification'],
    relations: [], migrationStatus: 'generated', domain: 'deep-learning',
  },
  { id: 'data_cleaning', canonical: '数据清洗', aliases: ['数据清洗'],
    deckHint: 'statistics', parentCategory: '数据科学',
    coreKeywords: ['数据清洗', 'data cleaning'], searchAliases: ['数据清洗', 'data cleaning'],
    relations: [], migrationStatus: 'generated', domain: 'data-science-statistics',
  },
  { id: 'backpropagation', canonical: '反向传播', aliases: ['反向传播'],
    deckHint: 'deep-learning', parentCategory: '深度学习',
    coreKeywords: ['反向传播', 'backpropagation'], searchAliases: ['反向传播', 'backpropagation'],
    relations: [], migrationStatus: 'generated', domain: 'deep-learning',
  },
  { id: 'gradient_descent', canonical: '梯度下降', aliases: ['梯度下降'],
    deckHint: 'deep-learning', parentCategory: '深度学习',
    coreKeywords: ['梯度下降', 'gradient descent'], searchAliases: ['梯度下降', 'gradient descent'],
    relations: [], migrationStatus: 'generated', domain: 'deep-learning',
  },
  { id: 'greedy_alg', canonical: '贪心', aliases: ['贪心'],
    deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['贪心', 'greedy'], searchAliases: ['贪心', 'greedy'],
    relations: [], migrationStatus: 'generated', domain: 'leetcode',
  },
  { id: 'algorithms', canonical: '算法', aliases: ['算法'],
    deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['算法', 'algorithm'], searchAliases: ['算法', 'algorithm'],
    relations: [], migrationStatus: 'generated', domain: 'leetcode',
  },
  { id: 'llm_big_model', canonical: '大模型', aliases: ['大模型'],
    deckHint: 'llm', parentCategory: '大模型',
    coreKeywords: ['大模型', 'LLM', 'GPT'], searchAliases: ['大模型', 'LLM', 'GPT'],
    relations: [], migrationStatus: 'generated', domain: 'llm-agent-rag',
  },
  { id: 'stack_queue', canonical: '栈和队列', aliases: ['栈和队列'],
    deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['栈', '队列', 'stack', 'queue'], searchAliases: ['栈', '队列', 'stack'],
    relations: [], migrationStatus: 'generated', domain: 'leetcode',
  },
  { id: 'workplace_comm', canonical: '职场沟通', aliases: ['职场沟通', '职场'],
    deckHint: 'workplace', parentCategory: '职场',
    coreKeywords: ['职场', '沟通', '汇报'], searchAliases: ['职场', '沟通', '汇报'],
    relations: [], migrationStatus: 'generated', domain: 'workplace-vibecoding',
  },
  { id: 'probability_cn', canonical: '概率', aliases: ['概率'],
    deckHint: 'statistics', parentCategory: '统计学',
    coreKeywords: ['概率', 'probability'], searchAliases: ['概率', 'probability'],
    relations: [], migrationStatus: 'generated', domain: 'data-science-statistics',
  },
  { id: 'prefix_sum', canonical: '前缀和', aliases: ['前缀和'],
    deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['前缀和', 'prefix sum'], searchAliases: ['前缀和', 'prefix sum'],
    relations: [], migrationStatus: 'generated', domain: 'leetcode',
  },
  { id: 'mono_stack', canonical: '单调栈', aliases: ['单调栈'],
    deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['单调栈', 'monotonic stack'], searchAliases: ['单调栈', 'monotonic stack'],
    relations: [], migrationStatus: 'generated', domain: 'leetcode',
  },
  { id: 'connectivity', canonical: '连通性', aliases: ['连通性'],
    deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['连通性', 'connectivity'], searchAliases: ['连通性', 'connectivity'],
    relations: [], migrationStatus: 'generated', domain: 'leetcode',
  },
  { id: 'llm_big_model', canonical: '大模型', aliases: ['大模型'],
    deckHint: 'llm', parentCategory: '大模型',
    coreKeywords: ['大模型', 'LLM', 'GPT'], searchAliases: ['大模型', 'LLM', 'GPT'],
    relations: [], migrationStatus: 'generated', domain: 'llm-agent-rag',
  },
  { id: 'statistics_cn', canonical: '统计学', aliases: ['统计学'],
    deckHint: 'statistics', parentCategory: '',
    coreKeywords: ['统计', 'statistics', '概率', '分布', '假设检验', '置信区间', '方差', '贝叶斯', '频率统计', '统计学', '贝叶斯统计', '贝叶斯频率对比', 'bayesian statistics', '正态分布', 'robust statistics', '朴素贝叶斯', '贝叶斯定理', '高斯分布', '概率校准', '贝叶斯优化', '统计检验', '预测分布', '特征分布', '分布修正', '偏差方差', '偏差方差分解', '方差控制', '分布式训练', '分布式系统', '分布式ID', '分布式', '分布式锁', 'probability', 'distribution', 'hypothesis', 'p value', 'confidence interval'], searchAliases: ['统计', 'statistics', '概率'],
    relations: [], migrationStatus: 'generated', domain: 'data-science-statistics',
  },
  { id: 'node_85', canonical: '图', aliases: ['图'],
    deckHint: 'leetcode', parentCategory: '',
    coreKeywords: ['图', 'graph', '拓扑', 'BFS', 'DFS', '并查集', '最短路径', 'dfs', 'bfs', '拓扑排序', '树状图', '直方图', '图神经网络', '图卷积', '谱图论', '图注意力', 'Graph Attention', '异构图', '图应用', 'Demographic Parity', 'Graph Embedding', '文生图', 'Graph RAG', '知识图谱', '图检索', 'AP', '图数据库', '图算法', '图像分割', 'Dijkstra', 'union find', 'topological sort'], searchAliases: ['图', 'graph', '拓扑'],
    relations: [], migrationStatus: 'generated', domain: 'leetcode',
  },
  { id: 'tree', canonical: '树', aliases: ['树'],
    deckHint: 'leetcode', parentCategory: '',
    coreKeywords: ['树', 'tree', '二叉树', 'BST', '遍历', '二叉', 'bs', 'substring', '递归遍历', 'binary tree', 'bst', '层序遍历', '二叉搜索树', '字典树', 'b+ tree', '决策树', 'decision tree', '分类树', '回归树', '树状图', '提升树', '对称树', '树模型', 'iTree', 'Tree-of-Thought', 'traversal', 'DFS', 'BFS'], searchAliases: ['树', 'tree', '二叉树'],
    relations: [], migrationStatus: 'generated', domain: 'leetcode',
  },
  { id: 'sorting', canonical: '排序', aliases: ['排序'],
    deckHint: 'leetcode', parentCategory: '',
    coreKeywords: ['排序', 'sort', '快排', '归并', '堆排', '桶排', '堆', '归并排序', '拓扑排序', '桶排序', '计数排序', '排序能力', '排序学习', '排序评估', '排序融合', '重排序', 'quick sort', 'merge sort', 'heap sort'], searchAliases: ['排序', 'sort', '快排'],
    relations: [], migrationStatus: 'generated', domain: 'leetcode',
  },
  { id: 'string', canonical: '字符串', aliases: ['字符串'],
    deckHint: 'leetcode', parentCategory: '',
    coreKeywords: ['字符串', 'string', '回文', '正则', 'KMP', '子串', 'substring', '正则化', 'L1正则化', 'L2正则化', 'KL正则化', 'palindrome'], searchAliases: ['字符串', 'string', '回文'],
    relations: [], migrationStatus: 'generated', domain: 'leetcode',
  },
  { id: 'recursion', canonical: '递归', aliases: ['递归'],
    deckHint: 'leetcode', parentCategory: '',
    coreKeywords: ['递归', 'recursion', '回溯', '分治', '递归遍历', '递归特征消除', 'backtracking', 'divide conquer'], searchAliases: ['递归', 'recursion', '回溯'],
    relations: [], migrationStatus: 'generated', domain: 'leetcode',
  },
  { id: 'queue_cn', canonical: '队列', aliases: ['队列'],
    deckHint: 'leetcode', parentCategory: '',
    coreKeywords: ['队列', 'queue', '单调队列', '优先队列', '动态队列', '消息队列', 'monotonic queue'], searchAliases: ['队列', 'queue', '单调队列'],
    relations: [], migrationStatus: 'generated', domain: 'leetcode',
  },
  { id: 'linkedlist', canonical: '链表', aliases: ['链表'],
    deckHint: 'leetcode', parentCategory: '',
    coreKeywords: ['链表', 'linked list', '反转', '合并', '链', '双向链表', 'reverse'], searchAliases: ['链表', 'linked list', '反转'],
    relations: [], migrationStatus: 'generated', domain: 'leetcode',
  },
  { id: 'stack', canonical: '栈', aliases: ['栈'],
    deckHint: 'leetcode', parentCategory: '',
    coreKeywords: ['栈', 'stack', '单调栈', '括号', '表达式', 'Stacking', 'monotonic stack'], searchAliases: ['栈', 'stack', '单调栈'],
    relations: [], migrationStatus: 'generated', domain: 'leetcode',
  },
  { id: 'binary_search', canonical: '二分', aliases: ['二分'],
    deckHint: 'leetcode', parentCategory: '',
    coreKeywords: ['二分', 'binary search', '二分查找', 'lower bound'], searchAliases: ['二分', 'binary search', '二分查找'],
    relations: [], migrationStatus: 'generated', domain: 'leetcode',
  },
  { id: 'prefix_sum', canonical: '前缀和', aliases: ['前缀和','prefix sum','前缀数组','cumulative sum'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['前缀和','prefix sum','差分数组','子数组和','cumulative sum'], searchAliases: ['前缀和','prefix','prefix sum','cumulative','subarray sum','range sum','difference array','差分','前缀','pre'],
    relations: [{type:'parent',target:'algorithm'}], migrationStatus: 'generated', domain: 'leetcode',
  },
  { id: 'rag', canonical: 'RAG', aliases: ['RAG','rag','Retrieval-Augmented Generation','检索增强生成'], deckHint: 'agent', parentCategory: 'Agent',
    coreKeywords: ['RAG','检索增强生成','retrieval','embedding','retriever'], searchAliases: ['RAG','rag','retrieval','retriever','embedding','vector db','vector database','vector store','semantic search','knowledge base','文档检索'],
    relations: [{type:'parent',target:'agent'},{type:'prerequisite',target:'embedding'},{type:'related',target:'vector_db'}], migrationStatus: 'generated', domain: 'llm-agent-rag',
  },
  { id: 'prompt_engineering', canonical: 'Prompt Engineering', aliases: ['Prompt Engineering','prompt engineering','提示工程','提示词'], deckHint: 'llm', parentCategory: '大模型',
    coreKeywords: ['prompt','提示词','提示工程','fewshot','chain of thought','system prompt'], searchAliases: ['prompt','prompting','提示词','prompt engineering','few-shot','zero-shot','chain of thought','cot','system prompt','instruction','role playing'],
    relations: [{type:'parent',target:'llm'}], migrationStatus: 'generated', domain: 'llm-agent-rag',
  },
  { id: 'tool_use', canonical: 'Tool Use', aliases: ['Tool Use','tool use','工具调用','Function Calling','function calling'], deckHint: 'agent', parentCategory: 'Agent',
    coreKeywords: ['tool use','工具调用','function calling','API调用','agent tool'], searchAliases: ['tool use','tool calling','function call','api call','openai functions','langchain tools','agent tools','插件'],
    relations: [{type:'parent',target:'agent'},{type:'related',target:'json_mode'}], migrationStatus: 'generated', domain: 'llm-agent-rag',
  },
  { id: 'json_mode', canonical: 'JSON Mode', aliases: ['JSON Mode','json mode','JSON Structured Output','Structured Output'], deckHint: 'llm', parentCategory: '大模型',
    coreKeywords: ['JSON Mode','structured output','结构化输出','JSON schema','function calling'], searchAliases: ['JSON','json mode','structured output','json schema','tool calling','function call'],
    relations: [{type:'parent',target:'llm'},{type:'related',target:'function_calling'}], migrationStatus: 'generated', domain: 'llm-agent-rag',
  },
  { id: 'imbalanced_dataset', canonical: '不平衡数据', aliases: ['不平衡数据','imbalanced dataset','类别不平衡','样本不均'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['imbalanced','不平衡','过采样','欠采样','SMOTE','class weight','stratified'], searchAliases: ['imbalanced','不平衡','oversampling','undersampling','SMOTE','class weight','stratified sampling','resample','focal loss','cost sensitive'],
    relations: [{type:'parent',target:'ml'}], migrationStatus: 'generated', domain: 'machine-learning',
  },
  { id: 'cicd', canonical: 'CI/CD', aliases: ['CI/CD','cicd','CI CD','持续集成','持续部署'], deckHint: 'data-engineering', parentCategory: '数据工程',
    coreKeywords: ['CI/CD','cicd','持续集成','持续部署','GitHub Actions','Jenkins','Docker','Kubernetes','DevOps'], searchAliases: ['ci/cd','CI/CD','cicd','github actions','jenkins','docker','k8s','devops','deploy','pipeline'],
    relations: [], migrationStatus: 'generated', domain: 'data-science-statistics',
  },
  { id: 'etl', canonical: 'ETL', aliases: ['ETL','elt','ETL管道','数据管道','数据工程'], deckHint: 'data-engineering', parentCategory: '数据工程',
    coreKeywords: ['ETL','ELT','extract','transform','load','数据管道','Apache Spark','Airflow','data pipeline'], searchAliases: ['etl','elt','extract','transform','load','data pipeline','spark','airflow','kafka','streaming','batch processing'],
    relations: [], migrationStatus: 'generated', domain: 'data-science-statistics',
  },
  { id: 'probability', canonical: '概率', aliases: ['概率','probability','概率论','随机事件'], deckHint: 'statistics', parentCategory: '统计学',
    coreKeywords: ['概率','probability','条件概率','随机变量','期望','方差','贝叶斯定理','分布'], searchAliases: ['概率','probability','conditional probability','random variable','expectation','variance','bayes theorem','normal distribution','bernoulli','poisson','pdf','cdf'],
    relations: [{type:'parent',target:'statistics'}], migrationStatus: 'generated', domain: 'data-science-statistics',
  },

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
  // Node's own searchAliases → always included as expanded
  for (const k of node.searchAliases) expanded.add(k);
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

export function getAllCanonicalTopics(): string[] {
  return NODES.map(n => n.canonical).filter(Boolean);
}
