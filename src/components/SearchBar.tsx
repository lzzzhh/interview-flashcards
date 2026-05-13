// ============================================================
// src/components/SearchBar.tsx — 支持全局搜索
// ============================================================

import { useRef, useCallback, useState } from 'react';
import { Search, Globe } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function SearchBar() {
  const { state, dispatch } = useAppContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [globalSearch, setGlobalSearch] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        dispatch({ type: 'SET_SEARCH', payload: value });
      }, 300);
    },
    [dispatch],
  );

  return (
    <div className="relative flex-1 flex gap-1">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder={globalSearch ? '搜索全部模块...' : '搜索当前模块...'}
          defaultValue={state.searchQuery}
          onChange={handleChange}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>
      <button
        onClick={() => setGlobalSearch(!globalSearch)}
        className={`px-2 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
          globalSearch 
            ? 'bg-primary/10 text-primary border border-primary/30' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
        }`}
        title={globalSearch ? '全局搜索中' : '当前模块'}
      >
        <Globe className="w-4 h-4" />
      </button>
    </div>
  );
}
