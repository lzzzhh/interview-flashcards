// Ranking gap (Top50→Top15 buried) test set for localized reranking improvements.
// These are cases where the correct primary/equiv card is in Top50 but not Top15.
// Used to measure reranking fixes without changing global weights.

import { TEST_CASES } from './test-cases';

export interface RankingGapCase {
  query: string;
  group: string;
  primaryIds: string[];
  buriedCards: string[]; // cards in Top50 but pushed below Top15
  buriedAtRank: number; // approximate rank where card first appears
  top15CardIds: string[]; // what currently occupies Top15
}

// Extracted from weak-group triage — manually verified
// Last updated: 2026-05-29, stale primaryIds aligned with test-cases.ts
export const RANKING_GAP_CASES: RankingGapCase[] = [
  // ═══ 回归-对抗 ═══
  { query: 'Attention Mask是什么', group: '回归-对抗', primaryIds: ['llm-1', 'llm-2'],
    buriedCards: ['dl-9', 'llm-9', 'dl-25', 'llm-3'], buriedAtRank: 16,
    top15CardIds: ['ml-59', 'stats-156', 'stats-175', 'ml-107', 'ml-82', 'ml-106', 'ml-101', 'ml-109', 'ml-110', 'ml-149', 'dl-1', 'dl-2', 'dl-17', 'dl-7', 'dl-8'],
  },
  { query: '为什么需要RAG', group: '回归-对抗', primaryIds: ['agent-10', 'agent-11'],
    buriedCards: ['agent-10', 'agent-11'], buriedAtRank: 20,
    top15CardIds: ['stats-88', 'agent-7', 'stats-121', 'agent-8', 'stats-129', 'agent-6', 'agent-9', 'stats-140', 'stats-177', 'ml-27', 'ml-56', 'agent-18', 'ml-90', 'agent-22', 'ml-124'],
  },
  { query: '大模型能不能用来做搜索', group: '回归-对抗', primaryIds: ['agent-10', 'agent-11'],
    buriedCards: ['agent-10'], buriedAtRank: 30,
    top15CardIds: ['llm-39', 'llm-16', 'llm-10', 'llm-8', 'llm-18', 'llm-41', 'llm-3', 'llm-4', 'llm-9', 'llm-12', 'llm-14', 'llm-19', 'llm-24', 'llm-38', 'llm-43'],
  },
  { query: '模型Serving怎么做', group: '回归-对抗', primaryIds: ['llm-26'],
    buriedCards: ['llm-26'], buriedAtRank: 25,
    top15CardIds: ['ml-81', 'stats-134', 'ml-82', 'stats-157', 'ml-80', 'ml-84', 'ml-152', 'stats-47', 'stats-92', 'stats-95', 'stats-104', 'stats-88', 'stats-98', 'stats-117', 'stats-121'],
  },

  // ═══ 概念-机器学习 ═══
  { query: '交叉验证K怎么选', group: '概念-机器学习', primaryIds: ['ml-176', 'ml-187'],
    buriedCards: ['ml-187'], buriedAtRank: 25,
    top15CardIds: ['ml-207', 'stats-202', 'stats-53', 'stats-55', 'stats-117', 'ml-9', 'ml-4', 'ml-8', 'stats-57', 'ml-2', 'stats-59', 'ml-19', 'stats-111', 'ml-17', 'stats-122'],
  },
  { query: '参数太多模型太复杂怎么办', group: '概念-机器学习', primaryIds: ['ml-139'],  // fixed: removed ml-10 (not about complexity)
    buriedCards: ['ml-139'], buriedAtRank: 27,
    top15CardIds: ['ml-188', 'ml-155', 'llm-45', 'stats-144', 'stats-47', 'stats-55', 'ml-7', 'ml-8', 'ml-19', 'stats-57', 'ml-125', 'stats-92', 'ml-149', 'ml-150', 'ml-78'],
  },
  { query: '数据太少训练不好怎么办', group: '概念-机器学习', primaryIds: ['ml-149'],  // fixed: removed ml-151 (not about data shortage)
    buriedCards: ['ml-149'], buriedAtRank: 19,
    top15CardIds: ['ml-7', 'ml-2', 'ml-139', 'ml-155', 'stats-53', 'stats-55', 'stats-57', 'ml-31', 'ml-77', 'ml-19', 'stats-117', 'stats-92', 'ml-20', 'ml-78', 'ml-125'],
  },
  { query: '生成模型和判别模型区别', group: '概念-机器学习', primaryIds: ['ml-110', 'ml-111'],
    buriedCards: ['ml-110', 'ml-111'], buriedAtRank: 25,
    top15CardIds: ['dl-11', 'dl-28', 'dl-12', 'dl-14', 'dl-15', 'dl-26', 'ml-125', 'dl-17', 'dl-18', 'dl-27', 'agent-14', 'stats-157', 'stats-91', 'llm-46', 'agent-9'],
  },

  // ═══ 概念-统计学 ═══
  { query: '怎么判断两个变量之间有没有关系', group: '概念-统计学', primaryIds: ['stats-29', 'stats-37'],  // fixed: was stats-115/stats-138
    buriedCards: ['stats-115', 'stats-138'], buriedAtRank: 999,  // no longer expected in Top50
    top15CardIds: ['stats-95', 'stats-80', 'stats-158', 'stats-124', 'stats-128', 'stats-159', 'stats-104', 'stats-69', 'stats-71', 'stats-75', 'stats-126', 'stats-66', 'stats-70', 'stats-102', 'stats-27'],
  },

  // ═══ 长句 ═══
  { query: 'AutoGPT怎么自己规划执行任务', group: '长句-Agent', primaryIds: ['agent-5'],  // fixed: was agent-21/agent-3
    buriedCards: ['llm-10'], buriedAtRank: 27,
    top15CardIds: ['dl-17', 'agent-4', 'ml-79', 'agent-5', 'llm-39', 'ml-155', 'llm-24', 'ml-110', 'ml-151', 'ml-82', 'ml-180', 'llm-18', 'llm-19', 'llm-41', 'llm-43'],
  },
  { query: 'Chain-of-Thought在GPT4中', group: '长句-大模型', primaryIds: ['llm-21', 'llm-17'],
    buriedCards: ['agent-5', 'ml-122'], buriedAtRank: 16,
    top15CardIds: ['llm-39', 'llm-24', 'llm-43', 'llm-18', 'dl-17', 'llm-10', 'stats-111', 'stats-130', 'stats-145', 'stats-157', 'llm-4', 'llm-42', 'ml-155', 'ml-110', 'llm-14'],
  },
  { query: '我们团队想把一个大模型部署到生产环境，但是推理速度太慢了，有没有什么加速的方案可以推荐一下', group: '长句-大模型', primaryIds: ['llm-15'],
    buriedCards: ['llm-42'], buriedAtRank: 20,
    top15CardIds: ['llm-11', 'llm-12', 'llm-13', 'llm-39', 'llm-41', 'llm-43', 'ml-82', 'llm-5', 'llm-7', 'llm-6', 'llm-21', 'llm-19', 'llm-22', 'dl-40', 'llm-25'],
  },
  { query: 'Early Stopping防过拟合原理', group: '长句-机器学习', primaryIds: ['ml-7', 'ml-77'],
    buriedCards: ['ml-7', 'ml-77'], buriedAtRank: 16,
    top15CardIds: ['ml-38', 'ml-180', 'stats-50', 'stats-53', 'stats-55', 'stats-58', 'stats-92', 'stats-117', 'stats-184', 'stats-195', 'ml-2', 'ml-31', 'ml-4', 'ml-6', 'ml-35'],
  },
  { query: 'AB测试转化率提升只有0.5%怎么判断显著', group: '长句-统计学', primaryIds: ['stats-119', 'stats-174'],
    buriedCards: ['stats-119', 'stats-174'], buriedAtRank: 16,
    top15CardIds: ['stats-116', 'stats-159', 'stats-29', 'stats-66', 'stats-62', 'stats-135', 'stats-160', 'stats-68', 'stats-69', 'stats-70', 'stats-71', 'stats-122', 'stats-72', 'stats-37', 'stats-75'],
  },
  { query: '新功能是否对留存有正向影响', group: '长句-统计学', primaryIds: ['stats-136', 'stats-145'],
    buriedCards: ['stats-29', 'stats-153', 'stats-149', 'stats-37'], buriedAtRank: 16,
    top15CardIds: ['stats-160', 'stats-102', 'stats-131', 'stats-132', 'stats-77', 'stats-125', 'stats-158', 'stats-75', 'stats-159', 'stats-76', 'stats-124', 'stats-156', 'stats-162', 'stats-95', 'stats-119'],
  },
  { query: '领导让我分析一下新功能上线前后用户留存有没有显著变化，我应该用什么统计方法', group: '长句-统计学', primaryIds: ['stats-24'],
    buriedCards: ['stats-37', 'stats-29'], buriedAtRank: 20,
    top15CardIds: ['stats-29', 'stats-135', 'stats-62', 'stats-69', 'stats-153', 'stats-116', 'stats-72', 'stats-160', 'stats-79', 'stats-10', 'stats-147', 'stats-162', 'stats-33', 'stats-149', 'stats-101'],
  },
];

export function printRankingGapReport(): void {
  console.log(`\n═══ Ranking Gap Test Set (${RANKING_GAP_CASES.length} cases) ═══`);
  console.log('These cases have correct cards in Top50 but not in Top15.');
  console.log('Used to evaluate localized reranking improvements.\n');

  for (const c of RANKING_GAP_CASES) {
    console.log(`  [${c.group}] "${c.query.slice(0, 50)}"`);
    console.log(`    primaryIds: [${c.primaryIds.join(', ')}]`);
    console.log(`    buried at rank ~${c.buriedAtRank}: [${c.buriedCards.join(', ')}]`);
    console.log(`    current Top15: [${c.top15CardIds.slice(0, 5).join(', ')}...]`);
    console.log('');
  }
}

// Self-test
if (require.main === module) {
  printRankingGapReport();
}
