import { useRef, useCallback, useState, useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
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
import SubModulePicker from './components/SubModulePicker';
import DeckPage from './components/DeckPage';
import StatsPage from './components/StatsPage';
import type { Category, FlashCard } from './types';

function StudyPage({ onBack }: { onBack: () => void }) {
  const { state, dispatch, currentCard, totalNew, dueCountByCategory } = useAppContext();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showBrowser, setShowBrowser] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashCard | null>(null);

  const getCurrentCardId = useCallback(() => currentCard?.id ?? null, [currentCard]);
  useKeyboard({ dispatch, searchInputRef, getCurrentCardId });

  const cardCount = state.visibleCardIds.length;

  // 复习完毕自动返回首页
  useEffect(() => {
    if (state.studyMode === 'review' && (dueCountByCategory[state.category] ?? 0) === 0) {
      onBack();
    }
  }, [state.studyMode, state.category, dueCountByCategory, onBack]);

  if (state.studyMode === 'choose') {
    return <SubModulePicker onBack={onBack} />;
  }

  return (
    <div className="light-bg dark-bg h-dvh flex flex-col overflow-hidden text-gray-900 dark:text-gray-100 transition-colors">
      <div className="relative z-10 max-w-md mx-auto w-full px-3 sm:px-4 flex flex-col flex-1 min-h-0">

        {/* Top bar — fixed height */}
        <div className="shrink-0 py-3 flex items-center justify-between">
          <button onClick={() => dispatch({ type: 'SET_STUDY_MODE', payload: 'choose' })} className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm">
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setShowBrowser(true)} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700" title="卡片管理">
              <X className="w-4 h-4 rotate-45 text-gray-500 dark:text-gray-400" />
            </button>
            <DarkModeToggle />
          </div>
        </div>

        {/* Status messages */}
        {state.studyMode === 'new' && totalNew === 0 && (
          <div className="shrink-0 text-center py-8 text-gray-400">🎉 所有卡片都已学过！<button onClick={() => dispatch({ type: 'SET_STUDY_MODE', payload: 'choose' })} className="ml-2 text-primary underline">返回</button></div>
        )}

        {/* Card area — fills remaining space, fixed height per card */}
        {currentCard ? (
          <div className="flex-1 flex flex-col min-h-0" key={currentCard.id}>
            <div className="flex-1 min-h-0">
              <CardView card={currentCard} showApproach={state.showApproach} showCode={state.showCode} />
            </div>
            <div className="shrink-0">
              <CardActions />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center min-h-0">
            <EmptyState message={state.searchQuery ? `未找到「${state.searchQuery}」` : undefined} />
          </div>
        )}

        {/* Progress bar — fixed at bottom */}
        {cardCount > 0 && (
          <div className="shrink-0 pt-1 pb-6">
            <ProgressBar current={Math.min(state.currentVisibleIndex, cardCount - 1)} total={cardCount} mastered={state.currentVisibleIndex + 1} />
          </div>
        )}
      </div>

      {showBrowser && <CardBrowser onEdit={(card) => { if (!card.id) setEditingCard(null); else setEditingCard(card); }} onClose={() => setShowBrowser(false)} />}
      {editingCard !== null && <CardEditor card={editingCard} onSave={() => { setEditingCard(null); dispatch({ type: 'SET_CATEGORY', payload: state.category }); }} onClose={() => setEditingCard(null)} />}
    </div>
  );
}

function AppInner() {
  const [studyCategory, setStudyCategory] = useState<string | null>(null);
  const [showDecks, setShowDecks] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const { dispatch } = useAppContext();
  const handleEnterStudy = (category: Category) => { setStudyCategory(category); setShowDecks(false); dispatch({ type: 'SET_CATEGORY', payload: category }); };

  if (showDecks) {
    return <DeckPage onEnterStudy={handleEnterStudy} onBack={() => setShowDecks(false)} />;
  }

  if (showStats) {
    return <StatsPage onBack={() => setShowStats(false)} />;
  }

  return (
    <>
      <div className={studyCategory ? 'hidden' : ''}>
        <HomePage onEnterStudy={handleEnterStudy} onShowDecks={() => setShowDecks(true)} onShowStats={() => setShowStats(true)} />
      </div>
      {studyCategory && (
        <div className="page-enter" key={studyCategory}>
          <StudyPage onBack={() => setStudyCategory(null)} />
        </div>
      )}
    </>
  );
}

export default function App() {
  return <AppProvider><AppInner /></AppProvider>;
}
