// ============================================================
// src/App.tsx — 主组装组件
// ============================================================

import { useRef, useCallback } from 'react';
import { BarChart3 } from 'lucide-react';
import { AppProvider, useAppContext } from './context/AppContext';
import { useKeyboard } from './hooks/useKeyboard';
import CategoryTabs from './components/CategoryTabs';
import SearchBar from './components/SearchBar';
import FilterBar from './components/FilterBar';
import CardView from './components/CardView';
import CardActions from './components/CardActions';
import ProgressBar from './components/ProgressBar';
import DarkModeToggle from './components/DarkModeToggle';
import EmptyState from './components/EmptyState';
import StatsDashboard from './components/StatsDashboard';

function AppInner() {
  const { state, dispatch, filteredCards, currentCard, masteredIds } = useAppContext();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const getCurrentCardId = useCallback(() => currentCard?.id ?? null, [currentCard]);

  useKeyboard({ dispatch, searchInputRef, getCurrentCardId });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-xl mx-auto px-4 py-4 sm:py-8 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            📚 面经闪卡
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => dispatch({ type: 'TOGGLE_STATS' })}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="学习统计"
            >
              <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <DarkModeToggle />
          </div>
        </div>

        {/* Tabs */}
        <CategoryTabs />

        {/* Search + Filter */}
        <div className="flex gap-2">
          <SearchBar />
          <FilterBar />
        </div>

        {/* Card View */}
        {filteredCards.length > 0 && currentCard ? (
          <div className="space-y-4" key={currentCard.id}>
            <CardView
              card={currentCard}
              showApproach={state.showApproach}
              showCode={state.showCode}
            />
            <CardActions />
          </div>
        ) : (
          <EmptyState
            message={
              state.searchQuery
                ? `未找到与「${state.searchQuery}」相关的卡片`
                : undefined
            }
          />
        )}

        {/* Progress */}
        {filteredCards.length > 0 && (
          <div className="pt-2 pb-8">
            <ProgressBar
              current={Math.min(state.currentIndex, filteredCards.length - 1)}
              total={filteredCards.length}
              mastered={masteredIds.length}
            />
          </div>
        )}
      </div>

      {/* Stats Dashboard (overlay) */}
      <StatsDashboard />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
