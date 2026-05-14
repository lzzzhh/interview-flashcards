// ============================================================
// src/components/DifficultyPicker.tsx — 新卡难度分配选择器
// ============================================================

import { useState, useMemo, useEffect } from 'react';
import { Minus, Plus, ArrowLeft, RotateCcw, Equal, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getModuleDailyLimit } from '../utils/customDecks';
import { DIFFICULTY_LABEL } from '../constants';
import type { Difficulty, FlashCard, LeetCodeCard } from '../types';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const DIFF_EMOJI: Record<Difficulty, string> = { easy: '🟢', medium: '🟡', hard: '🔴' };

function isLeetCode(card: FlashCard): card is LeetCodeCard {
  return card.category === 'leetcode';
}

function getCardDifficulty(card: FlashCard): Difficulty {
  if (isLeetCode(card)) return card.difficulty;
  if ('difficulty' in card && card.difficulty) return card.difficulty as Difficulty;
  return 'medium';
}

interface Props {
  onBack: () => void;
}

/** 按比例自动分配 limit 到各难度 */
function autoDistribute(limit: number, available: Record<Difficulty, number>): Record<Difficulty, number> {
  const total = available.easy + available.medium + available.hard;
  if (total === 0) return { easy: 0, medium: 0, hard: 0 };

  let easy = Math.max(0, Math.round(limit * available.easy / total));
  let medium = Math.max(0, Math.round(limit * available.medium / total));
  let hard = limit - easy - medium;

  // Cap at available
  easy = Math.min(easy, available.easy);
  medium = Math.min(medium, available.medium);
  hard = Math.min(hard, available.hard);

  // Redistribute overflow
  let remaining = limit - (easy + medium + hard);
  const order: Difficulty[] = ['medium', 'easy', 'hard'];
  const caps = { easy: available.easy, medium: available.medium, hard: available.hard };
  for (const d of order) {
    const add = Math.min(remaining, caps[d] - (d === 'easy' ? easy : d === 'medium' ? medium : hard));
    if (d === 'easy') easy += add;
    else if (d === 'medium') medium += add;
    else hard += add;
    remaining = limit - (easy + medium + hard);
    if (remaining <= 0) break;
  }

  return { easy, medium, hard };
}

/** 均分：limit / 3，余数轮询分配给尚有容量的难度，确保最均匀分布 */
function equalDistribute(limit: number, available: Record<Difficulty, number>): Record<Difficulty, number> {
  const base = Math.floor(limit / 3);
  let easy = Math.min(base, available.easy);
  let medium = Math.min(base, available.medium);
  let hard = Math.min(base, available.hard);

  // 轮询分配余数：每次给尚有容量且当前最少的难度 +1
  let remaining = limit - (easy + medium + hard);
  const order: Difficulty[] = ['medium', 'easy', 'hard'];
  while (remaining > 0) {
    // 找到当前值最小且还有容量的难度
    let best: Difficulty | null = null;
    let bestVal = Infinity;
    for (const d of order) {
      const cur = d === 'easy' ? easy : d === 'medium' ? medium : hard;
      const cap = d === 'easy' ? available.easy : d === 'medium' ? available.medium : available.hard;
      if (cur < cap && cur < bestVal) {
        best = d;
        bestVal = cur;
      }
    }
    if (!best) break; // 所有难度都满了
    if (best === 'easy') easy++;
    else if (best === 'medium') medium++;
    else hard++;
    remaining--;
  }

  return { easy, medium, hard };
}

export default function DifficultyPicker({ onBack }: Props) {
  const { state, dispatch } = useAppContext();
  const limit = getModuleDailyLimit(state.category);

  // Count available new cards per difficulty
  const available = useMemo(() => {
    const counts: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
    for (const card of Object.values(state.cardsById)) {
      if (!card.sm2.state || card.sm2.state === 'new') {
        const diff = getCardDifficulty(card);
        counts[diff]++;
      }
    }
    return counts;
  }, [state.cardsById]);

  const initialDist = useMemo(
    () => autoDistribute(limit, available),
    [limit, available],
  );

  const equalDist = useMemo(
    () => equalDistribute(limit, available),
    [limit, available],
  );

  const [counts, setCounts] = useState(initialDist);
  const [equalActive, setEqualActive] = useState(false);

  // 清除均分高亮
  useEffect(() => {
    if (!equalActive) return;
    const t = setTimeout(() => setEqualActive(false), 800);
    return () => clearTimeout(t);
  }, [equalActive]);

  const total = counts.easy + counts.medium + counts.hard;
  const canConfirm = total > 0;
  const allSelected = total === limit || total === available.easy + available.medium + available.hard;

  const adjust = (diff: Difficulty, delta: number) => {
    setCounts((prev) => {
      const next = { ...prev };
      next[diff] = Math.max(0, Math.min(available[diff], prev[diff] + delta));
      // Don't allow total to exceed limit
      const newTotal = next.easy + next.medium + next.hard;
      if (newTotal > limit) return prev;
      return next;
    });
  };

  const handleReset = () => setCounts({ easy: 0, medium: 0, hard: 0 });
  const handleEqual = () => {
    setCounts(equalDist);
    setEqualActive(true);
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    dispatch({ type: 'START_NEW_STUDY', payload: counts });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-xl mx-auto px-3 sm:px-4 py-3 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">选择学习难度</h2>
        </div>

        {/* Info */}
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            今日新卡上限 <span className="font-bold text-primary">{limit}</span> 张
          </p>
        </div>

        {/* Difficulty rows */}
        <div className="space-y-3">
          {DIFFICULTIES.map((diff) => {
            const emoji = DIFF_EMOJI[diff];
            const colorBar = diff === 'easy' ? 'bg-green-400' : diff === 'medium' ? 'bg-yellow-400' : 'bg-red-400';
            const maxVal = available[diff];
            const val = counts[diff];
            const percent = Math.min(100, limit > 0 ? (val / limit) * 100 : 0);

            return (
              <div
                key={diff}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                {/* Label row */}
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="text-base">{emoji}</span>
                    {DIFFICULTY_LABEL[diff]}
                  </span>
                  <span className="text-xs text-gray-400">可用 {maxVal} 张</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mb-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${colorBar}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {/* Stepper */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => adjust(diff, -1)}
                    disabled={val <= 0}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className={`text-lg font-bold w-12 text-center tabular-nums transition-all duration-200 ${equalActive ? 'scale-125 text-primary' : ''}`}>{val}</span>
                  <button
                    onClick={() => adjust(diff, 1)}
                    disabled={val >= maxVal || total >= limit}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total indicator */}
        <div className="text-center">
          <p className={`text-sm font-medium ${
            allSelected ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
          }`}>
            已选 {total} / {limit} 张{total < limit && !allSelected ? '' : ' ✓'}
          </p>
          {total < limit && !allSelected && (
            <p className="text-xs text-gray-400 mt-0.5">
              还可以再选 {limit - total} 张，或直接开始
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-center pt-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置
          </button>
          <button
            onClick={handleEqual}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
              equalActive
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent'
            }`}
          >
            {equalActive ? <Check className="w-3.5 h-3.5" /> : <Equal className="w-3.5 h-3.5" />}
            均分
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors"
          >
            开始学习
          </button>
        </div>
      </div>
    </div>
  );
}
