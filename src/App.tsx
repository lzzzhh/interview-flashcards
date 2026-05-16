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
import type { Category, FlashCard } from './types';
import { replayOps } from './sync/engine';
import type { SyncOp } from './sync/types';

/** 后台自动重放 oplog（桌面端作为服务端时，客户端发来的 ops 需要自动合并） */
function SyncBackground() {
  const { state, dispatch } = useAppContext();
  const cardsRef = useRef(state.cardsById);
  cardsRef.current = state.cardsById;

  useEffect(() => {
    const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    if (!isTauri) return;

    const interval = setInterval(async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const files: Record<string, string> = await invoke('sync_read_all_ops');
        const ops: SyncOp[] = [];
        for (const content of Object.values(files)) {
          for (const line of content.split('\n')) {
            const t = line.trim(); if (!t) continue;
            try { ops.push(JSON.parse(t)); } catch {}
          }
        }
        if (ops.length === 0) return;

        const seen: Record<string, number> = await invoke('sync_read_seen_ops');
        const merged = replayOps(ops, { cardsById: cardsRef.current, reviewLogs: [] }, seen);
        for (const [, card] of Object.entries(merged.cardsById)) {
          if (JSON.stringify(cardsRef.current[card.id]?.sm2) !== JSON.stringify(card.sm2)) {
            dispatch({ type: 'UPDATE_CARD', payload: card });
          }
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

function StudyPage({ onBack }: { onBack: () => void }) {
  const { state, dispatch, currentCard, totalNew, dueCountByCategory } = useAppContext();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showBrowser, setShowBrowser] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashCard | null>(null);

  const getCurrentCardId = useCallback(() => currentCard?.id ?? null, [currentCard]);
  useKeyboard({ dispatch, searchInputRef, getCurrentCardId });

  const cardCount = state.visibleCardIds.length;

  if (state.studyMode === 'choose') {
    return <><SyncBackground /><SubModulePicker onBack={onBack} /></>;
  }

  return (
    <>
    <SyncBackground />
    <div className="h-dvh flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-md mx-auto w-full px-3 sm:px-4 flex flex-col flex-1 min-h-0">

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
        {state.studyMode === 'review' && (dueCountByCategory[state.category] ?? 0) === 0 && (
          <div className="shrink-0 text-center py-8 text-gray-400">🎉 没有到期卡片！</div>
        )}
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
    </>
  );
}

function AppInner() {
  const [studyCategory, setStudyCategory] = useState<string | null>(null);
  const { dispatch } = useAppContext();
  const handleEnterStudy = (category: Category) => { setStudyCategory(category); dispatch({ type: 'SET_CATEGORY', payload: category }); };

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
