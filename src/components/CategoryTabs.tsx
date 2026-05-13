// ============================================================
// src/components/CategoryTabs.tsx
// ============================================================

import { useAppContext } from '../context/AppContext';
import { CATEGORIES } from '../constants';

export default function CategoryTabs() {
  const { state, dispatch, dueCountByCategory } = useAppContext();

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
                ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
              {due > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none
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
    </div>
  );
}
