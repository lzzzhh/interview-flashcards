// src/components/StatsPage.tsx — 学习统计（纯后端 API 驱动）
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, BookOpen, CheckCircle, Clock, ChevronDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CATEGORIES } from '../constants';
import { getModuleDailyLimit, setModuleDailyLimit, getModuleDailyReviewLimit, setModuleDailyReviewLimit, loadCustomDecks } from '../utils/customDecks';

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

export default function StatsPage({ onBack }: Props) {
  const { dueCountByCategory, totalNew } = useAppContext();
  const [data, setData] = useState<OverviewData | null>(null);
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [reviewLimitsOpen, setReviewLimitsOpen] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:3001/api/stats/overview?timezone=Australia/Sydney`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const dueCount = useMemo(() => {
    let t = 0;
    for (const cat of CATEGORIES) t += dueCountByCategory[cat.key] ?? 0;
    return t;
  }, [dueCountByCategory]);

  if (!data) {
    return (
      <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen">
        <div className="nav-bar sticky top-0 z-20 flex items-center">
          <button onClick={onBack} className="p-1 -ml-1"><ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} /></button>
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
        <button onClick={onBack} className="p-1 -ml-1"><ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} /></button>
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
            <StatBoxSmall label="复习次数" value={data.today.reviewCount} color={BLUE} />
            <StatBoxSmall label="正确率" value={correctRateText} color={GREEN} />
            <StatBoxSmall label="错误" value={data.today.wrongCount} color="#EF4444" />
          </div>
        </div>

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

        {/* 每日上限 */}
        <div className="rounded-2xl p-4 mb-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <button onClick={() => setLimitsOpen(!limitsOpen)} className="flex items-center justify-between w-full text-left">
            <h2 className="text-[14px] font-bold" style={{ color: TEXT_PRIMARY }}>每日新卡上限</h2>
            <ChevronDown className="w-4 h-4 transition-transform" style={{ color: TEXT_MUTED, transform: limitsOpen ? 'rotate(180deg)' : '' }} />
          </button>
          {limitsOpen && (
            <div className="space-y-2 mt-3">
              {CATEGORIES.map(cat => <ModuleLimitRow key={cat.key} id={cat.key} label={cat.label} type="new" />)}
              {loadCustomDecks().map(d => <ModuleLimitRow key={d.id} id={d.id} label={d.name} type="new" />)}
            </div>
          )}
        </div>

        <div className="rounded-2xl p-4 mb-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <button onClick={() => setReviewLimitsOpen(!reviewLimitsOpen)} className="flex items-center justify-between w-full text-left">
            <h2 className="text-[14px] font-bold" style={{ color: TEXT_PRIMARY }}>每日复习上限</h2>
            <ChevronDown className="w-4 h-4 transition-transform" style={{ color: TEXT_MUTED, transform: reviewLimitsOpen ? 'rotate(180deg)' : '' }} />
          </button>
          {reviewLimitsOpen && (
            <div className="space-y-2 mt-3">
              {CATEGORIES.map(cat => <ModuleLimitRow key={cat.key} id={cat.key} label={cat.label} type="review" />)}
              {loadCustomDecks().map(d => <ModuleLimitRow key={d.id} id={d.id} label={d.name} type="review" />)}
            </div>
          )}
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

function ModuleLimitRow({ id, label, type }: { id: string; label: string; type: 'new' | 'review' }) {
  const getter = type === 'new' ? getModuleDailyLimit : getModuleDailyReviewLimit;
  const setter = type === 'new' ? setModuleDailyLimit : setModuleDailyReviewLimit;
  const [limit, setLimit] = useState(() => getter(id));

  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px]" style={{ color: TEXT_PRIMARY }}>{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min="0"
          max="100"
          value={limit}
          onChange={e => { const v = Number(e.target.value); setLimit(v); setter(id, v); }}
          className="w-24 h-1.5 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: 'var(--blue)' }}
        />
        <span className="text-[13px] font-medium min-w-[24px] text-right" style={{ color: TEXT_PRIMARY }}>{limit}</span>
      </div>
    </div>
  );
}
