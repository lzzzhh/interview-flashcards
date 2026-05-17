// ============================================================
// src/components/HomePage.tsx — 首页重设计
// ============================================================

import { useState, useMemo, useCallback } from 'react';
import { ChevronRight, Home, Layers, BarChart3, User } from 'lucide-react';
import appIcon from '../../icon.png';
import { useAppContext } from '../context/AppContext';
import { CATEGORIES } from '../constants';
import { getStreak, loadReviewLogs } from '../utils/reviewLogs';
import { getModuleDailyLimit } from '../utils/customDecks';
import { loadProgress } from '../utils/storage';
import StatsDashboard from './StatsDashboard';
import type { Category } from '../types';

interface Props {
  onEnterStudy: (category: Category) => void;
  onShowDecks: () => void;
}

const TOTAL_MAP: Record<string, number> = {
  leetcode: 100, statistics: 199, 'machine-learning': 171, 'deep-learning': 32,
  llm: 37, agent: 26, jargon: 45, workplace: 76,
};

const TEXT_PRIMARY = '#F8FAFC';
const TEXT_SECONDARY = 'rgba(226,232,240,0.75)';
const TEXT_MUTED = 'rgba(226,232,240,0.55)';
const TEXT_INACTIVE = 'rgba(203,213,225,0.45)';
const BLUE = '#2882d7';
const ORANGE = '#FF9A2E';
const CARD_BG = 'rgba(255,255,255,0.15)';
const CARD_BORDER = 'rgba(255,255,255,0.3)';

const TABS = [
  { label: '首页', icon: Home, active: true },
  { label: '牌组', icon: Layers, action: 'decks' as const },
  { label: '统计', icon: BarChart3, action: 'stats' as const },
  { label: '我的', icon: User },
];

