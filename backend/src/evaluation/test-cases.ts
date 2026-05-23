// backend/src/evaluation/test-cases.ts — 478 条 AI 搜索评测测试集
//
// Cleaned + label-audited + primaryId-fixed
//
// 牌组 ID：leetcode=力扣, statistics=统计学, machine-learning=机器学习
//          deep-learning=深度学习, llm=大模型, agent=Agent
//          vibe-coding=Vibe Coding, jargon=黑话, workplace=职场

import type { TestCase } from './types';

export const TEST_CASES: TestCase[] = [
  { query: "AB实验平台学习路线", group: "learning-path", primaryIds: ["stats-102","stats-116"], secondaryIds: ["stats-118"], acceptableDecks: ["statistics"], acceptableConcepts: ["AB.*实验|A/B|分流"] },

  { query: "AI产品经理要学什么", group: "learning-path", primaryIds: ["agent-13","agent-21"], secondaryIds: ["agent-3"], acceptableDecks: ["agent"], acceptableConcepts: ["Agent|产品|Prompt"] },

  { query: "Agent开发学习路线", group: "learning-path", primaryIds: ["agent-21","agent-3"], secondaryIds: ["agent-4"], acceptableDecks: ["agent"], acceptableConcepts: ["Agent|AutoGPT|Planni"] },

  { query: "CICD流水线学习路线", group: "learning-path", primaryIds: ["stats-154","stats-176"], secondaryIds: ["stats-177"], acceptableDecks: ["statistics"], acceptableConcepts: ["CI|CD|Jenkins|GitLab"] },

  { query: "CV图像分类学习路线", group: "learning-path", primaryIds: ["dl-6","ml-155"], secondaryIds: ["ml-185"], acceptableDecks: ["deep-learning","machine-learning"], acceptableConcepts: ["CNN|图像|分类"] },

  { query: "LLM大模型学习路线", group: "learning-path", primaryIds: ["llm-10","llm-18"], secondaryIds: ["llm-21","dl-17"], acceptableDecks: ["deep-learning","llm"], acceptableConcepts: ["Transformer|GPT|LLM"] },

  { query: "MLOps学习路线", group: "learning-path", primaryIds: ["ml-158","ml-160"], secondaryIds: ["ml-164"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["MLOps|部署|监控"] },

  { query: "NLP文本分类学习路线", group: "learning-path", primaryIds: ["llm-10","ml-109"], secondaryIds: ["ml-110"], acceptableDecks: ["llm","machine-learning"], acceptableConcepts: ["NLP|BERT|文本.*分类"] },

  { query: "Prompt Engineering怎么入行", group: "learning-path", primaryIds: ["agent-13"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["Prompt|提示词|Pe.*工程"] },

  { query: "RAG学习路线", group: "learning-path", primaryIds: ["agent-10","agent-11"], secondaryIds: ["agent-12"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG|检索.*增强"] },

  { query: "Snap AR做滤镜要学什么", group: "learning-path", primaryIds: ["vc-11"], secondaryIds: [], acceptableDecks: ["vibe-coding"], acceptableConcepts: ["AR|滤镜|编程"] },

  { query: "为什么学NLP先学Transformer", group: "learning-path", primaryIds: ["llm-1","llm-2"], secondaryIds: ["llm-26","dl-25"], acceptableDecks: ["deep-learning","llm"], acceptableConcepts: ["Transformer|NLP|Atte"] },

  { query: "什么是好的解释性文章", group: "learning-path", primaryIds: ["ml-137","ml-181"], secondaryIds: ["ml-73"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["可解释|XAI|SHAP|LIME"] },

  { query: "从零学AI需要哪些数学", group: "learning-path", primaryIds: ["stats-15","stats-44"], secondaryIds: [], acceptableDecks: ["machine-learning","statistics"], acceptableConcepts: ["线性代数|概率|微积分"] },

  { query: "分布式系统学习路线", group: "learning-path", primaryIds: ["stats-126"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["分布式|CAP|一致性"] },

  { query: "到底怎么快速入门ML", group: "learning-path", primaryIds: ["ml-134","ml-136"], secondaryIds: ["ml-189"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["入门|机器学习|基础"] },

  { query: "后端转算法要补什么", group: "learning-path", primaryIds: ["ml-10","ml-134"], secondaryIds: ["ml-136","stats-101"], acceptableDecks: ["machine-learning","statistics"], acceptableConcepts: ["机器学习|统计|数学"] },

  { query: "因果推断学习路线", group: "learning-path", primaryIds: ["stats-136","stats-145"], secondaryIds: ["stats-6"], acceptableDecks: ["statistics"], acceptableConcepts: ["因果|Causal|Inference"] },

  { query: "图神经网络学习路线", group: "learning-path", primaryIds: ["ml-102","ml-103"], secondaryIds: [], acceptableDecks: ["deep-learning","machine-learning"], acceptableConcepts: ["图.*神经|Graph.*Neural"] },

  { query: "大数据Spark学习路线", group: "learning-path", primaryIds: ["stats-149","stats-152"], secondaryIds: ["stats-153"], acceptableDecks: ["statistics"], acceptableConcepts: ["Spark|Hadoop|大数据"] },

  { query: "大模型微调学习路线", group: "learning-path", primaryIds: ["llm-12","llm-13"], secondaryIds: ["llm-17"], acceptableDecks: ["llm"], acceptableConcepts: ["微调|SFT|LoRA|适配"] },

  { query: "学AI先懂理论还是先会调包", group: "learning-path", primaryIds: ["ml-99"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["理论|实践|调包|框架"] },

  { query: "小众但卷的AI赛道有哪些", group: "learning-path", primaryIds: ["ml-57"], secondaryIds: [], acceptableDecks: ["llm","machine-learning"], acceptableConcepts: ["赛道|方向|趋势"] },

  { query: "广告CTR预估学习路线", group: "learning-path", primaryIds: ["ml-176","ml-90"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["CTR|广告|预估"] },

  { query: "强化学习从入门到实践", group: "learning-path", primaryIds: ["ml-112","ml-113"], secondaryIds: ["ml-114"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["强化|RL|DQN|Policy"] },

  { query: "想做算法工程师要学什么", group: "learning-path", primaryIds: ["ml-134","ml-136"], secondaryIds: ["ml-189","dl-10"], acceptableDecks: ["deep-learning","machine-learning"], acceptableConcepts: ["机器学习|深度学习|基础"] },

  { query: "想学推荐系统需要什么数学基础", group: "learning-path", primaryIds: ["ml-103","ml-11"], secondaryIds: ["ml-117","stats-124"], acceptableDecks: ["machine-learning","statistics"], acceptableConcepts: ["推荐|矩阵|优化"] },

  { query: "想进FAANG要学哪些技术", group: "learning-path", primaryIds: ["ml-113","ml-115"], secondaryIds: [], acceptableDecks: ["leetcode","machine-learning"], acceptableConcepts: ["算法|系统设计|FAANG"] },

  { query: "推荐系统学习路线", group: "learning-path", primaryIds: ["ml-103","ml-117"], secondaryIds: ["ml-133","stats-124"], acceptableDecks: ["machine-learning","statistics"], acceptableConcepts: ["推荐|协同过滤"] },

  { query: "时间序列预测学习路线", group: "learning-path", primaryIds: ["stats-86","stats-88"], secondaryIds: ["stats-91","ml-148"], acceptableDecks: ["machine-learning","statistics"], acceptableConcepts: ["时间序列|ARIMA|Prophet"] },

  { query: "本科生想做数据科学要掌握什么", group: "learning-path", primaryIds: ["ml-166","ml-167"], secondaryIds: [], acceptableDecks: ["machine-learning","statistics"], acceptableConcepts: ["数据科学|统计分析|Python"] },

  { query: "模型部署从哪开始学", group: "learning-path", primaryIds: ["llm-21","llm-26"], secondaryIds: ["llm-25","ml-160"], acceptableDecks: ["llm","machine-learning"], acceptableConcepts: ["部署|推理|ONNX|vLLM"] },

  { query: "统计学习方法书籍推荐", group: "learning-path", primaryIds: ["ml-126","ml-17"], secondaryIds: ["ml-19"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["统计学习|李航|SVM|决策树"] },

  { query: "自学CS基础要学哪些课", group: "learning-path", primaryIds: ["ml-113","ml-115"], secondaryIds: [], acceptableDecks: ["leetcode","machine-learning"], acceptableConcepts: ["数据结构|算法|操作系统"] },

  { query: "转行DS技术栈清单", group: "learning-path", primaryIds: ["stats-101","stats-11"], secondaryIds: ["stats-118"], acceptableDecks: ["statistics"], acceptableConcepts: ["SQL|Python|可视化|统计"] },

  { query: "风控建模学习路线", group: "learning-path", primaryIds: ["ml-103","ml-128"], secondaryIds: ["ml-146"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["风控|Fraud|异常.*检测"] },

  { query: "Agent规划", group: "关键词-Agent", primaryIds: ["agent-4","agent-8","agent-5","agent-6"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["规划","Planning","Planning|规划|AutoGPT"] },

  { query: "Agent记忆", group: "关键词-Agent", primaryIds: ["agent-21"], secondaryIds: ["agent-5"], acceptableDecks: ["agent"], acceptableConcepts: ["记忆","Memory"] },

  { query: "Function Calling", group: "关键词-Agent", primaryIds: ["agent-2","agent-3"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["FunctionCalling","FC","工具调用"] },

  { query: "Function Calling", group: "关键词-Agent", primaryIds: ["agent-2","agent-3"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["Function Calling","Tool-Use"] },

  { query: "RAG", group: "关键词-Agent", primaryIds: ["agent-7"], secondaryIds: ["agent-22"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG","检索增强生成"] },

  { query: "Reranking", group: "关键词-Agent", primaryIds: ["agent-25"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["Reranking","重排序"] },

  { query: "Reranking重排序", group: "关键词-Agent", primaryIds: ["agent-25"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["Rerank|重排"] },

  { query: "Tool Use", group: "关键词-Agent", primaryIds: ["agent-2","agent-3"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["Tool Use","Function Calling","ToolUse"] },

  { query: "向量数据库", group: "关键词-Agent", primaryIds: ["agent-18"], secondaryIds: ["agent-19"], acceptableDecks: ["agent"], acceptableConcepts: ["向量数据库","Embedding"] },

  { query: "MCP", group: "关键词-VibeCoding", primaryIds: ["vc-5"], secondaryIds: ["vc-17"], acceptableDecks: ["vibe-coding"], acceptableConcepts: ["MCP","协议"] },

  { query: "MCP协议", group: "关键词-VibeCoding", primaryIds: ["vc-17","vc-5"], secondaryIds: [], acceptableDecks: ["vibe-coding"], acceptableConcepts: ["MCP"] },

  { query: "Skill", group: "关键词-VibeCoding", primaryIds: ["vc-2","vc-1","vc-10"], secondaryIds: [], acceptableDecks: ["vibe-coding"], acceptableConcepts: ["Skill","skill|command"] },

  { query: "Trie字典树", group: "关键词-力扣", primaryIds: ["lc-055"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["Trie|Prefix"] },

  { query: "两数之和", group: "关键词-力扣", primaryIds: ["lc-001"], secondaryIds: ["lc-016"], acceptableDecks: ["leetcode"], acceptableConcepts: ["数组","哈希表"] },

  { query: "二分查找", group: "关键词-力扣", primaryIds: ["lc-023","lc-024","lc-026"], secondaryIds: ["lc-040"], acceptableDecks: ["leetcode"], acceptableConcepts: ["二分查找","binary search","Search|Binary"] },

  { query: "二叉树的最近公共祖先", group: "关键词-力扣", primaryIds: ["lc-049"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["LCA|Lowest"] },

  { query: "动态规划", group: "关键词-力扣", primaryIds: ["lc-062","lc-067"], secondaryIds: ["lc-069"], acceptableDecks: ["leetcode"], acceptableConcepts: ["DP","动态规划"] },

  { query: "动态规划DP", group: "关键词-力扣", primaryIds: ["lc-062","lc-065"], secondaryIds: ["lc-067"], acceptableDecks: ["leetcode"], acceptableConcepts: ["Climbing|Coin|House"] },

  { query: "单调栈", group: "关键词-力扣", primaryIds: ["lc-035","lc-036","lc-030","lc-008","lc-029"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["单调栈","接雨水","Daily|Trapping|Min S"] },

  { query: "反转链表", group: "关键词-力扣", primaryIds: ["lc-033"], secondaryIds: ["lc-039"], acceptableDecks: ["leetcode"], acceptableConcepts: ["链表","反转"] },

  { query: "回文串", group: "关键词-力扣", primaryIds: ["lc-018","lc-039"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["回文","palindrome","Palindr|回文"] },

  { query: "字典树", group: "关键词-力扣", primaryIds: ["lc-055"], secondaryIds: ["lc-056"], acceptableDecks: ["leetcode"], acceptableConcepts: ["Trie","前缀树"] },

  { query: "字典树Trie", group: "关键词-力扣", primaryIds: ["lc-055","lc-056"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["Trie"] },

  { query: "岛屿DFS", group: "关键词-力扣", primaryIds: ["lc-052"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["Islands|岛屿"] },

  { query: "岛屿问题", group: "关键词-力扣", primaryIds: ["lc-052"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["DFS","网格","岛屿"] },

  { query: "并查集", group: "关键词-力扣", primaryIds: ["lc-083","lc-084","lc-053","lc-052"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["并查集","Union Find","UnionFind"] },

  { query: "拓扑排序", group: "关键词-力扣", primaryIds: ["lc-053"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["拓扑排序","BFS"] },

  { query: "接雨水", group: "关键词-力扣", primaryIds: ["lc-008"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["双指针","单调栈"] },

  { query: "滑动窗口", group: "关键词-力扣", primaryIds: ["lc-019","lc-022"], secondaryIds: ["lc-015","lc-016"], acceptableDecks: ["leetcode"], acceptableConcepts: ["滑动窗口","双指针","Sliding|滑动"] },

  { query: "爬楼梯", group: "关键词-力扣", primaryIds: ["lc-062"], secondaryIds: ["lc-069"], acceptableDecks: ["leetcode"], acceptableConcepts: ["动态规划","斐波那契"] },

  { query: "背包问题", group: "关键词-力扣", primaryIds: ["lc-073","lc-074","lc-076"], secondaryIds: ["lc-071"], acceptableDecks: ["leetcode"], acceptableConcepts: ["背包","Partition|Knapsack|B"] },

  { query: "BERT", group: "关键词-大模型", primaryIds: ["llm-10"], secondaryIds: ["llm-17","llm-12"], acceptableDecks: ["llm"], acceptableConcepts: ["BERT","预训练","MLM"] },

  { query: "BERT预训练", group: "关键词-大模型", primaryIds: ["llm-10"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["BERT"] },

  { query: "GPT", group: "关键词-大模型", primaryIds: ["llm-10","llm-7","llm-24"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["GPT","自回归","decoder"] },

  { query: "GPT大模型", group: "关键词-大模型", primaryIds: ["llm-10","llm-24"], secondaryIds: ["llm-39"], acceptableDecks: ["llm"], acceptableConcepts: ["GPT"] },

  { query: "KV Cache推理加速", group: "关键词-大模型", primaryIds: ["llm-21","llm-26"], secondaryIds: ["llm-25"], acceptableDecks: ["llm"], acceptableConcepts: ["KV|vLLM|推理|PagedA"] },

  { query: "RLHF对齐", group: "关键词-大模型", primaryIds: ["llm-11","llm-14"], secondaryIds: ["llm-15"], acceptableDecks: ["llm"], acceptableConcepts: ["RLHF|DPO|对齐"] },

  { query: "Transformer", group: "关键词-大模型", primaryIds: ["llm-1","llm-3","llm-2"], secondaryIds: ["llm-38"], acceptableDecks: ["llm"], acceptableConcepts: ["Transformer","Self-Attention","Transformer|Self-Att"] },

  { query: "位置编码", group: "关键词-大模型", primaryIds: ["llm-4"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["Positional Encoding","位置编码|Positional"] },

  { query: "多头注意力", group: "关键词-大模型", primaryIds: ["llm-3","llm-9"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["Multi-Head Attention","Multi-Head"] },

  { query: "微调Fine-tuning", group: "关键词-大模型", primaryIds: ["llm-11","llm-12"], secondaryIds: ["llm-13"], acceptableDecks: ["llm"], acceptableConcepts: ["微调|Finetun|SFT"] },

  { query: "模型量化", group: "关键词-大模型", primaryIds: ["llm-24","llm-42"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["量化|Quantiz"] },

  { query: "残差连接", group: "关键词-大模型", primaryIds: ["dl-10","dl-19"], secondaryIds: [], acceptableDecks: ["llm","deep-learning"], acceptableConcepts: ["残差连接","ResNet"] },

  { query: "注意力机制", group: "关键词-大模型", primaryIds: ["llm-1"], secondaryIds: ["llm-3"], acceptableDecks: ["llm"], acceptableConcepts: ["Attention","QKV"] },

  { query: "词嵌入", group: "关键词-大模型", primaryIds: ["ml-105","ml-109"], secondaryIds: ["ml-89"], acceptableDecks: ["llm","machine-learning"], acceptableConcepts: ["Embedding","Word2Vec"] },

  { query: "Bagging Boosting", group: "关键词-机器学习", primaryIds: ["ml-32","ml-31"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["集成"] },

  { query: "Bagging Boosting Stacking", group: "关键词-机器学习", primaryIds: ["ml-32","ml-31","ml-36"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["集成学习"] },

  { query: "K-Means", group: "关键词-机器学习", primaryIds: ["ml-21"], secondaryIds: ["ml-23"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["KMeans","聚类","肘部法则"] },

  { query: "KMeans聚类", group: "关键词-机器学习", primaryIds: ["ml-124","ml-125"], secondaryIds: ["ml-21"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["K-Means|聚类"] },

  { query: "L1 L2", group: "关键词-机器学习", primaryIds: ["ml-10","ml-20"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["正则化"] },

  { query: "L1 L2正则化", group: "关键词-机器学习", primaryIds: ["ml-10","ml-20"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["L1","L2","正则化"] },

  { query: "Precision F1", group: "关键词-机器学习", primaryIds: ["ml-49","ml-51","ml-184"], secondaryIds: ["ml-56"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["F1","Precision|F1|精确率"] },

  { query: "Precision Recall F1", group: "关键词-机器学习", primaryIds: ["ml-49","ml-51"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["精确率","召回率","F1"] },

  { query: "Q-learning", group: "关键词-机器学习", primaryIds: ["ml-114"], secondaryIds: ["ml-115"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Q-learning","DQN","Q-Learning|DQN"] },

  { query: "交叉验证", group: "关键词-机器学习", primaryIds: ["ml-9"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["K折","交叉验证"] },

  { query: "偏差方差", group: "关键词-机器学习", primaryIds: ["ml-8"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["偏差","方差","泛化"] },

  { query: "偏差方差权衡", group: "关键词-机器学习", primaryIds: ["ml-188","ml-8"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["偏差.*方差|Bias.*Varianc"] },

  { query: "决策树", group: "关键词-机器学习", primaryIds: ["ml-3"], secondaryIds: ["ml-17"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["决策树","信息增益","剪枝"] },

  { query: "半监督学习", group: "关键词-机器学习", primaryIds: ["ml-111","ml-118","ml-122"], secondaryIds: ["ml-10","ml-146"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["半监督","标签传播","自监督|半监督"] },

  { query: "强化学习", group: "关键词-机器学习", primaryIds: ["ml-112"], secondaryIds: ["ml-117"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["强化学习","MDP","Q-learning","RL"] },

  { query: "强化学习RL", group: "关键词-机器学习", primaryIds: ["ml-112","ml-117"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["强化学习|Reinforcement"] },

  { query: "损失函数", group: "关键词-机器学习", primaryIds: ["ml-1","ml-53","ml-142","ml-143"], secondaryIds: ["ml-144"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["损失函数","交叉熵","MSE","损失函数|交叉熵"] },

  { query: "支持向量机", group: "关键词-机器学习", primaryIds: ["ml-2"], secondaryIds: ["ml-19"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["SVM","核函数"] },

  { query: "朴素贝叶斯", group: "关键词-机器学习", primaryIds: ["ml-179","ml-183"], secondaryIds: ["stats-9"], acceptableDecks: ["machine-learning","statistics"], acceptableConcepts: ["朴素贝叶斯","贝叶斯"] },

  { query: "梯度下降", group: "关键词-机器学习", primaryIds: ["ml-11","ml-157","ml-57"], secondaryIds: ["ml-58"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["梯度下降","SGD","优化器","梯度下降|SGD"] },

  { query: "欠拟合", group: "关键词-机器学习", primaryIds: ["ml-7"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["欠拟合|underfit"] },

  { query: "正则化", group: "关键词-机器学习", primaryIds: ["ml-10"], secondaryIds: ["ml-20"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["L1","L2","正则化"] },

  { query: "特征工程", group: "关键词-机器学习", primaryIds: ["ml-13","ml-46","ml-129"], secondaryIds: ["ml-138"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["特征工程","特征选择","特征"] },

  { query: "特征缩放", group: "关键词-机器学习", primaryIds: ["ml-13","ml-45"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["特征缩放","归一化","标准化"] },

  { query: "聚类算法", group: "关键词-机器学习", primaryIds: ["ml-21","ml-23"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["聚类","KMeans","DBSCAN"] },

  { query: "迁移学习", group: "关键词-机器学习", primaryIds: ["ml-149","ml-151","ml-177"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["迁移学习","fine-tune"] },

  { query: "迁移学习Transfer", group: "关键词-机器学习", primaryIds: ["ml-149","ml-151"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["迁移|Transfer"] },

  { query: "过拟合", group: "关键词-机器学习", primaryIds: ["ml-7"], secondaryIds: ["ml-8"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["过拟合","欠拟合","偏差方差"] },

  { query: "逻辑回归", group: "关键词-机器学习", primaryIds: ["ml-1"], secondaryIds: ["ml-6"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["逻辑回归","损失函数"] },

  { query: "降维", group: "关键词-机器学习", primaryIds: ["ml-22","ml-26"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["降维","PCA","t-SNE"] },

  { query: "降维PCA", group: "关键词-机器学习", primaryIds: ["ml-141","ml-22"], secondaryIds: ["ml-26"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["PCA|降维"] },

  { query: "随机梯度下降", group: "关键词-机器学习", primaryIds: ["ml-157","ml-11"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["SGD","梯度下降"] },

  { query: "随机梯度下降SGD", group: "关键词-机器学习", primaryIds: ["ml-11","ml-57"], secondaryIds: ["ml-58"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["SGD|梯度下降"] },

  { query: "随机森林", group: "关键词-机器学习", primaryIds: ["ml-18"], secondaryIds: ["ml-38"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["随机森林","特征重要性"] },

  { query: "集成学习Bagging Boosting", group: "关键词-机器学习", primaryIds: ["ml-189","ml-32"], secondaryIds: ["ml-36"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Bagging|Boosting|集成"] },

  { query: "Adam优化器", group: "关键词-深度学习", primaryIds: ["dl-30"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["Adam","优化器"] },

  { query: "BatchNorm归一化", group: "关键词-深度学习", primaryIds: ["dl-21","dl-22"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["BatchNorm|归一化"] },

  { query: "CNN卷积神经网络", group: "关键词-深度学习", primaryIds: ["dl-6"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["CNN|卷积"] },

  { query: "Dropout", group: "关键词-深度学习", primaryIds: ["dl-4"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["Dropout","过拟合"] },

  { query: "GAN", group: "关键词-深度学习", primaryIds: ["dl-11","dl-12"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["GAN"] },

  { query: "GAN生成对抗", group: "关键词-深度学习", primaryIds: ["dl-11","dl-12"], secondaryIds: ["dl-14"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["GAN","生成对抗"] },

  { query: "GAN生成对抗网络", group: "关键词-深度学习", primaryIds: ["dl-11","dl-12"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["GAN"] },

  { query: "RNN", group: "关键词-深度学习", primaryIds: ["dl-9","dl-10"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["RNN","LSTM","GRU"] },

  { query: "RNN循环神经网络", group: "关键词-深度学习", primaryIds: ["dl-24","dl-7"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["RNN|LSTM"] },

  { query: "卷积神经网络", group: "关键词-深度学习", primaryIds: ["dl-14"], secondaryIds: ["dl-6","dl-18"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["CNN","卷积"] },

  { query: "反向传播", group: "关键词-深度学习", primaryIds: ["dl-5"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["反向传播","backpropagation"] },

  { query: "归一化", group: "关键词-深度学习", primaryIds: ["dl-3","dl-22"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["BatchNorm","LayerNorm"] },

  { query: "梯度消失", group: "关键词-深度学习", primaryIds: ["dl-2"], secondaryIds: ["dl-1"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["梯度消失","激活函数"] },

  { query: "残差网络", group: "关键词-深度学习", primaryIds: ["dl-8"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["ResNet","跳跃连接"] },

  { query: "激活函数", group: "关键词-深度学习", primaryIds: ["dl-1","dl-31","dl-24"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["激活函数","ReLU","sigmoid"] },

  { query: "MLE", group: "关键词-统计学", primaryIds: ["stats-195"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["MLE"] },

  { query: "P值显著性", group: "关键词-统计学", primaryIds: ["stats-134","stats-162"], secondaryIds: ["stats-170"], acceptableDecks: ["statistics"], acceptableConcepts: ["P.*值|显著性"] },

  { query: "余弦相似度", group: "关键词-统计学", primaryIds: ["stats-16","ml-59"], secondaryIds: ["ml-47","agent-19"], acceptableDecks: ["statistics","machine-learning","agent"], acceptableConcepts: ["余弦相似度","余弦"] },

  { query: "假设检验", group: "关键词-统计学", primaryIds: ["stats-24","stats-105","stats-107"], secondaryIds: ["stats-25","stats-119"], acceptableDecks: ["statistics"], acceptableConcepts: ["p值","假设检验","假设检验|t.*检验"] },

  { query: "先验后验", group: "关键词-统计学", primaryIds: ["stats-9","stats-15"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["贝叶斯","先验","后验"] },

  { query: "协方差", group: "关键词-统计学", primaryIds: ["stats-17","stats-146"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["协方差","相关系数"] },

  { query: "卡方检验", group: "关键词-统计学", primaryIds: ["stats-27","stats-28"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["卡方检验","独立性检验","卡方"] },

  { query: "大数定律", group: "关键词-统计学", primaryIds: ["stats-10"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["大数定律","中心极限定理"] },

  { query: "数据倾斜", group: "关键词-统计学", primaryIds: ["stats-187"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["数据倾斜|倾斜"] },

  { query: "方差分析", group: "关键词-统计学", primaryIds: ["stats-29"], secondaryIds: ["stats-30"], acceptableDecks: ["statistics"], acceptableConcepts: ["ANOVA","方差分析"] },

  { query: "方差分析ANOVA", group: "关键词-统计学", primaryIds: ["stats-106","stats-146"], secondaryIds: ["stats-32"], acceptableDecks: ["statistics"], acceptableConcepts: ["ANOVA|方差分析"] },

  { query: "最大似然估计", group: "关键词-统计学", primaryIds: ["stats-100","stats-109"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["MLE","似然函数"] },

  { query: "最大似然估计MLE", group: "关键词-统计学", primaryIds: ["stats-195","stats-39"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["MLE|似然"] },

  { query: "正态分布", group: "关键词-统计学", primaryIds: ["stats-11","stats-101","stats-114"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["正态分布","高斯"] },

  { query: "线性回归", group: "关键词-统计学", primaryIds: ["stats-47","stats-49"], secondaryIds: ["stats-54"], acceptableDecks: ["statistics"], acceptableConcepts: ["线性回归","OLS"] },

  { query: "置信区间", group: "关键词-统计学", primaryIds: ["stats-8"], secondaryIds: ["stats-7"], acceptableDecks: ["statistics"], acceptableConcepts: ["置信区间","标准误差"] },

  { query: "贝叶斯定理", group: "关键词-统计学", primaryIds: ["stats-9","stats-15","stats-39"], secondaryIds: ["stats-41"], acceptableDecks: ["statistics"], acceptableConcepts: ["贝叶斯","条件概率","先验","后验"] },

  { query: "STAR法则", group: "关键词-职场", primaryIds: ["wp-7"], secondaryIds: [], acceptableDecks: ["workplace"], acceptableConcepts: ["STAR","面试"] },

  { query: "向上管理", group: "关键词-职场", primaryIds: ["wp-2"], secondaryIds: ["wp-3"], acceptableDecks: ["workplace"], acceptableConcepts: ["向上管理","沟通"] },

  { query: "述职", group: "关键词-职场", primaryIds: ["wp-3","wp-8"], secondaryIds: [], acceptableDecks: ["workplace"], acceptableConcepts: ["述职","汇报"] },

  { query: "述职汇报", group: "关键词-职场", primaryIds: ["wp-3","wp-7"], secondaryIds: [], acceptableDecks: ["workplace"], acceptableConcepts: ["述职|汇报"] },

  { query: "复盘", group: "关键词-黑话", primaryIds: ["jargon-6"], secondaryIds: [], acceptableDecks: ["jargon"], acceptableConcepts: ["复盘","Review"] },

  { query: "底层逻辑", group: "关键词-黑话", primaryIds: ["jargon-5"], secondaryIds: [], acceptableDecks: ["jargon"], acceptableConcepts: ["底层逻辑","认知","逻辑"] },

  { query: "赋能", group: "关键词-黑话", primaryIds: ["jargon-2"], secondaryIds: [], acceptableDecks: ["jargon"], acceptableConcepts: ["赋能","Empower"] },

  { query: "迭代", group: "关键词-黑话", primaryIds: ["jargon-24","jargon-37"], secondaryIds: [], acceptableDecks: ["jargon"], acceptableConcepts: ["迭代"] },

  { query: "闭环", group: "关键词-黑话", primaryIds: ["jargon-3"], secondaryIds: [], acceptableDecks: ["jargon"], acceptableConcepts: ["闭环","Closed Loop"] },

  { query: "颗粒度", group: "关键词-黑话", primaryIds: ["jargon-1"], secondaryIds: [], acceptableDecks: ["jargon"], acceptableConcepts: ["颗粒度","对齐"] },

  { query: "A Gentle Introduction to Reinforcement Learning", group: "回归-对抗", primaryIds: ["ml-112","ml-113"], secondaryIds: ["ml-117"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["强化|DQN|Reward|RL"] },

  { query: "Agent反复调用同一个工具怎么办", group: "回归-对抗", primaryIds: ["agent-21","agent-3"], secondaryIds: ["agent-4"], acceptableDecks: ["agent"], acceptableConcepts: ["工具.*调用|循环|Agent"] },

  { query: "Attention Mask是什么", group: "回归-对抗", primaryIds: ["llm-1","llm-2"], secondaryIds: ["llm-26"], acceptableDecks: ["llm"], acceptableConcepts: ["Mask|Attention|Paddi"] },

  { query: "Convolutional Neural Networks beginners", group: "回归-对抗", primaryIds: ["dl-6"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["CNN|convolution|卷积"] },

  { query: "ML里如何处理缺失值", group: "回归-对抗", primaryIds: ["ml-141","ml-15"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["缺失值|Missing|NaN|Impu"] },

  { query: "ROC曲线是干什么的", group: "回归-对抗", primaryIds: ["ml-153","ml-50"], secondaryIds: ["ml-56"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["ROC|AUC|分类.*评估"] },

  { query: "SVM核函数怎么选", group: "回归-对抗", primaryIds: ["ml-19","ml-2"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["SVM|核函数|RBF"] },

  { query: "Self-Reflection让Agent自纠错", group: "回归-对抗", primaryIds: ["agent-14"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["Self.*Reflect|纠错|反思"] },

  { query: "Sparse vs Dense向量", group: "回归-对抗", primaryIds: ["agent-19","agent-24"], secondaryIds: ["agent-9"], acceptableDecks: ["agent"], acceptableConcepts: ["稀疏|稠密|Embedding"] },

  { query: "Type I Error 和 Type II Error", group: "回归-对抗", primaryIds: ["stats-120","stats-134"], secondaryIds: ["stats-25"], acceptableDecks: ["statistics"], acceptableConcepts: ["Type.*Error|第一类|显著性"] },

  { query: "What is Backpropagation", group: "回归-对抗", primaryIds: ["dl-5"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["Backprop|反向.*传播"] },

  { query: "为什么需要RAG", group: "回归-对抗", primaryIds: ["agent-10","agent-11"], secondaryIds: ["agent-12"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG|检索|幻觉"] },

  { query: "什么是Confounder", group: "回归-对抗", primaryIds: ["stats-136","stats-145"], secondaryIds: ["stats-6"], acceptableDecks: ["statistics"], acceptableConcepts: ["混杂|Confound|因果"] },

  { query: "什么是正态分布", group: "回归-对抗", primaryIds: ["stats-101","stats-11"], secondaryIds: ["stats-111"], acceptableDecks: ["statistics"], acceptableConcepts: ["正态|高斯|分布"] },

  { query: "什么是自注意力", group: "回归-对抗", primaryIds: ["llm-1","llm-2"], secondaryIds: ["llm-9"], acceptableDecks: ["llm"], acceptableConcepts: ["Self.*Attention|自注意力"] },

  { query: "向量数据库选型", group: "回归-对抗", primaryIds: ["agent-18"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["向量.*数据库|Pinecone|Mil"] },

  { query: "大模型能不能用来做搜索", group: "回归-对抗", primaryIds: ["agent-10","agent-11"], secondaryIds: ["agent-12"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG|搜索|检索"] },

  { query: "对话生成的上下文管理怎么做", group: "回归-对抗", primaryIds: ["agent-10"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["上下文|记忆|Window"] },

  { query: "怎么搞懂反向传播", group: "回归-对抗", primaryIds: ["dl-2","dl-5"], secondaryIds: ["ml-1","ml-106"], acceptableDecks: ["deep-learning","machine-learning"], acceptableConcepts: ["反向.*传播|BP|梯度"] },

  { query: "怎么评估一个Agent好不好", group: "回归-对抗", primaryIds: ["agent-15","agent-24"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["评估|Agent.*评估"] },

  { query: "数据隐私和模型训练矛盾", group: "回归-对抗", primaryIds: ["ml-188"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["隐私|Federated|差分"] },

  { query: "树模型特征重要性怎么算", group: "回归-对抗", primaryIds: ["ml-13","ml-176"], secondaryIds: ["ml-18"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["特征.*重要|Permutation|S"] },

  { query: "模型Serving怎么做", group: "回归-对抗", primaryIds: ["llm-26"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["Serving|vLLM|Triton"] },

  { query: "统计学的中心极限定理", group: "回归-对抗", primaryIds: ["stats-10","stats-11"], secondaryIds: ["stats-114"], acceptableDecks: ["statistics"], acceptableConcepts: ["中心极限|CLT|正态"] },

  { query: "设计一个像GPT那样的对话Agent需要考虑什么", group: "回归-对抗", primaryIds: ["agent-21","agent-3"], secondaryIds: ["agent-4"], acceptableDecks: ["agent"], acceptableConcepts: ["Agent|GPT|对话|Token"] },

  { query: "过拟合欠拟合如何判断", group: "回归-对抗", primaryIds: ["ml-188","ml-7"], secondaryIds: ["ml-77"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["过拟合|欠拟合|偏差.*方差"] },

  { query: "怎么在实际工作中把大模型的能力集成到自己的业务系统里", group: "复杂-Agent", primaryIds: ["agent-7"], secondaryIds: ["agent-21","agent-2"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG","Agentic RAG","Function Calling"] },

  { query: "海量数据里找相似向量最快的方案是什么", group: "复杂-Agent", primaryIds: ["agent-18"], secondaryIds: ["agent-26","agent-9"], acceptableDecks: ["agent"], acceptableConcepts: ["向量数据库","ANN","混合检索"] },

  { query: "作为一个面试官，我想问几个关于 MCP 协议的好问题", group: "复杂-VibeCoding", primaryIds: ["vc-5"], secondaryIds: ["vc-17"], acceptableDecks: ["vibe-coding"], acceptableConcepts: ["MCP","协议"] },

  { query: "二叉树的四种遍历方式分别是什么，各自的应用场景", group: "复杂-力扣", primaryIds: ["lc-043"], secondaryIds: ["lc-040","lc-041"], acceptableDecks: ["leetcode"], acceptableConcepts: ["二叉树","遍历","前序","中序"] },

  { query: "动态规划的解题框架是什么，有什么经典例题可以举例说明", group: "复杂-力扣", primaryIds: ["lc-062"], secondaryIds: ["lc-069","lc-071","lc-073"], acceptableDecks: ["leetcode"], acceptableConcepts: ["动态规划","爬楼梯","编辑距离"] },

  { query: "大模型推理太慢了，有哪些加速手段可以用", group: "复杂-大模型", primaryIds: ["llm-21","llm-24"], secondaryIds: ["llm-25","llm-26"], acceptableDecks: ["llm"], acceptableConcepts: ["KV Cache","量化","推理加速"] },

  { query: "怎么理解大模型 alignment 对齐这回事，为什么要做 RLHF", group: "复杂-大模型", primaryIds: ["llm-14"], secondaryIds: ["llm-11","llm-15"], acceptableDecks: ["llm"], acceptableConcepts: ["RLHF","对齐","预训练"] },

  { query: "给我讲一下从 word2vec 到 BERT 到 GPT 的发展脉络", group: "复杂-大模型", primaryIds: ["llm-10"], secondaryIds: ["llm-8","llm-7"], acceptableDecks: ["llm"], acceptableConcepts: ["BERT","GPT","Transformer"] },

  { query: "请详细解释一下 Transformer 的自注意力机制是怎么计算的，Q K V 分别代表什么", group: "复杂-大模型", primaryIds: ["llm-1","llm-3"], secondaryIds: ["llm-2"], acceptableDecks: ["llm"], acceptableConcepts: ["Self-Attention","QKV","Multi-Head"] },

  { query: "有 100 万条数据但是标注只有 1 万条，这种情况该怎么办", group: "复杂-机器学习", primaryIds: ["ml-10"], secondaryIds: ["ml-9","ml-16"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["半监督","正则化","迁移学习"] },

  { query: "能不能帮我系统梳理一下集成学习从 bagging 到 boosting 到 stacking 的演变", group: "复杂-机器学习", primaryIds: ["ml-32"], secondaryIds: ["ml-31","ml-36"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Bagging","Boosting","Stacking"] },

  { query: "面试官问我怎么评估一个分类模型的好坏，我应该从哪些角度回答", group: "复杂-机器学习", primaryIds: ["ml-49","ml-50"], secondaryIds: ["ml-51","ml-56"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["精确率","召回率","ROC","AUC"] },

  { query: "Stable Diffusion 为什么在 latent space 扩散而不是像素空间", group: "复杂-深度学习", primaryIds: ["dl-16"], secondaryIds: ["dl-15"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["Stable Diffusion","Latent Space"] },

  { query: "我在训练深度学习模型时发现训练 loss 一直降但验证 loss 不降，这是什么问题，怎么解决", group: "复杂-深度学习", primaryIds: ["ml-7"], secondaryIds: ["dl-4","ml-9"], acceptableDecks: ["machine-learning","deep-learning"], acceptableConcepts: ["过拟合","Dropout","交叉验证"] },

  { query: "AB 测试做了之后发现实验组和对照组没有显著差异，可能的原因有哪些", group: "复杂-统计学", primaryIds: ["stats-26"], secondaryIds: ["stats-31","stats-25"], acceptableDecks: ["statistics"], acceptableConcepts: ["假设检验","统计功效","样本量"] },

  { query: "想刷动态规划，推荐几道题", group: "学习路径-力扣", primaryIds: ["lc-062"], secondaryIds: ["lc-063","lc-064","lc-067"], acceptableDecks: ["leetcode"], acceptableConcepts: ["动态规划","DP"] },

  { query: "我 Transformer 不太懂，帮我找相关卡片", group: "学习路径-大模型", primaryIds: ["llm-1"], secondaryIds: ["llm-3","llm-4","llm-9"], acceptableDecks: ["llm"], acceptableConcepts: ["Transformer","Attention","位置编码"] },

  { query: "假如我想学习决策树，我应该学习哪些卡片", group: "学习路径-机器学习", primaryIds: ["ml-3"], secondaryIds: ["ml-16","ml-17"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["决策树","随机森林","集成学习"] },

  { query: "现在想入门深度学习，需要看哪些基础卡片", group: "学习路径-深度学习", primaryIds: ["dl-1"], secondaryIds: ["dl-2","dl-3","dl-5"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["深度学习","反向传播","激活函数"] },

  { query: "如何系统地学习假设检验", group: "学习路径-统计学", primaryIds: ["stats-24","stats-25"], secondaryIds: ["stats-26","stats-27"], acceptableDecks: ["statistics"], acceptableConcepts: ["假设检验","p值","t检验"] },

  { query: "Agent和LLM到底什么关系", group: "概念-Agent", primaryIds: ["agent-1","agent-2"], secondaryIds: ["agent-21","llm-16"], acceptableDecks: ["agent","llm"], acceptableConcepts: ["Agent|LLM|关系"] },

  { query: "Agent长期记忆怎么设计", group: "概念-Agent", primaryIds: ["agent-21"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["记忆|Memory|Agentic"] },

  { query: "RAG 的检索结果要不要重新排个序", group: "概念-Agent", primaryIds: ["agent-25"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["Reranking","重排序"] },

  { query: "ReAct和普通对话模型区别", group: "概念-Agent", primaryIds: ["agent-1","agent-21"], secondaryIds: ["agent-3"], acceptableDecks: ["agent"], acceptableConcepts: ["ReAct|推理|Agent"] },

  { query: "怎么知道 RAG 搜出来的东西靠不靠谱", group: "概念-Agent", primaryIds: ["agent-15"], secondaryIds: ["agent-17"], acceptableDecks: ["agent"], acceptableConcepts: ["评估","幻觉"] },

  { query: "怎么让Agent执行多步骤任务", group: "概念-Agent", primaryIds: ["agent-5","agent-6"], secondaryIds: ["agent-8"], acceptableDecks: ["agent"], acceptableConcepts: ["Planning|AutoGPT|步骤"] },

  { query: "怎么让大模型自己去调 API", group: "概念-Agent", primaryIds: ["agent-2"], secondaryIds: ["agent-3"], acceptableDecks: ["agent"], acceptableConcepts: ["Function Calling","Tool-Use"] },

  { query: "怎么评估RAG系统好不好", group: "概念-Agent", primaryIds: ["agent-15","agent-24"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["RAG.*评估|检索质量"] },

  { query: "agent 和 skill 的核心区别在哪", group: "概念-VibeCoding", primaryIds: ["vc-2","vc-1"], secondaryIds: ["vc-3"], acceptableDecks: ["vibe-coding"], acceptableConcepts: ["Agent","Skill","sub-agent"] },

  { query: "怎么给 AI 写项目规则文件", group: "概念-VibeCoding", primaryIds: ["vc-6"], secondaryIds: [], acceptableDecks: ["vibe-coding"], acceptableConcepts: ["CLAUDE.md","AGENTS.md"] },

  { query: "二叉树的最近公共祖先", group: "概念-力扣", primaryIds: ["lc-049"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["LCA","二叉树"] },

  { query: "二叉树遍历递归和非递归哪个好", group: "概念-力扣", primaryIds: ["lc-040","lc-043"], secondaryIds: ["lc-044"], acceptableDecks: ["leetcode"], acceptableConcepts: ["Binary Tree.*Travers"] },

  { query: "刷动态规划一直搞不懂状态转移", group: "概念-力扣", primaryIds: ["lc-062","lc-065"], secondaryIds: ["lc-067"], acceptableDecks: ["leetcode"], acceptableConcepts: ["Climbing|Coin|House"] },

  { query: "十字链表有什么用", group: "概念-力扣", primaryIds: ["lc-010","lc-011"], secondaryIds: ["lc-026"], acceptableDecks: ["leetcode"], acceptableConcepts: ["Matrix|Set Zero|Spir"] },

  { query: "合并有序数组", group: "概念-力扣", primaryIds: ["lc-013"], secondaryIds: ["lc-038"], acceptableDecks: ["leetcode"], acceptableConcepts: ["合并","有序数组"] },

  { query: "图的最短路径算法比较", group: "概念-力扣", primaryIds: ["lc-050","lc-051"], secondaryIds: ["lc-069"], acceptableDecks: ["leetcode"], acceptableConcepts: ["Path|Dijkstra|最短"] },

  { query: "数组题双指针和前缀和怎么选", group: "概念-力扣", primaryIds: ["lc-001","lc-004"], secondaryIds: ["lc-005"], acceptableDecks: ["leetcode"], acceptableConcepts: ["Two Sum|Subarray|Mov"] },

  { query: "最长不重复子串", group: "概念-力扣", primaryIds: ["lc-019"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["无重复字符","滑动窗口"] },

  { query: "面试考链表老写bug怎么办", group: "概念-力扣", primaryIds: ["lc-032","lc-033"], secondaryIds: ["lc-034"], acceptableDecks: ["leetcode"], acceptableConcepts: ["Reverse.*Linked|Cycl"] },

  { query: "Encoder Decoder架构", group: "概念-大模型", primaryIds: ["llm-8"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["Encoder.*Decoder|Seq"] },

  { query: "KV cache为什么要用", group: "概念-大模型", primaryIds: ["llm-21","llm-26"], secondaryIds: ["llm-25"], acceptableDecks: ["llm"], acceptableConcepts: ["KV|Cache|推理"] },

  { query: "RLHF怎么让模型对齐人类偏好", group: "概念-大模型", primaryIds: ["llm-14","llm-15"], secondaryIds: ["llm-20"], acceptableDecks: ["llm"], acceptableConcepts: ["RLHF|DPO|奖励"] },

  { query: "为什么 transformer 比 rnn 训练得快", group: "概念-大模型", primaryIds: ["llm-7"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["并行化","Transformer"] },

  { query: "为什么Transformer比RNN快", group: "概念-大模型", primaryIds: ["llm-1","llm-2"], secondaryIds: ["llm-38","dl-9"], acceptableDecks: ["llm","deep-learning"], acceptableConcepts: ["并行|Transformer|Self-"] },

  { query: "为什么Transformer用位置编码", group: "概念-大模型", primaryIds: ["llm-4"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["位置编码|Positional|RoPE"] },

  { query: "为什么大模型部署用KV cache", group: "概念-大模型", primaryIds: ["llm-21","llm-26"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["KV.*Cache|推理.*加速|Pag"] },

  { query: "多模态大模型原理", group: "概念-大模型", primaryIds: ["llm-26"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["多模态|视觉|VL"] },

  { query: "大模型为什么胡编乱造", group: "概念-大模型", primaryIds: ["agent-10","agent-11"], secondaryIds: [], acceptableDecks: ["llm","agent"], acceptableConcepts: ["幻觉|事实性|RAG"] },

  { query: "大模型微调灾难性遗忘", group: "概念-大模型", primaryIds: ["llm-18"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["灾难|Catastrophic|遗忘"] },

  { query: "微调和从头训练有什么区别", group: "概念-大模型", primaryIds: ["llm-11","llm-12"], secondaryIds: ["llm-13"], acceptableDecks: ["llm"], acceptableConcepts: ["微调|Pretrain|SFT"] },

  { query: "怎么在不改大模型参数的情况下让它学会新任务", group: "概念-大模型", primaryIds: ["llm-12"], secondaryIds: ["llm-16","llm-17"], acceptableDecks: ["llm"], acceptableConcepts: ["LoRA","PEFT","微调"] },

  { query: "怎么让大模型回答更准确", group: "概念-大模型", primaryIds: ["llm-14","llm-16"], secondaryIds: ["llm-20"], acceptableDecks: ["llm"], acceptableConcepts: ["Prompt|COT|RAG|RLHF"] },

  { query: "模型怎么知道每个 token 在句子里的位置", group: "概念-大模型", primaryIds: ["llm-4"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["位置编码","Transformer"] },

  { query: "量化对模型性能影响多大", group: "概念-大模型", primaryIds: ["llm-24","llm-42"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["量化|AWQ|GPTQ"] },

  { query: "EM算法核心思想", group: "概念-机器学习", primaryIds: ["ml-125","ml-134"], secondaryIds: ["ml-138"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["EM|GMM|高斯混合"] },

  { query: "Stacking和Blending区别", group: "概念-机器学习", primaryIds: ["ml-189","ml-36"], secondaryIds: ["ml-40"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Stacking|Blending|集成"] },

  { query: "不平衡数据怎么处理", group: "概念-机器学习", primaryIds: ["ml-143","ml-16"], secondaryIds: ["ml-72"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["不平衡|Imbalance|SMOTE"] },

  { query: "为什么分类用交叉熵不用MSE", group: "概念-机器学习", primaryIds: ["ml-53","ml-54"], secondaryIds: ["ml-60"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["交叉熵|MSE|Log.*Loss"] },

  { query: "为什么要shuffle数据", group: "概念-机器学习", primaryIds: ["ml-109","ml-122"], secondaryIds: ["ml-155"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["shuffle|epoch|训练"] },

  { query: "交叉验证K怎么选", group: "概念-机器学习", primaryIds: ["ml-176","ml-187"], secondaryIds: ["ml-44"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["K.*Fold|交叉验证|Cross"] },

  { query: "什么是冷启动问题", group: "概念-机器学习", primaryIds: ["ml-87"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["冷启动|Cold Start"] },

  { query: "参数太多模型太复杂怎么办", group: "概念-机器学习", primaryIds: ["ml-10","ml-139"], secondaryIds: ["ml-7"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["过拟合|正则化|复杂度"] },

  { query: "多个模型的结果怎么融合起来", group: "概念-机器学习", primaryIds: ["ml-31"], secondaryIds: ["ml-36","ml-32"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["集成学习","Bagging","Boosting"] },

  { query: "怎么判断模型是不是学过头了", group: "概念-机器学习", primaryIds: ["ml-7"], secondaryIds: ["ml-9"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["过拟合","交叉验证"] },

  { query: "怎么判断聚类结果好不好", group: "概念-机器学习", primaryIds: ["ml-21","ml-23"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["聚类.*评估|轮廓|Silhouette"] },

  { query: "损失函数不下降了怎么办", group: "概念-机器学习", primaryIds: ["ml-1","ml-53","ml-142","ml-143"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["学习率|收敛|局部最优"] },

  { query: "数据太少训练不好怎么办", group: "概念-机器学习", primaryIds: ["ml-149","ml-151"], secondaryIds: ["ml-180"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["数据增强|迁移|少样本"] },

  { query: "机器学习模型上线后衰减", group: "概念-机器学习", primaryIds: ["ml-156","ml-157"], secondaryIds: ["ml-158"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["漂移|衰减|Drift|监控|MLOps"] },

  { query: "样本不均衡怎么处理", group: "概念-机器学习", primaryIds: ["ml-16"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["类别不均衡","SMOTE"] },

  { query: "模型在训练集准上线差怎么排查", group: "概念-机器学习", primaryIds: ["ml-158","ml-7"], secondaryIds: ["ml-77"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["过拟合|泛化|分布"] },

  { query: "特征太多怎么挑选重要的", group: "概念-机器学习", primaryIds: ["ml-138","ml-181"], secondaryIds: ["ml-41"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["特征选择|Permutation|SHA"] },

  { query: "特征工程完整流程", group: "概念-机器学习", primaryIds: ["ml-13","ml-138"], secondaryIds: ["ml-41"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["特征.*工程|特征.*选择|特征.*缩放"] },

  { query: "生成模型和判别模型区别", group: "概念-机器学习", primaryIds: ["ml-110","ml-111"], secondaryIds: ["ml-169"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["生成|判别|GAN|贝叶斯"] },

  { query: "训练集表现很好但测试集很差是怎么回事", group: "概念-机器学习", primaryIds: ["ml-7"], secondaryIds: ["ml-8","ml-4"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["过拟合","泛化","偏差方差"] },

  { query: "风控建模一般用什么算法", group: "概念-机器学习", primaryIds: ["ml-128"], secondaryIds: ["ml-146"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["风控|异常|Fraud|Anomaly"] },

  { query: "Diffusion去噪过程", group: "概念-深度学习", primaryIds: ["dl-15","dl-16"], secondaryIds: ["dl-27"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["扩散|Diffusion|DDPM"] },

  { query: "LSTM怎么解决长期记忆问题", group: "概念-深度学习", primaryIds: ["dl-24","dl-7"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["LSTM|GRU|长期"] },

  { query: "softmax输出为什么和为1", group: "概念-深度学习", primaryIds: ["dl-31","dl-32"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["softmax"] },

  { query: "卷积层到底在提取什么信息", group: "概念-深度学习", primaryIds: ["dl-6"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["CNN|卷积核|特征图"] },

  { query: "残差网络为什么要跳跃连接", group: "概念-深度学习", primaryIds: ["dl-8"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["ResNet|残差|Skip.*Conn"] },

  { query: "生成器和判别器是怎么互相博弈的", group: "概念-深度学习", primaryIds: ["dl-11"], secondaryIds: ["dl-12"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["GAN","生成对抗"] },

  { query: "神经网络为什么不能太深也不能太浅", group: "概念-深度学习", primaryIds: ["dl-2"], secondaryIds: ["dl-8"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["梯度消失","梯度爆炸","ResNet"] },

  { query: "神经网络为什么要加激活函数", group: "概念-深度学习", primaryIds: ["dl-1","dl-24"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["激活函数|非线性"] },

  { query: "训练和推理时 dropout 行为一样吗", group: "概念-深度学习", primaryIds: ["dl-4"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["Dropout","训练推理"] },

  { query: "AB测试怎么判断显著", group: "概念-统计学", primaryIds: ["stats-102","stats-116"], secondaryIds: ["stats-118"], acceptableDecks: ["statistics"], acceptableConcepts: ["AB|A/B|显著|P值"] },

  { query: "EDA数据探索怎么做", group: "概念-统计学", primaryIds: ["stats-52"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["EDA|描述|可视化"] },

  { query: "SQL怎么优化慢查询", group: "概念-统计学", primaryIds: ["stats-180","stats-183"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["SQL.*优化|索引|慢查询"] },

  { query: "pandas处理大数据内存溢出", group: "概念-统计学", primaryIds: ["stats-180","stats-187"], secondaryIds: ["stats-153"], acceptableDecks: ["statistics"], acceptableConcepts: ["内存|溢出|大数据"] },

  { query: "为什么样本方差分母是 n 减 1", group: "概念-统计学", primaryIds: ["stats-2"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["方差","自由度"] },

  { query: "什么时候用图数据库", group: "概念-统计学", primaryIds: ["stats-3"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["图|Graph|Neo4j"] },

  { query: "什么是指标体系北极星", group: "概念-统计学", primaryIds: ["stats-116","stats-163"], secondaryIds: ["stats-164"], acceptableDecks: ["statistics"], acceptableConcepts: ["北极星|North Star|AARRR"] },

  { query: "怎么判断两个变量之间有没有关系", group: "概念-统计学", primaryIds: ["stats-115","stats-138"], secondaryIds: ["stats-140","ml-1"], acceptableDecks: ["statistics","machine-learning"], acceptableConcepts: ["相关|回归"] },

  { query: "怎么判断两组数据有没有显著差异", group: "概念-统计学", primaryIds: ["stats-26"], secondaryIds: ["stats-28"], acceptableDecks: ["statistics"], acceptableConcepts: ["t检验","假设检验"] },

  { query: "怎么设计数据指标体系", group: "概念-统计学", primaryIds: ["stats-167","stats-168","jargon-33"], secondaryIds: ["stats-159"], acceptableDecks: ["statistics"], acceptableConcepts: ["指标|Metric|North Star"] },

  { query: "怎样用数据来更新我们的信念", group: "概念-统计学", primaryIds: ["stats-9"], secondaryIds: ["stats-39"], acceptableDecks: ["statistics"], acceptableConcepts: ["贝叶斯","先验后验"] },

  { query: "数据和直觉不一致听谁的", group: "概念-统计学", primaryIds: ["stats-134","stats-154"], secondaryIds: ["stats-156"], acceptableDecks: ["statistics"], acceptableConcepts: ["数据驱动|决策"] },

  { query: "时间序列季节性怎么处理", group: "概念-统计学", primaryIds: ["stats-88","stats-90","stats-91"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["季节|时间序列|ARIMA|Prophe"] },

  { query: "样本量要多大才算够", group: "概念-统计学", primaryIds: ["stats-118","stats-119"], secondaryIds: ["stats-161"], acceptableDecks: ["statistics"], acceptableConcepts: ["样本量|功效|Power"] },

  { query: "相关和因果怎么区分", group: "概念-统计学", primaryIds: ["stats-115","stats-136"], secondaryIds: ["stats-140"], acceptableDecks: ["statistics"], acceptableConcepts: ["因果|相关|混淆"] },

  { query: "第一类错误和第二类错误谁更严重", group: "概念-统计学", primaryIds: ["stats-120","stats-134"], secondaryIds: ["stats-25"], acceptableDecks: ["statistics"], acceptableConcepts: ["第一类|Type I|显著性"] },

  { query: "马尔可夫链怎么收敛", group: "概念-统计学", primaryIds: ["stats-103","stats-109"], secondaryIds: ["stats-199"], acceptableDecks: ["statistics"], acceptableConcepts: ["马尔可夫|Markov|MCMC"] },

  { query: "怎么拒绝不合理的需求", group: "概念-职场", primaryIds: ["wp-1","wp-20"], secondaryIds: ["wp-4"], acceptableDecks: ["workplace"], acceptableConcepts: ["拒绝|需求|不合理"] },

  { query: "怎么给领导汇报进度", group: "概念-职场", primaryIds: ["wp-3","wp-7"], secondaryIds: [], acceptableDecks: ["workplace"], acceptableConcepts: ["汇报|延期|进度"] },

  { query: "怎么跟领导汇报工作进展", group: "概念-职场", primaryIds: ["wp-8"], secondaryIds: ["wp-3"], acceptableDecks: ["workplace"], acceptableConcepts: ["汇报","向上沟通"] },

  { query: "怎么面试中谈薪资", group: "概念-职场", primaryIds: ["wp-10","wp-29"], secondaryIds: ["wp-49"], acceptableDecks: ["workplace"], acceptableConcepts: ["薪资|涨薪|薪酬"] },

  { query: "空降新团队怎么快速融入", group: "概念-职场", primaryIds: ["wp-21"], secondaryIds: [], acceptableDecks: ["workplace"], acceptableConcepts: ["新人|融入|入职"] },

  { query: "面试的时候怎么介绍自己的项目经历比较好", group: "概念-职场", primaryIds: ["wp-7"], secondaryIds: [], acceptableDecks: ["workplace"], acceptableConcepts: ["面试","项目","STAR"] },

  { query: "互联网公司常说的底层能力指什么", group: "概念-黑话", primaryIds: ["jargon-5"], secondaryIds: [], acceptableDecks: ["jargon"], acceptableConcepts: ["底层逻辑","方法论"] },

  { query: "项目做完之后要总结一下经验", group: "概念-黑话", primaryIds: ["jargon-6"], secondaryIds: [], acceptableDecks: ["jargon"], acceptableConcepts: ["复盘","回顾"] },

  { query: "Agent ReAct推理模式", group: "混合-Agent", primaryIds: ["agent-1","agent-6"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["ReAct|推理|Planning"] },

  { query: "Chunking策略Sentences还是固定长度", group: "混合-Agent", primaryIds: ["agent-23","agent-8"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["分块|Chunk|Sliding"] },

  { query: "Hybrid Search 混合检索", group: "混合-Agent", primaryIds: ["agent-26"], secondaryIds: ["agent-9"], acceptableDecks: ["agent"], acceptableConcepts: ["混合检索","Hybrid Search"] },

  { query: "RAG Retrieval检索流程", group: "混合-Agent", primaryIds: ["agent-10","agent-11"], secondaryIds: ["agent-12"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG|检索.*管道"] },

  { query: "ReAct 框架 Reasoning Acting", group: "混合-Agent", primaryIds: ["agent-1"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["ReAct","推理行动"] },

  { query: "Reranker重排序模型", group: "混合-Agent", primaryIds: ["agent-25"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["Rerank|Cross.*Encode"] },

  { query: "CLAUDE.md 和 AGENTS.md 优先级", group: "混合-VibeCoding", primaryIds: ["vc-6"], secondaryIds: [], acceptableDecks: ["vibe-coding"], acceptableConcepts: ["CLAUDE.md","AGENTS.md"] },

  { query: "MCP server client 架构", group: "混合-VibeCoding", primaryIds: ["vc-5"], secondaryIds: ["vc-17"], acceptableDecks: ["vibe-coding"], acceptableConcepts: ["MCP","server","client"] },

  { query: "DFS 和 BFS 遍历二叉树", group: "混合-力扣", primaryIds: ["lc-043"], secondaryIds: ["lc-040","lc-041"], acceptableDecks: ["leetcode"], acceptableConcepts: ["DFS","BFS","二叉树"] },

  { query: "LRU Cache 实现", group: "混合-力扣", primaryIds: ["lc-087"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["LRU","缓存"] },

  { query: "Attention机制的Q K V到底是什么", group: "混合-大模型", primaryIds: ["llm-1","llm-2"], secondaryIds: ["llm-26"], acceptableDecks: ["llm"], acceptableConcepts: ["Attention|Query.*Val"] },

  { query: "BERT fine-tuning怎么调参数", group: "混合-大模型", primaryIds: ["llm-10","llm-12"], secondaryIds: ["llm-13"], acceptableDecks: ["llm"], acceptableConcepts: ["BERT|微调"] },

  { query: "CLIP多模态对比学习", group: "混合-大模型", primaryIds: ["llm-4","llm-8"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["CLIP|多模态|对比"] },

  { query: "FlashAttention GPU显存优化", group: "混合-大模型", primaryIds: ["llm-40"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["Flash.*Attention|显存."] },

  { query: "KV Cache 推理加速", group: "混合-大模型", primaryIds: ["llm-21"], secondaryIds: ["llm-26"], acceptableDecks: ["llm"], acceptableConcepts: ["KV Cache","推理加速"] },

  { query: "LoRA 和全量 finetune 对比", group: "混合-大模型", primaryIds: ["llm-12"], secondaryIds: ["llm-17"], acceptableDecks: ["llm"], acceptableConcepts: ["LoRA","全参数微调"] },

  { query: "LoRA微调和Full Fine-tuning", group: "混合-大模型", primaryIds: ["llm-12","llm-13"], secondaryIds: ["llm-17"], acceptableDecks: ["llm"], acceptableConcepts: ["LoRA|微调|Adapter"] },

  { query: "OOM排查调batch size显存", group: "混合-大模型", primaryIds: ["llm-38","llm-40"], secondaryIds: ["llm-47"], acceptableDecks: ["llm"], acceptableConcepts: ["OOM|显存|Batch"] },

  { query: "Pipeline并行 Gradient Accumulation", group: "混合-大模型", primaryIds: ["llm-48","llm-7"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["并行|Pipeline|梯度.*累积"] },

  { query: "Positonal Encoding和RoPE区别", group: "混合-大模型", primaryIds: ["llm-4"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["位置编码|RoPE|Posit"] },

  { query: "Qwen模型Prompt优化", group: "混合-大模型", primaryIds: ["llm-16","llm-40"], secondaryIds: ["llm-46"], acceptableDecks: ["llm"], acceptableConcepts: ["Prompt|优化"] },

  { query: "RLHF reward model 训练", group: "混合-大模型", primaryIds: ["llm-14"], secondaryIds: ["llm-15"], acceptableDecks: ["llm"], acceptableConcepts: ["RLHF","reward model"] },

  { query: "Self-Attention QKV 计算", group: "混合-大模型", primaryIds: ["llm-1"], secondaryIds: ["llm-2","llm-9"], acceptableDecks: ["llm"], acceptableConcepts: ["Self-Attention","QKV"] },

  { query: "Speculative解码投机推理", group: "混合-大模型", primaryIds: ["llm-25"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["Speculat|推测.*解码|投机"] },

  { query: "Transformer Self-Attention机制", group: "混合-大模型", primaryIds: ["llm-1","llm-2"], secondaryIds: ["llm-38"], acceptableDecks: ["llm"], acceptableConcepts: ["Self.*Attention|Tran"] },

  { query: "vLLM PagedAttention加速原理", group: "混合-大模型", primaryIds: ["llm-26"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["vLLM|PagedAtt"] },

  { query: "AUC PR-AUC区别什么情况用哪个", group: "混合-机器学习", primaryIds: ["ml-9","ml-49","ml-137"], secondaryIds: ["ml-133"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["AUC|PR|ROC"] },

  { query: "Adam和SGD选哪个", group: "混合-机器学习", primaryIds: ["ml-58"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Adam|SGD|优化器"] },

  { query: "Cross Entropy交叉熵Loss", group: "混合-机器学习", primaryIds: ["ml-142","ml-143"], secondaryIds: ["ml-144"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["交叉熵|Cross.*Entropy|L"] },

  { query: "Data Augmentation数据增强", group: "混合-机器学习", primaryIds: ["ml-180"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["数据.*增强|Augment"] },

  { query: "K-Means 聚类 K 值选择", group: "混合-机器学习", primaryIds: ["ml-21"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["KMeans","肘部法则"] },

  { query: "KMeans的K值怎么选Elbow", group: "混合-机器学习", primaryIds: ["ml-125","ml-21"], secondaryIds: ["ml-24"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["K.*Means|Elbow|轮廓"] },

  { query: "Label Encoding ordinal", group: "混合-机器学习", primaryIds: ["ml-14","ml-135","ml-178"], secondaryIds: ["ml-121"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["编码|Label|类别"] },

  { query: "LightGBM和XGBoost哪个好", group: "混合-机器学习", primaryIds: ["ml-31","ml-33"], secondaryIds: ["ml-34"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["LightGBM|XGBoost|GBD"] },

  { query: "One-hot Encoding有什么问题", group: "混合-机器学习", primaryIds: ["ml-14","ml-28","ml-42"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["One.*Hot|编码|高维"] },

  { query: "PCA variance explained计算", group: "混合-机器学习", primaryIds: ["ml-141","ml-22"], secondaryIds: ["ml-26"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["PCA|方差.*解释|SVD"] },

  { query: "PCA 降维原理", group: "混合-机器学习", primaryIds: ["ml-22"], secondaryIds: ["ml-26","ml-48"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["PCA","降维"] },

  { query: "Precision Recall F1怎么算", group: "混合-机器学习", primaryIds: ["ml-184","ml-49"], secondaryIds: ["ml-88"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Precision|Recall|F1"] },

  { query: "ROC AUC 怎么理解", group: "混合-机器学习", primaryIds: ["ml-50"], secondaryIds: ["ml-56"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["ROC","AUC"] },

  { query: "ROC AUC曲线解释", group: "混合-机器学习", primaryIds: ["ml-9","ml-49","ml-137"], secondaryIds: ["ml-133"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["ROC|AUC|PR"] },

  { query: "Random Forest过拟合怎么办", group: "混合-机器学习", primaryIds: ["ml-18","ml-31"], secondaryIds: ["ml-38"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["随机森林|过拟合|n_estim"] },

  { query: "SVM Kernel核函数选择", group: "混合-机器学习", primaryIds: ["ml-19","ml-2"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["SVM|核函数|Kernel"] },

  { query: "SVM kernel 选择", group: "混合-机器学习", primaryIds: ["ml-2"], secondaryIds: ["ml-19"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["SVM","kernel"] },

  { query: "Self-Supervised自监督学习", group: "混合-机器学习", primaryIds: ["ml-118","ml-119"], secondaryIds: ["ml-122"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["自监督|对比|SimCLR"] },

  { query: "XGBoost 和 LightGBM 对比", group: "混合-机器学习", primaryIds: ["ml-33","ml-34"], secondaryIds: ["ml-31"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["XGBoost","LightGBM","GBDT"] },

  { query: "XGBoost调参技巧", group: "混合-机器学习", primaryIds: ["ml-31","ml-33"], secondaryIds: ["ml-37"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["XGBoost|调参|Hyperpar"] },

  { query: "t-SNE vs PCA 可视化", group: "混合-机器学习", primaryIds: ["ml-26"], secondaryIds: ["ml-22"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["t-SNE","PCA"] },

  { query: "Adam 和 SGD 选哪个", group: "混合-深度学习", primaryIds: ["dl-30"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["Adam","SGD","优化器"] },

  { query: "Batch Normalization公式", group: "混合-深度学习", primaryIds: ["dl-21","dl-22"], secondaryIds: ["dl-3"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["Batch.*Norm|归一化"] },

  { query: "BatchNorm vs LayerNorm", group: "混合-深度学习", primaryIds: ["dl-3"], secondaryIds: ["dl-22"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["BatchNorm","LayerNorm"] },

  { query: "Diffusion Model 前向加噪过程", group: "混合-深度学习", primaryIds: ["dl-15"], secondaryIds: ["dl-27"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["扩散模型","Diffusion"] },

  { query: "GAN Discriminator生成器判别器", group: "混合-深度学习", primaryIds: ["dl-11","dl-12"], secondaryIds: ["dl-14"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["GAN|生成.*对抗"] },

  { query: "GAN mode collapse 怎么解决", group: "混合-深度学习", primaryIds: ["dl-12"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["GAN","模式坍塌"] },

  { query: "GELU激活函数公式推导", group: "混合-深度学习", primaryIds: ["dl-1","dl-24"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["GELU|激活|Swish|ReLU"] },

  { query: "LSTM GRU区别和选择", group: "混合-深度学习", primaryIds: ["dl-24","dl-7"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["LSTM|GRU|RNN"] },

  { query: "Layer Normalization位置应用", group: "混合-深度学习", primaryIds: ["dl-22","dl-3"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["Layer.*Norm|Batch.*N"] },

  { query: "ReLU LeakyReLU区别", group: "混合-深度学习", primaryIds: ["dl-1","dl-24"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["ReLU|Leaky|激活"] },

  { query: "ResNet残差网络Skip Connection", group: "混合-深度学习", primaryIds: ["dl-8"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["ResNet|残差|Skip"] },

  { query: "Sigmoid 和 Softmax 区别", group: "混合-深度学习", primaryIds: ["dl-31"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["sigmoid","softmax"] },

  { query: "Bootstrap 和 Permutation Test", group: "混合-统计学", primaryIds: ["stats-37"], secondaryIds: ["stats-38"], acceptableDecks: ["statistics"], acceptableConcepts: ["Bootstrap","置换检验"] },

  { query: "MCMC 采样原理", group: "混合-统计学", primaryIds: ["stats-43"], secondaryIds: ["stats-44"], acceptableDecks: ["statistics"], acceptableConcepts: ["MCMC","采样"] },

  { query: "Window Function窗口函数SQL", group: "混合-统计学", primaryIds: ["stats-178","stats-179"], secondaryIds: ["stats-180"], acceptableDecks: ["statistics"], acceptableConcepts: ["Window|窗口|SQL"] },

  { query: "p-value 的误解", group: "混合-统计学", primaryIds: ["stats-24"], secondaryIds: ["stats-25"], acceptableDecks: ["statistics"], acceptableConcepts: ["p值","显著性"] },

  { query: "OKR 和 KPI 的区别", group: "混合-黑话", primaryIds: ["jargon-35"], secondaryIds: [], acceptableDecks: ["jargon"], acceptableConcepts: ["OKR","KPI","绩效"] },

  { query: "how to evaluate retrieval augmented generation", group: "英文-Agent", primaryIds: ["agent-22","agent-15"], secondaryIds: ["agent-7"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG","evaluation"] },

  { query: "binary tree traversal preorder inorder postorder", group: "英文-力扣", primaryIds: ["lc-043","lc-040"], secondaryIds: ["lc-041"], acceptableDecks: ["leetcode"], acceptableConcepts: ["binary tree","traversal","DFS"] },

  { query: "self attention mechanism transformer", group: "英文-大模型", primaryIds: ["llm-1","llm-3"], secondaryIds: ["llm-9"], acceptableDecks: ["llm"], acceptableConcepts: ["self-attention","Transformer"] },

  { query: "gradient descent optimization", group: "英文-机器学习", primaryIds: ["ml-11","ml-57"], secondaryIds: ["ml-58"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["gradient descent","SGD","optimization"] },

  { query: "overfitting vs underfitting deep learning", group: "英文-机器学习", primaryIds: ["ml-7"], secondaryIds: ["ml-8","dl-4"], acceptableDecks: ["machine-learning","deep-learning"], acceptableConcepts: ["overfitting","underfitting"] },

  { query: "RAG和Fine-tuning什么时候用哪个", group: "跨模块-Agent", primaryIds: ["agent-10","agent-11"], secondaryIds: ["agent-12"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG|微调|对比"] },

  { query: "ReAct和Plan-and-Execute区别", group: "跨模块-Agent", primaryIds: ["agent-1","agent-6"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["ReAct|Planning|Plan."] },

  { query: "Vibe Coding和Agent开发区别", group: "跨模块-Agent", primaryIds: ["agent-21","agent-3"], secondaryIds: ["agent-4"], acceptableDecks: ["agent"], acceptableConcepts: ["Vibe|Agent|Coding|编程"] },

  { query: "函数调用和DSL工具选择", group: "跨模块-Agent", primaryIds: ["agent-2","agent-3"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["Function Calling|DSL"] },

  { query: "结构化输出JSON Mode对比", group: "跨模块-Agent", primaryIds: ["agent-2"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["JSON.*Mode|Structure"] },

  { query: "AUC和F1衡量指标的区别", group: "跨模块-ML", primaryIds: ["ml-9","ml-49","ml-185"], secondaryIds: ["ml-133"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["AUC|F1|PR|ROC"] },

  { query: "Bagging和Boosting核心差异", group: "跨模块-ML", primaryIds: ["ml-189","ml-32"], secondaryIds: ["ml-36"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Bagging|Boosting|集成"] },

  { query: "GBDT和随机森林本质区别", group: "跨模块-ML", primaryIds: ["ml-126","ml-17"], secondaryIds: ["ml-18"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["GBDT|随机森林|决策"] },

  { query: "KMeans和DBSCAN选择", group: "跨模块-ML", primaryIds: ["ml-123","ml-124"], secondaryIds: ["ml-125"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["DBSCAN|K.*Means|聚类"] },

  { query: "L1 L2 Dropout 正则化选哪个", group: "跨模块-ML", primaryIds: ["ml-10"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["L1.*L2|Dropout|正则化"] },

  { query: "MSE和MAE损失函数对比", group: "跨模块-ML", primaryIds: ["ml-1","ml-53","ml-142","ml-143"], secondaryIds: ["ml-144"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["MSE|MAE|L1.*Loss|L2."] },

  { query: "Mini Batch vs Full Batch训练", group: "跨模块-ML", primaryIds: ["ml-1","ml-11","ml-58"], secondaryIds: ["ml-115"], acceptableDecks: ["deep-learning","machine-learning"], acceptableConcepts: ["Batch|SGD|梯度"] },

  { query: "One-Hot和Target Encoding", group: "跨模块-ML", primaryIds: ["ml-14","ml-135","ml-178"], secondaryIds: ["ml-129"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["One.*Hot|Target|编码"] },

  { query: "Precision vs Recall业务取舍", group: "跨模块-ML", primaryIds: ["ml-49","ml-88"], secondaryIds: ["ml-90"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Precision|Recall|业务"] },

  { query: "SGD vs AdamW什么时候用", group: "跨模块-ML", primaryIds: ["ml-58"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["SGD|Adam|优化器"] },

  { query: "SVM和逻辑回归谁更好", group: "跨模块-ML", primaryIds: ["ml-1","ml-19"], secondaryIds: ["ml-2"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["SVM|逻辑回归"] },

  { query: "回归任务和分类任务Loss", group: "跨模块-ML", primaryIds: ["ml-1","ml-155"], secondaryIds: ["ml-185"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["回归|分类|MSE|交叉熵"] },

  { query: "多任务学习vs单任务训练", group: "跨模块-ML", primaryIds: ["ml-150"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["多任务|Multi.*task|共享"] },

  { query: "架构和数据哪个更重要", group: "跨模块-ML", primaryIds: ["ml-104","ml-110"], secondaryIds: ["ml-135"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["数据.*模型|Data-centric"] },

  { query: "梯度下降和牛顿法优化对比", group: "跨模块-ML", primaryIds: ["ml-11","ml-57"], secondaryIds: ["ml-58"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["梯度下降|牛顿法|二阶"] },

  { query: "白盒模型和黑盒模型可解释", group: "跨模块-ML", primaryIds: ["ml-137","ml-181"], secondaryIds: ["ml-73"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["可解释|SHAP|黑盒|白盒"] },

  { query: "离线强化学习和在线强化学习", group: "跨模块-ML", primaryIds: ["ml-113","ml-153"], secondaryIds: ["ml-163"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["在线|离线|RL|Batch.*RL"] },

  { query: "离线评估和在线实验的差异", group: "跨模块-ML", primaryIds: ["ml-137","ml-153","ml-163"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["离线.*评估|在线.*实验|AB"] },

  { query: "BERT和GPT训练目标不同", group: "跨模块-大模型", primaryIds: ["llm-10"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["BERT.*GPT|自编码|自回归"] },

  { query: "GPT和Claude文风差异", group: "跨模块-大模型", primaryIds: ["llm-10","llm-11"], secondaryIds: ["llm-24"], acceptableDecks: ["llm"], acceptableConcepts: ["GPT|Claude|对齐|风格"] },

  { query: "ONNX TensorRT哪个快", group: "跨模块-大模型", primaryIds: ["llm-21","llm-26","llm-23"], secondaryIds: ["llm-25"], acceptableDecks: ["llm","deep-learning"], acceptableConcepts: ["ONNX|TensorRT|推理"] },

  { query: "Prompt工程和Fine-tuning选哪个", group: "跨模块-大模型", primaryIds: ["llm-12","llm-13"], secondaryIds: ["llm-16"], acceptableDecks: ["llm"], acceptableConcepts: ["Prompt|微调|ICL"] },

  { query: "Seq2Seq和Transformer架构对比", group: "跨模块-大模型", primaryIds: ["llm-38","llm-4"], secondaryIds: ["llm-5"], acceptableDecks: ["llm"], acceptableConcepts: ["Seq2Seq|Transformer"] },

  { query: "TPU和GPU训练优势劣势", group: "跨模块-大模型", primaryIds: ["llm-11","llm-40"], secondaryIds: ["llm-48"], acceptableDecks: ["llm"], acceptableConcepts: ["TPU|GPU|硬件|训练"] },

  { query: "微调LoRA和全量微调的区别", group: "跨模块-大模型", primaryIds: ["llm-12","llm-13"], secondaryIds: ["llm-17"], acceptableDecks: ["llm"], acceptableConcepts: ["LoRA|全量|微调"] },

  { query: "自编码模型和自回归模型区别", group: "跨模块-大模型", primaryIds: ["llm-10","llm-24"], secondaryIds: ["llm-39"], acceptableDecks: ["llm"], acceptableConcepts: ["自编码|自回归|BERT|GPT"] },

  { query: "贪心搜索和束搜索对比", group: "跨模块-大模型", primaryIds: ["llm-22"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["贪心|Beam|解码"] },

  { query: "预训练和微调模型的差异", group: "跨模块-大模型", primaryIds: ["llm-11","llm-12"], secondaryIds: ["llm-13"], acceptableDecks: ["llm"], acceptableConcepts: ["预训练|微调|Pretrain"] },

  { query: "BatchNorm和LayerNorm什么时候用哪个", group: "跨模块-深度vs大模型", primaryIds: ["dl-21","dl-22"], secondaryIds: ["dl-3","llm-38"], acceptableDecks: ["deep-learning","llm"], acceptableConcepts: ["Batch.*Norm|Layer.*N"] },

  { query: "RNN和Transformer大不同", group: "跨模块-深度vs大模型", primaryIds: ["dl-24","dl-7"], secondaryIds: ["dl-9","llm-38"], acceptableDecks: ["deep-learning","llm"], acceptableConcepts: ["RNN|LSTM|Transformer"] },

  { query: "ReLU Sigmoid中间状态推导", group: "跨模块-深度学习", primaryIds: ["dl-1","dl-24"], secondaryIds: ["dl-31"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["ReLU|Sigmoid|Tanh|激活"] },

  { query: "ETL ELT数据集成区别", group: "跨模块-统计", primaryIds: ["stats-116","stats-125"], secondaryIds: ["stats-185"], acceptableDecks: ["statistics"], acceptableConcepts: ["ETL|ELT|数据.*仓库"] },

  { query: "KL散度和JS散度对比", group: "跨模块-统计", primaryIds: ["stats-194"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["KL.*散度|JS|相对熵"] },

  { query: "SQL和NoSQL数据库选型", group: "跨模块-统计", primaryIds: ["stats-178","stats-180"], secondaryIds: ["stats-182"], acceptableDecks: ["statistics"], acceptableConcepts: ["SQL|NoSQL|关系型"] },

  { query: "Streaming和Batch数据处理", group: "跨模块-统计", primaryIds: ["stats-150","stats-187"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["流式|批处理|Kafka|Spark"] },

  { query: "如何设计一个实验评估", group: "跨模块-统计", primaryIds: ["stats-102","stats-116"], secondaryIds: ["stats-118"], acceptableDecks: ["statistics"], acceptableConcepts: ["实验|AB|随机"] },

  { query: "最大似然和最大后验区别", group: "跨模块-统计", primaryIds: ["stats-111","stats-195"], secondaryIds: ["stats-39"], acceptableDecks: ["statistics"], acceptableConcepts: ["MLE|MAP|似然|后验"] },

  { query: "Agent 开发里面 ReAct 模式和 Function Calling 到底有什么区别，什么时候用哪个", group: "长句-Agent", primaryIds: ["agent-2"], secondaryIds: ["agent-3","agent-4"], acceptableDecks: ["agent"], acceptableConcepts: ["ReAct","Function Calling","Tool Use"] },

  { query: "AutoGPT怎么自己规划执行任务", group: "长句-Agent", primaryIds: ["agent-21","agent-3"], secondaryIds: ["agent-4"], acceptableDecks: ["agent"], acceptableConcepts: ["AutoGPT|Planning|Age"] },

  { query: "HNSW索引向量数据库", group: "长句-Agent", primaryIds: ["agent-10","agent-12"], secondaryIds: ["agent-15"], acceptableDecks: ["agent"], acceptableConcepts: ["向量.*数据库|HNSW|ANN|检索"] },

  { query: "JSON Mode和Function Calling区别", group: "长句-Agent", primaryIds: ["agent-2"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["JSON.*Mode|Function "] },

  { query: "LangChain和LlamaIndex对比", group: "长句-Agent", primaryIds: ["agent-10","agent-11"], secondaryIds: ["agent-12"], acceptableDecks: ["agent"], acceptableConcepts: ["LangChain|LlamaIndex"] },

  { query: "RAG检索和生成怎么结合的", group: "长句-Agent", primaryIds: ["agent-10","agent-11"], secondaryIds: ["agent-12"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG|检索|生成|Pipeline"] },

  { query: "我们想在公司内部搭建一个基于 RAG 的知识库问答系统，从技术选型到落地有什么需要注意的地方", group: "长句-Agent", primaryIds: ["agent-7"], secondaryIds: ["agent-15","agent-18","agent-22"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG","检索增强生成","知识库"] },

  { query: "智能客服意图识别怎么做", group: "长句-Agent", primaryIds: ["agent-10","agent-11"], secondaryIds: ["agent-12"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG|分类|意图"] },

  { query: "用AI回复客户邮件隐私怎么保证", group: "长句-Agent", primaryIds: ["agent-10","agent-11"], secondaryIds: ["agent-12"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG|安全|幻觉"] },

  { query: "力扣里面二叉树相关的题目我做得不太好，尤其是递归遍历老是写错，有哪些经典题可以练手", group: "长句-力扣", primaryIds: ["lc-043"], secondaryIds: ["lc-040","lc-041","lc-039"], acceptableDecks: ["leetcode"], acceptableConcepts: ["二叉树","遍历","递归"] },

  { query: "最近在刷数组相关的题，哈希表和双指针这两类经常搞混，什么时候用哈希什么时候用双指针", group: "长句-力扣", primaryIds: ["lc-001"], secondaryIds: ["lc-002","lc-005"], acceptableDecks: ["leetcode"], acceptableConcepts: ["哈希表","双指针","数组"] },

  { query: "8G显存部署大模型有什么轻量化方案", group: "长句-大模型", primaryIds: ["llm-24","llm-40"], secondaryIds: ["llm-42"], acceptableDecks: ["llm"], acceptableConcepts: ["量化|压缩|部署|显存"] },

  { query: "Chain-of-Thought在GPT4中", group: "长句-大模型", primaryIds: ["llm-21","llm-17"], secondaryIds: ["llm-25"], acceptableDecks: ["llm"], acceptableConcepts: ["COT|思维链|推理"] },

  { query: "Flash Attention怎么加速", group: "长句-大模型", primaryIds: ["llm-21","llm-25"], secondaryIds: ["llm-40"], acceptableDecks: ["llm"], acceptableConcepts: ["Flash.*Attention|加速"] },

  { query: "OOM显存不足怎么排查", group: "长句-大模型", primaryIds: ["llm-40","llm-47"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["OOM|显存|内存.*不足"] },

  { query: "PEFT方法LoRA Adapter对比", group: "长句-大模型", primaryIds: ["llm-12","llm-13"], secondaryIds: ["llm-17"], acceptableDecks: ["llm"], acceptableConcepts: ["LoRA|Adapter|PEFT|微调"] },

  { query: "RoPE和其他位置编码冲突吗", group: "长句-大模型", primaryIds: ["llm-4"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["RoPE|位置编码|ALiBi"] },

  { query: "Speculative Decoding推理加速", group: "长句-大模型", primaryIds: ["llm-21","llm-25"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["Speculative|推测.*解码|推"] },

  { query: "TPU和GPU训练架构差异", group: "长句-大模型", primaryIds: ["llm-11","llm-40"], secondaryIds: ["llm-48"], acceptableDecks: ["llm"], acceptableConcepts: ["TPU|GPU|训练|并行"] },

  { query: "Transformer为什么除以根号dk", group: "长句-大模型", primaryIds: ["llm-2"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["缩放|√|方差|点积"] },

  { query: "few-shot为什么给例子就能学", group: "长句-大模型", primaryIds: ["llm-16","llm-46"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["Few.*shot|Prompt|上下文"] },

  { query: "vLLM PageAttention批处理", group: "长句-大模型", primaryIds: ["llm-26"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["vLLM|PagedAttention"] },

  { query: "大模型论文看不过来有什么必读", group: "长句-大模型", primaryIds: ["llm-10","llm-24"], secondaryIds: ["llm-42"], acceptableDecks: ["llm"], acceptableConcepts: ["Transformer.*架构|GPT."] },

  { query: "微调应该冻结哪些层", group: "长句-大模型", primaryIds: ["llm-12","llm-13"], secondaryIds: ["llm-17"], acceptableDecks: ["llm"], acceptableConcepts: ["微调|LoRA|冻结|Adapter"] },

  { query: "想了解一下现在主流的 prompt engineering 技巧有哪些，有没有什么套路可以参考", group: "长句-大模型", primaryIds: ["llm-14"], secondaryIds: ["llm-13"], acceptableDecks: ["llm"], acceptableConcepts: ["Prompt","CoT","Few-shot"] },

  { query: "我们团队想把一个大模型部署到生产环境，但是推理速度太慢了，有没有什么加速的方案可以推荐一下", group: "长句-大模型", primaryIds: ["llm-15"], secondaryIds: ["llm-16","llm-17"], acceptableDecks: ["llm"], acceptableConcepts: ["推理加速","量化","KV Cache"] },

  { query: "数据并行模型并行流水线并行", group: "长句-大模型", primaryIds: ["llm-47","llm-48"], secondaryIds: ["llm-7"], acceptableDecks: ["llm"], acceptableConcepts: ["并行|ZeRO|分布式"] },

  { query: "改简历准备大厂技术面", group: "长句-学习路径", primaryIds: ["ml-134","ml-136"], secondaryIds: ["ml-189"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["面试|简历|机器学习"] },

  { query: "机器学习面试记了又忘怎么办", group: "长句-学习路径", primaryIds: ["ml-110","ml-112"], secondaryIds: ["ml-119"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["面试|复习|核心"] },

  { query: "特征工程零散怎么系统学", group: "长句-学习路径", primaryIds: ["ml-138","ml-141"], secondaryIds: ["ml-41"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["特征.*工程|特征.*选择|降维"] },

  { query: "Batch Size对收敛有什么影响", group: "长句-机器学习", primaryIds: ["ml-58"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Batch.*Size|SGD|收敛"] },

  { query: "Contrastive Learning InfoNCE推导", group: "长句-机器学习", primaryIds: ["ml-119","ml-122"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["对比.*学习|InfoNCE|SimCL"] },

  { query: "DBSCAN和KMeans对比", group: "长句-机器学习", primaryIds: ["ml-123","ml-124"], secondaryIds: ["ml-125"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["DBSCAN|K.*Means|聚类"] },

  { query: "Early Stopping防过拟合原理", group: "长句-机器学习", primaryIds: ["ml-7","ml-77"], secondaryIds: ["ml-78"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Early.*Stop|早停|过拟合"] },

  { query: "Imbalanced Dataset采样策略", group: "长句-机器学习", primaryIds: ["ml-105","ml-135"], secondaryIds: ["ml-143"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["不平衡|SMOTE|采样"] },

  { query: "MLflow和WandB怎么管理实验", group: "长句-机器学习", primaryIds: ["ml-162"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["MLflow|实验.*管理|模型.*版本"] },

  { query: "Momentum为什么能加速收敛", group: "长句-机器学习", primaryIds: ["ml-120","ml-58"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["动量|SGD|优化器|Adam"] },

  { query: "Precision Recall trade-off可视化", group: "长句-机器学习", primaryIds: ["ml-49","ml-50"], secondaryIds: ["ml-56"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Precision.*Recall|PR"] },

  { query: "WOE编码和OneHot区别", group: "长句-机器学习", primaryIds: ["ml-14","ml-42"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["WOE|One.*Hot|特征.*编码"] },

  { query: "Weight Decay和L2等价吗", group: "长句-机器学习", primaryIds: ["ml-10"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Weight.*Decay|L1.*L2"] },

  { query: "XGBoost调参不如默认值怎么办", group: "长句-机器学习", primaryIds: ["ml-31","ml-33"], secondaryIds: ["ml-34"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["XGBoost|LightGBM|调参"] },

  { query: "传统ML还有没有必要学", group: "长句-机器学习", primaryIds: ["ml-18","ml-19"], secondaryIds: ["ml-2"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["SVM|随机森林|大模型.*对比"] },

  { query: "几十万条数据冷启动推荐系统怎么做", group: "长句-机器学习", primaryIds: ["ml-103","ml-117"], secondaryIds: ["ml-133"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["冷启动|矩阵分解|推荐"] },

  { query: "噪声标签怎么训练模型", group: "长句-机器学习", primaryIds: ["ml-144"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["噪声.*标签|鲁棒|清洗"] },

  { query: "在线推理离线批处理架构区别", group: "长句-机器学习", primaryIds: ["ml-104","ml-110"], secondaryIds: ["ml-160"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["推理|批处理|架构|部署"] },

  { query: "对比学习为什么不需要标注", group: "长句-机器学习", primaryIds: ["ml-118","ml-119"], secondaryIds: ["ml-122"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["对比学习|自监督|SimCLR|Info"] },

  { query: "我有个数据集样本特别不均衡，正样本只有百分之五，这种情况一般怎么处理比较好", group: "长句-机器学习", primaryIds: ["ml-16"], secondaryIds: ["ml-17","ml-50"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["样本不均衡","SMOTE","类别权重"] },

  { query: "最近在复习机器学习基础，想问一下偏差和方差到底怎么理解，有什么直观的例子吗", group: "长句-机器学习", primaryIds: ["ml-8"], secondaryIds: ["ml-7"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["偏差方差","bias-variance","过拟合"] },

  { query: "树模型家族怎么选", group: "长句-机器学习", primaryIds: ["ml-126","ml-17"], secondaryIds: ["ml-18"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["决策树|随机森林|GBDT|XGBoos"] },

  { query: "正样本只有3%直接训练会不会有问题", group: "长句-机器学习", primaryIds: ["ml-143","ml-16"], secondaryIds: ["ml-72"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["不平衡|SMOTE|类别.*加权"] },

  { query: "深度学习金融风控可解释性", group: "长句-机器学习", primaryIds: ["ml-134","ml-137"], secondaryIds: ["ml-181"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["可解释|SHAP|LIME|Fairne"] },

  { query: "现场推导逻辑回归梯度卡住了怎么办", group: "长句-机器学习", primaryIds: ["ml-1"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["逻辑回归.*损失|梯度.*推导"] },

  { query: "过拟合训练99测试80怎么排查", group: "长句-机器学习", primaryIds: ["ml-10","ml-7"], secondaryIds: ["ml-77"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["过拟合|Dropout|正则化"] },

  { query: "面试官如果问我 SVM 的原理和核函数怎么选，我该怎么回答比较好", group: "长句-机器学习", primaryIds: ["ml-2"], secondaryIds: ["ml-19","ml-20"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["SVM","核函数","kernel"] },

  { query: "BPTT在RNN中怎么工作", group: "长句-深度学习", primaryIds: ["dl-5","dl-7"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["RNN|BPTT|反向.*传播"] },

  { query: "GELU激活函数数学公式优势", group: "长句-深度学习", primaryIds: ["dl-1","dl-24"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["GELU|Swish|激活"] },

  { query: "LSTM和GRU本质区别是什么", group: "长句-深度学习", primaryIds: ["dl-24","dl-7"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["LSTM|GRU|RNN"] },

  { query: "图像分割手机端部署选什么模型", group: "长句-深度学习", primaryIds: ["dl-6"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["CNN|分割|轻量化|模型.*压缩"] },

  { query: "我在做图像分类任务，模型训练了好几个小时一直在震荡不收敛，可能是什么原因", group: "长句-深度学习", primaryIds: ["dl-2"], secondaryIds: ["dl-1","dl-5"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["梯度消失","激活函数","学习率"] },

  { query: "梯度消失梯度爆炸通俗解释", group: "长句-深度学习", primaryIds: ["dl-2"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["梯度.*消失|梯度.*爆炸|BatchN"] },

  { query: "能不能用通俗易懂的方式给我解释一下 Batch Normalization 到底做了什么事情", group: "长句-深度学习", primaryIds: ["dl-3"], secondaryIds: ["dl-2"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["BatchNorm","归一化"] },

  { query: "AB测试转化率提升只有0.5%怎么判断显著", group: "长句-统计学", primaryIds: ["stats-119","stats-174"], secondaryIds: ["stats-31"], acceptableDecks: ["statistics"], acceptableConcepts: ["AB.*测试|A/B.*显著|样本量"] },

  { query: "CAP理论为什么不能三者兼得", group: "长句-统计学", primaryIds: ["stats-126"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["CAP|分布式|一致"] },

  { query: "ETL流程pipeline最佳实践", group: "长句-统计学", primaryIds: ["stats-149","stats-152"], secondaryIds: ["stats-153"], acceptableDecks: ["statistics"], acceptableConcepts: ["ETL|pipeline|数据"] },

  { query: "SQL全表扫描怎么加索引", group: "长句-统计学", primaryIds: ["stats-180","stats-183"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["索引|SQL.*优化|全表"] },

  { query: "Spark join操作特别慢怎么办", group: "长句-统计学", primaryIds: ["stats-180","stats-187"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["数据倾斜|Spark|优化"] },

  { query: "pandas百万数据内存溢出怎么办", group: "长句-统计学", primaryIds: ["stats-180","stats-187"], secondaryIds: ["stats-153"], acceptableDecks: ["statistics"], acceptableConcepts: ["pandas|内存|大数据"] },

  { query: "协方差和相关系数公式老搞混", group: "长句-统计学", primaryIds: ["stats-115","stats-146"], secondaryIds: ["stats-17"], acceptableDecks: ["statistics"], acceptableConcepts: ["协方差|相关系数|标准化"] },

  { query: "新功能是否对留存有正向影响", group: "长句-统计学", primaryIds: ["stats-136","stats-145"], secondaryIds: ["stats-164"], acceptableDecks: ["statistics"], acceptableConcepts: ["AB.*测试|因果|留存"] },

  { query: "时间序列节假日效应怎么处理", group: "长句-统计学", primaryIds: ["stats-88","stats-90"], secondaryIds: ["stats-91"], acceptableDecks: ["statistics"], acceptableConcepts: ["季节|节假日|ARIMA|Prophet"] },

  { query: "面试被问到中心极限定理，我其实一直没完全理解它的实际应用场景，能帮我梳理一下吗", group: "长句-统计学", primaryIds: ["stats-10"], secondaryIds: ["stats-11"], acceptableDecks: ["statistics"], acceptableConcepts: ["中心极限定理","大数定律","抽样分布"] },

  { query: "领导让我分析一下新功能上线前后用户留存有没有显著变化，我应该用什么统计方法", group: "长句-统计学", primaryIds: ["stats-24"], secondaryIds: ["stats-25","stats-26"], acceptableDecks: ["statistics"], acceptableConcepts: ["AB测试","假设检验","显著性"] },

  { query: "下周要跟领导做季度述职汇报了，怎么把工作成果讲得有条理又有亮点，有什么推荐的框架吗", group: "长句-职场", primaryIds: ["wp-3"], secondaryIds: ["wp-8"], acceptableDecks: ["workplace"], acceptableConcepts: ["汇报","向上沟通","述职"] },

  { query: "最近想跳槽但是简历投出去都没有回音，想请教一下怎么写简历才能让 HR 眼前一亮", group: "长句-职场", primaryIds: ["wp-7"], secondaryIds: ["wp-6","wp-5"], acceptableDecks: ["workplace"], acceptableConcepts: ["简历","面试","STAR法则"] },

];
