import { useEffect, useMemo, useState } from 'react';
import { CATEGORIES } from '../constants';
import { agentCards } from '../data/agent';
import { deepLearningCards } from '../data/deep-learning';
import { jargonCards } from '../data/jargon';
import { leetcodeHot100 } from '../data/leetcode-hot100';
import { llmCards } from '../data/llm';
import { machineLearningCards } from '../data/machine-learning';
import { statisticsCards } from '../data/statistics';
import { vibeCodingCards } from '../data/vibe-coding';
import { workplaceCards } from '../data/workplace';
import type { StatsSnapshotResponse } from '../api/types';
import type { FlashCard, StudyModeConfig, StudyPaceMode } from '../types';
import { loadCustomCards, loadCustomDecks } from '../utils/customDecks';
import { loadProgress } from '../utils/storage';
import { computeDailyTotal, computeDefaultQuota, loadStudyModeConfig, PACE_LABELS, PACE_PRESETS } from '../utils/studyModeConfig';

const BLUE = 'var(--blue)';
const ORANGE = 'var(--orange)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';
const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';

const CARD_MODULES: [string, FlashCard[]][] = [
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

interface DeckOption {
  id: string;
  label: string;
  newCount: number;
}

interface Props {
  snapshot: StatsSnapshotResponse | null;
  onApply: (config: StudyModeConfig) => void | Promise<void>;
  onCancel?: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  variant?: 'modal' | 'screen';
  submitting?: boolean;
}

function getFallbackNewCount(deckId: string): number {
  const builtin = CARD_MODULES.find(([id]) => id === deckId);
  const cards = builtin ? builtin[1] : loadCustomCards(deckId);
  const progress = loadProgress(deckId);

  return cards.filter((card) => {
    const sm2 = progress.sm2[card.id] ?? card.sm2;
    return !sm2?.state || sm2.state === 'new';
  }).length;
}

function clampQuota(value: number, max: number): number {
  return Math.max(0, Math.min(max, Number.isFinite(value) ? value : 0));
}

function normalizeQuota(
  deckIds: string[],
  dailyTotal: number,
  newCardCounts: Record<string, number>,
  previous: Record<string, number>,
): Record<string, number> {
  if (deckIds.length === 0 || dailyTotal <= 0) return {};

  const next: Record<string, number> = {};
  for (const deckId of deckIds) {
    next[deckId] = clampQuota(previous[deckId] ?? 0, newCardCounts[deckId] ?? 0);
  }

  let current = Object.values(next).reduce((sum, value) => sum + value, 0);
  if (current < dailyTotal) {
    let remaining = dailyTotal - current;
    for (const deckId of deckIds) {
      const capacity = Math.max(0, (newCardCounts[deckId] ?? 0) - (next[deckId] ?? 0));
      const add = Math.min(capacity, remaining);
      next[deckId] = (next[deckId] ?? 0) + add;
      remaining -= add;
      if (remaining <= 0) break;
    }
  } else if (current > dailyTotal) {
    let excess = current - dailyTotal;
    for (let i = deckIds.length - 1; i >= 0 && excess > 0; i--) {
      const deckId = deckIds[i];
      const take = Math.min(next[deckId] ?? 0, excess);
      next[deckId] = (next[deckId] ?? 0) - take;
      excess -= take;
    }
  }

  return next;
}

export default function StudyModeSelector({
  snapshot,
  onApply,
  onCancel,
  title = '学习模式',
  description,
  confirmLabel = '确认',
  variant = 'modal',
  submitting = false,
}: Props) {
  const savedConfig = useMemo(() => loadStudyModeConfig(), []);
  const customDecks = useMemo(() => loadCustomDecks(), []);
  const allDecks = useMemo<DeckOption[]>(() => {
    const snapshotByDeck = new Map((snapshot?.decks ?? []).map((deck) => [deck.scopeId, deck]));
    return [
      ...CATEGORIES.map((category) => ({
        id: category.key,
        label: category.label,
        newCount: snapshotByDeck.get(category.key)?.newCards ?? getFallbackNewCount(category.key),
      })),
      ...customDecks.map((deck) => ({
        id: deck.id,
        label: deck.name,
        newCount: snapshotByDeck.get(deck.id)?.newCards ?? getFallbackNewCount(deck.id),
      })),
    ];
  }, [customDecks, snapshot]);

  const newCardCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const deck of allDecks) counts[deck.id] = deck.newCount;
    return counts;
  }, [allDecks]);

  const defaultSelected = useMemo(() => (
    savedConfig?.selectedDecks?.length
      ? savedConfig.selectedDecks.filter((id) => allDecks.some((deck) => deck.id === id))
      : allDecks.filter((deck) => deck.newCount > 0).slice(0, 3).map((deck) => deck.id)
  ), [allDecks, savedConfig]);

  const [mode, setMode] = useState<StudyPaceMode>(savedConfig?.mode ?? 'normal');
  const [customDays, setCustomDays] = useState(savedConfig?.targetDays ?? 90);
  const [customInterval, setCustomInterval] = useState(savedConfig?.autoResolveInterval ?? 90);
  const [selectedDecks, setSelectedDecks] = useState<string[]>(defaultSelected);

  const targetDays = mode === 'custom' ? customDays : (PACE_PRESETS[mode]?.targetDays ?? 90);
  const autoResolveInterval = mode === 'custom' ? customInterval : (PACE_PRESETS[mode]?.autoResolveInterval ?? 90);
  const selectedTotal = selectedDecks.reduce((sum, id) => sum + (newCardCounts[id] ?? 0), 0);
  const dailyTotal = selectedTotal > 0 ? computeDailyTotal(selectedTotal, targetDays) : 0;

  const [quota, setQuota] = useState<Record<string, number>>(() => {
    if (savedConfig?.dailyQuota) return { ...savedConfig.dailyQuota };
    return computeDefaultQuota(defaultSelected, newCardCounts, dailyTotal);
  });

  useEffect(() => {
    setQuota((previous) => normalizeQuota(selectedDecks, dailyTotal, newCardCounts, previous));
  }, [dailyTotal, newCardCounts, selectedDecks]);

  const toggleDeck = (deckId: string) => {
    setSelectedDecks((current) => (
      current.includes(deckId)
        ? current.filter((id) => id !== deckId)
        : [...current, deckId]
    ));
  };

  const adjustQuota = (deckId: string, delta: number) => {
    setQuota((current) => {
      const next = { ...current };
      const others = selectedDecks.filter((id) => id !== deckId);
      if (others.length === 0) return next;

      if (delta > 0) {
        const donor = others.find((id) => (next[id] ?? 0) > 0);
        if (!donor || (next[deckId] ?? 0) >= (newCardCounts[deckId] ?? 0)) return next;
        next[deckId] = (next[deckId] ?? 0) + 1;
        next[donor] = (next[donor] ?? 0) - 1;
      } else {
        const receiver = others.find((id) => (next[id] ?? 0) < (newCardCounts[id] ?? 0));
        if (!receiver || (next[deckId] ?? 0) <= 0) return next;
        next[deckId] = (next[deckId] ?? 0) - 1;
        next[receiver] = (next[receiver] ?? 0) + 1;
      }

      return next;
    });
  };

  const quotaSum = selectedDecks.reduce((sum, deckId) => sum + (quota[deckId] ?? 0), 0);
  const previewReview = quotaSum * 5;
  const canApply = selectedDecks.length > 0 && quotaSum > 0 && !submitting;

  const handleApply = () => {
    if (!canApply) return;
    const dailyQuota = Object.fromEntries(selectedDecks.map((deckId) => [deckId, quota[deckId] ?? 0]));
    void onApply({
      mode,
      targetDays,
      autoResolveInterval,
      selectedDecks,
      dailyQuota,
      dailyReviewMultiplier: 5,
    });
  };

  const card = (
    <div
      className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-5 pb-8 shadow-xl"
      style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER, border: '1px solid var(--card-border)' }}
    >
      <h2 className="text-[16px] font-bold mb-1" style={{ color: TEXT_PRIMARY }}>{title}</h2>
      {description && <p className="text-[12px] leading-relaxed mb-4" style={{ color: TEXT_MUTED }}>{description}</p>}

      <div className="grid grid-cols-2 gap-2 mb-4">
        {(['sprint', 'fast', 'normal', 'custom'] as StudyPaceMode[]).map((preset) => (
          <button
            key={preset}
            onClick={() => setMode(preset)}
            className="rounded-xl border px-3 py-2.5 text-[13px] font-medium text-left"
            style={{
              borderColor: mode === preset ? ORANGE : CARD_BORDER,
              backgroundColor: mode === preset ? 'rgba(249,115,22,0.08)' : 'transparent',
              color: mode === preset ? ORANGE : TEXT_PRIMARY,
            }}
          >
            <div>{PACE_LABELS[preset]}</div>
            <div className="text-[11px] opacity-60 mt-0.5" style={{ color: TEXT_MUTED }}>
              {preset === 'custom' ? '自定义' : `${PACE_PRESETS[preset]?.targetDays}天 · 解决≥${PACE_PRESETS[preset]?.autoResolveInterval}天`}
            </div>
          </button>
        ))}
      </div>

      {mode === 'custom' && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="text-[11px]" style={{ color: TEXT_MUTED }}>目标天数</label>
            <input
              type="number"
              min={1}
              max={365}
              value={customDays}
              onChange={(event) => setCustomDays(Number(event.target.value) || 90)}
              className="w-full rounded-lg border bg-transparent px-2 py-1.5 text-[13px]"
              style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
            />
          </div>
          <div className="flex-1">
            <label className="text-[11px]" style={{ color: TEXT_MUTED }}>自动解决≥</label>
            <input
              type="number"
              min={1}
              max={365}
              value={customInterval}
              onChange={(event) => setCustomInterval(Number(event.target.value) || 90)}
              className="w-full rounded-lg border bg-transparent px-2 py-1.5 text-[13px]"
              style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
            />
          </div>
        </div>
      )}

      <div className="mb-3">
        <label className="text-[12px] font-medium" style={{ color: TEXT_PRIMARY }}>选择牌组</label>
        <div className="text-[11px] mb-2" style={{ color: TEXT_MUTED }}>
          选中 {selectedDecks.length} 个 · {selectedTotal} 张新卡 · 每天 {quotaSum} 张
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {allDecks.map((deck) => {
            const checked = selectedDecks.includes(deck.id);
            return (
              <button
                key={deck.id}
                onClick={() => toggleDeck(deck.id)}
                className="flex items-center justify-between w-full rounded-lg px-2 py-1.5 text-[12px]"
                style={{ backgroundColor: checked ? 'rgba(64,156,255,0.08)' : 'transparent' }}
              >
                <span style={{ color: checked ? BLUE : TEXT_PRIMARY }}>
                  {checked ? '✓' : '○'} {deck.label}
                </span>
                <span style={{ color: TEXT_MUTED }}>{deck.newCount} 新</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDecks.length > 0 && (
        <div className="mb-4">
          <label className="text-[12px] font-medium" style={{ color: TEXT_PRIMARY }}>每日配额（总额 {quotaSum}/{dailyTotal}）</label>
          <div className="space-y-2 mt-2">
            {selectedDecks.map((deckId) => {
              const deck = allDecks.find((item) => item.id === deckId);
              const q = quota[deckId] || 0;
              const max = newCardCounts[deckId] || 1;
              return (
                <div key={deckId} className="flex items-center gap-2">
                  <span className="w-20 text-[11px] truncate" style={{ color: TEXT_MUTED }}>{deck?.label ?? deckId}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (q / max) * 100)}%`, backgroundColor: ORANGE }} />
                  </div>
                  <button onClick={() => adjustQuota(deckId, -1)} className="w-5 h-5 flex items-center justify-center rounded text-[11px]" style={{ color: TEXT_MUTED }}>-</button>
                  <span className="w-6 text-center text-[12px] font-medium" style={{ color: TEXT_PRIMARY }}>{q}</span>
                  <button onClick={() => adjustQuota(deckId, 1)} className="w-5 h-5 flex items-center justify-center rounded text-[11px]" style={{ color: TEXT_MUTED }}>+</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl border p-3 mb-4 text-[12px]" style={{ borderColor: CARD_BORDER }}>
        <div className="flex justify-between mb-1">
          <span style={{ color: TEXT_MUTED }}>每天新卡</span>
          <span style={{ color: TEXT_PRIMARY }}>{quotaSum} 张</span>
        </div>
        <div className="flex justify-between mb-1">
          <span style={{ color: TEXT_MUTED }}>预计日复习</span>
          <span style={{ color: TEXT_PRIMARY }}>~{previewReview} 张</span>
        </div>
        <div className="flex justify-between mb-1">
          <span style={{ color: TEXT_MUTED }}>预计完成</span>
          <span style={{ color: TEXT_PRIMARY }}>{targetDays} 天</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: TEXT_MUTED }}>自动解决</span>
          <span style={{ color: TEXT_PRIMARY }}>间隔 ≥ {autoResolveInterval} 天</span>
        </div>
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border py-2.5 text-[13px] font-medium"
            style={{ borderColor: CARD_BORDER, color: TEXT_MUTED }}
          >
            取消
          </button>
        )}
        <button
          onClick={handleApply}
          disabled={!canApply}
          className="flex-1 rounded-xl py-2.5 text-[13px] font-medium text-white disabled:opacity-40"
          style={{ backgroundColor: ORANGE }}
        >
          {submitting ? '保存中...' : confirmLabel}
        </button>
      </div>
    </div>
  );

  if (variant === 'screen') {
    return (
      <div className="dark-bg homepage-glass-stage min-h-screen flex items-center justify-center px-5 py-8">
        {card}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      {card}
    </div>
  );
}
