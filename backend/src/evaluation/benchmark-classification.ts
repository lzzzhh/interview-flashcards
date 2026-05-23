// backend/src/evaluation/benchmark-classification.ts
// Normalized benchmark metadata for all test cases.
// Merged at runtime by runner.ts. Source of truth for benchmarkScope/intentType.

export interface CaseMeta {
  benchmarkScope: 'search' | 'learning_plan' | 'excluded';
  intentType: 'card_lookup' | 'concept_card_search' | 'card_collection_search' | 'learning_plan' | 'ambiguous' | 'not_card_search_intent';
  excludeReason?: 'open_qa' | 'career_advice' | 'business_decision' | 'diagnostic_qa' | 'too_ambiguous' | 'out_of_scope';
  normalizedQuery?: string;
  labelQuality?: 'verified' | 'needs_review' | 'weak';
  source?: 'legacy' | 'coverage_gap_resolved' | 'manual_review';
}

// Classification rules applied:
// - All learning-path group → learning_plan
// - career advice / resume / interview prep → excluded (career_advice)
// - business decisions (retention, metrics, A/B) → excluded (business_decision)
// - open-ended QA / diagnostic → excluded (open_qa / diagnostic_qa)
// - too short/ambiguous → excluded (too_ambiguous)
// - concept/keyword queries → search (concept_card_search)
// - card-collection queries (学习/入门/路线) → search (card_collection_search)
// - exact term queries → search (card_lookup)

export const BENCHMARK_META: Record<string, CaseMeta> = {
  // ═══ learning-path group → learning_plan ═══
  'AB实验平台学习路线': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  'AI产品经理要学什么': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  'Agent开发学习路线': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  'CICD流水线学习路线': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  'CV图像分类学习路线': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  'LLM大模型学习路线': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  'MLOps学习路线': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  'NLP文本分类学习路线': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  'Prompt Engineering怎么入行': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  'RAG学习路线': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  'Snap AR做滤镜要学什么': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '为什么学NLP先学Transformer': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '什么是好的解释性文章': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '从零学AI需要哪些数学': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '分布式系统学习路线': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '到底怎么快速入门ML': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '向量数据库学习路线': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '大模型入门学习路线': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '如何构建知识体系': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '如何系统的自学统计学': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '学习CSS面试宝典': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '学习Kubernetes容器编排': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '学习React前端框架': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '学习Spark大数据处理': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '学习pandas数据处理': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '学习sklearn机器学习': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '学习概率论与数理统计': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '学习深度学习CV方向': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '学习深度强化学习': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '数据工程学习路线': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '数据科学学习路线': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '本科生想做数据科学要掌握什么': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '模型部署从哪开始学': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '统计学习方法书籍推荐': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '自学CS基础要学哪些课': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '转行DS技术栈清单': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '风控建模学习路线': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '想刷动态规划，推荐几道题': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '我 Transformer 不太懂，帮我找相关卡片': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '假如我想学习决策树，我应该学习哪些卡片': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '现在想入门深度学习，需要看哪些基础卡片': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '如何系统地学习假设检验': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '后端转算法要补什么': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '因果推断学习路线': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '图神经网络学习路线': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '大数据Spark学习路线': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '大模型微调学习路线': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '学AI先懂理论还是先会调包': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '小众但卷的AI赛道有哪些': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '广告CTR预估学习路线': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '强化学习从入门到实践': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '想做算法工程师要学什么': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '想学推荐系统需要什么数学基础': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '想进FAANG要学哪些技术': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '推荐系统学习路线': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },
  '时间序列预测学习路线': { benchmarkScope: 'learning_plan', intentType: 'learning_plan', source: 'legacy' },

  // ═══ excluded: career_advice ═══
  '改简历准备大厂技术面': { benchmarkScope: 'excluded', intentType: 'not_card_search_intent', excludeReason: 'career_advice', source: 'legacy' },
  '机器学习面试记了又忘怎么办': { benchmarkScope: 'excluded', intentType: 'not_card_search_intent', excludeReason: 'career_advice', source: 'legacy' },
  '最近想跳槽但是简历投出去都没有回音，想请教一下怎么写简历才能让 HR 眼前一亮': { benchmarkScope: 'excluded', intentType: 'not_card_search_intent', excludeReason: 'career_advice', source: 'legacy' },
  '下周要跟领导做季度述职汇报了，怎么把工作成果讲得有条理又有亮点，有什么推荐的框架': { benchmarkScope: 'excluded', intentType: 'not_card_search_intent', excludeReason: 'career_advice', source: 'legacy' },

  // ═══ excluded: business_decision ═══
  '新功能是否对留存有正向影响': { benchmarkScope: 'excluded', intentType: 'not_card_search_intent', excludeReason: 'business_decision', source: 'legacy' },
  '数据和直觉不一致听谁的': { benchmarkScope: 'excluded', intentType: 'not_card_search_intent', excludeReason: 'business_decision', source: 'legacy' },

  // ═══ excluded: too_ambiguous ═══
  '迭代': { benchmarkScope: 'excluded', intentType: 'ambiguous', excludeReason: 'too_ambiguous', source: 'legacy' },

  // ═══ excluded: open_qa / diagnostic_qa ═══
  '传统ML还有没有必要学': { benchmarkScope: 'excluded', intentType: 'not_card_search_intent', excludeReason: 'open_qa', source: 'legacy' },
  '能不能用通俗易懂的方式给我解释一下 Batch Normalization 到底是怎么回事它在训练和推理阶段的行为有什么不同再举': { benchmarkScope: 'excluded', intentType: 'not_card_search_intent', excludeReason: 'open_qa', source: 'legacy' },

  // ═══ search: normalized queries ═══
  '为什么要shuffle数据': { benchmarkScope: 'search', intentType: 'concept_card_search', normalizedQuery: '数据打乱 SGD mini-batch shuffle', source: 'legacy' },
  '参数太多模型太复杂怎么办': { benchmarkScope: 'search', intentType: 'concept_card_search', normalizedQuery: '过拟合 正则化 模型复杂度 参数数量', source: 'legacy' },
  '数据太少训练不好怎么办': { benchmarkScope: 'search', intentType: 'concept_card_search', normalizedQuery: '小样本学习 数据增强 迁移学习 few-shot', source: 'legacy' },
  'ML里如何处理缺失值': { benchmarkScope: 'search', intentType: 'concept_card_search', normalizedQuery: '缺失值处理 插补 删除 均值填充', source: 'legacy' },
  '噪声标签怎么训练模型': { benchmarkScope: 'search', intentType: 'concept_card_search', normalizedQuery: '噪声标签 label noise robust training', source: 'legacy' },

  // ═══ search: concept_card_search (default for all remaining) ═══
  // All other queries default to search/concept_card_search below
};

// Default: search with concept_card_search intent
export const DEFAULT_META: CaseMeta = {
  benchmarkScope: 'search',
  intentType: 'concept_card_search',
  source: 'legacy',
};

export function getMeta(query: string): CaseMeta {
  return BENCHMARK_META[query] || DEFAULT_META;
}
