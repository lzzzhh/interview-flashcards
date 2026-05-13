// ============================================================
// src/components/HomePage.tsx — 首页模块选择
// ============================================================

import { useState } from 'react';
import { Plus, BookOpen, X, Trash2 } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { useAppContext } from '../context/AppContext';
import { loadCustomDecks, createCustomDeck, deleteCustomDeck, type CustomDeck } from '../utils/customDecks';
import StatsDashboard from './StatsDashboard';

const ICONS: Record<string, string> = {
  leetcode: '🔥',
  statistics: '📊',
  'machine-learning': '🤖',
  llm: '🧠',
  jargon: '💬',
  workplace: '👔',
};

interface Props {
  onEnterStudy: (category: string) => void;
}

export default function HomePage({ onEnterStudy }: Props) {
  const { dispatch, dueCountByCategory, totalNew, totalDue } = useAppContext();
  const [customDecks, setCustomDecks] = useState<CustomDeck[]>(() => loadCustomDecks());
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📦');

  const handleCreate = () => {
    if (!newName.trim()) return;
    createCustomDeck(newName.trim(), newIcon || '📦');
    setCustomDecks(loadCustomDecks());
    setShowCreate(false);
    setNewName('');
  };

  const handleDelete = (id: string) => {
    deleteCustomDeck(id);
    setCustomDecks(loadCustomDecks());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            📚 面经闪卡
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalNew + totalDue > 0 ? (
              <>到期复习 <span className="text-orange-500 font-medium">{totalDue}</span> · 可学新卡 <span className="text-blue-500 font-medium">{totalNew}</span></>
            ) : (
              '选择一个模块开始学习'
            )}
          </p>
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => {
            const due = dueCountByCategory[cat.key] ?? 0;
            return (
              <button
                key={cat.key}
                onClick={() => onEnterStudy(cat.key)}
                className="group relative flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:shadow-md transition-all active:scale-95"
              >
                <span className="text-3xl">{ICONS[cat.key] || '📚'}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.label}</span>
                {due > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white">
                    {due > 99 ? '99+' : due}
                  </span>
                )}
              </button>
            );
          })}

          {/* Custom decks */}
          {customDecks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => onEnterStudy(deck.id)}
              className="group relative flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:shadow-md transition-all active:scale-95"
            >
              <span className="text-3xl">{deck.icon || '📦'}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center">{deck.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(deck.id); }}
                className="absolute top-1 right-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/30 transition-opacity"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </button>
          ))}

          {/* + Create */}
          <button
            onClick={() => setShowCreate(true)}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-primary/30 hover:text-primary transition-colors"
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs">新建模块</span>
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex justify-center gap-3 mt-6">
          <button
            onClick={() => {}}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            全部复习
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_STATS' })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            📊 学习统计
          </button>
        </div>
      </div>

      {/* Create dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold dark:text-gray-100">新建模块</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">图标</label>
                <input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} maxLength={2}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 text-xl text-center" />
              </div>
              <div>
                <label className="text-xs text-gray-500">模块名称</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="例如：风控算法面试"
                  className="w-full mt-0.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()} autoFocus />
              </div>
              <button onClick={handleCreate} disabled={!newName.trim()}
                className="w-full py-2.5 rounded-xl bg-primary text-white font-medium disabled:opacity-30">
                创建模块
              </button>
            </div>
          </div>
        </div>
      )}

      <StatsDashboard />
    </div>
  );
}
