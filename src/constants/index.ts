// ============================================================
// src/constants/index.ts — UI 常量
// ============================================================

import type { Category, Difficulty } from '../types';
import {
  Flame,
  BarChart3,
  Bot,
  Brain,
  BrainCircuit,
  MessageSquare,
  Briefcase,
  Coffee,
  type LucideIcon,
} from 'lucide-react';

export interface CategoryMeta {
  key: Category;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'leetcode', label: '力扣', icon: Flame },
  { key: 'statistics', label: '统计学', icon: BarChart3 },
  { key: 'machine-learning', label: '机器学习', icon: Bot },
  { key: 'deep-learning', label: '深度学习', icon: BrainCircuit },
  { key: 'llm', label: '大模型', icon: Brain },
  { key: 'agent', label: 'Agent', icon: Bot },
  { key: 'jargon', label: '黑话', icon: MessageSquare },
  { key: 'workplace', label: '职场', icon: Briefcase },
  { key: 'vibe-coding', label: 'Vibe Coding', icon: Bot },
  { key: 'java', label: 'Java 面试', icon: Coffee },
];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

export const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export const DIFFICULTY_OPTIONS: { value: Difficulty | 'all'; label: string }[] = [
  { value: 'all', label: '全部难度' },
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
];

/** 各分类的子主题筛选选项 */
export const SUBTOPIC_OPTIONS: Record<Category, { value: string; label: string }[]> = {
  leetcode: [],
  statistics: [
    { value: 'all', label: '全部' },
    { value: '描述统计', label: '描述统计' },
    { value: '概率论', label: '概率论' },
    { value: '假设检验', label: '假设检验' },
    { value: '贝叶斯统计', label: '贝叶斯统计' },
    { value: '回归分析', label: '回归分析' },
  ],
  'machine-learning': [
    { value: 'all', label: '全部' },
    { value: '监督学习', label: '监督学习' },
    { value: '无监督学习', label: '无监督学习' },
    { value: '集成学习', label: '集成学习' },
    { value: '特征工程', label: '特征工程' },
    { value: '评估指标', label: '评估指标' },
    { value: '优化', label: '优化' },
  ],
  'deep-learning': [
    { value: 'all', label: '全部' },
    { value: '深度学习基础', label: '深度学习基础' },
    { value: '生成模型', label: '生成模型' },
    { value: '模型部署', label: '模型部署' },
    { value: '优化训练', label: '优化训练' },
    { value: '数据存储', label: '数据存储' },
    { value: 'DLCore', label: '核心基础' },
    { value: 'DLArchitecture', label: '网络架构' },
    { value: 'DLTraining', label: '训练优化' },
    { value: 'DLAdvanced', label: '高级专题' },
  ],
  llm: [
    { value: 'all', label: '全部' },
    { value: 'Transformer', label: 'Transformer' },
    { value: '训练微调', label: '训练微调' },
    { value: '推理部署', label: '推理部署' },
    { value: 'Agent', label: 'Agent' },
    { value: 'RAG', label: 'RAG' },
    { value: '评估安全', label: '评估安全' },
    { value: 'LLMCore', label: '核心基础' },
    { value: 'LLMTraining', label: '训练微调' },
    { value: 'LLMInference', label: '推理部署' },
    { value: 'LLMApplication', label: '应用开发' },
    { value: 'LLMSafety', label: '评估安全' },
  ],
  agent: [
    { value: 'all', label: '全部' },
    { value: 'Agent', label: 'Agent' },
    { value: 'RAG', label: 'RAG' },
    { value: 'AI安全', label: 'AI安全' },
    { value: 'AgentCore', label: 'Agent 核心' },
    { value: 'AgentRAG', label: 'Agent RAG' },
    { value: 'AgentFramework', label: '框架工程' },
    { value: 'AgentArchitecture', label: '系统架构' },
    { value: 'AgentSafety', label: '安全治理' },
  ],
  jargon: [
    { value: 'all', label: '全部' },
    { value: '互联网黑话', label: '互联网黑话' },
    { value: '职场术语', label: '职场术语' },
  ],
  workplace: [
    { value: 'all', label: '全部' },
    { value: '向上沟通', label: '向上沟通' },
    { value: '跨部门协作', label: '跨部门协作' },
    { value: '项目管理', label: '项目管理' },
    { value: '面试技巧', label: '面试技巧' },
  ],
  'vibe-coding': [
    { value: 'all', label: '全部' },
    { value: 'Vibe Coding', label: 'Vibe Coding' },
  ],
  java: [
    { value: 'all', label: '全部' },
    { value: 'JavaCore', label: 'Java 核心' },
    { value: 'JavaAdvanced', label: 'Java 进阶' },
    { value: 'JavaSpring', label: 'Spring 生态' },
    { value: 'JavaRedis', label: 'Redis' },
    { value: 'JavaDatabase', label: '数据库' },
    { value: 'JavaDistributed', label: '分布式' },
    { value: 'JavaMicroservice', label: '微服务' },
    { value: 'JavaORM', label: 'ORM' },
    { value: 'JavaInterview', label: '面试场景' },
    { value: 'JavaLLM', label: 'Java + AI' },
  ],
};

