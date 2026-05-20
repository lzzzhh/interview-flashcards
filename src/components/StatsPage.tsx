import { useState, useMemo } from 'react';
import { ArrowLeft, BookOpen, CheckCircle, Clock, Zap, TrendingUp, ChevronDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CATEGORIES } from '../constants';
import { loadReviewLogs, getStreak, getTodayReviewed, getRecentAccuracy } from '../utils/reviewLogs';
import { getModuleDailyLimit, setModuleDailyLimit, loadCustomDecks, loadCustomCards } from '../utils/customDecks';
import { loadProgress } from '../utils/storage';
import { leetcodeHot100 } from '../data/leetcode-hot100';
import { statisticsCards } from '../data/statistics';
import { machineLearningCards } from '../data/machine-learning';
import { deepLearningCards } from '../data/deep-learning';
import { llmCards } from '../data/llm';
import { agentCards } from '../data/agent';
import { jargonCards } from '../data/jargon';
import { workplaceCards } from '../data/workplace';
import { vibeCodingCards } from '../data/vibe-coding';
import type { Category, FlashCard } from '../types';

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
  const { dueCountByCategory, state } = useAppContext();
  const [limitsOpen, setLimitsOpen] = useState(false);

  // 全局统计：遍历所有内置模块 + 自定义牌组，从 localStorage 读取真实进度
  const globalStats = useMemo(() => {
    const builtinSources: [Category, FlashCard[]][] = [
      ['leetcode', leetcodeHot100 as FlashCard[]],
      ['statistics', statisticsCards as FlashCard[]],
      ['machine-learning', machineLearningCards as FlashCard[]],
      ['deep-learning', deepLearningCards as FlashCard[]],
      ['llm', llmCards as FlashCard[]],
      ['agent', agentCards as FlashCard[]],
      ['jargon', jargonCards as FlashCard[]],
      ['workplace', workplaceCards as FlashCard[]],
      ['vibe-coding', vibeCodingCards as FlashCard[]],
    ];

    let totalCards = 0;
    let newCards = 0;
    let mastered = 0;
    let learningCount = 0;
    let relearning = 0;
    const moduleTotals: Record<string, number> = {};
    const moduleNew: Record<string, number> = {};

    for (const [cat, cards] of builtinSources) {
      const progress = loadProgress(cat);
      const catNew = cards.filter((c) => {
        const sm2 = progress.sm2[c.id];
        return !sm2 || sm2.state === 'new';
      }).length;
      const catMastered = cards.filter((c) => {
        const sm2 = progress.sm2[c.id];
        return sm2 && sm2.state === 'review' && sm2.interval >= 21;
      }).length;
      const catLearning = cards.filter((c) => {
        const sm2 = progress.sm2[c.id];
        return sm2?.state === 'learning';
      }).length;
      const catRelearning = cards.filter((c) => {
        const sm2 = progress.sm2[c.id];
        return sm2?.state === 'relearning';
      }).length;
      totalCards += cards.length;
      newCards += catNew;
      mastered += catMastered;
      learningCount += catLearning;
      relearning += catRelearning;
      moduleTotals[cat] = cards.length;
      moduleNew[cat] = catNew;
    }

    // 自定义牌组
    for (const deck of loadCustomDecks()) {
      const customCards = loadCustomCards(deck.id);
      const progress = loadProgress(deck.id as Category);
      const catNew = customCards.filter((c) => {
        const sm2 = progress.sm2[c.id];
        return !sm2 || sm2.state === 'new';
      }).length;
      const catMastered = customCards.filter((c) => {
        const sm2 = progress.sm2[c.id];
        return sm2 && sm2.state === 'review' && sm2.interval >= 21;
      }).length;
      const catLearning = customCards.filter((c) => {
        const sm2 = progress.sm2[c.id];
        return sm2?.state === 'learning';
      }).length;
      const catRelearning = customCards.filter((c) => {
        const sm2 = progress.sm2[c.id];
        return sm2?.state === 'relearning';
      }).length;
      totalCards += customCards.length;
      newCards += catNew;
      mastered += catMastered;
      learningCount += catLearning;
      relearning += catRelearning;
      moduleTotals[deck.id] = customCards.length;
      moduleNew[deck.id] = catNew;
    }

    return { totalCards, newCards, mastered, learningCount, relearning, moduleTotals, moduleNew };
  }, [state.cardsById]);
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

  // Per-module breakdown
  const moduleStats = useMemo(() => {
    return CATEGORIES.map(cat => ({
      key: cat.key, label: cat.label,
      total: globalStats.moduleTotals[cat.key] ?? 0,
      started: (globalStats.moduleTotals[cat.key] ?? 0) - (globalStats.moduleNew[cat.key] ?? 0),
    }));
  }, [globalStats]);

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

        {/* Accuracy */}
        <div className="rounded-2xl p-4 mb-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <div className="grid grid-cols-3 gap-3">
            <StatBoxSmall icon={<Zap className="w-4 h-4" />} label="新卡数" value={globalStats.newCards} color={BLUE} />
            <StatBoxSmall icon={<TrendingUp className="w-4 h-4" />} label="正确率" value={`${accuracy}%`} color={GREEN} />
            <StatBoxSmall icon={<Zap className="w-4 h-4" />} label="学习中的" value={globalStats.learningCount} color="#CBD5E1" />
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
                <ModuleLimitRow key={cat.key} id={cat.key} label={cat.label} />
              ))}
              {loadCustomDecks().map((d) => (
                <ModuleLimitRow key={d.id} id={d.id} label={d.name} />
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

function ModuleLimitRow({ id, label }: { id: string; label: string }) {
  const [limit, setLimit] = useState(() => getModuleDailyLimit(id));
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[12px] truncate flex-1" style={{ color: TEXT_MUTED }}>{label}</span>
      <div className="flex items-center gap-2">
        <input type="range" min="0" max="100" value={limit}
          onChange={(e) => { const v = Number(e.target.value); setLimit(v); setModuleDailyLimit(id, v); }}
          className="w-20 h-1.5 accent-[#2882d7]" />
        <span className="text-[13px] font-bold w-6 text-right" style={{ color: BLUE }}>{limit}</span>
      </div>
    </div>
  );
}
