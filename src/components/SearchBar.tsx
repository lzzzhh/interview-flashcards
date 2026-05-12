// ============================================================
// src/components/SearchBar.tsx
// ============================================================

import { useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function SearchBar() {
  const { state, dispatch } = useAppContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Debounce 300ms
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        dispatch({ type: 'SET_SEARCH', payload: value });
      }, 300);
    },
    [dispatch],
  );

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        ref={inputRef}
        type="text"
        placeholder="搜索卡片...（按 / 聚焦）"
        defaultValue={state.searchQuery}
        onChange={handleChange}
        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
      />
    </div>
  );
}
