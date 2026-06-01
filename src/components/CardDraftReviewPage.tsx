import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ArrowLeft, Check, X, Merge, Layers, Eye, Loader2, Search, Undo2, ChevronDown, Edit3, Save, AlertTriangle, CheckCircle2, FileText, ShieldCheck } from 'lucide-react';
import { getDrafts, batchReview, batchImport, importDryRun, approveDraft, rejectDraft, getDecks, patchDraft } from '../api/documents';
import { loadCustomDecks } from '../utils/customDecks';
import { useDocumentQueue } from '../hooks/useDocumentQueue';
import type { CardDraftDTO } from '../api/documents';

interface Props {
  onBack: () => void;
  onNavigate?: (page: string) => void;
  documentId?: string;
}

const BLUE = 'var(--blue)';
const ORANGE = 'var(--orange)';
const GREEN = '#22C55E';
const RED = '#EF4444';
const PURPLE = '#8B5CF6';
const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_SECONDARY = 'var(--text-secondary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';

const REVIEW_COLORS: Record<string, string> = {
  draft: BLUE,
  needs_review: ORANGE,
  approved: GREEN,
  rejected: RED,
  duplicate: PURPLE,
  merged: PURPLE,
  out_of_scope: TEXT_MUTED,
};

const STATUS_LABELS: Record<string, string> = {
  draft: '待审核',
  needs_review: '需复查',
  approved: '已通过',
  rejected: '已拒绝',
  duplicate: '重复',
  merged: '已合并',
  out_of_scope: '超出范围',
};

const OBJ_LABELS: Record<string, string> = {
  definition: '定义', principle: '原理', procedure: '流程',
  formula: '公式', comparison: '对比', application: '应用',
  example: '例子', pitfall: '误区',
};

const PAGE_SIZE = 50;

type DryRunResult = Awaited<ReturnType<typeof importDryRun>>;
type UndoEntry = { id: string; prevStatus: string };

function truncateText(text: string, max = 96) {
  const compact = text.replace(/\s+/g, ' ').trim();
  return compact.length > max ? `${compact.slice(0, max)}...` : compact;
}

function confidenceColor(confidence: number) {
  if (confidence >= 0.85) return GREEN;
  if (confidence >= 0.65) return BLUE;
  if (confidence >= 0.45) return ORANGE;
  return RED;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '请稍后重试';
}

