import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Loader2, ChevronDown, ChevronUp, CheckCircle2, Check, ZoomIn, X, Eye, EyeOff } from 'lucide-react';
import { hybridSearch, fetchLearningPlan, type LearningPlanCard, type SearchResult } from '../api/searchApi';
import { getDeckCards } from '../api/cards';
import { API_BASE } from '../api/client';
import type { CardDTO } from '../api/types';
import { CATEGORIES } from '../constants';
import { savePlan, type LearningPlanItem } from '../utils/learningPlans';
import MathText from './MathText';
import BackButton from './BackButton';
import type { Category } from '../types';

interface Props {
  onBack: () => void;
  onEnterStudy: (category: Category) => void;
  variant?: 'page' | 'overlay';
}

// Local display type with full card details; stripped to LearningPlanItem when saving
interface PlanItemDisplay {
  cardId: string;
  deckId: string;
  title: string;
  deckName?: string;
  state: string;
  interval: number;
  selected: boolean;
  snippet?: string;
}

interface CardPreviewState {
  result: SearchResult;
  card?: CardDTO;
  loading: boolean;
  error?: string;
}

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const BLUE = 'var(--blue)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';
const GREEN = '#10B981';
const AMBER = '#D97706';

const STATE_LABELS: Record<string, string> = {
  new: '新卡',
  learning: '学习中',
  review: '复习中',
  relearning: '重学中',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

const CATEGORY_LABEL_BY_KEY = Object.fromEntries(CATEGORIES.map(category => [category.key, category.label]));

// Intent keywords that suggest the user wants a learning plan
const PLAN_INTENT_PATTERNS = [
  /学[习会]|计划|复习|掌握|了解|入门|系统.*学|路线|清单|安排|规划|整理|准备.*面试|面试.*准备|备考|要学|想学|需要学|怎么学|如何学/,
];

function hasPlanIntent(query: string): boolean {
  if (!query.trim()) return false;
  return PLAN_INTENT_PATTERNS.some(p => p.test(query));
}

function displayDeckName(deckId?: string, deckName?: string): string {
  if (deckId && CATEGORY_LABEL_BY_KEY[deckId]) return CATEGORY_LABEL_BY_KEY[deckId];
  if (deckName) {
    const normalized = deckName.trim().toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-');
    if (CATEGORY_LABEL_BY_KEY[normalized]) return CATEGORY_LABEL_BY_KEY[normalized];
    return deckName;
  }
  return deckId || '未知牌组';
}

export default function AISearchPage({ onBack, onEnterStudy: _onEnterStudy, variant = 'page' }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [warmingUp, setWarmingUp] = useState(true);
  const [planExpanded, setPlanExpanded] = useState(false);
  const [planItems, setPlanItems] = useState<PlanItemDisplay[]>([]);
  const [planSaved, setPlanSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState<CardPreviewState | null>(null);
  const [answerVisible, setAnswerVisible] = useState(false);
  const deckCardCache = useRef<Record<string, CardDTO[]>>({});

  useEffect(() => {
    fetch(`${API_BASE}/health/warmup`, { method: 'POST' })
      .then(() => setWarmingUp(false))
      .catch(() => setWarmingUp(false));
  }, []);

  const showPlanCard = useMemo(() => {
    if (planSaved) return false;
    return searched && planItems.length === 0 ? hasPlanIntent(query) : planExpanded || (searched && hasPlanIntent(query));
  }, [searched, query, planExpanded, planSaved, planItems.length]);

  const handleSearch = async (threshold = 0) => {
    if (!query.trim()) return;
    setLoading(true);
    setPlanExpanded(false);
    setPlanSaved(false);
    setPlanItems([]);
    setExpanded(false);
    try {
      const res = await hybridSearch({ query: query.trim(), minScore: threshold, maxResults: 50 });
      setResults(res.results);
      setSearched(true);
    } catch { setResults([]); }
    setLoading(false);
  };

  const handleExpandSearch = () => {
    setExpanded(true);
    handleSearch(0.2);
  };

  const handleFetchPlan = async () => {
    if (planExpanded) { setPlanExpanded(false); return; }
    if (!query.trim()) return;
    setPlanLoading(true);
    setPlanError(null);
    try {
      const data = await fetchLearningPlan({ query: query.trim() });
      const allCards = Object.values(data.plan?.stages || {}).flat() as LearningPlanCard[];
      if (allCards.length === 0) {
        setPlanError('没有找到相关卡片，试试更具体的学习方向');
      } else {
        setPlanItems(allCards.map((p) => ({
          cardId: p.cardId, deckId: p.deckId,
          title: p.title, deckName: p.deckName,
          state: p.state, interval: p.interval ?? 0,
          selected: true, snippet: p.snippet,
        })));
        setPlanExpanded(true);
        setPlanError(null);
      }
    } catch (e: any) {
      console.error('[Plan] fetch failed:', e);
      setPlanError(e?.message || '生成学习清单失败，请检查后端是否启动');
      setPlanItems([]);
    } finally {
      setPlanLoading(false);
    }
  };

  const togglePlanItem = (idx: number) => {
    setPlanItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, selected: !item.selected } : item
    ));
  };

  const handleSavePlan = async () => {
    const selected = planItems.filter(p => p.selected);
    if (selected.length === 0) return;
    setGenerating(true);
    try {
      const slimItems: LearningPlanItem[] = selected.map(({ cardId, deckId, title }) => ({ cardId, deckId, title }));
      await savePlan({
        id: `plan-${Date.now()}`,
        title: query.trim(),
        query: query.trim(),
        items: slimItems,
        createdAt: Date.now(),
      });
      await new Promise(r => setTimeout(r, 600));
    } catch (e) {
      console.error('savePlan failed:', e);
    }
    setGenerating(false);
    setPlanSaved(true);
    setPlanExpanded(false);
  };

  const handleCardClick = async (result: SearchResult) => {
    setAnswerVisible(false);
    setPreview({ result, loading: true });
    try {
      if (!deckCardCache.current[result.deckId]) {
        const resp = await getDeckCards(result.deckId, 2000, 0);
        deckCardCache.current[result.deckId] = resp.cards;
      }
      const card = deckCardCache.current[result.deckId].find(c => c.id === result.cardId);
      setPreview({
        result,
        card,
        loading: false,
        error: card ? undefined : '未找到卡片详情',
      });
    } catch (e: any) {
      setPreview({
        result,
        loading: false,
        error: e?.message || '加载卡片详情失败',
      });
    }
  };

  const selectedCount = planItems.filter(p => p.selected).length;
  const isOverlay = variant === 'overlay';

  return (
    <div className={`${isOverlay ? 'fixed inset-0 z-50 bg-white/78 backdrop-blur-md dark:bg-slate-950/78' : 'dark-bg homepage-glass-stage min-h-screen'} flex flex-col transition-colors`}>
      <div className={`${isOverlay ? 'mx-auto mt-4 w-[calc(100%-2rem)] max-w-md' : 'nav-bar sticky top-0'} z-20 flex items-center gap-3`}>
        <BackButton onClick={onBack} />
        <div
          className={`${isOverlay ? 'h-12 rounded-2xl border bg-white/90 px-3 shadow-lg backdrop-blur-xl dark:bg-slate-900/90' : ''} flex flex-1 items-center gap-2`}
          style={isOverlay ? { borderColor: CARD_BORDER } : undefined}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索卡片，如「哈希表」「梯度下降」..."
            className={`${isOverlay ? 'h-full bg-transparent px-1 text-[14px]' : 'rounded-lg px-3 py-1.5 text-[13px]'} flex-1 border-0 outline-none`}
            style={{
              backgroundColor: isOverlay ? 'transparent' : 'rgba(255,255,255,0.08)',
              color: TEXT_PRIMARY,
              outline: 'none',
              boxShadow: 'none',
            }}
            autoFocus
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className={`${isOverlay ? 'h-9 w-9' : 'p-1.5'} flex shrink-0 items-center justify-center rounded-xl`}
            style={{ backgroundColor: 'rgba(64,156,255,0.15)' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: BLUE }} /> : <Search className="w-4 h-4" style={{ color: BLUE }} />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center">
        <div className={`relative z-10 w-full max-w-md px-5 ${isOverlay ? 'py-4 pb-8' : 'py-6 pb-24'}`}>
          {!searched ? (
            warmingUp ? (
              <div className="text-center mt-8">
                <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" style={{ color: BLUE }} />
                <p className="text-[13px]" style={{ color: TEXT_MUTED }}>正在预热 AI 搜索模型...</p>
              </div>
            ) : (
              <p className="text-center text-[13px] mt-8" style={{ color: TEXT_MUTED }}>输入关键词搜索卡片</p>
            )
          ) : (
            <>
              {results.length === 0 ? (
            <p className="text-center text-[13px] mt-8" style={{ color: TEXT_MUTED }}>未找到相关卡片</p>
          ) : (
            <div className="space-y-3">

              {showPlanCard && (
                <div className="rounded-2xl border overflow-hidden" style={{ borderColor: `${AMBER}40`, backgroundColor: `${AMBER}08` }}>
                  <button onClick={handleFetchPlan} disabled={planLoading} className="w-full text-left px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[13px] font-bold" style={{ color: TEXT_PRIMARY }}>AI 为你推荐学习清单</h3>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${AMBER}18`, color: AMBER }}>AI</span>
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: planError ? '#ef4444' : TEXT_MUTED }}>
                        {planLoading ? '正在生成学习清单...' :
                         planError ? planError :
                         planExpanded ? `${planItems.length} 张卡片待选择` : '智能筛选相关卡片，按学习优先级排序'}
                      </p>
                    </div>
                    {planLoading ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" style={{ color: AMBER }} /> :
                     planExpanded ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: AMBER }} /> :
                     <ChevronDown className="w-4 h-4 shrink-0" style={{ color: AMBER }} />}
                  </button>
                  {planExpanded && (
                    <div className="border-t px-3 py-2 space-y-1 max-h-80 overflow-y-auto" style={{ borderColor: `${AMBER}20` }}>
                      {planItems.length === 0 ? (
                        <p className="text-center text-[12px] py-3" style={{ color: TEXT_MUTED }}>未找到相关卡片</p>
                      ) : (
                        planItems.map((item, i) => (
                          <button key={item.cardId} onClick={() => togglePlanItem(i)}
                            className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
                          >
                            {item.selected ? (
                              <div className="w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center" style={{ borderColor: AMBER, backgroundColor: AMBER }}>
                                <Check className="w-3 h-3" style={{ color: '#fff' }} />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded border-2 shrink-0" style={{ borderColor: 'var(--card-border)' }} />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium truncate" style={{ color: TEXT_PRIMARY }}>{item.title}</p>
                              <p className="text-[10px] truncate" style={{ color: TEXT_MUTED }}>
                                {displayDeckName(item.deckId, item.deckName)} {item.state !== 'new' ? `· 间隔${item.interval}天` : '· 新卡'}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                      {planItems.length > 0 && (
                        <div className="flex items-center justify-between pt-2 pb-1 px-1">
                          <button onClick={() => setPlanItems(prev => prev.map(p => ({ ...p, selected: !p.selected })))}
                            className="text-[11px]" style={{ color: TEXT_MUTED }}>
                            {selectedCount === planItems.length ? '取消全选' : '全选'}
                          </button>
                          <span className="text-[11px]" style={{ color: TEXT_MUTED }}>已选 {selectedCount}/{planItems.length}</span>
                          <button onClick={handleSavePlan} disabled={selectedCount === 0 || generating}
                            className="px-3 py-1 rounded-lg text-[12px] font-bold disabled:opacity-30 flex items-center gap-1.5"
                            style={{ backgroundColor: AMBER, color: '#fff' }}>
                            {generating ? <><Loader2 className="w-3 h-3 animate-spin" /> 生成中</> : '生成清单'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {planSaved && (
                <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ backgroundColor: `${GREEN}12` }}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: GREEN }} />
                  <div>
                    <p className="text-[13px] font-medium" style={{ color: GREEN }}>学习清单已生成</p>
                    <p className="text-[11px]" style={{ color: TEXT_MUTED }}>位置在「我的」→「学习清单」</p>
                  </div>
                </div>
              )}

              <p className="text-[12px]" style={{ color: TEXT_MUTED }}>
                {results.length} 条结果
                {expanded && <span className="ml-1" style={{ color: AMBER }}>（已扩大范围）</span>}
              </p>
              {results.length > 0 && results.length < 3 && !expanded && (
                <button onClick={handleExpandSearch} disabled={loading}
                  className="w-full rounded-xl py-2 flex items-center justify-center gap-1.5 text-[12px] border transition-colors"
                  style={{ borderColor: `${AMBER}30`, color: AMBER }}>
                  <ZoomIn className="w-3.5 h-3.5" />
                  结果较少，扩大搜索范围
                </button>
              )}
              {results.map((r) => (
                <button key={r.cardId} onClick={() => handleCardClick(r)}
                  className="w-full text-left rounded-xl p-3 border transition-colors"
                  style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold truncate flex-1" style={{ color: TEXT_PRIMARY }}>{r.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-2 shrink-0" style={{
                      backgroundColor: r.matchType === 'due' ? 'rgba(234,88,12,0.2)' : 'rgba(100,156,255,0.15)',
                      color: r.matchType === 'due' ? 'var(--orange)' : 'var(--blue)',
                    }}>
                      {r.matchType === 'due' ? '到期' : r.matchType === 'keyword' ? '关键词' : r.matchType === 'vector' || r.matchType === 'semantic' ? '语义' : r.matchType === 'tag' ? '标签' : '混合'}
                    </span>
                  </div>
                  {r.snippet && (
                    <p className="text-[11px] mt-1 leading-relaxed truncate-2" style={{ color: TEXT_MUTED }}>{r.snippet}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px]" style={{ color: TEXT_MUTED }}>{displayDeckName(r.deckId, r.deckName)}</span>
                    <span className="text-[10px]" style={{ color: TEXT_MUTED }}>{r.reason}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          </>)}
        </div>
      </div>
      {preview && (
        <CardPreviewSheet
          preview={preview}
          answerVisible={answerVisible}
          onToggleAnswer={() => setAnswerVisible(v => !v)}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

function getQuestionText(preview: CardPreviewState): string {
  const card = preview.card;
  if (!card) return preview.result.title;
  if (card.type === 'leetcode') {
    const title = card.titleCn || card.title || preview.result.title;
    return card.number ? `#${card.number} ${title}` : title;
  }
  return card.question || preview.result.title;
}

function getAnswerText(preview: CardPreviewState): string {
  const card = preview.card;
  if (!card) return preview.result.snippet || '暂无答案详情';
  if (card.type === 'leetcode') return card.approach || card.description || '暂无答案详情';
  return card.answer || '暂无答案详情';
}

function getBodyText(preview: CardPreviewState): string | null {
  const card = preview.card;
  if (!card) return preview.result.snippet || null;
  if (card.type === 'leetcode') return card.description || null;
  return null;
}

function CardPreviewSheet({
  preview,
  answerVisible,
  onToggleAnswer,
  onClose,
}: {
  preview: CardPreviewState;
  answerVisible: boolean;
  onToggleAnswer: () => void;
  onClose: () => void;
}) {
  const card = preview.card;
  const progress = card?.progress;
  const state = progress?.state || (preview.result.due ? 'review' : 'new');
  const tags = card?.tags?.length ? card.tags : preview.result.tags;
  const question = getQuestionText(preview);
  const answer = getAnswerText(preview);
  const body = getBodyText(preview);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/25 px-3 pb-3 backdrop-blur-[2px]">
      <div
        className="max-h-[72vh] w-full max-w-md overflow-hidden rounded-t-3xl border bg-white shadow-2xl dark:bg-slate-950"
        style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
      >
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: CARD_BORDER }}>
          <div className="min-w-0">
            <p className="text-[12px] font-medium" style={{ color: TEXT_MUTED }}>
              {displayDeckName(preview.result.deckId, preview.result.deckName)} · {STATE_LABELS[state] || state}
            </p>
            <h3 className="mt-0.5 truncate text-[15px] font-bold">卡片详情</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl">
            <X className="h-4 w-4" style={{ color: TEXT_MUTED }} />
          </button>
        </div>

        <div className="max-h-[calc(72vh-56px)] overflow-y-auto px-4 py-4">
          {preview.loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-[13px]" style={{ color: TEXT_MUTED }}>
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: BLUE }} />
              正在加载卡片详情...
            </div>
          ) : (
            <div className="space-y-4">
              {preview.error && (
                <div className="rounded-xl border px-3 py-2 text-[12px]" style={{ borderColor: 'rgba(239,68,68,0.24)', color: '#EF4444' }}>
                  {preview.error}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <MetaPill label={STATE_LABELS[state] || state} />
                {card?.difficulty && <MetaPill label={DIFFICULTY_LABELS[card.difficulty] || card.difficulty} />}
                <MetaPill label={preview.result.matchType === 'due' ? '到期' : preview.result.matchType === 'keyword' ? '关键词' : preview.result.matchType === 'vector' || preview.result.matchType === 'semantic' ? '语义' : '混合'} />
                {progress && progress.intervalDays > 0 && <MetaPill label={`间隔 ${progress.intervalDays} 天`} />}
              </div>

              <section>
                <h4 className="mb-2 text-[12px] font-bold" style={{ color: TEXT_MUTED }}>题目</h4>
                <div className="rounded-2xl border px-3 py-3 text-[14px] font-semibold leading-relaxed" style={{ borderColor: CARD_BORDER }}>
                  <MathText text={question} />
                </div>
              </section>

              {body && (
                <section>
                  <h4 className="mb-2 text-[12px] font-bold" style={{ color: TEXT_MUTED }}>描述</h4>
                  <div className="rounded-2xl border px-3 py-3 text-[13px] leading-relaxed whitespace-pre-wrap" style={{ borderColor: CARD_BORDER, color: TEXT_MUTED }}>
                    <MathText text={body} />
                  </div>
                </section>
              )}

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-[12px] font-bold" style={{ color: TEXT_MUTED }}>答案</h4>
                  <button
                    type="button"
                    onClick={onToggleAnswer}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold"
                    style={{ backgroundColor: 'rgba(64,156,255,0.15)', color: BLUE }}
                  >
                    {answerVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {answerVisible ? '隐藏答案' : '显示答案'}
                  </button>
                </div>
                <div className="min-h-24 rounded-2xl border px-3 py-3 text-[13px] leading-relaxed whitespace-pre-wrap" style={{ borderColor: CARD_BORDER }}>
                  {answerVisible ? <MathText text={answer} /> : <span style={{ color: TEXT_MUTED }}>答案已隐藏</span>}
                </div>
              </section>

              {tags.length > 0 && (
                <section>
                  <h4 className="mb-2 text-[12px] font-bold" style={{ color: TEXT_MUTED }}>标签</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => <MetaPill key={tag} label={tag} />)}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaPill({ label }: { label: string }) {
  return (
    <span className="rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ backgroundColor: 'rgba(100,116,139,0.12)', color: TEXT_MUTED }}>
      {label}
    </span>
  );
}
