// ============================================================
// src/components/CardView.tsx — 核心卡片组件（含 Anki 复习状态）
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, Clock, Repeat, StickyNote, X } from 'lucide-react';
import type { AppAction, FlashCard, LeetCodeCard, QACard, SM2Record } from '../types';
import { DIFFICULTY_LABEL, DIFFICULTY_COLOR } from '../constants';
import { useAppContext } from '../context/AppContext';
import { getCardSolutions } from '../data/leetcode/solutions';
import MathText from './MathText';
import CodeBlock from './CodeBlock';

interface CardViewProps {
  card: FlashCard;
  showApproach: boolean;
  showCode: boolean;
}

function isLeetCode(card: FlashCard): card is LeetCodeCard {
  return card.category === 'leetcode';
}

/** 格式化复习间隔为可读字符串 */
function formatInterval(intervalDays: number): string {
  if (intervalDays === 0) return '新卡片';
  if (intervalDays === 1) return '1天';
  if (intervalDays < 7) return `${intervalDays}天`;
  if (intervalDays < 30) return `${Math.round(intervalDays / 7)}周`;
  return `${Math.round(intervalDays / 30)}月`;
}

/** 艾宾浩斯阶段描述 */
function getReviewStage(sm2: { repetitions: number; easeFactor: number; interval: number }): {
  label: string;
  color: string;
  stage: number;
} {
  const { repetitions, interval } = sm2;
  if (repetitions === 0) return { label: '新学', color: 'text-blue-500', stage: 0 };
  if (repetitions === 1) return { label: '短期', color: 'text-orange-500', stage: 1 };
  if (repetitions === 2) return { label: '中期', color: 'text-yellow-500', stage: 2 };
  if (interval >= 30) return { label: '长期', color: 'text-green-500', stage: 4 };
  return { label: '巩固', color: 'text-purple-500', stage: 3 };
}

/** 到期状态 */
function getDueStatus(nextReview: number): { isDue: boolean; overdueDays: number } {
  const now = Date.now();
  const diff = now - nextReview;
  return {
    isDue: diff >= 0,
    overdueDays: diff > 0 ? Math.ceil(diff / 86400000) : 0,
  };
}

// ---- Review Meta bar (shows interval + stage) ----
function ReviewMeta({ sm2, sticky: isSticky = false, inline = false }: { sm2: SM2Record; sticky?: boolean; inline?: boolean }) {
  const stage = getReviewStage(sm2);
  const due = getDueStatus(sm2.nextReview);
  const isNew = !sm2.state || sm2.state === 'new';

  return (
    <div className={`${inline ? 'min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1' : 'flex items-center justify-center gap-3 border-b border-black/5 pb-2 mb-2 -mx-4 px-4 pt-1 dark:border-white/10 sm:-mx-6 sm:px-6'} text-xs text-gray-500 dark:text-gray-400 bg-transparent ${isSticky ? 'sticky top-0 z-10' : ''}`}>
      <span className="flex items-center gap-1">
        <Repeat className="w-3 h-3" />
        重复 {sm2.repetitions} 次
      </span>
      <span className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        间隔 {formatInterval(sm2.interval)}
      </span>
      <span className={`font-medium ${stage.color}`}>{stage.label}</span>
      {!isNew && due.isDue && (
        <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 font-medium text-[10px]">
          {due.overdueDays > 0 ? `逾期 ${due.overdueDays} 天` : '到期'}
        </span>
      )}
    </div>
  );
}

