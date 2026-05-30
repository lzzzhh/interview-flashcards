// src/components/DraftReviewPage.tsx — 卡片草稿审核页
import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { apiGet, apiPost } from '../api/client';

interface Draft {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  tags: string | null;
  difficulty: string | null;
  status: string;
  qualityScore: number | null;
  createdAt: string;
}

interface Props { onBack: () => void; }

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const GREEN = '#22C55E';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';

export default function DraftReviewPage({ onBack }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ drafts: Draft[] } | Draft[]>('/card-drafts?status=draft')
      .then(d => setDrafts(Array.isArray(d) ? d : d.drafts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const approve = async (id: string) => {
    await apiPost(`/card-drafts/${id}/approve`, {});
    setDrafts(prev => prev.filter(d => d.id !== id));
  };

  const reject = async (id: string) => {
    await apiPost(`/card-drafts/${id}/reject`, {});
    setDrafts(prev => prev.filter(d => d.id !== id));
  };

  const approveAll = async () => {
    const ids = drafts.map(d => d.id);
    await apiPost('/card-drafts/approve-batch', { ids });
    setDrafts([]);
  };

  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center justify-between">
        <button onClick={onBack} className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="nav-title">卡片草稿</h1>
        {drafts.length > 0 && (
          <button onClick={approveAll} className="text-[13px] font-bold px-3 py-1 rounded-lg" style={{ backgroundColor: `${GREEN}20`, color: GREEN }}>全部通过</button>
        )}
      </div>

      <div className="flex-1 flex items-start justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-6 pb-24">
          {loading ? (
            <p className="text-center text-[13px] mt-8" style={{ color: TEXT_MUTED }}>加载中...</p>
          ) : drafts.length === 0 ? (
            <p className="text-center text-[13px] mt-8" style={{ color: TEXT_MUTED }}>暂无待审核草稿</p>
          ) : (
            <div className="space-y-3">
              {drafts.map((d) => (
                <div key={d.id} className="rounded-xl p-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                  <h3 className="text-[13px] font-bold" style={{ color: TEXT_PRIMARY }}>{d.question}</h3>
                  <p className="text-[12px] mt-2 leading-relaxed" style={{ color: TEXT_MUTED }}>{d.answer}</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => approve(d.id)} className="flex-1 py-2 rounded-lg text-[13px] font-medium flex items-center justify-center gap-1" style={{ backgroundColor: `${GREEN}15`, color: GREEN }}>
                      <CheckCircle2 className="w-4 h-4" />通过
                    </button>
                    <button onClick={() => reject(d.id)} className="flex-1 py-2 rounded-lg text-[13px] font-medium flex items-center justify-center gap-1" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                      <XCircle className="w-4 h-4" />拒绝
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
