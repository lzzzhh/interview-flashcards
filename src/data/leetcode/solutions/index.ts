// ============================================================
// LeetCode 多语言题解索引
// 按 cardId 从各语言文件中聚合代码
// ============================================================

import { cppSolutions } from './cpp';
import { goSolutions } from './go';
import { javaSolutions } from './java';
import { javascriptSolutions } from './javascript';
import { pythonSolutions } from './python';

/** 所有可用语言列表 */
export const LEETCODE_LANGUAGES: string[] = ['cpp', 'go', 'java', 'javascript', 'python'];

/** 语言名 -> 对应解决方案字典 */
const SOLUTION_MAPS: Record<string, Record<string, string>> = {
  cpp: cppSolutions,
  go: goSolutions,
  java: javaSolutions,
  javascript: javascriptSolutions,
  python: pythonSolutions
};

/**
 * 获取某张卡在所有语言下的代码
 * @returns { python: 'def twoSum...', java: 'class Solution...', ... }
 */
export function getCardSolutions(cardId: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const lang of LEETCODE_LANGUAGES) {
    const code = SOLUTION_MAPS[lang]?.[cardId];
    if (code !== undefined) result[lang] = code;
  }
  return result;
}

/**
 * 获取某张卡在指定语言下的代码
 */
export function getCardCode(cardId: string, language: string): string | undefined {
  return SOLUTION_MAPS[language]?.[cardId];
}

/**
 * 获取所有有题解的 cardId 列表
 */
export function getAllSolvedCardIds(): string[] {
  const ids = new Set<string>();
  for (const lang of LEETCODE_LANGUAGES) {
    for (const id of Object.keys(SOLUTION_MAPS[lang] || {})) {
      ids.add(id);
    }
  }
  return [...ids].sort();
}
