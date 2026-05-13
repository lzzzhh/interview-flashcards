// ============================================================
// src/components/CategoryTabs.tsx
// ============================================================

import { useAppContext } from '../context/AppContext';
import { CATEGORIES } from '../constants';

export default function CategoryTabs() {
  const { state, dispatch, dueCountByCategory } = useAppContext();

  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = state.category === cat.key;
        const due = dueCountByCategory[cat.key] ?? 0;
        return (
          <button
            key={cat.key}
            onClick={() => dispatch({ type: 'SET_CATEGORY', payload: cat.key })}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
              ${
                isActive
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{cat.label}</span>
            {due > 0 && (
              <span
                className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none
                  ${isActive
                    ? 'bg-white/30 text-white'
                    : 'bg-orange-500 text-white'
                  }`}
              >
                {due > 99 ? '99+' : due}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