// ---- Notes Button + Modal ----
function NotesButton({ card, dispatch }: { card: FlashCard; dispatch: React.Dispatch<AppAction> }) {
  const [open, setOpen] = useState(false);
  const hasNotes = !!(card.userNotes && card.userNotes.trim());
  const [text, setText] = useState(card.userNotes || '');

  const handleSave = () => {
    dispatch({ type: 'UPDATE_CARD', payload: { ...card, userNotes: text } });
  };

  const handleClose = () => {
    handleSave();
    setOpen(false);
  };

  // Sync text if card changes externally
  const [prevId, setPrevId] = useState(card.id);
  if (card.id !== prevId) {
    setPrevId(card.id);
    setText(card.userNotes || '');
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          backgroundColor: hasNotes ? 'rgba(251, 191, 36, 0.12)' : 'rgba(0,0,0,0.04)',
          color: hasNotes ? '#D97706' : 'var(--text-secondary)',
        }}
        title={hasNotes ? '查看笔记' : '添加笔记'}
      >
        <StickyNote className="w-4 h-4" />
        {hasNotes && (
          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full" style={{ backgroundColor: '#D97706' }} />
        )}
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/5 bg-white/95 p-5 shadow-2xl backdrop-blur-2xl animate-fadeIn dark:border-white/10 dark:bg-gray-900/90">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4" style={{ color: '#D97706' }} />
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">笔记</h3>
              </div>
              <button onClick={handleClose} className="rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleSave}
              placeholder="记录这道题的面试心得、易错点、追问思路..."
              className="h-44 w-full resize-none rounded-xl border border-black/5 bg-black/[0.02] p-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:placeholder:text-gray-500"
              autoFocus
            />
            <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
              失焦自动保存 · 仅自己可见
            </p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function CardPanelButton({
  title,
  detail,
  open,
  onClick,
}: {
  title: string;
  detail: string;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${
        open
          ? 'border-blue-200 bg-blue-50/80 text-blue-700 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300'
          : 'border-black/5 bg-white/30 text-gray-700 hover:border-blue-200/80 hover:bg-white/55 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-white/20 dark:hover:bg-white/10'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{title}</div>
          <div className="mt-0.5 truncate text-[11px] text-gray-400 dark:text-gray-500">{detail}</div>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-300 transition-transform duration-200 ${open ? 'rotate-180 text-blue-400' : ''}`} />
      </div>
    </button>
  );
}

// ---- LeetCode Card ----
function LeetCodeView({ card, showApproach: _showApproach, showCode: _showCode }: { card: LeetCodeCard; showApproach: boolean; showCode: boolean }) {
  const { dispatch } = useAppContext();
  const [localApproach, setLocalApproach] = useState(false);
  const [localCode, setLocalCode] = useState(false);
  const cardRef = useRef(card.id);

  // 卡片切换时强制关闭面板，并更新 ref
  useEffect(() => {
    setLocalApproach(false);
    setLocalCode(false);
    cardRef.current = card.id;
  }, [card.id]);

  // 不再监听键盘快捷键 — 代码/思路仅通过按钮点击打开
  // 防止键盘意外触发导致代码面板在快速切卡时出现

  // Multi-language support — 优先顺序：导入的 codes > 内置方案库 > 旧 code 字段
  const codes = (() => {
    const builtin = getCardSolutions(card.id);
    if (card.codes && Object.keys(card.codes).length > 0) {
      return { ...builtin, ...card.codes };
    }
    if (Object.keys(builtin).length > 0) return builtin;
    if (card.code) return { python: card.code };
    return {};
  })();
  const languages = Object.keys(codes).length > 0 ? Object.keys(codes) : ['python'];
  const [selectedLang, setSelectedLang] = useState(
    card.defaultLanguage || (languages.includes('python') ? 'python' : languages[0])
  );

  const approachOpen = localApproach;
  const codeOpen = localCode;
  const activePanel = approachOpen ? 'approach' : codeOpen ? 'code' : null;

  const handleToggleApproach = () => {
    if (approachOpen) {
      setLocalApproach(false);
    } else {
      setLocalCode(false);
      setLocalApproach(true);
    }
  };

  const handleToggleCode = () => {
    if (codeOpen) {
      setLocalCode(false);
    } else {
      setLocalApproach(false);
      setLocalCode(true);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 -mx-4 border-b border-black/5 bg-transparent px-4 pb-3 pt-1 dark:border-white/10 dark:bg-transparent sm:-mx-6 sm:px-6">
        <div className="mb-2 flex items-center justify-between gap-3 border-b border-black/5 pb-2 dark:border-white/10">
          <div className="min-w-0 flex-1">
            <ReviewMeta sm2={card.sm2} inline />
          </div>
          <NotesButton card={card} dispatch={dispatch} />
        </div>

        <div className="flex items-start gap-3 mt-2">
          <span className="text-lg font-bold text-primary whitespace-nowrap">
            #{card.number}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold leading-snug text-gray-900 dark:text-gray-100">
              <MathText text={card.title} />
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {card.titleCn}
            </p>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${DIFFICULTY_COLOR[card.difficulty]}`}>
            {DIFFICULTY_LABEL[card.difficulty]}
          </span>
        </div>

        <div className="mt-2 flex max-h-12 flex-wrap gap-1.5 overflow-hidden">
          {card.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-md text-xs bg-white/40 text-gray-600 dark:bg-white/5 dark:text-gray-400">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden py-3">
        <div className="h-full min-h-[8rem] overflow-y-auto rounded-xl border border-black/5 bg-white/35 px-3 py-2.5 text-sm leading-relaxed text-gray-700 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
          <MathText text={card.description} />
        </div>
      </div>

      <div className="shrink-0 border-t border-black/5 pt-3 dark:border-white/10">
        <div className="grid grid-cols-2 gap-2">
          <CardPanelButton title="思路解析" detail="复杂度与关键分析" open={activePanel === 'approach'} onClick={handleToggleApproach} />
          <CardPanelButton title="代码实现" detail="参考代码与细节" open={activePanel === 'code'} onClick={handleToggleCode} />
        </div>
      </div>

      {activePanel && cardRef.current === card.id && (
        <div className="absolute inset-0 z-20 flex flex-col rounded-2xl border border-black/5 bg-white/80 p-2 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-gray-900/80 sm:p-3">
          <div className="mb-2 flex h-9 shrink-0 items-center justify-between border-b border-black/5 px-1 pb-2 dark:border-white/10">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {activePanel === 'approach' ? '思路解析' : '代码实现'}
            </h3>
            <button
              onClick={() => {
                if (activePanel === 'approach') handleToggleApproach();
                if (activePanel === 'code') handleToggleCode();
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ChevronUp className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            {activePanel === 'approach' && (
              <div className="h-full overflow-y-auto rounded-xl border border-black/5 bg-white/35 px-3 py-2.5 text-sm leading-relaxed text-gray-600 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                {card.approach}
              </div>
            )}
            {activePanel === 'code' && (
              <div className="flex h-full min-h-0 flex-col">
                {languages.length > 1 && (
                  <div className="mb-2 flex shrink-0 flex-wrap gap-1.5">
                    {languages.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLang(lang)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                          selectedLang === lang
                            ? 'bg-primary text-white'
                            : 'bg-white/45 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-white/10'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                )}
                <CodeBlock code={codes[selectedLang] || ''} language={selectedLang} className="min-h-0 flex-1" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- QA Card (Statistics / ML / LLM / Jargon / Workplace) ----
function QAView({ card }: { card: QACard }) {
  const { state, dispatch } = useAppContext();
  const showAnswer = state.qaAnswerVisible;

  const handleToggleAnswer = () => {
    dispatch({ type: 'TOGGLE_QA_ANSWER' });
  };

  return (
    <div className="space-y-2">
      {/* Sticky header: Meta + Question + Tags */}
      <div className="sticky top-0 z-10 -mx-4 border-b border-black/5 bg-transparent px-4 pb-3 pt-1 dark:border-white/10 dark:bg-transparent sm:-mx-6 sm:px-6">
        <div className="mb-2 flex items-center justify-between gap-3 border-b border-black/5 pb-2 dark:border-white/10">
          <div className="min-w-0 flex-1">
            <ReviewMeta sm2={card.sm2} inline />
          </div>
          <NotesButton card={card} dispatch={dispatch} />
        </div>

        <div className="text-base font-bold text-gray-900 dark:text-gray-100 leading-relaxed text-justify px-4 overflow-x-auto">
            <MathText text={card.question} />
          </div>

          {card.tags && card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 px-4">
              {card.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-md text-xs bg-white/40 text-gray-600 dark:bg-white/5 dark:text-gray-400">
                  {tag}
                </span>
              ))}
              {card.subTopic && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                  {card.subTopic}
                </span>
              )}
            </div>
          )}
      </div>

      {/* Scrollable answer area */}
      <div>
      {/* Reveal / Hide Answer Toggle */}
      <div className="pt-1">
        <button
          onClick={handleToggleAnswer}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors w-full justify-center py-2 rounded-lg
            ${showAnswer
              ? 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
              : 'text-primary hover:text-primary-hover bg-primary/5 hover:bg-primary/10'}`}
        >
          {showAnswer ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>隐藏答案</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span>显示答案 — 先回忆再查看</span>
            </>
          )}
        </button>

        {/* Answer — collapsible with smooth transition */}
        <div
          className={`transition-all duration-400 ease-out ${
            showAnswer
              ? 'max-h-[2000px] opacity-100 mt-3 overflow-visible'
              : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <div key={showAnswer ? 'visible' : 'hidden'} className={`text-sm text-gray-700 dark:text-gray-300 leading-relaxed rounded-lg border border-black/5 bg-white/35 p-4 px-3 text-justify backdrop-blur-md dark:border-white/10 dark:bg-white/5 sm:px-4 ${showAnswer ? 'answer-reveal' : ''}`}>
            <MathText text={card.answer} />
          </div>
        </div>
      </div>

      {/* Source if available */}
      {card.source && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          参考: {card.source}
        </p>
      )}
      </div>
    </div>
  );
}

// ---- Main CardView ----
export default function CardView({ card, showApproach, showCode }: CardViewProps) {
  const shellClass = 'study-glass-card rounded-2xl p-4 sm:p-5 transition-shadow hover:shadow-xl card-slide-in h-full max-h-[32rem] flex flex-col relative overflow-hidden';

  if (isLeetCode(card)) {
    return (
      <div className={shellClass}>
        <div className="min-h-0 flex-1">
          <LeetCodeView card={card} showApproach={showApproach} showCode={showCode} />
        </div>
      </div>
    );
  }

  // QA cards with flip animation
  return (
    <div className={shellClass}>
      <div className="overflow-y-auto flex-1 pr-1 -mr-1">
        <QAView card={card} />
      </div>
    </div>
  );
}
