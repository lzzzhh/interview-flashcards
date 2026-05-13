// ============================================================
// src/App.tsx — 主组装组件（含复习模式流程）
// ============================================================

import { useRef, useCallback } from 'react';
import { BarChart3, FlaskConical, AlertCircle } from 'lucide-react';
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
  const { state, dispatch, filteredCards, currentCard, masteredIds, totalDue } = useAppContext();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const getCurrentCardId = useCallback(() => currentCard?.id ?? null, [currentCard]);

  useKeyboard({ dispatch, searchInputRef, getCurrentCardId });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-xl mx-auto px-3 sm:px-4 py-3 sm:py-8 space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              📚 面经闪卡
            </h1>
            {state.reviewMode && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white animate-fadeIn">
                复习中
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Review Mode Toggle */}
            <button
              onClick={() => dispatch({ type: 'TOGGLE_REVIEW_MODE' })}
              className={`relative p-2 rounded-lg transition-colors ${
                state.reviewMode
                  ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title={state.reviewMode ? '退出复习模式' : '复习到期卡片'}
            >
              <FlaskConical className="w-5 h-5" />
              {totalDue > 0 && !state.reviewMode && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {totalDue > 9 ? '!' : totalDue}
                </span>
              )}
            </button>
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

        {/* Review banner */}
        {!state.reviewMode && totalDue > 0 && (
          <button
            onClick={() => dispatch({ type: 'TOGGLE_REVIEW_MODE' })}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 text-sm text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">
              你有 <strong>{totalDue}</strong> 张卡片到期待复习
            </span>
            <span className="text-xs font-medium">开始复习 →</span>
          </button>
        )}

        {/* Review mode — simplified header */}
        {state.reviewMode && (
          <div className="text-center text-sm text-orange-600 dark:text-orange-400 font-medium">
            🔬 正在复习 {filteredCards.length} 张到期卡片
          </div>
        )}

        {/* Tabs (hidden in review mode) */}
        {!state.reviewMode && <CategoryTabs />}

        {/* Search + Filter (hidden in review mode) */}
        {!state.reviewMode && (
          <div className="flex gap-2">
            <SearchBar />
            <FilterBar />
          </div>
        )}

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
              state.reviewMode
                ? '🎉 没有到期卡片！所有卡片都在按计划复习中。'
                : state.searchQuery
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
