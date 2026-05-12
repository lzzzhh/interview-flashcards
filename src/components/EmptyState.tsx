// ============================================================
// src/components/EmptyState.tsx
// ============================================================

import { SearchX } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  const { dispatch } = useAppContext();

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
