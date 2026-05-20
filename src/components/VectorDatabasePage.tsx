// src/components/VectorDatabasePage.tsx — 向量数据库（语义搜索）
import { useState } from 'react';
import { ArrowLeft, Search, Loader2, Dna, Zap } from 'lucide-react';
import { hybridSearch, type SearchResult } from '../api/searchApi';
import { CATEGORIES } from '../constants';

interface Props {
  onBack: () => void;
}

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';
const ACCENT = '#8B5CF6';

export default function VectorDatabasePage({ onBack }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await hybridSearch(query.trim(), 20);
      setResults(res.results);
      setSearched(true);
    } catch {
      setResults([]);
      setSearched(true);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  function getScoreColor(score: number): string {
    if (score >= 0.8) return '#10B981';
    if (score >= 0.6) return '#F59E0B';
    return TEXT_MUTED;
  }

  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center gap-3">
        <button onClick={onBack} className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} />
        </button>
        <Dna className="w-5 h-5" style={{ color: ACCENT }} />
        <h1 className="nav-title">向量数据库</h1>
      </div>

      <div className="flex-1 flex items-start justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-4 pb-24 space-y-4">

          {/* 说明 */}
          <div className="rounded-xl p-3 border text-[12px] leading-relaxed" style={{ backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30`, color: TEXT_MUTED }}>
            <Zap className="w-3.5 h-3.5 inline mr-1" style={{ color: ACCENT }} />
            基于向量嵌入的语义搜索，支持中文自然语言查询，自动匹配最相关的面试卡片。
          </div>

          {/* 搜索栏 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: TEXT_MUTED }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入自然语言问题，如：Transformer 的多头注意力机制..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-[13px] bg-transparent"
              style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="w-full rounded-xl p-3 flex items-center justify-center gap-2 text-[14px] font-medium transition-opacity disabled:opacity-40"
            style={{ backgroundColor: ACCENT, color: '#fff' }}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 向量检索中...</>
            ) : (
              <><Search className="w-4 h-4" /> 语义搜索</>
            )}
          </button>

          {/* 结果 */}
          {searched && results.length === 0 && (
            <div className="text-center py-12" style={{ color: TEXT_MUTED }}>
              <Dna className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-[14px]">未找到匹配的卡片</p>
              <p className="text-[11px] mt-1">试试换个更具体的问法</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                共 {results.length} 条结果
              </p>
              {results.map((item) => {
                const catMeta = CATEGORIES.find((c) => c.key === item.deckId);
                const scorePercent = Math.round(item.score * 100);
                return (
                  <div
                    key={item.cardId}
                    className="rounded-xl p-3 border"
                    style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: `${ACCENT}20`, color: ACCENT }}>
                        {catMeta?.label || item.deckId}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[12px] font-bold" style={{ color: getScoreColor(item.score) }}>
                          {scorePercent}%
                        </span>
                        <span className="text-[10px]" style={{ color: TEXT_MUTED }}>匹配度</span>
                      </div>
                    </div>
                    <p className="text-[13px] font-medium leading-snug line-clamp-2" style={{ color: TEXT_PRIMARY }}>
                      {item.title}
                    </p>
                    {item.snippet && (
                      <p className="text-[11px] mt-1.5 leading-relaxed line-clamp-2" style={{ color: TEXT_MUTED }}>
                        {item.snippet}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {item.tags?.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px]" style={{ color: TEXT_MUTED }}>#{tag}</span>
                      ))}
                      {item.matchType && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: ACCENT }}>
                          {item.matchType === 'vector' ? '向量匹配' : item.matchType === 'keyword' ? '关键词' : item.matchType}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
