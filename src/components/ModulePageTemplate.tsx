import { useState } from 'react';
import { ArrowLeft, ChevronRight, X } from 'lucide-react';

export interface ModuleTopicCardModel {
  key: string;
  title: string;
  newCount: number;
  dueCount: number;
  total: number;
  completed: number;
  progress: number;
  isCustom?: boolean;
}

const TEXT_PRIMARY = '#F8FAFC';
const TEXT_MUTED = 'rgba(226,232,240,0.85)';
const BLUE = '#2882d7';
const ORANGE = '#FF9A2E';
const CARD_BG = 'rgba(255,255,255,0.15)';
const CARD_BORDER = 'rgba(255,255,255,0.3)';

interface Props {
  categoryLabel: string;
  moduleDue: number;
  totalNewCards: number;
  totalCards: number;
  topics: ModuleTopicCardModel[];
  onBack: () => void;
  onStartReview: () => void;
  onTopicClick: (topic: ModuleTopicCardModel) => void;
  onDeleteTopic?: (topic: ModuleTopicCardModel) => void;
  deleteMode?: boolean;
}

export default function ModulePageTemplate({
  categoryLabel, moduleDue, totalNewCards, totalCards, topics,
  onBack, onStartReview, onTopicClick, onDeleteTopic, deleteMode,
}: Props) {
  return (
    <div className="dark-bg homepage-glass-stage flex min-h-screen items-center justify-center transition-colors">
      <div className="relative z-10 w-full max-w-md px-5 py-8 pb-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} />
          </button>
          <h1 className="text-[20px] font-bold" style={{ color: TEXT_PRIMARY }}>{categoryLabel}</h1>
        </div>

        {/* Stats Card */}
        <div className="rounded-2xl p-4 mb-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatBlock label="待复习" value={moduleDue} color={ORANGE} />
            <StatBlock label="新卡" value={totalNewCards} color={BLUE} />
            <StatBlock label="总卡片" value={totalCards} color="#CBD5E1" />
          </div>
          <button
            onClick={onStartReview}
            className="w-full py-2.5 rounded-xl text-[15px] font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${BLUE}, #2563EB)` }}
          >
            开始复习
          </button>
        </div>

        {/* Topic Grid */}
        <div className="grid grid-cols-2 gap-2">
          {topics.map((topic) => (
            <button
              key={topic.key}
              onClick={() => onTopicClick(topic)}
              className="rounded-xl p-3 text-left border transition-colors"
              style={{ borderColor: CARD_BORDER, backgroundColor: CARD_BG }}
            >
              <h3 className="text-[13px] font-bold truncate" style={{ color: TEXT_PRIMARY }}>{topic.title}</h3>
              <div className="flex gap-3 mt-2">
                <div>
                  <div className="text-[10px]" style={{ color: TEXT_MUTED }}>新卡</div>
                  <div className="text-[13px] font-semibold" style={{ color: BLUE }}>{topic.newCount}</div>
                </div>
                <div>
                  <div className="text-[10px]" style={{ color: TEXT_MUTED }}>待复习</div>
                  <div className="text-[13px] font-semibold" style={{ color: ORANGE }}>{topic.dueCount}</div>
                </div>
                <div>
                  <div className="text-[10px]" style={{ color: TEXT_MUTED }}>总数</div>
                  <div className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>{topic.total}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}

function StatBlock({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className="text-[13px] mb-1" style={{ color }}>{label}</div>
      <div className="text-[16px] font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
