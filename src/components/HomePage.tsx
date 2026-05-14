// ============================================================
// src/components/HomePage.tsx — 首页模块选择
// ============================================================

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { useAppContext } from '../context/AppContext';
import { loadCustomDecks, createCustomDeck, setModuleDailyLimit, type CustomDeck } from '../utils/customDecks';
import StatsDashboard from './StatsDashboard';
import { loadProgress } from '../utils/storage';
import type { Category } from '../types';

const ICONS: Record<string, string> = {
  leetcode: '🔥',
  statistics: '📊',
  'machine-learning': '🤖',
  llm: '🧠',
  jargon: '💬',
  workplace: '👔',
};

interface Props {
  onEnterStudy: (category: string) => void;
}

interface ModuleSlot {
  key: string;
  label: string;
  emoji?: string;
  isCustom?: boolean;
  isCreate?: boolean;
  isPlaceholder?: boolean;
}

export default function HomePage({ onEnterStudy }: Props) {
  const { dispatch, dueCountByCategory } = useAppContext();
  const [customDecks, setCustomDecks] = useState<CustomDeck[]>(() => loadCustomDecks());
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📦');
  const [newLimit, setNewLimit] = useState(20);
  const [page, setPage] = useState(0);
  const [pageDirection, setPageDirection] = useState<1 | -1>(1);

  // Build all modules list
  const allModules = useMemo<ModuleSlot[]>(() => {
    const builtIn = CATEGORIES.map((cat) => ({
      key: cat.key,
      label: cat.label,
      isCustom: false,
    }));
    const custom = customDecks.map((d) => ({
      key: d.id,
      label: d.name,
      emoji: d.icon,
      isCustom: true,
    }));
    return [...builtIn, ...custom];
  }, [customDecks]);

  const PER_PAGE = 6;
  const moduleSlots = useMemo<ModuleSlot[]>(
    () => [
      ...allModules,
      { key: 'create-module', label: '新建模块', emoji: '➕', isCreate: true },
    ],
    [allModules],
  );
  const totalPages = Math.ceil(moduleSlots.length / PER_PAGE);
  const pageModules = moduleSlots.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const slots = [...pageModules];
  while (slots.length < PER_PAGE) {
    slots.push({ key: `placeholder-${page}-${slots.length}`, label: '', isPlaceholder: true });
  }

  // Touch + wheel swipe
  const touchStartX = useRef(0);
  const lastWheelAt = useRef(0);

  const goToPage = useCallback((nextPage: number) => {
    const clamped = Math.max(0, Math.min(totalPages - 1, nextPage));
    if (clamped === page) return;
    setPageDirection(clamped > page ? 1 : -1);
    setPage(clamped);
  }, [page, totalPages]);

  const goNext = useCallback(() => goToPage(page + 1), [goToPage, page]);
  const goPrev = useCallback(() => goToPage(page - 1), [goToPage, page]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const primaryDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
    if (Math.abs(primaryDelta) > 28) {
      const now = Date.now();
      if (now - lastWheelAt.current < 460) return;
      lastWheelAt.current = now;
      if (primaryDelta > 0) goNext();
      else goPrev();
    }
  };

  // Keyboard arrows
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const deck = createCustomDeck(newName.trim(), newIcon || '📦');
    setModuleDailyLimit(deck.id, newLimit);
    setCustomDecks(loadCustomDecks());
    setShowCreate(false);
    setNewName('');
    setNewLimit(20);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex items-center justify-center">
      <div className="homepage-shell max-w-xl w-full px-4 py-8" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onWheel={handleWheel}>
        {/* Header */}
        <div className="homepage-header text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            📚 面经闪卡
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            选择一个模块开始学习
          </p>
        </div>

        {/* Module grid */}
        <div
          key={page}
          className={`homepage-module-grid homepage-page ${
            pageDirection > 0 ? 'homepage-page-next' : 'homepage-page-prev'
          }`}
        >
          {slots.map((mod) => {
            if (mod.isPlaceholder) {
              return (
                <div key={mod.key} className="homepage-module-card homepage-module-card-empty" aria-hidden="true">
                  <span className="text-3xl opacity-0">📚</span>
                  <span className="w-full truncate text-center text-sm font-medium opacity-0">占位</span>
                  <div className="text-center text-[10px] leading-4 opacity-0">
                    <div>占位</div>
                    <div>占位</div>
                  </div>
                </div>
              );
            }
            if (mod.isCreate) {
              return (
                <button
                  key={mod.key}
                  onClick={() => setShowCreate(true)}
                  className="homepage-module-card group border-dashed text-gray-500 dark:text-gray-400 hover:border-primary/50 hover:text-primary hover:shadow-md active:scale-95"
                >
                  <span className="text-3xl">➕</span>
                  <span className="w-full truncate text-center text-sm font-medium">新建模块</span>
                  <div className="text-center text-[10px] leading-4 text-gray-400 dark:text-gray-500">
                    <div>创建自定义题库</div>
                    <div>设置每日新卡</div>
                  </div>
                </button>
              );
            }
            if (mod.isCustom) {
              return (
                <button
                  key={mod.key}
                  onClick={() => onEnterStudy(mod.key)}
                  className="homepage-module-card group hover:border-primary/50 hover:shadow-md active:scale-95"
                >
                  <span className="text-3xl">{mod.emoji || '📦'}</span>
                  <span className="w-full truncate text-center text-sm font-medium text-gray-700 dark:text-gray-300">{mod.label}</span>
                  <div className="text-center text-[10px] leading-4 text-gray-400 dark:text-gray-500">
                    <div>自定义题库</div>
                    <div>开始学习</div>
                  </div>
                </button>
              );
            }
            const cat = CATEGORIES.find((c) => c.key === mod.key as Category)!;
            const due = dueCountByCategory[cat.key] ?? 0;
            const progress = loadProgress(cat.key);
            const newCount = Object.values(progress.sm2).filter((s) => !s || s.state === 'new').length;
            return (
              <button
                key={cat.key}
                onClick={() => onEnterStudy(cat.key)}
                className="homepage-module-card group hover:border-primary/50 hover:shadow-md active:scale-95"
              >
                <span className="text-3xl">{ICONS[cat.key] || '📚'}</span>
                <span className="w-full truncate text-center text-sm font-medium text-gray-700 dark:text-gray-300">{cat.label}</span>
                <div className="text-center text-[10px] leading-4 text-gray-400 dark:text-gray-500">
                  <div>今日待学习：<span className="text-blue-500 font-medium">{newCount}</span> 张</div>
                  <div>今日待复习：<span className="text-orange-500 font-medium">{due}</span> 张</div>
                </div>
              </button>
            );
          })}

        </div>

        {/* Pagination dots + arrows */}
        <div className="homepage-pagination flex items-center justify-center gap-3">
          <button onClick={goPrev} disabled={page === 0} className="text-gray-300 dark:text-gray-600 disabled:opacity-20 hover:text-gray-500">
            ◀
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === page ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
          <button onClick={goNext} disabled={page >= totalPages - 1} className="text-gray-300 dark:text-gray-600 disabled:opacity-20 hover:text-gray-500">
            ▶
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex justify-center gap-3 mt-6">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_STATS' })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            📊 学习统计
          </button>
        </div>
      </div>

      {/* Create dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold dark:text-gray-100">新建模块</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">图标</label>
                <input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} maxLength={2}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 text-xl text-center" />
              </div>
              <div>
                <label className="text-xs text-gray-500">模块名称</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="例如：风控算法面试"
                  className="w-full mt-0.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()} autoFocus />
              </div>
              <div>
                <label className="text-xs text-gray-500">每日新卡上限</label>
                <input type="number" min="1" max="100" value={newLimit} onChange={(e) => setNewLimit(Number(e.target.value))}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 text-sm" />
              </div>
              <button onClick={handleCreate} disabled={!newName.trim()}
                className="w-full py-2.5 rounded-xl bg-primary text-white font-medium disabled:opacity-30">
                创建模块
              </button>
            </div>
          </div>
        </div>
      )}

      <StatsDashboard />
    </div>
  );
}
