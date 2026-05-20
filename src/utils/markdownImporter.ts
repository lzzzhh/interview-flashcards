// src/utils/markdownImporter.ts — Markdown 格式卡片导入解析器
import type { ExportCard } from '../types';
import { createDefaultSM2 } from './sm2';

/**
 * 解析 Markdown 格式为 ExportCard 数组。
 * 支持格式：
 *   # Deck名称 (第一层标题为 deck)
 *   ## 问题标题 (第二层标题为问题)
 *   答案正文（支持多行）
 *   Tags: tag1, tag2
 *   Source: 来源
 *   Difficulty: easy|medium|hard
 */
export function parseMarkdownCards(mdText: string, defaultDeck: string = 'statistics'): ExportCard[] {
  const cards: ExportCard[] = [];
  let currentDeck = defaultDeck;
  let i = 0;
  const lines = mdText.split('\n');

  while (i < lines.length) {
    const line = lines[i].trim();

    // # Deck name
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      currentDeck = line.slice(2).trim() || defaultDeck;
      i++;
      continue;
    }

    // ## Question
    if (line.startsWith('## ')) {
      const question = line.slice(3).trim();
      let answer = '';
      let tags: string[] = [];
      let source = '';
      let difficulty: ExportCard['difficulty'] = '';

      i++;
      // Collect answer text until next heading or end
      while (i < lines.length) {
        const nextLine = lines[i].trim();
        if (nextLine.startsWith('#') || nextLine === '---') break;

        if (nextLine.toLowerCase().startsWith('tags:')) {
          tags = nextLine.slice(5).split(/[,;]/).map(t => t.trim()).filter(Boolean);
        } else if (nextLine.toLowerCase().startsWith('source:')) {
          source = nextLine.slice(7).trim();
        } else if (nextLine.toLowerCase().startsWith('difficulty:')) {
          const d = nextLine.slice(11).trim().toLowerCase();
          if (['easy', 'medium', 'hard'].includes(d)) difficulty = d as 'easy' | 'medium' | 'hard';
        } else if (nextLine) {
          answer += (answer ? '\n' : '') + nextLine;
        }
        i++;
      }

      if (question && answer) {
        cards.push({
          id: `md-${Date.now()}-${cards.length}`,
          category: currentDeck,
          question,
          answer,
          tags,
          subTopic: currentDeck,
          source: source || 'Markdown 导入',
          difficulty: difficulty || 'medium' as const,
          sm2: createDefaultSM2(),
          favorited: false,
        });
      }
      continue;
    }

    i++;
  }

  return cards;
}
