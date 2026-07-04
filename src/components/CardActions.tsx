// ============================================================
// src/components/CardActions.tsx — 适配新 state（cardId 操作）
// ============================================================

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Flame, Star, Shuffle, Undo2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { previewSchedule } from '../utils/sm2';
import { apiPost } from '../api/client';
import { isSprintMode, loadStudyModeConfig } from '../utils/studyModeConfig';
import type { ReviewResponse } from '../api/types';
import type { AppState } from '../types';

async function submitReview(cardId: string, rating: number, clientReviewId: string): Promise<ReviewResponse | null> {
  try {
    const modeConfig = loadStudyModeConfig();
    const res = await apiPost<ReviewResponse>('/reviews', {
      cardId,
      rating,
      clientReviewId,
      sprint: isSprintMode(),
      autoResolveInterval: modeConfig?.autoResolveInterval ?? 90,
    });
    return res;
  } catch { return null; }
}

function previewInterval(card: { sm2: { easeFactor: number; interval: number; repetitions: number } }, quality: number): string {
  const modeConfig = loadStudyModeConfig();
  const result = previewSchedule(card.sm2 as any, quality, {
    sprint: isSprintMode(),
    autoResolveInterval: modeConfig?.autoResolveInterval ?? 90,
  });
  const days = result.interval;
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

function todayKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function hashText(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(i) | 0;
  }
  return Math.abs(hash).toString(36);
}

function makeClientReviewId(state: AppState, cardId: string): string {
  const queueKey = state.planCardIds?.join('|') || `${state.category}:${state.studyMode}:${state.filterSubTopic}:${state.searchQuery}`;
  return `cr-${todayKey()}-${hashText(`${queueKey}:${cardId}`)}`;
}

export default function CardActions() {
  const { state, dispatch, visibleCards, currentCard, masteredIds, favoritedIds } = useAppContext();
  const [syncError, setSyncError] = useState(false);

  if (!currentCard) return null;

  const total = visibleCards.length;
  const idx = state.currentVisibleIndex;
  const isMastered = masteredIds.includes(currentCard.id);
  const isQueueCompleted = state.studyQueueCompletedIds.includes(currentCard.id);
  const isReadOnly = isQueueCompleted || isMastered;
  const isFavorited = favoritedIds.includes(currentCard.id);
  const statusActionClass = 'flex h-8 w-[72px] shrink-0 items-center justify-center rounded-lg px-2 text-[12px] font-semibold leading-none';
  const toolButtonClass = 'flex h-9 w-9 items-center justify-center rounded-lg transition-colors';

  return (
    <div className="w-full space-y-3">
      {/* Navigation row */}
      <div className="flex h-10 items-center justify-between">
        <button
          onClick={() => dispatch({ type: 'PREV' })}
          disabled={idx === 0}
          className="flex h-9 items-center gap-1 rounded-lg bg-gray-100 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-white/8 dark:text-gray-300 dark:hover:bg-white/12"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">上一张</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_MASTERED', payload: currentCard.id })}
            disabled={isQueueCompleted && !isMastered}
            className={`${toolButtonClass} ${
              isMastered
                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                : 'bg-gray-100 text-gray-400 dark:bg-white/8 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/12'
            } disabled:cursor-default disabled:opacity-70`}
            title={isMastered ? '取消掌握' : (isQueueCompleted ? '今日已完成' : '标记掌握')}
          >
            <Flame className="w-4 h-4" />
          </button>

          <button
            onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', payload: currentCard.id })}
            className={`${toolButtonClass} ${
              isFavorited
                ? 'bg-amber-100 text-amber-500 dark:bg-amber-900 dark:text-amber-400'
                : 'bg-gray-100 text-gray-400 dark:bg-white/8 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/12'
            }`}
            title={isFavorited ? '取消收藏' : '收藏'}
          >
            <Star className="w-4 h-4" fill={isFavorited ? 'currentColor' : 'none'} />
          </button>

          <button
            onClick={() => dispatch({ type: 'SHUFFLE' })}
            className={`${toolButtonClass} bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-white/8 dark:text-gray-400 dark:hover:bg-white/12`}
            title="随机顺序"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={() => dispatch({ type: 'UNDO_LAST_RATING' })}
            className={`${toolButtonClass} bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-white/8 dark:text-gray-400 dark:hover:bg-white/12`}
            title="撤回上次评分 (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => dispatch({ type: 'NEXT' })}
          disabled={idx >= total - 1}
          className="flex h-9 items-center gap-1 rounded-lg bg-gray-100 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-white/8 dark:text-gray-300 dark:hover:bg-white/12"
        >
          <span className="hidden sm:inline">下一张</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Rating buttons */}
      {isReadOnly ? (
        <div className="flex h-12 items-center justify-between gap-2 overflow-hidden rounded-xl px-3 text-[13px] font-medium leading-none"
          style={{ backgroundColor: 'rgba(34,197,94,0.08)', color: '#16A34A' }}>
          <span className="min-w-0 flex-1 truncate leading-none">{isMastered ? '已掌握' : '今日已完成'} · 本次队列仅可查看</span>
          {isMastered ? (
            <button
              type="button"
              onClick={() => dispatch({ type: 'TOGGLE_MASTERED', payload: currentCard.id })}
              className={`${statusActionClass} hover:bg-green-100 dark:hover:bg-green-900/70`}
            >
              取消掌握
            </button>
          ) : (
            <span className={`${statusActionClass} opacity-60`}>已完成</span>
          )}
        </div>
      ) : (
        <div className="flex gap-1">
        {ANKI_BUTTONS.map(({ quality, label, color, textColor, desc }) => {
          const interval = previewInterval(currentCard, quality);
          return (
            <button
              key={quality}
              onClick={async () => {
                const clientReviewId = makeClientReviewId(state, currentCard.id);
                if (state.studyQueueCountsTowardDaily === false) {
                  dispatch({ type: 'RATE_CARD', payload: { cardId: currentCard.id, rating: quality, clientReviewId } });
                  return;
                }
                const res = await submitReview(currentCard.id, quality, clientReviewId);
                if (res?.progress) {
                  dispatch({ type: 'API_RATE_SUCCESS', payload: { cardId: currentCard.id, progress: res.progress, log: res.log } });
                } else {
                  dispatch({ type: 'RATE_CARD', payload: { cardId: currentCard.id, rating: quality, clientReviewId } });
                  setSyncError(true);
                }
                if (state.studyMode === 'choose') dispatch({ type: 'NEXT' });
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
      )}

      {syncError && (
        <div className="text-center text-[10px] text-amber-500 cursor-pointer" onClick={() => setSyncError(false)}>
          ⚠ 同步失败，评分已保存在本地
        </div>
      )}

      <div className="text-center text-[10px] text-gray-700 dark:text-gray-400 leading-relaxed">
        ← → 翻页 &nbsp; 1-5 评分 &nbsp; M 掌握 &nbsp; F 收藏 &nbsp; D 深色
      </div>
    </div>
  );
}