export interface SubModuleMeta {
  key: string;
  label: string;
  category: Category;
  subTopic: string;
  subTopics?: string[];
  color: string;
  tags?: string[];
}

export const SUB_MODULES: Record<string, SubModuleMeta[]> = {
  leetcode: [
    { key: 'lc-array',        label: '数组与哈希',   category: 'leetcode', subTopic: '', color: 'bg-blue-500',     tags: ['数组', '哈希表', '字符串', '前缀和', '矩阵', '模拟', '计数', '前缀积'] },
    { key: 'lc-twopointer',   label: '双指针滑动',   category: 'leetcode', subTopic: '', color: 'bg-green-500',    tags: ['双指针', '滑动窗口'] },
    { key: 'lc-binary',       label: '二分与排序',   category: 'leetcode', subTopic: '', color: 'bg-amber-500',    tags: ['二分查找', '排序', '快速选择', '归并排序', '计数排序', '桶排序'] },
    { key: 'lc-linkedlist',   label: '链表',         category: 'leetcode', subTopic: '', color: 'bg-red-500',      tags: ['链表', '双向链表'] },
    { key: 'lc-stack',        label: '栈与队列',     category: 'leetcode', subTopic: '', color: 'bg-purple-500',   tags: ['栈', '队列', '单调栈', '单调队列', '设计'] },
    { key: 'lc-tree',         label: '二叉树与递归', category: 'leetcode', subTopic: '', color: 'bg-teal-500',     tags: ['树', '二叉树', '递归', '深度优先搜索', '二叉搜索树'] },
    { key: 'lc-dp',           label: '动态规划',     category: 'leetcode', subTopic: '', color: 'bg-pink-500',     tags: ['动态规划', '记忆化搜索'] },
    { key: 'lc-backtrack',    label: '回溯与分治',   category: 'leetcode', subTopic: '', color: 'bg-orange-500',   tags: ['回溯', '分治'] },
    { key: 'lc-bfs',          label: 'BFS与图',      category: 'leetcode', subTopic: '', color: 'bg-cyan-500',     tags: ['广度优先搜索', '图', '拓扑排序'] },
    { key: 'lc-greedy',       label: '贪心与数学',   category: 'leetcode', subTopic: '', color: 'bg-indigo-500',   tags: ['贪心', '数学', '组合数学', '位运算', '随机化'] },
    { key: 'lc-heap',         label: '堆与优先队列', category: 'leetcode', subTopic: '', color: 'bg-rose-500',     tags: ['堆', '优先队列'] },
    { key: 'lc-other',        label: '其他专题',     category: 'leetcode', subTopic: '', color: 'bg-gray-400',    tags: [] },
  ],
  statistics: [
    { key: 'stats-desc',       label: '描述统计',     category: 'statistics', subTopic: '描述统计',      color: 'bg-blue-500' },
    { key: 'stats-prob',       label: '概率论',       category: 'statistics', subTopic: '概率论',        color: 'bg-red-500' },
    { key: 'stats-hypothesis', label: '假设检验',     category: 'statistics', subTopic: '假设检验',      color: 'bg-purple-500' },
    { key: 'stats-bayes',      label: '贝叶斯统计',   category: 'statistics', subTopic: '贝叶斯统计',    color: 'bg-amber-500' },
    { key: 'stats-regression', label: '回归分析',     category: 'statistics', subTopic: '回归分析',      color: 'bg-green-500' },
    { key: 'stats-abtest',     label: 'AB实验',       category: 'statistics', subTopic: 'AB实验',       color: 'bg-teal-500' },
    { key: 'stats-causal',     label: '因果推断',     category: 'statistics', subTopic: '因果推断',      color: 'bg-orange-500' },
    { key: 'stats-timeseries', label: '时间序列',     category: 'statistics', subTopic: '时间序列分析',  color: 'bg-cyan-500' },
    { key: 'stats-sql',        label: 'SQL与数据分析',category: 'statistics', subTopic: 'SQL与数据分析', color: 'bg-sky-500' },
    { key: 'stats-metric',     label: '产品指标',     category: 'statistics', subTopic: '产品指标与分析',color: 'bg-pink-500' },
    { key: 'stats-experiment', label: '实验设计',     category: 'statistics', subTopic: '实验设计',      color: 'bg-indigo-500' },
    { key: 'stats-math',       label: '数学基础',     category: 'statistics', subTopic: '数学基础',      color: 'bg-gray-600' },
    { key: 'stats-sampling',   label: '抽样方法',     category: 'statistics', subTopic: '抽样方法',      color: 'bg-emerald-500' },
    { key: 'stats-nonparam',   label: '非参数检验',   category: 'statistics', subTopic: '非参数检验',    color: 'bg-violet-500' },
    { key: 'stats-survival',   label: '生存分析',     category: 'statistics', subTopic: '生存分析',      color: 'bg-rose-500' },
    { key: 'stats-other',      label: '其他专题',     category: 'statistics', subTopic: '',              color: 'bg-gray-400' },
  ],
  'machine-learning': [
    { key: 'ml-supervised',    label: '监督学习',     category: 'machine-learning', subTopic: '监督学习',          color: 'bg-blue-500' },
    { key: 'ml-unsupervised',  label: '无监督学习',   category: 'machine-learning', subTopic: '无监督学习',        color: 'bg-green-500' },
    { key: 'ml-ensemble',      label: '集成学习',     category: 'machine-learning', subTopic: '集成学习',          color: 'bg-emerald-500' },
    { key: 'ml-features',      label: '特征工程',     category: 'machine-learning', subTopic: '特征工程与数据预处理', color: 'bg-amber-500' },
    { key: 'ml-evaluation',    label: '模型评估',     category: 'machine-learning', subTopic: '模型评估与调优',    color: 'bg-purple-500' },
    { key: 'ml-metrics',       label: '评估指标',     category: 'machine-learning', subTopic: '评估指标',          color: 'bg-red-500' },
    { key: 'ml-nlp',           label: 'NLP基础',      category: 'machine-learning', subTopic: 'NLP基础',           color: 'bg-teal-500' },
    { key: 'ml-reinforce',     label: '强化学习',     category: 'machine-learning', subTopic: '强化学习',          color: 'bg-orange-500' },
    { key: 'ml-recsys',        label: '推荐系统',     category: 'machine-learning', subTopic: '推荐系统',          color: 'bg-pink-500' },
    { key: 'ml-gnn',           label: '图神经网络',   category: 'machine-learning', subTopic: '图神经网络',        color: 'bg-indigo-500' },
    { key: 'ml-deploy',        label: '部署与监控',   category: 'machine-learning', subTopic: '模型部署与MLOps',   color: 'bg-cyan-500' },
    { key: 'ml-monitor',       label: '模型监控',     category: 'machine-learning', subTopic: '模型监控与运维',    color: 'bg-sky-500' },
    { key: 'ml-python',        label: 'Python工程',   category: 'machine-learning', subTopic: 'Python与工程实践',  color: 'bg-yellow-500' },
    { key: 'ml-optimize',      label: '优化与损失',   category: 'machine-learning', subTopic: '优化',             color: 'bg-rose-500' },
    { key: 'ml-transfer',      label: '迁移与自监督', category: 'machine-learning', subTopic: '迁移学习与多任务',  color: 'bg-violet-500' },
    { key: 'ml-feat2',         label: '特征工程进阶', category: 'machine-learning', subTopic: '特征工程',          color: 'bg-lime-500' },
    { key: 'ml-other',         label: '其他专题',     category: 'machine-learning', subTopic: '',                 color: 'bg-gray-400' },
  ],
  'deep-learning': [
    { key: 'dl-basics',        label: '深度学习总览', category: 'deep-learning', subTopic: '深度学习基础', subTopics: ['深度学习基础', 'DLCore'], color: 'bg-purple-500' },
    { key: 'dl-backprop',      label: '反向传播与梯度', category: 'deep-learning', subTopic: 'DLCore', tags: ['反向传播', '链式法则', '梯度消失', '梯度爆炸'], color: 'bg-red-500' },
    { key: 'dl-activation',    label: '激活与归一化', category: 'deep-learning', subTopic: 'DLCore', tags: ['激活函数', 'ReLU', 'Sigmoid', 'Batch Normalization', 'BN', '标准化'], color: 'bg-amber-500' },
    { key: 'dl-regularization', label: '正则化与泛化', category: 'deep-learning', subTopic: 'DLCore', tags: ['正则化', 'Dropout', '迁移学习', '微调', '预训练'], color: 'bg-green-500' },
    { key: 'dl-architecture',  label: '网络架构总览', category: 'deep-learning', subTopic: 'DLArchitecture', subTopics: ['DLArchitecture', '模型部署'], color: 'bg-blue-500' },
    { key: 'dl-cnn-rnn',       label: 'CNN / RNN / ResNet', category: 'deep-learning', subTopic: 'DLArchitecture', tags: ['CNN', 'RNN', 'LSTM', 'ResNet', 'CV'], color: 'bg-sky-500' },
    { key: 'dl-transformer',   label: 'Transformer 与注意力', category: 'deep-learning', subTopic: 'DLArchitecture', tags: ['Transformer', '注意力机制'], color: 'bg-indigo-500' },
    { key: 'dl-training',      label: '训练优化总览', category: 'deep-learning', subTopic: 'DLTraining', subTopics: ['DLTraining', '优化训练'], color: 'bg-green-500' },
    { key: 'dl-training-tricks', label: '训练技巧', category: 'deep-learning', subTopic: 'DLTraining', tags: ['训练', '技巧', '初始化', '推理'], color: 'bg-emerald-500' },
    { key: 'dl-generative',    label: '生成模型总览', category: 'deep-learning', subTopic: 'DLAdvanced', subTopics: ['DLAdvanced', '生成模型'], tags: ['生成模型'], color: 'bg-pink-500' },
    { key: 'dl-gan-vae',       label: 'GAN / VAE', category: 'deep-learning', subTopic: 'DLAdvanced', tags: ['GAN', 'VAE', '生成模型', '生成器', '判别器', '变分自编码器'], color: 'bg-rose-500' },
    { key: 'dl-diffusion',     label: '扩散模型', category: 'deep-learning', subTopic: 'DLAdvanced', tags: ['扩散模型', 'Diffusion', 'DDPM', '去噪'], color: 'bg-violet-500' },
    { key: 'dl-advanced',      label: '高级专题总览', category: 'deep-learning', subTopic: 'DLAdvanced',   color: 'bg-indigo-500' },
    { key: 'dl-deploy',        label: '部署与加速', category: 'deep-learning', subTopic: 'DLAdvanced', tags: ['部署', 'ONNX', 'GPU', '移动端'], color: 'bg-cyan-500' },
    { key: 'dl-kg',            label: '图谱与工程', category: 'deep-learning', subTopic: 'DLAdvanced', tags: ['图数据库', 'Neo4j', '知识图谱'], color: 'bg-lime-500' },
    { key: 'dl-other',         label: '其他专题',     category: 'deep-learning', subTopic: '',             color: 'bg-gray-400' },
  ],
  llm: [
    { key: 'llm-core',         label: '大模型基础总览', category: 'llm', subTopic: 'LLMCore', subTopics: ['LLMCore', 'Transformer'], color: 'bg-blue-500' },
    { key: 'llm-attention',    label: 'Attention / QKV', category: 'llm', subTopic: 'LLMCore', tags: ['Self-Attention', 'QKV', '公式推导', '核心机制'], color: 'bg-sky-500' },
    { key: 'llm-position-norm', label: '位置编码与归一化', category: 'llm', subTopic: 'LLMCore', tags: ['位置编码', 'LayerNorm', 'BatchNorm', 'RMSNorm'], color: 'bg-cyan-500' },
    { key: 'llm-architecture', label: '架构与选型', category: 'llm', subTopic: 'LLMCore', tags: ['架构', '架构对比', 'Decoder-only', 'MoE', 'Scaling Law', '选型', '对比'], color: 'bg-indigo-500' },
    { key: 'llm-training',     label: '训练微调总览', category: 'llm', subTopic: 'LLMTraining', subTopics: ['LLMTraining', '训练微调'], color: 'bg-green-500' },
    { key: 'llm-sft-peft',     label: 'SFT / PEFT / LoRA', category: 'llm', subTopic: 'LLMTraining', tags: ['SFT', 'PEFT', 'LoRA', 'P-Tuning', 'Prefix Tuning', '微调'], color: 'bg-emerald-500' },
    { key: 'llm-alignment',    label: '对齐与 RLHF', category: 'llm', subTopic: 'LLMTraining', tags: ['对齐', 'RLHF', 'PPO', 'DPO', 'Reward Model'], color: 'bg-lime-500' },
    { key: 'llm-distributed',  label: '分布式训练', category: 'llm', subTopic: 'LLMTraining', tags: ['分布式', 'ZeRO', '数据并行', '显存优化'], color: 'bg-teal-500' },
    { key: 'llm-inference',    label: '推理部署总览', category: 'llm', subTopic: 'LLMInference', subTopics: ['LLMInference', '推理部署'], color: 'bg-orange-500' },
    { key: 'llm-kv-quant',     label: 'KV Cache 与量化', category: 'llm', subTopic: 'LLMInference', tags: ['KV Cache', '量化', 'GPTQ', 'AWQ', '推理优化'], color: 'bg-amber-500' },
    { key: 'llm-serving',      label: 'Serving 与成本', category: 'llm', subTopic: 'LLMInference', tags: ['vLLM', '工程', '成本', '缓存', '推理'], color: 'bg-rose-500' },
    { key: 'llm-application',  label: '应用开发总览', category: 'llm', subTopic: 'LLMApplication', subTopics: ['LLMApplication', 'Agent', 'RAG'], color: 'bg-teal-500' },
    { key: 'llm-prompt-rag',   label: 'Prompt / RAG / Agent', category: 'llm', subTopic: 'LLMApplication', tags: ['Prompt', 'RAG', 'Agent', 'ICL', '工具'], color: 'bg-purple-500' },
    { key: 'llm-safety',       label: '评估安全总览', category: 'llm', subTopic: 'LLMSafety', subTopics: ['LLMSafety', '评估安全'], color: 'bg-red-500' },
    { key: 'llm-eval-hallucination', label: '评估与幻觉', category: 'llm', subTopic: 'LLMSafety', tags: ['评估', '幻觉', '安全'], color: 'bg-pink-500' },
    { key: 'llm-other',        label: '其他专题',     category: 'llm', subTopic: '',            color: 'bg-gray-400' },
  ],
  agent: [
    { key: 'agent-core',       label: 'Agent 核心总览', category: 'agent', subTopic: 'AgentCore', subTopics: ['AgentCore', 'Agent'], color: 'bg-indigo-500' },
    { key: 'agent-react-planning', label: 'ReAct 与规划', category: 'agent', subTopic: 'AgentCore', tags: ['ReAct', 'Planning', '推理+行动', '设计'], color: 'bg-blue-500' },
    { key: 'agent-tools-memory', label: '工具与记忆', category: 'agent', subTopic: 'AgentCore', tags: ['Tool', 'Tool-Use', 'Function Calling', '工具调用', 'Memory', '结构化输出'], color: 'bg-purple-500' },
    { key: 'agent-rag',        label: 'RAG 总览',     category: 'agent', subTopic: 'AgentRAG', subTopics: ['AgentRAG', 'RAG'], color: 'bg-teal-500' },
    { key: 'agent-rag-chunk',  label: '切分与向量',   category: 'agent', subTopic: 'AgentRAG', tags: ['文档切分', 'Chunk策略', 'Embedding', '向量', '向量数据库'], color: 'bg-cyan-500' },
    { key: 'agent-rag-retrieve', label: '检索与重排', category: 'agent', subTopic: 'AgentRAG', tags: ['检索', 'BM25', '混合检索', 'RRF', 'Reranking', 'Hybrid Search'], color: 'bg-green-500' },
    { key: 'agent-rag-advanced', label: '高级 RAG',   category: 'agent', subTopic: 'AgentRAG', tags: ['RAG-Fusion', 'Self-RAG', '知识图谱', '检索增强', '检索增强生成'], color: 'bg-lime-500' },
    { key: 'agent-framework',  label: '框架工程总览', category: 'agent', subTopic: 'AgentFramework', subTopics: ['AgentFramework', 'AgentArchitecture'], color: 'bg-blue-500' },
    { key: 'agent-frameworks', label: 'LangGraph / MCP', category: 'agent', subTopic: 'AgentFramework', tags: ['LangGraph', 'MCP', 'AutoGPT', 'MetaGPT', 'Agent框架'], color: 'bg-orange-500' },
    { key: 'agent-architecture', label: '系统架构与路由', category: 'agent', subTopic: 'AgentArchitecture', tags: ['架构', '路由', '多Agent', '多模态', 'JSON', '容错'], color: 'bg-amber-500' },
    { key: 'agent-safety',     label: '安全治理总览', category: 'agent', subTopic: 'AgentSafety', subTopics: ['AgentSafety', 'AI安全'], color: 'bg-red-500' },
    { key: 'agent-eval-safety', label: '评估与隐私', category: 'agent', subTopic: 'AgentSafety', tags: ['评估', '安全', '隐私', 'PII', '脱敏', 'AI客服'], color: 'bg-pink-500' },
    { key: 'agent-other',      label: '其他专题',     category: 'agent', subTopic: '', color: 'bg-gray-400' },
  ],
  jargon: [
    { key: 'jargon-internet',  label: '互联网黑话',   category: 'jargon', subTopic: '互联网黑话', color: 'bg-violet-500' },
    { key: 'jargon-workplace', label: '职场术语',     category: 'jargon', subTopic: '职场术语',   color: 'bg-sky-500' },
  ],
  workplace: [
    { key: 'wp-upward',        label: '向上沟通',     category: 'workplace', subTopic: '向上沟通',   color: 'bg-blue-500' },
    { key: 'wp-behavior',      label: '行为面试',     category: 'workplace', subTopic: '行为面试',   color: 'bg-amber-500' },
    { key: 'wp-system',        label: '系统设计',     category: 'workplace', subTopic: '系统设计',   color: 'bg-purple-500' },
    { key: 'wp-cs',            label: '计算机基础',   category: 'workplace', subTopic: '计算机基础', color: 'bg-green-500' },
    { key: 'wp-project',       label: '项目管理',     category: 'workplace', subTopic: '项目管理',   color: 'bg-orange-500' },
    { key: 'wp-cross',         label: '跨部门协作',   category: 'workplace', subTopic: '跨部门协作', color: 'bg-teal-500' },
    { key: 'wp-interview',     label: '面试技巧',     category: 'workplace', subTopic: '面试技巧',   color: 'bg-pink-500' },
  ],
  java: [
    { key: 'java-core',         label: 'Java 核心总览', category: 'java', subTopic: 'JavaCore',        color: 'bg-orange-500' },
    { key: 'java-core-basic',   label: '基础 / OOP',   category: 'java', subTopic: 'JavaCore', tags: ['基础', 'OOP', '泛型', '异常', '反射', '注解', '新特性'], color: 'bg-amber-500' },
    { key: 'java-core-collections', label: '集合与 HashMap', category: 'java', subTopic: 'JavaCore', tags: ['集合', 'HashMap', '数据结构'], color: 'bg-blue-500' },
    { key: 'java-core-concurrency', label: '并发与线程池', category: 'java', subTopic: 'JavaCore', tags: ['并发', '锁', '线程池'], color: 'bg-purple-500' },
    { key: 'java-core-jvm',     label: 'JVM / GC / 内存', category: 'java', subTopic: 'JavaCore', tags: ['JVM', 'GC', '内存', '类加载', '性能调优'], color: 'bg-red-500' },
    { key: 'java-core-patterns', label: '设计模式与工具', category: 'java', subTopic: 'JavaCore', tags: ['设计模式', '工具', 'API'], color: 'bg-teal-500' },
    { key: 'java-advanced',     label: 'Java 进阶总览', category: 'java', subTopic: 'JavaAdvanced',    color: 'bg-red-500' },
    { key: 'java-advanced-performance', label: '性能与排查', category: 'java', subTopic: 'JavaAdvanced', tags: ['性能', '线上排查', 'DevOps', '部署', 'JDK21'], color: 'bg-rose-500' },
    { key: 'java-advanced-architecture', label: '架构与系统设计', category: 'java', subTopic: 'JavaAdvanced', tags: ['架构', '系统设计', '设计', '消息队列'], color: 'bg-indigo-500' },
    { key: 'java-spring',       label: 'Spring 生态总览', category: 'java', subTopic: 'JavaSpring',      color: 'bg-green-500' },
    { key: 'java-spring-boot',  label: 'Spring Boot', category: 'java', subTopic: 'JavaSpring', tags: ['Spring Boot', '配置', '事务'], color: 'bg-emerald-500' },
    { key: 'java-spring-ioc-aop', label: 'IoC / AOP', category: 'java', subTopic: 'JavaSpring', tags: ['IoC', 'AOP', '注解'], color: 'bg-lime-500' },
    { key: 'java-redis',        label: 'Redis / 缓存', category: 'java', subTopic: 'JavaRedis', tags: ['Redis', '缓存'], color: 'bg-rose-500' },
    { key: 'java-database',     label: '数据库',       category: 'java', subTopic: 'JavaDatabase',    color: 'bg-blue-500' },
    { key: 'java-db-sql',       label: 'MySQL / SQL', category: 'java', subTopic: 'JavaDatabase', tags: ['MySQL', 'SQL', '事务'], color: 'bg-sky-500' },
    { key: 'java-distributed',  label: '分布式',       category: 'java', subTopic: 'JavaDistributed', tags: ['分布式', '消息队列'], color: 'bg-purple-500' },
    { key: 'java-microservice', label: '微服务',       category: 'java', subTopic: 'JavaMicroservice', tags: ['微服务', '架构'], color: 'bg-teal-500' },
    { key: 'java-orm',          label: 'ORM / MyBatis', category: 'java', subTopic: 'JavaORM', tags: ['MyBatis'], color: 'bg-cyan-500' },
    { key: 'java-interview',    label: '面试场景',     category: 'java', subTopic: 'JavaInterview',   color: 'bg-amber-500' },
    { key: 'java-llm',          label: 'Java + AI',    category: 'java', subTopic: 'JavaLLM', tags: ['LLM', 'Agent', 'Spring AI', 'LangChain4j', 'DeepSeek'], color: 'bg-indigo-500' },
    { key: 'java-other',        label: '其他专题',     category: 'java', subTopic: '',                color: 'bg-gray-400' },
  ],
};

export const SM2_LABELS = [
  { value: 0, label: '❌ 忘了', short: '忘了' },
  { value: 1, label: '🤔 困难', short: '困难' },
  { value: 2, label: '🤨 模糊', short: '模糊' },
  { value: 3, label: '✅ 记得', short: '记得' },
  { value: 4, label: '💪 轻松', short: '轻松' },
  { value: 5, label: '🧠 秒答', short: '秒答' },
] as const;
