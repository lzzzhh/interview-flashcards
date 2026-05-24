// src/components/LearningPlanDetailPage.tsx — 学习清单详情
import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { getPlan, generateStudyPlan, type LearningPlan } from '../utils/learningPlans';
import { useAppContext } from '../context/AppContext';
import { CATEGORIES } from '../constants';

const CARD_BG = 'var(--card-bg)';
const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const BLUE = 'var(--blue)';
const GREEN = '#10B981';

interface Props {
  planId: string;
  onBack: () => void;
  onStudyPlan: (cardIds: string[]) => void;
}

export default function LearningPlanDetailPage({ planId, onBack, onStudyPlan }: Props) {
  const { state } = useAppContext();
  const [plan, setPlan] = useState<LearningPlan | undefined>();
  const [generating, setGenerating] = useState(false);

  useEffect(() => { getPlan(planId).then(setPlan); }, [planId]);

  // Track completed cards (read from DB CardProgress via cardsById sm2)
  const enrichedItems = useMemo(() => {
    if (!plan) return [];
    return plan.items.map((item, i) => {
      const card = state.cardsById[item.cardId];
      const category = CATEGORIES.find(c => c.key === item.deckId);
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
      const sm2 = (card?.sm2 as any);
      const isCompleted = !!sm2 && sm2.state !== 'new';
      return {
        idx: i,
        cardId: item.cardId, deckId: item.deckId,
        title: typeof title === 'string' ? title : String(title || ''),
        deckName,
        isCompleted,
        card,
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

  const completedCount = enrichedItems.filter(i => i.isCompleted).length;
  const totalCount = enrichedItems.length;
  const cardIds = enrichedItems.map(i => i.cardId);

  if (!plan) {
    return (
      <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen">
        <div className="nav-bar sticky top-0 z-20 flex items-center">
          <button onClick={onBack} className="p-1 -ml-1"><ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} /></button>
          <h1 className="nav-title">学习清单</h1>
        </div>
        <div className="flex-1 flex items-center justify-center"><p className="text-[13px]" style={{ color: TEXT_MUTED }}>加载中...</p></div>
      </div>
    );
  }

  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center">
        <button onClick={onBack} className="p-1 -ml-1"><ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} /></button>
        <h1 className="nav-title">{plan.title}</h1>
        <button onClick={() => onStudyPlan(cardIds)} disabled={cardIds.length === 0} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-medium transition-colors" style={{ backgroundColor: `${BLUE}15`, color: BLUE, opacity: cardIds.length > 0 ? 1 : 0.4 }}>
          <Play className="w-3.5 h-3.5" />学习
        </button>
      </div>

      <div className="flex-1 flex items-start justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-6 pb-24 space-y-3">
          {/* Generate plan */}
          {!plan.studyPlan && (
            <button onClick={handleGenerate} disabled={generating} className="w-full py-2 rounded-xl text-[13px] font-medium transition-colors" style={{ backgroundColor: `${BLUE}10`, color: BLUE, opacity: generating ? 0.5 : 1 }}>
              {generating ? '生成中...' : 'AI 生成学习计划'}
            </button>
          )}

          {/* Study Plan */}
          {plan.studyPlan && (
            <div className="rounded-xl p-4 border" style={{ backgroundColor: `${GREEN}08`, borderColor: GREEN }}>
              <h3 className="text-[14px] font-bold mb-2" style={{ color: GREEN }}>学习计划</h3>
              <pre className="text-[12px] whitespace-pre-wrap leading-relaxed" style={{ color: TEXT_PRIMARY, fontFamily: 'inherit' }}>{plan.studyPlan}</pre>
            </div>
          )}

          {/* Progress */}
          {completedCount > 0 && (
            <div className="flex items-center justify-between text-[11px] px-1" style={{ color: TEXT_MUTED }}>
              <span>进度</span>
              <span>{completedCount}/{totalCount}</span>
            </div>
          )}

          {/* Card list */}
          {enrichedItems.map(item => (
            <div key={item.cardId} className="w-full text-left rounded-xl p-3 border flex items-start gap-3"
              style={{ backgroundColor: item.isCompleted ? 'rgba(16,185,129,0.05)' : CARD_BG, borderColor: item.isCompleted ? GREEN : 'var(--card-border)' }}>
              <span className="text-[12px] font-bold shrink-0 mt-0.5 min-w-[20px]" style={{ color: item.isCompleted ? GREEN : TEXT_MUTED }}>{item.idx + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-bold truncate" style={{ color: item.isCompleted ? GREEN : TEXT_PRIMARY }}>{item.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.isCompleted ? 'rgba(16,185,129,0.15)' : `${TEXT_MUTED}15`, color: item.isCompleted ? GREEN : TEXT_MUTED }}>
                    {item.isCompleted ? '已学习' : '未学'}
                  </span>
                </div>
                <p className="text-[10px] mt-1" style={{ color: TEXT_MUTED }}>{item.deckName}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
