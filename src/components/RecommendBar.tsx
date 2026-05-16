// ============================================================
// src/components/RecommendBar.tsx — 首页智能推荐
// ============================================================

import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';

interface RecCard {
  id: string;
  label: string;
  reason: string;
  category: string;
  overdue: number;
}

export default function RecommendBar() {
  const { state } = useAppContext();

  const recommendations = useMemo<RecCard[]>(() => {
    const now = Date.now();
    const all: RecCard[] = [];

    for (const card of Object.values(state.cardsById)) {
      const sm2 = card.sm2;
      if (!sm2 || sm2.state === 'new') continue;
      
      const overdue = (now - sm2.nextReview) / 86400000; // days
      if (overdue < 0) continue; // not due yet
      
      let label = '';
      if (card.category === 'leetcode') {
        label = `#${card.number} ${card.titleCn}`;
      } else {
        label = card.question.slice(0, 30);
      }
      
      all.push({ id: card.id, label, reason: overdue > 3 ? '严重逾期' : overdue > 1 ? '逾期' : '到期', category: card.category, overdue });
    }
    
    all.sort((a, b) => b.overdue - a.overdue);
    return all.slice(0, 5);
  }, [state.cardsById]);

  return (
    <div className="w-full rounded-2xl border border-white/40 bg-white/25 backdrop-blur-lg p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">推荐复习</h3>
      {recommendations.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">暂无待复习卡片</p>
      ) : (
      <div className="space-y-1.5">
        {recommendations.map((rec) => (
          <div key={rec.id} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span className="truncate flex-1">{rec.label}</span>
            <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${
              rec.overdue > 3 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
              rec.overdue > 1 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
              'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              {rec.reason}
            </span>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
