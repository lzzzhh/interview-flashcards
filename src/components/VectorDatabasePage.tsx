// src/components/VectorDatabasePage.tsx — 向量数据库（多模块支持）
import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Loader2, Dna, Zap, Database, Layers } from 'lucide-react';
import { hybridSearch, type SearchResult } from '../api/searchApi';
import { apiGet, API_BASE } from '../api/client';
import { CATEGORIES } from '../constants';

interface Props {
  onBack: () => void;
}

interface VectorModule {
  module: string;
  count: number;
  label?: string;
  icon?: string;
}

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';
const ACCENT = '#8B5CF6';
const BLUE = 'var(--blue)';

const MODULE_LABELS: Record<string, string> = {
  'ai-search': 'AI 智能搜索',
};

export default function VectorDatabasePage({ onBack }: Props) {
  const [activeModule, setActiveModule] = useState('ai-search');
  const [modules, setModules] = useState<VectorModule[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [moduleLoading, setModuleLoading] = useState(true);
  const [warmingUp, setWarmingUp] = useState(true);

  useEffect(() => {
    apiGet<{ modules: { module: string; count: number }[] }>('/maintenance/vector-modules')
      .then(data => {
        const list = (data.modules || []).map(m => ({
          ...m,
          label: MODULE_LABELS[m.module] || m.module,
        }));
        setModules(list);
        if (list.length > 0) setActiveModule(list[0].module);
      })
      .catch(() => setModules([{ module: 'ai-search', count: 715, label: 'AI 智能搜索' }]))
      .finally(() => setModuleLoading(false));

    
    fetch(`${API_BASE}/health/warmup`, { method: 'POST' })
      .then(() => setWarmingUp(false))
      .catch(() => setWarmingUp(false));
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await hybridSearch({ query: query.trim(), minScore: 0.3, maxResults: 20 });
      setResults(res.results);
      setSearched(true);
    } catch {
      setResults([]);
      setSearched(true);
    }
    setLoading(false);
  };

  const currentModule = modules.find(m => m.module === activeModule);

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

          {/* 模块 Tab 栏 */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {moduleLoading ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: TEXT_MUTED }} />
                <span className="text-[12px]" style={{ color: TEXT_MUTED }}>加载中...</span>
              </div>
            ) : modules.length === 0 ? (
              <span className="text-[12px]" style={{ color: TEXT_MUTED }}>暂无模块</span>
            ) : (
              modules.map(m => (
                <button
                  key={m.module}
                  onClick={() => setActiveModule(m.module)}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5"
                  style={{
                    backgroundColor: activeModule === m.module ? `${ACCENT}20` : 'rgba(255,255,255,0.05)',
                    color: activeModule === m.module ? ACCENT : TEXT_MUTED,
                  }}
                >
                  <Layers className="w-3 h-3" />
                  {m.label || m.module}
                  <span className="text-[10px] opacity-60">({m.count})</span>
                </button>
              ))
            )}
          </div>

          {/* 模块信息 */}
          {currentModule && (
            <div className="rounded-xl p-3 border text-[12px] leading-relaxed flex items-center gap-2" style={{ backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30`, color: TEXT_MUTED }}>
              <Database className="w-3.5 h-3.5 shrink-0" style={{ color: ACCENT }} />
              <span>
                <strong style={{ color: TEXT_PRIMARY }}>{currentModule.label || currentModule.module}</strong>
                {' · '}{currentModule.count} 条向量记录
              </span>
            </div>
          )}

          {/* AI 智能搜索模块: 语义搜索 */}
          {activeModule === 'ai-search' && (
            <>
              {warmingUp && (
                <div className="text-center py-4">
                  <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" style={{ color: BLUE }} />
                  <p className="text-[12px]" style={{ color: TEXT_MUTED }}>正在预热 AI 搜索模型...</p>
                </div>
              )}
              <div className="rounded-xl p-3 border text-[12px] leading-relaxed" style={{ backgroundColor: `${BLUE}10`, borderColor: `${BLUE}30`, color: TEXT_MUTED }}>
                <Zap className="w-3.5 h-3.5 inline mr-1" style={{ color: BLUE }} />
                基于 bge-m3 向量嵌入的语义搜索，支持中文自然语言查询，自动匹配最相关的面试卡片。
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: TEXT_MUTED }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="输入自然语言问题..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-[13px] bg-transparent"
                  style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
                />
              </div>

              <button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="w-full rounded-xl p-3 flex items-center justify-center gap-2 text-[14px] font-medium transition-opacity disabled:opacity-40"
                style={{ backgroundColor: BLUE, color: '#fff' }}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> 向量检索中...</>
                ) : (
                  <><Search className="w-4 h-4" /> 语义搜索</>
                )}
              </button>

              {searched && results.length === 0 && (
                <div className="text-center py-12" style={{ color: TEXT_MUTED }}>
                  <Dna className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-[14px]">未找到匹配的卡片</p>
                  <p className="text-[11px] mt-1">试试换个更具体的问法</p>
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px]" style={{ color: TEXT_MUTED }}>共 {results.length} 条结果</p>
                  {results.map((item) => {
                    const catMeta = CATEGORIES.find((c) => c.key === item.deckId);
                    return (
                      <div key={item.cardId} className="rounded-xl p-3 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: `${ACCENT}20`, color: ACCENT }}>
                            {catMeta?.label || item.deckId}
                          </span>
                          <span className="text-[12px] font-bold" style={{ color: item.score >= 0.8 ? '#10B981' : item.score >= 0.6 ? '#F59E0B' : TEXT_MUTED }}>
                            {Math.round(item.score * 100)}%
                          </span>
                        </div>
                        <p className="text-[13px] font-medium leading-snug line-clamp-2" style={{ color: TEXT_PRIMARY }}>{item.title}</p>
                        {item.snippet && <p className="text-[11px] mt-1.5 leading-relaxed line-clamp-2" style={{ color: TEXT_MUTED }}>{item.snippet}</p>}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {item.tags?.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px]" style={{ color: TEXT_MUTED }}>#{tag}</span>
                          ))}
                          {item.matchType && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: ACCENT }}>
                              {item.matchType === 'vector' || item.matchType === 'semantic' ? '语义' : item.matchType === 'keyword' ? '关键词' : item.matchType === 'hybrid' ? '混合' : item.matchType}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* 其他模块占位 */}
          {activeModule !== 'ai-search' && (
            <div className="text-center py-12" style={{ color: TEXT_MUTED }}>
              <Database className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-[14px]">{currentModule?.label || activeModule}</p>
              <p className="text-[11px] mt-1">该模块暂无搜索界面</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
