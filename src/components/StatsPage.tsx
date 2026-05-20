import { useState, useMemo } from 'react';
import { ArrowLeft, BookOpen, CheckCircle, Clock, Zap, TrendingUp, ChevronDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CATEGORIES } from '../constants';
import { loadReviewLogs, getStreak, getTodayReviewed, getRecentAccuracy, getDifficultCards } from '../utils/reviewLogs';
import { getModuleDailyLimit, setModuleDailyLimit, loadCustomDecks, getModuleDailyReviewLimit, setModuleDailyReviewLimit } from '../utils/customDecks';
import { useDecks, deriveGlobalStats } from '../repositories/useDeckStats';
import { calculateCountdownPlan } from '../utils/countdown';
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
  const { dueCountByCategory } = useAppContext();
  const { decks } = useDecks();
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [reviewLimitsOpen, setReviewLimitsOpen] = useState(false);
  const [countdownDate, setCountdownDate] = useState(() => {
    // 默认秋招日期：当年 9 月 1 日
    const now = new Date();
    return `${now.getFullYear()}-09-01`;
  });

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
      key: d.id, label: d.name,
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
        </div>

        {/* 薄弱知识点 */}
        <div className="rounded-2xl p-4 mb-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <h2 className="text-[14px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>薄弱知识点</h2>
          {(() => {
            const logs = loadReviewLogs();
            const allCardIds = Object.keys(logs);
            const difficult = getDifficultCards(logs, allCardIds);
            if (difficult.length === 0) {
              return <p className="text-[12px]" style={{ color: TEXT_MUTED }}>暂无薄弱知识点，继续加油!</p>;
            }
            return (
              <div className="space-y-1.5">
                {difficult.slice(0, 5).map(cardId => {
                  const cardLogs = logs[cardId] || [];
                  const recentLogs = cardLogs.filter(l => l.reviewedAt > Date.now() - 7 * 86400000);
                  const correctCount = recentLogs.filter(l => l.rating >= 3).length;
                  const acc = recentLogs.length > 0 ? Math.round((correctCount / recentLogs.length) * 100) : 0;
                  return (
                    <div key={cardId} className="flex items-center justify-between py-1.5 px-3 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.06)' }}>
                      <span className="text-[12px] truncate flex-1" style={{ color: TEXT_PRIMARY }}>{cardId}</span>
                      <span className="text-[11px] font-medium ml-2" style={{ color: acc < 50 ? '#EF4444' : '#F59E0B' }}>正确率 {acc}%</span>
                    </div>
                  );
                })}
                {difficult.length > 5 && (
                  <p className="text-[11px] text-center mt-1" style={{ color: TEXT_MUTED }}>还有 {difficult.length - 5} 个薄弱知识点</p>
                )}
              </div>
            );
          })()}
        </div>
        <div className="rounded-2xl p-4 mb-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <div className="grid grid-cols-3 gap-3">
            <StatBoxSmall icon={<Zap className="w-4 h-4" />} label="新卡数" value={globalStats.newCards} color={BLUE} />
            <StatBoxSmall icon={<TrendingUp className="w-4 h-4" />} label="正确率" value={`${accuracy}%`} color={GREEN} />
            <StatBoxSmall icon={<Zap className="w-4 h-4" />} label="学习中的" value={globalStats.learningCount} color="#CBD5E1" />
          </div>
        </div>

        {/* 秋招倒计时 */}
        <div className="rounded-2xl p-4 mb-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <h2 className="text-[14px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>秋招倒计时</h2>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="date"
              value={countdownDate}
              onChange={e => setCountdownDate(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border text-[13px] bg-transparent"
              style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
            />
          </div>
          {(() => {
            const plan = calculateCountdownPlan(countdownDate, useAppContext().state.cardsById);
            return (
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-[22px] font-bold" style={{ color: ORANGE }}>{plan.daysLeft}</div>
                  <div className="text-[11px]" style={{ color: TEXT_MUTED }}>剩余天数</div>
                </div>
                <div className="text-center">
                  <div className="text-[22px] font-bold" style={{ color: BLUE }}>{plan.dailyTarget}</div>
                  <div className="text-[11px]" style={{ color: TEXT_MUTED }}>每日目标</div>
                </div>
                <div className="text-center">
                  <div className="text-[22px] font-bold" style={{ color: '#EF4444' }}>{plan.dueCards}</div>
                  <div className="text-[11px]" style={{ color: TEXT_MUTED }}>待复习</div>
                </div>
              </div>
            );
          })()}
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
            <StageBadge label="新学" count={globalStats.newCards} color={BLUE} />
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

function StatBoxSmall({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-1" style={{ color }}>{icon}</div>
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
