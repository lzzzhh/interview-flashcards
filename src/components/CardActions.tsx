// ============================================================
// src/components/CardActions.tsx — 适配新 state（cardId 操作）
// ============================================================

import { ChevronLeft, ChevronRight, Flame, Star, Shuffle, FlaskConical } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { scheduleReview } from '../utils/sm2';

function previewInterval(card: { sm2: { easeFactor: number; interval: number; repetitions: number } }, quality: number): string {
  const result = scheduleReview('preview', card.sm2 as any, quality);
  const days = result.sm2.interval;
  if (days === 0) return '<1天';
  if (days === 1) return '1天';
  if (days < 7) return `${days}天`;
  if (days < 30) return `${Math.round(days / 7)}周`;
  if (days < 365) return `${Math.round(days / 30)}月`;
  return `${(days / 365).toFixed(1)}年`;
}

const ANKI_BUTTONS = [
  { quality: 1, label: '忘了', color: 'bg-red-500 hover:bg-red-600', textColor: 'text-white', desc: '完全忘记' },
  { quality: 2, label: '困难', color: 'bg-orange-500 hover:bg-orange-600', textColor: 'text-white', desc: '记得一点' },
  { quality: 3, label: '一般', color: 'bg-yellow-500 hover:bg-yellow-600', textColor: 'text-white', desc: '大部分对' },
  { quality: 4, label: '顺利', color: 'bg-green-500 hover:bg-green-600', textColor: 'text-white', desc: '正确轻松' },
  { quality: 5, label: '秒答', color: 'bg-emerald-600 hover:bg-emerald-700', textColor: 'text-white', desc: '秒答正确' },
] as const;

export default function CardActions() {
  const { state, dispatch, visibleCards, currentCard, masteredIds, favoritedIds } = useAppContext();

  if (!currentCard) return null;

  const total = visibleCards.length;
  const idx = state.currentVisibleIndex;
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
          <button
            onClick={() => dispatch({ type: 'TOGGLE_REVIEW_MODE' })}
            className={`p-2 rounded-lg transition-colors ${
              state.reviewMode
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title={state.reviewMode ? '退出复习模式' : '进入复习模式'}
          >
            <FlaskConical className="w-4 h-4" />
          </button>

          <button
            onClick={() => dispatch({ type: 'TOGGLE_MASTERED', payload: currentCard.id })}
            className={`p-2 rounded-lg transition-colors ${
              isMastered
                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title={isMastered ? '取消掌握' : '标记掌握'}
          >
            <Flame className="w-4 h-4" />
          </button>

          <button
            onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', payload: currentCard.id })}
            className={`p-2 rounded-lg transition-colors ${
              isFavorited
                ? 'bg-amber-100 text-amber-500 dark:bg-amber-900 dark:text-amber-400'
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title={isFavorited ? '取消收藏' : '收藏'}
          >
            <Star className="w-4 h-4" fill={isFavorited ? 'currentColor' : 'none'} />
          </button>

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

      {/* Rating buttons */}
      <div className="flex gap-1">
        {ANKI_BUTTONS.map(({ quality, label, color, textColor, desc }) => {
          const interval = previewInterval(currentCard, quality);
          return (
            <button
              key={quality}
              onClick={() => {
                dispatch({ type: 'RATE_CARD', payload: { cardId: currentCard.id, rating: quality } });
                dispatch({ type: 'NEXT' });
              }}
              className={`flex-1 flex flex-col items-center py-2 sm:py-2.5 px-0.5 rounded-xl ${color} ${textColor} transition-all active:scale-95`}
              title={`${desc} → 下次间隔: ${interval}`}
            >
              <span className="text-xs sm:text-sm font-bold leading-none">{label}</span>
              <span className="text-[9px] sm:text-[10px] opacity-80 mt-0.5">{interval}</span>
            </button>
          );
        })}
      </div>

      <div className="text-center text-[10px] text-gray-400 dark:text-gray-600 leading-relaxed">
        ← → 翻页 &nbsp; Space 答案/思路 &nbsp; S 代码 &nbsp; M 掌握 &nbsp; F 收藏 &nbsp; 1-5 评分 &nbsp; D 深色
      </div>
    </div>
  );
}
