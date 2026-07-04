// src/components/CardDatabasePage.tsx — 卡片数据库（全局搜索 + 管理 + 导出导入）
import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Trash2, Database, Download, Upload, ChevronDown, FileJson, FileSpreadsheet, FileInput, BrainCircuit, RotateCcw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getDeckCards } from '../api/cards';
import { CATEGORIES } from '../constants';
import { loadCustomDecks, UNASSIGNED_DECK_ID, UNASSIGNED_DECK_NAME } from '../utils/customDecks';
import { loadDeletedCards, restoreDeletedCard, softDeleteCard } from '../utils/cardTrash';
import { loadAllCardsFromStorage } from '../utils/cardLibrary';
import { createDefaultSM2 } from '../utils/sm2';
import { validateExportCards } from '../utils/backup';
import { parseMarkdownCards } from '../utils/markdownImporter';
import BackButton from './BackButton';
import type { Category, FlashCard, QACard, LeetCodeCard } from '../types';

interface Props {
  onBack: () => void;
  onStudyCard?: (card: FlashCard) => void;
}

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';
const ACCENT = 'var(--blue)';
const GREEN = '#10B981';
const PURPLE = '#8B5CF6';

// ---- 工具函数 ----
function getCardText(card: FlashCard): string {
  if (card.category === 'leetcode') {
    return `${card.titleCn || card.title} ${card.description || ''}`;
  }
  const qa = card as QACard;
  return `${qa.question} ${qa.answer || ''}`;
}

function getCardDisplayLabel(card: FlashCard): string {
  if (card.category === 'leetcode') {
    return `#${card.number} ${card.titleCn || card.title}`;
  }
  return (card as QACard).question;
}

function getCategoryLabel(category: string): string {
  if (category === UNASSIGNED_DECK_ID) return UNASSIGNED_DECK_NAME;
  return CATEGORIES.find(c => c.key === category)?.label || loadCustomDecks().find(d => d.id === category)?.name || category;
}

function loadAllCards(): FlashCard[] {
  return loadAllCardsFromStorage();
}

// ---- 导出/导入类型 ----
interface ExportCard {
  id: string;
  category: string;
  tags: string[];
  difficulty?: string;
  sm2: any;
  favorited: boolean;
  userNotes?: string;
  subTopic?: string;
  question?: string;
  answer?: string;
  number?: number;
  title?: string;
  titleCn?: string;
  description?: string;
  approach?: string;
  source?: string;
  codes?: Record<string, string>;
}

