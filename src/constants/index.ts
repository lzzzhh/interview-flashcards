// ============================================================
// src/constants/index.ts — UI 常量
// ============================================================

import type { Category, Difficulty } from '../types';
import {
  Flame,
  BarChart3,
  Bot,
  Brain,
  MessageSquare,
  Briefcase,
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
  { key: 'llm', label: '大模型', icon: Brain },
  { key: 'jargon', label: '黑话', icon: MessageSquare },
  { key: 'workplace', label: '职场', icon: Briefcase },
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
  llm: [
    { value: 'all', label: '全部' },
    { value: 'Transformer', label: 'Transformer' },
    { value: '训练微调', label: '训练微调' },
    { value: '推理部署', label: '推理部署' },
    { value: 'Agent', label: 'Agent' },
    { value: 'RAG', label: 'RAG' },
    { value: '评估安全', label: '评估安全' },
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
};

export const SM2_LABELS = [
  { value: 0, label: '❌ 忘了', short: '忘了' },
  { value: 1, label: '🤔 困难', short: '困难' },
  { value: 2, label: '🤨 模糊', short: '模糊' },
  { value: 3, label: '✅ 记得', short: '记得' },
  { value: 4, label: '💪 轻松', short: '轻松' },
  { value: 5, label: '🧠 秒答', short: '秒答' },
] as const;
