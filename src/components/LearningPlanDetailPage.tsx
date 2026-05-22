// src/components/LearningPlanDetailPage.tsx — 学习清单详情
import { useState, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getPlan, type LearningPlan } from '../utils/learningPlans';
import { useAppContext } from '../context/AppContext';
import type { Category } from '../types';

interface Props {
  planId: string;
  onBack: () => void;
  onEnterStudy: (category: Category) => void;
}

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';
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
  const { dispatch } = useAppContext();
  const [plan] = useState<LearningPlan | undefined>(() => getPlan(planId));

  const stats = useMemo(() => {
    if (!plan) return { new: 0, due: 0, mastered: 0 };
    let n = 0, d = 0, m = 0;
    for (const item of plan.items) {
      if (item.state === 'new') n++;
      else if (item.state !== 'new') d++;
      else m++;
    }
    return { new: n, due: d, mastered: m };
  }, [plan]);

  const handleCardClick = (cardId: string, deckId: string) => {
    dispatch({ type: 'JUMP_TO_CARD', payload: { category: deckId as Category, cardId } });
    onEnterStudy(deckId as Category);
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
              <p className="text-[14px] font-bold" style={{ color: GREEN }}>{plan.items.length}</p>
            </div>
          </div>

          {/* Card list */}
          {plan.items.map((item, i) => {
            const cfg = PRIORITY_CONFIG[item.state] || { label: item.state, color: TEXT_MUTED };
            return (
              <button
                key={item.cardId}
                onClick={() => handleCardClick(item.cardId, item.deckId)}
                className="w-full text-left rounded-xl p-3 border flex items-start gap-3 transition-colors"
                style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}
              >
                <span className="text-[12px] font-bold shrink-0 mt-0.5 min-w-[20px]" style={{ color: cfg.color }}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold truncate" style={{ color: TEXT_PRIMARY }}>{item.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>
                  {item.snippet && (
                    <p className="text-[11px] mt-0.5 leading-relaxed line-clamp-2" style={{ color: TEXT_MUTED }}>{item.snippet}</p>
                  )}
                  <p className="text-[10px] mt-1" style={{ color: TEXT_MUTED }}>
                    {item.deckName}{item.interval > 0 ? ` · 间隔${item.interval}天` : ''}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
