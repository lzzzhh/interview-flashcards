// backend/src/evaluation/seed-search-keywords.ts — 为所有卡片生成 searchKeywords
//
// 用法: cd backend && npx tsx src/evaluation/seed-search-keywords.ts
// 或作为 rebuild 的一部分调用 seedAllSearchKeywords()

import prisma from '../db/prisma';
import { rebuildFTS5 } from '../services/search/fts5-search';

// ---- 术语映射表：中文 → 英文等价词 + 同义词 ----
const TERM_MAP: Record<string, string[]> = {
  // 数据结构/算法
  '两数之和': ['Two Sum', '哈希表', '数组', 'HashMap', '双指针'],
  '反转链表': ['reverse linked list', '链表', '迭代', '递归'],
  '动态规划': ['DP', 'dynamic programming', '状态转移', '最优子结构', '记忆化', '背包'],
  '爬楼梯': ['Climbing Stairs', '斐波那契', 'Fibonacci', 'DP'],
  '三数之和': ['3Sum', '双指针', '排序'],
  '接雨水': ['trapping rain water', '双指针', '单调栈', 'two pointer'],
  '滑动窗口': ['sliding window', '双指针', '子数组', '子串'],
  '二叉树': ['binary tree', 'BST', '遍历', 'DFS', 'BFS', '递归'],
  '排序': ['sort', '快排', '归并', '堆排', '时间复杂度'],
  '两数相加': ['Add Two Numbers', '链表', '进位'],
  '最长子串': ['substring', '滑动窗口', '双指针'],
  '括号生成': ['generate parentheses', '回溯', 'DFS'],
  '合并区间': ['merge intervals', '排序', '数组'],
  '岛屿数量': ['number of islands', 'DFS', 'BFS', '矩阵'],
  '全排列': ['permutations', '回溯', 'DFS'],
  'LRU': ['LRU Cache', '缓存', '哈希表', '双向链表'],
  '编辑距离': ['edit distance', 'DP', '字符串'],
  '最大子数组': ['maximum subarray', 'Kadane', 'DP'],
  '买卖股票': ['best time to buy and sell stock', 'DP', '贪心'],

  // 机器学习
  '梯度下降': ['gradient descent', 'SGD', 'Adam', '优化器', 'optimizer', '学习率', 'learning rate', '收敛', 'convergence'],
  '过拟合': ['overfitting', '泛化', 'generalization', '正则化', 'regularization', 'dropout', 'early stopping', '偏差方差', 'bias-variance'],
  '欠拟合': ['underfitting', '模型复杂度', '特征工程'],
  '正则化': ['regularization', 'L1', 'L2', 'Lasso', 'Ridge', '权重衰减', 'weight decay'],
  'XGBoost': ['xgboost', 'GBDT', 'Boosting', '梯度提升', 'gradient boosting', '树模型'],
  'LightGBM': ['lightgbm', '直方图', 'histogram', 'GBDT', 'Boosting'],
  '随机森林': ['random forest', 'Bagging', '特征重要性', 'feature importance', '集成学习', 'ensemble'],
  'SVM': ['支持向量机', 'support vector machine', '核函数', 'kernel', '软间隔', 'soft margin'],
  '决策树': ['decision tree', '信息增益', '基尼系数', 'Gini', '剪枝', 'pruning'],
  '逻辑回归': ['logistic regression', 'sigmoid', '二分类', '对数损失'],
  'KNN': ['K近邻', 'k-nearest neighbors', '距离度量', '惰性学习'],
  '朴素贝叶斯': ['naive bayes', '贝叶斯', '条件独立', '分类'],
  'K-Means': ['kmeans', '聚类', 'clustering', '肘部法则', '轮廓系数'],
  'PCA': ['主成分分析', 'principal component analysis', '降维', 'dimensionality reduction', '特征值'],
  '特征选择': ['feature selection', 'Filter', 'Wrapper', 'Embedded', '特征重要性'],
  '特征工程': ['feature engineering', '特征缩放', '归一化', '标准化', 'One-Hot', '编码', '缺失值'],
  '交叉验证': ['cross validation', 'K-Fold', '训练集', '测试集', '验证集'],
  '精确率': ['precision', '召回率', 'recall', 'F1', '混淆矩阵', 'confusion matrix'],
  'ROC': ['ROC', 'AUC', '曲线下面积', '分类', '阈值'],
  'DBSCAN': ['dbscan', '密度聚类', '噪声', '聚类'],
  't-SNE': ['t-sne', '降维', '可视化', 'visualization'],
  'Bagging': ['bagging', 'Bootstrap', '降方差', '集成'],
  'Boosting': ['boosting', 'AdaBoost', '降偏差', '串行'],

  // 深度学习
  '反向传播': ['backpropagation', 'BP', '链式法则', 'chain rule', '梯度', '前向传播'],
  'CNN': ['卷积神经网络', 'convolutional neural network', '卷积', 'convolution', '池化', 'pooling', '全连接'],
  'RNN': ['循环神经网络', 'recurrent neural network', 'LSTM', 'GRU', '序列', '时间步'],
  'LSTM': ['长短期记忆', 'long short-term memory', '遗忘门', '输入门', '输出门', 'RNN'],
  'Transformer': ['transformer', '注意力', 'attention', '自注意力', 'self-attention', '编码器', '解码器'],
  'BatchNorm': ['batch normalization', '批归一化', '归一化', '训练', '推理'],
  'Dropout': ['dropout', '过拟合', '正则化', '随机失活'],
  '激活函数': ['activation', 'ReLU', 'sigmoid', 'tanh', 'GELU', 'softmax', 'Swish'],
  'GAN': ['生成对抗网络', 'generative adversarial network', '生成器', '判别器', '对抗训练', 'mode collapse'],
  'VAE': ['变分自编码器', 'variational autoencoder', '潜在空间', '重参数化'],
  '扩散模型': ['diffusion model', 'DDPM', 'Stable Diffusion', '去噪', '加噪', 'latent space'],
  'ResNet': ['残差网络', 'residual network', '跳跃连接', 'skip connection', '梯度消失'],
  '迁移学习': ['transfer learning', '微调', 'fine-tuning', '冻结层', '特征提取'],
  '权重初始化': ['weight initialization', 'Xavier', 'He', '初始化'],
  'Dropout训练推理': ['dropout', 'train', 'inference', '随机失活'],

  // 大模型
  'Self-Attention': ['self-attention', '自注意力', 'Q', 'K', 'V', 'Query', 'Key', 'Value', 'softmax', '缩放点积'],
  'Multi-Head': ['多头注意力', 'multi-head attention', '并行', '子空间'],
  '位置编码': ['positional encoding', 'position encoding', 'sinusoidal', '正弦', 'RoPE', '绝对位置', '相对位置'],
  'LayerNorm': ['layer normalization', '层归一化', 'BatchNorm', 'Transformer'],
  'RLHF': ['人类反馈强化学习', 'reinforcement learning from human feedback', 'PPO', 'DPO', 'reward model', '对齐', 'alignment'],
  'LoRA': ['低秩适应', 'low-rank adaptation', 'PEFT', '参数高效微调', 'adapter', '微调'],
  '微调': ['finetune', 'fine-tuning', 'SFT', '指令微调', 'instruction tuning', '全参数', 'PEFT'],
  '量化': ['quantization', 'GPTQ', 'AWQ', 'INT8', 'INT4', '模型压缩', '推理加速'],
  'KV Cache': ['KV缓存', 'key-value cache', '推理加速', 'PagedAttention', 'vLLM'],
  'RLHF流程': ['RLHF', 'SFT', 'reward model', 'PPO', 'DPO', '对齐'],
  'DPO': ['direct preference optimization', '偏好对齐', 'RLHF替代'],
  'GPT': ['Generative Pre-trained Transformer', '自回归', 'decoder-only'],
  'BERT': ['Bidirectional Encoder Representations', 'encoder-only', 'MLM', '掩码语言模型'],

  // RAG
  'RAG': ['检索增强生成', 'retrieval augmented generation', '向量检索', 'chunk', 'embedding', 'rerank', '知识库', '幻觉', 'hallucination'],
  '向量数据库': ['vector database', 'Milvus', 'Pinecone', 'Chroma', 'Faiss', 'embedding', '相似度', 'ANN', '近似最近邻'],
  'Chunk策略': ['chunk', '文档切分', '分块', '重叠', 'overlap', '语义切分'],
  'Embedding': ['嵌入', '向量化', 'embedding model', 'BGE', 'text-embedding', 'bge-m3'],

  // Agent
  'Agent': ['智能体', 'ReAct', 'tool calling', 'function calling', '规划', 'planning', 'memory', '多Agent', 'multi-agent'],
  'ReAct': ['推理行动', 'reasoning', 'acting', 'tool use', 'LLM agent'],
  'Function Calling': ['函数调用', 'tool use', 'API调用', '结构化输出'],
  'Multi-Agent': ['多智能体', '协作', 'AutoGPT', 'MetaGPT', '分工'],

  // 统计学
  '贝叶斯': ['Bayes', 'bayesian', '条件概率', 'conditional probability', '先验', 'prior', '后验', 'posterior', '似然', 'likelihood'],
  '置信区间': ['confidence interval', 'CI', '标准误差', 'standard error', '参数估计', '95%'],
  '假设检验': ['hypothesis test', 'hypothesis testing', 'p值', 'p-value', '显著性', 't检验', '卡方', '第一类错误', '第二类错误'],
  '大数定律': ['law of large numbers', '收敛', 'convergence', '期望'],
  '中心极限定理': ['central limit theorem', 'CLT', '正态分布', 'normal distribution', '抽样分布'],
  '标准误差': ['standard error', 'SE', '标准差', 'standard deviation', '样本量'],
  'p值': ['p-value', '显著性水平', 'significance', '假设检验'],
  '均值': ['mean', '中位数', 'median', '众数', 'mode', '集中趋势'],
  '方差': ['variance', '标准差', 'standard deviation', '离散程度'],
  '偏度': ['skewness', '峰度', 'kurtosis', '分布形态'],
  '相关性': ['correlation', '因果性', 'causation', 'Pearson', 'Spearman'],
  '线性回归': ['linear regression', '最小二乘法', 'OLS', '残差'],
  '百分位数': ['percentile', '四分位数', 'quartile', 'IQR'],

  // Vibe Coding
  'MCP': ['Model Context Protocol', '工具协议', 'server', 'client', '网关', 'gateway'],
  'Agent Skill': ['agent', 'skill', 'sub-agent', 'agent team', '协作', 'command', '/command'],
  'CLAUDE.md': ['AGENTS.md', '项目指令', 'project instructions', '规则文件'],

  // 通用
  '双指针': ['two pointer', '滑动窗口', 'sliding window', '对撞', '快慢'],
  '哈希表': ['hash table', 'hashmap', '两数之和', '字典', 'dict'],
  '堆': ['heap', '优先队列', 'priority queue', 'topK'],
  '栈': ['stack', '单调栈', '括号匹配'],
  '队列': ['queue', 'BFS', '层序遍历'],
  '回溯': ['backtracking', 'DFS', '排列', '组合', '子集'],
  '贪心': ['greedy', '最优解', '局部最优'],
  '二分查找': ['binary search', '二分', '有序数组'],
  '并查集': ['union find', 'disjoint set', '连通分量'],
  '前缀和': ['prefix sum', '子数组和'],
  '拓扑排序': ['topological sort', 'DAG', '课程表', 'BFS'],
  'Trie': ['前缀树', '字典树', 'prefix tree', '字符串搜索'],
  '位运算': ['bit manipulation', '异或', 'XOR', '位掩码'],
};

