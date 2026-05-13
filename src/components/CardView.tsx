// ============================================================
// src/components/CardView.tsx — 核心卡片组件（含 Anki 复习状态）
// ============================================================

import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Repeat } from 'lucide-react';
import type { FlashCard, LeetCodeCard, QACard } from '../types';
import { DIFFICULTY_LABEL, DIFFICULTY_COLOR } from '../constants';
import { useAppContext } from '../context/AppContext';
import MathText from './MathText';

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
function ReviewMeta({ sm2 }: { sm2: { repetitions: number; easeFactor: number; interval: number; nextReview: number } }) {
  const stage = getReviewStage(sm2);
  const due = getDueStatus(sm2.nextReview);

  return (
    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 pb-2 mb-2 sticky top-0 bg-white dark:bg-gray-800 z-10 -mx-6 px-6 pt-1">
      <span className="flex items-center gap-1">
        <Repeat className="w-3 h-3" />
        重复 {sm2.repetitions} 次
      </span>
      <span className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        间隔 {formatInterval(sm2.interval)}
      </span>
      <span className={`font-medium ${stage.color}`}>{stage.label}</span>
      {due.isDue && (
        <span className="ml-auto px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 font-medium">
          {due.overdueDays > 0 ? `逾期 ${due.overdueDays} 天` : '到期'}
        </span>
      )}
    </div>
  );
}

// ---- LeetCode Card ----
function LeetCodeView({ card, showApproach, showCode }: { card: LeetCodeCard; showApproach: boolean; showCode: boolean }) {
  const { dispatch } = useAppContext();
  const [localApproach, setLocalApproach] = useState(false);
  const [localCode, setLocalCode] = useState(false);

  const approachOpen = showApproach || localApproach;
  const codeOpen = showCode || localCode;

  // When clicking the toggle button:
  // - If global flag is ON, turn it OFF (so the button closes it)
  // - If global flag is OFF, toggle local state
  const handleToggleApproach = () => {
    if (showApproach) {
      dispatch({ type: 'TOGGLE_APPROACH' });
    } else {
      setLocalApproach((prev) => !prev);
    }
  };

  const handleToggleCode = () => {
    if (showCode) {
      dispatch({ type: 'TOGGLE_CODE' });
    } else {
      setLocalCode((prev) => !prev);
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* Review Meta */}
      <ReviewMeta sm2={card.sm2} />

      {/* Header: Number + Title + Difficulty */}
      <div className="flex items-start gap-3">
        <span className="text-lg font-bold text-primary whitespace-nowrap">
          #{card.number}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {card.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {card.titleCn}
          </p>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${DIFFICULTY_COLOR[card.difficulty]}`}
        >
          {DIFFICULTY_LABEL[card.difficulty]}
        </span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {card.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Description */}
      <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <MathText text={card.description} />
      </div>

      {/* Approach — collapsible */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <button
          onClick={handleToggleApproach}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
        >
          <span>💡 显示思路</span>
          {approachOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            approachOpen ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 max-h-48 overflow-y-auto">
            {card.approach}
          </div>
        </div>
      </div>

      {/* Code — collapsible, terminal style */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <button
          onClick={handleToggleCode}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
        >
          <span>📝 显示代码</span>
          {codeOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            codeOpen ? 'max-h-[600px] opacity-100 mt-2' : 'max-h-0 opacity-0'
          }`}
        >
          <pre className="text-sm font-mono leading-relaxed bg-gray-100 text-gray-800 dark:bg-[#1e1e2e] dark:text-[#4ade80] rounded-lg p-4 overflow-x-auto max-h-60 overflow-y-auto">
            <code>{card.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

// ---- QA Card (Statistics / ML / LLM / Jargon / Workplace) ----
function QAView({ card }: { card: QACard }) {
  return (
    <div className="space-y-4 text-left">
      {/* Review Meta */}
      <ReviewMeta sm2={card.sm2} />

      {/* Question / Term */}
      <div className="text-base font-bold text-gray-900 dark:text-gray-100 leading-relaxed">
        {card.question}
      </div>

      {/* Tags if any */}
      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* SubTopic badge */}
      {card.subTopic && (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
          {card.subTopic}
        </span>
      )}

      {/* Answer — with math rendering */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          <MathText text={card.answer} />
        </div>
      </div>

      {/* Source if available */}
      {card.source && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          参考: {card.source}
        </p>
      )}
    </div>
  );
}

// ---- Main CardView ----
export default function CardView({ card, showApproach, showCode }: CardViewProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-shadow hover:shadow-md animate-fadeIn max-h-[calc(100vh-13rem)] flex flex-col">
      <div className="overflow-y-auto flex-1 pr-1 -mr-1">
        {isLeetCode(card) ? (
          <LeetCodeView card={card} showApproach={showApproach} showCode={showCode} />
        ) : (
          <QAView card={card} />
        )}
      </div>
    </div>
  );
}
