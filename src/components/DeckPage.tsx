import { useState } from 'react';
import { ChevronRight, Settings, Plus, X, Trash2, RotateCcw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CATEGORIES } from '../constants';
import { getModuleDailyLimit, setModuleDailyLimit, loadCustomDecks, loadCustomCards, createCustomDeck, deleteCustomDeck, loadDeletedCustomDecks, restoreCustomDeck, type CustomDeck } from '../utils/customDecks';
import { getStudyModeNewLimit, getStudyModeReviewLimit } from '../utils/studyModeConfig';
import { loadCardsForCategory } from '../utils/cardLibrary';
import { useDeckTotals } from '../repositories/useDeckStats';
import { useStatsSnapshot } from '../repositories/useStatsSnapshot';
import { loadProgress } from '../utils/storage';
import { countTodayNewLearned, loadReviewLogs } from '../utils/reviewLogs';
import { leetcodeHot100 } from '../data/leetcode-hot100';
import { statisticsCards } from '../data/statistics';
import { machineLearningCards } from '../data/machine-learning';
import { deepLearningCards } from '../data/deep-learning';
import { llmCards } from '../data/llm';
import { agentCards } from '../data/agent';
import { jargonCards } from '../data/jargon';
import { workplaceCards } from '../data/workplace';
import { vibeCodingCards } from '../data/vibe-coding';
import BackButton from './BackButton';
import CardBrowser from './CardBrowser';
import type { Category } from '../types';

interface Props {
  onEnterStudy: (category: string, cardId?: string, options?: { exitOnBack?: boolean }) => void;
  onBack: () => void;
}

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const BLUE = 'var(--blue)';
const ORANGE = 'var(--orange)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';
const DECK_ITEM_BG = 'rgba(255,255,255,0.03)';
const MODAL_PANEL_STYLE = {
  backgroundColor: CARD_BG,
  borderColor: CARD_BORDER,
  boxShadow: 'var(--card-shadow)',
  backdropFilter: 'blur(20px)',
} as const;
const REVIEW_STATES = new Set(['learning', 'review', 'relearning']);
const CARD_MODULES: [string, { id: string }[]][] = [
  ['leetcode', leetcodeHot100],
  ['statistics', statisticsCards],
  ['machine-learning', machineLearningCards],
  ['deep-learning', deepLearningCards],
  ['llm', llmCards],
  ['agent', agentCards],
  ['jargon', jargonCards],
  ['workplace', workplaceCards],
  ['vibe-coding', vibeCodingCards],
];

function getDeckCardIds(deckId: string): string[] {
  const builtin = CARD_MODULES.find(([id]) => id === deckId);
  if (builtin) return builtin[1].map((card) => card.id);
  return loadCustomCards(deckId).map((card) => card.id);
}

function getDeckNewCount(deckId: string): number {
  const progress = loadProgress(deckId);
  return getDeckCardIds(deckId).filter((cardId) => {
    const sm2 = progress.sm2[cardId];
    return !sm2 || sm2.state === 'new';
  }).length;
}

function getRemainingNewCount(deckId: string, newCards: number, logs: ReturnType<typeof loadReviewLogs>): number {
  const limit = getStudyModeNewLimit(deckId, getModuleDailyLimit(deckId));
  const learnedToday = countTodayNewLearned(getDeckCardIds(deckId), logs);
  return Math.max(0, Math.min(newCards, limit - learnedToday));
}

