// ============================================================
// src/components/CardView.tsx — 核心卡片组件
// ============================================================

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { FlashCard, LeetCodeCard, QACard } from '../types';
import { DIFFICULTY_LABEL, DIFFICULTY_COLOR } from '../constants';

interface CardViewProps {
  card: FlashCard;
  showApproach: boolean;
  showCode: boolean;
}

function isLeetCode(card: FlashCard): card is LeetCodeCard {
  return card.category === 'leetcode';
}

// ---- LeetCode Card ----
function LeetCodeView({ card, showApproach, showCode }: { card: LeetCodeCard; showApproach: boolean; showCode: boolean }) {
  const [localApproach, setLocalApproach] = useState(false);
  const [localCode, setLocalCode] = useState(false);

  const approachOpen = showApproach || localApproach;
  const codeOpen = showCode || localCode;

  return (
    <div className="space-y-4 text-left">
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
        {card.description}
      </div>

      {/* Approach — collapsible */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <button
          onClick={() => setLocalApproach(!localApproach)}
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
          <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            {card.approach}
          </div>
        </div>
      </div>

      {/* Code — collapsible, terminal style */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <button
          onClick={() => setLocalCode(!localCode)}
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
          <pre className="text-sm font-mono leading-relaxed bg-[#1e1e2e] text-[#4ade80] rounded-lg p-4 overflow-x-auto">
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

      {/* Answer — with formatting */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          {card.answer}
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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-shadow hover:shadow-md animate-fadeIn">
      {isLeetCode(card) ? (
        <LeetCodeView card={card} showApproach={showApproach} showCode={showCode} />
      ) : (
        <QAView card={card} />
      )}
    </div>
  );
}
