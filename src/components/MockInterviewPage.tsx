// src/components/MockInterviewPage.tsx — 模拟面试模式
import { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Play, Eye, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { statisticsCards } from '../data/statistics';
import { machineLearningCards } from '../data/machine-learning';
import { deepLearningCards } from '../data/deep-learning';
import { llmCards } from '../data/llm';
import { agentCards } from '../data/agent';
import { jargonCards } from '../data/jargon';
import { workplaceCards } from '../data/workplace';
import { vibeCodingCards } from '../data/vibe-coding';
import { shuffle } from '../utils/shuffle';
import type { Category, FlashCard, QACard } from '../types';

interface Props {
  onBack: () => void;
}

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';
const ACCENT = 'var(--blue)';
const GREEN = '#10B981';
const RED = '#EF4444';

const CARD_SOURCES: Partial<Record<Category, FlashCard[]>> = {
  statistics: statisticsCards as FlashCard[],
  'machine-learning': machineLearningCards as FlashCard[],
  'deep-learning': deepLearningCards as FlashCard[],
  llm: llmCards as FlashCard[],
  agent: agentCards as FlashCard[],
  jargon: jargonCards as FlashCard[],
  workplace: workplaceCards as FlashCard[],
  'vibe-coding': vibeCodingCards as FlashCard[],
};

export default function MockInterviewPage({ onBack }: Props) {
  const [phase, setPhase] = useState<'setup' | 'answering' | 'review' | 'complete'>('setup');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState<FlashCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [answers, setAnswers] = useState<Record<string, { userAnswer: string; selfRating: number }>>({});
  const [showAnswer, setShowAnswer] = useState(false);

  const allCards = useMemo(() => {
    const result: FlashCard[] = [];
    for (const [cat, cards] of Object.entries(CARD_SOURCES)) {
      if (selectedModule === 'all' || cat === selectedModule) {
        result.push(...(cards || []));
      }
    }
    return shuffle(result);
  }, [selectedModule]);

  const startInterview = useCallback(() => {
    const picked = allCards.slice(0, questionCount);
    setQuestions(picked);
    setCurrentIdx(0);
    setAnswers({});
    setUserAnswer('');
    setShowAnswer(false);
    setPhase('answering');
  }, [allCards, questionCount]);

  const handleReveal = () => {
    setShowAnswer(true);
  };

  const handleSelfRate = (rating: number) => {
    const card = questions[currentIdx];
    if (!card) return;
    setAnswers(prev => ({ ...prev, [card.id]: { userAnswer, selfRating: rating } }));
    setUserAnswer('');
    setShowAnswer(false);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setPhase('review');
    }
  };

  const handleComplete = () => {
    setPhase('complete');
  };

  const score = useMemo(() => {
    const vals = Object.values(answers);
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((s, v) => s + v.selfRating, 0) / vals.length * 20);
  }, [answers]);

  if (phase === 'setup') {
    return (
      <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
        <div className="nav-bar sticky top-0 z-20 flex items-center gap-3">
          <button onClick={onBack} className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} />
          </button>
          <h1 className="nav-title">模拟面试</h1>
        </div>
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="w-full max-w-md space-y-4">
            <div className="rounded-2xl p-5 border space-y-4" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
              <h2 className="text-[16px] font-bold" style={{ color: TEXT_PRIMARY }}>设置面试参数</h2>
              <div>
                <label className="text-[12px] mb-1 block" style={{ color: TEXT_MUTED }}>选择方向</label>
                <select
                  value={selectedModule}
                  onChange={e => setSelectedModule(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-[13px] bg-transparent"
                  style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
                >
                  <option value="all">全部方向</option>
                  {CATEGORIES.filter(c => CARD_SOURCES[c.key]).map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[12px] mb-1 block" style={{ color: TEXT_MUTED }}>题目数量</label>
                <div className="flex gap-2">
                  {[3, 5, 10, 15].map(n => (
                    <button key={n} onClick={() => setQuestionCount(n)} className="px-4 py-2 rounded-xl text-[13px] font-medium border transition-colors"
                      style={{ backgroundColor: questionCount === n ? ACCENT : 'transparent', color: questionCount === n ? '#fff' : TEXT_MUTED, borderColor: CARD_BORDER }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={startInterview} className="w-full py-3 rounded-xl text-white text-[14px] font-bold flex items-center justify-center gap-2" style={{ backgroundColor: ACCENT }}>
                <Play className="w-4 h-4" />开始面试
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'answering') {
    const card = questions[currentIdx];
    const question = card && (card as QACard).question ? (card as QACard).question : (card as any)?.titleCn || '未知题目';

    return (
      <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
        <div className="nav-bar sticky top-0 z-20 flex items-center gap-3">
          <button onClick={onBack} className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} />
          </button>
          <span className="text-[12px]" style={{ color: TEXT_MUTED }}>第 {currentIdx + 1}/{questions.length} 题</span>
        </div>
        <div className="flex-1 flex flex-col px-5 py-4">
          <div className="flex-1 max-w-md mx-auto w-full space-y-4">
            <div className="rounded-2xl p-5 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
              <h2 className="text-[15px] font-bold leading-relaxed" style={{ color: TEXT_PRIMARY }}>{question}</h2>
            </div>

            {!showAnswer ? (
              <div className="space-y-3">
                <textarea
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  placeholder="在此输入你的答案..."
                  className="w-full h-36 rounded-xl border p-3 text-[13px] bg-transparent resize-none"
                  style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
                />
                <button onClick={handleReveal} className="w-full py-3 rounded-xl text-white text-[14px] font-medium flex items-center justify-center gap-2" style={{ backgroundColor: ACCENT }}>
                  <Eye className="w-4 h-4" />显示标准答案
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-2xl p-4 border" style={{ backgroundColor: CARD_BG, borderColor: GREEN + '40' }}>
                  <h3 className="text-[12px] font-bold mb-2" style={{ color: GREEN }}>标准答案</h3>
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: TEXT_PRIMARY }}>{(card as QACard)?.answer || (card as any)?.approach || '无参考答案'}</p>
                </div>
                <div className="text-center">
                  <p className="text-[12px] mb-2" style={{ color: TEXT_MUTED }}>请自评：</p>
                  <div className="flex justify-center gap-3">
                    <RatingBtn rating={2} label="不好" color={RED} onClick={handleSelfRate} />
                    <RatingBtn rating={3} label="一般" color="#F59E0B" onClick={handleSelfRate} />
                    <RatingBtn rating={4} label="不错" color={ACCENT} onClick={handleSelfRate} />
                    <RatingBtn rating={5} label="很好" color={GREEN} onClick={handleSelfRate} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'review') {
    return (
      <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
        <div className="nav-bar sticky top-0 z-20 flex items-center gap-3">
          <button onClick={() => setPhase('answering')} className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} />
          </button>
          <h1 className="nav-title">面试回顾</h1>
        </div>
        <div className="flex-1 flex items-start justify-center px-5 py-4">
          <div className="w-full max-w-md space-y-3">
            {questions.map((card, idx) => {
              const ans = answers[card.id];
              const q = (card as QACard).question || (card as any)?.titleCn || '未知题目';
              return (
                <div key={card.id} className="rounded-xl p-3 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] font-bold mt-0.5" style={{ color: TEXT_MUTED }}>Q{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium line-clamp-2" style={{ color: TEXT_PRIMARY }}>{q}</p>
                      {ans && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
                            自评 {ans.selfRating}/5
                          </span>
                          {ans.selfRating >= 4 ? <CheckCircle className="w-3.5 h-3.5" style={{ color: GREEN }} /> : <XCircle className="w-3.5 h-3.5" style={{ color: RED }} />}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="rounded-2xl p-4 border text-center" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
              <p className="text-[14px] font-bold" style={{ color: TEXT_PRIMARY }}>面试得分：{score}%</p>
              <p className="text-[12px] mt-1" style={{ color: TEXT_MUTED }}>
                {score >= 80 ? '表现得很好！继续加油！' : score >= 60 ? '还不错，继续复习薄弱点！' : '多复习几遍，下次会更好！'}
              </p>
            </div>
            <button onClick={handleComplete} className="w-full py-3 rounded-xl text-white text-[14px] font-bold flex items-center justify-center gap-2" style={{ backgroundColor: ACCENT }}>
              <RotateCcw className="w-4 h-4" />再来一次
            </button>
          </div>
        </div>
      </div>
    );
  }

  // complete -> reset to setup
  if (phase === 'complete') {
    setPhase('setup');
    return <MockInterviewPage onBack={onBack} />;
  }

  return null;
}

function RatingBtn({ rating, label, color, onClick }: { rating: number; label: string; color: string; onClick: (r: number) => void }) {
  return (
    <button onClick={() => onClick(rating)} className="px-4 py-2 rounded-xl border text-[12px] font-medium transition-colors" style={{ borderColor: color + '40', color }}>
      {label}
    </button>
  );
}
