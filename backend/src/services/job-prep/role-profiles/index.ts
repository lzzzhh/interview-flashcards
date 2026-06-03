// Role Profiles — skill/concept checklists per job role family
import type { RoleProfile } from './types';

export const PROFILES: RoleProfile[] = [
  {
    roleFamily: 'data-analysis',
    displayName: '数据分析',
    coreSkills: [
      'SQL', '数据可视化', '统计基础', '假设检验', 'A/B测试',
      '业务指标', '数据清洗', '描述统计', '报表设计', '数据建模',
    ],
    tools: ['SQL', 'Excel', 'Tableau', 'Python', 'R', 'Power BI', 'Metabase'],
    concepts: [
      'sql', 'hypothesis_test', 'ab_test', 'ab_testing',
      'statistics_cn', 'probability', 'confidence_interval',
      'data_cleaning', 'data_science', 'etl',
    ],
    commonTasks: [
      '构建业务指标体系', '用户行为分析', 'A/B实验设计与评估',
      '数据可视化报告', '业务增长分析', '数据质量监控',
    ],
    interviewTopics: [
      'SQL窗口函数', 'A/B测试显著性判断', '指标体系搭建',
      '归因分析', '漏斗分析', '用户画像', 'RFM模型',
    ],
    projectSignals: ['指标体系', 'A/B实验', '数据看板', '业务增长', '用户分析'],
    niceToHave: ['Python', '机器学习基础', '点击率预估', '推荐系统基础'],
    mustCoverInPlan: [
      'SQL', '统计学基础', '假设检验', 'A/B测试',
      '指标体系', '业务分析', '数据可视化',
    ],
    avoidOverweight: ['深度学习', '大模型', '神经网络架构'],
  },
  {
    roleFamily: 'data-science',
    displayName: '数据科学',
    coreSkills: [
      'SQL', 'Python', 'R', '统计学', '机器学习', '实验设计',
      'A/B测试', '因果推断', '指标体系', '用户行为分析',
      '推荐系统', '数据建模', '业务分析',
    ],
    tools: ['SQL', 'Python', 'R', 'SAS', 'Spark', 'Jupyter'],
    concepts: [
      'sql', 'ml', 'hypothesis_test', 'ab_test', 'ab_testing',
      'statistics_cn', 'probability', 'confidence_interval',
      'causal_inference', 'recommendation', 'logistic_regression',
      'linear_regression', 'kmeans', 'feature_engineering',
      'cross_validation', 'decision_tree', 'random_forest',
      'xgboost', 'gbdt', 'imbalanced_dataset',
    ],
    commonTasks: [
      'A/B实验设计与因果推断', '构建核心指标体系',
      '推荐模型效果评估', '用户行为数据挖掘',
      '业务增长分析', '模型搭建与迭代',
    ],
    interviewTopics: [
      'A/B测试全流程', '因果推断方法', '指标体系搭建',
      '推荐系统评估', '机器学习模型选择', '特征工程',
      'SQL复杂查询', '统计学假设检验',
    ],
    projectSignals: ['AB实验', '指标体系', '推荐系统', '因果推断', '用户增长'],
    niceToHave: ['深度学习基础', 'LLM基础', '论文发表', '竞赛经验'],
    mustCoverInPlan: [
      'SQL', '统计学', 'A/B实验', '因果推断',
      '指标体系', '机器学习基础', 'Python数据分析',
      '业务分析表达',
    ],
    avoidOverweight: ['大模型架构', '神经网络训练', 'GPU优化'],
  },
  {
    roleFamily: 'algorithm',
    displayName: '算法工程师',
    coreSkills: [
      '数据结构', '算法设计', '动态规划', '图算法', '排序搜索',
      'Python', 'C++', '数学基础', '复杂度分析',
    ],
    tools: ['Python', 'C++', 'Java', 'LeetCode'],
    concepts: [
      'algorithms', 'leetcode', 'tree', 'graph_algorithm', 'bfs', 'dfs',
      'dynamic_programming', 'sorting', 'hash_table', 'array',
      'two_pointer', 'sliding_window', 'recursion', 'backtracking',
      'binary_search', 'prefix_sum', 'mono_stack', 'greedy_alg',
      'linkedlist', 'stack', 'queue_cn', 'string',
    ],
    commonTasks: [
      '算法题刷题', '代码实现优化', '数据结构选择',
      '时间复杂度分析', '系统设计基础',
    ],
    interviewTopics: [
      '动态规划', '二叉树遍历', '图搜索', '哈希表',
      '双指针与滑动窗口', '排序算法', '递归与回溯',
    ],
    projectSignals: ['算法竞赛', 'ACM', 'LeetCode刷题', '开源贡献'],
    niceToHave: ['机器学习基础', '分布式基础', '编译原理'],
    mustCoverInPlan: [
      '数据结构', '算法基础', '动态规划', '二叉树',
      '哈希表', '图算法', '排序', '递归',
    ],
    avoidOverweight: ['深度学习', 'LLM', '前端框架'],
  },
  {
    roleFamily: 'machine-learning',
    displayName: '机器学习工程师',
    coreSkills: [
      'Python', '机器学习', '深度学习', '特征工程', '模型评估',
      '数据处理', 'SQL', 'PyTorch/TensorFlow', '模型部署',
    ],
    tools: ['Python', 'PyTorch', 'TensorFlow', 'SQL', 'Spark', 'MLflow'],
    concepts: [
      'ml', 'dl', 'cnn', 'rnn', 'transformer', 'attention',
      'feature_engineering', 'cross_validation', 'overfitting',
      'regularization', 'xgboost', 'lightgbm', 'catboost',
      'svm', 'pca', 'kmeans', 'logistic_regression', 'linear_regression',
      'knn', 'decision_tree', 'random_forest', 'gbdt',
      'ensemble', 'boosting', 'bagging', 'gradient_descent',
      'optimizer', 'loss_function', 'dropout', 'batchnorm',
      'imbalanced_dataset', 'data_cleaning',
    ],
    commonTasks: [
      '模型训练与调参', '特征工程', '模型评估与选择',
      '数据处理与清洗', '模型部署与优化',
    ],
    interviewTopics: [
      'XGBoost vs LightGBM', '过拟合处理', '特征选择',
      '模型评估指标', '正则化方法', '集成学习',
      '深度学习基础', 'Transformer原理',
    ],
    projectSignals: ['模型训练', '特征工程', 'Kaggle', '模型部署'],
    niceToHave: ['LLM基础', '推荐系统', 'NLP', 'CV基础'],
    mustCoverInPlan: [
      '机器学习基础', '特征工程', '模型评估',
      '集成学习', '深度学习基础', 'Python编程',
    ],
    avoidOverweight: ['大模型微调', 'Agent开发', '前端'],
  },
  {
    roleFamily: 'llm',
    displayName: '大模型/LLM',
    coreSkills: [
      'Transformer', 'LLM原理', 'RAG', 'Prompt工程',
      '模型微调', 'Agent开发', 'Python',
    ],
    tools: ['Python', 'PyTorch', 'LangChain', 'HuggingFace', 'vLLM'],
    concepts: [
      'transformer', 'attention', 'llm_big_model', 'rag', 'agent',
      'function_calling', 'tool_use', 'prompt_engineering',
      'embedding', 'vectordb', 'finetuning', 'structured_output',
      'json_mode', 'self_rag', 'dl', 'optimizer',
    ],
    commonTasks: [
      'RAG系统搭建', '模型微调', 'Agent开发',
      'Prompt优化', '模型部署', '向量数据库选型',
    ],
    interviewTopics: [
      'Transformer架构', 'RAG实现细节', 'Agent框架',
      '模型微调方法', 'Prompt工程技巧', '向量数据库',
    ],
    projectSignals: ['RAG', 'Agent', '微调', '向量数据库', 'Prompt工程'],
    niceToHave: ['分布式训练', 'CUDA优化', '多模态'],
    mustCoverInPlan: [
      'Transformer', 'RAG', 'LLM原理', 'Prompt工程',
      '模型微调', 'Agent开发', 'Python',
    ],
    avoidOverweight: ['算法刷题', '前端开发', 'SQL深度优化'],
  },
  {
    roleFamily: 'llm-application',
    displayName: 'LLM应用开发',
    coreSkills: [
      'LLM API调用', 'Prompt工程', 'RAG', 'Agent搭建',
      'Python', 'API设计', '向量数据库',
    ],
    tools: ['Python', 'FastAPI', 'LangChain', 'LlamaIndex', 'Qdrant', 'Chroma'],
    concepts: [
      'llm_big_model', 'rag', 'agent', 'prompt_engineering',
      'function_calling', 'tool_use', 'embedding', 'vectordb',
      'json_mode', 'structured_output',
    ],
    commonTasks: [
      '搭建RAG应用', '设计Agent workflow', 'Prompt优化',
      'API集成', '向量检索调优',
    ],
    interviewTopics: [
      'RAG架构设计', 'Agent ReAct模式', 'Prompt模板',
      '向量数据库选型', 'LLM API最佳实践',
    ],
    projectSignals: ['RAG应用', 'Agent', 'ChatBot', '向量检索'],
    niceToHave: ['微调经验', '模型部署', '前端集成'],
    mustCoverInPlan: [
      'RAG', 'Prompt工程', 'Agent开发', '向量数据库',
      'LLM API', 'Python',
    ],
    avoidOverweight: ['算法刷题', '底层模型训练', 'CUDA优化'],
  },
  {
    roleFamily: 'backend',
    displayName: '后端开发',
    coreSkills: [
      'Java/Go/Python', '数据库设计', '系统设计', 'API设计',
      '并发编程', '分布式系统', '消息队列', '缓存',
    ],
    tools: ['Java', 'Go', 'Python', 'MySQL', 'Redis', 'Kafka', 'Docker', 'K8s'],
    concepts: [
      'distributed_system', 'cicd', 'sql', 'model_deploy',
      'cicd_pipeline',
    ],
    commonTasks: [
      'API设计与开发', '数据库建模', '系统架构设计',
      '性能优化', '分布式系统设计',
    ],
    interviewTopics: [
      '数据库索引优化', '分布式一致性', '消息队列',
      '缓存策略', '微服务架构', '系统设计题',
    ],
    projectSignals: ['微服务', '高并发', '分布式', '数据库优化', 'CI/CD'],
    niceToHave: ['LLM集成', 'ML基础设施', '前端基础'],
    mustCoverInPlan: [
      '数据库', '系统设计', 'API设计', '并发编程',
      '分布式基础', '缓存与消息队列',
    ],
    avoidOverweight: ['深度学习', '算法竞赛', '前端框架'],
  },
  {
    roleFamily: 'frontend',
    displayName: '前端开发',
    coreSkills: [
      'JavaScript/TypeScript', 'React/Vue', 'CSS', 'HTML',
      '性能优化', '响应式设计', '前端工程化',
    ],
    tools: ['JavaScript', 'TypeScript', 'React', 'Vue', 'Webpack', 'Vite'],
    concepts: [
      'vibecoding', 'javascript', 'typescript',
    ],
    commonTasks: [
      '组件开发', '页面性能优化', '前端工程化搭建',
      '跨浏览器兼容', '响应式布局',
    ],
    interviewTopics: [
      'React Hooks', '虚拟DOM', '性能优化',
      'CSS布局', '前端安全', '打包工具',
    ],
    projectSignals: ['React项目', '组件库', '性能优化', 'TypeScript'],
    niceToHave: ['Node.js', '全栈能力', '设计感'],
    mustCoverInPlan: [
      'JavaScript', 'React/Vue', 'CSS', '性能优化',
      '前端工程化', 'HTTP协议',
    ],
    avoidOverweight: ['深度学习', '算法竞赛', '后端架构'],
  },
];

export function getProfile(roleFamily: string): RoleProfile | undefined {
  return PROFILES.find(p => p.roleFamily === roleFamily);
}
