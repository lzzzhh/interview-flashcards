import { useState } from 'react';
import { Loader2, X, ChevronRight, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useDocumentQueue } from '../hooks/useDocumentQueue';
import { API_BASE } from '../api/client';

interface Props {
  onViewDrafts: (docId: string) => void;
}

const BLUE = 'var(--blue)';
const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';

async function cancelOnServer(docId: string) {
  try {
    await fetch(`${API_BASE}/documents/${docId}/cancel`, { method: 'POST' });
  } catch {}
}

export default function ProcessingBadge({ onViewDrafts }: Props) {
  const { items, processingCount, doneCount, removeFromQueue, clearQueue } = useDocumentQueue();
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2" style={{ maxWidth: 360 }}>
      {/* Collapsed badge */}
      {!open && (
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-2xl backdrop-blur-xl border shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          {processingCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: BLUE }}>
              <Loader2 size={12} className="animate-spin" />{processingCount}
            </span>
          )}
          {doneCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: '#22C55E' }}>
              <CheckCircle size={12} />{doneCount}
            </span>
          )}
          <span className="text-[11px]" style={{ color: TEXT_MUTED }}>制卡</span>
        </button>
      )}

      {/* Expanded panel */}
      {open && (
        <div className="w-full rounded-2xl border backdrop-blur-xl shadow-xl overflow-hidden"
          style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: CARD_BORDER }}>
            <span className="text-[13px] font-bold" style={{ color: TEXT_PRIMARY }}>
              制卡队列 ({items.length})
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => {
                items.filter(i => i.status === 'processing').forEach(i => cancelOnServer(i.docId));
                clearQueue();
              }} className="text-[10px] px-2 py-0.5 rounded-lg border" style={{ borderColor: CARD_BORDER, color: TEXT_MUTED }}>
                清除全部
              </button>
              <button onClick={() => setOpen(false)} className="p-0.5">
                <X size={16} style={{ color: TEXT_MUTED }} />
              </button>
            </div>
          </div>

          {/* Items */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1.5">
            {items.map(item => (
              <div key={item.docId} className="flex items-center gap-3 p-2 rounded-xl" style={{ backgroundColor: 'var(--card-border)' }}>
                {/* Icon */}
                <div className="shrink-0">
                  {item.status === 'processing' ? (
                    <Loader2 size={16} className="animate-spin" style={{ color: BLUE }} />
                  ) : item.status === 'failed' ? (
                    <AlertCircle size={16} style={{ color: '#EF4444' }} />
                  ) : (
                    <CheckCircle size={16} style={{ color: '#22C55E' }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium truncate" style={{ color: TEXT_PRIMARY }}>
                    <FileText size={12} className="inline mr-1" style={{ color: TEXT_MUTED }} />
                    {item.filename}
                  </div>
                  {item.status === 'processing' && (
                    <div className="mt-1">
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--card-border)' }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(item.progress, 2)}%`, backgroundColor: BLUE }} />
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: TEXT_MUTED }}>
                        {item.message || '处理中...'} · {item.progress}%
                      </div>
                    </div>
                  )}
                  {item.status === 'done' && (
                    <div className="text-[11px]" style={{ color: item.draftCount > 0 ? '#22C55E' : TEXT_MUTED }}>
                      {item.draftCount > 0 ? `✅ ${item.draftCount} 张草稿` : '无待审核草稿'}
                    </div>
                  )}
                  {item.status === 'failed' && (
                    <div className="text-[10px]" style={{ color: '#EF4444' }}>
                      {item.message || '处理失败'}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-center gap-1">
                  {item.status === 'done' && item.draftCount > 0 && (
                    <button onClick={() => onViewDrafts(item.docId)}
                      className="px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-0.5"
                      style={{ backgroundColor: BLUE, color: '#fff' }}>
                      <ChevronRight size={12} />草稿
                    </button>
                  )}
                  {item.status === 'processing' && (
                    <button onClick={() => { cancelOnServer(item.docId); }} className="p-0.5">
                      <X size={14} style={{ color: '#EF4444' }} />
                    </button>
                  )}
                  {item.status !== 'processing' && (
                    <button onClick={() => removeFromQueue(item.docId)} className="p-0.5">
                      <X size={14} style={{ color: TEXT_MUTED }} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
