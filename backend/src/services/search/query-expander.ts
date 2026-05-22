// backend/src/services/search/query-expander.ts — 规则词典 Query Expansion
//
// 第一版全规则，不用 LLM。映射常见中文问法 → 专业术语/同义词/英文术语。
// 每个 query 先做扩展，扩展词打入关键词召回和标签召回通道。

type ExpansionEntry = {
  /** 触发模式（正则，不区分大小写） */
  pattern: RegExp;
  /** 扩展出的关键词列表 */
  keywords: string[];
  /** 建议的牌组 ID（用于牌组匹配 boost） */
  deckIds?: string[];
};

const RULES: ExpansionEntry[] = [
  // ---- 过拟合 / 泛化 ----
  { pattern: /训练.*好.*测试.*差|过拟合|overfitting|泛化能力差/i,
    keywords: ['过拟合', 'overfitting', '泛化能力', '泛化', '正则化', '正则', 'dropout', 'early stopping', '交叉验证', '偏差方差', 'bias-variance'] },
  { pattern: /欠拟合|underfitting|训练.*差.*测试.*差/i,
    keywords: ['欠拟合', 'underfitting', '模型复杂度', '特征工程', '多项式特征'] },

  // ---- 梯度下降 / 优化 ----
  { pattern: /梯度下降|gradient descent|SGD|优化器/i,
    keywords: ['梯度下降', 'gradient descent', 'SGD', 'Adam', '学习率', 'learning rate', 'momentum', '收敛', '优化算法', 'batch', 'mini-batch'] },
  { pattern: /学习率|learning rate|lr/i,
    keywords: ['学习率', 'learning rate', '学习率衰减', 'warmup', '余弦退火', 'Adam', 'SGD'] },

  // ---- XGBoost / 集成学习 ----
  { pattern: /xgboost|lightgbm|catboost|gbdt/i,
    keywords: ['XGBoost', 'LightGBM', 'CatBoost', 'GBDT', '梯度提升', 'gradient boosting', 'Boosting', '集成学习', '决策树'] },
  { pattern: /随机森林|random forest/i,
    keywords: ['随机森林', 'random forest', 'Bagging', '特征重要性', '决策树', '集成学习', 'ensemble'] },

  // ---- 特征工程 ----
  { pattern: /特征选择|feature selection/i,
    keywords: ['特征选择', 'feature selection', 'Filter', 'Wrapper', 'Embedded', '特征重要性', '降维', 'PCA'] },
  { pattern: /特征工程|feature engineering/i,
    keywords: ['特征工程', '特征缩放', '归一化', '标准化', 'One-Hot', '编码', '缺失值', '特征交叉', '分箱'] },

  // ---- 正则化 ----
  { pattern: /正则化|regularization|L1|L2|惩罚项/i,
    keywords: ['正则化', 'regularization', 'L1', 'L2', 'Lasso', 'Ridge', '权重衰减', '过拟合', '稀疏'] },

  // ---- 评估指标 ----
  { pattern: /精确率|召回率|F1|precision|recall|混淆矩阵/i,
    keywords: ['精确率', '召回率', 'F1', 'precision', 'recall', '混淆矩阵', '准确率', 'ROC', 'AUC'] },
  { pattern: /ROC|AUC/i,
    keywords: ['ROC', 'AUC', '假阳性率', '真阳性率', '阈值', '分类', '不均衡'] },

  // ---- Transformer ----
  { pattern: /transformer|自注意力|self.attention|QKV|注意力机制/i,
    keywords: ['Transformer', 'Self-Attention', '自注意力', 'Q', 'K', 'V', 'Query', 'Key', 'Value', 'Multi-Head', '多头注意力', '位置编码', 'LayerNorm'] },
  { pattern: /位置编码|positional encoding|position encoding/i,
    keywords: ['位置编码', 'positional encoding', 'sinusoidal', '正弦', 'Transformer', '绝对位置', '相对位置', 'RoPE'] },

  // ---- CNN ----
  { pattern: /CNN|卷积|convolution|池化|pooling/i,
    keywords: ['CNN', '卷积', 'convolution', '池化', 'pooling', 'MaxPool', 'AvgPool', '全连接', 'ReLU', '图像', '特征图'] },

  // ---- RNN / LSTM ----
  { pattern: /RNN|LSTM|GRU|循环神经网络|序列模型/i,
    keywords: ['RNN', 'LSTM', 'GRU', '循环神经网络', '序列', '时间步', '遗忘门', '梯度消失', '长序列'] },

  // ---- 反向传播 ----
  { pattern: /反向传播|backpropagation|BP|链式法则|梯度计算/i,
    keywords: ['反向传播', 'backpropagation', '链式法则', '梯度', '前向传播', '损失函数', '参数更新'] },

  // ---- BatchNorm / 归一化 ----
  { pattern: /batchnorm|batch norm|归一化|normalization/i,
    keywords: ['BatchNorm', 'batch normalization', '归一化', 'LayerNorm', '训练', '推理', 'μ', 'σ', 'γ', 'β'] },

  // ---- Dropout ----
  { pattern: /dropout/i,
    keywords: ['Dropout', '过拟合', '正则化', '训练', '推理', '随机失活'] },

  // ---- 激活函数 ----
  { pattern: /激活函数|activation|ReLU|sigmoid|tanh|GELU|softmax/i,
    keywords: ['激活函数', 'activation', 'ReLU', 'sigmoid', 'tanh', 'GELU', 'softmax', 'Swish', '梯度消失'] },

  // ---- 大模型 / LLM ----
  { pattern: /大模型|LLM|语言模型|large language/i,
    keywords: ['LLM', '大模型', '预训练', '微调', 'Transformer', 'GPT', 'BERT', 'scaling law'] },
  { pattern: /RLHF|人类反馈|对齐|alignment/i,
    keywords: ['RLHF', '人类反馈', '对齐', 'alignment', 'PPO', 'DPO', 'reward model', '奖励模型', 'SFT'] },
  { pattern: /微调|finetune|fine.tune|PEFT|LoRA/i,
    keywords: ['微调', 'finetune', 'LoRA', 'PEFT', '参数高效', 'Adapter', '全参数', '指令微调', 'SFT'] },
  { pattern: /量化|quantization|GPTQ|AWQ/i,
    keywords: ['量化', 'quantization', 'GPTQ', 'AWQ', 'INT8', 'INT4', '推理加速', '模型压缩'] },
  { pattern: /KV.?[Cc]ache|推理加速/i,
    keywords: ['KV Cache', '推理加速', 'PagedAttention', 'vLLM', 'beam search', 'speculative decoding'] },

  // ---- RAG ----
  { pattern: /RAG|检索增强|retrieval.augmented/i,
    keywords: ['RAG', '检索增强生成', 'retrieval', '向量检索', 'chunk', 'embedding', 'rerank', '知识库', '幻觉'] },
  { pattern: /向量数据库|vector database|milvus|pinecone|chroma|faiss/i,
    keywords: ['向量数据库', 'vector database', 'Milvus', 'Pinecone', 'Chroma', 'Faiss', 'embedding', '相似度', 'ANN'] },

  // ---- Agent ----
  { pattern: /agent|智能体/i,
    keywords: ['Agent', '智能体', 'ReAct', 'tool calling', 'function calling', '规划', 'memory', 'multi-agent'] },
  { pattern: /ReAct|tool.?use|function.?calling/i,
    keywords: ['ReAct', 'tool use', 'function calling', '推理', '行动', 'Agent', 'API 调用'] },

  // ---- Vibe Coding ----
  { pattern: /MCP/i,
    keywords: ['MCP', 'Model Context Protocol', '工具', '协议', '网关', 'server', 'client'] },
  { pattern: /agent.*skill|skill.*agent|sub.?agent/i,
    keywords: ['Agent', 'Skill', 'Sub-agent', 'Agent Team', '协作', 'command'] },

  // ---- 统计学 ----
  { pattern: /贝叶斯|bayes/i,
    keywords: ['贝叶斯', 'Bayes', '条件概率', '先验', '后验', '似然', '朴素贝叶斯'] },
  { pattern: /置信区间|confidence interval/i,
    keywords: ['置信区间', 'confidence interval', '标准误差', '参数估计', '95%', '显著性'] },
  { pattern: /假设检验|hypothesis.test/i,
    keywords: ['假设检验', 'hypothesis test', 'p值', '显著性水平', '第一类错误', '第二类错误', 't检验', '卡方'] },
  { pattern: /中心极限|central limit/i,
    keywords: ['中心极限定理', 'central limit theorem', '大数定律', '正态分布', '抽样分布'] },

  // ---- 动态规划 ----
  { pattern: /动态规划|DP|dynamic.?program/i,
    keywords: ['动态规划', 'DP', 'dynamic programming', '状态转移', '最优子结构', '记忆化', '背包', '子序列'] },

  // ---- 链表 ----
  { pattern: /链表|linked.?list/i,
    keywords: ['链表', 'linked list', '反转', '双指针', '快慢指针', '环形', '合并', '删除'] },

  // ---- 树 / 二叉树 ----
  { pattern: /二叉树|二叉搜索|binary.?tree|遍历|BST/i,
    keywords: ['二叉树', 'binary tree', 'BST', '遍历', '前序', '中序', '后序', '层序', '递归', 'DFS', 'BFS', '最近公共祖先'] },

  // ---- 排序 ----
  { pattern: /排序|sort|快排|归并|堆排/i,
    keywords: ['排序', 'sort', '快排', '归并', '堆排', '冒泡', '插入', '选择', '时间复杂度', '稳定'] },

  // ---- 双指针 / 滑动窗口 ----
  { pattern: /双指针|滑动窗口|two.?pointer|sliding.?window/i,
    keywords: ['双指针', 'two pointer', '滑动窗口', 'sliding window', '对撞', '快慢', '子数组', '子串'] },

  // ---- GAN / 生成模型 ----
  { pattern: /GAN|生成对抗/i,
    keywords: ['GAN', '生成对抗网络', '生成器', '判别器', '对抗训练', 'mode collapse', '模式坍塌'] },
  { pattern: /扩散模型|diffusion|stable.?diffusion/i,
    keywords: ['扩散模型', 'diffusion', 'Stable Diffusion', '去噪', '加噪', 'DDPM', '潜在空间', 'VAE'] },

  // ---- 自动编码器 ----
  { pattern: /自动编码器|auto.?encoder|VAE/i,
    keywords: ['自动编码器', 'autoencoder', 'VAE', '变分自编码器', '潜在空间', '重参数化', '重构', '降维'] },

  // ==== 新增：评测 Missing case 专用规则 ====

  // 模型评估相关
  { pattern: /评估.*分类.*模型|分类.*模型.*评估|怎么.*评价.*分类|怎么.*评估.*模型|混淆矩阵|PR曲线/i,
    keywords: ['精确率', 'precision', '召回率', 'recall', 'F1', 'F1-score', '混淆矩阵', 'confusion matrix', 'ROC', 'AUC', '准确率', 'accuracy', 'macro', 'micro', 'PR曲线'] },

  // 小样本/数据不足
  { pattern: /标注.*少|数据.*少.*标注|标注.*不足|小样本|少样本|few.?shot|半监督|数据量少|数据不够|标注只有.*万|只有.*标注|标注.*不够/i,
    keywords: ['半监督学习', '主动学习', 'active learning', '数据增强', 'data augmentation', '迁移学习', 'transfer learning', 'few-shot', '正则化', 'regularization', 'L1', 'L2', 'dropout', '早停', 'early stopping'] },

  // AB测试 / 实验组对照组
  { pattern: /AB.?测试|a.?b.?test|实验组.*对照组|对照组.*实验组|没有显著差异|不显著|无显著|两组.*差异|判断.*显著|显著.*差异|怎么.*判断.*差异/i,
    keywords: ['AB测试', 'A/B test', '假设检验', 'hypothesis test', 't检验', 't-test', '显著性', 'p值', 'p-value', '统计功效', 'statistical power', '样本量', 'sample size', '第一类错误', '第二类错误'] },

  // 贝叶斯更新信念
  { pattern: /更新.*信念|更新.*认知|更新.*概率|贝叶斯.*更新|数据.*更新.*信念/i,
    keywords: ['贝叶斯', 'Bayes', '先验', 'prior', '后验', 'posterior', '似然', 'likelihood', '条件概率', 'conditional probability', '贝叶斯更新', 'Bayesian updating'] },

  // AI 项目规则文件
  { pattern: /AI.*规则|项目规则|写.*规则.*文件|agent.*规则|claude.*规则/i,
    keywords: ['CLAUDE.md', 'AGENTS.md', '项目指令', 'project instructions', 'agent', 'skill', '规则文件', 'vibe coding'] },

  // ==== 通用增强规则 ====

  // 特征重要性 / 可解释性
  { pattern: /特征重要|可解释|explainability|SHAP|LIME|特征贡献/i,
    keywords: ['特征重要性', 'feature importance', '可解释性', 'SHAP', 'LIME', '特征选择', 'permutation importance', '树模型', '随机森林'] },

  // 数据预处理
  { pattern: /数据预[处理理]|数据清洗|数据清洗|缺失值|异常值|脏数据|脏数据/i,
    keywords: ['缺失值', '异常值', '数据清洗', '归一化', '标准化', '特征缩放', 'One-Hot', '编码', '数据预处理', 'data preprocessing'] },

  // 模型部署
  { pattern: /模型部署|上线|deploy|模型.*线上|推理服务|模型.*生产/i,
    keywords: ['模型部署', 'deployment', '推理加速', '量化', '模型压缩', 'ONNX', 'TensorRT', '模型服务', 'MLOps'] },

  // 损失函数相关
  { pattern: /损失函数|loss.?function|交叉熵|cross.?entropy|MSE|均方误差/i,
    keywords: ['损失函数', 'loss function', '交叉熵', 'cross entropy', 'MSE', '均方误差', 'log loss', 'Hinge loss', 'Focal loss', '梯度', '反向传播'] },

  // 面试常见问法
  { pattern: /面试.*问|面试官|怎么回答|如何回答|被问到|怎么跟.*解释/i,
    keywords: ['面试', 'STAR', '项目经历', '自我介绍', 'behavioral question', '技术面试'] },

  // 性能优化相关
  { pattern: /太慢|加速|优化.*速度|性能.*优化|提速|更快/i,
    keywords: ['推理加速', '量化', 'KV Cache', '模型压缩', '蒸馏', '剪枝', '批处理', '并行', 'GPU'] },

  // 项目经验
  { pattern: /项目.*经历|项目.*介绍|做过.*项目|简历.*项目/i,
    keywords: ['项目经历', 'STAR', '自我介绍', '简历', '面试', '技术栈'] },

  // 分类问题通用
  { pattern: /分类.*问题|分类.*任务|二分类|多分类/i,
    keywords: ['分类', 'classification', 'sigmoid', 'softmax', '交叉熵', '逻辑回归', '精确率', '召回率', 'F1', 'ROC', 'AUC', '混淆矩阵'] },

  // 回归问题通用
  { pattern: /回归.*问题|回归.*任务|预测.*数值|预测.*连续/i,
    keywords: ['回归', 'regression', 'MSE', 'MAE', 'RMSE', 'R²', '线性回归', '岭回归', 'Lasso', '残差'] },

  // 无监督学习
  { pattern: /无监督|unsupervised|聚类|clustering|降维|dimension.*reduction/i,
    keywords: ['聚类', 'clustering', 'KMeans', 'DBSCAN', '降维', 'PCA', 't-SNE', '无监督', 'unsupervised', '自编码器'] },

  // 强化学习
  { pattern: /强化学习|reinforcement|RL|Q.learning|DQN|PPO|policy.*gradient/i,
    keywords: ['强化学习', 'reinforcement learning', 'Q-learning', 'DQN', 'PPO', 'policy gradient', 'reward', '状态', '动作', '马尔可夫'] },

  // ── Good/Bad Case 优化 ──

  // p-value 专项（stats-24 buried）
  { pattern: /p.?value|p.?值|统计推断|显著性检验|显著.*检验|留存.*显著|上线.*前后.*变化/i,
    keywords: ['p值', 'p-value', '假设检验', '显著性水平', '统计推断', '显著性差异'] },

  // 模型不收敛/震荡（dl-2 buried）
  { pattern: /不收敛|loss.*震荡|loss.*不降|震[荡荡]|训练.*几.*小时|一直.*训练/i,
    keywords: ['梯度消失', '梯度爆炸', '激活函数', '学习率', 'BatchNorm', 'ReLU', 'sigmoid'] },

  // 哈希vs双指针混淆（lc-001 buried）
  { pattern: /哈希.*双指针|双指针.*哈希|搞混|分不清|什么.*时候.*用|区别.*哈希.*双指针/i,
    keywords: ['哈希表', '双指针', '数组', '两数之和', '前缀和', '滑动窗口'] },

  // 业务系统集成LLM（agent-7 buried）
  { pattern: /集成.*业务|落地.*系统|业务.*集成|怎么.*把.*模型|能力.*集成|集成.*自己.*系统/i,
    keywords: ['RAG', '检索增强生成', '知识库', 'API调用', 'LLM', 'Function Calling', 'Agent'] },

  // 集成学习专项（学习清单用）
  { pattern: /集成学习|ensemble|集成方法|bagging.*boosting|多模型.*融合|模型.*集成/i,
    keywords: ['集成学习', 'ensemble learning', 'Bagging', 'Boosting', 'Stacking', 'Blending', '随机森林', 'GBDT', 'XGBoost', '模型融合', '投票'] },
];

