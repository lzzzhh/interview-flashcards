// backend/src/evaluation/test-cases.ts — 100 条中文优先的 AI 搜索评测测试集
//
// 分布：中文关键词 30% | 中文概念/同义表达 25% | 中英混合技术词 25% | 中文复杂面试问题 15% | 纯英文 5%
// 牌组 ID：leetcode=力扣, statistics=统计学, machine-learning=机器学习
//          deep-learning=深度学习, llm=大模型, agent=Agent
//          vibe-coding=Vibe Coding, jargon=黑话, workplace=职场

import type { TestCase } from './types';

export const TEST_CASES: TestCase[] = [

  // ════════════════════ 中文关键词 (30) ════════════════════

  // --- 力扣 ---
  { query: '两数之和', group: '关键词-力扣', primaryIds: ['lc-001'], secondaryIds: ['lc-016'], acceptableDecks: ['leetcode'], acceptableConcepts: ['数组', '哈希表'] },
  { query: '反转链表', group: '关键词-力扣', primaryIds: ['lc-033'], secondaryIds: ['lc-039'], acceptableDecks: ['leetcode'], acceptableConcepts: ['链表', '反转'] },
  { query: '接雨水', group: '关键词-力扣', primaryIds: ['lc-008'], secondaryIds: [], acceptableDecks: ['leetcode'], acceptableConcepts: ['双指针', '单调栈'] },
  { query: '爬楼梯', group: '关键词-力扣', primaryIds: ['lc-062'], secondaryIds: ['lc-069'], acceptableDecks: ['leetcode'], acceptableConcepts: ['动态规划', '斐波那契'] },

  // --- 机器学习 ---
  { query: '过拟合', group: '关键词-机器学习', primaryIds: ['ml-7'], secondaryIds: ['ml-8'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['过拟合', '欠拟合', '偏差方差'] },
  { query: '交叉验证', group: '关键词-机器学习', primaryIds: ['ml-9'], secondaryIds: [], acceptableDecks: ['machine-learning'], acceptableConcepts: ['K折', '交叉验证'] },
  { query: '正则化', group: '关键词-机器学习', primaryIds: ['ml-10'], secondaryIds: ['ml-20'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['L1', 'L2', '正则化'] },
  { query: '特征缩放', group: '关键词-机器学习', primaryIds: ['ml-13'], secondaryIds: ['ml-45'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['特征缩放', '归一化', '标准化'] },

  // --- 统计学 ---
  { query: '贝叶斯定理', group: '关键词-统计学', primaryIds: ['stats-9'], secondaryIds: ['stats-15'], acceptableDecks: ['statistics'], acceptableConcepts: ['贝叶斯', '条件概率'] },
  { query: '置信区间', group: '关键词-统计学', primaryIds: ['stats-8'], secondaryIds: ['stats-7'], acceptableDecks: ['statistics'], acceptableConcepts: ['置信区间', '标准误差'] },
  { query: '假设检验', group: '关键词-统计学', primaryIds: ['stats-24'], secondaryIds: ['stats-25'], acceptableDecks: ['statistics'], acceptableConcepts: ['p值', '假设检验'] },
  { query: '大数定律', group: '关键词-统计学', primaryIds: ['stats-10'], secondaryIds: [], acceptableDecks: ['statistics'], acceptableConcepts: ['大数定律', '中心极限定理'] },

  // --- 深度学习 ---
  { query: '反向传播', group: '关键词-深度学习', primaryIds: ['dl-5'], secondaryIds: [], acceptableDecks: ['deep-learning'], acceptableConcepts: ['反向传播', 'backpropagation'] },
  { query: '梯度消失', group: '关键词-深度学习', primaryIds: ['dl-2'], secondaryIds: ['dl-1'], acceptableDecks: ['deep-learning'], acceptableConcepts: ['梯度消失', '激活函数'] },
  { query: '残差网络', group: '关键词-深度学习', primaryIds: ['dl-8'], secondaryIds: [], acceptableDecks: ['deep-learning'], acceptableConcepts: ['ResNet', '跳跃连接'] },

  // --- 大模型 ---
  { query: '注意力机制', group: '关键词-大模型', primaryIds: ['llm-1'], secondaryIds: ['llm-3'], acceptableDecks: ['llm'], acceptableConcepts: ['Attention', 'QKV'] },
  { query: '位置编码', group: '关键词-大模型', primaryIds: ['llm-4'], secondaryIds: [], acceptableDecks: ['llm'], acceptableConcepts: ['Positional Encoding'] },

  // --- Agent ---
  { query: 'RAG', group: '关键词-Agent', primaryIds: ['agent-7'], secondaryIds: ['agent-22'], acceptableDecks: ['agent'], acceptableConcepts: ['RAG', '检索增强生成'] },
  { query: '向量数据库', group: '关键词-Agent', primaryIds: ['agent-18'], secondaryIds: ['agent-19'], acceptableDecks: ['agent'], acceptableConcepts: ['向量数据库', 'Embedding'] },

  // --- Vibe Coding ---
  { query: 'MCP', group: '关键词-VibeCoding', primaryIds: ['vc-5'], secondaryIds: ['vc-17'], acceptableDecks: ['vibe-coding'], acceptableConcepts: ['MCP', '协议'] },

  // --- 黑话 ---
  { query: '赋能', group: '关键词-黑话', primaryIds: ['jargon-2'], secondaryIds: [], acceptableDecks: ['jargon'], acceptableConcepts: ['赋能', 'Empower'] },
  { query: '闭环', group: '关键词-黑话', primaryIds: ['jargon-3'], secondaryIds: [], acceptableDecks: ['jargon'], acceptableConcepts: ['闭环', 'Closed Loop'] },
  { query: '复盘', group: '关键词-黑话', primaryIds: ['jargon-6'], secondaryIds: [], acceptableDecks: ['jargon'], acceptableConcepts: ['复盘', 'Review'] },

  // --- 职场 ---
  { query: '向上管理', group: '关键词-职场', primaryIds: ['wp-2'], secondaryIds: ['wp-3'], acceptableDecks: ['workplace'], acceptableConcepts: ['向上管理', '沟通'] },
  { query: 'STAR法则', group: '关键词-职场', primaryIds: ['wp-7'], secondaryIds: [], acceptableDecks: ['workplace'], acceptableConcepts: ['STAR', '面试'] },

  // --- 扩展 ---
  { query: '决策树', group: '关键词-机器学习', primaryIds: ['ml-3'], secondaryIds: ['ml-17'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['决策树', '信息增益', '剪枝'] },
  { query: '逻辑回归', group: '关键词-机器学习', primaryIds: ['ml-1'], secondaryIds: ['ml-6'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['逻辑回归', '损失函数'] },
  { query: '支持向量机', group: '关键词-机器学习', primaryIds: ['ml-2'], secondaryIds: ['ml-19'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['SVM', '核函数'] },
  { query: '随机森林', group: '关键词-机器学习', primaryIds: ['ml-18'], secondaryIds: ['ml-38'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['随机森林', '特征重要性'] },
  { query: 'K-Means', group: '关键词-机器学习', primaryIds: ['ml-21'], secondaryIds: ['ml-23'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['KMeans', '聚类', '肘部法则'] },


  // ════════════════════ 中文概念/同义表达 (25) ════════════════════

  // --- 力扣 ---
  { query: '最长不重复子串', group: '概念-力扣', primaryIds: ['lc-019'], secondaryIds: [], acceptableDecks: ['leetcode'], acceptableConcepts: ['无重复字符', '滑动窗口'] },
  { query: '合并有序数组', group: '概念-力扣', primaryIds: ['lc-013'], secondaryIds: ['lc-038'], acceptableDecks: ['leetcode'], acceptableConcepts: ['合并', '有序数组'] },
  { query: '二叉树的最近公共祖先', group: '概念-力扣', primaryIds: ['lc-049'], secondaryIds: [], acceptableDecks: ['leetcode'], acceptableConcepts: ['LCA', '二叉树'] },

  // --- 机器学习 ---
  { query: '训练集表现很好但测试集很差是怎么回事', group: '概念-机器学习', primaryIds: ['ml-7'], secondaryIds: ['ml-8', 'ml-4'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['过拟合', '泛化', '偏差方差'] },
  { query: '怎么判断模型是不是学过头了', group: '概念-机器学习', primaryIds: ['ml-7'], secondaryIds: ['ml-9'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['过拟合', '交叉验证'] },
  { query: '样本不均衡怎么处理', group: '概念-机器学习', primaryIds: ['ml-16'], secondaryIds: [], acceptableDecks: ['machine-learning'], acceptableConcepts: ['类别不均衡', 'SMOTE'] },
  { query: '多个模型的结果怎么融合起来', group: '概念-机器学习', primaryIds: ['ml-31'], secondaryIds: ['ml-36', 'ml-32'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['集成学习', 'Bagging', 'Boosting'] },

  // --- 统计学 ---
  { query: '怎么判断两组数据有没有显著差异', group: '概念-统计学', primaryIds: ['stats-26'], secondaryIds: ['stats-28'], acceptableDecks: ['statistics'], acceptableConcepts: ['t检验', '假设检验'] },
  { query: '为什么样本方差分母是 n 减 1', group: '概念-统计学', primaryIds: ['stats-2'], secondaryIds: [], acceptableDecks: ['statistics'], acceptableConcepts: ['方差', '自由度'] },
  { query: '怎样用数据来更新我们的信念', group: '概念-统计学', primaryIds: ['stats-9'], secondaryIds: ['stats-39'], acceptableDecks: ['statistics'], acceptableConcepts: ['贝叶斯', '先验后验'] },

  // --- 深度学习 ---
  { query: '神经网络为什么不能太深也不能太浅', group: '概念-深度学习', primaryIds: ['dl-2'], secondaryIds: ['dl-8'], acceptableDecks: ['deep-learning'], acceptableConcepts: ['梯度消失', '梯度爆炸', 'ResNet'] },
  { query: '训练和推理时 dropout 行为一样吗', group: '概念-深度学习', primaryIds: ['dl-4'], secondaryIds: [], acceptableDecks: ['deep-learning'], acceptableConcepts: ['Dropout', '训练推理'] },
  { query: '生成器和判别器是怎么互相博弈的', group: '概念-深度学习', primaryIds: ['dl-11'], secondaryIds: ['dl-12'], acceptableDecks: ['deep-learning'], acceptableConcepts: ['GAN', '生成对抗'] },

  // --- 大模型 ---
  { query: '为什么 transformer 比 rnn 训练得快', group: '概念-大模型', primaryIds: ['llm-7'], secondaryIds: [], acceptableDecks: ['llm'], acceptableConcepts: ['并行化', 'Transformer'] },
  { query: '怎么在不改大模型参数的情况下让它学会新任务', group: '概念-大模型', primaryIds: ['llm-12'], secondaryIds: ['llm-16', 'llm-17'], acceptableDecks: ['llm'], acceptableConcepts: ['LoRA', 'PEFT', '微调'] },
  { query: '模型怎么知道每个 token 在句子里的位置', group: '概念-大模型', primaryIds: ['llm-4'], secondaryIds: [], acceptableDecks: ['llm'], acceptableConcepts: ['位置编码', 'Transformer'] },

  // --- Agent ---
  { query: '怎么让大模型自己去调 API', group: '概念-Agent', primaryIds: ['agent-2'], secondaryIds: ['agent-3'], acceptableDecks: ['agent'], acceptableConcepts: ['Function Calling', 'Tool-Use'] },
  { query: 'RAG 的检索结果要不要重新排个序', group: '概念-Agent', primaryIds: ['agent-25'], secondaryIds: [], acceptableDecks: ['agent'], acceptableConcepts: ['Reranking', '重排序'] },
  { query: '怎么知道 RAG 搜出来的东西靠不靠谱', group: '概念-Agent', primaryIds: ['agent-15'], secondaryIds: ['agent-17'], acceptableDecks: ['agent'], acceptableConcepts: ['评估', '幻觉'] },

  // --- Vibe Coding ---
  { query: '怎么给 AI 写项目规则文件', group: '概念-VibeCoding', primaryIds: ['vc-6'], secondaryIds: [], acceptableDecks: ['vibe-coding'], acceptableConcepts: ['CLAUDE.md', 'AGENTS.md'] },
  { query: 'agent 和 skill 的核心区别在哪', group: '概念-VibeCoding', primaryIds: ['vc-2', 'vc-1'], secondaryIds: ['vc-3'], acceptableDecks: ['vibe-coding'], acceptableConcepts: ['Agent', 'Skill', 'sub-agent'] },

  // --- 黑话 ---
  { query: '互联网公司常说的底层能力指什么', group: '概念-黑话', primaryIds: ['jargon-5'], secondaryIds: [], acceptableDecks: ['jargon'], acceptableConcepts: ['底层逻辑', '方法论'] },
  { query: '项目做完之后要总结一下经验', group: '概念-黑话', primaryIds: ['jargon-6'], secondaryIds: [], acceptableDecks: ['jargon'], acceptableConcepts: ['复盘', '回顾'] },

  // --- 职场 ---
  { query: '面试的时候怎么介绍自己的项目经历比较好', group: '概念-职场', primaryIds: ['wp-7'], secondaryIds: [], acceptableDecks: ['workplace'], acceptableConcepts: ['面试', '项目', 'STAR'] },
  { query: '怎么跟领导汇报工作进展', group: '概念-职场', primaryIds: ['wp-8'], secondaryIds: ['wp-3'], acceptableDecks: ['workplace'], acceptableConcepts: ['汇报', '向上沟通'] },


  // ════════════════════ 中英混合技术词 (25) ════════════════════

  // --- 力扣 ---
  { query: 'LRU Cache 实现', group: '混合-力扣', primaryIds: ['lc-087'], secondaryIds: [], acceptableDecks: ['leetcode'], acceptableConcepts: ['LRU', '缓存'] },
  { query: 'DFS 和 BFS 遍历二叉树', group: '混合-力扣', primaryIds: ['lc-043'], secondaryIds: ['lc-040', 'lc-041'], acceptableDecks: ['leetcode'], acceptableConcepts: ['DFS', 'BFS', '二叉树'] },

  // --- 机器学习 ---
  { query: 'XGBoost 和 LightGBM 对比', group: '混合-机器学习', primaryIds: ['ml-33', 'ml-34'], secondaryIds: ['ml-31'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['XGBoost', 'LightGBM', 'GBDT'] },
  { query: 'SVM kernel 选择', group: '混合-机器学习', primaryIds: ['ml-2'], secondaryIds: ['ml-19'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['SVM', 'kernel'] },
  { query: 'K-Means 聚类 K 值选择', group: '混合-机器学习', primaryIds: ['ml-21'], secondaryIds: [], acceptableDecks: ['machine-learning'], acceptableConcepts: ['KMeans', '肘部法则'] },
  { query: 'PCA 降维原理', group: '混合-机器学习', primaryIds: ['ml-22'], secondaryIds: ['ml-26', 'ml-48'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['PCA', '降维'] },
  { query: 'ROC AUC 怎么理解', group: '混合-机器学习', primaryIds: ['ml-50'], secondaryIds: ['ml-56'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['ROC', 'AUC'] },

  // --- 统计学 ---
  { query: 'p-value 的误解', group: '混合-统计学', primaryIds: ['stats-24'], secondaryIds: ['stats-25'], acceptableDecks: ['statistics'], acceptableConcepts: ['p值', '显著性'] },
  { query: 'MCMC 采样原理', group: '混合-统计学', primaryIds: ['stats-43'], secondaryIds: ['stats-44'], acceptableDecks: ['statistics'], acceptableConcepts: ['MCMC', '采样'] },
  { query: 'Bootstrap 和 Permutation Test', group: '混合-统计学', primaryIds: ['stats-37'], secondaryIds: ['stats-38'], acceptableDecks: ['statistics'], acceptableConcepts: ['Bootstrap', '置换检验'] },

  // --- 深度学习 ---
  { query: 'BatchNorm vs LayerNorm', group: '混合-深度学习', primaryIds: ['dl-3'], secondaryIds: ['dl-22'], acceptableDecks: ['deep-learning'], acceptableConcepts: ['BatchNorm', 'LayerNorm'] },
  { query: 'GAN mode collapse 怎么解决', group: '混合-深度学习', primaryIds: ['dl-12'], secondaryIds: [], acceptableDecks: ['deep-learning'], acceptableConcepts: ['GAN', '模式坍塌'] },
  { query: 'Adam 和 SGD 选哪个', group: '混合-深度学习', primaryIds: ['dl-30'], secondaryIds: [], acceptableDecks: ['deep-learning'], acceptableConcepts: ['Adam', 'SGD', '优化器'] },
  { query: 'Diffusion Model 前向加噪过程', group: '混合-深度学习', primaryIds: ['dl-15'], secondaryIds: ['dl-27'], acceptableDecks: ['deep-learning'], acceptableConcepts: ['扩散模型', 'Diffusion'] },

  // --- 大模型 ---
  { query: 'Self-Attention QKV 计算', group: '混合-大模型', primaryIds: ['llm-1'], secondaryIds: ['llm-2', 'llm-9'], acceptableDecks: ['llm'], acceptableConcepts: ['Self-Attention', 'QKV'] },
  { query: 'LoRA 和全量 finetune 对比', group: '混合-大模型', primaryIds: ['llm-12'], secondaryIds: ['llm-17'], acceptableDecks: ['llm'], acceptableConcepts: ['LoRA', '全参数微调'] },
  { query: 'RLHF reward model 训练', group: '混合-大模型', primaryIds: ['llm-14'], secondaryIds: ['llm-15'], acceptableDecks: ['llm'], acceptableConcepts: ['RLHF', 'reward model'] },
  { query: 'KV Cache 推理加速', group: '混合-大模型', primaryIds: ['llm-21'], secondaryIds: ['llm-26'], acceptableDecks: ['llm'], acceptableConcepts: ['KV Cache', '推理加速'] },

  // --- Agent ---
  { query: 'ReAct 框架 Reasoning Acting', group: '混合-Agent', primaryIds: ['agent-1'], secondaryIds: [], acceptableDecks: ['agent'], acceptableConcepts: ['ReAct', '推理行动'] },
  { query: 'Hybrid Search 混合检索', group: '混合-Agent', primaryIds: ['agent-26'], secondaryIds: ['agent-9'], acceptableDecks: ['agent'], acceptableConcepts: ['混合检索', 'Hybrid Search'] },

  // --- Vibe Coding ---
  { query: 'CLAUDE.md 和 AGENTS.md 优先级', group: '混合-VibeCoding', primaryIds: ['vc-6'], secondaryIds: [], acceptableDecks: ['vibe-coding'], acceptableConcepts: ['CLAUDE.md', 'AGENTS.md'] },
  { query: 'MCP server client 架构', group: '混合-VibeCoding', primaryIds: ['vc-5'], secondaryIds: ['vc-17'], acceptableDecks: ['vibe-coding'], acceptableConcepts: ['MCP', 'server', 'client'] },

  // --- 职场 ---
  { query: 'OKR 和 KPI 的区别', group: '混合-黑话', primaryIds: ['jargon-35'], secondaryIds: [], acceptableDecks: ['jargon'], acceptableConcepts: ['OKR', 'KPI', '绩效'] },

  // --- 扩展 ---
  { query: 'Sigmoid 和 Softmax 区别', group: '混合-深度学习', primaryIds: ['dl-31'], secondaryIds: [], acceptableDecks: ['deep-learning'], acceptableConcepts: ['sigmoid', 'softmax'] },
  { query: 't-SNE vs PCA 可视化', group: '混合-机器学习', primaryIds: ['ml-26'], secondaryIds: ['ml-22'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['t-SNE', 'PCA'] },


  // ════════════════════ 中文复杂面试问题 (15) ════════════════════

  { query: '请详细解释一下 Transformer 的自注意力机制是怎么计算的，Q K V 分别代表什么', group: '复杂-大模型', primaryIds: ['llm-1', 'llm-3'], secondaryIds: ['llm-2'], acceptableDecks: ['llm'], acceptableConcepts: ['Self-Attention', 'QKV', 'Multi-Head'] },
  { query: '我在训练深度学习模型时发现训练 loss 一直降但验证 loss 不降，这是什么问题，怎么解决', group: '复杂-深度学习', primaryIds: ['ml-7'], secondaryIds: ['dl-4', 'ml-9'], acceptableDecks: ['machine-learning', 'deep-learning'], acceptableConcepts: ['过拟合', 'Dropout', '交叉验证'] },
  { query: '面试官问我怎么评估一个分类模型的好坏，我应该从哪些角度回答', group: '复杂-机器学习', primaryIds: ['ml-49', 'ml-50'], secondaryIds: ['ml-51', 'ml-56'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['精确率', '召回率', 'ROC', 'AUC'] },
  { query: '有 100 万条数据但是标注只有 1 万条，这种情况该怎么办', group: '复杂-机器学习', primaryIds: ['ml-10'], secondaryIds: ['ml-9', 'ml-16'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['半监督', '正则化', '迁移学习'] },
  { query: '给我讲一下从 word2vec 到 BERT 到 GPT 的发展脉络', group: '复杂-大模型', primaryIds: ['llm-10'], secondaryIds: ['llm-8', 'llm-7'], acceptableDecks: ['llm'], acceptableConcepts: ['BERT', 'GPT', 'Transformer'] },
  { query: '怎么理解大模型 alignment 对齐这回事，为什么要做 RLHF', group: '复杂-大模型', primaryIds: ['llm-14'], secondaryIds: ['llm-11', 'llm-15'], acceptableDecks: ['llm'], acceptableConcepts: ['RLHF', '对齐', '预训练'] },
  { query: '动态规划的解题框架是什么，有什么经典例题可以举例说明', group: '复杂-力扣', primaryIds: ['lc-062'], secondaryIds: ['lc-069', 'lc-071', 'lc-073'], acceptableDecks: ['leetcode'], acceptableConcepts: ['动态规划', '爬楼梯', '编辑距离'] },
  { query: '二叉树的四种遍历方式分别是什么，各自的应用场景', group: '复杂-力扣', primaryIds: ['lc-043'], secondaryIds: ['lc-040', 'lc-041'], acceptableDecks: ['leetcode'], acceptableConcepts: ['二叉树', '遍历', '前序', '中序'] },
  { query: '能不能帮我系统梳理一下集成学习从 bagging 到 boosting 到 stacking 的演变', group: '复杂-机器学习', primaryIds: ['ml-32'], secondaryIds: ['ml-31', 'ml-36'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['Bagging', 'Boosting', 'Stacking'] },
  { query: 'AB 测试做了之后发现实验组和对照组没有显著差异，可能的原因有哪些', group: '复杂-统计学', primaryIds: ['stats-26'], secondaryIds: ['stats-31', 'stats-25'], acceptableDecks: ['statistics'], acceptableConcepts: ['假设检验', '统计功效', '样本量'] },
  { query: '怎么在实际工作中把大模型的能力集成到自己的业务系统里', group: '复杂-Agent', primaryIds: ['agent-7'], secondaryIds: ['agent-21', 'agent-2'], acceptableDecks: ['agent'], acceptableConcepts: ['RAG', 'Agentic RAG', 'Function Calling'] },
  { query: '海量数据里找相似向量最快的方案是什么', group: '复杂-Agent', primaryIds: ['agent-18'], secondaryIds: ['agent-26', 'agent-9'], acceptableDecks: ['agent'], acceptableConcepts: ['向量数据库', 'ANN', '混合检索'] },
  { query: 'Stable Diffusion 为什么在 latent space 扩散而不是像素空间', group: '复杂-深度学习', primaryIds: ['dl-16'], secondaryIds: ['dl-15'], acceptableDecks: ['deep-learning'], acceptableConcepts: ['Stable Diffusion', 'Latent Space'] },
  { query: '大模型推理太慢了，有哪些加速手段可以用', group: '复杂-大模型', primaryIds: ['llm-21', 'llm-24'], secondaryIds: ['llm-25', 'llm-26'], acceptableDecks: ['llm'], acceptableConcepts: ['KV Cache', '量化', '推理加速'] },
  { query: '作为一个面试官，我想问几个关于 MCP 协议的好问题', group: '复杂-VibeCoding', primaryIds: ['vc-5'], secondaryIds: ['vc-17'], acceptableDecks: ['vibe-coding'], acceptableConcepts: ['MCP', '协议'] },


  // ════════════════════ 纯英文语义查询 (5) ════════════════════

  { query: 'gradient descent optimization', group: '英文-机器学习', primaryIds: ['ml-11', 'ml-57'], secondaryIds: ['ml-58'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['gradient descent', 'SGD', 'optimization'] },
  { query: 'self attention mechanism transformer', group: '英文-大模型', primaryIds: ['llm-1', 'llm-3'], secondaryIds: ['llm-9'], acceptableDecks: ['llm'], acceptableConcepts: ['self-attention', 'Transformer'] },
  { query: 'how to evaluate retrieval augmented generation', group: '英文-Agent', primaryIds: ['agent-22', 'agent-15'], secondaryIds: ['agent-7'], acceptableDecks: ['agent'], acceptableConcepts: ['RAG', 'evaluation'] },
  { query: 'overfitting vs underfitting deep learning', group: '英文-机器学习', primaryIds: ['ml-7'], secondaryIds: ['ml-8', 'dl-4'], acceptableDecks: ['machine-learning', 'deep-learning'], acceptableConcepts: ['overfitting', 'underfitting'] },
  { query: 'binary tree traversal preorder inorder postorder', group: '英文-力扣', primaryIds: ['lc-043', 'lc-040'], secondaryIds: ['lc-041'], acceptableDecks: ['leetcode'], acceptableConcepts: ['binary tree', 'traversal', 'DFS'] },

  // ════════════════════ 学习路径推荐 (5) ════════════════════
  // 用户用自然语言表达学习意图，期望返回概念相关的系列卡片

  { query: '假如我想学习决策树，我应该学习哪些卡片', group: '学习路径-机器学习', primaryIds: ['ml-3'], secondaryIds: ['ml-16', 'ml-17'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['决策树', '随机森林', '集成学习'] },
  { query: '现在想入门深度学习，需要看哪些基础卡片', group: '学习路径-深度学习', primaryIds: ['dl-1'], secondaryIds: ['dl-2', 'dl-3', 'dl-5'], acceptableDecks: ['deep-learning'], acceptableConcepts: ['深度学习', '反向传播', '激活函数'] },
  { query: '我 Transformer 不太懂，帮我找相关卡片', group: '学习路径-大模型', primaryIds: ['llm-1'], secondaryIds: ['llm-3', 'llm-4', 'llm-9'], acceptableDecks: ['llm'], acceptableConcepts: ['Transformer', 'Attention', '位置编码'] },
  { query: '想刷动态规划，推荐几道题', group: '学习路径-力扣', primaryIds: ['lc-062'], secondaryIds: ['lc-063', 'lc-064', 'lc-067'], acceptableDecks: ['leetcode'], acceptableConcepts: ['动态规划', 'DP'] },
  { query: '如何系统地学习假设检验', group: '学习路径-统计学', primaryIds: ['stats-24', 'stats-25'], secondaryIds: ['stats-26', 'stats-27'], acceptableDecks: ['statistics'], acceptableConcepts: ['假设检验', 'p值', 't检验'] },

  // ════════════════════ 长句自然语言查询 (15) ════════════════════
  // 模拟真实用户日常提问，包含大量口语填充词

  // --- 机器学习 ---
  { query: '面试官如果问我 SVM 的原理和核函数怎么选，我该怎么回答比较好', group: '长句-机器学习', primaryIds: ['ml-2'], secondaryIds: ['ml-19', 'ml-20'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['SVM', '核函数', 'kernel'] },
  { query: '最近在复习机器学习基础，想问一下偏差和方差到底怎么理解，有什么直观的例子吗', group: '长句-机器学习', primaryIds: ['ml-8'], secondaryIds: ['ml-7'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['偏差方差', 'bias-variance', '过拟合'] },
  { query: '我有个数据集样本特别不均衡，正样本只有百分之五，这种情况一般怎么处理比较好', group: '长句-机器学习', primaryIds: ['ml-16'], secondaryIds: ['ml-17', 'ml-50'], acceptableDecks: ['machine-learning'], acceptableConcepts: ['样本不均衡', 'SMOTE', '类别权重'] },

  // --- 深度学习 ---
  { query: '能不能用通俗易懂的方式给我解释一下 Batch Normalization 到底做了什么事情', group: '长句-深度学习', primaryIds: ['dl-3'], secondaryIds: ['dl-2'], acceptableDecks: ['deep-learning'], acceptableConcepts: ['BatchNorm', '归一化'] },
  { query: '我在做图像分类任务，模型训练了好几个小时一直在震荡不收敛，可能是什么原因', group: '长句-深度学习', primaryIds: ['dl-2'], secondaryIds: ['dl-1', 'dl-5'], acceptableDecks: ['deep-learning'], acceptableConcepts: ['梯度消失', '激活函数', '学习率'] },

  // --- 大模型 ---
  { query: '我们团队想把一个大模型部署到生产环境，但是推理速度太慢了，有没有什么加速的方案可以推荐一下', group: '长句-大模型', primaryIds: ['llm-15'], secondaryIds: ['llm-16', 'llm-17'], acceptableDecks: ['llm'], acceptableConcepts: ['推理加速', '量化', 'KV Cache'] },
  { query: '想了解一下现在主流的 prompt engineering 技巧有哪些，有没有什么套路可以参考', group: '长句-大模型', primaryIds: ['llm-14'], secondaryIds: ['llm-13'], acceptableDecks: ['llm'], acceptableConcepts: ['Prompt', 'CoT', 'Few-shot'] },

  // --- 统计学 ---
  { query: '领导让我分析一下新功能上线前后用户留存有没有显著变化，我应该用什么统计方法', group: '长句-统计学', primaryIds: ['stats-24'], secondaryIds: ['stats-25', 'stats-26'], acceptableDecks: ['statistics'], acceptableConcepts: ['AB测试', '假设检验', '显著性'] },
  { query: '面试被问到中心极限定理，我其实一直没完全理解它的实际应用场景，能帮我梳理一下吗', group: '长句-统计学', primaryIds: ['stats-10'], secondaryIds: ['stats-11'], acceptableDecks: ['statistics'], acceptableConcepts: ['中心极限定理', '大数定律', '抽样分布'] },

  // --- 力扣 ---
  { query: '力扣里面二叉树相关的题目我做得不太好，尤其是递归遍历老是写错，有哪些经典题可以练手', group: '长句-力扣', primaryIds: ['lc-043'], secondaryIds: ['lc-040', 'lc-041', 'lc-039'], acceptableDecks: ['leetcode'], acceptableConcepts: ['二叉树', '遍历', '递归'] },
  { query: '最近在刷数组相关的题，哈希表和双指针这两类经常搞混，什么时候用哈希什么时候用双指针', group: '长句-力扣', primaryIds: ['lc-001'], secondaryIds: ['lc-002', 'lc-005'], acceptableDecks: ['leetcode'], acceptableConcepts: ['哈希表', '双指针', '数组'] },

  // --- Agent ---
  { query: '我们想在公司内部搭建一个基于 RAG 的知识库问答系统，从技术选型到落地有什么需要注意的地方', group: '长句-Agent', primaryIds: ['agent-7'], secondaryIds: ['agent-15', 'agent-18', 'agent-22'], acceptableDecks: ['agent'], acceptableConcepts: ['RAG', '检索增强生成', '知识库'] },
  { query: 'Agent 开发里面 ReAct 模式和 Function Calling 到底有什么区别，什么时候用哪个', group: '长句-Agent', primaryIds: ['agent-2'], secondaryIds: ['agent-3', 'agent-4'], acceptableDecks: ['agent'], acceptableConcepts: ['ReAct', 'Function Calling', 'Tool Use'] },

  // --- 职场 ---
  { query: '下周要跟领导做季度述职汇报了，怎么把工作成果讲得有条理又有亮点，有什么推荐的框架吗', group: '长句-职场', primaryIds: ['wp-3'], secondaryIds: ['wp-8'], acceptableDecks: ['workplace'], acceptableConcepts: ['汇报', '向上沟通', '述职'] },
  { query: '最近想跳槽但是简历投出去都没有回音，想请教一下怎么写简历才能让 HR 眼前一亮', group: '长句-职场', primaryIds: ['wp-7'], secondaryIds: ['wp-6', 'wp-5'], acceptableDecks: ['workplace'], acceptableConcepts: ['简历', '面试', 'STAR法则'] },

];
