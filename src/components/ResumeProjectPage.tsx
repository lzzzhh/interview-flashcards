// src/components/ResumeProjectPage.tsx — 简历项目追问卡片生成
import { useState, useCallback } from 'react';
import { ArrowLeft, Sparkles, Plus, Upload } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { QACard } from '../types';

interface Props {
  onBack: () => void;
}

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';
const ACCENT = '#8B5CF6';

// 通用追问模板
const FOLLOW_UP_TEMPLATES = [
  '为什么选择这个技术方案？有替代方案吗？',
  '这个项目最大的技术难点是什么？如何解决的？',
  '项目的关键指标是什么？如何衡量效果？',
  '如果重新做一次，哪些地方会改进？',
  '这个项目对你的技术栈有什么影响？',
  '你在这个项目中扮演的角色是什么？',
  '如何确保项目的可维护性和扩展性？',
  '项目中遇到过哪些线上问题？如何排查和修复的？',
  '团队协作流程是怎样的？有没有推动过什么改进？',
  '项目的竞品或类似开源方案有哪些？你的优势是什么？',
];

export default function ResumeProjectPage({ onBack }: Props) {
  const { dispatch } = useAppContext();
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [generatedCards, setGeneratedCards] = useState<QACard[]>([]);
  const [saved, setSaved] = useState<Set<number>>(new Set());

  const generateFollowUps = useCallback(() => {
    if (!projectName.trim()) return;

    const cards: QACard[] = FOLLOW_UP_TEMPLATES.map((template, i) => ({
      id: `resume-${Date.now()}-${i}`,
      category: 'workplace' as const,
      question: `[${projectName.trim()}] ${template}`,
      answer: `请结合「${projectName.trim()}」项目的实际经历回答。\n\n项目描述: ${projectDesc.trim() || '（待补充）'}`,
      tags: ['简历项目', '面试追问', '项目复盘'],
      subTopic: projectName.trim(),
      difficulty: 'medium' as const,
      sm2: { state: 'new', easeFactor: 2.5, interval: 0, repetitions: 0, lapses: 0, nextReview: Date.now() },
      favorited: false,
    }));
    setGeneratedCards(cards);
    setSaved(new Set());
  }, [projectName, projectDesc]);

  const handleSave = (idx: number) => {
    const card = generatedCards[idx];
    if (!card || saved.has(idx)) return;
    dispatch({ type: 'ADD_CARD', payload: card });
    setSaved(prev => new Set(prev).add(idx));
  };

  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center gap-3">
        <button onClick={onBack} className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} />
        </button>
        <Sparkles className="w-5 h-5" style={{ color: ACCENT }} />
        <h1 className="nav-title">简历项目追问</h1>
      </div>

      <div className="flex-1 flex items-start justify-center px-5 py-4">
        <div className="w-full max-w-md space-y-4 pb-24">
          {/* Input */}
          <div className="rounded-2xl p-5 border space-y-4" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
            <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>输入项目信息</h2>
            <input
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="项目名称（如：基于BorutaSHAP的特征选择框架）"
              className="w-full px-3 py-2.5 rounded-xl border text-[13px] bg-transparent"
              style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
            />
            <textarea
              value={projectDesc}
              onChange={e => setProjectDesc(e.target.value)}
              placeholder="项目简要描述（可选）"
              className="w-full h-24 rounded-xl border p-3 text-[12px] bg-transparent resize-none"
              style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
            />
            <button
              onClick={generateFollowUps}
              disabled={!projectName.trim()}
              className="w-full py-3 rounded-xl text-white text-[14px] font-medium disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ backgroundColor: ACCENT }}
            >
              <Sparkles className="w-4 h-4" />生成面试追问
            </button>
          </div>

          {/* Generated cards */}
          {generatedCards.length > 0 && (
            <div className="rounded-2xl p-4 border space-y-1" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
              <h3 className="text-[14px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>追问卡片 ({generatedCards.length} 张)</h3>
              {generatedCards.map((card, idx) => (
                <div key={card.id} className="flex items-start gap-2 py-2 border-b last:border-b-0" style={{ borderColor: CARD_BORDER }}>
                  <span className="text-[11px] font-bold shrink-0 mt-0.5" style={{ color: TEXT_MUTED }}>Q{idx + 1}</span>
                  <p className="text-[12px] leading-snug flex-1" style={{ color: TEXT_PRIMARY }}>{card.question}</p>
                  <button
                    onClick={() => handleSave(idx)}
                    disabled={saved.has(idx)}
                    className="shrink-0 p-1.5 rounded-lg transition-colors"
                    style={{ color: saved.has(idx) ? '#10B981' : TEXT_MUTED }}
                    title={saved.has(idx) ? '已保存' : '加入题库'}
                  >
                    {saved.has(idx) ? <Upload className="w-3.5 h-3.5 rotate-180" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
