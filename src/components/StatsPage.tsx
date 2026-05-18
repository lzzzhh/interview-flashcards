import { useState, useRef, useMemo } from 'react';
import { ArrowLeft, BookOpen, CheckCircle, Clock, Zap, TrendingUp, Download, Upload } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CATEGORIES } from '../constants';
import { loadReviewLogs, getStreak, getTodayReviewed, getRecentAccuracy } from '../utils/reviewLogs';
import { loadProgress } from '../utils/storage';
import { getModuleDailyLimit, setModuleDailyLimit, loadCustomDecks } from '../utils/customDecks';
import { exportProgress, importProgress } from '../utils/backup';
import type { FlashCard } from '../types';
import type { Category } from '../types';

interface Props {
  onBack: () => void;
  category?: Category;
}

const TOTAL_MAP: Record<string, number> = {
  leetcode: 100, statistics: 199, 'machine-learning': 171, 'deep-learning': 32,
  llm: 37, agent: 26, jargon: 45, workplace: 76, 'vibe-coding': 23,
};

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const BLUE = 'var(--blue)';
const ORANGE = 'var(--orange)';
const GREEN = '#22C55E';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';

export default function StatsPage({ onBack, category }: Props) {
  const { state } = useAppContext();

  const allCards = useMemo(() => {
    const result: FlashCard[] = [];
    for (const cat of (category ? [CATEGORIES.find(c => c.key === category)!] : CATEGORIES)) {
      if (!cat) continue;
      const progress = loadProgress(cat.key);
      const cards = state.cardsById;
      for (const card of Object.values(cards)) {
        if (card.category !== cat.key) continue;
        const sm2 = progress.sm2[card.id] ? { ...card.sm2, ...progress.sm2[card.id] } : card.sm2;
        result.push({ ...card, sm2, favorited: progress.favorited.includes(card.id) });
      }
    }
    return result;
  }, [state.cardsById, category]);

  const totalCards = allCards.length;
  const mastered = allCards.filter(c => c.sm2?.state === 'review' && c.sm2?.interval >= 21).length;
  const dueCount = allCards.filter(c => {
    const s = c.sm2;
    return s && s.state !== 'new' && s.nextReview <= Date.now();
  }).length;
  const newCards = allCards.filter(c => !c.sm2 || c.sm2.state === 'new').length;
  const learning = allCards.filter(c => c.sm2?.state === 'learning').length;

  const logs = loadReviewLogs();
  const allLogs = Object.values(logs).flat();
  const streak = getStreak(allLogs);
  const todayCount = getTodayReviewed(allLogs);
  const accuracy = getRecentAccuracy(allLogs, 30);

  // Per-module breakdown
  const moduleStats = useMemo(() => {
    const cats = category ? [CATEGORIES.find(c => c.key === category)!] : CATEGORIES;
    return cats.filter(Boolean).map(cat => {
      const total = TOTAL_MAP[cat.key] ?? 0;
      const due = allCards.filter(c => {
        if (c.category !== cat.key) return false;
        const s = c.sm2;
        return s && s.state !== 'new' && s.nextReview <= Date.now();
      }).length;
      return { key: cat!.key, label: cat!.label, total, due };
    });
  }, [allCards, category]);

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

        {/* Header */}
        <div className="nav-bar -mx-5 px-5">
          <button onClick={onBack} className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </button>
          <h1 className="nav-title">学习统计</h1>
        </div>

        {/* Overview */}
        <div className="rounded-2xl p-4 mb-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatBox icon={<BookOpen className="w-4 h-4" />} label="总卡片" value={totalCards} color={BLUE} />
            <StatBox icon={<CheckCircle className="w-4 h-4" />} label="已掌握" value={mastered} color={GREEN} />
            <StatBox icon={<Clock className="w-4 h-4" />} label="待复习" value={dueCount} color={ORANGE} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-[11px]" style={{ color: TEXT_MUTED }}>连续学习</span>
              <p className="text-[20px] font-bold" style={{ color: TEXT_PRIMARY }}>{streak}<span className="text-[13px] font-normal" style={{ color: TEXT_MUTED }}>天</span></p>
            </div>
            <div className="rounded-xl px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-[11px]" style={{ color: TEXT_MUTED }}>今日已学</span>
              <p className="text-[20px] font-bold" style={{ color: TEXT_PRIMARY }}>{todayCount}<span className="text-[13px] font-normal" style={{ color: TEXT_MUTED }}>张</span></p>
        </div>
      </div>
    </div>
        </div>

        {/* Accuracy */}
        <div className="rounded-2xl p-4 mb-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <div className="grid grid-cols-3 gap-3">
            <StatBoxSmall icon={<Zap className="w-4 h-4" />} label="新卡数" value={newCards} color={BLUE} />
            <StatBoxSmall icon={<TrendingUp className="w-4 h-4" />} label="正确率" value={`${accuracy}%`} color={GREEN} />
            <StatBoxSmall icon={<Zap className="w-4 h-4" />} label="学习中的" value={learning} color="#CBD5E1" />
          </div>
        </div>

        {/* Module Breakdown */}
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <h2 className="text-[14px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>模块分布</h2>
          <div className="space-y-1.5">
            {moduleStats.map(m => (
              <div key={m.key} className="flex items-center justify-between py-1.5">
                <span className="text-[13px]" style={{ color: TEXT_PRIMARY }}>{m.label}</span>
                <div className="flex gap-4 text-right">
                  <span className="text-[12px]" style={{ color: TEXT_MUTED }}>共 {m.total}</span>
                  {m.due > 0 && <span className="text-[13px] font-semibold" style={{ color: ORANGE }}>{m.due} 待复习</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 每日新卡上限 */}
        <div className="rounded-2xl p-4 mt-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <h2 className="text-[14px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>每日新卡上限</h2>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => (
              <ModuleLimitRow key={cat.key} id={cat.key} label={cat.label} />
            ))}
            {loadCustomDecks().map((d) => (
              <ModuleLimitRow key={d.id} id={d.id} label={d.name} />
            ))}
          </div>
        </div>

        {/* 数据存储 */}
        <DataStorageSection />

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

function ModuleLimitRow({ id, label }: { id: string; label: string }) {
  const [limit, setLimit] = useState(() => getModuleDailyLimit(id));
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[12px] truncate flex-1" style={{ color: TEXT_MUTED }}>{label}</span>
      <div className="flex items-center gap-2">
        <input type="range" min="1" max="100" value={limit}
          onChange={(e) => { const v = Number(e.target.value); setLimit(v); setModuleDailyLimit(id, v); }}
          className="w-20 h-1.5 accent-[#2882d7]" />
        <span className="text-[13px] font-bold w-6 text-right" style={{ color: BLUE }}>{limit}</span>
      </div>
    </div>
  );
}

function DataStorageSection() {
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      await exportProgress();
      setMsg({ type: 'success', text: '导出成功' });
    } catch { setMsg({ type: 'error', text: '导出失败' }); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await importProgress(file);
    setMsg({ type: result.success ? 'success' : 'error', text: result.message });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="rounded-2xl p-4 mt-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
      <h2 className="text-[14px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>数据存储</h2>
      <div className="flex gap-2">
        <button onClick={handleExport} className="flex-1 py-2 rounded-xl text-[13px] font-medium flex items-center justify-center gap-1" style={{ backgroundColor: 'rgba(40,130,215,0.2)', color: BLUE }}>
          <Download className="w-4 h-4" />导出
        </button>
        <button onClick={() => fileRef.current?.click()} className="flex-1 py-2 rounded-xl text-[13px] font-medium flex items-center justify-center gap-1" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: TEXT_MUTED }}>
          <Upload className="w-4 h-4" />导入
        </button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
      </div>
      {msg && (
        <p className={`text-[11px] mt-2 ${msg.type === 'success' ? '' : ''}`} style={{ color: msg.type === 'success' ? '#22C55E' : '#EF4444' }}>{msg.text}</p>
      )}
    </div>
  );
}
