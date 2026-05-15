// ============================================================
// src/components/HomePage.tsx — 首页模块选择
// ============================================================

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { X, BarChart3, ChevronRight, Plus } from 'lucide-react';
import appIcon from '../../icon.png';
import { CATEGORIES } from '../constants';
import { useAppContext } from '../context/AppContext';
import { loadCustomDecks, createCustomDeck, setModuleDailyLimit, getModuleDailyLimit, deleteCustomDeck, type CustomDeck } from '../utils/customDecks';
import StatsDashboard from './StatsDashboard';
import type { Category } from '../types';

const TOTAL_MAP: Record<string, number> = {
  leetcode: 100, statistics: 199, 'machine-learning': 171, 'deep-learning': 32,
  llm: 37, agent: 26, jargon: 45, workplace: 76,
};

interface Props {
  onEnterStudy: (category: string) => void;
}

interface ModuleSlot {
  key: string;
  label: string;
  isCustom?: boolean;
  isCreate?: boolean;
  isPlaceholder?: boolean;
}

export default function HomePage({ onEnterStudy }: Props) {
  const { dispatch, dueCountByCategory } = useAppContext();
  const [customDecks, setCustomDecks] = useState<CustomDeck[]>(() => loadCustomDecks());
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLimit, setNewLimit] = useState(20);
  const [page, setPage] = useState(0);
  const [pageDirection, setPageDirection] = useState<1 | -1>(1);

  const allModules = useMemo<ModuleSlot[]>(() => {
    const builtIn = CATEGORIES.map((cat) => ({ key: cat.key, label: cat.label, isCustom: false }));
    const custom = customDecks.map((d) => ({ key: d.id, label: d.name, isCustom: true }));
    return [...builtIn, ...custom];
  }, [customDecks]);

  const PER_PAGE = 6;
  const moduleSlots = useMemo<ModuleSlot[]>(
    () => [...allModules, { key: 'create-module', label: '新建模块', isCreate: true }],
    [allModules],
  );
  const totalPages = Math.ceil(moduleSlots.length / PER_PAGE);
  const pageModules = moduleSlots.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const slots = [...pageModules];
  while (slots.length < PER_PAGE) {
    slots.push({ key: `placeholder-${page}-${slots.length}`, label: '', isPlaceholder: true });
  }

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
    if (Math.abs(diff) > 50) { if (diff > 0) goNext(); else goPrev(); }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const primaryDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
    if (Math.abs(primaryDelta) > 28) {
      const now = Date.now();
      if (now - lastWheelAt.current < 460) return;
      lastWheelAt.current = now;
      if (primaryDelta > 0) goNext(); else goPrev();
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  const dragRef = useRef({ down: false, startX: 0, lastOffset: 0 });
  const handleMouseDown = (e: React.MouseEvent) => { dragRef.current = { down: true, startX: e.clientX, lastOffset: 0 }; };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.down) return;
    const diff = e.clientX - dragRef.current.startX;
    if (Math.abs(diff) > 5 && Math.abs(diff - dragRef.current.lastOffset) > 2) {
      dragRef.current.lastOffset = diff;
      if (diff < -60) { dragRef.current.down = false; goNext(); }
      else if (diff > 60) { dragRef.current.down = false; goPrev(); }
    }
  };
  const handleMouseUp = () => { dragRef.current.down = false; };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const deck = createCustomDeck(newName.trim(), '');
    setModuleDailyLimit(deck.id, newLimit);
    setCustomDecks(loadCustomDecks());
    setShowCreate(false);
    setNewName('');
    setNewLimit(20);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex items-center justify-center">
      <div className="homepage-shell max-w-xl w-full px-4 py-8 select-none relative" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>

        {/* Stats button — top right */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_STATS' })}
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-blue-500 hover:border-blue-200 transition-colors shadow-sm"
        >
          <BarChart3 size={18} />
        </button>

        {/* Header */}
        <div className="homepage-header flex items-center justify-center gap-4">
          <img src={appIcon} alt="面经闪卡" className="h-14 w-14 rounded-2xl shadow-sm shrink-0" />
          <div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              面经闪卡
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              都是同龄人我原本没想高效学习
            </p>
          </div>
        </div>

        {/* Module list */}
        <div
          key={page}
          className={`flex flex-col items-center gap-2.5 homepage-page ${
            pageDirection > 0 ? 'homepage-page-next' : 'homepage-page-prev'
          }`}
        >
          {slots.map((mod) => {
            if (mod.isPlaceholder) {
              return <div key={mod.key} className="homepage-module-card homepage-module-card-empty" aria-hidden="true" />;
            }

            if (mod.isCreate) {
              return (
                <button
                  key={mod.key}
                  onClick={() => setShowCreate(true)}
                  className="flex items-center justify-center w-3/4 max-w-sm rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-transparent px-4 py-3 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 active:scale-[0.98] transition-all"
                >
                  <Plus className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-400">新建模块</span>
                </button>
              );
            }

            if (mod.isCustom) {
              return (
                <button
                  key={mod.key}
                  onClick={() => onEnterStudy(mod.key)}
                  className="flex items-center w-3/4 max-w-sm rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 shadow-sm hover:border-blue-300 hover:shadow-md active:scale-[0.98] transition-all group relative"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteCustomDeck(mod.key); setCustomDecks(loadCustomDecks()); }}
                    className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-opacity"
                    title="删除模块"
                  >
                    <X className="w-3 h-3 text-red-400" />
                  </button>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mr-4">{mod.label}</h3>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-auto mr-3">自定义题库</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
                </button>
              );
            }

            const cat = CATEGORIES.find((c) => c.key === mod.key as Category)!;
            const due = dueCountByCategory[cat.key] ?? 0;
            const limit = getModuleDailyLimit(cat.key);
            const total = TOTAL_MAP[cat.key] ?? 0;

            return (
              <button
                key={cat.key}
                onClick={() => onEnterStudy(cat.key)}
                className="flex items-center w-3/4 max-w-sm rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 shadow-sm hover:border-blue-300 hover:shadow-md active:scale-[0.98] transition-all group"
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mr-4">{cat.label}</h3>
                <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400 ml-auto mr-3">
                  <span>新卡 <span className="font-semibold text-blue-500">{limit}</span></span>
                  <span>准备复习 <span className="font-semibold text-orange-500">{due}</span></span>
                  <span>共 <span className="font-semibold text-gray-600 dark:text-gray-300">{total}</span> 张</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0 group-hover:text-blue-500 transition-colors" />
              </button>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="homepage-pagination flex items-center justify-center gap-3">
          <button onClick={goPrev} disabled={page === 0} className="text-gray-300 dark:text-gray-600 disabled:opacity-20 hover:text-gray-500">◀</button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => goToPage(i)}
              className={`w-2 h-2 rounded-full transition-colors ${i === page ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            />
          ))}
          <button onClick={goNext} disabled={page >= totalPages - 1} className="text-gray-300 dark:text-gray-600 disabled:opacity-20 hover:text-gray-500">▶</button>
        </div>
      </div>

      {/* Create dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold dark:text-gray-100">新建模块</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
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
                className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-medium disabled:opacity-30 hover:bg-blue-600 transition-colors">
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
