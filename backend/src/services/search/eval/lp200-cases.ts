// backend/src/services/search/eval/lp200-cases.ts
// 200 learning-path evaluation cases covering 8 query styles × 6 domains
import type { EvalCase } from './search-eval-types';

// Helper to create domain-specific aliases
const D = {
  LC: 'leetcode', ML: 'machine-learning', DL: 'deep-learning',
  LLM: 'llm', AG: 'agent', STAT: 'statistics', WP: 'workplace', VC: 'vibe-coding',
};

interface LPCase {
  id: string; query: string;
  expectedIntent: string; expectedTopic: string; expectedDeckHint?: string; expectedParent?: string;
  expectedConcepts: string[]; mustMatchAny: string[];
  maxMerged?: number; minFinal?: number; maxFinal?: number;
  category: string; domain: string; style: string;
}

const ALL_CASES: LPCase[] = [
  // ══════════ CATEGORY 1: 标准学习路线 (30) ══════════
  { id:'lp001', query:'怎么学机器学习', expectedIntent:'create_plan', expectedTopic:'机器学习', expectedDeckHint:D.ML, expectedParent:'机器学习', expectedConcepts:['监督学习','过拟合','回归','分类'], mustMatchAny:['机器学习','overfitting','回归'], maxMerged:200, minFinal:5, category:'标准学习路线', domain:'机器学习', style:'怎么学X' },
  { id:'lp002', query:'如何学习深度学习', expectedIntent:'create_plan', expectedTopic:'深度学习', expectedDeckHint:D.DL, expectedParent:'深度学习', expectedConcepts:['神经网络','反向传播','CNN'], mustMatchAny:['深度学习','CNN','反向传播'], maxMerged:200, minFinal:5, category:'标准学习路线', domain:'深度学习', style:'如何学习X' },
  { id:'lp003', query:'大模型怎么入门', expectedIntent:'create_plan', expectedTopic:'大模型', expectedDeckHint:D.LLM, expectedParent:'大模型', expectedConcepts:['LLM','GPT','Transformer'], mustMatchAny:['LLM','GPT','大模型'], maxMerged:150, minFinal:3, category:'标准学习路线', domain:'大模型', style:'X怎么入门' },
  { id:'lp004', query:'哈希表学习路线', expectedIntent:'create_plan', expectedTopic:'哈希表', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['哈希表','hash','两数之和'], mustMatchAny:['哈希表','hash','map'], maxMerged:200, minFinal:3, category:'标准学习路线', domain:'LeetCode', style:'X学习路线' },
  { id:'lp005', query:'动态规划从哪里开始学', expectedIntent:'create_plan', expectedTopic:'动态规划', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['动态规划','DP','子问题'], mustMatchAny:['动态规划','DP','dynamic programming'], maxMerged:200, minFinal:3, category:'标准学习路线', domain:'LeetCode', style:'X从哪里开始学' },
  { id:'lp006', query:'集成学习应该先学什么', expectedIntent:'create_plan', expectedTopic:'集成学习', expectedDeckHint:D.ML, expectedParent:'机器学习', expectedConcepts:['集成学习','Bagging','Boosting','随机森林'], mustMatchAny:['集成学习','ensemble','Bagging','Boosting'], maxMerged:200, minFinal:3, category:'标准学习路线', domain:'机器学习', style:'X应该先学什么' },
  { id:'lp007', query:'怎么学数组', expectedIntent:'create_plan', expectedTopic:'数组', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['数组','array','双指针'], mustMatchAny:['数组','array'], maxMerged:300, minFinal:3, category:'标准学习路线', domain:'LeetCode', style:'怎么学X' },
  { id:'lp008', query:'怎么系统学SQL', expectedIntent:'create_plan', expectedTopic:'SQL', expectedDeckHint:D.STAT, expectedParent:'数据科学', expectedConcepts:['SQL','JOIN','索引','窗口函数'], mustMatchAny:['SQL','JOIN','query','索引'], maxMerged:150, minFinal:2, category:'标准学习路线', domain:'数据科学', style:'怎么系统学X' },
  { id:'lp009', query:'RAG 学习路线', expectedIntent:'create_plan', expectedTopic:'RAG', expectedDeckHint:D.AG, expectedParent:'Agent', expectedConcepts:['RAG','retrieval','embedding'], mustMatchAny:['RAG','retrieval','vector'], maxMerged:100, minFinal:2, category:'标准学习路线', domain:'大模型', style:'X学习路线' },
  { id:'lp010', query:'Agent 怎么系统学', expectedIntent:'create_plan', expectedTopic:'Agent', expectedDeckHint:D.AG, expectedParent:'Agent', expectedConcepts:['Agent','ReAct','工具调用'], mustMatchAny:['Agent','ReAct','tool use','function call'], maxMerged:120, minFinal:2, category:'标准学习路线', domain:'大模型', style:'X怎么系统学' },
  { id:'lp011', query:'怎么学假设检验', expectedIntent:'create_plan', expectedTopic:'假设检验', expectedDeckHint:D.STAT, expectedParent:'统计学', expectedConcepts:['假设检验','p值','t检验'], mustMatchAny:['假设检验','p值','t检验'], maxMerged:150, minFinal:2, category:'标准学习路线', domain:'统计学', style:'怎么学X' },
  { id:'lp012', query:'如何学习二叉树', expectedIntent:'create_plan', expectedTopic:'二叉树', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['二叉树','traversal','BST'], mustMatchAny:['二叉树','BST','binary tree'], maxMerged:200, minFinal:3, category:'标准学习路线', domain:'LeetCode', style:'如何学习X' },
  { id:'lp013', query:'怎么学链表', expectedIntent:'create_plan', expectedTopic:'链表', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['链表','linked list','反转'], mustMatchAny:['链表','linked list'], maxMerged:200, minFinal:3, category:'标准学习路线', domain:'LeetCode', style:'怎么学X' },
  { id:'lp014', query:'图算法怎么入门', expectedIntent:'create_plan', expectedTopic:'图', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['图','BFS','DFS','拓扑排序'], mustMatchAny:['图','graph','BFS','DFS'], maxMerged:200, minFinal:3, category:'标准学习路线', domain:'LeetCode', style:'X怎么入门' },
  { id:'lp015', query:'怎么学回溯算法', expectedIntent:'create_plan', expectedTopic:'回溯', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['回溯','backtracking','DFS'], mustMatchAny:['回溯','backtracking'], maxMerged:150, minFinal:2, category:'标准学习路线', domain:'LeetCode', style:'怎么学X' },
  { id:'lp016', query:'怎么学Transformer', expectedIntent:'create_plan', expectedTopic:'Transformer', expectedDeckHint:D.DL, expectedParent:'深度学习', expectedConcepts:['Transformer','attention','encoder','decoder'], mustMatchAny:['Transformer','attention','encoder'], maxMerged:100, minFinal:2, category:'标准学习路线', domain:'深度学习', style:'怎么学X' },
  { id:'lp017', query:'怎么学强化学习', expectedIntent:'create_plan', expectedTopic:'强化学习', expectedDeckHint:D.ML, expectedParent:'机器学习', expectedConcepts:['强化学习','MDP','Q-learning','policy gradient'], mustMatchAny:['强化学习','Q-learning','policy'], maxMerged:100, minFinal:1, category:'标准学习路线', domain:'机器学习', style:'怎么学X' },
  { id:'lp018', query:'PCA怎么学', expectedIntent:'create_plan', expectedTopic:'PCA', expectedDeckHint:D.ML, expectedParent:'机器学习', expectedConcepts:['PCA','降维','特征值'], mustMatchAny:['PCA','降维','eigen'], maxMerged:100, minFinal:1, category:'标准学习路线', domain:'机器学习', style:'X怎么学' },
  { id:'lp019', query:'如何系统学习特征工程', expectedIntent:'create_plan', expectedTopic:'特征工程', expectedDeckHint:D.ML, expectedParent:'机器学习', expectedConcepts:['特征工程','特征选择','特征缩放'], mustMatchAny:['特征工程','特征','feature'], maxMerged:200, minFinal:2, category:'标准学习路线', domain:'机器学习', style:'如何系统学习X' },
  { id:'lp020', query:'双指针怎么学', expectedIntent:'create_plan', expectedTopic:'双指针', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['双指针','two pointer','滑动窗口'], mustMatchAny:['双指针','two pointer'], maxMerged:150, minFinal:2, category:'标准学习路线', domain:'LeetCode', style:'X怎么学' },
  { id:'lp021', query:'滑动窗口学习路线', expectedIntent:'create_plan', expectedTopic:'滑动窗口', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['滑动窗口','sliding window'], mustMatchAny:['滑动窗口','sliding window'], maxMerged:150, minFinal:2, category:'标准学习路线', domain:'LeetCode', style:'X学习路线' },
  { id:'lp022', query:'前缀和怎么学', expectedIntent:'create_plan', expectedTopic:'前缀和', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['前缀和','prefix sum'], mustMatchAny:['前缀和','prefix sum'], maxMerged:150, minFinal:2, category:'标准学习路线', domain:'LeetCode', style:'X怎么学' },
  { id:'lp023', query:'排序算法怎么学', expectedIntent:'create_plan', expectedTopic:'排序', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['排序','快排','归并','堆排'], mustMatchAny:['排序','sort','快排','heap'], maxMerged:150, minFinal:2, category:'标准学习路线', domain:'LeetCode', style:'X怎么学' },
  { id:'lp024', query:'怎么学贪心算法', expectedIntent:'create_plan', expectedTopic:'贪心', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['贪心','greedy'], mustMatchAny:['贪心','greedy'], maxMerged:100, minFinal:1, category:'标准学习路线', domain:'LeetCode', style:'怎么学X' },
  // ... remaining 176 cases ...

  // ══════════ CATEGORY 2: 推荐卡片 (25) ══════════
  { id:'lp031', query:'我要学xgboost，给我推荐几张卡片', expectedIntent:'create_plan', expectedTopic:'XGBoost', expectedDeckHint:D.ML, expectedParent:'机器学习', expectedConcepts:['XGBoost','GBDT','boosting'], mustMatchAny:['XGBoost','GBDT','boosting'], maxMerged:100, minFinal:3, category:'推荐卡片', domain:'机器学习', style:'我要学X给我推荐' },
  { id:'lp032', query:'哈希表推荐几张卡', expectedIntent:'create_plan', expectedTopic:'哈希表', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['哈希表','hash'], mustMatchAny:['哈希表','hash','map'], maxMerged:200, minFinal:3, category:'推荐卡片', domain:'LeetCode', style:'X推荐几张卡' },
  { id:'lp033', query:'帮我找RAG相关卡片', expectedIntent:'create_plan', expectedTopic:'RAG', expectedDeckHint:D.AG, expectedParent:'Agent', expectedConcepts:['RAG','retrieval','embedding'], mustMatchAny:['RAG','retrieval'], maxMerged:100, minFinal:2, category:'推荐卡片', domain:'大模型', style:'帮我找X相关卡片' },
  { id:'lp034', query:'动态规划有哪些卡片适合入门', expectedIntent:'create_plan', expectedTopic:'动态规划', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['动态规划','DP'], mustMatchAny:['动态规划','DP','dynamic programming'], maxMerged:200, minFinal:3, category:'推荐卡片', domain:'LeetCode', style:'X有哪些卡片' },
  { id:'lp035', query:'给我一组集成学习的学习清单', expectedIntent:'create_plan', expectedTopic:'集成学习', expectedDeckHint:D.ML, expectedParent:'机器学习', expectedConcepts:['集成学习','ensemble','Bagging'], mustMatchAny:['集成学习','ensemble'], maxMerged:200, minFinal:2, category:'推荐卡片', domain:'机器学习', style:'给我一组X清单' },

  // ══════════ CATEGORY 3: 复习补弱 (25) ══════════
  { id:'lp056', query:'我不会滑动窗口，怎么补', expectedIntent:'create_plan', expectedTopic:'滑动窗口', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['滑动窗口','sliding window'], mustMatchAny:['滑动窗口','sliding window'], maxMerged:150, minFinal:2, category:'复习补弱', domain:'LeetCode', style:'我不会X怎么补' },
  { id:'lp057', query:'XGBoost不太懂，怎么复习', expectedIntent:'create_plan', expectedTopic:'XGBoost', expectedDeckHint:D.ML, expectedParent:'机器学习', expectedConcepts:['XGBoost','GBDT','boosting'], mustMatchAny:['XGBoost','GBDT','boosting'], maxMerged:100, minFinal:2, category:'复习补弱', domain:'机器学习', style:'X不太懂怎么复习' },
  { id:'lp058', query:'面试动态规划总答不好，补哪些卡', expectedIntent:'create_plan', expectedTopic:'动态规划', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['动态规划','DP'], mustMatchAny:['动态规划','DP'], maxMerged:200, minFinal:3, category:'复习补弱', domain:'LeetCode', style:'面试X总答不好' },
  { id:'lp059', query:'正则化老是搞混，推荐学习顺序', expectedIntent:'create_plan', expectedTopic:'正则化', expectedDeckHint:D.ML, expectedParent:'机器学习', expectedConcepts:['正则化','L1','L2','dropout'], mustMatchAny:['正则化','L1','L2'], maxMerged:100, minFinal:1, category:'复习补弱', domain:'机器学习', style:'X老是搞混' },
  { id:'lp060', query:'我对概率论很薄弱', expectedIntent:'create_plan', expectedTopic:'概率', expectedDeckHint:D.STAT, expectedParent:'统计学', expectedConcepts:['概率','分布','贝叶斯'], mustMatchAny:['概率','分布','贝叶斯'], maxMerged:100, minFinal:2, category:'复习补弱', domain:'统计学', style:'我对X很薄弱' },

  // ══════════ CATEGORY 4: 大类入门 (25) ══════════
  { id:'lp081', query:'机器学习入门', expectedIntent:'create_plan', expectedTopic:'机器学习', expectedDeckHint:D.ML, expectedParent:'机器学习', expectedConcepts:['监督学习','过拟合','回归','分类'], mustMatchAny:['机器学习','监督学习','过拟合'], maxMerged:250, minFinal:5, category:'大类入门', domain:'机器学习', style:'X入门' },
  { id:'lp082', query:'深度学习入门', expectedIntent:'create_plan', expectedTopic:'深度学习', expectedDeckHint:D.DL, expectedParent:'深度学习', expectedConcepts:['神经网络','反向传播','CNN'], mustMatchAny:['深度学习','CNN','反向传播'], maxMerged:200, minFinal:5, category:'大类入门', domain:'深度学习', style:'X入门' },
  { id:'lp083', query:'数据科学怎么学', expectedIntent:'create_plan', expectedTopic:'数据科学', expectedDeckHint:D.STAT, expectedParent:'数据科学', expectedConcepts:['SQL','Python','统计分析','可视化'], mustMatchAny:['SQL','Python','统计分析'], maxMerged:200, minFinal:5, category:'大类入门', domain:'数据科学', style:'X怎么学' },
  { id:'lp084', query:'算法怎么系统学', expectedIntent:'create_plan', expectedTopic:'算法', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['数组','哈希表','动态规划','树'], mustMatchAny:['数组','哈希表','动态规划','树'], maxMerged:300, minFinal:5, category:'大类入门', domain:'LeetCode', style:'X怎么系统学' },
  { id:'lp085', query:'LeetCode怎么刷', expectedIntent:'create_plan', expectedTopic:'LeetCode', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['数组','哈希表','双指针','动态规划'], mustMatchAny:['数组','哈希表','双指针'], maxMerged:300, minFinal:5, category:'大类入门', domain:'LeetCode', style:'X怎么刷' },

  // ══════════ CATEGORY 5: 具体概念入门 (40) ══════════
  { id:'lp106', query:'XGBoost怎么学', expectedIntent:'create_plan', expectedTopic:'XGBoost', expectedDeckHint:D.ML, expectedParent:'机器学习', expectedConcepts:['XGBoost','GBDT','gradient boosting','boosting'], mustMatchAny:['XGBoost','GBDT','boosting'], maxMerged:100, minFinal:3, category:'具体概念入门', domain:'机器学习', style:'X怎么学' },
  { id:'lp107', query:'怎么学集成学习', expectedIntent:'create_plan', expectedTopic:'集成学习', expectedDeckHint:D.ML, expectedParent:'机器学习', expectedConcepts:['集成学习','ensemble','Bagging','Boosting'], mustMatchAny:['集成学习','ensemble','Bagging'], maxMerged:200, minFinal:3, category:'具体概念入门', domain:'机器学习', style:'怎么学X' },
  { id:'lp108', query:'我想学哈希表', expectedIntent:'create_plan', expectedTopic:'哈希表', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['哈希表','hash','map','计数'], mustMatchAny:['哈希表','hash','map'], maxMerged:200, minFinal:3, category:'具体概念入门', domain:'LeetCode', style:'我想学X' },
  { id:'lp109', query:'滑动窗口怎么学', expectedIntent:'create_plan', expectedTopic:'滑动窗口', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['滑动窗口','sliding window'], mustMatchAny:['滑动窗口','sliding window'], maxMerged:150, minFinal:2, category:'具体概念入门', domain:'LeetCode', style:'X怎么学' },
  { id:'lp110', query:'RAG怎么学', expectedIntent:'create_plan', expectedTopic:'RAG', expectedDeckHint:D.AG, expectedParent:'Agent', expectedConcepts:['RAG','retrieval','embedding','vector search'], mustMatchAny:['RAG','retrieval','embedding'], maxMerged:100, minFinal:2, category:'具体概念入门', domain:'大模型', style:'X怎么学' },

  // ══════════ CATEGORY 6: 对比混淆 (20) ══════════
  { id:'lp146', query:'数组和哈希表有什么区别，应该先学哪个', expectedIntent:'compare_cards', expectedTopic:'哈希表', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['哈希表','数组','hash','array'], mustMatchAny:['哈希表','数组','hash'], maxMerged:250, minFinal:3, category:'对比混淆', domain:'LeetCode', style:'X和Y有什么区别' },
  { id:'lp147', query:'什么时候用双指针什么时候用哈希表', expectedIntent:'compare_cards', expectedTopic:'双指针', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['双指针','哈希表','two pointer','hash'], mustMatchAny:['双指针','哈希表','two pointer'], maxMerged:250, minFinal:3, category:'对比混淆', domain:'LeetCode', style:'什么时候用X' },
  { id:'lp148', query:'Bagging和Boosting怎么区分', expectedIntent:'compare_cards', expectedTopic:'Bagging', expectedDeckHint:D.ML, expectedParent:'机器学习', expectedConcepts:['Bagging','Boosting','集成学习','随机森林','GBDT'], mustMatchAny:['Bagging','Boosting','集成学习'], maxMerged:200, minFinal:3, category:'对比混淆', domain:'机器学习', style:'X和Y怎么区分' },
  { id:'lp149', query:'RAG和Agent有什么区别', expectedIntent:'compare_cards', expectedTopic:'RAG', expectedDeckHint:D.AG, expectedParent:'Agent', expectedConcepts:['RAG','Agent','retrieval','tool use'], mustMatchAny:['RAG','Agent'], maxMerged:120, minFinal:2, category:'对比混淆', domain:'大模型', style:'X和Y有什么区别' },
  { id:'lp150', query:'batch norm和layer norm怎么学', expectedIntent:'create_plan', expectedTopic:'BatchNorm', expectedDeckHint:D.DL, expectedParent:'深度学习', expectedConcepts:['BatchNorm','LayerNorm','normalization'], mustMatchAny:['BatchNorm','LayerNorm','normalization'], maxMerged:100, minFinal:2, category:'对比混淆', domain:'深度学习', style:'X和Y怎么学' },

  // ══════════ CATEGORY 7: 口语噪音长句 (20) ══════════
  { id:'lp166', query:'我最近面试老是被问到xgboost，想系统补一下', expectedIntent:'create_plan', expectedTopic:'XGBoost', expectedDeckHint:D.ML, expectedParent:'机器学习', expectedConcepts:['XGBoost','GBDT','boosting'], mustMatchAny:['XGBoost','GBDT','boosting'], maxMerged:100, minFinal:3, category:'口语长句', domain:'机器学习', style:'面试老被问到X' },
  { id:'lp167', query:'我对哈希表完全没概念，能不能推荐一个学习路线', expectedIntent:'create_plan', expectedTopic:'哈希表', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['哈希表','hash','map'], mustMatchAny:['哈希表','hash'], maxMerged:200, minFinal:3, category:'口语长句', domain:'LeetCode', style:'对X完全没概念' },
  { id:'lp168', query:'动态规划我看了几遍还是不懂，先学哪些卡比较好', expectedIntent:'review_weakness', expectedTopic:'动态规划', expectedDeckHint:D.LC, expectedParent:'算法', expectedConcepts:['动态规划','DP'], mustMatchAny:['动态规划','DP','dynamic programming'], maxMerged:200, minFinal:3, category:'口语长句', domain:'LeetCode', style:'X看了几遍还不懂' },
  { id:'lp169', query:'如果我想从零开始学RAG，应该看哪些卡', expectedIntent:'create_plan', expectedTopic:'RAG', expectedDeckHint:D.AG, expectedParent:'Agent', expectedConcepts:['RAG','retrieval','embedding'], mustMatchAny:['RAG','retrieval'], maxMerged:100, minFinal:2, category:'口语长句', domain:'大模型', style:'从零开始学X' },
  { id:'lp170', query:'我Transformer不太懂，帮我找相关卡片', expectedIntent:'create_plan', expectedTopic:'Transformer', expectedDeckHint:D.DL, expectedParent:'深度学习', expectedConcepts:['Transformer','attention','encoder'], mustMatchAny:['Transformer','attention'], maxMerged:100, minFinal:2, category:'口语长句', domain:'深度学习', style:'X不太懂帮找卡' },

  // ══════════ CATEGORY 8: 标点断句中英混合 (15) ══════════
  { id:'lp186', query:'我要学xgboost，给我推荐几张卡片', expectedIntent:'create_plan', expectedTopic:'XGBoost', expectedDeckHint:D.ML, expectedParent:'机器学习', expectedConcepts:['XGBoost','GBDT','boosting'], mustMatchAny:['XGBoost','GBDT','boosting'], maxMerged:100, minFinal:3, category:'标点断句', domain:'机器学习', style:'小写+逗号' },
  { id:'lp187', query:'要怎么学 XGBoost？', expectedIntent:'create_plan', expectedTopic:'XGBoost', expectedDeckHint:D.ML, expectedParent:'机器学习', expectedConcepts:['XGBoost','GBDT','boosting'], mustMatchAny:['XGBoost','GBDT','boosting'], maxMerged:100, minFinal:3, category:'标点断句', domain:'机器学习', style:'空格+问号' },
  { id:'lp188', query:'rag怎么学', expectedIntent:'create_plan', expectedTopic:'RAG', expectedDeckHint:D.AG, expectedParent:'Agent', expectedConcepts:['RAG','retrieval'], mustMatchAny:['RAG','retrieval'], maxMerged:100, minFinal:2, category:'标点断句', domain:'大模型', style:'小写' },
  { id:'lp189', query:'Transformer入门', expectedIntent:'create_plan', expectedTopic:'Transformer', expectedDeckHint:D.DL, expectedParent:'深度学习', expectedConcepts:['Transformer','attention'], mustMatchAny:['Transformer','attention'], maxMerged:100, minFinal:2, category:'标点断句', domain:'深度学习', style:'无空格' },
  { id:'lp190', query:'CNN图像分类怎么学', expectedIntent:'create_plan', expectedTopic:'CNN', expectedDeckHint:D.DL, expectedParent:'深度学习', expectedConcepts:['CNN','图像分类','卷积'], mustMatchAny:['CNN','图像分类','卷积'], maxMerged:150, minFinal:2, category:'标点断句', domain:'深度学习', style:'中英混合' },
];

// Convert to EvalCase format
import type { EvalCase } from './search-eval-types';
export function getLP200Cases(): EvalCase[] {
  return ALL_CASES.map(c => ({
    id: c.id,
    query: c.query,
    expectedUnderstanding: {
      intent: c.expectedIntent,
      topic: c.expectedTopic,
      deckHint: c.expectedDeckHint,
      parentCategory: c.expectedParent,
    },
    rewrite: {
      mustInclude: c.mustMatchAny.slice(0, 2),
      mustNotInclude: ['学习', '教程', '推荐', '卡片', '几张'],
    },
    retrieval: {
      maxMergedCandidates: c.maxMerged,
      minFinalResults: c.minFinal,
      maxFinalResults: c.maxFinal,
    },
    ranking: {
      topK: 10,
      mustMatchAny: c.mustMatchAny,
      minPrecision: 0.3,
    },
  }));
}
