// ============================================================
// src/components/EmptyState.tsx
// ============================================================

import { useState } from 'react';
import { SearchX, FileUp, Plus, ClipboardPaste } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { importCSVToDeck, addCardToDeck, loadCustomDecks } from '../utils/customDecks';
import type { QACard } from '../types';

interface EmptyStateProps {
  message?: string;
  onAddCard?: () => void;
}

export default function EmptyState({ message, onAddCard }: EmptyStateProps) {
  const { state, dispatch } = useAppContext();
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const customDecks = loadCustomDecks();
  const isCustom = customDecks.some((d) => d.id === state.category);

  const handlePasteImport = () => {
    if (!pasteText.trim()) return;
    // 解析格式：Q: ... / A: ... 或直接 问题行 / 答案行（空行分隔）
    const blocks = pasteText.split(/\n\n+/).filter((b) => b.trim());
    let count = 0;
    
    for (const block of blocks) {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        // 尝试 Q:/A: 格式
        const qLine = lines.find((l) => l.startsWith('Q:') || l.startsWith('问：'));
        const aLine = lines.find((l) => l.startsWith('A:') || l.startsWith('答：'));
        if (qLine && aLine) {
          const card: QACard = {
            id: `paste-${Date.now()}-${count}`,
            category: state.category as any,
            question: qLine.replace(/^(Q:|问：)\s*/, ''),
            answer: aLine.replace(/^(A:|答：)\s*/, ''),
            sm2: { state: 'new', easeFactor: 2.5, interval: 0, repetitions: 0, lapses: 0, nextReview: Date.now() },
            favorited: false,
          };
          addCardToDeck(state.category as string, card);
          count++;
        }
        continue;
      }
      // 格式：第一行=问题，其余行=答案
      const card: QACard = {
        id: `paste-${Date.now()}-${count}`,
        category: state.category as any,
        question: lines[0],
        answer: lines.slice(1).join('\n'),
        sm2: { state: 'new', easeFactor: 2.5, interval: 0, repetitions: 0, lapses: 0, nextReview: Date.now() },
        favorited: false,
      };
      addCardToDeck(state.category as string, card);
      count++;
    }
    
    setPasteText('');
    setShowPaste(false);
    if (count > 0) {
      dispatch({ type: 'SET_CATEGORY', payload: state.category });
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const count = importCSVToDeck(state.category as string, text);
      if (count > 0) {
        dispatch({ type: 'SET_CATEGORY', payload: state.category });
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  if (isCustom) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
        <div className="text-4xl mb-4">📦</div>
        <p className="text-lg mb-2 font-medium">空模块</p>
        <p className="text-sm mb-6">这个模块还没有卡片</p>

        {showPaste ? (
          <div className="w-full max-w-md space-y-3">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`直接粘贴卡片内容，每张卡片用空行分隔：\n\n什么是过拟合？\n模型在训练集表现好但测试集差...\n\n什么是AUC？\nAUC衡量模型区分正负样本的能力...\n\n或使用 Q: A: 格式：\nQ: 什么是过拟合？\nA: 模型在训练集表现好但测试集差...`}
              rows={10}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 text-sm resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={handlePasteImport} disabled={!pasteText.trim()}
                className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-30">
                导入 {pasteText.trim() ? `(${pasteText.split(/\n\n+/).filter(b=>b.trim()).length} 张)` : ''}
              </button>
              <button onClick={() => setShowPaste(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm">
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => setShowPaste(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              <ClipboardPaste className="w-4 h-4" />
              粘贴导入
            </button>
            <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer">
              <FileUp className="w-4 h-4" />
              上传 CSV
              <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
            </label>
            {onAddCard && (
              <button
                onClick={onAddCard}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                逐张添加
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
      <SearchX className="w-16 h-16 mb-4" />
      <p className="text-lg mb-4">{message ?? '没有匹配的卡片'}</p>
      <button
        onClick={() => {
          dispatch({ type: 'SET_SEARCH', payload: '' });
          dispatch({ type: 'SET_FILTER_DIFFICULTY', payload: 'all' });
          dispatch({ type: 'SET_FILTER_SUBTOPIC', payload: 'all' });
        }}
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm"
      >
        重置筛选
      </button>
    </div>
  );
}
