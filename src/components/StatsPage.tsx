import { useState, useMemo } from 'react';
import { ArrowLeft, BookOpen, CheckCircle, Clock, ChevronDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CATEGORIES } from '../constants';
import { loadReviewLogs, getStreak, getTodayReviewed, getRecentAccuracy } from '../utils/reviewLogs';
import { getModuleDailyLimit, setModuleDailyLimit, loadCustomDecks, getModuleDailyReviewLimit, setModuleDailyReviewLimit } from '../utils/customDecks';
import { useDecks, deriveGlobalStats } from '../repositories/useDeckStats';
import type { Category } from '../types';

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const BLUE = 'var(--blue)';
const ORANGE = 'var(--orange)';
const GREEN = '#22C55E';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';

interface Props {
  onBack: () => void;
  category?: Category;
}

export default function StatsPage({ onBack }: Props) {
  const { dueCountByCategory, totalNew } = useAppContext();
  const { decks } = useDecks();
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [reviewLimitsOpen, setReviewLimitsOpen] = useState(false);

  const globalStats = useMemo(() => deriveGlobalStats(decks), [decks]);
  const dueCount = useMemo(() => {
    let t = 0;
    for (const cat of CATEGORIES) t += dueCountByCategory[cat.key] ?? 0;
    return t;
  }, [dueCountByCategory]);

  const logs = loadReviewLogs();
  const allLogs = Object.values(logs).flat();
  const streak = getStreak(allLogs);
  const todayCount = getTodayReviewed(allLogs);
  const accuracy = getRecentAccuracy(allLogs, 30);

  // Per-module breakdown from API
  const moduleStats = useMemo(() => {
    return decks.map(d => ({
      key: d.id,
      label: CATEGORIES.find(c => c.key === d.id)?.label || d.name,
      total: d.stats.total,
      started: d.stats.total - d.stats.newCount,
    }));
  }, [decks]);

  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center">
        <button onClick={onBack} className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="nav-title">学习统计</h1>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-8 pb-24">

        {/* Overview */}
        <div className="rounded-2xl p-4 mb-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatBox icon={<BookOpen className="w-4 h-4" />} label="总卡片" value={globalStats.totalCards} color={BLUE} />
            <StatBox icon={<CheckCircle className="w-4 h-4" />} label="已掌握" value={globalStats.mastered} color={GREEN} />
            <StatBox icon={<Clock className="w-4 h-4" />} label="待复习" value={dueCount} color={ORANGE} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl px-3 py-2 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-[11px]" style={{ color: TEXT_MUTED }}>连续学习</span>
              <p className="text-[16px] font-bold mt-0.5" style={{ color: TEXT_PRIMARY }}>{streak}<span className="text-[11px] font-normal ml-0.5" style={{ color: TEXT_MUTED }}>天</span></p>
            </div>
            <div className="rounded-xl px-3 py-2 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-[11px]" style={{ color: TEXT_MUTED }}>今日已学</span>
              <p className="text-[16px] font-bold mt-0.5" style={{ color: TEXT_PRIMARY }}>{todayCount}<span className="text-[11px] font-normal ml-0.5" style={{ color: TEXT_MUTED }}>张</span></p>
            </div>
          </div>
          <div className="mt-3 flex justify-between text-[11px] px-1" style={{ color: TEXT_MUTED }}>
            <span>正确率 {accuracy}%</span>
            <span>新卡 {totalNew} · 学习中 {globalStats.learningCount}</span>
          </div>
        </div>

        {/* 掌握率 */}
        <div className="rounded-2xl p-4 mb-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <h2 className="text-[14px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>掌握率</h2>
          <div className="w-full h-3 rounded-full mb-1" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all"               style={{ width: `${globalStats.totalCards > 0 ? Math.round((globalStats.mastered / globalStats.totalCards) * 100) : 0}%`, backgroundColor: GREEN }} />
          </div>
          <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
            已掌握 {globalStats.mastered} / {globalStats.totalCards} · {globalStats.totalCards > 0 ? Math.round((globalStats.mastered / globalStats.totalCards) * 100) : 0}%
          </p>
          <h2 className="text-[14px] font-bold mt-4 mb-2" style={{ color: TEXT_PRIMARY }}>复习阶段</h2>
          <div className="grid grid-cols-4 gap-2 text-center">
            <StageBadge label="新学" count={totalNew} color={BLUE} />
            <StageBadge label="学习中" count={globalStats.learningCount} color={ORANGE} />
            <StageBadge label="复习" count={globalStats.mastered} color={GREEN} />
            <StageBadge label="重学" count={globalStats.relearning} color="#EF4444" />
          </div>
        </div>

        {/* Module Breakdown */}
        <div className="rounded-2xl p-4 mb-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <h2 className="text-[14px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>模块分布</h2>
          <div className="space-y-2">
            {moduleStats.map(m => {
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

        {/* 每日新卡上限 */}
        <div className="rounded-2xl p-4 mt-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <button onClick={() => setLimitsOpen(!limitsOpen)} className="flex items-center justify-between w-full text-left">
            <h2 className="text-[14px] font-bold" style={{ color: TEXT_PRIMARY }}>每日新卡上限</h2>
            <ChevronDown className={`w-4 h-4 transition-transform`} style={{ color: TEXT_MUTED, transform: limitsOpen ? 'rotate(180deg)' : '' }} />
          </button>
          {limitsOpen && (
            <div className="space-y-2 mt-3">
              {CATEGORIES.map((cat) => (
                <ModuleLimitRow key={cat.key} id={cat.key} label={cat.label} type="new" />
              ))}
              {loadCustomDecks().map((d) => (
                <ModuleLimitRow key={d.id} id={d.id} label={d.name} type="new" />
              ))}
            </div>
          )}
        </div>

        {/* 每日复习上限 */}
        <div className="rounded-2xl p-4 mt-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <button onClick={() => setReviewLimitsOpen(!reviewLimitsOpen)} className="flex items-center justify-between w-full text-left">
            <h2 className="text-[14px] font-bold" style={{ color: TEXT_PRIMARY }}>每日复习上限</h2>
            <ChevronDown className={`w-4 h-4 transition-transform`} style={{ color: TEXT_MUTED, transform: reviewLimitsOpen ? 'rotate(180deg)' : '' }} />
          </button>
          {reviewLimitsOpen && (
            <div className="space-y-2 mt-3">
              {CATEGORIES.map((cat) => (
                <ModuleLimitRow key={cat.key} id={cat.key} label={cat.label} type="review" />
              ))}
              {loadCustomDecks().map((d) => (
                <ModuleLimitRow key={d.id} id={d.id} label={d.name} type="review" />
              ))}
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
      <div className="text-[11px] mb-0.5" style={{ color }}>{label}</div>
      <div className="text-[24px] font-bold" style={{ color }}>{value}</div>
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
  const [limit, setLimit] = useState(() =>
    type === 'new' ? getModuleDailyLimit(id) : getModuleDailyReviewLimit(id)
  );
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[12px] truncate flex-1" style={{ color: TEXT_MUTED }}>{label}</span>
      <div className="flex items-center gap-2">
        <input type="range" min={type === 'new' ? 0 : 0} max={type === 'new' ? 100 : 300} value={limit}
          onChange={(e) => { const v = Number(e.target.value); setLimit(v); type === 'new' ? setModuleDailyLimit(id, v) : setModuleDailyReviewLimit(id, v); }}
          className="w-20 h-1.5 accent-[#2882d7]" />
        <span className="text-[13px] font-bold w-6 text-right" style={{ color: type === 'new' ? BLUE : ORANGE }}>{limit}</span>
      </div>
    </div>
  );
}
