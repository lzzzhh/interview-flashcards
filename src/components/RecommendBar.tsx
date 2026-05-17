// ============================================================
// src/components/RecommendBar.tsx — 首页智能推荐
// ============================================================

import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import MathText from './MathText';

interface Props {
  onJumpToCard: (cardId: string, category: string) => void;
}

interface RecCard {
  id: string;
  label: string;
  reason: string;
  category: string;
  overdue: number;
}

export default function RecommendBar({ onJumpToCard }: Props) {
  const { state } = useAppContext();

  const recommendations = useMemo<RecCard[]>(() => {
    const now = Date.now();
    const all: RecCard[] = [];

    for (const card of Object.values(state.cardsById)) {
      const sm2 = card.sm2;
      if (!sm2 || sm2.state === 'new') continue;

      const overdue = (now - sm2.nextReview) / 86400000;
      if (overdue < 0) continue;

      let label = '';
      if (card.category === 'leetcode') {
        label = `#${card.number} ${card.titleCn}`;
      } else {
        label = card.question.slice(0, 30);
      }

      const reason = overdue > 7 ? '严重逾期' : overdue > 3 ? '逾期' : overdue > 1 ? '到期' : '刚到期';

      all.push({ id: card.id, label, reason, category: card.category, overdue });
    }

    all.sort((a, b) => {
      // sort by recommendation score descending
      const scoreA = (() => {
        const c = state.cardsById[a.id];
        const s = c?.sm2; if (!s) return 0;
        const R = Math.pow(2, -a.overdue / Math.max(s.interval, 1));
        return (1 - R) * (1 + s.lapses) * (s.easeFactor > 0 ? 2.5 / s.easeFactor : 1);
      })();
      const scoreB = (() => {
        const c = state.cardsById[b.id];
        const s = c?.sm2; if (!s) return 0;
        const R = Math.pow(2, -b.overdue / Math.max(s.interval, 1));
        return (1 - R) * (1 + s.lapses) * (s.easeFactor > 0 ? 2.5 / s.easeFactor : 1);
      })();
      return scoreB - scoreA;
    });
    return all.slice(0, 5);
  }, [state.cardsById]);

  return (
    <div className="w-full rounded-2xl border border-white/50 bg-white/40 backdrop-blur-xl p-4 shadow-lg dark:border-white/15 dark:bg-white/8">
      <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">推荐复习</h3>
      {recommendations.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">暂无待复习卡片</p>
      ) : (
      <div className="space-y-1.5">
        {recommendations.map((rec) => (
          <button
            key={rec.id}
            onClick={() => onJumpToCard(rec.id, rec.category)}
            className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 w-full text-left hover:bg-white/40 rounded-lg px-2 py-1 -mx-2 transition-colors"
          >
            <span className="truncate flex-1 text-xs"><MathText text={rec.label} /></span>
            <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${
              rec.overdue > 3 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
              rec.overdue > 1 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
              'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              {rec.reason}
            </span>
          </button>
        ))}
      </div>
      )}
    </div>
  );
}
