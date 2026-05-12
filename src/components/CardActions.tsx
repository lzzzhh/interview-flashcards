// ============================================================
// src/components/CardActions.tsx
// ============================================================

import { ChevronLeft, ChevronRight, Flame, Star, Shuffle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SM2_LABELS } from '../constants';

export default function CardActions() {
  const { state, dispatch, filteredCards, currentCard, masteredIds, favoritedIds } = useAppContext();

  if (!currentCard) return null;

  const total = filteredCards.length;
  const idx = state.currentIndex;
  const isMastered = masteredIds.includes(currentCard.id);
  const isFavorited = favoritedIds.includes(currentCard.id);

  return (
    <div className="w-full space-y-3">
      {/* Navigation row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => dispatch({ type: 'PREV' })}
          disabled={idx === 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">上一张</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Mastered toggle */}
          <button
            onClick={() => dispatch({ type: 'TOGGLE_MASTERED' })}
            className={`p-2 rounded-lg transition-colors ${
              isMastered
                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title={isMastered ? '取消掌握' : '标记掌握'}
          >
            <Flame className="w-4 h-4" />
          </button>

          {/* Favorite toggle */}
          <button
            onClick={() =>
              dispatch({ type: 'TOGGLE_FAVORITE', payload: currentCard.id })
            }
            className={`p-2 rounded-lg transition-colors ${
              isFavorited
                ? 'bg-amber-100 text-amber-500 dark:bg-amber-900 dark:text-amber-400'
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title={isFavorited ? '取消收藏' : '收藏'}
          >
            <Star
              className="w-4 h-4"
              fill={isFavorited ? 'currentColor' : 'none'}
            />
          </button>

          {/* Shuffle button */}
          <button
            onClick={() => dispatch({ type: 'SHUFFLE' })}
            className="p-2 rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="随机顺序"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => dispatch({ type: 'NEXT' })}
          disabled={idx >= total - 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <span className="hidden sm:inline">下一张</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* SM-2 Rating row */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {SM2_LABELS.map(({ value, label, short }) => (
          <button
            key={value}
            onClick={() =>
              dispatch({ type: 'RATE_CARD', payload: value as 0 | 1 | 2 | 3 | 4 | 5 })
            }
            className="px-2 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={label}
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{short}</span>
          </button>
        ))}
      </div>

      {/* Keyboard hints */}
      <div className="text-center text-[10px] text-gray-400 dark:text-gray-600 leading-relaxed">
        ← → 翻页 &nbsp; Space 思路 &nbsp; S 代码 &nbsp; M 掌握 &nbsp; F 收藏 &nbsp; 1-5 评分 &nbsp; D 深色
      </div>
    </div>
  );
}
