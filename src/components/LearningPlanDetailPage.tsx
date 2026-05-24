// src/components/LearningPlanDetailPage.tsx — 学习清单详情 + 计划学习模式
import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getPlan, generateStudyPlan, type LearningPlan } from '../utils/learningPlans';
import { useAppContext } from '../context/AppContext';
import { CATEGORIES } from '../constants';

const API = 'http://localhost:3001/api';

interface Props {
  planId: string;
  onBack: () => void;
}

const CARD_BG = 'var(--card-bg)';
const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const BLUE = 'var(--blue)';
const GREEN = '#10B981';
const ORANGE = 'var(--orange)';

export default function LearningPlanDetailPage({ planId, onBack }: Props) {
  const { state } = useAppContext();
  const [plan, setPlan] = useState<LearningPlan | undefined>();
  const [generating, setGenerating] = useState(false);
  const [studying, setStudying] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => { getPlan(planId).then(setPlan); }, [planId]);

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
      const cardState = (card?.sm2 as any)?.state || 'new';
      const isCompleted = completed.has(item.cardId) || item.completed;
      return {
        idx: i,
        cardId: item.cardId, deckId: item.deckId,
        title: typeof title === 'string' ? title : String(title || ''),
        deckName, state: cardState,
        interval: (card?.sm2 as any)?.interval || 0,
        isCompleted,
        card,
      };
    });
  }, [plan, state.cardsById, completed]);

  const handleGenerate = async () => {
    if (!plan?.id) return;
    setGenerating(true);
    try {
      const studyPlan = await generateStudyPlan(plan.id);
      setPlan(prev => prev ? { ...prev, studyPlan } : prev);
    } catch (e) { console.error(e); }
    setGenerating(false);
  };

  const handleStartStudy = () => {
    setStudying(true);
    setStudyIndex(0);
  };

  const handleExitStudy = () => setStudying(false);

  const handleRate = async (rating: number) => {
    const item = enrichedItems[studyIndex];
    if (!item || reviewing) return;
    setReviewing(true);
    try {
      await fetch(`${API}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: item.cardId, rating }),
      });
      setCompleted(prev => new Set([...prev, item.cardId]));
    } catch (e) { console.error(e); }

    if (studyIndex < enrichedItems.length - 1) {
      setStudyIndex(i => i + 1);
    }
    setReviewing(false);
  };

  const studyCard = enrichedItems[studyIndex];
  const completedCount = enrichedItems.filter(i => i.isCompleted).length;
  const totalCount = enrichedItems.length;

  // Study mode overlay
  if (studying && studyCard) {
    return (
      <div className="dark-bg homepage-glass-stage fixed inset-0 z-50 flex flex-col min-h-screen transition-colors">
        <div className="nav-bar sticky top-0 z-20 flex items-center justify-between">
          <button onClick={handleExitStudy} className="p-1 -ml-1"><ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} /></button>
          <span className="text-[13px]" style={{ color: TEXT_MUTED }}>{studyIndex + 1}/{totalCount}</span>
          <div className="w-6" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
          <div className="w-full max-w-md">
            <div className="text-[11px] mb-2" style={{ color: TEXT_MUTED }}>{studyCard.deckName}</div>
            <h2 className="text-[18px] font-bold mb-6 leading-relaxed" style={{ color: TEXT_PRIMARY }}>
              {studyCard.title}
            </h2>
            {studyCard.card && (
              <div className="rounded-xl p-4 border mb-6" style={{ backgroundColor: CARD_BG, borderColor: 'var(--card-border)' }}>
                <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: TEXT_PRIMARY }}>
                  {(studyCard.card as any).question || ''}
                </p>
                {(studyCard.card as any).answer && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: TEXT_MUTED }}>
                      {(studyCard.card as any).answer}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <div className="max-w-md mx-auto flex gap-2">
            {[
              { label: '重来', rating: 1, color: '#EF4444' },
              { label: '困难', rating: 2, color: ORANGE },
              { label: '一般', rating: 3, color: BLUE },
              { label: '简单', rating: 4, color: GREEN },
            ].map(btn => (
              <button
                key={btn.rating}
                onClick={() => handleRate(btn.rating)}
                disabled={reviewing}
                className="flex-1 py-3 rounded-xl text-[13px] font-bold transition-opacity"
                style={{ backgroundColor: `${btn.color}20`, color: btn.color, opacity: reviewing ? 0.5 : 1 }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
        <button onClick={handleStartStudy} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-medium transition-colors" style={{ backgroundColor: `${BLUE}15`, color: BLUE }}>
          开始学习
        </button>
      </div>

      <div className="flex-1 flex items-start justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-6 pb-24 space-y-3">
          {/* Generate plan button */}
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