export default function CardDraftReviewPage({ onBack, onNavigate, documentId }: Props) {
  const [allDrafts, setAllDrafts] = useState<CardDraftDTO[]>([]);
  const { refreshDraftCounts, refreshDraftCountForDoc } = useDocumentQueue();
  const [decks, setDecks] = useState<{ id: string; name: string }[]>([]);
  const [selectedDeck, setSelectedDeck] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandGroup, setExpandGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState('');
  const [tab, setTab] = useState<'all' | 'draft' | 'needs_review' | 'groups'>('draft');
  const [message, setMessage] = useState('');
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortByConfidence, setSortByConfidence] = useState(false);
  const [approveResult, setApproveResult] = useState<{ count: number; deckId: string } | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [editingDraft, setEditingDraft] = useState<{ id: string; question: string; answer: string; tags: string } | null>(null);
  const [undoStack, setUndoStack] = useState<UndoEntry | null>(null);
  const [deckMenuOpen, setDeckMenuOpen] = useState(false);
  const deckMenuRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, dk] = await Promise.all([
        getDrafts(documentId ? undefined : tab === 'all' ? undefined : tab === 'groups' ? undefined : tab),
        getDecks(),
      ]);
      if (documentId) setAllDrafts(d.filter(dr => dr.documentId === documentId));
      else setAllDrafts(d);
      const fileDecks = loadCustomDecks().map(d => ({ id: d.id, name: d.name }));
      const merged = [...dk, ...fileDecks.filter(f => !dk.find(d2 => d2.id === f.id))];
      setDecks(merged);
      if (!selectedDeck) {
        const first = d.find(dr => dr.deckId);
        if (first?.deckId) setSelectedDeck(first.deckId);
      }
      // Refresh queue draft counts (stale after review actions)
      if (documentId) refreshDraftCountForDoc(documentId);
      else refreshDraftCounts();
    } catch (e: unknown) {
      setAllDrafts([]);
      setDecks([]);
      setMessage(`加载失败: ${getErrorMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }, [documentId, tab, selectedDeck, refreshDraftCounts, refreshDraftCountForDoc]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!deckMenuOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (deckMenuRef.current && !deckMenuRef.current.contains(event.target as Node)) {
        setDeckMenuOpen(false);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [deckMenuOpen]);

  // Filter + sort
  const filteredDrafts = useMemo(() => {
    let list = tab === 'groups' ? [] : (tab === 'all' ? allDrafts : allDrafts.filter(d => d.status === tab));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d =>
        d.question.toLowerCase().includes(q) ||
        (d.canonicalConcept || '').toLowerCase().includes(q) ||
        d.tags.some(t => t.toLowerCase().includes(q)) ||
        (d.answerScope || '').toLowerCase().includes(q)
      );
    }
    if (sortByConfidence) {
      list = [...list].sort((a, b) => a.confidence - b.confidence);
    }
    return list;
  }, [allDrafts, tab, searchQuery, sortByConfidence]);

  const visibleDrafts = filteredDrafts.slice(0, visibleCount);

  const groups = useMemo(() => {
    const map = new Map<string, CardDraftDTO[]>();
    for (const d of allDrafts) {
      if (d.duplicateGroupId) {
        const arr = map.get(d.duplicateGroupId) || [];
        arr.push(d);
        map.set(d.duplicateGroupId, arr);
      }
    }
    return map;
  }, [allDrafts]);

  const statusCounts = useMemo(() => ({
    draft: allDrafts.filter(d => d.status === 'draft').length,
    needs_review: allDrafts.filter(d => d.status === 'needs_review').length,
    approved: allDrafts.filter(d => d.status === 'approved').length,
    rejected: allDrafts.filter(d => d.status === 'rejected').length,
    groups: groups.size,
  }), [allDrafts, groups]);

  const count = allDrafts.length;
  const selectedDeckName = decks.find(d => d.id === selectedDeck)?.name || '';

  async function handleBatch(action: string) {
    if (selected.size === 0) return;
    setProcessing(true);
    setMessage('');
    setBatchProgress('');
    setDryRunResult(null);
    const ids = [...selected];
    const CHUNK = 200;
    try {
      if (action === 'import') {
        if (!selectedDeck) { setMessage('请先选择目标 deck'); setProcessing(false); return; }
        const BATCH_SIZE = 20;
        let totalImported = 0;
        let totalResults = 0;
        for (let i = 0; i < ids.length; i += BATCH_SIZE) {
          const chunk = ids.slice(i, i + BATCH_SIZE);
          setBatchProgress(`导入中 ${totalImported + 1}-${Math.min(i + BATCH_SIZE, ids.length)}/${ids.length}...`);
          const r = await batchImport(chunk, selectedDeck);
          totalImported += r.imported;
          totalResults += r.results.length;
        }
        setBatchProgress('');
        setMessage(`导入完成: ${totalImported}/${totalResults} 张`);
        if (totalImported > 0 && selectedDeck) {
          setApproveResult({ count: totalImported, deckId: selectedDeck });
        }
      } else if (action === 'dry-run') {
        const r = await importDryRun(ids.slice(0, 50), selectedDeck || undefined);
        setDryRunResult(r);
      } else {
        let totalOk = 0, totalErr = 0, done = 0;
        for (let i = 0; i < ids.length; i += CHUNK) {
          const chunk = ids.slice(i, i + CHUNK);
          setBatchProgress(`处理中 ${done + 1}-${Math.min(done + CHUNK, ids.length)}/${ids.length}...`);
          const r = await batchReview(chunk, action, { deckId: selectedDeck || undefined, note: '批量操作' });
          totalOk += r.results.filter(x => x.status !== 'error').length;
          totalErr += r.results.filter(x => x.status === 'error').length;
          done += chunk.length;
        }
        setBatchProgress('');
        setMessage(`操作完成: ${totalOk} 成功, ${totalErr} 失败`);
        if (action === 'approve' && totalOk > 0 && selectedDeck) {
          setApproveResult({ count: totalOk, deckId: selectedDeck });
        }
      }
      if (action !== 'dry-run') {
        setSelected(new Set());
        await load();
      }
    } catch (e: unknown) { setMessage(`错误: ${getErrorMessage(e)}`); }
    setProcessing(false);
  }

  async function handleSingle(id: string, action: string) {
    setProcessing(true);
    try {
      const draft = allDrafts.find(d => d.id === id);
      setUndoStack(draft ? { id, prevStatus: draft.status } : null);

      if (action === 'approve') {
        const deck = selectedDeck || draft?.deckId;
        if (!deck) { setMessage('请先选择目标 deck'); setProcessing(false); return; }
        await approveDraft(id, deck);
        setMessage('操作完成（可撤销）');
      } else if (action === 'reject') {
        await rejectDraft(id);
        setMessage('操作完成（可撤销）');
      } else {
        await batchReview([id], action, { note: '单张操作' });
        setMessage('操作完成');
      }
      setMessage('操作完成');
      await load();
    } catch (e: unknown) { setMessage(`错误: ${getErrorMessage(e)}`); }
    setProcessing(false);
  }

  async function handleEditSave() {
    if (!editingDraft || !selectedDeck) return;
    setProcessing(true);
    try {
      const tags = editingDraft.tags.split(',').map(t => t.trim()).filter(Boolean);
      await patchDraft(editingDraft.id, {
        question: editingDraft.question,
        answer: editingDraft.answer,
        tags,
      });
      await approveDraft(editingDraft.id, selectedDeck);
      setEditingDraft(null);
      setMessage('已保存并导入');
      setApproveResult({ count: 1, deckId: selectedDeck });
      await load();
    } catch (e: unknown) { setMessage(`编辑失败: ${getErrorMessage(e)}`); }
    setProcessing(false);
  }

  async function handleUndo() {
    if (!undoStack) return;
    setProcessing(true);
    const { id, prevStatus } = undoStack;
    try {
      await batchReview([id], 'restore_status', { restoreStatus: prevStatus, note: `Undo to ${prevStatus}` });
      setUndoStack(null);
      setMessage('已撤销');
    } catch {
      setUndoStack(null);
      setMessage('撤销失败，已刷新状态');
    } finally {
      await load();
      setProcessing(false);
    }
  }

  async function handleGroupResolve(groupId: string, action: string) {
    const group = groups.get(groupId);
    if (!group) return;
    setProcessing(true);
    setBatchProgress('');
    try {
      await batchReview(group.map(d => d.id), action, { note: `Group ${action}` });
      setMessage(`组操作完成: ${action}`);
      await load();
    } catch (e: unknown) { setMessage(`错误: ${getErrorMessage(e)}`); }
    setProcessing(false);
  }

  return (
    <div className="dark-bg homepage-glass-stage min-h-screen flex flex-col transition-colors">
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col min-h-screen">

        {/* Nav bar */}
        <div className="nav-bar sticky top-0 z-20 flex items-center gap-3 shrink-0">
          <button onClick={onBack} className="p-1.5 rounded-xl hover:opacity-70">
            <ArrowLeft size={20} style={{ color: TEXT_PRIMARY }} />
          </button>
          <span className="nav-title">卡片草稿审核</span>
          {count > 0 && (
            <span className="text-[11px] ml-auto px-2 py-1 rounded-full border shrink-0"
              style={{ color: TEXT_MUTED, borderColor: CARD_BORDER, backgroundColor: 'rgba(255,255,255,0.04)' }}>
              {count} 张
            </span>
          )}
        </div>

        <div className="px-5 pt-4 pb-3 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '待审', value: statusCounts.draft, icon: FileText, color: BLUE },
              { label: '复查', value: statusCounts.needs_review, icon: AlertTriangle, color: ORANGE },
              { label: '重复', value: statusCounts.groups, icon: Layers, color: PURPLE },
              { label: '已过', value: statusCounts.approved, icon: CheckCircle2, color: GREEN },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-xl border p-2"
                  style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER, boxShadow: 'var(--card-shadow, 0 1px 3px rgba(0,0,0,0.04))' }}>
                  <div className="flex items-center gap-1.5">
                    <Icon size={12} style={{ color: item.color }} />
                    <span className="text-[10px]" style={{ color: TEXT_MUTED }}>{item.label}</span>
                  </div>
                  <div className="mt-1 text-[16px] font-bold leading-none" style={{ color: TEXT_PRIMARY }}>{item.value}</div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border p-3 space-y-3"
            style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER, boxShadow: 'var(--card-shadow, 0 1px 3px rgba(0,0,0,0.04))' }}>

            <div className="grid grid-cols-4 gap-1 rounded-xl p-1" style={{ backgroundColor: 'rgba(148,163,184,0.10)' }}>
              {(['draft', 'needs_review', 'groups', 'all'] as const).map(t => (
                <button key={t}
                  onClick={() => { setTab(t); setDryRunResult(null); setVisibleCount(PAGE_SIZE); }}
                  className="min-h-9 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
                  style={{
                    backgroundColor: tab === t ? BLUE : 'transparent',
                    color: tab === t ? '#fff' : TEXT_MUTED,
                  }}>
                  {t === 'draft' ? `待审核 ${statusCounts.draft}` : t === 'needs_review' ? `复查 ${statusCounts.needs_review}` : t === 'groups' ? `重复 ${statusCounts.groups}` : '全部'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 min-h-10 px-3 rounded-xl border"
              style={{ borderColor: CARD_BORDER, backgroundColor: 'rgba(148,163,184,0.08)' }}>
              <Search size={14} style={{ color: TEXT_MUTED }} />
              <input
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
                placeholder="搜索问题、概念、标签..."
                className="flex-1 min-w-0 text-[12px] bg-transparent outline-none"
                style={{ color: TEXT_PRIMARY }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[11px]" style={{ color: TEXT_MUTED }}>清除</button>
              )}
              <button
                onClick={() => setSortByConfidence(!sortByConfidence)}
                className={`text-[10px] px-1.5 py-0.5 rounded-md border transition-colors ${sortByConfidence ? '' : 'opacity-50'}`}
                style={{ borderColor: CARD_BORDER, color: sortByConfidence ? BLUE : TEXT_MUTED }}>
                置信度{sortByConfidence ? '↓' : ''}
              </button>
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-2 items-stretch">
              <button
                onClick={() => {
                  const all = tab === 'groups' ? [] : visibleDrafts.map(d => d.id);
                  if (all.length > 0 && all.every(id => selected.has(id))) {
                    setSelected(new Set());
                  } else {
                    setSelected(new Set(all));
                  }
                }}
                disabled={tab === 'groups' || visibleDrafts.length === 0}
                className="min-h-10 text-[11px] font-medium px-3 rounded-xl border transition-colors"
                style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY, opacity: tab === 'groups' || visibleDrafts.length === 0 ? 0.4 : 1 }}>
                {visibleDrafts.length > 0 && visibleDrafts.every(d => selected.has(d.id)) ? '取消' : '全选'} ({selected.size})
              </button>
              <div ref={deckMenuRef} className="relative min-w-0">
                <button type="button" onClick={() => setDeckMenuOpen(v => !v)}
                  className="w-full min-h-12 rounded-xl border px-3 py-2 text-left backdrop-blur-xl transition-colors"
                  style={{
                    borderColor: selectedDeck ? CARD_BORDER : 'rgba(234,88,12,0.42)',
                    backgroundColor: selectedDeck ? 'rgba(148,163,184,0.08)' : 'rgba(234,88,12,0.08)',
                    color: TEXT_PRIMARY,
                  }}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold leading-none" style={{ color: selectedDeck ? TEXT_MUTED : ORANGE }}>
                        目标牌组
                      </div>
                      <div className="mt-1 truncate text-[12px] font-semibold">
                        {selectedDeckName || '先选择牌组'}
                      </div>
                      <div className="mt-0.5 truncate text-[10px]" style={{ color: selectedDeck ? TEXT_MUTED : ORANGE }}>
                        {selectedDeck ? '通过将导入到这里' : '未选择会影响通过 / 导入'}
                      </div>
                    </div>
                    <ChevronDown size={16} className={`shrink-0 transition-transform ${deckMenuOpen ? 'rotate-180' : ''}`} style={{ color: TEXT_MUTED }} />
                  </div>
                </button>
                {deckMenuOpen && (
                  <div className="absolute right-0 top-full z-30 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border p-1 shadow-xl backdrop-blur-2xl"
                    style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                    <button type="button"
                      onClick={() => { setSelectedDeck(''); setDeckMenuOpen(false); }}
                      className="w-full rounded-lg px-3 py-2 text-left text-[12px] transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                      style={{ color: selectedDeck ? TEXT_MUTED : ORANGE }}>
                      不指定牌组
                    </button>
                    {decks.map(d => (
                      <button type="button" key={d.id}
                        onClick={() => { setSelectedDeck(d.id); setDeckMenuOpen(false); }}
                        className="w-full rounded-lg px-3 py-2 text-left text-[12px] transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                        style={{
                          color: d.id === selectedDeck ? BLUE : TEXT_PRIMARY,
                          backgroundColor: d.id === selectedDeck ? 'rgba(64,156,255,0.10)' : 'transparent',
                        }}>
                        <span className="block truncate font-medium">{d.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handleBatch('dry-run')} disabled={processing || selected.size === 0}
                className="min-h-10 px-2.5 rounded-xl text-[11px] font-medium border transition-colors"
                style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY, opacity: processing || selected.size === 0 ? 0.4 : 1 }}>
                <Eye size={14} className="inline mr-1" />验证
              </button>
              <button onClick={() => handleBatch('approve')} disabled={processing || selected.size === 0}
                className="min-h-10 px-2.5 rounded-xl text-[11px] font-medium text-white transition-colors"
                style={{ backgroundColor: BLUE, opacity: processing || selected.size === 0 ? 0.4 : 1 }}>
                <Check size={14} className="inline mr-1" />通过
              </button>
              <button onClick={() => handleBatch('reject')} disabled={processing || selected.size === 0}
                className="min-h-10 px-2.5 rounded-xl text-[11px] font-medium text-white transition-colors"
                style={{ backgroundColor: RED, opacity: processing || selected.size === 0 ? 0.4 : 1 }}>
                <X size={14} className="inline mr-1" />拒绝
              </button>
            </div>

            {(selected.size > 0 || selectedDeckName || undoStack) && (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-[11px]"
                style={{ backgroundColor: 'rgba(64,156,255,0.10)', color: TEXT_MUTED }}>
                <ShieldCheck size={13} style={{ color: BLUE }} />
                <span className="flex-1 min-w-0 truncate">
                  已选 {selected.size} 张{selectedDeckName ? ` · 目标 ${selectedDeckName}` : ''}
                </span>
              {undoStack && (
                <button onClick={handleUndo} disabled={processing}
                  className="px-2 py-1 rounded-lg text-[10px] font-medium border flex items-center gap-1 shrink-0"
                  style={{ borderColor: ORANGE, color: ORANGE }}>
                  <Undo2 size={12} />撤销
                </button>
              )}
              </div>
            )}
          </div>
        </div>

        {/* Batch progress */}
        {batchProgress && (
          <div className="px-5 mb-2">
            <div className="flex items-center gap-2 p-2 rounded-xl border" style={{ backgroundColor: 'rgba(64,156,255,0.10)', borderColor: CARD_BORDER }}>
              <Loader2 size={14} className="animate-spin" style={{ color: BLUE }} />
              <span className="text-[12px]" style={{ color: TEXT_PRIMARY }}>{batchProgress}</span>
            </div>
          </div>
        )}

        {/* Dry-run result */}
        {dryRunResult && (
          <div className="px-5 mb-2">
            <div className="rounded-2xl border p-3 text-[12px] space-y-3"
              style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER, boxShadow: 'var(--card-shadow, 0 1px 3px rgba(0,0,0,0.04))' }}>
              <div className="flex items-center justify-between">
                <div className="font-semibold" style={{ color: TEXT_PRIMARY }}>验证结果</div>
                <span className="text-[10px]" style={{ color: dryRunResult.blockedDrafts.length ? ORANGE : GREEN }}>
                  {dryRunResult.blockedDrafts.length ? '需要处理' : '可导入'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['可导入', dryRunResult.willCreateCards, GREEN],
                  ['拦截', dryRunResult.blockedDrafts.length, dryRunResult.blockedDrafts.length ? ORANGE : TEXT_MUTED],
                  ['重复', dryRunResult.unresolvedDuplicates.length, dryRunResult.unresolvedDuplicates.length ? PURPLE : TEXT_MUTED],
                  ['缺牌组', dryRunResult.missingDeckId.length, dryRunResult.missingDeckId.length ? ORANGE : TEXT_MUTED],
                  ['缺标签', dryRunResult.missingTags.length, dryRunResult.missingTags.length ? ORANGE : TEXT_MUTED],
                  ['缺关键词', dryRunResult.missingSearchKeywords.length, dryRunResult.missingSearchKeywords.length ? ORANGE : TEXT_MUTED],
                ].map(([label, value, color]) => (
                  <div key={label as string} className="rounded-xl px-2 py-2 border"
                    style={{ borderColor: CARD_BORDER, backgroundColor: 'rgba(148,163,184,0.08)' }}>
                    <div className="text-[10px]" style={{ color: TEXT_MUTED }}>{label}</div>
                    <div className="text-[15px] font-bold leading-none mt-1" style={{ color: color as string }}>{value}</div>
                  </div>
                ))}
              </div>
              {dryRunResult.blockedDrafts.length === 0 && (
                <button onClick={() => handleBatch('import')} disabled={processing}
                  className="w-full min-h-10 px-3 rounded-xl text-[12px] font-medium text-white"
                  style={{ backgroundColor: GREEN }}>
                  <Loader2 size={12} className="inline mr-1" />确认导入 {dryRunResult.willCreateCards} 张
                </button>
              )}
            </div>
          </div>
        )}

        {/* Approve result with deck link */}
        {approveResult && (
          <div className="px-5 mb-2">
            <div className="rounded-2xl border p-3 text-[12px]"
              style={{ backgroundColor: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.3)', boxShadow: 'var(--card-shadow, 0 1px 3px rgba(0,0,0,0.04))' }}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={15} style={{ color: GREEN }} />
                <span className="flex-1" style={{ color: GREEN }}>已导入 {approveResult.count} 张卡片到 {decks.find(d => d.id === approveResult.deckId)?.name || approveResult.deckId}</span>
                <button onClick={() => setApproveResult(null)}
                  className="text-[10px]" style={{ color: TEXT_MUTED }}>关闭</button>
              </div>
              {onNavigate && (
                <div className="flex gap-2">
                  <button onClick={() => onNavigate(`deck:${approveResult.deckId}:new`)}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-medium text-white"
                    style={{ backgroundColor: BLUE }}>
                    开始学习新卡
                  </button>
                  <button onClick={() => onNavigate(`deck:${approveResult.deckId}`)}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-medium border"
                    style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}>
                    查看牌组
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {message && (
          <div className="px-5 mb-2">
            <div className="text-center text-[12px] p-2 rounded-xl"
              style={{ backgroundColor: 'var(--card-border)', color: TEXT_MUTED }}>
              {message}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-40" style={{ color: TEXT_MUTED }}>加载中...</div>
          ) : tab === 'groups' ? (
            [...groups.entries()].length === 0 ? (
              <div className="text-center py-12" style={{ color: TEXT_MUTED }}>无重复组</div>
            ) : (
              [...groups.entries()].map(([gid, gdrafts]) => (
                <div key={gid} className="rounded-2xl border p-3"
                  style={{ backgroundColor: CARD_BG, borderColor: ORANGE, boxShadow: 'var(--card-shadow, 0 1px 3px rgba(0,0,0,0.04))' }}>
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                    <span className="text-[12px] font-semibold" style={{ color: ORANGE }}>
                      <Layers size={14} className="inline mr-1" />重复组 ({gdrafts.length} 张)
                    </span>
                    <div className="flex gap-1 flex-wrap">
                      <button onClick={() => handleGroupResolve(gid, 'merge')}
                        className="px-2 py-1 rounded-lg text-[10px] font-medium text-white"
                        style={{ backgroundColor: '#8B5CF6' }}>
                        <Merge size={12} className="inline mr-0.5" />合并
                      </button>
                      <button onClick={() => handleGroupResolve(gid, 'keep_best')}
                        className="px-2 py-1 rounded-lg text-[10px] font-medium text-white"
                        style={{ backgroundColor: BLUE }}>保留最佳</button>
                      <button onClick={() => handleGroupResolve(gid, 'keep_both')}
                        className="px-2 py-1 rounded-lg text-[10px] font-medium border"
                        style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}>全部保留</button>
                      <button onClick={() => handleGroupResolve(gid, 'reject')}
                        className="px-2 py-1 rounded-lg text-[10px] font-medium text-white"
                        style={{ backgroundColor: '#EF4444' }}>全部拒绝</button>
                      <button onClick={() => setExpandGroup(expandGroup === gid ? null : gid)}
                        className="px-2 py-1 rounded-lg text-[10px] font-medium border"
                        style={{ borderColor: CARD_BORDER, color: TEXT_MUTED }}>
                        {expandGroup === gid ? '收起' : '对比'}
                      </button>
                    </div>
                  </div>

                  {/* Side-by-side comparison */}
                  {expandGroup === gid ? (
                    <div className="space-y-3">
                      {gdrafts.map(d => {
                        const sc = REVIEW_COLORS[d.status] || TEXT_MUTED;
                        return (
                          <div key={d.id} className="rounded-xl border p-3 space-y-2"
                            style={{ backgroundColor: 'var(--card-border)', borderColor: CARD_BORDER }}>
                            <div className="text-[13px] font-bold" style={{ color: TEXT_PRIMARY }}>{d.question}</div>
                            <div className="text-[11px] leading-relaxed" style={{ color: TEXT_PRIMARY, opacity: 0.85 }}>{d.answer}</div>
                            {d.atomicFacts && d.atomicFacts.length > 0 && (
                              <ul className="text-[10px] list-disc list-inside" style={{ color: TEXT_MUTED }}>
                                {d.atomicFacts.map((f, i) => <li key={i}>{f}</li>)}
                              </ul>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                                style={{ color: sc, backgroundColor: `${sc}18`, borderColor: `${sc}30` }}>
                                {STATUS_LABELS[d.status] || d.status}
                              </span>
                              <span className="text-[10px]" style={{ color: TEXT_MUTED }}>置信度 {d.confidence.toFixed(2)}</span>
                            </div>
                            <button onClick={() => handleSingle(d.id, 'approve')}
                              className="px-2 py-1 rounded-lg text-[10px] font-medium text-white"
                              style={{ backgroundColor: BLUE }}>通过此张</button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    gdrafts.map(d => (
                      <div key={d.id} className="text-[12px] py-1 px-2 rounded-lg mb-1"
                        style={{ backgroundColor: 'var(--card-border)' }}>
                        <span className="font-medium">[{d.learningObjective}]</span> {d.question}
                      </div>
                    ))
                  )}
                </div>
              ))
            )
          ) : visibleDrafts.length === 0 ? (
            <div className="text-center py-12" style={{ color: TEXT_MUTED }}>
              {searchQuery ? '无匹配结果' : '暂无草稿'}
            </div>
          ) : (
            <>
              {visibleDrafts.map(d => {
                const statusColor = REVIEW_COLORS[d.status] || TEXT_MUTED;
                return (
                  <div key={d.id} className="rounded-2xl border overflow-hidden transition-all hover:-translate-y-0.5"
                    style={{
                      backgroundColor: CARD_BG,
                      borderColor: selected.has(d.id) ? BLUE : CARD_BORDER,
                      boxShadow: selected.has(d.id) ? '0 14px 34px rgba(64,156,255,0.18)' : 'var(--card-shadow, 0 1px 3px rgba(0,0,0,0.04))',
                    }}>
                    <label className="flex items-start gap-3 p-3 cursor-pointer"
                      onClick={() => setSelected(s => {
                        const n = new Set(s);
                        if (n.has(d.id)) n.delete(d.id);
                        else n.add(d.id);
                        return n;
                      })}>
                      <input type="checkbox" checked={selected.has(d.id)} onChange={() => {}}
                        className="mt-1 rounded accent-[var(--blue)]" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-bold leading-snug" style={{ color: TEXT_PRIMARY }}>
                              {d.question}
                            </div>
                            <div className="mt-1 text-[11px] leading-relaxed line-clamp-2" style={{ color: TEXT_SECONDARY }}>
                              {truncateText(d.answer)}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[10px]" style={{ color: TEXT_MUTED }}>置信度</div>
                            <div className="text-[14px] font-bold leading-tight" style={{ color: confidenceColor(d.confidence) }}>
                              {Math.round(d.confidence * 100)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(148,163,184,0.18)' }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${Math.max(4, Math.min(100, Math.round(d.confidence * 100)))}%`, backgroundColor: confidenceColor(d.confidence) }} />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                            style={{ color: statusColor, backgroundColor: `${statusColor}18`, borderColor: `${statusColor}30` }}>
                            {STATUS_LABELS[d.status] || d.status}
                          </span>
                          {d.canonicalConcept && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md"
                              style={{ backgroundColor: 'var(--card-border)', color: TEXT_MUTED }}>
                              {d.canonicalConcept}
                            </span>
                          )}
                          {d.learningObjective && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md"
                              style={{ backgroundColor: 'var(--card-border)', color: TEXT_MUTED }}>
                              {OBJ_LABELS[d.learningObjective] || d.learningObjective}
                            </span>
                          )}
                          {d.sourceRefs?.[0]?.pageNumber && (
                            <span className="text-[10px]" style={{ color: TEXT_MUTED }}>Page {d.sourceRefs[0].pageNumber}</span>
                          )}
                        </div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setExpanded(expanded === d.id ? null : d.id); }}
                        className="p-1.5 rounded-lg hover:opacity-70 shrink-0"
                        style={{ backgroundColor: expanded === d.id ? 'rgba(64,156,255,0.12)' : 'transparent' }}>
                        <Eye size={16} style={{ color: TEXT_MUTED }} />
                      </button>
                    </label>

                    {expanded === d.id && (
                      <div className="px-3 pb-3 pt-0 space-y-3 text-[12px]"
                        style={{ borderTop: '1px solid var(--card-border)' }}>
                        {editingDraft?.id === d.id ? (
                          <>
                            <div className="pt-3">
                              <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: TEXT_MUTED }}>Question</div>
                              <textarea value={editingDraft.question}
                                onChange={e => setEditingDraft({ ...editingDraft, question: e.target.value })}
                                className="w-full rounded-lg border px-2.5 py-2 text-[12px] bg-transparent resize-none"
                                style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
                                rows={3} />
                            </div>
                            <div>
                              <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: TEXT_MUTED }}>Answer</div>
                              <textarea value={editingDraft.answer}
                                onChange={e => setEditingDraft({ ...editingDraft, answer: e.target.value })}
                                className="w-full rounded-lg border px-2.5 py-2 text-[12px] bg-transparent resize-none"
                                style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
                                rows={5} />
                            </div>
                            <div>
                              <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: TEXT_MUTED }}>Tags (逗号分隔)</div>
                              <input value={editingDraft.tags}
                                onChange={e => setEditingDraft({ ...editingDraft, tags: e.target.value })}
                                className="w-full rounded-lg border px-2.5 py-2 text-[12px] bg-transparent"
                                style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }} />
                            </div>
                            <div className="flex gap-1 flex-wrap pt-1">
                              <button onClick={handleEditSave} disabled={processing || !selectedDeck}
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white"
                                style={{ backgroundColor: '#22C55E', opacity: processing || !selectedDeck ? 0.4 : 1 }}>
                                <Save size={12} className="inline mr-1" />保存并通过
                              </button>
                              <button onClick={() => setEditingDraft(null)}
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium border"
                                style={{ borderColor: CARD_BORDER, color: TEXT_MUTED }}>
                                取消
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                        <div className="pt-3">
                          <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: TEXT_MUTED }}>Answer</div>
                          <div className="leading-relaxed whitespace-pre-wrap" style={{ color: TEXT_PRIMARY, opacity: 0.88 }}>{d.answer}</div>
                        </div>

                        {d.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {d.tags.map(t => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md"
                                style={{ backgroundColor: 'var(--card-border)', color: TEXT_MUTED }}>{t}</span>
                            ))}
                          </div>
                        )}

                        {d.atomicFacts && d.atomicFacts.length > 0 && (
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: TEXT_MUTED }}>原子事实</div>
                            <ul className="list-disc list-inside space-y-0.5" style={{ color: TEXT_SECONDARY }}>
                              {d.atomicFacts.map((f, i) => <li key={i}>{f}</li>)}
                            </ul>
                          </div>
                        )}

                        <div className="flex gap-4 text-[10px]" style={{ color: TEXT_MUTED }}>
                          {d.graphStatus && <span>图谱: {d.graphStatus}</span>}
                          {d.duplicateCheck && <span>去重: {d.duplicateCheck.status}</span>}
                        </div>

                        {d.sourceRefs?.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>来源引用</div>
                            {d.sourceRefs.slice(0, 3).map((sr, i) => (
                              <div key={i} className="p-2 rounded-lg text-[10px]"
                                style={{ backgroundColor: 'var(--card-border)', color: TEXT_MUTED }}>
                                <div className="flex gap-2 mb-0.5">
                                  <span>Page {sr.pageNumber || '?'}</span>
                                  <span>{sr.source}</span>
                                </div>
                                <div className="italic opacity-80">"{sr.quote?.slice(0, 150)}"</div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-1 flex-wrap pt-1">
                          <button onClick={() => {
                            setEditingDraft({ id: d.id, question: d.question, answer: d.answer, tags: d.tags.join(', ') });
                          }}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white"
                            style={{ backgroundColor: ORANGE }}>
                            <Edit3 size={12} className="inline mr-1" />编辑
                          </button>
                          <button onClick={() => handleSingle(d.id, 'approve')}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white"
                            style={{ backgroundColor: BLUE }}>
                            <Check size={12} className="inline mr-1" />通过
                          </button>
                          <button onClick={() => handleSingle(d.id, 'reject')}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white"
                            style={{ backgroundColor: '#EF4444' }}>
                            <X size={12} className="inline mr-1" />拒绝
                          </button>
                          <button onClick={() => handleSingle(d.id, 'mark_out_of_scope')}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium border"
                            style={{ borderColor: CARD_BORDER, color: TEXT_MUTED }}>
                            超出范围
                          </button>
                          <button onClick={() => handleSingle(d.id, 'mark_duplicate')}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium border"
                            style={{ borderColor: CARD_BORDER, color: '#8B5CF6' }}>
                            标记重复
                          </button>
                        </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Load more */}
              {visibleCount < filteredDrafts.length && (
                <button
                  onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                  className="w-full py-3 rounded-xl text-[13px] font-medium border flex items-center justify-center gap-1"
                  style={{ borderColor: CARD_BORDER, color: TEXT_MUTED }}>
                  加载更多 ({visibleCount}/{filteredDrafts.length}) <ChevronDown size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
