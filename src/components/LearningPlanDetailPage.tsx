// src/components/LearningPlanDetailPage.tsx — 学习清单详情
// Items only store cardId+deckId (slim format). Card details are looked up from AppContext.
import { useState, useMemo } from 'react';
import { ArrowLeft, Play, CheckCheck } from 'lucide-react';
import { getPlan, updatePlan, type LearningPlan } from '../utils/learningPlans';
import { useAppContext } from '../context/AppContext';
import { CATEGORIES } from '../constants';
import { scheduleReview, createDefaultSM2 } from '../utils/sm2';
import { appendReviewLog } from '../utils/reviewLogs';
import { loadProgress } from '../utils/storage';
import type { Category } from '../types';

interface Props {
  planId: string;
  onBack: () => void;
  onEnterStudy: (category: Category) => void;
}

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BG = 'var(--card-bg)';
const BLUE = 'var(--blue)';
const GREEN = '#10B981';
const ORANGE = 'var(--orange)';

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  'new': { label: '新卡', color: BLUE },
  'learning': { label: '学习中', color: ORANGE },
  'review': { label: '待复习', color: ORANGE },
  'relearning': { label: '重学', color: '#EF4444' },
};

export default function LearningPlanDetailPage({ planId, onBack, onEnterStudy }: Props) {
  const { state, dispatch } = useAppContext();
  const [plan, setPlan] = useState<LearningPlan | undefined>(() => getPlan(planId));

  // Enrich plan items with card data from store
  const enrichedItems = useMemo(() => {
    if (!plan) return [];
    return plan.items.map(item => {
      const card = state.cardsById[item.cardId];
      const category = CATEGORIES.find(c => c.key === item.deckId);
      const sm2 = card?.sm2;
      const cardState = sm2?.state || 'new';
      const cfg = PRIORITY_CONFIG[cardState] || { label: 'unknown', color: TEXT_MUTED };
      // Use stored title from plan item, fall back to card lookup, then deck context
      const storedTitle = item.title;
      const cardCn = card ? String((card as any).titleCn || '') : '';
      const isLeetCode = item.deckId === 'leetcode' || item.cardId.startsWith('lc-');
      let title: string;
      if (isLeetCode) {
        const num = item.cardId.replace(/^lc-0*/, '');
        const cnName = storedTitle && storedTitle !== item.cardId && !storedTitle.startsWith(item.deckId + ' ·')
          ? storedTitle.replace(/^力扣#\d+\s*/, '') : cardCn;
        title = cnName ? `力扣#${num} ${cnName}` : (storedTitle || cardCn || `力扣#${num}`);
      } else if (storedTitle && storedTitle !== item.cardId && !storedTitle.startsWith(item.deckId + ' ·')) {
        title = storedTitle;
      } else {
        title = storedTitle || cardCn
          || (card ? String((card as any).title || (card as any).question || '') : '')
          || `${category?.label || item.deckId} · ${item.cardId}`;
      }
      const deckName = category?.label || item.deckId;
      return {
        cardId: item.cardId,
        deckId: item.deckId,
        title: typeof title === 'string' ? title : String(title || ''),
        deckName,
        state: cardState,
        interval: sm2?.interval || 0,
        stateLabel: cfg.label,
        stateColor: cfg.color,
      };
    });
  }, [plan, state.cardsById]);

  const stats = useMemo(() => {
    let n = 0, d = 0;
    for (const item of enrichedItems) {
      if (item.state === 'new') n++;
      else d++;
    }
    return { new: n, due: d };
  }, [enrichedItems]);

  const handleCardClick = (cardId: string, deckId: string) => {
    dispatch({ type: 'JUMP_TO_CARD', payload: { category: deckId as Category, cardId } });
    onEnterStudy(deckId as Category);
  };

  const handleStudyAll = () => {
    if (enrichedItems.length === 0) return;
    const first = enrichedItems[0];
    dispatch({ type: 'JUMP_TO_CARD', payload: { category: first.deckId as Category, cardId: first.cardId } });
    onEnterStudy(first.deckId as Category);
  };

  const handleMarkComplete = (cardId: string) => {
    if (!plan) return;
    const item = plan.items.find(i => i.cardId === cardId);
    if (!item) return;

    const isCompleting = !item.completed;
    if (isCompleting) {
      // Directly write SM2 progress to localStorage (works even without card in memory)
      const sm2 = state.cardsById[cardId]?.sm2 || createDefaultSM2();
      const rating = sm2.state === 'new' ? 3 : 3; // 'good' rating
      const result = scheduleReview(cardId, sm2, rating);
      appendReviewLog(result.log);

      // Persist progress to localStorage for this deck
      const progressKey = `fc-progress-${item.deckId}`;
      try {
        const progress = loadProgress(item.deckId as Category);
        progress.sm2[cardId] = result.sm2;
        localStorage.setItem(progressKey, JSON.stringify(progress));
      } catch (e) {
        console.error('Failed to save progress:', e);
      }

      // Also dispatch if card is in memory (updates UI)
      if (state.cardsById[cardId]) {
        dispatch({ type: 'RATE_CARD', payload: { cardId, rating } });
      }
    }

    const updated = {
      ...plan,
      items: plan.items.map(it =>
        it.cardId === cardId
          ? { ...it, completed: !it.completed, completedAt: it.completed ? undefined : Date.now() }
          : it
      ),
    };
    setPlan(updated);
    updatePlan(updated);
  };

  const handleMarkAllComplete = () => {
    if (!plan) return;
    for (const item of plan.items) {
      if (item.completed) continue;
      // Directly write SM2 progress to localStorage
      const sm2 = state.cardsById[item.cardId]?.sm2 || createDefaultSM2();
      const result = scheduleReview(item.cardId, sm2, 3);
      appendReviewLog(result.log);

      const progressKey = `fc-progress-${item.deckId}`;
      try {
        const progress = loadProgress(item.deckId as Category);
        progress.sm2[item.cardId] = result.sm2;
        localStorage.setItem(progressKey, JSON.stringify(progress));
      } catch {}

      if (state.cardsById[item.cardId]) {
        dispatch({ type: 'RATE_CARD', payload: { cardId: item.cardId, rating: 3 } });
      }
    }
    const updated = {
      ...plan,
      items: plan.items.map(item => ({ ...item, completed: true, completedAt: Date.now() })),
    };
    setPlan(updated);
    updatePlan(updated);
  };

  if (!plan) {
    return (
      <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
        <div className="nav-bar sticky top-0 z-20 flex items-center">
          <button onClick={onBack} className="p-1 -ml-1"><ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} /></button>
          <h1 className="nav-title">学习清单</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[13px]" style={{ color: TEXT_MUTED }}>清单不存在或已删除</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center">
        <button onClick={onBack} className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} />
        </button>
        <h1 className="nav-title">{plan.title}</h1>
        <button
          onClick={handleStudyAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
          style={{ backgroundColor: `${BLUE}15`, color: BLUE }}
        >
          <Play className="w-4 h-4" />
          开始学习
        </button>
        <button
          onClick={handleMarkAllComplete}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[12px] transition-colors"
          style={{ backgroundColor: `${GREEN}15`, color: GREEN }}
        >
          <CheckCheck className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 flex items-start justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-6 pb-24 space-y-3">
          {/* Stats bar */}
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl px-3 py-2 text-center" style={{ backgroundColor: `${BLUE}10` }}>
              <p className="text-[11px]" style={{ color: BLUE }}>新卡</p>
              <p className="text-[14px] font-bold" style={{ color: BLUE }}>{stats.new}</p>
            </div>
            <div className="flex-1 rounded-xl px-3 py-2 text-center" style={{ backgroundColor: `${ORANGE}10` }}>
              <p className="text-[11px]" style={{ color: ORANGE }}>待复习</p>
              <p className="text-[14px] font-bold" style={{ color: ORANGE }}>{stats.due}</p>
            </div>
            <div className="flex-1 rounded-xl px-3 py-2 text-center" style={{ backgroundColor: `${GREEN}10` }}>
              <p className="text-[11px]" style={{ color: GREEN }}>总计</p>
              <p className="text-[14px] font-bold" style={{ color: GREEN }}>{enrichedItems.length}</p>
            </div>
          </div>

          {/* Card list */}
          {enrichedItems.map((item, i) => {
            const isCompleted = plan?.items[i]?.completed;
            return (
            <div
              key={item.cardId}
              className="relative"
            >
            <button
              onClick={() => handleCardClick(item.cardId, item.deckId)}
              className={`w-full text-left rounded-xl p-3 border flex items-start gap-3 transition-colors ${isCompleted ? 'border-green-400 dark:border-green-600' : ''}`}
              style={{ backgroundColor: isCompleted ? 'rgba(16,185,129,0.05)' : CARD_BG, borderColor: isCompleted ? '#10B981' : 'var(--card-border)' }}
            >
              <span className="text-[12px] font-bold shrink-0 mt-0.5 min-w-[20px]" style={{ color: isCompleted ? '#10B981' : item.stateColor }}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold truncate" style={{ color: isCompleted ? '#10B981' : TEXT_PRIMARY }}>{item.title}</span>
                  {isCompleted && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10B981' }}>已完成</span>
                  )}
                  {!isCompleted && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: `${item.stateColor}15`, color: item.stateColor }}>{item.stateLabel}</span>
                  )}
                </div>
                <p className="text-[10px] mt-1" style={{ color: TEXT_MUTED }}>
                  {item.deckName}{item.interval > 0 ? ` · 间隔${item.interval}天` : ''}
                </p>
              </div>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleMarkComplete(item.cardId); }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: isCompleted ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.05)' }}
              title={isCompleted ? '取消完成' : '标记完成'}
            >
              <CheckCheck className="w-3.5 h-3.5" style={{ color: isCompleted ? '#10B981' : '#9CA3AF' }} />
            </button>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
