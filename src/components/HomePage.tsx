// ============================================================
// src/components/HomePage.tsx — 首页模块选择
// ============================================================

import { useState, useMemo, useRef, useEffect } from 'react';
import { BookOpen, X } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { useAppContext } from '../context/AppContext';
import { loadCustomDecks, createCustomDeck, setModuleDailyLimit, type CustomDeck } from '../utils/customDecks';
import StatsDashboard from './StatsDashboard';
import { loadProgress } from '../utils/storage';

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

export default function HomePage({ onEnterStudy }: Props) {
  const { dispatch, dueCountByCategory } = useAppContext();
  const [customDecks, setCustomDecks] = useState<CustomDeck[]>(() => loadCustomDecks());
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📦');
  const [newLimit, setNewLimit] = useState(20);
  const [page, setPage] = useState(0);

  // Build all modules list
  const allModules = useMemo(() => {
    const builtIn = CATEGORIES.map((cat) => ({ ...cat, isCustom: false }));
    const custom = customDecks.map((d) => ({
      key: d.id as any,
      label: d.name,
      icon: null as any,
      emoji: d.icon,
      isCustom: true,
    }));
    return [...builtIn, ...custom];
  }, [customDecks]);

  const PER_PAGE = 6;
  const totalPages = Math.ceil((allModules.length + 1) / PER_PAGE); // +1 for create button
  const pageModules = allModules.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  // Fill remaining slots with placeholder create cards
  const slots = [...pageModules];
  while (slots.length < PER_PAGE) {
    slots.push({ key: `placeholder-${slots.length}`, label: '', icon: null, isPlaceholder: true } as any);
  }

  // Touch + wheel swipe
  const touchStartX = useRef(0);

  const goNext = () => { if (page < totalPages - 1) setPage(p => p + 1); };
  const goPrev = () => { if (page > 0) setPage(p => p - 1); };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? goNext() : goPrev();
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > 20 || (e.shiftKey && Math.abs(e.deltaY) > 20)) {
      (e.deltaX > 0 || e.deltaY > 0) ? goNext() : goPrev();
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
  }, [page, totalPages]);

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
      <div className="max-w-xl w-full px-4 py-8 min-h-screen flex flex-col justify-center" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onWheel={handleWheel}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            📚 面经闪卡
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            选择一个模块开始学习
          </p>
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 min-h-[260px]">
          {slots.map((mod) => {
            if ((mod as any).isPlaceholder) {
              return (
                <button
                  key={mod.key}
                  onClick={() => setShowCreate(true)}
                  className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-primary/30 hover:text-primary transition-colors"
                >
                  <span className="text-3xl">➕</span>
                  <span className="text-sm font-medium">新建模块</span>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">
                    <div>待自定义</div>
                  </div>
                </button>
              );
            }
            if (mod.isCustom) {
              return (
                <button
                  key={mod.key}
                  onClick={() => onEnterStudy(mod.key)}
                  className="group relative flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:shadow-md transition-all active:scale-95"
                >
                  <span className="text-3xl">{(mod as any).emoji || '📦'}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center">{mod.label}</span>
                  <span className="text-[10px] text-gray-400">自定义</span>
                </button>
              );
            }
            const cat = CATEGORIES.find((c) => c.key === mod.key)!;
            const due = dueCountByCategory[cat.key] ?? 0;
            const progress = loadProgress(cat.key);
            const newCount = Object.values(progress.sm2).filter((s) => !s || s.state === 'new').length;
            return (
              <button
                key={cat.key}
                onClick={() => onEnterStudy(cat.key)}
                className="group relative flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:shadow-md transition-all active:scale-95"
              >
                <span className="text-3xl">{ICONS[cat.key] || '📚'}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.label}</span>
                <div className="text-[10px] text-gray-400 dark:text-gray-500">
                  <div>今日待学习：<span className="text-blue-500 font-medium">{newCount}</span> 张</div>
                  <div>今日待复习：<span className="text-orange-500 font-medium">{due}</span> 张</div>
                </div>
              </button>
            );
          })}

        </div>

                {/* Pagination dots + arrows */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={goPrev} disabled={page === 0} className="text-gray-300 dark:text-gray-600 disabled:opacity-20 hover:text-gray-500">
            ◀
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
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
            onClick={() => {}}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            全部复习
          </button>
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
