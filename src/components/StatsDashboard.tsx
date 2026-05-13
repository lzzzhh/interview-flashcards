// ============================================================
// src/components/StatsDashboard.tsx — 学习统计面板（含艾宾浩斯曲线）
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { X, BookOpen, CheckCircle, Clock, Zap, TrendingUp, Download, Upload } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useProgress } from '../hooks/useProgress';
import { DIFFICULTY_LABEL } from '../constants';
import { exportProgress, importProgress } from '../utils/backup';

/**
 * 艾宾浩斯遗忘曲线数据
 * 横轴：复习间隔（天），纵轴：记忆保留率
 * 模拟曲线: R = e^(-t/S) where S ≈ 1.25
 */
function EbbinghausCurve() {
  const points = [1, 2, 4, 7, 14, 21, 30, 60, 90];
  const retention = points.map((d) => Math.round(Math.exp(-d / 15) * 100));

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
        <TrendingUp className="w-4 h-4 text-purple-500" />
        艾宾浩斯遗忘曲线
      </h3>
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
        {/* Bar chart */}
        <div className="flex items-end gap-1 h-20 mb-2">
          {retention.map((r, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <div
                className="w-full rounded-t-sm bg-gradient-to-t from-purple-500 to-purple-300 transition-all"
                style={{ height: `${r}%` }}
              />
            </div>
          ))}
        </div>
        {/* X-axis labels */}
        <div className="flex gap-1">
          {points.map((d, i) => (
            <div key={i} className="flex-1 text-center text-[9px] text-gray-400 dark:text-gray-500">
              {d === 1 ? '1天' : d === 90 ? '90天' : `${d}天`}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 text-center">
          模拟记忆保留率（每格代表 10%）
        </p>
      </div>
    </div>
  );
}

/** 复习间隔分布 */
function ReviewDistribution({ cards }: { cards: { sm2: { interval: number; repetitions: number } }[] }) {
  // Group by stage
  const stages = [
    { key: 'new', label: '新卡片', min: 0, max: 0, color: 'bg-blue-500' },
    { key: 'short', label: '短期 (1-3天)', min: 1, max: 3, color: 'bg-orange-500' },
    { key: 'mid', label: '中期 (4-21天)', min: 4, max: 21, color: 'bg-yellow-500' },
    { key: 'long', label: '长期 (22-90天)', min: 22, max: 90, color: 'bg-green-500' },
    { key: 'stable', label: '稳定 (>90天)', min: 91, max: Infinity, color: 'bg-purple-500' },
  ];

  const counts = stages.map((s) => ({
    ...s,
    count: cards.filter((c) => c.sm2.repetitions > 0 ? c.sm2.interval >= s.min && c.sm2.interval <= s.max : s.key === 'new').length,
  }));
  const maxCount = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        复习阶段分布
      </h3>
      <div className="space-y-1.5">
        {counts.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 w-24">{s.label}</span>
            <div className="flex-1 h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className={`h-full rounded-full ${s.color} transition-all duration-700`}
                style={{ width: `${(s.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-6 text-right">
              {s.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatsDashboard() {
  const { state, dispatch, totalDue } = useAppContext();
  const cards = Object.values(state.cardsById);
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
              label="今日到期"
              value={totalDue}
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

          {/* Review Distribution */}
          <ReviewDistribution cards={cards} />

          {/* Ebbinghaus Curve */}
          <EbbinghausCurve />

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
          {/* Import / Export */}
          <ImportExport />
        </div>
      </div>
    </div>
  );
}

function ImportExport() {
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [syncMode, setSyncMode] = useState<'checking' | 'file' | 'fallback'>('checking');
  const [storagePath, setStoragePath] = useState<string | null>(null);

  // Check storage mode on mount
  useEffect(() => {
    (async () => {
      const mod = await import('../utils/nativeStorage');
      if (mod.isTauri()) {
        setSyncMode('file');
        mod.getDataPath().then(setStoragePath);
      } else {
        setSyncMode('fallback');
      }
    })();
  }, []);

  const handleConnect = async () => {
    const { pickDataFile } = await import('../utils/fileStorage');
    const result = await pickDataFile();
    if (result?.data) {
      for (const [key, value] of Object.entries(result.data.progress)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
      localStorage.setItem('fc-settings', JSON.stringify(result.data.settings));
      localStorage.setItem('fc-stats', JSON.stringify(result.data.stats));
      setSyncMode('file');
      window.location.reload();
    }
  };

  const handleCreateNew = async () => {
    const { createDataFile, loadFromLocalStorage } = await import('../utils/fileStorage');
    const data = loadFromLocalStorage();
    await createDataFile(data);
    setSyncMode('file');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await importProgress(file);
    setMsg({ type: result.success ? 'success' : 'error', text: result.message });
    if (fileRef.current) fileRef.current.value = '';
  };

  const isFileMode = syncMode === 'file';

  return (
    <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        数据存储
      </h3>

      {/* Storage status */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        {isFileMode ? (
          <p>
            📁 存储模式：<strong>本地文件</strong>
            {storagePath && <span className="block mt-0.5 text-[11px] break-all opacity-75">{storagePath}</span>}
            <br />数据保存在固定路径，同步该文件即可跨设备使用。
          </p>
        ) : (
          <p>
            💻 存储模式：<strong>浏览器缓存</strong>
            <br />数据存在浏览器 localStorage 里，清缓存会丢失。
          </p>
        )}
      </div>

      {/* File storage controls — only in browser mode */}
      {!isFileMode && (
        <div className="flex flex-col gap-2">
          <button
            onClick={handleConnect}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            连接已有数据文件
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            创建新数据文件
          </button>
        </div>
      )}

      {/* Legacy export/import */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
          兼容方式：导出/导入 JSON 备份文件
        </p>
        <div className="flex gap-2">
          <button
            onClick={exportProgress}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            导出 JSON
          </button>

          <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            导入 JSON
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {msg && (
        <div
          className={`text-xs p-2 rounded-lg ${
            msg.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}
        >
          {msg.text}
        </div>
      )}
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
