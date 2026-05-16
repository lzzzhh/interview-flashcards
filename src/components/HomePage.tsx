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
import RecommendBar from './RecommendBar';
import type { Category } from '../types';

const TOTAL_MAP: Record<string, number> = {
  leetcode: 100, statistics: 199, 'machine-learning': 171, 'deep-learning': 32,
  llm: 37, agent: 26, jargon: 45, workplace: 76,
};

interface Props {
  onEnterStudy: (category: Category) => void;
}

interface ModuleSlot {
  key: string;
  label: string;
  isCustom?: boolean;
  isCreate?: boolean;
  isPlaceholder?: boolean;
}

interface HomeModuleCardProps {
  label: string;
  total?: number;
  due?: number;
  limit?: number;
  isCustom?: boolean;
  onClick: () => void;
  onDelete?: () => void;
}

function HomeModuleCard({ label, total = 0, due = 0, limit = 0, isCustom, onClick, onDelete }: HomeModuleCardProps) {
  return (
    <button
      onClick={onClick}
      className="homepage-module-card group text-left"
    >
      {onDelete && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-300 opacity-0 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-red-900/60 dark:hover:bg-red-950/30"
          title="删除模块"
        >
          <X className="h-3.5 w-3.5" />
        </span>
      )}

      <div className="flex w-full items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold leading-tight text-gray-900 dark:text-gray-100">{label}</h3>
          <p className="mt-1 truncate text-[11px] font-medium text-gray-400 dark:text-gray-500">
            {isCustom ? '自定义题库' : `共 ${total} 张卡片`}
          </p>
        </div>
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-blue-500 dark:text-gray-600" />
      </div>

      <div className="mt-auto grid w-full grid-cols-2 gap-2 pt-3 text-[11px]">
        <div className="rounded-lg bg-blue-50 px-2 py-1.5 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
          <span className="block text-[10px] text-blue-400 dark:text-blue-500">新卡</span>
          <span className="font-semibold tabular-nums">{isCustom ? '--' : limit}</span>
        </div>
        <div className="rounded-lg bg-orange-50 px-2 py-1.5 text-orange-600 dark:bg-orange-950/30 dark:text-orange-300">
          <span className="block text-[10px] text-orange-400 dark:text-orange-500">复习</span>
          <span className="font-semibold tabular-nums">{isCustom ? '--' : due}</span>
        </div>
      </div>
    </button>
  );
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
    <div className="flex min-h-screen items-center justify-center bg-[#F6F8FB] transition-colors dark:bg-gray-950">
      <div className="homepage-shell relative w-full max-w-md select-none px-4 py-8" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>

        {/* Stats button — top right */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_STATS' })}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-900/60"
          title="学习统计"
        >
          <BarChart3 size={18} />
        </button>

        {/* Header */}
        <div className="homepage-header flex items-center justify-center gap-3">
          <img src={appIcon} alt="面经闪卡" className="h-[52px] w-[52px] shrink-0 rounded-2xl shadow-sm" />
          <div className="min-w-0">
            <h1 className="text-[25px] font-extrabold tracking-normal text-gray-950 dark:text-gray-50">
              面经闪卡
            </h1>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              都是同龄人我原本没想高效学习
            </p>
          </div>
        </div>

        <RecommendBar />

        {/* Module list */}
        <div
          key={page}
          className={`homepage-module-grid homepage-page ${
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
                  className="homepage-module-card-dashed"
                >
                  <Plus className="mb-2 h-5 w-5 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">新建模块</span>
                  <span className="mt-1 text-[11px] text-gray-400">导入或记录新题库</span>
                </button>
              );
            }

            if (mod.isCustom) {
              return (
                <HomeModuleCard
                  key={mod.key}
                  label={mod.label}
                  isCustom
                  onClick={() => onEnterStudy(mod.key)}
                  onDelete={() => {
                    deleteCustomDeck(mod.key);
                    setCustomDecks(loadCustomDecks());
                  }}
                />
              );
            }

            const cat = CATEGORIES.find((c) => c.key === mod.key as Category)!;
            const due = dueCountByCategory[cat.key] ?? 0;
            const limit = getModuleDailyLimit(cat.key);
            const total = TOTAL_MAP[cat.key] ?? 0;

            return (
              <HomeModuleCard
                key={cat.key}
                label={cat.label}
                total={total}
                due={due}
                limit={limit}
                onClick={() => onEnterStudy(cat.key)}
              />
            );
          })}
        </div>

        {/* Pagination */}
        <div className="homepage-pagination flex items-center justify-center gap-3">
          <button onClick={goPrev} disabled={page === 0} className="flex h-7 w-7 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-white hover:text-gray-500 disabled:opacity-20 dark:text-gray-600 dark:hover:bg-gray-900">‹</button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => goToPage(i)}
              className={`h-2 rounded-full transition-all ${i === page ? 'w-5 bg-blue-500' : 'w-2 bg-gray-300 dark:bg-gray-700'}`}
            />
          ))}
          <button onClick={goNext} disabled={page >= totalPages - 1} className="flex h-7 w-7 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-white hover:text-gray-500 disabled:opacity-20 dark:text-gray-600 dark:hover:bg-gray-900">›</button>
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
