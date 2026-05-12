// ============================================================
// src/components/StatsDashboard.tsx — 学习统计面板
// ============================================================

import { X, BookOpen, CheckCircle, Clock, Zap } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useProgress } from '../hooks/useProgress';
import { DIFFICULTY_LABEL } from '../constants';

export default function StatsDashboard() {
  const { state, dispatch } = useAppContext();
  const { cards } = state;
  const stats = useProgress(cards);

  if (!state.showStats) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={() => dispatch({ type: 'TOGGLE_STATS' })}
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 h-full overflow-y-auto shadow-xl animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            📊 学习统计
          </h2>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_STATS' })}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Overview cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatBox
              icon={<BookOpen className="w-4 h-4" />}
              label="总卡片"
              value={stats.total}
              color="text-blue-600 dark:text-blue-400"
              bg="bg-blue-50 dark:bg-blue-900/30"
            />
            <StatBox
              icon={<CheckCircle className="w-4 h-4" />}
              label="已掌握"
              value={stats.mastered}
              color="text-green-600 dark:text-green-400"
              bg="bg-green-50 dark:bg-green-900/30"
            />
            <StatBox
              icon={<Clock className="w-4 h-4" />}
              label="待复习"
              value={stats.pending}
              color="text-orange-600 dark:text-orange-400"
              bg="bg-orange-50 dark:bg-orange-900/30"
            />
            <StatBox
              icon={<Zap className="w-4 h-4" />}
              label="连续天数"
              value={stats.streak}
              color="text-purple-600 dark:text-purple-400"
              bg="bg-purple-50 dark:bg-purple-900/30"
            />
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>掌握率</span>
              <span className="font-medium">{stats.masteredPercent}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-700"
                style={{ width: `${stats.masteredPercent}%` }}
              />
            </div>
          </div>

          {/* Today */}
          <div className="text-center py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">今日学习</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.todayReviewed}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">张卡片</p>
          </div>

          {/* By Difficulty */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              按难度分布
            </h3>
            <div className="space-y-2">
              {Object.entries(stats.byDifficulty).map(([diff, data]) => {
                const pct = data.total > 0 ? Math.round((data.mastered / data.total) * 100) : 0;
                const label =
                  DIFFICULTY_LABEL[diff as keyof typeof DIFFICULTY_LABEL] ?? diff;
                return (
                  <div key={diff}>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                      <span>{label}</span>
                      <span>
                        {data.mastered}/{data.total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className={`rounded-xl p-3 ${bg}`}>
      <div className={`mb-1 ${color}`}>{icon}</div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