function toExportCard(card: FlashCard): ExportCard {
  const base: ExportCard = {
    id: card.id,
    category: card.category,
    tags: card.tags || [],
    difficulty: card.category === 'leetcode' ? card.difficulty : ((card as QACard).difficulty || ''),
    sm2: card.sm2,
    favorited: card.favorited,
    userNotes: card.userNotes,
  };
  if (card.category === 'leetcode') {
    const lc = card as LeetCodeCard;
    return { ...base, number: lc.number, title: lc.title, titleCn: lc.titleCn, description: lc.description, approach: lc.approach, codes: lc.codes };
  }
  const qa = card as QACard;
  return { ...base, question: qa.question, answer: qa.answer, subTopic: qa.subTopic, source: qa.source };
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob(['\uFEFF' + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function escapeCsv(str: string): string {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateId(): string {
  return `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const CODE_LANG_KEYS = ['python', 'java', 'cpp', 'javascript', 'go', 'typescript', 'rust'] as const;

function collectCodeLanguages(cards: ExportCard[]): string[] {
  const langs = new Set<string>();
  for (const c of cards) {
    if (c.codes) for (const lang of Object.keys(c.codes)) langs.add(lang);
  }
  return [...langs].sort();
}

function buildCSVHeader(cards: ExportCard[]): string {
  return ['id', 'category', 'number', 'title', 'titleCn', 'description', 'approach', 'question', 'answer', 'tags', 'subTopic', 'difficulty', 'source', 'userNotes', ...collectCodeLanguages(cards).map(l => `code_${l}`)].join(',');
}

function exportCardToCSVRow(card: ExportCard, codeLangs: string[]): string {
  const vals: Record<string, string> = {
    id: card.id, category: card.category, number: card.number?.toString() || '', title: card.title || '', titleCn: card.titleCn || '',
    description: card.description || '', approach: card.approach || '', question: card.question || '', answer: card.answer || '',
    tags: (card.tags || []).join(';'), subTopic: card.subTopic || '', difficulty: card.difficulty || '', source: card.source || '', userNotes: card.userNotes || '',
  };
  for (const lang of codeLangs) vals[`code_${lang}`] = card.codes?.[lang] || '';
  return ['id', 'category', 'number', 'title', 'titleCn', 'description', 'approach', 'question', 'answer', 'tags', 'subTopic', 'difficulty', 'source', 'userNotes', ...codeLangs.map(l => `code_${l}`)]
    .map(k => `"${(vals[k] || '').replace(/"/g, '""')}"`).join(',');
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '', inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

// ---- 主组件 ----
export default function CardDatabasePage({ onBack, onStudyCard }: Props) {
  const { state, dispatch } = useAppContext();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Load all cards from API when database page mounts
  useEffect(() => {
    const DECK_IDS = ['statistics', 'machine-learning', 'deep-learning', 'llm', 'agent', 'jargon', 'workplace', 'vibe-coding'];
    let cancelled = false;
    async function load() {
      const allFlash: FlashCard[] = [];
      for (const deckId of DECK_IDS) {
        if (cancelled) return;
        try {
          const resp = await getDeckCards(deckId, 999);
          if (resp?.cards) {
            for (const dto of resp.cards) {
              allFlash.push({
                id: dto.id,
                category: (dto.deckId as any),
                question: dto.question || dto.titleCn || dto.title || '',
                answer: dto.answer || '',
                tags: dto.tags || [],
                subTopic: dto.subTopic || undefined,
                difficulty: (dto.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
                source: dto.source || undefined,
                sm2: { state: 'new' as const, easeFactor: 2.5, interval: 0, repetitions: 0, lapses: 0, nextReview: Date.now() },
                favorited: false,
              } satisfies QACard);
            }
          }
        } catch {}
      }
      if (!cancelled && allFlash.length > 0) {
        dispatch({ type: 'LOADED_QUEUE', payload: { cards: allFlash, mode: 'new' } });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [dispatch]);

  // 点击外部关闭导出菜单
  useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExportMenu]);

  const allCards = useMemo(() => loadAllCards(), [state.cardsById, refreshTick]);
  const deletedCards = useMemo(() => loadDeletedCards(), [refreshTick, showRestore]);

  const filtered = useMemo(() => {
    let result = allCards;
    if (categoryFilter !== 'all') result = result.filter(c => c.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => getCardText(c).toLowerCase().includes(q));
    }
    return result;
  }, [allCards, search, categoryFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const card of allCards) counts[card.category] = (counts[card.category] || 0) + 1;
    return counts;
  }, [allCards]);

  const handleDelete = (card: FlashCard) => {
    if (state.cardsById[card.id]) dispatch({ type: 'DELETE_CARD', payload: card.id });
    else softDeleteCard(card);
    setConfirmDelete(null);
    setRefreshTick((tick) => tick + 1);
  };

  const handleRestoreCard = (cardId: string) => {
    const restored = restoreDeletedCard(cardId);
    if (restored) setImportMsg('卡片已恢复');
    setRefreshTick((tick) => tick + 1);
  };

  // ---- 导出 ----
  const getExportCards = (scope: 'all' | 'filtered'): ExportCard[] => {
    const source = scope === 'all' ? allCards : filtered;
    return source.map(toExportCard);
  };

  const getExportFilename = (scope: 'all' | 'filtered', format: 'csv' | 'json' | 'anki'): string => {
    const prefix = scope === 'all' ? '全部卡片' : getCategoryLabel(categoryFilter);
    const ext = format === 'anki' ? '_anki.csv' : format === 'csv' ? '.csv' : '.json';
    return `${prefix}${ext}`;
  };

  const handleExportCSV = (scope: 'all' | 'filtered') => {
    const cards = getExportCards(scope);
    const header = buildCSVHeader(cards);
    const codeLangs = collectCodeLanguages(cards);
    downloadFile([header, ...cards.map(c => exportCardToCSVRow(c, codeLangs))].join('\n'), getExportFilename(scope, 'csv'), 'text/csv;charset=utf-8');
    setShowExportMenu(false);
  };

  const handleExportJSON = (scope: 'all' | 'filtered') => {
    const cards = getExportCards(scope);
    downloadFile(JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), cards }, null, 2), getExportFilename(scope, 'json'), 'application/json');
    setShowExportMenu(false);
  };

  // Anki 兼容导出：Front/Back/Tags 双列 CSV
  const handleExportAnki = (scope: 'all' | 'filtered') => {
    const cards = getExportCards(scope);
    const rows: string[] = ['Front,Back,Tags'];
    for (const card of cards) {
      const front = escapeCsv(card.question || card.titleCn || card.title || '');
      const back = escapeCsv(card.answer || card.approach || card.description || '');
      const tags = (card.tags || []).map(t => t.replace(/\s/g, '_')).join(' ');
      rows.push(`${front},${back},${tags}`);
    }
    downloadFile(rows.join('\n'), getExportFilename(scope, 'anki'), 'text/csv;charset=utf-8');
    setShowExportMenu(false);
  };

  // ---- 导入 ----
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        if (file.name.endsWith('.csv')) importCSV(text);
        else if (file.name.endsWith('.md')) importMarkdown(text);
        else importJSON(text);
      } catch (err) { setImportMsg(`导入失败：${(err as Error).message}`); }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  function importJSON(text: string) {
    const raw = JSON.parse(text);
    let items: unknown[];
    if (raw.version === 2) items = raw.cards || [];
    else if (raw.version === 1) { setImportMsg('v1 格式仅含复习进度，请使用 JSON 导入卡片数据。'); return; }
    else if (Array.isArray(raw)) items = raw;
    else { setImportMsg('无法识别的 JSON 格式'); return; }

    const { valid, errors } = validateExportCards(items);
    if (errors.length > 0) {
      setImportMsg(`校验警告：${errors.slice(0, 3).join('；')}${errors.length > 3 ? `等 ${errors.length} 项` : ''}\n有效卡片 ${valid.length} 张`);
    }
    if (valid.length === 0) return;
    importCards(valid);
  }

  function importCSV(text: string) {
    const lines = text.split('\n').filter(Boolean);
    if (lines.length < 2) { setImportMsg('CSV 文件为空或只有表头'); return; }
    const header = parseCSVLine(lines[0]);
    const colMap: Record<string, number> = {};
    header.forEach((h, i) => { colMap[h.trim().toLowerCase()] = i; });
    const items: ExportCard[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length === 0) continue;
      const get = (name: string) => { const idx = colMap[name.toLowerCase()]; return idx !== undefined && idx < cols.length ? cols[idx].trim() : ''; };
      const category = get('category') || 'statistics';
      const tags = get('tags') ? get('tags').split(';').map((t: string) => t.trim()).filter(Boolean) : [];
      const codes: Record<string, string> = {};
      for (const lang of CODE_LANG_KEYS) { const val = get(`code_${lang}`); if (val) codes[lang] = val; }
      const card: ExportCard = {
        id: get('id') || generateId(), category, tags, difficulty: get('difficulty') || 'medium',
        sm2: createDefaultSM2(), favorited: false,
        number: get('number') ? Number(get('number')) : undefined,
        title: get('title') || undefined, titleCn: get('titlecn') || undefined,
        description: get('description') || undefined, approach: get('approach') || undefined,
        question: get('question') || undefined, answer: get('answer') || undefined,
        subTopic: get('subtopic') || undefined, source: get('source') || undefined,
        userNotes: get('usernotes') || undefined,
        codes: Object.keys(codes).length > 0 ? codes : undefined,
      };
      if (card.question || card.title) items.push(card);
    }
    importCards(items);
  }

  function importMarkdown(text: string) {
    const cards = parseMarkdownCards(text);
    if (cards.length === 0) { setImportMsg('未找到有效的卡片数据，请检查 Markdown 格式。'); return; }
    setImportMsg(`从 Markdown 解析到 ${cards.length} 张卡片`);
    importCards(cards);
  }

  function importCards(items: ExportCard[]) {
    let added = 0, updated = 0;
    for (const ec of items) {
      if (!ec.id) continue;
      const targetCategory = ec.category as Category;
      const existing = state.cardsById[ec.id];
      if (targetCategory === 'leetcode') {
        const card: FlashCard = {
          id: ec.id, category: 'leetcode' as const, number: ec.number || 0,
          title: ec.title || ec.question || '', titleCn: ec.titleCn || ec.title || ec.question || '',
          difficulty: (ec.difficulty as 'easy' | 'medium' | 'hard') || 'medium', tags: ec.tags || [],
          description: ec.description || ec.answer || '', approach: ec.approach || ec.answer || '',
          codes: ec.codes, sm2: existing ? existing.sm2 : ec.sm2,
          favorited: existing ? existing.favorited : ec.favorited,
          userNotes: ec.userNotes || (existing?.userNotes as string | undefined),
        };
        dispatch({ type: existing ? 'UPDATE_CARD' : 'ADD_CARD', payload: card });
      } else {
        const card: QACard = {
          id: ec.id, category: targetCategory as QACard['category'],
          question: ec.question || ec.titleCn || ec.title || '',
          answer: ec.answer || ec.approach || ec.description || '',
          tags: ec.tags, subTopic: ec.subTopic, difficulty: (ec.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
          source: ec.source, sm2: existing ? existing.sm2 : ec.sm2,
          favorited: existing ? existing.favorited : ec.favorited,
          userNotes: ec.userNotes || (existing?.userNotes as string | undefined),
        };
        dispatch({ type: existing ? 'UPDATE_CARD' : 'ADD_CARD', payload: card });
      }
      if (existing) updated++; else added++;
    }
    setImportMsg(`导入完成：新增 ${added} 张，更新 ${updated} 张`);
  }

  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center gap-3">
        <BackButton onClick={onBack} />
        <Database className="w-5 h-5" style={{ color: ACCENT }} />
        <h1 className="nav-title">卡片数据库</h1>
      </div>

      <div className="flex-1 flex items-start justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-4 pb-24 space-y-3">

          {/* 统计卡片 */}
          <div className="flex gap-2">
            <StatMini label="总卡片" value={allCards.length} color={ACCENT} />
            <StatMini label="模块数" value={Object.keys(categoryCounts).length} color={GREEN} />
            <StatMini label="当前" value={filtered.length} color="#F59E0B" />
          </div>

          {/* 搜索栏 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: TEXT_MUTED }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索所有卡片..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-[13px] bg-transparent" style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }} />
          </div>

          {/* 导出/导入按钮栏 */}
          <div className="rounded-2xl p-4 border space-y-3" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
            <h3 className="text-[13px] font-bold" style={{ color: TEXT_PRIMARY }}>数据管理</h3>
            <div className="flex gap-2">
              {/* 导出按钮 + 下拉 */}
              <div className="relative flex-1" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="w-full py-2.5 rounded-xl text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                  style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
                >
                  <Download className="w-4 h-4" />导出
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>
                {showExportMenu && (
                  <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border py-2 z-20 shadow-lg space-y-0.5" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                    {/* 全部卡片 */}
                    <div className="px-3 py-1">
                      <p className="text-[10px] font-bold mb-1.5 uppercase tracking-wider" style={{ color: TEXT_MUTED }}>全部卡片</p>
                      <div className="space-y-0.5">
                        <MenuItem icon={<FileSpreadsheet className="w-3.5 h-3.5" />} label="CSV 格式" onClick={() => handleExportCSV('all')} color={ACCENT} />
                        <MenuItem icon={<FileJson className="w-3.5 h-3.5" />} label="JSON 格式" onClick={() => handleExportJSON('all')} color={ACCENT} />
                        <MenuItem icon={<BrainCircuit className="w-3.5 h-3.5" />} label="Anki CSV" onClick={() => handleExportAnki('all')} color="#F59E0B" />
                      </div>
                    </div>
                    {/* 分隔线 + 当前模块 */}
                    <div className="h-px mx-3 my-1" style={{ backgroundColor: CARD_BORDER }} />
                    <div className="px-3 py-1">
                      <p className="text-[10px] font-bold mb-1.5 uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
                        当前模块 · {categoryFilter === 'all' ? '全部' : getCategoryLabel(categoryFilter)}
                      </p>
                      <div className="space-y-0.5">
                        <MenuItem icon={<FileSpreadsheet className="w-3.5 h-3.5" />} label="CSV 格式" onClick={() => handleExportCSV('filtered')} color={PURPLE} />
                        <MenuItem icon={<FileJson className="w-3.5 h-3.5" />} label="JSON 格式" onClick={() => handleExportJSON('filtered')} color={PURPLE} />
                        <MenuItem icon={<BrainCircuit className="w-3.5 h-3.5" />} label="Anki CSV" onClick={() => handleExportAnki('filtered')} color="#F59E0B" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* 导入按钮 */}
	              <button
	                onClick={() => fileRef.current?.click()}
	                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors"
	                style={{ backgroundColor: `${PURPLE}15`, color: PURPLE }}
	              >
	                <Upload className="w-4 h-4" />导入
	              </button>
	              <button
	                onClick={() => setShowRestore(true)}
	                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors"
	                style={{ backgroundColor: 'rgba(16,185,129,0.14)', color: GREEN }}
	              >
	                <RotateCcw className="w-4 h-4" />恢复
	              </button>
	              <input ref={fileRef} type="file" accept=".csv,.json,.md" onChange={handleImport} className="hidden" />
	            </div>
            {/* 导入说明 */}
            <p className="text-[10px] leading-relaxed" style={{ color: TEXT_MUTED }}>
              支持 CSV / JSON 格式。导入时自动识别卡片所属模块，已有卡片更新进度，新卡片新增进库。
            </p>
          </div>

          {importMsg && (
            <div className="rounded-xl p-3 border flex items-start gap-2 text-[12px]" style={{ borderColor: `${GREEN}40`, backgroundColor: `${GREEN}15`, color: GREEN }}>
              <FileInput className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{importMsg}</span>
              <button onClick={() => setImportMsg(null)} className="ml-auto shrink-0 text-[10px] underline">关闭</button>
            </div>
          )}

          {/* 分类筛选 */}
          <div className="flex gap-1.5 flex-wrap">
            <FilterBtn label={`全部 (${allCards.length})`} active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')} />
            {CATEGORIES.map(cat => (
              <FilterBtn key={cat.key} label={`${cat.label} (${categoryCounts[cat.key] || 0})`} active={categoryFilter === cat.key} onClick={() => setCategoryFilter(cat.key)} />
            ))}
	            {loadCustomDecks().map(deck => (
	              <FilterBtn key={deck.id} label={`${deck.name} (${categoryCounts[deck.id] || 0})`} active={categoryFilter === deck.id} onClick={() => setCategoryFilter(deck.id)} />
	            ))}
	            {(categoryCounts[UNASSIGNED_DECK_ID] || 0) > 0 && (
	              <FilterBtn label={`${UNASSIGNED_DECK_NAME} (${categoryCounts[UNASSIGNED_DECK_ID] || 0})`} active={categoryFilter === UNASSIGNED_DECK_ID} onClick={() => setCategoryFilter(UNASSIGNED_DECK_ID)} />
	            )}
	          </div>

          {/* 卡片列表 */}
          {filtered.length === 0 ? (
            <div className="text-center py-12" style={{ color: TEXT_MUTED }}>
              <Database className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-[14px]">没有匹配的卡片</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map(card => (
                <div
                  key={card.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onStudyCard?.(card)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onStudyCard?.(card);
                    }
                  }}
                  className="rounded-xl p-3 border flex items-start gap-3 cursor-pointer transition-colors hover:border-blue-300"
                  style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium leading-snug line-clamp-2" style={{ color: TEXT_PRIMARY }}>{getCardDisplayLabel(card)}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: 'rgba(40,130,215,0.15)', color: ACCENT }}>
                        {getCategoryLabel(card.category)}
                      </span>
                      {card.category !== 'leetcode' && (card as QACard).difficulty && (
                        <span className="text-[10px]" style={{ color: TEXT_MUTED }}>
                          {(card as QACard).difficulty === 'easy' ? '简单' : (card as QACard).difficulty === 'medium' ? '中等' : '困难'}
                        </span>
                      )}
                      {(card.tags || []).slice(0, 2).map(tag => <span key={tag} className="text-[10px]" style={{ color: TEXT_MUTED }}>#{tag}</span>)}
                    </div>
                  </div>
	                  {confirmDelete === card.id ? (
	                    <button onClick={(event) => { event.stopPropagation(); handleDelete(card); }} className="shrink-0 px-2 py-1 rounded-lg text-[11px] font-bold text-white" style={{ backgroundColor: '#EF4444' }}>确认删除</button>
	                  ) : (
                    <button onClick={(event) => { event.stopPropagation(); setConfirmDelete(card.id); }} className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
	          {showRestore && (
	            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
	              <div className="w-full max-w-sm rounded-2xl border p-4 shadow-xl" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
	                <div className="flex items-center justify-between mb-3">
	                  <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>恢复已删除卡片</h3>
	                  <button onClick={() => setShowRestore(false)} className="text-[12px]" style={{ color: TEXT_MUTED }}>关闭</button>
	                </div>
	                {deletedCards.length === 0 ? (
	                  <p className="py-8 text-center text-[13px]" style={{ color: TEXT_MUTED }}>暂无可恢复卡片</p>
	                ) : (
	                  <div className="max-h-[60vh] overflow-y-auto space-y-2">
	                    {deletedCards.map((item) => (
	                      <div
                          key={item.card.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => onStudyCard?.(item.card)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              onStudyCard?.(item.card);
                            }
                          }}
                          className="rounded-xl border p-3 cursor-pointer"
                          style={{ borderColor: CARD_BORDER, backgroundColor: 'rgba(255,255,255,0.03)' }}
                        >
	                        <p className="line-clamp-2 text-[13px] font-medium" style={{ color: TEXT_PRIMARY }}>{getCardDisplayLabel(item.card)}</p>
	                        <p className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>原牌组：{getCategoryLabel(item.originCategory)}</p>
	                        <button onClick={(event) => { event.stopPropagation(); handleRestoreCard(item.card.id); }} className="mt-2 w-full rounded-lg py-2 text-[12px] font-bold" style={{ backgroundColor: 'rgba(16,185,129,0.14)', color: GREEN }}>
	                          恢复
	                        </button>
	                      </div>
	                    ))}
	                  </div>
	                )}
	              </div>
	            </div>
	          )}
	        </div>
	      </div>
	    </div>
	  );
}

function StatMini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1 rounded-xl p-3 border text-center" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
      <div className="text-[22px] font-bold" style={{ color }}>{value}</div>
      <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{label}</div>
    </div>
  );
}

function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors border"
      style={{ backgroundColor: active ? ACCENT : CARD_BG, color: active ? '#fff' : TEXT_MUTED, borderColor: active ? ACCENT : CARD_BORDER }}>
      {label}
    </button>
  );
}

function MenuItem({ icon, label, onClick, color }: { icon: React.ReactNode; label: string; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors"
      style={{ color: TEXT_PRIMARY }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = `${color}12`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
    >
      <span style={{ color }}>{icon}</span>
      {label}
    </button>
  );
}
