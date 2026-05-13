// ============================================================
// src/components/CategoryTabs.tsx — 支持自定义模块
// ============================================================

import { useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CATEGORIES } from '../constants';
import { loadCustomDecks, createCustomDeck, deleteCustomDeck, type CustomDeck } from '../utils/customDecks';

export default function CategoryTabs() {
  const { state, dispatch, dueCountByCategory } = useAppContext();
  const [customDecks, setCustomDecks] = useState<CustomDeck[]>(() => loadCustomDecks());
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📦');

  const handleCreate = () => {
    if (!newName.trim()) return;
    const deck = createCustomDeck(newName.trim(), newIcon || '📦');
    setCustomDecks(loadCustomDecks());
    setShowCreate(false);
    setNewName('');
    dispatch({ type: 'SET_CATEGORY', payload: deck.id as any });
  };

  const handleDelete = (id: string) => {
    deleteCustomDeck(id);
    setCustomDecks(loadCustomDecks());
    if (state.category === id) {
      dispatch({ type: 'SET_CATEGORY', payload: 'leetcode' });
    }
  };

  return (
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = state.category === cat.key;
          const due = dueCountByCategory[cat.key] ?? 0;
          return (
            <button
              key={cat.key}
              onClick={() => dispatch({ type: 'SET_CATEGORY', payload: cat.key })}
              className={`relative flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors snap-start flex-shrink-0
                ${isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
              {due > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${isActive ? 'bg-white/30 text-white' : 'bg-orange-500 text-white'}`}>
                  {due > 99 ? '99+' : due}
                </span>
              )}
            </button>
          );
        })}

        {/* Custom decks */}
        {customDecks.map((deck) => {
          const isActive = state.category === deck.id;
          return (
            <button
              key={deck.id}
              onClick={() => dispatch({ type: 'SET_CATEGORY', payload: deck.id as any })}
              className={`relative group flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors snap-start flex-shrink-0
                ${isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
            >
              <span>{deck.icon || '📦'}</span>
              <span>{deck.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(deck.id); }}
                className={`ml-0.5 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-white/70 hover:text-white' : 'text-red-400'}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </button>
          );
        })}

        {/* + Create button */}
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-[13px] font-medium bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700 transition-colors snap-start flex-shrink-0 border border-dashed border-gray-300 dark:border-gray-600"
        >
          <Plus className="w-4 h-4" />
          <span>新建模块</span>
        </button>
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
                <label className="text-xs text-gray-500">图标（emoji）</label>
                <input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} maxLength={2}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 text-xl text-center" />
              </div>
              <div>
                <label className="text-xs text-gray-500">模块名称 *</label>
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
    </div>
  );
}
