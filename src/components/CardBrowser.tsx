// ============================================================
// src/components/CardBrowser.tsx — 卡片列表浏览器
// ============================================================

import { useState, useMemo } from 'react';
import { Search, Trash2, Edit3, X, Plus, Download } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { FlashCard } from '../types';

interface Props {
  onEdit: (card: FlashCard) => void;
  onClose: () => void;
}

export default function CardBrowser({ onEdit, onClose }: Props) {
  const { state, dispatch } = useAppContext();
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const allCards = useMemo(() => Object.values(state.cardsById), [state.cardsById]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allCards;
    const q = search.toLowerCase();
    return allCards.filter((c) => {
      if (c.category === 'leetcode') {
        return c.title.toLowerCase().includes(q) || c.titleCn.includes(q) || String(c.number).includes(q);
      }
      return c.question.includes(q) || c.answer.includes(q);
    });
  }, [allCards, search]);

  const handleDelete = (id: string) => {
    const newCards = { ...state.cardsById };
    delete newCards[id];
    // Also remove from localStorage
    dispatch({ type: 'SET_CATEGORY', payload: state.category }); // trigger reload
    setConfirmDelete(null);
  };

  const handleExportCSV = () => {
    const headers = 'id,type,question,answer,tags,subTopic,difficulty';
    const rows = filtered.map((c) => {
      const q = c.category === 'leetcode' ? c.titleCn : c.question;
      const a = c.category === 'leetcode' ? c.approach : c.answer;
      const tags = (c.tags || []).join(';');
      const sub = (c as any).subTopic || '';
      const diff = c.category === 'leetcode' ? c.difficulty : ((c as any).difficulty || '');
      return [c.id, c.category, q, a, tags, sub, diff]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',');
    });
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcards-${state.category}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-40 bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold flex-1">卡片管理</h2>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm"
          title="导出 CSV"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">导出CSV</span>
        </button>
        <button
          onClick={() => onEdit({} as FlashCard)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">新建</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索卡片..."
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">{filtered.length} 张卡片</p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-20">
        {filtered.map((card) => (
          <div
            key={card.id}
            className="flex items-start gap-2 py-2.5 border-b border-gray-100 dark:border-gray-800"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {card.category === 'leetcode' ? `#${card.number} ${card.titleCn}` : card.question}
              </p>
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {(card.tags || []).slice(0, 3).join(' · ')}
                {card.category === 'leetcode' && ` · ${card.difficulty}`}
              </p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => onEdit(card)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <Edit3 className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {confirmDelete === card.id ? (
                <button
                  onClick={() => handleDelete(card.id)}
                  className="p-1.5 bg-red-500 text-white rounded text-xs font-bold"
                >
                  确认
                </button>
              ) : (
                <button
                  onClick={() => setConfirmDelete(card.id)}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
