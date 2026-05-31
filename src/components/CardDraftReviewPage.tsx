import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Check, X, Merge, Layers, Eye, Loader2, Search, Undo2, ChevronDown } from 'lucide-react';
import { getDrafts, batchReview, batchImport, importDryRun, approveDraft, rejectDraft, getDecks } from '../api/documents';
import { loadCustomDecks } from '../utils/customDecks';
import type { CardDraftDTO } from '../api/documents';

interface Props {
  onBack: () => void;
  onNavigate?: (page: string) => void;
  documentId?: string;
}

const BLUE = 'var(--blue)';
const ORANGE = 'var(--orange)';
const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_SECONDARY = 'var(--text-secondary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';

const REVIEW_COLORS: Record<string, string> = {
  draft: BLUE,
  needs_review: ORANGE,
  approved: '#22C55E',
  rejected: '#EF4444',
  duplicate: '#8B5CF6',
  merged: '#8B5CF6',
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

let undoStack: { id: string; prevStatus: string } | null = null;

export default function CardDraftReviewPage({ onBack, onNavigate, documentId }: Props) {
  const [allDrafts, setAllDrafts] = useState<CardDraftDTO[]>([]);
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
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortByConfidence, setSortByConfidence] = useState(false);
  const [approveResult, setApproveResult] = useState<{ count: number; deckId: string } | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
      // Default deck from first draft with deckId
      if (!selectedDeck) {
        const first = d.find(dr => dr.deckId);
        if (first?.deckId) setSelectedDeck(first.deckId);
      }
    } catch (e: any) {
      setAllDrafts([]);
      setDecks([]);
      setMessage(`加载失败: ${e?.message || '请稍后重试'}`);
    } finally {
      setLoading(false);
    }
  }, [documentId, tab, selectedDeck]);

  useEffect(() => { load(); }, [load]);

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

  const count = allDrafts.length;

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
        const r = await batchImport(ids.slice(0, 20), selectedDeck);
        setMessage(`导入完成: ${r.imported}/${r.results.length} 张`);
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
    } catch (e: any) { setMessage(`错误: ${e.message}`); }
    setProcessing(false);
  }

  async function handleSingle(id: string, action: string) {
    setProcessing(true);
    try {
      const draft = allDrafts.find(d => d.id === id);
      undoStack = draft ? { id, prevStatus: draft.status } : null;

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
    } catch (e: any) { setMessage(`错误: ${e.message}`); }
    setProcessing(false);
  }

  function handleUndo() {
    if (!undoStack) return;
    setProcessing(true);
    const { id, prevStatus } = undoStack;
    batchReview([id], 'restore_status', { restoreStatus: prevStatus, note: `Undo to ${prevStatus}` })
      .then(async () => {
        undoStack = null;
        setMessage('已撤销');
        await load();
        setProcessing(false);
      })
      .catch(async () => {
        // Reload as fallback
        undoStack = null;
        setMessage('撤销失败，已刷新状态');
        await load();
        setProcessing(false);
      });
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
    } catch (e: any) { setMessage(`错误: ${e.message}`); }
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
          {count > 0 && <span className="text-[12px] ml-auto" style={{ color: TEXT_MUTED }}>{count} 张</span>}
        </div>

        {/* Toolbar card */}
        <div className="px-5 pt-4 pb-3">
          <div className="rounded-2xl border p-3 space-y-3"
            style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER, boxShadow: 'var(--card-shadow, 0 1px 3px rgba(0,0,0,0.04))' }}>

            {/* Tabs */}
            <div className="flex gap-1">
              {['draft', 'needs_review', 'groups', 'all'].map(t => (
                <button key={t}
                  onClick={() => { setTab(t as any); setDryRunResult(null); setVisibleCount(PAGE_SIZE); }}
                  className="px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-colors"
                  style={{
                    backgroundColor: tab === t ? BLUE : 'var(--card-border)',
                    color: tab === t ? '#fff' : TEXT_MUTED,
                  }}>
                  {t === 'draft' ? '待审核' : t === 'needs_review' ? '需复查' : t === 'groups' ? '重复组' : '全部'}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
              <Search size={14} style={{ color: TEXT_MUTED }} />
              <input
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
                placeholder="搜索问题、概念、标签..."
                className="flex-1 text-[12px] bg-transparent outline-none"
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

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
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
                className="text-[11px] font-medium px-2 py-1 rounded-lg border transition-colors"
                style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY, opacity: tab === 'groups' || visibleDrafts.length === 0 ? 0.4 : 1 }}>
                {visibleDrafts.length > 0 && visibleDrafts.every(d => selected.has(d.id)) ? '取消' : '全选'} ({selected.size})
              </button>
              <select value={selectedDeck} onChange={e => setSelectedDeck(e.target.value)}
                className="flex-1 text-[12px] px-2 py-1.5 rounded-xl border"
                style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY, backgroundColor: CARD_BG }}>
                <option value="">选择牌组...</option>
                {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <button onClick={() => handleBatch('dry-run')} disabled={processing || selected.size === 0}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-medium border transition-colors"
                style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY, opacity: processing ? 0.4 : 1 }}>
                <Eye size={14} className="inline mr-1" />验证
              </button>
              <button onClick={() => handleBatch('approve')} disabled={processing || selected.size === 0}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-white transition-colors"
                style={{ backgroundColor: BLUE, opacity: processing ? 0.4 : 1 }}>
                <Check size={14} className="inline mr-1" />通过
              </button>
              <button onClick={() => handleBatch('reject')} disabled={processing || selected.size === 0}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-white transition-colors"
                style={{ backgroundColor: '#EF4444', opacity: processing ? 0.4 : 1 }}>
                <X size={14} className="inline mr-1" />拒绝
              </button>
              {undoStack && (
                <button onClick={handleUndo} disabled={processing}
                  className="px-2 py-1 rounded-lg text-[10px] font-medium border flex items-center gap-1"
                  style={{ borderColor: ORANGE, color: ORANGE }}>
                  <Undo2 size={12} />撤销
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Batch progress */}
        {batchProgress && (
          <div className="px-5 mb-2">
            <div className="flex items-center gap-2 p-2 rounded-xl" style={{ backgroundColor: 'var(--card-border)' }}>
              <Loader2 size={14} className="animate-spin" style={{ color: BLUE }} />
              <span className="text-[12px]" style={{ color: TEXT_PRIMARY }}>{batchProgress}</span>
            </div>
          </div>
        )}

        {/* Dry-run result */}
        {dryRunResult && (
          <div className="px-5 mb-2">
            <div className="rounded-2xl border p-3 text-[12px]"
              style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
              <div className="font-semibold mb-2" style={{ color: TEXT_PRIMARY }}>验证结果</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1" style={{ color: TEXT_MUTED }}>
                <span>可导入: {dryRunResult.willCreateCards}</span>
                <span>被拦截: {dryRunResult.blockedDrafts.length}</span>
                <span>未处理重复: {dryRunResult.unresolvedDuplicates.length}</span>
                <span>缺 deckId: {dryRunResult.missingDeckId.length}</span>
                <span>缺 tags: {dryRunResult.missingTags.length}</span>
                <span>缺 searchKeywords: {dryRunResult.missingSearchKeywords.length}</span>
              </div>
              {dryRunResult.blockedDrafts.length === 0 && (
                <button onClick={() => handleBatch('import')} disabled={processing}
                  className="mt-2 px-3 py-1.5 rounded-xl text-[11px] font-medium text-white"
                  style={{ backgroundColor: '#22C55E' }}>
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
              style={{ backgroundColor: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.3)' }}>
              <span style={{ color: '#22C55E' }}>✓ 已导入 {approveResult.count} 张卡片到 {decks.find(d => d.id === approveResult.deckId)?.name || approveResult.deckId}</span>
              {onNavigate && (
                <button onClick={() => onNavigate(`deck:${approveResult.deckId}`)}
                  className="ml-2 text-[11px] font-medium underline" style={{ color: BLUE }}>
                  查看牌组
                </button>
              )}
              <button onClick={() => setApproveResult(null)}
                className="ml-2 text-[11px]" style={{ color: TEXT_MUTED }}>关闭</button>
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
                      borderColor: CARD_BORDER,
                      boxShadow: 'var(--card-shadow, 0 1px 3px rgba(0,0,0,0.04))',
                    }}>
                    <label className="flex items-start gap-3 p-3 cursor-pointer"
                      onClick={() => setSelected(s => { const n = new Set(s); n.has(d.id) ? n.delete(d.id) : n.add(d.id); return n; })}>
                      <input type="checkbox" checked={selected.has(d.id)} onChange={() => {}}
                        className="mt-1 rounded accent-[var(--blue)]" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold leading-snug mb-1.5" style={{ color: TEXT_PRIMARY }}>
                          {d.question}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
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
                          <span className="text-[10px]" style={{ color: TEXT_MUTED }}>
                            置信度 {d.confidence.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setExpanded(expanded === d.id ? null : d.id); }}
                        className="p-1 rounded-lg hover:opacity-60">
                        <Eye size={16} style={{ color: TEXT_MUTED }} />
                      </button>
                    </label>

                    {expanded === d.id && (
                      <div className="px-3 pb-3 pt-0 space-y-3 text-[12px]"
                        style={{ borderTop: '1px solid var(--card-border)' }}>
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
