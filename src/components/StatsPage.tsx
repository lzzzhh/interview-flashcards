// src/components/StatsPage.tsx — 学习统计（统计投影表驱动）
import { useState } from 'react';
import { BookOpen, CheckCircle, Clock, Zap, Settings } from 'lucide-react';
import { loadStudyModeConfig, PACE_LABELS } from '../utils/studyModeConfig';
import { applyStudyModeConfig } from '../utils/applyStudyModeConfig';
import type { StatsSnapshotResponse } from '../api/types';
import { useStatsSnapshot } from '../repositories/useStatsSnapshot';
import BackButton from './BackButton';
import StudyModeSelector from './StudyModeSelector';

const BLUE = 'var(--blue)';
const GREEN = '#22C55E';
const ORANGE = 'var(--orange)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';
const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';

interface OverviewData {
  totalCards: number;
  dueCards: number;
  streak: number;
  stageCounts: { new: number; learning: number; review: number; relearning: number };
  masteredCards: number;
  masteryRate: number;
  today: {
    reviewCount: number;
    uniqueCardCount: number;
    correctCount: number;
    wrongCount: number;
    correctRate: number | null;
  };
  moduleStats: { key: string; label: string; total: number; started: number }[];
}

interface Props {
  onBack: () => void;
}

function snapshotToOverview(snapshot: StatsSnapshotResponse): OverviewData {
  const global = snapshot.global;
  return {
    totalCards: global.totalCards,
    dueCards: global.dueCards,
    streak: global.streak,
    stageCounts: {
      new: global.newCards,
      learning: global.learningCards,
      review: global.reviewCards,
      relearning: global.relearningCards,
    },
    masteredCards: global.masteredCards,
    masteryRate: global.masteryRate,
    today: {
      reviewCount: global.todayReviewCount,
      uniqueCardCount: global.todayStudiedCards,
      correctCount: global.todayCorrectCount,
      wrongCount: global.todayWrongCount,
      correctRate: global.correctRate,
    },
    moduleStats: snapshot.decks.map((deck) => ({
      key: deck.scopeId,
      label: deck.label,
      total: deck.totalCards,
      started: deck.startedCards,
    })),
  };
}

export default function StatsPage({ onBack }: Props) {
  const { snapshot, loading, refresh } = useStatsSnapshot();
  const [modeModalOpen, setModeModalOpen] = useState(false);
  const data = snapshot ? snapshotToOverview(snapshot) : null;

  const savedConfig = loadStudyModeConfig();
  const activeMode = savedConfig?.mode ?? 'normal';
  const activeLabel = PACE_LABELS[activeMode] || '正常';

  if (!data || loading) {
    return (
      <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen">
        <div className="nav-bar sticky top-0 z-20 flex items-center">
          <BackButton onClick={onBack} />
          <h1 className="nav-title">学习统计</h1>
        </div>
        <div className="flex-1 flex items-center justify-center"><p style={{ color: TEXT_MUTED }}>加载中...</p></div>
      </div>
    );
  }

  const correctRateText = data.today.correctRate !== null ? `${data.today.correctRate}%` : '--';

  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center">
        <BackButton onClick={onBack} />
        <h1 className="nav-title">学习统计</h1>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-8 pb-24">

        {/* 1. 顶部概览 */}
        <div className="rounded-2xl p-4 mb-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatBox icon={<BookOpen className="w-4 h-4" />} label="总卡片" value={data.totalCards} color={BLUE} />
            <StatBox icon={<CheckCircle className="w-4 h-4" />} label="今日已学" value={data.today.uniqueCardCount} color={GREEN} />
            <StatBox icon={<Clock className="w-4 h-4" />} label="待复习" value={data.dueCards} color={ORANGE} />
          </div>
          <div className="flex justify-between text-[11px] px-1" style={{ color: TEXT_MUTED }}>
            <span>连续 {data.streak} 天</span>
            <span>正确率 {correctRateText}</span>
          </div>
        </div>

        {/* 2. 学习进度 */}
        <div className="rounded-2xl p-4 mb-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <h2 className="text-[14px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>学习进度</h2>
          <div className="w-full h-3 rounded-full mb-1" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${data.masteryRate}%`, backgroundColor: GREEN }} />
          </div>
          <p className="text-[11px] mb-4" style={{ color: TEXT_MUTED }}>
            已掌握 {data.masteredCards} / {data.totalCards} · {data.masteryRate}%
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <StageBadge label="新学" count={data.stageCounts.new} color={BLUE} />
            <StageBadge label="学习中" count={data.stageCounts.learning} color={ORANGE} />
            <StageBadge label="复习" count={data.stageCounts.review} color={GREEN} />
            <StageBadge label="重学" count={data.stageCounts.relearning} color="#EF4444" />
          </div>
        </div>

        {/* 3. 今日表现 */}
        <div className="rounded-2xl p-4 mb-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <h2 className="text-[14px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>今日表现</h2>
          <div className="grid grid-cols-3 gap-3">
            <StatBoxSmall label="今日已学" value={data.today.reviewCount} color={BLUE} />
            <StatBoxSmall label="正确率" value={correctRateText} color={GREEN} />
            <StatBoxSmall label="错误" value={data.today.wrongCount} color="#EF4444" />
          </div>
        </div>

        {/* 学习模式 */}
        <div className="rounded-2xl p-4 mb-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <button onClick={() => setModeModalOpen(true)} className="flex items-center justify-between w-full text-left">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: ORANGE }} />
              <h2 className="text-[14px] font-bold" style={{ color: TEXT_PRIMARY }}>学习模式 · {activeLabel}</h2>
            </div>
            <Settings className="w-4 h-4" style={{ color: TEXT_MUTED }} />
          </button>
          {savedConfig && (
            <div className="mt-2 text-[11px]" style={{ color: TEXT_MUTED }}>
              {savedConfig.selectedDecks.length} 个牌组 · {savedConfig.targetDays} 天 · 自动解决≥{savedConfig.autoResolveInterval}天
            </div>
          )}
        </div>

        {/* Mode Selector Modal */}
        {modeModalOpen && (
          <StudyModeSelector
            snapshot={snapshot}
            variant="modal"
            onCancel={() => setModeModalOpen(false)}
            onApply={async (config) => {
              await applyStudyModeConfig(config, snapshot);
              setModeModalOpen(false);
              refresh();
            }}
          />
        )}

        {/* 4. 模块分布 */}
        <div className="rounded-2xl p-4 mb-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <h2 className="text-[14px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>模块分布</h2>
          <div className="space-y-2">
            {data.moduleStats.map(m => {
              const pct = m.total > 0 ? Math.round((m.started / m.total) * 100) : 0;
              return (
                <div key={m.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px]" style={{ color: TEXT_PRIMARY }}>{m.label}</span>
                    <span className="text-[11px]" style={{ color: TEXT_MUTED }}>{m.started}/{m.total}</span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: BLUE }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-1" style={{ color }}>{icon}</div>
      <div className="text-[11px] mb-0.5" style={{ color: TEXT_MUTED }}>{label}</div>
      <div className="text-[18px] font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

function StatBoxSmall({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="text-center">
      <div className="text-[11px] mb-0.5" style={{ color: TEXT_MUTED }}>{label}</div>
      <div className="text-[18px] font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

function StageBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div>
      <div className="text-[20px] font-bold" style={{ color }}>{count}</div>
      <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{label}</div>
    </div>
  );
}
