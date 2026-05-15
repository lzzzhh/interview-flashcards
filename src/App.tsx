import { useRef, useCallback, useState } from 'react';
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
import type { FlashCard } from './types';

function StudyPage({ onBack }: { onBack: () => void }) {
  const { state, dispatch, currentCard, totalNew, dueCountByCategory } = useAppContext();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showBrowser, setShowBrowser] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashCard | null>(null);

  const getCurrentCardId = useCallback(() => currentCard?.id ?? null, [currentCard]);
  useKeyboard({ dispatch, searchInputRef, getCurrentCardId });

  const cardCount = state.visibleCardIds.length;

  if (state.studyMode === 'choose') {
      return <SubModulePicker onBack={onBack} />;
    }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-xl mx-auto px-3 sm:px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
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

        {state.studyMode === 'review' && (dueCountByCategory[state.category] ?? 0) === 0 && (
          <div className="text-center py-8 text-gray-400">🎉 没有到期卡片！</div>
        )}
        {state.studyMode === 'new' && totalNew === 0 && (
          <div className="text-center py-8 text-gray-400">🎉 所有卡片都已学过！<button onClick={() => dispatch({ type: 'SET_STUDY_MODE', payload: 'choose' })} className="ml-2 text-primary underline">返回</button></div>
        )}

        {currentCard ? (
          <div className="space-y-4" key={currentCard.id}>
            <CardView card={currentCard} showApproach={state.showApproach} showCode={state.showCode} />
            <CardActions />
          </div>
        ) : (
          <EmptyState message={state.searchQuery ? `未找到「${state.searchQuery}」` : undefined} />
        )}

        {cardCount > 0 && (
          <div className="pt-2 pb-8">
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
  const { dispatch } = useAppContext();
  const handleEnterStudy = (category: string) => { setStudyCategory(category); dispatch({ type: 'SET_CATEGORY', payload: category as any }); };

  return (
    <>
      <div className={studyCategory ? 'hidden' : ''}>
        <HomePage onEnterStudy={handleEnterStudy} />
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