/** 从卡片内容提取关键词 */
function extractKeywords(card: any): string {
  const keywords = new Set<string>();

  const text = [
    card.titleCn,
    card.title,
    card.question,
    card.answer,
    card.tags,
  ].filter(Boolean).join(' ');

  if (!text) return '';

  // 1. 从术语映射表匹配
  for (const [term, synonyms] of Object.entries(TERM_MAP)) {
    const termLower = term.toLowerCase();
    const textLower = text.toLowerCase();
    if (textLower.includes(termLower)) {
      keywords.add(term);
      for (const s of synonyms) keywords.add(s);
    }
  }

  // 2. 提取 tags
  if (card.tags) {
    try {
      const tags = JSON.parse(card.tags);
      for (const t of tags) keywords.add(t);
    } catch {
      for (const t of card.tags.split(/[,;，；]/)) {
        keywords.add(t.trim());
      }
    }
  }

  // 3. 去重、去空、限制长度
  return [...keywords]
    .map(k => k.trim())
    .filter(k => k.length > 0 && k.length < 50)
    .join(' ');
}

/** 为所有卡片生成 searchKeywords */
export async function seedAllSearchKeywords(): Promise<number> {
  const cards = await prisma.$queryRawUnsafe(`SELECT id, titleCn, title, question, answer, tags FROM Card`) as any[];
  let updated = 0;

  for (const card of cards) {
    const skw = extractKeywords(card);
    if (!skw) continue;

    // 用 raw SQL 避免 FTS5 trigger 问题
    await prisma.$executeRawUnsafe(
      `UPDATE Card SET searchKeywords = ? WHERE id = ?`,
      skw, card.id,
    );
    updated++;
  }

  console.log(`[seed] 已为 ${updated}/${cards.length} 张卡片生成 searchKeywords`);
  return updated;
}

// ---- CLI ----
async function main() {
  console.log('[seed] 生成 searchKeywords ...');
  const count = await seedAllSearchKeywords();
  console.log('[seed] 重建 FTS5 索引 ...');
  // 先重建 card_fts 表确保结构匹配
  try {
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS card_fts`);
  } catch {}
  await rebuildFTS5();
  console.log(`[seed] 完成！${count} 张卡片已更新`);
}

main().catch(err => { console.error(err); process.exit(1); });
