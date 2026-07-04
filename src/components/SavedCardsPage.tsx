import { useMemo, useState } from 'react';
import { Flame, Search, Star } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getCardDisplayLabel, getCardSearchText, getCategoryLabel, loadAllCardsFromStorage } from '../utils/cardLibrary';
import BackButton from './BackButton';

import type { FlashCard } from '../types';

interface Props {
  onBack: () => void;
  onStudyCard?: (card: FlashCard) => void;
}

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';
const GREEN = '#10B981';
const AMBER = '#F59E0B';

export default function SavedCardsPage({ onBack, onStudyCard }: Props) {
  const { state } = useAppContext();
  const [tab, setTab] = useState<'mastered' | 'favorited'>('mastered');
  const [search, setSearch] = useState('');

  const allCards = useMemo(() => loadAllCardsFromStorage(), [state.cardsById]);
  const masteredCards = useMemo(() => allCards.filter((card) => card.sm2.state === 'mastered'), [allCards]);
  const favoritedCards = useMemo(() => allCards.filter((card) => card.favorited), [allCards]);
  const source = tab === 'mastered' ? masteredCards : favoritedCards;
  const filtered = useMemo(() => {
    if (!search.trim()) return source;
    const query = search.toLowerCase();
    return source.filter((card) => getCardSearchText(card).toLowerCase().includes(query));
  }, [search, source]);

  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center">
        <BackButton onClick={onBack} />
        <h1 className="nav-title">我的卡片</h1>
      </div>

      <div className="flex-1 flex items-start justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-5 pb-24 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <TabButton active={tab === 'mastered'} icon={<Flame className="w-4 h-4" />} label="已掌握" count={masteredCards.length} color={GREEN} onClick={() => setTab('mastered')} />
            <TabButton active={tab === 'favorited'} icon={<Star className="w-4 h-4" />} label="已收藏" count={favoritedCards.length} color={AMBER} onClick={() => setTab('favorited')} />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: TEXT_MUTED }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索卡片..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-[13px] bg-transparent"
              style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12" style={{ color: TEXT_MUTED }}>
              <p className="text-[14px]">暂无卡片</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onStudyCard?.(card)}
                  className="w-full text-left rounded-xl p-3 border cursor-pointer"
                  style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}
                >
                  <p className="text-[13px] font-medium leading-snug line-clamp-2" style={{ color: TEXT_PRIMARY }}>{getCardDisplayLabel(card)}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: 'rgba(40,130,215,0.15)', color: 'var(--blue)' }}>
                      {getCategoryLabel(card.category)}
                    </span>
                    {(card.tags || []).slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[10px]" style={{ color: TEXT_MUTED }}>#{tag}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, icon, label, count, color, onClick }: { active: boolean; icon: React.ReactNode; label: string; count: number; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border p-3 text-left transition-colors"
      style={{ backgroundColor: active ? `${color}18` : CARD_BG, borderColor: active ? `${color}66` : CARD_BORDER }}
    >
      <div className="flex items-center gap-2" style={{ color }}>
        {icon}
        <span className="text-[13px] font-bold">{label}</span>
      </div>
      <p className="mt-1 text-[22px] font-bold" style={{ color }}>{count}</p>
    </button>
  );
}
