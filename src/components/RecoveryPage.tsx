import { useMemo, useState } from 'react';
import { Database, Layers, RotateCcw } from 'lucide-react';
import BackButton from './BackButton';
import { loadDeletedCards, restoreDeletedCard } from '../utils/cardTrash';
import { loadDeletedCustomDecks, restoreCustomDeck } from '../utils/customDecks';
import { getCardDisplayLabel, getCategoryLabel } from '../utils/cardLibrary';
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

export default function RecoveryPage({ onBack, onStudyCard }: Props) {
  const [refreshTick, setRefreshTick] = useState(0);
  const deletedDecks = useMemo(() => loadDeletedCustomDecks(), [refreshTick]);
  const deletedCards = useMemo(() => loadDeletedCards(), [refreshTick]);

  const restoreDeck = (deckId: string) => {
    restoreCustomDeck(deckId);
    setRefreshTick((tick) => tick + 1);
  };

  const restoreCard = (cardId: string) => {
    restoreDeletedCard(cardId);
    setRefreshTick((tick) => tick + 1);
  };

  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center">
        <BackButton onClick={onBack} />
        <h1 className="nav-title">恢复中心</h1>
      </div>

      <div className="flex-1 flex items-start justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-5 pb-24 space-y-4">
          <Section
            icon={<Layers className="w-4 h-4" />}
            title="已删除牌组"
            empty="暂无可恢复牌组"
          >
            {deletedDecks.map((item) => (
              <RecoverRow
                key={item.deck.id}
                title={item.deck.name}
                subtitle={`${item.cards.length} 张卡片`}
                onRestore={() => restoreDeck(item.deck.id)}
              />
            ))}
          </Section>

          <Section
            icon={<Database className="w-4 h-4" />}
            title="已删除卡片"
            empty="暂无可恢复卡片"
          >
            {deletedCards.map((item) => (
              <RecoverRow
                key={item.card.id}
                title={getCardDisplayLabel(item.card)}
                subtitle={`原牌组：${getCategoryLabel(item.originCategory)}`}
                onOpen={() => onStudyCard?.(item.card)}
                onRestore={() => restoreCard(item.card.id)}
              />
            ))}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, empty, children }: { icon: React.ReactNode; title: string; empty: string; children: React.ReactNode }) {
  const childArray = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <div className="rounded-2xl p-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
      <div className="flex items-center gap-2 mb-3" style={{ color: TEXT_PRIMARY }}>
        <span style={{ color: GREEN }}>{icon}</span>
        <h2 className="text-[14px] font-bold">{title}</h2>
      </div>
      {childArray.length === 0 ? (
        <p className="py-8 text-center text-[13px]" style={{ color: TEXT_MUTED }}>{empty}</p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  );
}

function RecoverRow({ title, subtitle, onRestore, onOpen }: { title: string; subtitle: string; onRestore: () => void; onOpen?: () => void }) {
  return (
    <div
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (!onOpen) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      className={`rounded-xl border p-3 ${onOpen ? 'cursor-pointer' : ''}`}
      style={{ borderColor: CARD_BORDER, backgroundColor: 'rgba(255,255,255,0.03)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 text-[13px] font-bold" style={{ color: TEXT_PRIMARY }}>{title}</p>
          <p className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>{subtitle}</p>
        </div>
        <button onClick={(event) => { event.stopPropagation(); onRestore(); }} className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-bold flex items-center gap-1" style={{ backgroundColor: 'rgba(16,185,129,0.14)', color: GREEN }}>
          <RotateCcw className="w-3.5 h-3.5" />
          恢复
        </button>
      </div>
    </div>
  );
}