export default function DeckPage({ onEnterStudy, onBack }: Props) {
  const { state, dispatch, dueCountByCategory } = useAppContext();
  const { totals } = useDeckTotals();
  const { byDeck, refresh } = useStatsSnapshot();
  const [showBrowser, setShowBrowser] = useState(false);
  const [customDecks, setCustomDecks] = useState<CustomDeck[]>(() => loadCustomDecks());
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLimit, setNewLimit] = useState(20);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; count: number } | null>(null);
  const [actionTarget, setActionTarget] = useState<{ id: string; name: string; count: number; canDelete: boolean } | null>(null);
  const [showRestore, setShowRestore] = useState(false);
  const reviewLogs = loadReviewLogs();
  const deletedDecks = loadDeletedCustomDecks();

  const handleCreate = () => {
    if (!newName.trim()) return;
    const deck = createCustomDeck(newName.trim(), '');
    setModuleDailyLimit(deck.id, newLimit);
    setCustomDecks(loadCustomDecks());
    setShowCreate(false);
    setNewName('');
    setNewLimit(20);
    dispatch({ type: 'SET_CATEGORY', payload: deck.id });
    void refresh();
  };

  const handleEditCards = (cat: string) => {
    const cards = loadCardsForCategory(cat);
    dispatch({ type: 'SET_CATEGORY', payload: cat });
    if (cards.length > 0) dispatch({ type: 'LOADED_QUEUE', payload: { cards, mode: 'new' } });
    setShowBrowser(true);
    setActionTarget(null);
  };

  const handleDeleteDeck = () => {
    if (!deleteTarget) return;
    deleteCustomDeck(deleteTarget.id);
    setCustomDecks(loadCustomDecks());
    setShowBrowser(false);
    dispatch({ type: 'SET_CATEGORY', payload: state.category === deleteTarget.id ? 'leetcode' : state.category });
    setDeleteTarget(null);
    setActionTarget(null);
    void refresh();
  };

  const handleRestoreDeck = (deckId: string) => {
    restoreCustomDeck(deckId);
    setCustomDecks(loadCustomDecks());
    void refresh();
  };

  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center">
        <BackButton onClick={onBack} />
        <h1 className="nav-title">全部牌组</h1>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-8 pb-24">

        {/* Deck List */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => {
              const row = byDeck[cat.key];
              const reviewLimit = getStudyModeReviewLimit(cat.key, 100);
              const newCount = getRemainingNewCount(cat.key, row?.newCards ?? getDeckNewCount(cat.key), reviewLogs);
              const dueCount = Math.min(row?.todayReviewRemaining ?? dueCountByCategory[cat.key] ?? 0, reviewLimit);
              const totalCount = row?.totalCards ?? totals[cat.key] ?? '--';
              return (
                <div key={cat.key} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left border" style={{ borderColor: CARD_BORDER, backgroundColor: DECK_ITEM_BG }}>
                  <button
                    onClick={() => onEnterStudy(cat.key)}
                    className="flex-1 min-w-0 flex items-center gap-3 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-bold truncate" style={{ color: TEXT_PRIMARY }}>{cat.label}</h3>
                      <p className="text-[11px] mt-0.5" style={{ color: TEXT_MUTED }}>共 {totalCount} 张卡片</p>
                    </div>
                    <div className="flex gap-4 text-right">
                      <div>
                        <div className="text-[11px]" style={{ color: TEXT_MUTED }}>复习</div>
                        <div className="text-[14px] font-semibold" style={{ color: ORANGE }}>{dueCount}</div>
                      </div>
                      <div>
                        <div className="text-[11px]" style={{ color: TEXT_MUTED }}>新卡</div>
                        <div className="text-[14px] font-semibold" style={{ color: BLUE }}>{newCount}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4" style={{ color: 'rgba(203,213,225,0.3)' }} />
                  </button>
                  <button onClick={() => setActionTarget({ id: cat.key, name: cat.label, count: Number(totalCount) || 0, canDelete: false })} className="p-1" title="牌组设置">
                    <Settings className="w-4 h-4" style={{ color: TEXT_MUTED }} />
                  </button>
                </div>
              );
            })}
            {customDecks.map((deck) => {
              const progress = loadProgress(deck.id);
              const cards = loadCustomCards(deck.id).map((card) => ({
                ...card,
                sm2: progress.sm2[card.id] ? { ...card.sm2, ...progress.sm2[card.id] } : card.sm2,
              }));
              const now = Date.now();
              const row = byDeck[deck.id];
              const reviewLimit = getStudyModeReviewLimit(deck.id, 100);
              const dueCount = Math.min(row?.todayReviewRemaining ?? cards.filter((card) => REVIEW_STATES.has(card.sm2.state) && card.sm2.nextReview <= now).length, reviewLimit);
              const newCount = getRemainingNewCount(deck.id, row?.newCards ?? cards.filter((card) => !card.sm2.state || card.sm2.state === 'new').length, reviewLogs);
              const totalCount = row?.totalCards ?? cards.length;
              return (
                <div key={deck.id} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left border" style={{ borderColor: CARD_BORDER, backgroundColor: DECK_ITEM_BG }}>
                  <button onClick={() => onEnterStudy(deck.id, undefined, { exitOnBack: true })} className="flex-1 min-w-0 flex items-center gap-3 text-left">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-bold truncate" style={{ color: TEXT_PRIMARY }}>{deck.name}</h3>
                      <p className="text-[11px] mt-0.5" style={{ color: TEXT_MUTED }}>共 {totalCount} 张卡片</p>
                    </div>
                    <div className="flex gap-4 text-right">
                      <div>
                        <div className="text-[11px]" style={{ color: TEXT_MUTED }}>复习</div>
                        <div className="text-[14px] font-semibold" style={{ color: ORANGE }}>{dueCount}</div>
                      </div>
                      <div>
                        <div className="text-[11px]" style={{ color: TEXT_MUTED }}>新卡</div>
                        <div className="text-[14px] font-semibold" style={{ color: BLUE }}>{newCount}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4" style={{ color: 'rgba(203,213,225,0.3)' }} />
                  </button>
                  <button onClick={() => setActionTarget({ id: deck.id, name: deck.name, count: cards.length, canDelete: true })} className="p-1" title="牌组设置">
                    <Settings className="w-4 h-4" style={{ color: TEXT_MUTED }} />
                  </button>
                  <button onClick={() => setDeleteTarget({ id: deck.id, name: deck.name, count: cards.length })} className="p-1" title="删除牌组">
                    <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
                  </button>
                </div>
              );
            })}
            <button onClick={() => setShowRestore(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed" style={{ borderColor: CARD_BORDER, color: TEXT_MUTED }}>
              <RotateCcw className="w-4 h-4" />
              <span className="text-[13px]">恢复已删除牌组</span>
            </button>
            <button onClick={() => setShowCreate(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed" style={{ borderColor: CARD_BORDER, color: TEXT_MUTED }}>
              <Plus className="w-4 h-4" />
              <span className="text-[13px]">新建牌组</span>
            </button>
          </div>
        </div>

      </div>
      {showBrowser && (
        <CardBrowser
          onEdit={(card) => card.id && dispatch({ type: 'SET_CATEGORY', payload: card.category as Category })}
          onClose={() => setShowBrowser(false)}
        />
      )}
      {actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border p-5 shadow-xl" style={MODAL_PANEL_STYLE}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>{actionTarget.name}</h3>
              <button onClick={() => setActionTarget(null)} className="p-1"><X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <div className="space-y-2">
              <button onClick={() => handleEditCards(actionTarget.id)} className="w-full flex items-center justify-between rounded-xl bg-slate-100/80 px-3 py-2.5 text-left transition-colors hover:bg-slate-200/70 dark:bg-white/8 dark:hover:bg-white/12">
                <span className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>管理卡片</span>
                <ChevronRight className="w-4 h-4" style={{ color: TEXT_MUTED }} />
              </button>
              {actionTarget.canDelete && (
                <button onClick={() => { setDeleteTarget({ id: actionTarget.id, name: actionTarget.name, count: actionTarget.count }); setActionTarget(null); }} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
                  <span className="text-[14px] font-medium" style={{ color: '#EF4444' }}>删除牌组</span>
                  <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {showRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border p-5 shadow-xl" style={MODAL_PANEL_STYLE}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>恢复已删除牌组</h3>
              <button onClick={() => setShowRestore(false)} className="p-1"><X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            {deletedDecks.length === 0 ? (
              <p className="py-8 text-center text-[13px]" style={{ color: TEXT_MUTED }}>暂无可恢复牌组</p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {deletedDecks.map((item) => (
                  <div key={item.deck.id} className="rounded-xl border bg-slate-100/70 p-3 dark:bg-white/5" style={{ borderColor: CARD_BORDER }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold truncate" style={{ color: TEXT_PRIMARY }}>{item.deck.name}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: TEXT_MUTED }}>{item.cards.length} 张卡片</p>
                      </div>
                      <button onClick={() => handleRestoreDeck(item.deck.id)} className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-bold" style={{ backgroundColor: 'rgba(16,185,129,0.14)', color: '#10B981' }}>
                        恢复
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border p-5 shadow-xl" style={MODAL_PANEL_STYLE}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>新建牌组</h3>
              <button onClick={() => setShowCreate(false)} className="p-1"><X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <div className="space-y-3">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="牌组名称" className="w-full rounded-lg border bg-white/80 px-3 py-2 text-sm dark:bg-white/8" style={{ color: 'var(--text-primary)', borderColor: CARD_BORDER }} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} autoFocus />
              <div className="flex items-center justify-between">
                <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>每日新卡上限</span>
                <input type="number" min="0" max="100" value={newLimit} onChange={(e) => setNewLimit(Number(e.target.value))} className="w-16 rounded-lg border bg-white/80 px-2 py-1 text-center text-sm dark:bg-white/8" style={{ color: 'var(--text-primary)', borderColor: CARD_BORDER }} />
              </div>
              <button onClick={handleCreate} disabled={!newName.trim()} className="w-full py-2.5 rounded-xl text-[14px] font-bold text-white disabled:opacity-30" style={{ background: `linear-gradient(135deg, var(--blue), #1D4ED8)` }}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border p-5 shadow-xl" style={MODAL_PANEL_STYLE}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>删除牌组</h3>
              <button onClick={() => setDeleteTarget(null)} className="p-1"><X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
              确认删除「{deleteTarget.name}」？其中 {deleteTarget.count} 张卡片会回到未分配，复习进度会保留，可在恢复入口找回牌组。
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl bg-slate-100/80 py-2.5 text-[14px] font-bold transition-colors hover:bg-slate-200/70 dark:bg-white/8 dark:hover:bg-white/12" style={{ color: 'var(--text-primary)' }}>
                取消
              </button>
              <button onClick={handleDeleteDeck} className="flex-1 py-2.5 rounded-xl text-[14px] font-bold text-white" style={{ backgroundColor: '#EF4444' }}>
                删除
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      </div>
  );
}
