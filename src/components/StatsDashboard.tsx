// ============================================================
// src/components/StatsDashboard.tsx — 学习统计面板
// ============================================================

import { useState, useRef, useEffect, useMemo } from 'react';
import { X, BookOpen, CheckCircle, Clock, Zap, TrendingUp, Download, Upload, ChevronDown } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';
import { useAppContext } from '../context/AppContext';
import { DIFFICULTY_LABEL, CATEGORIES } from '../constants';
import { exportProgress, importProgress } from '../utils/backup';
import {
  loadReviewLogs,
  getAllLogs,
  getTodayReviewed,
  getStreak,
  getRecentAccuracy,
  getAverageRating,
  getDifficultCards,
  isReallyMastered,
} from '../utils/reviewLogs';
import TagRadar from './TagRadar';
import { loadCustomCards, loadCustomDecks, getModuleDailyLimit, setModuleDailyLimit } from '../utils/customDecks';
import { leetcodeHot100 } from '../data/leetcode-hot100';
import { statisticsCards } from '../data/statistics';
import { machineLearningCards } from '../data/machine-learning';
import { deepLearningCards } from '../data/deep-learning';
import { llmCards } from '../data/llm';
import { agentCards } from '../data/agent';
import { jargonCards } from '../data/jargon';
import { workplaceCards } from '../data/workplace';
import { loadProgress } from '../utils/storage';
import type { Category, FlashCard } from '../types';

/** 从所有数据源加载全部卡片（带进度合并） */
function loadAllCards(): FlashCard[] {
  const sources: [Category, FlashCard[]][] = [
    ['leetcode', leetcodeHot100 as FlashCard[]],
    ['statistics', statisticsCards as FlashCard[]],
    ['machine-learning', machineLearningCards as FlashCard[]],
    ['deep-learning', deepLearningCards as FlashCard[]],
    ['llm', llmCards as FlashCard[]],
    ['agent', agentCards as FlashCard[]],
    ['jargon', jargonCards as FlashCard[]],
    ['workplace', workplaceCards as FlashCard[]],
  ];
  const allCards: FlashCard[] = [];
  for (const [category, cards] of sources) {
    const progress = loadProgress(category);
    for (const card of cards) {
      const sm2 = progress.sm2[card.id] ? { ...card.sm2, ...progress.sm2[card.id] } : card.sm2;
      allCards.push({ ...card, sm2, favorited: progress.favorited.includes(card.id) });
    }
  }
  for (const deck of loadCustomDecks()) {
    allCards.push(...loadCustomCards(deck.id));
  }
  return allCards;
}

/** 复习间隔分布 */
function TagMasterySection({ cards }: { cards: FlashCard[] }) {
  const tagScores = useMemo(() => {
    const tagMap = new Map<string, { total: number; easeSum: number; lapseSum: number; intervalSum: number }>();
    for (const card of cards) {
      const tags = card.tags || [];
      const sm2 = card.sm2;
      if (!sm2 || sm2.state === 'new') continue;
      for (const tag of tags) {
        const entry = tagMap.get(tag) || { total: 0, easeSum: 0, lapseSum: 0, intervalSum: 0 };
        entry.total++;
        entry.easeSum += sm2.easeFactor;
        entry.lapseSum += sm2.lapses;
        entry.intervalSum += Math.min(sm2.interval, 30);
        tagMap.set(tag, entry);
      }
    }
    const scores: { tag: string; score: number }[] = [];
    for (const [tag, entry] of tagMap) {
      const avgEase = entry.easeSum / entry.total;
      const avgLapses = entry.lapseSum / entry.total;
      const avgInterval = entry.intervalSum / entry.total;
      scores.push({ tag, score: avgEase - avgLapses * 0.5 - (30 - avgInterval) * 0.02 });
    }
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, 8);
  }, [cards]);
  if (tagScores.length < 3) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">标签掌握度</h4>
      <TagRadar tagScores={tagScores} size={220} />
    </div>
  );
}


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

interface Props {
  category?: string;
}

function getNewCount(cards: FlashCard[]) {
  return cards.filter((c) => !c.sm2.state || c.sm2.state === 'new').length;
}

function getDueCount(cards: FlashCard[]) {
  const now = Date.now();
  return cards.filter((c) => c.sm2.state && c.sm2.state !== 'new' && c.sm2.nextReview <= now).length;
}

function getTodayNewAllowance(cards: FlashCard[], category?: string) {
  if (category) return Math.min(getNewCount(cards), getModuleDailyLimit(category));

  const byModule = new Map<string, number>();
  for (const card of cards) {
    if (card.sm2.state && card.sm2.state !== 'new') continue;
    byModule.set(card.category, (byModule.get(card.category) || 0) + 1);
  }

  let total = 0;
  for (const [moduleId, count] of byModule) {
    total += Math.min(count, getModuleDailyLimit(moduleId));
  }
  return total;
}