/**
 * 扩展用户输入 query，返回追加的关键词列表。
 * 这些关键词会注入关键词召回和标签召回通道。
 */
// ---- 关键词 → 牌组 ID 映射（用于 deckBoost） ----
const KEYWORD_DECK_MAP: Record<string, string> = {
  // 力扣
  '动态规划': 'leetcode', 'dp': 'leetcode', '链表': 'leetcode', '二叉树': 'leetcode',
  '哈希表': 'leetcode', '双指针': 'leetcode', '滑动窗口': 'leetcode', '回溯': 'leetcode',
  '贪心': 'leetcode', '二分查找': 'leetcode', '排序': 'leetcode', '栈': 'leetcode',
  '队列': 'leetcode', '堆': 'leetcode', '前缀和': 'leetcode', 'trie': 'leetcode',
  // 机器学习
  '过拟合': 'machine-learning', '梯度下降': 'machine-learning', 'xgboost': 'machine-learning',
  'lightgbm': 'machine-learning', 'svm': 'machine-learning', 'pca': 'machine-learning',
  '正则化': 'machine-learning', '特征选择': 'machine-learning', '特征工程': 'machine-learning',
  '集成学习': 'machine-learning', 'k-means': 'machine-learning', 'kmeans': 'machine-learning',
  '决策树': 'machine-learning', '逻辑回归': 'machine-learning', '支持向量机': 'machine-learning',
  '随机森林': 'machine-learning', '交叉验证': 'machine-learning', 'bagging': 'machine-learning',
  'boosting': 'machine-learning', '集成学习': 'machine-learning', 'ensemble': 'machine-learning',
  'roc': 'machine-learning', 'auc': 'machine-learning',
  't-sne': 'machine-learning', 'dbscan': 'machine-learning',
  // 统计学
  '贝叶斯': 'statistics', '置信区间': 'statistics', '假设检验': 'statistics',
  'p值': 'statistics', 'p-value': 'statistics', '大数定律': 'statistics',
  '中心极限定理': 'statistics', 'bootstrap': 'statistics', 'mcmc': 'statistics',
  '方差分析': 'statistics', 'anova': 'statistics', '正态分布': 'statistics',
  '泊松': 'statistics', '伯努利': 'statistics', 'ab测试': 'statistics',
  // 深度学习
  '反向传播': 'deep-learning', 'cnn': 'deep-learning', '卷积': 'deep-learning',
  'rnn': 'deep-learning', 'lstm': 'deep-learning', 'gan': 'deep-learning',
  'resnet': 'deep-learning', 'batchnorm': 'deep-learning', 'dropout': 'deep-learning',
  '激活函数': 'deep-learning', '扩散模型': 'deep-learning', 'diffusion': 'deep-learning',
  'vae': 'deep-learning', '梯度消失': 'deep-learning', 'sigmoid': 'deep-learning',
  'softmax': 'deep-learning', 'adam': 'deep-learning', 'sgd': 'deep-learning',
  // 大模型
  'transformer': 'llm', 'self-attention': 'llm', '自注意力': 'llm',
  'lora': 'llm', 'rlhf': 'llm', '位置编码': 'llm', 'llm': 'llm',
  '微调': 'llm', '量化': 'llm', 'kv cache': 'llm', 'bert': 'llm',
  'gpt': 'llm', '大模型': 'llm', '指令微调': 'llm',
  // Agent
  'rag': 'agent', '检索增强': 'agent', '向量数据库': 'agent',
  'react': 'agent', 'agent': 'agent', 'function calling': 'agent',
  'tool use': 'agent', '混合检索': 'agent', 'hybrid search': 'agent',
  'rerank': 'agent',
  // Vibe Coding
  'mcp': 'vibe-coding', 'agent team': 'vibe-coding', 'sub-agent': 'vibe-coding',
  'claude.md': 'vibe-coding',
  // 黑话
  '赋能': 'jargon', '闭环': 'jargon', '复盘': 'jargon', '底层逻辑': 'jargon',
  '抓手': 'jargon', 'okr': 'jargon', 'kpi': 'jargon',
  // 职场
  '向上管理': 'workplace', 'star法则': 'workplace', '汇报': 'workplace',
  '周报': 'workplace', '涨薪': 'workplace',
};

