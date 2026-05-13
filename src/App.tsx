// ============================================================
// src/App.tsx — 首页 + 沉浸学习模式
// ============================================================

import { useRef, useCallback, useState, useMemo } from 'react';
import { ArrowLeft, FlaskConical, X } from 'lucide-react';
import { AppProvider, useAppContext } from './context/AppContext';
import { useKeyboard } from './hooks/useKeyboard';
import HomePage from './components/HomePage';
import CardView from './components/CardView';
import CardActions from './components/CardActions';
import ProgressBar from './components/ProgressBar';
import DarkModeToggle from './components/DarkModeToggle';
import EmptyState from './components/EmptyState';
import CardBrowser from './components/CardBrowser';
import CardEditor from './components/CardEditor';
import type { FlashCard } from './types';

function StudyPage({ onBack }: { onBack: () => void }) {
  const { state, dispatch, visibleCards, currentCard, masteredIds, totalDue, totalNew } = useAppContext();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showBrowser, setShowBrowser] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashCard | null>(null);

  const getCurrentCardId = useCallback(() => currentCard?.id ?? null, [currentCard]);
  useKeyboard({ dispatch, searchInputRef, getCurrentCardId });

  const cardCount = visibleCards.length;

  // Count new cards in current module
  const moduleNewCount = useMemo(() => {
    return Object.values(state.cardsById).filter((c) => !c.sm2.state || c.sm2.state === 'new').length;
  }, [state.cardsById]);

  // Choice screen
  if (state.studyMode === 'choose') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-xs space-y-4">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6">
            <ArrowLeft className="w-4 h-4" /> 返回首页
          </button>

          <h2 className="text-xl font-bold text-center text-gray-900 dark:text-gray-100">开始学习</h2>

          <button
            onClick={() => dispatch({ type: 'SET_STUDY_MODE', payload: 'new' })}
            className="w-full flex flex-col items-center gap-2 p-5 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            <span className="text-3xl">🆕</span>
            <span className="text-base font-bold text-blue-700 dark:text-blue-300">学习新卡</span>
            <span className="text-xs text-blue-500">今日上限 {state.dailyNewLimit} 张 · 剩余 {moduleNewCount} 张</span>
          </button>

          <button
            onClick={() => dispatch({ type: 'SET_STUDY_MODE', payload: 'review' })}
            className="w-full flex flex-col items-center gap-2 p-5 rounded-2xl bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
          >
            <span className="text-3xl">🔄</span>
            <span className="text-base font-bold text-orange-700 dark:text-orange-300">开始复习</span>
            <span className="text-xs text-orange-500">{totalDue} 张卡片到期</span>
          </button>

          <button onClick={() => setShowBrowser(true)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            📝 管理卡片
          </button>
        </div>
        {showBrowser && (
          <CardBrowser onEdit={(card) => { if (!card.id) setEditingCard(null); else setEditingCard(card); }} onClose={() => setShowBrowser(false)} />
        )}
        {editingCard !== null && (
          <CardEditor card={editingCard} onSave={() => { setEditingCard(null); dispatch({ type: 'SET_CATEGORY', payload: state.category }); }} onClose={() => setEditingCard(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-xl mx-auto px-3 sm:px-4 py-3 space-y-3">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button onClick={() => dispatch({ type: 'SET_STUDY_MODE', payload: 'choose' })} className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>

          <div className="flex items-center gap-1">
            {state.reviewMode && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white">复习中</span>
            )}
            <button onClick={() => setShowBrowser(true)} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="卡片管理">
              <X className="w-4 h-4 rotate-45 text-gray-500" />
            </button>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_REVIEW_MODE' })}
              className={`relative p-1.5 rounded-lg transition-colors ${
                state.reviewMode ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              {totalDue > 0 && !state.reviewMode && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-orange-500 text-white text-[8px] font-bold flex items-center justify-center">
                  {totalDue > 9 ? '!' : totalDue}
                </span>
              )}
            </button>
            <DarkModeToggle />
          </div>
        </div>

        {/* Review banner */}
        {state.studyMode === 'review' && totalDue === 0 && (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            🎉 没有到期卡片！
            <button onClick={() => dispatch({ type: 'SET_STUDY_MODE', payload: 'choose' })} className="ml-2 text-primary underline">返回</button>
          </div>
        )}
        {state.studyMode === 'new' && totalNew === 0 && (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            🎉 所有卡片都已学过！
            <button onClick={() => dispatch({ type: 'SET_STUDY_MODE', payload: 'choose' })} className="ml-2 text-primary underline">返回</button>
          </div>
        )}

        {/* Study mode bar (always shown after choose screen) */}
        <div className="sticky top-0 z-20 -mx-3 sm:-mx-4 px-3 sm:px-4 py-2 bg-orange-50 dark:bg-orange-900/30 border-b border-orange-200 dark:border-orange-800 flex items-center gap-2">
            <span className="text-xs text-orange-600 dark:text-orange-400">
              {state.studyMode === 'review' ? '🔄' : '🆕'} {state.studyMode === 'review' ? '复习' : '新学'} · {state.currentVisibleIndex + 1}/{Math.max(cardCount, 1)}
            </span>
          </div>

        {/* Tabs hidden */}

        {/* Card */}
        {currentCard ? (
          <div className="space-y-4" key={currentCard.id}>
            <CardView card={currentCard} showApproach={state.showApproach} showCode={state.showCode} />
            <CardActions />
          </div>
        ) : (
          <EmptyState message={state.reviewMode ? '🎉 没有到期卡片！' : state.searchQuery ? `未找到「${state.searchQuery}」` : undefined} />
        )}

        {cardCount > 0 && (
          <div className="pt-2 pb-8">
            <ProgressBar current={Math.min(state.currentVisibleIndex, cardCount - 1)} total={cardCount} mastered={masteredIds.length} />
          </div>
        )}
      </div>

      {/* Browser */}
      {showBrowser && (
        <CardBrowser onEdit={(card) => { if (!card.id) setEditingCard(null); else setEditingCard(card); }} onClose={() => setShowBrowser(false)} />
      )}
      {editingCard !== null && (
        <CardEditor card={editingCard} onSave={() => { setEditingCard(null); dispatch({ type: 'SET_CATEGORY', payload: state.category }); }} onClose={() => setEditingCard(null)} />
      )}
    </div>
  );
}

function AppInner() {
  const [studyCategory, setStudyCategory] = useState<string | null>(null);
  const { dispatch } = useAppContext();

  const handleEnterStudy = (category: string) => {
    dispatch({ type: 'SET_CATEGORY', payload: category as any });
    setStudyCategory(category);
  };

  if (studyCategory) {
    return <StudyPage onBack={() => setStudyCategory(null)} />;
  }

  return <HomePage onEnterStudy={handleEnterStudy} />;
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
