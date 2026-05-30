import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Check, X, Merge, Layers, Eye, Loader2 } from 'lucide-react';
import { getDrafts, batchReview, batchImport, importDryRun, approveDraft, rejectDraft, getDecks } from '../api/documents';
import type { CardDraftDTO } from '../api/documents';

interface Props {
  onBack: () => void;
  documentId?: string;
}

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';
const ACCENT = '#10B981';
const AMBER = '#F59E0B';

const STATUS_COLORS: Record<string, string> = {
  draft: ACCENT,
  needs_review: AMBER,
  approved: '#3B82F6',
  rejected: '#EF4444',
  duplicate: '#8B5CF6',
  merged: '#8B5CF6',
  out_of_scope: '#6B7280',
};

const OBJ_LABELS: Record<string, string> = {
  definition: '定义', principle: '原理', procedure: '流程',
  formula: '公式', comparison: '对比', application: '应用',
  example: '例子', pitfall: '误区',
};

export default function CardDraftReviewPage({ onBack, documentId }: Props) {
  const [drafts, setDrafts] = useState<CardDraftDTO[]>([]);
  const [decks, setDecks] = useState<{ id: string; name: string }[]>([]);
  const [selectedDeck, setSelectedDeck] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [tab, setTab] = useState<'all' | 'draft' | 'needs_review' | 'groups'>('draft');
  const [message, setMessage] = useState('');
  const [dryRunResult, setDryRunResult] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const [d, dk] = await Promise.all([
        getDrafts(documentId ? undefined : tab === 'all' ? undefined : tab === 'groups' ? undefined : tab),
        getDecks(),
      ]);
      if (documentId) setDrafts(d.filter(dr => dr.documentId === documentId));
      else setDrafts(d);
      setDecks(dk);
    } catch (e: any) {
      setDrafts([]);
      setDecks([]);
      setMessage(`加载失败: ${e?.message || '请稍后重试'}`);
    } finally {
      setLoading(false);
    }
  }, [documentId, tab]);

  useEffect(() => { load(); }, [load]);

  // Group drafts by duplicateGroupId
  const groups = new Map<string, CardDraftDTO[]>();
  for (const d of drafts) {
    if (d.duplicateGroupId) {
      const arr = groups.get(d.duplicateGroupId) || [];
      arr.push(d);
      groups.set(d.duplicateGroupId, arr);
    }
  }

  const filteredDrafts = tab === 'groups' ? [] : (tab === 'all' ? drafts : drafts.filter(d => d.status === tab));

  async function handleBatch(action: string) {
    if (selected.size === 0) return;
    setProcessing(true);
    setMessage('');
    try {
      if (action === 'import') {
        if (!selectedDeck) { setMessage('请先选择目标 deck'); setProcessing(false); return; }
        const r = await batchImport([...selected], selectedDeck);
        setMessage(`导入完成: ${r.imported}/${r.results.length} 张`);
      } else if (action === 'dry-run') {
        const r = await importDryRun([...selected]);
        setDryRunResult(r);
        setMessage(`验证完成: ${r.willCreateCards}/${r.totalChecked} 可导入`);
      } else {
        const r = await batchReview([...selected], action, { deckId: selectedDeck, note: '批量操作' });
        const ok = r.results.filter(x => x.status !== 'error').length;
        const err = r.results.filter(x => x.status === 'error').length;
        setMessage(`操作完成: ${ok} 成功, ${err} 失败`);
      }
      setSelected(new Set());
      await load();
    } catch (e: any) { setMessage(`错误: ${e.message}`); }
    setProcessing(false);
  }

  async function handleSingle(id: string, action: string) {
    setProcessing(true);
    try {
      if (action === 'approve') {
        if (!selectedDeck) { setMessage('请先选择目标 deck'); setProcessing(false); return; }
        await approveDraft(id, selectedDeck);
      } else if (action === 'reject') {
        await rejectDraft(id);
      } else {
        await batchReview([id], action, { note: '单张操作' });
      }
      setMessage('操作完成');
      await load();
    } catch (e: any) { setMessage(`错误: ${e.message}`); }
    setProcessing(false);
  }

  async function handleGroupResolve(groupId: string, action: string) {
    const group = groups.get(groupId);
    if (!group) return;
    setProcessing(true);
    try {
      const ids = group.map(d => d.id);
      await batchReview(ids, action, { note: `Group ${action}` });
      setMessage(`组操作完成: ${action}`);
      await load();
    } catch (e: any) { setMessage(`错误: ${e.message}`); }
    setProcessing(false);
  }

  return (
    <div className="homepage-glass-stage flex-1 flex flex-col overflow-hidden transition-colors" style={{ color: TEXT_PRIMARY }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0" style={{ borderColor: CARD_BORDER }}>
        <button onClick={onBack} className="p-1.5 rounded-xl hover:opacity-70"><ArrowLeft size={20} /></button>
        <span className="font-semibold text-[15px]" style={{ color: TEXT_PRIMARY }}>卡片草稿审核</span>
        <span className="text-[12px] ml-auto" style={{ color: TEXT_MUTED }}>{drafts.length} 张草稿</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-2 border-b shrink-0" style={{ borderColor: CARD_BORDER }}>
        {['draft', 'needs_review', 'groups', 'all'].map(t => (
          <button key={t} onClick={() => { setTab(t as any); setDryRunResult(null); }}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-medium transition-colors ${tab === t ? '' : 'opacity-50'}`}
            style={{ backgroundColor: tab === t ? ACCENT : 'transparent', color: tab === t ? '#fff' : TEXT_PRIMARY }}>
            {t === 'draft' ? '待审核' : t === 'needs_review' ? '需复查' : t === 'groups' ? '重复组' : '全部'}
          </button>
        ))}
      </div>

      {/* Deck selector + actions */}
      <div className="flex items-center gap-2 px-4 py-2 border-b shrink-0" style={{ borderColor: CARD_BORDER }}>
        <select value={selectedDeck} onChange={e => setSelectedDeck(e.target.value)}
          className="text-[12px] px-2 py-1.5 rounded-xl border" style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY, backgroundColor: CARD_BG }}>
          <option value="">选择目标 deck...</option>
          {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button onClick={() => handleBatch('dry-run')} disabled={processing || selected.size === 0}
          className="px-2.5 py-1.5 rounded-xl text-[11px] font-medium border" style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY, opacity: processing ? 0.5 : 1 }}>
          <Eye size={14} className="inline mr-1" />验证
        </button>
        <button onClick={() => handleBatch('approve')} disabled={processing || selected.size === 0}
          className="px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-white" style={{ backgroundColor: ACCENT, opacity: processing ? 0.5 : 1 }}>
          <Check size={14} className="inline mr-1" />批量通过
        </button>
        <button onClick={() => handleBatch('reject')} disabled={processing || selected.size === 0}
          className="px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-white" style={{ backgroundColor: '#EF4444', opacity: processing ? 0.5 : 1 }}>
          <X size={14} className="inline mr-1" />拒绝
        </button>
      </div>

      {/* Dry-run result */}
      {dryRunResult && (
        <div className="mx-4 mt-2 p-3 rounded-2xl border text-[12px]" style={{ backgroundColor: CARD_BG, borderColor: AMBER }}>
          <div className="font-medium mb-1">Dry Run 验证结果</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <span>可导入: {dryRunResult.willCreateCards}</span>
            <span>被拦截: {dryRunResult.blockedDrafts.length}</span>
            <span>未处理重复: {dryRunResult.unresolvedDuplicates.length}</span>
            <span>缺 deckId: {dryRunResult.missingDeckId.length}</span>
            <span>缺 tags: {dryRunResult.missingTags.length}</span>
            <span>缺 searchKeywords: {dryRunResult.missingSearchKeywords.length}</span>
            <span>graph_pending: {dryRunResult.graphPending.length}</span>
          </div>
          {dryRunResult.blockedDrafts.length === 0 && (
            <button onClick={() => handleBatch('import')} disabled={processing}
              className="mt-2 px-3 py-1.5 rounded-xl text-[11px] font-medium text-white" style={{ backgroundColor: ACCENT }}>
              <Loader2 size={12} className="inline mr-1" />确认导入 {dryRunResult.willCreateCards} 张
            </button>
          )}
        </div>
      )}

      {message && (
        <div className="mx-4 mt-2 p-2 rounded-xl text-[12px] text-center" style={{ backgroundColor: 'rgba(251,191,36,0.15)' }}>
          {message}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-32" style={{ color: TEXT_MUTED }}>加载中...</div>
        ) : tab === 'groups' ? (
          // Duplicate groups
          [...groups.entries()].length === 0 ? (
            <div className="text-center py-8" style={{ color: TEXT_MUTED }}>无重复组</div>
          ) : (
            [...groups.entries()].map(([gid, gdrafts]) => (
               <div key={gid} className="p-3 rounded-2xl border" style={{ backgroundColor: CARD_BG, borderColor: AMBER }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-bold" style={{ color: AMBER }}>
                    <Layers size={14} className="inline mr-1" />重复组 ({gdrafts.length} 张)
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => handleGroupResolve(gid, 'merge')} className="px-2 py-1 rounded-lg text-[10px] font-medium text-white" style={{ backgroundColor: '#8B5CF6' }}><Merge size={12} className="inline mr-0.5" />合并</button>
                    <button onClick={() => handleGroupResolve(gid, 'keep_best')} className="px-2 py-1 rounded-lg text-[10px] font-medium text-white" style={{ backgroundColor: ACCENT }}>保留最佳</button>
                      <button onClick={() => handleGroupResolve(gid, 'keep_both')} className="px-2 py-1 rounded-lg text-[10px] font-medium border" style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}>全部保留</button>
                    <button onClick={() => handleGroupResolve(gid, 'reject')} className="px-2 py-1 rounded-lg text-[10px] font-medium text-white" style={{ backgroundColor: '#EF4444' }}>全部拒绝</button>
                  </div>
                </div>
                {gdrafts.map(d => (
                  <div key={d.id} className="text-[12px] py-1 px-2 rounded-lg mb-1" style={{ backgroundColor: 'var(--card-border)' }}>
                    <span className="font-medium">[{d.learningObjective}]</span> {d.question}
                  </div>
                ))}
              </div>
            ))
          )
        ) : (
          // Draft list
          filteredDrafts.map(d => (
            <div key={d.id} className="rounded-2xl border overflow-hidden" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
              {/* Header row */}
              <label className="flex items-start gap-3 p-3 cursor-pointer hover:bg-white/45 dark:hover:bg-white/5" onClick={() => setSelected(s => { const n = new Set(s); n.has(d.id) ? n.delete(d.id) : n.add(d.id); return n; })}>
                <input type="checkbox" checked={selected.has(d.id)} onChange={() => {}} className="mt-0.5 rounded" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white" style={{ backgroundColor: STATUS_COLORS[d.status] || '#6B7280' }}>
                      {d.status}
                    </span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: ACCENT }}>
                      {d.type}
                    </span>
                    {d.learningObjective && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>
                        {OBJ_LABELS[d.learningObjective] || d.learningObjective}
                      </span>
                    )}
                    {d.canonicalConcept && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}>
                        {d.canonicalConcept}
                      </span>
                    )}
                  </div>
                  <div className="text-[13px] font-medium leading-snug" style={{ color: TEXT_PRIMARY }}>{d.question}</div>
                  {d.duplicateGroupId && (
                    <div className="text-[10px] mt-1" style={{ color: AMBER }}>
                      <Layers size={12} className="inline mr-0.5" />重复组: {d.duplicateGroupId.slice(-8)}
                    </div>
                  )}
                </div>
                <button onClick={e => { e.stopPropagation(); setExpanded(expanded === d.id ? null : d.id); }}
                  className="p-1 rounded-lg hover:opacity-60">
                  <Eye size={16} style={{ color: TEXT_MUTED }} />
                </button>
              </label>

              {/* Expanded detail */}
              {expanded === d.id && (
                <div className="px-3 pb-3 pt-0 space-y-2 text-[12px]" style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
                  <div className="pt-2">
                    <div className="font-medium mb-0.5" style={{ color: TEXT_MUTED }}>Answer</div>
                    <div className="leading-relaxed whitespace-pre-wrap" style={{ color: TEXT_PRIMARY, opacity: 0.9 }}>{d.answer}</div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {d.tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: ACCENT }}>{t}</span>)}
                  </div>

                  {d.atomicFacts && d.atomicFacts.length > 0 && (
                    <div>
                      <div className="font-medium mb-0.5" style={{ color: TEXT_MUTED }}>原子事实</div>
                      <ul className="list-disc list-inside space-y-0.5" style={{ color: TEXT_PRIMARY }}>
                        {d.atomicFacts.map((f, i) => <li key={i} style={{ color: TEXT_PRIMARY, opacity: 0.85 }}>{f}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[11px]" style={{ color: TEXT_MUTED }}>
                    {d.confidence && <span>置信度: {d.confidence.toFixed(2)}</span>}
                    {d.graphStatus && <span>图谱: {d.graphStatus}</span>}
                    {d.duplicateCheck && <span>去重: {d.duplicateCheck.status}</span>}
                  </div>

                  {/* Source refs */}
                  {d.sourceRefs?.slice(0, 3).map((sr, i) => (
                     <div key={i} className="p-2 rounded-lg text-[11px]" style={{ backgroundColor: 'var(--card-border)', color: TEXT_MUTED }}>
                      <div className="flex gap-2 mb-0.5">
                        <span style={{ color: TEXT_MUTED }}>Page {sr.pageNumber || '?'}</span>
                        <span style={{ color: TEXT_MUTED }}>{sr.source}</span>
                      </div>
                      <div className="italic">"{sr.quote?.slice(0, 150)}"</div>
                    </div>
                  ))}

                  {/* Single actions */}
                  <div className="flex gap-1 flex-wrap pt-1">
                    <button onClick={() => handleSingle(d.id, 'approve')} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white" style={{ backgroundColor: ACCENT }}>
                      <Check size={12} className="inline mr-1" />通过
                    </button>
                    <button onClick={() => handleSingle(d.id, 'reject')} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white" style={{ backgroundColor: '#EF4444' }}>
                      <X size={12} className="inline mr-1" />拒绝
                    </button>
                     <button onClick={() => handleSingle(d.id, 'mark_out_of_scope')} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium backdrop-blur-xl" style={{ backgroundColor: 'var(--card-border)', color: TEXT_MUTED }}>
                      超出范围
                    </button>
                     <button onClick={() => handleSingle(d.id, 'mark_duplicate')} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium backdrop-blur-xl" style={{ backgroundColor: 'var(--card-border)', color: '#8B5CF6' }}>
                      标记重复
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
