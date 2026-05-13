// ============================================================
// src/components/CardEditor.tsx — 卡片编辑器（新建/编辑）
// ============================================================

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { FlashCard, QACard, Difficulty } from '../types';

interface Props {
  card?: FlashCard | null;
  onSave: (card: FlashCard) => void;
  onClose: () => void;
}

export default function CardEditor({ card, onSave, onClose }: Props) {
  const isNew = !card?.id;
  const [question, setQuestion] = useState(card?.category !== 'leetcode' ? (card as QACard)?.question || '' : '');
  const [answer, setAnswer] = useState(card?.category !== 'leetcode' ? (card as QACard)?.answer || '' : '');
  const [tags, setTags] = useState((card?.tags || []).join(', '));
  const [subTopic, setSubTopic] = useState((card as QACard)?.subTopic || '');
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    if (card?.category === 'leetcode') return card.difficulty;
    return (card as QACard)?.difficulty || 'medium';
  });
  const [category, setCategory] = useState<string>(card?.category || 'machine-learning');

  const handleSave = () => {
    const newCard: QACard = {
      id: card?.id || `custom-${Date.now()}`,
      category: category as QACard['category'],
      question: question.trim(),
      answer: answer.trim(),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      subTopic: subTopic.trim() || undefined,
      difficulty: difficulty,
      sm2: card?.sm2 || { state: 'new', easeFactor: 2.5, interval: 0, repetitions: 0, lapses: 0, nextReview: Date.now() },
      favorited: card?.favorited || false,
    };
    onSave(newCard);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{isNew ? '新建卡片' : '编辑卡片'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Category */}
          <div>
            <label className="text-xs text-gray-500">分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full mt-0.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            >
              <option value="statistics">统计学</option>
              <option value="machine-learning">机器学习</option>
              <option value="llm">大模型</option>
              <option value="jargon">行业黑话</option>
              <option value="workplace">职场话术</option>
            </select>
          </div>

          {/* Question */}
          <div>
            <label className="text-xs text-gray-500">问题</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="w-full mt-0.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm resize-none"
              placeholder="输入问题..."
            />
          </div>

          {/* Answer */}
          <div>
            <label className="text-xs text-gray-500">答案（支持 Markdown + LaTeX）</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={8}
              className="w-full mt-0.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm resize-none font-mono"
              placeholder={`输入答案...\n\n公式用 $...$ 或 $$...$$\n支持 Markdown 排版`}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs text-gray-500">标签（逗号分隔）</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full mt-0.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              placeholder="ml, supervised, xgboost"
            />
          </div>

          {/* Subtopic + Difficulty */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500">子主题</label>
              <input
                value={subTopic}
                onChange={(e) => setSubTopic(e.target.value)}
                className="w-full mt-0.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                placeholder="监督学习"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">难度</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full mt-0.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!question.trim() || !answer.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white font-medium disabled:opacity-30"
          >
            <Save className="w-4 h-4" />
            {isNew ? '创建卡片' : '保存修改'}
          </button>
        </div>
      </div>
    </div>
  );
}
