import { useState } from 'react';
import { ChevronRight, ArrowLeft, Settings, Plus, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CATEGORIES } from '../constants';
import { getModuleDailyLimit, setModuleDailyLimit, loadCustomDecks, createCustomDeck, type CustomDeck } from '../utils/customDecks';
import CardBrowser from './CardBrowser';
import type { Category } from '../types';

interface Props {
  onEnterStudy: (category: Category) => void;
  onBack: () => void;
}

const TOTAL_MAP: Record<string, number> = {
  leetcode: 100, statistics: 199, 'machine-learning': 171, 'deep-learning': 32,
  llm: 37, agent: 26, jargon: 45, workplace: 76, 'vibe-coding': 23,
};

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const BLUE = 'var(--blue)';
const ORANGE = 'var(--orange)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';
const DECK_ITEM_BG = 'rgba(255,255,255,0.03)';

export default function DeckPage({ onEnterStudy, onBack }: Props) {
  const { dispatch, dueCountByCategory } = useAppContext();
  const [showBrowser, setShowBrowser] = useState(false);
  const [customDecks, setCustomDecks] = useState<CustomDeck[]>(() => loadCustomDecks());
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLimit, setNewLimit] = useState(20);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const deck = createCustomDeck(newName.trim(), '');
    setModuleDailyLimit(deck.id, newLimit);
    setCustomDecks(loadCustomDecks());
    setShowCreate(false);
    setNewName('');
    setNewLimit(20);
  };

  const handleEditCards = (cat: Category) => {
    dispatch({ type: 'SET_CATEGORY', payload: cat });
    setShowBrowser(true);
  };

  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center">
        <button onClick={onBack} className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="nav-title">全部牌组</h1>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-8 pb-24">

        {/* Deck List */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => {
              const newCount = getModuleDailyLimit(cat.key);
              const dueCount = dueCountByCategory[cat.key] ?? 0;
              return (
                <div key={cat.key} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left border" style={{ borderColor: CARD_BORDER, backgroundColor: DECK_ITEM_BG }}>
                  <button
                    onClick={() => onEnterStudy(cat.key)}
                    className="flex-1 min-w-0 flex items-center gap-3 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-bold truncate" style={{ color: TEXT_PRIMARY }}>{cat.label}</h3>
                      <p className="text-[11px] mt-0.5" style={{ color: TEXT_MUTED }}>共 {TOTAL_MAP[cat.key] ?? '--'} 张卡片</p>
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
                  <button onClick={() => handleEditCards(cat.key)} className="p-1" title="卡片管理">
                    <Settings className="w-4 h-4" style={{ color: TEXT_MUTED }} />
                  </button>
                </div>
              );
            })}
            {customDecks.map((deck) => (
              <div key={deck.id} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left border" style={{ borderColor: CARD_BORDER, backgroundColor: DECK_ITEM_BG }}>
                <button onClick={() => onEnterStudy(deck.id)} className="flex-1 min-w-0 flex items-center gap-3 text-left">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-bold truncate" style={{ color: TEXT_PRIMARY }}>{deck.name}</h3>
                    <p className="text-[11px] mt-0.5" style={{ color: TEXT_MUTED }}>自定义牌组</p>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: 'rgba(203,213,225,0.3)' }} />
                </button>
                <button onClick={() => handleEditCards(deck.id)} className="p-1" title="卡片管理">
                  <Settings className="w-4 h-4" style={{ color: TEXT_MUTED }} />
                </button>
              </div>
            ))}
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
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="rounded-2xl p-5 w-full max-w-sm shadow-xl" style={{ backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(15,23,42,0.1)' }}>
            <div className="dark" style={{ display: 'none' }} />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-gray-900">新建牌组</h3>
              <button onClick={() => setShowCreate(false)} className="p-1"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-3">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="牌组名称" className="w-full px-3 py-2 rounded-lg border text-sm text-gray-900 border-gray-200" onKeyDown={(e) => e.key === 'Enter' && handleCreate()} autoFocus />
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-500">每日新卡上限</span>
                <input type="number" min="1" max="100" value={newLimit} onChange={(e) => setNewLimit(Number(e.target.value))} className="w-16 px-2 py-1 rounded-lg border text-sm text-center text-gray-900" />
              </div>
              <button onClick={handleCreate} disabled={!newName.trim()} className="w-full py-2.5 rounded-xl text-[14px] font-bold text-white disabled:opacity-30" style={{ background: `linear-gradient(135deg, #2563EB, #1D4ED8)` }}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      </div>
  );
}