export default function StatsDashboard({ category }: Props) {
  const { state, dispatch } = useAppContext();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const cardVersion = Object.values(state.cardsById)
    .map((card) => `${card.id}:${card.sm2.state}:${card.sm2.interval}:${card.sm2.lapses}:${card.sm2.nextReview}`)
    .join('|');
  const allCardsForDistribution = useMemo(() => {
    void cardVersion;
    const cards = loadAllCards();
    return category ? cards.filter((c) => c.category === category) : cards;
  }, [cardVersion, category]);

  const stats = useMemo(() => {
    void cardVersion;
    const allCards = loadAllCards();
    const filteredCards = category ? allCards.filter((c) => c.category === category) : allCards;
    const allLogs = getAllLogs();
    const mastered = filteredCards.filter((c) => isReallyMastered(c.sm2.interval, c.sm2.lapses)).length;
    const difficultIds = getDifficultCards(loadReviewLogs(), filteredCards.map((c) => c.id));
    const newCount = getNewCount(filteredCards);
    const dueCount = getDueCount(filteredCards);
    return {
      total: filteredCards.length,
      mastered,
      pending: filteredCards.length - mastered,
      masteredPercent: filteredCards.length > 0 ? Math.round((mastered / filteredCards.length) * 100) : 0,
      newCount,
      dueCount,
      todayNewAllowance: getTodayNewAllowance(filteredCards, category),
      todayReviewed: getTodayReviewed(allLogs),
      streak: getStreak(allLogs),
      recentAccuracy: getRecentAccuracy(allLogs),
      avgRating: getAverageRating(allLogs),
      difficultCount: difficultIds.length,
      byDifficulty: {} as Record<string, { total: number; mastered: number }>,
    };
  }, [cardVersion, category]); // re-evaluate when cardsById changes (triggered by any rating)

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
            学习统计
          </h2>
          <div className="flex items-center gap-1">
            <DarkModeToggle />
            <button
              onClick={() => dispatch({ type: 'TOGGLE_STATS' })}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Overview cards */}
          <div className="grid grid-cols-3 gap-2">
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
              label="到期复习"
              value={stats.dueCount}
              color="text-orange-600 dark:text-orange-400"
              bg="bg-orange-50 dark:bg-orange-900/30"
            />
            <StatBox
              icon={<BookOpen className="w-4 h-4" />}
              label="今日可学新卡"
              value={stats.todayNewAllowance}
              color="text-blue-600 dark:text-blue-400"
              bg="bg-blue-50 dark:bg-blue-900/30"
            />
            <StatBox
              icon={<Zap className="w-4 h-4" />}
              label="连续天数"
              value={stats.streak}
              color="text-purple-600 dark:text-purple-400"
              bg="bg-purple-50 dark:bg-purple-900/30"
            />
            <StatBox
              icon={<TrendingUp className="w-4 h-4" />}
              label="7日正确率"
              value={stats.recentAccuracy}
              suffix="%"
              color="text-emerald-600 dark:text-emerald-400"
              bg="bg-emerald-50 dark:bg-emerald-900/30"
            />
            <StatBox
              icon={<Clock className="w-4 h-4" />}
              label="今日复习"
              value={stats.todayReviewed}
              color="text-cyan-600 dark:text-cyan-400"
              bg="bg-cyan-50 dark:bg-cyan-900/30"
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
          <ReviewDistribution cards={allCardsForDistribution} />

          {/* Tag Radar */}
          <TagMasterySection cards={allCardsForDistribution} />

          {/* Review queue summary */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
            <div className="flex justify-between">
              <span>到期复习</span>
              <span className="font-medium text-orange-600">{stats.dueCount} 张</span>
            </div>
            <div className="flex justify-between">
              <span>{category ? `今日新学（上限 ${getModuleDailyLimit(category)}）` : '今日新学（按模块上限）'}</span>
              <span className="font-medium text-blue-600">{stats.todayNewAllowance} / {stats.newCount} 张</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-600">
              <span>今日总计</span>
              <span className="font-bold">{stats.dueCount + stats.todayNewAllowance} 张</span>
            </div>
          </div>

          {/* Average rating + difficult */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">平均评分</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {stats.avgRating > 0 ? `${stats.avgRating} / 5` : '暂无'}
              </span>
            </div>
            {stats.difficultCount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-red-500 dark:text-red-400">薄弱卡片</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {stats.difficultCount} 张
                </span>
              </div>
            )}
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
          {/* Settings */}
          <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                每日新卡上限
              </h3>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
            </button>
            {settingsOpen && (<>
            {category ? (
              <ModuleLimitSlider moduleId={category} label={CATEGORIES.find((cat) => cat.key === category)?.label || loadCustomDecks().find((d) => d.id === category)?.name || category} />
            ) : (
              <>
                {CATEGORIES.map((cat) => (
                  <ModuleLimitSlider key={cat.key} moduleId={cat.key} label={cat.label} />
                ))}
                {loadCustomDecks().map((d) => (
                  <ModuleLimitSlider key={d.id} moduleId={d.id} label={d.name} />
                ))}
              </>
            )}
            <p className="text-[10px] text-gray-400">
              {category ? '当前模块独立设置，学习新卡时生效' : '首页统计可调整每个模块的新卡上限'}
            </p>
            </>)}
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
  icon, label, value, suffix, color, bg,
}: {
  icon: React.ReactNode; label: string; value: number;
  suffix?: string; color: string; bg: string;
}) {
  return (
    <div className={`rounded-xl p-2.5 ${bg}`}>
      <div className={`mb-1 ${color}`}>{icon}</div>
      <p className={`text-lg font-bold ${color}`}>{value}{suffix || ''}</p>
      <p className="text-[10px] text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function ModuleLimitSlider({ moduleId, label }: { moduleId: string; label: string }) {
  const [limit, setLimit] = useState(() => getModuleDailyLimit(moduleId));
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500 w-24 truncate">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min="1"
          max="100"
          value={limit}
          onChange={(e) => { const v = Number(e.target.value); setLimit(v); setModuleDailyLimit(moduleId, v); }}
          className="w-20 h-1.5 accent-primary"
        />
        <span className="text-xs font-bold text-primary w-6 text-right">{limit}</span>
      </div>
    </div>
  );
}
