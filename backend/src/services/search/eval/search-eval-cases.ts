// backend/src/services/search/eval/search-eval-cases.ts
import { EvalCase } from './search-eval-types';

const CASES: EvalCase[] = [
  {
    id: 'ml-xgboost-study-simple',
    query: '我要学xgboost',
    expectedUnderstanding: { intent: 'study', topic: 'XGBoost', deckHint: 'machine-learning', parentCategory: '机器学习' },
    rewrite: { mustInclude: ['XGBoost', 'GBDT', 'boosting'], mustNotInclude: ['学习', '教程', '推荐', '卡片', '知识点', '总结'] },
    retrieval: { maxMergedCandidates: 150, minFinalResults: 1, maxFinalResults: 60 },
    ranking: { topK: 10, mustMatchAny: ['XGBoost', 'GBDT', 'boosting', 'gradient boosting'], minPrecision: 0.5 },
  },
  {
    id: 'ml-xgboost-study-suffix',
    query: '要怎么学xgboost',
    expectedUnderstanding: { intent: 'study', topic: 'XGBoost', deckHint: 'machine-learning', parentCategory: '机器学习' },
    rewrite: { mustInclude: ['XGBoost', 'GBDT'], mustNotInclude: ['学习', '教程'] },
    retrieval: { maxMergedCandidates: 150, minFinalResults: 1 },
    ranking: { topK: 10, mustMatchAny: ['XGBoost', 'GBDT', 'boosting'], minPrecision: 0.3 },
  },
  {
    id: 'ml-xgboost-study-recommend-cards',
    query: '我要学xgboost，给我推荐几张卡片',
    expectedUnderstanding: { intent: 'study', topic: 'XGBoost', deckHint: 'machine-learning', parentCategory: '机器学习' },
    rewrite: { mustInclude: ['XGBoost', 'GBDT'], mustNotInclude: ['学习', '推荐', '卡片', '几张'] },
    retrieval: { maxMergedCandidates: 150, minFinalResults: 1 },
    ranking: { topK: 10, mustMatchAny: ['XGBoost', 'GBDT', 'boosting'], minPrecision: 0.3 },
  },
  {
    id: 'ml-ensemble-study',
    query: '怎么学集成学习',
    expectedUnderstanding: { intent: 'study', topic: '集成学习', deckHint: 'machine-learning', parentCategory: '机器学习' },
    rewrite: { mustInclude: ['集成学习', 'ensemble', 'Bagging'], mustNotInclude: ['教程', '机器学习', '特征工程', '降维'] },
    retrieval: { maxMergedCandidates: 350, minFinalResults: 1 },
    ranking: { topK: 10, mustMatchAny: ['集成学习', 'ensemble', 'Bagging'], minPrecision: 0.3 },
  },
  {
    id: 'lc-array-study',
    query: '我想学数组',
    expectedUnderstanding: { intent: 'study', topic: '数组', deckHint: 'leetcode', parentCategory: '算法' },
    rewrite: { mustInclude: ['数组', 'array'], mustNotInclude: ['学习'] },
    retrieval: { maxMergedCandidates: 300, minFinalResults: 1 },
    ranking: { topK: 10, mustMatchAny: ['array', '数组'], minPrecision: 0.1 },
  },
  {
    id: 'lc-hash-study',
    query: '我想学哈希表',
    expectedUnderstanding: { intent: 'study', topic: '哈希表', deckHint: 'leetcode', parentCategory: '算法' },
    rewrite: { mustInclude: ['哈希表', 'hash'], mustNotInclude: ['学习'] },
    retrieval: { maxMergedCandidates: 300, minFinalResults: 1 },
    ranking: { topK: 10, mustMatchAny: ['hash', '哈希表'], minPrecision: 0.1 },
  },
  {
    id: 'lc-dp-review',
    query: '复习动态规划',
    expectedUnderstanding: { intent: 'review', topic: '动态规划', deckHint: 'leetcode', parentCategory: '算法' },
    rewrite: { mustInclude: ['动态规划', 'DP'], mustNotInclude: ['学习'] },
    retrieval: { maxMergedCandidates: 200, minFinalResults: 0 },
    ranking: { topK: 10, mustMatchAny: ['dynamic', 'DP', '动态'], minPrecision: 0.1 },
  },
  {
    id: 'agent-rag-study',
    query: 'RAG怎么学',
    expectedUnderstanding: { intent: 'study', topic: 'RAG', deckHint: 'agent', parentCategory: 'Agent' },
    rewrite: { mustInclude: ['RAG', 'retrieval'], mustNotInclude: ['学习'] },
    retrieval: { maxMergedCandidates: 150, minFinalResults: 1 },
    ranking: { topK: 10, mustMatchAny: ['RAG', 'retrieval', 'embedding'], minPrecision: 0.3 },
  },
];

export function getEvalCases(): EvalCase[] { return CASES; }
