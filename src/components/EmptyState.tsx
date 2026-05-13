// ============================================================
// src/components/EmptyState.tsx
// ============================================================

import { SearchX, FileUp, Plus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { importCSVToDeck, loadCustomDecks } from '../utils/customDecks';

interface EmptyStateProps {
  message?: string;
  onAddCard?: () => void;
}

export default function EmptyState({ message, onAddCard }: EmptyStateProps) {
  const { state, dispatch } = useAppContext();

  // 检测是否是自定义模块
  const customDecks = loadCustomDecks();
  const isCustom = customDecks.some((d) => d.id === state.category);

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
  };

  if (isCustom) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
        <div className="text-4xl mb-4">📦</div>
        <p className="text-lg mb-2 font-medium">空模块</p>
        <p className="text-sm mb-6">这个模块还没有卡片</p>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm cursor-pointer hover:bg-primary-hover transition-colors">
            <FileUp className="w-4 h-4" />
            导入 CSV
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>
          {onAddCard && (
            <button
              onClick={onAddCard}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加卡片
            </button>
          )}
        </div>
        <p className="text-xs mt-4 text-gray-400">CSV 格式：问题,答案,标签</p>
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
