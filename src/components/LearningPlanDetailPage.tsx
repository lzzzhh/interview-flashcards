// src/components/LearningPlanDetailPage.tsx — 学习清单详情（后端 API 驱动）
import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Zap } from 'lucide-react';
import { getPlan, generateStudyPlan, type LearningPlan } from '../utils/learningPlans';
import { useAppContext } from '../context/AppContext';
import { CATEGORIES } from '../constants';

interface Props {
  planId: string;
  onBack: () => void;
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

export default function LearningPlanDetailPage({ planId, onBack }: Props) {
  const { state } = useAppContext();
  const [plan, setPlan] = useState<LearningPlan | undefined>();
  const [generating, setGenerating] = useState(false);

  useEffect(() => { getPlan(planId).then(setPlan); }, [planId]);

  const enrichedItems = useMemo(() => {
    if (!plan) return [];
    return plan.items.map(item => {
      const card = state.cardsById[item.cardId];
      const category = CATEGORIES.find(c => c.key === item.deckId);
      const sm2 = card?.sm2;
      const cardState = sm2?.state || 'new';
      const cfg = PRIORITY_CONFIG[cardState] || { label: 'unknown', color: TEXT_MUTED };
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
        cardId: item.cardId, deckId: item.deckId,
        title: typeof title === 'string' ? title : String(title || ''),
        deckName, state: cardState,
        interval: sm2?.interval || 0,
        stateLabel: cfg.label, stateColor: cfg.color,
        completed: item.completed,
      };
    });
  }, [plan, state.cardsById]);

  const handleGenerate = async () => {
    if (!plan?.id) return;
    setGenerating(true);
    try {
      const studyPlan = await generateStudyPlan(plan.id);
      setPlan(prev => prev ? { ...prev, studyPlan } : prev);
    } catch (e) { console.error(e); }
    setGenerating(false);
  };

  if (!plan) {
    return (
      <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
        <div className="nav-bar sticky top-0 z-20 flex items-center">
          <button onClick={onBack} className="p-1 -ml-1"><ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} /></button>
          <h1 className="nav-title">学习清单</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[13px]" style={{ color: TEXT_MUTED }}>加载中...</p>
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
          onClick={handleGenerate}
          disabled={generating || !!plan.studyPlan}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[12px] transition-colors"
          style={{
            backgroundColor: plan.studyPlan ? `${GREEN}15` : `${BLUE}15`,
            color: plan.studyPlan ? GREEN : BLUE,
            opacity: generating ? 0.5 : 1,
          }}
        >
          <Zap className="w-3.5 h-3.5" />
          {generating ? '生成中...' : plan.studyPlan ? '已生成' : '生成计划'}
        </button>
      </div>

      <div className="flex-1 flex items-start justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-6 pb-24 space-y-3">
          {/* Study Plan */}
          {plan.studyPlan && (
            <div className="rounded-xl p-4 border" style={{ backgroundColor: `${GREEN}08`, borderColor: GREEN }}>
              <h3 className="text-[14px] font-bold mb-2" style={{ color: GREEN }}>学习计划</h3>
              <pre className="text-[12px] whitespace-pre-wrap leading-relaxed" style={{ color: TEXT_PRIMARY, fontFamily: 'inherit' }}>
                {plan.studyPlan}
              </pre>
            </div>
          )}

          {/* Card list */}
          {enrichedItems.map((item, i) => {
            const isCompleted = item.completed;
            return (
            <div
              key={item.cardId}
              className="w-full text-left rounded-xl p-3 border flex items-start gap-3"
              style={{
                backgroundColor: isCompleted ? 'rgba(16,185,129,0.05)' : CARD_BG,
                borderColor: isCompleted ? GREEN : 'var(--card-border)',
              }}
            >
              <span className="text-[12px] font-bold shrink-0 mt-0.5 min-w-[20px]" style={{ color: isCompleted ? GREEN : item.stateColor }}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-bold truncate" style={{ color: isCompleted ? GREEN : TEXT_PRIMARY }}>{item.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: isCompleted ? 'rgba(16,185,129,0.15)' : `${item.stateColor}15`, color: isCompleted ? GREEN : item.stateColor }}>{isCompleted ? '已完成' : item.stateLabel}</span>
                </div>
                <p className="text-[10px] mt-1" style={{ color: TEXT_MUTED }}>
                  {item.deckName}{item.interval > 0 ? ` · 间隔${item.interval}天` : ''}
                </p>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
