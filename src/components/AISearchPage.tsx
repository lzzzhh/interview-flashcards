import { useState } from 'react';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import { hybridSearch, type SearchResult } from '../api/searchApi';
import { useAppContext } from '../context/AppContext';
import type { Category } from '../types';

interface Props {
  onBack: () => void;
  onEnterStudy: (category: Category) => void;
}

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const BLUE = 'var(--blue)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';

export default function AISearchPage({ onBack, onEnterStudy }: Props) {
  const { dispatch } = useAppContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await hybridSearch(query.trim(), 15);
      setResults(res.results);
      setSearched(true);
    } catch { setResults([]); }
    setLoading(false);
  };

  const handleCardClick = (card: SearchResult) => {
    dispatch({ type: 'JUMP_TO_CARD', payload: { category: card.deckId as Category, cardId: card.cardId } });
    onEnterStudy(card.deckId as Category);
  };

  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center gap-3">
        <button onClick={onBack} className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索卡片，如「哈希表」「梯度下降」..."
            className="flex-1 px-3 py-1.5 rounded-lg text-[13px] border-0 outline-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: TEXT_PRIMARY }}
            autoFocus
          />
          <button onClick={handleSearch} disabled={loading} className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(64,156,255,0.15)' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: BLUE }} /> : <Search className="w-4 h-4" style={{ color: BLUE }} />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-6 pb-24">
          {!searched ? (
            <p className="text-center text-[13px] mt-8" style={{ color: TEXT_MUTED }}>输入关键词搜索卡片</p>
          ) : results.length === 0 ? (
            <p className="text-center text-[13px] mt-8" style={{ color: TEXT_MUTED }}>未找到相关卡片</p>
          ) : (
            <div className="space-y-2">
              <p className="text-[12px] mb-2" style={{ color: TEXT_MUTED }}>{results.length} 条结果</p>
              {results.map((r) => (
                <button
                  key={r.cardId}
                  onClick={() => handleCardClick(r)}
                  className="w-full text-left rounded-xl p-3 border transition-colors"
                  style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold truncate flex-1" style={{ color: TEXT_PRIMARY }}>{r.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-2 shrink-0" style={{
                      backgroundColor: r.matchType === 'due' ? 'rgba(234,88,12,0.2)' : 'rgba(100,156,255,0.15)',
                      color: r.matchType === 'due' ? 'var(--orange)' : 'var(--blue)',
                    }}>
                      {r.matchType === 'due' ? '到期' : r.matchType === 'keyword' ? '关键词' : r.matchType === 'vector' ? '语义' : '混合'}
                    </span>
                  </div>
                  {r.snippet && (
                    <p className="text-[11px] mt-1 leading-relaxed truncate-2" style={{ color: TEXT_MUTED }}>
                      {r.snippet}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {r.deckName && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{r.deckName}</span>}
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{r.reason}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