/**
 * 从扩展关键词推断建议的牌组 ID
 */
function inferDeckIds(keywords: string[]): string[] {
  const decks = new Set<string>();
  for (const kw of keywords) {
    const dk = KEYWORD_DECK_MAP[kw.toLowerCase()];
    if (dk) decks.add(dk);
  }
  return [...decks];
}

/**
 * 扩展用户输入 query，返回追加的关键词和建议牌组。
 */
export function expandQuery(rawQuery: string): { keywords: string[]; deckIds: string[] } {
  const keywords = new Set<string>();
  const q = rawQuery.trim();
  if (!q) return { keywords: [], deckIds: [] };

  // 1. 学习意图核心概念抽取
  const learningIntents = extractLearningConcepts(q);
  for (const kw of learningIntents) {
    keywords.add(kw.toLowerCase());
  }

  // 2. 规则词典扩展
  for (const rule of RULES) {
    if (rule.pattern.test(q)) {
      for (const kw of rule.keywords) {
        keywords.add(kw.toLowerCase());
      }
    }
  }

  const kwList = [...keywords];
  return { keywords: kwList, deckIds: inferDeckIds(kwList) };
}

// ── 学习意图概念抽取 ──

const LEARNING_INTENT_PATTERNS: Array<{ pattern: RegExp; group: number }> = [
  // "想学习XXX" / "入门XXX" / "系统学习XXX" / "刷XXX"
  { pattern: /(?:想|要|准备|打算|如何|怎么)?(?:系统(?:地|的)?)?(?:学习|入门|复习|刷|了解|掌握|搞懂)(.+)$/i, group: 1 },
  // "XXX不太懂" / "XXX不会" / "XXX没懂"
  { pattern: /(.+?)(?:不太懂|不会|没懂|搞不清楚|不太熟)$/i, group: 1 },
  // "哪些卡片关于XXX" / "什么卡片是XXX"
  { pattern: /(?:哪些|什么).*?(?:卡片|内容|题).*?(?:关于|是|学)?(.+)$/i, group: 1 },
];

function extractLearningConcepts(query: string): string[] {
  const results: string[] = [];
  for (const { pattern, group } of LEARNING_INTENT_PATTERNS) {
    const m = query.match(pattern);
    if (m && m[group]) {
      let concept = m[group]
        .replace(/[,，.。!！?？、\s]+$/, '')
        .replace(/[,，\s]*(?:应该|可以|需要|推荐|有没有|有没有什么|有什么|一下|一些|几道|几张).*$/, '')
        .replace(/[，,]\s*我.*$/, '')
        .trim();
      if (concept.length >= 1 && concept.length <= 30) {
        results.push(concept);
      }
    }
  }
  return [...new Set(results)];
}
