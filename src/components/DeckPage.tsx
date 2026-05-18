import { useState } from 'react';
import { ChevronRight, ArrowLeft, Settings, FileText } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CATEGORIES } from '../constants';
import { getModuleDailyLimit } from '../utils/customDecks';
import CardBrowser from './CardBrowser';
import type { Category, FlashCard } from '../types';

interface Props {
  onEnterStudy: (category: Category) => void;
  onBack: () => void;
}

const TOTAL_MAP: Record<string, number> = {
  leetcode: 100, statistics: 199, 'machine-learning': 171, 'deep-learning': 32,
  llm: 37, agent: 26, jargon: 45, workplace: 76, 'vibe-coding': 23,
};

const TEXT_PRIMARY = '#F8FAFC';
const TEXT_MUTED = 'rgba(226,232,240,0.85)';
const BLUE = '#409CFF';
const ORANGE = '#FF9A2E';
const CARD_BG = 'rgba(255,255,255,0.15)';
const CARD_BORDER = 'rgba(255,255,255,0.3)';
const DECK_ITEM_BG = 'rgba(255,255,255,0.05)';

export default function DeckPage({ onEnterStudy, onBack }: Props) {
  const { dispatch, dueCountByCategory } = useAppContext();
  const [showBrowser, setShowBrowser] = useState(false);

  const handleEditCards = (cat: Category) => {
    dispatch({ type: 'SET_CATEGORY', payload: cat });
    setShowBrowser(true);
  };

  return (
    <div className="dark-bg homepage-glass-stage flex min-h-screen items-center justify-center transition-colors">
      <div className="relative z-10 w-full max-w-md px-5 py-8 pb-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} />
          </button>
          <h1 className="text-[20px] font-bold flex-1" style={{ color: TEXT_PRIMARY }}>全部牌组</h1>
        </div>

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
          </div>
        </div>

      </div>
      {showBrowser && (
        <CardBrowser
          onEdit={(card) => card.id && dispatch({ type: 'SET_CATEGORY', payload: card.category as Category })}
          onClose={() => setShowBrowser(false)}
        />
      )}
    </div>
  );
}