export default function HomePage({ onEnterStudy, onShowDecks }: Props) {
  const { state, dispatch, dueCountByCategory } = useAppContext();

  const streak = useMemo(() => {
    const logs = loadReviewLogs();
    const allLogs = Object.values(logs).flat();
    return getStreak(allLogs);
  }, []);

  // 推荐模块
  const [recIndex, setRecIndex] = useState(0);
  const recommendations = useMemo(() => {
    const now = Date.now();
    const all: { id: string; label: string; category: string; score: number }[] = [];

    for (const cat of CATEGORIES) {
      const progress = loadProgress(cat.key);
      const sm2Map = progress.sm2;
      for (const [cardId, sm2] of Object.entries(sm2Map)) {
        if (!sm2 || sm2.state === 'new') continue;
        const overdue = (now - sm2.nextReview) / 86400000;
        if (overdue < 0) continue;
        const R = Math.pow(2, -overdue / Math.max(sm2.interval, 1));
        const score = (1 - R) * (1 + sm2.lapses) * (sm2.easeFactor > 0 ? 2.5 / sm2.easeFactor : 1);
        all.push({
          id: cardId,
          label: cardId,
          category: cat.key,
          score,
        });
      }
    }

    return all.sort((a, b) => b.score - a.score);
  }, []);

  const recModule = useMemo(() => {
    if (recommendations.length === 0) return null;
    const rec = recommendations[recIndex % Math.max(recommendations.length, 1)];
    const cat = CATEGORIES.find((c) => c.key === rec.category);
    return { ...rec, moduleName: cat?.label || rec.category };
  }, [recommendations, recIndex]);

  // 今日待完成
  const todayDue = useMemo(() => {
    let total = 0;
    for (const cat of CATEGORIES) total += dueCountByCategory[cat.key] ?? 0;
    return total;
  }, [dueCountByCategory]);

  const todayNewAllowance = useMemo(() => {
    let total = 0;
    for (const cat of CATEGORIES) total += getModuleDailyLimit(cat.key);
    return total;
  }, []);

  const learningCount = useMemo(() => {
    let count = 0;
    for (const card of Object.values(state.cardsById)) {
      if (card.sm2?.state === 'learning') count++;
    }
    return count;
  }, [state.cardsById]);

  const handleStartToday = useCallback(() => {
    const firstDue = CATEGORIES.find((c) => (dueCountByCategory[c.key] ?? 0) > 0);
    if (firstDue) onEnterStudy(firstDue.key);
  }, [dueCountByCategory, onEnterStudy]);

  const handleRecStudy = useCallback(() => {
    if (!recModule) return;
    dispatch({ type: 'JUMP_TO_CARD', payload: { category: recModule.category as Category, cardId: recModule.id } });
    onEnterStudy(recModule.category as Category);
  }, [recModule, dispatch, onEnterStudy]);

  return (
    <div className="homepage-glass-stage flex min-h-screen items-center justify-center transition-colors">
      <div className="w-full max-w-md px-5 py-8 pb-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <img src={appIcon} alt="" className="h-[52px] w-[52px] shrink-0 rounded-2xl" />
          <div className="min-w-0">
            <h1 className="text-[20px] font-bold leading-tight" style={{ color: TEXT_PRIMARY }}>面经闪卡</h1>
            <p className="text-[13px] mt-0.5" style={{ color: TEXT_SECONDARY }}>
              已连续 <span style={{ color: BLUE, fontWeight: 600 }}>{streak}</span> 天
            </p>
          </div>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_STATS' })}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl border"
            style={{ borderColor: CARD_BORDER, backgroundColor: CARD_BG }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TEXT_SECONDARY} strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
          </button>
        </div>

        {/* 今日待完成 */}
        <div className="rounded-2xl p-4 mb-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-[3px] h-5 rounded-full" style={{ backgroundColor: BLUE }} />
            <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>今日待完成</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <StatBlock label="复习" value={todayDue} color={ORANGE} />
            <StatBlock label="新卡" value={todayNewAllowance} color={BLUE} />
            <StatBlock label="学习中" value={learningCount} color="#CBD5E1" />
          </div>
          <button
            onClick={handleStartToday}
            className="w-full py-1 rounded-xl text-[14px] font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${BLUE}, #2f6bed)` }}
          >
            开始今日学习
          </button>
        </div>

        {/* 推荐学习 */}
        <div className="rounded-2xl p-4 mb-3 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>推荐学习</h2>
            <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ color: TEXT_SECONDARY, backgroundColor: 'rgba(255,255,255,0.08)' }}>基于推荐算法</span>
          </div>
          {recModule === null ? (
            <p className="text-[13px]" style={{ color: TEXT_MUTED }}>暂无待复习卡片</p>
          ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>{recModule.moduleName}</h3>
                <p className="text-[12px] mt-0.5" style={{ color: 'rgba(226,232,240,0.60)' }}>高优先级 · 复习薄弱点</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRecStudy}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white"
                style={{ background: `linear-gradient(135deg, ${BLUE}, #2f6bed)` }}
              >
                开始推荐学习
              </button>
              <button
                onClick={() => setRecIndex((i) => i + 1)}
                className="px-4 py-3 rounded-xl text-[14px] border"
                style={{ color: TEXT_MUTED, borderColor: 'rgba(255,255,255,0.15)' }}
              >
                换一个
              </button>
            </div>
            </>
          )}
        </div>

        {/* 我的牌组 */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-bold" style={{ color: TEXT_PRIMARY }}>我的牌组</h2>
            <button onClick={onShowDecks} className="text-[14px]" style={{ color: TEXT_MUTED }}>全部牌组</button>
          </div>
          <div className="space-y-2">
            {CATEGORIES.slice(0, 6).map((cat) => {
              const newCount = getModuleDailyLimit(cat.key);
              const dueCount = dueCountByCategory[cat.key] ?? 0;
              return (
                <button
                  key={cat.key}
                  onClick={() => onEnterStudy(cat.key)}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left border transition-colors"
                  style={{ borderColor: CARD_BORDER, backgroundColor: CARD_BG }}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-bold truncate" style={{ color: TEXT_PRIMARY }}>{cat.label}</h3>
                    <p className="text-[11px] mt-0.5" style={{ color: TEXT_MUTED }}>共 {TOTAL_MAP[cat.key] ?? '--'} 张卡片</p>
                  </div>
                  <div className="flex gap-4 text-right">
                    <div>
                      <div className="text-[11px]" style={{ color: TEXT_MUTED }}>复习</div>
                      <div className="text-[13px] font-semibold" style={{ color: ORANGE }}>{dueCount}</div>
                    </div>
                    <div>
                      <div className="text-[11px]" style={{ color: TEXT_MUTED }}>新卡</div>
                      <div className="text-[13px] font-semibold" style={{ color: BLUE }}>{newCount}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: 'rgba(203,213,225,0.7)' }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Bar */}
        <div className="fixed bottom-0 left-0 right-0 flex justify-around py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(15,23,42,0.06)', backdropFilter: 'blur(20px)' }}>
          {TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => {
                if (tab.action === 'decks') onShowDecks();
                else if (tab.action === 'stats') dispatch({ type: 'TOGGLE_STATS' });
              }}
              className="flex flex-col items-center gap-0.5"
            >
              <tab.icon className="w-5 h-5" style={{ color: tab.active ? BLUE : TEXT_INACTIVE }} />
              <span className="text-[13px] font-semibold" style={{ color: tab.active ? BLUE : TEXT_INACTIVE }}>{tab.label}</span>
            </button>
          ))}
        </div>

      </div>
      <StatsDashboard />
    </div>
  );
}

function StatBlock({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className="text-[13px] mb-1" style={{ color }}>{label}</div>
      <div className="text-[16px] font-bold leading-none" style={{ color }}>{value}</div>
    </div>
  );
}
