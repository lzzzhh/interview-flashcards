// ============================================================
// src/components/CardBrowser.tsx — 卡片列表浏览器（含统一导入导出）
// ============================================================

import { useState, useMemo } from 'react';
import { Search, Trash2, Edit3, X, Download, ChevronDown, Upload } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SUB_MODULES, CATEGORIES } from '../constants';
import { createDefaultSM2 } from '../utils/sm2';
import { appendReviewLog } from '../utils/reviewLogs';
import type { Category, FlashCard, QACard, LeetCodeCard, ExportCard, ExportData, SM2Record } from '../types';

interface Props {
  onEdit: (card: FlashCard) => void;
  onClose: () => void;
}

const CODE_LANG_KEYS = ['python', 'java', 'cpp', 'javascript', 'go', 'typescript', 'rust'] as const;

/** Find which module + sub-module a card belongs to */
function getCardAssignment(card: FlashCard): string {
  const catMeta = CATEGORIES.find((c) => c.key === card.category);
  const moduleName = catMeta?.label || card.category;
  const subs = SUB_MODULES[card.category];
  if (!subs || subs.length === 0) return moduleName;

  if (card.category === 'leetcode') {
    const tags = card.tags || [];
    for (const sm of subs) {
      if (sm.tags && sm.tags.some((t) => tags.includes(t))) {
        return `${moduleName} · ${sm.label}`;
      }
    }
    return moduleName;
  }

  const subTopic = 'subTopic' in card ? card.subTopic : undefined;
  if (subTopic) {
    const sm = subs.find((s) => s.subTopic === subTopic);
    if (sm) return `${moduleName} · ${sm.label}`;
    return `${moduleName} · ${subTopic}`;
  }
  return `${moduleName} · 未分配`;
}

/** 将 FlashCard 转为 ExportCard */
function toExportCard(card: FlashCard): ExportCard {
  const base: ExportCard = {
    id: card.id,
    category: card.category,
    tags: card.tags || [],
    difficulty: card.category === 'leetcode'
      ? card.difficulty
      : (card as QACard).difficulty || '',
    sm2: card.sm2,
    favorited: card.favorited,
    userNotes: card.userNotes,
  };

  if (card.category === 'leetcode') {
    const lc = card as LeetCodeCard;
    return {
      ...base,
      number: lc.number,
      title: lc.title,
      titleCn: lc.titleCn,
      description: lc.description,
      approach: lc.approach,
      codes: lc.codes, // 导入的代码保留
    };
  }

  const qa = card as QACard;
  return {
    ...base,
    question: qa.question,
    answer: qa.answer,
    subTopic: qa.subTopic,
    source: qa.source,
  };
}

/** 从导出数据收集所有出现过的代码语言 */
function collectCodeLanguages(cards: ExportCard[]): string[] {
  const langs = new Set<string>();
  for (const c of cards) {
    if (c.codes) {
      for (const lang of Object.keys(c.codes)) langs.add(lang);
    }
  }
  return [...langs].sort();
}

/** 构建 CSV 表头 */
function buildCSVHeader(cards: ExportCard[]): string {
  const staticCols = [
    'id', 'category', 'number', 'title', 'titleCn', 'description',
    'approach', 'question', 'answer', 'tags', 'subTopic', 'difficulty',
    'source', 'userNotes',
  ];
  const codeLangs = collectCodeLanguages(cards);
  const codeCols = codeLangs.map((l) => `code_${l}`);
  return [...staticCols, ...codeCols].join(',');
}

/** 将 ExportCard 转成 CSV 行 */
function exportCardToCSVRow(card: ExportCard, codeLangs: string[]): string {
  const vals: Record<string, string> = {
    id: card.id,
    category: card.category,
    number: card.number?.toString() || '',
    title: card.title || '',
    titleCn: card.titleCn || '',
    description: card.description || '',
    approach: card.approach || '',
    question: card.question || '',
    answer: card.answer || '',
    tags: (card.tags || []).join(';'),
    subTopic: card.subTopic || '',
    difficulty: card.difficulty || '',
    source: card.source || '',
    userNotes: card.userNotes || '',
  };
  // 代码列
  for (const lang of codeLangs) {
    vals[`code_${lang}`] = card.codes?.[lang] || '';
  }
  // 按表头顺序输出
  const staticCols = [
    'id', 'category', 'number', 'title', 'titleCn', 'description',
    'approach', 'question', 'answer', 'tags', 'subTopic', 'difficulty',
    'source', 'userNotes',
  ];
  const ordered = [...staticCols, ...codeLangs.map((l) => `code_${l}`)];
  return ordered.map((k) => `"${(vals[k] || '').replace(/"/g, '""')}"`).join(',');
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob(['\uFEFF' + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function generateId(): string {
  return `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function CardBrowser({ onEdit, onClose }: Props) {
  const { state, dispatch } = useAppContext();
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const allCards = useMemo(() => Object.values(state.cardsById).filter((card) => card.category === state.category), [state.cardsById, state.category]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allCards;
    const q = search.toLowerCase();
    return allCards.filter((c) => {
      if (c.category === 'leetcode') {
        return c.title.toLowerCase().includes(q)
          || c.titleCn.includes(q)
          || String(c.number).includes(q);
      }
      return c.question.includes(q) || c.answer.includes(q);
    });
  }, [allCards, search]);

  const moduleName = CATEGORIES.find((c) => c.key === state.category)?.label || state.category;

  // ---- 导出 ----
  const handleExportCSV = () => {
    const exportCards = allCards.map(toExportCard);
    const header = buildCSVHeader(exportCards);
    const codeLangs = collectCodeLanguages(exportCards);
    const rows = exportCards.map((c) => exportCardToCSVRow(c, codeLangs));
    downloadFile([header, ...rows].join('\n'), `${moduleName}.csv`, 'text/csv;charset=utf-8');
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    const exportCards = allCards.map(toExportCard);
    const data: ExportData = {
      version: 2,
      exportedAt: new Date().toISOString(),
      cards: exportCards,
      reviewLogs: [],
      settings: { isDark: state.isDark, lastCategory: state.category },
    };
    downloadFile(JSON.stringify(data, null, 2), `${moduleName}.json`, 'application/json');
    setShowExportMenu(false);
  };

  // ---- 删除 ----
  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_CARD', payload: id });
    setConfirmDelete(null);
  };

  // ---- 导入 ----
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        if (file.name.endsWith('.csv')) {
          importCSV(text);
        } else {
          importJSON(text);
        }
      } catch (err) {
        setImportMsg(`导入失败：${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  function importJSON(text: string) {
    const raw = JSON.parse(text);
    let items: ExportCard[];

    if (raw.version === 2) {
      // ExportData v2
      items = raw.cards || [];
      // 也导入 reviewLogs 和 settings
      if (raw.reviewLogs) {
        for (const log of raw.reviewLogs) {
          appendReviewLog(log);
        }
      }
    } else if (raw.version === 1) {
      // 旧格式：progress only — 忽略
      setImportMsg('v1 格式仅含复习进度不含卡片内容，请在统计面板用「导入 JSON」功能。');
      return;
    } else if (Array.isArray(raw)) {
      // 简单数组格式（旧版导出）
      items = raw;
    } else {
      setImportMsg('无法识别的 JSON 格式');
      return;
    }

    importCards(items);
  }

  function importCSV(text: string) {
    const lines = text.split('\n').filter(Boolean);
    if (lines.length < 2) {
      setImportMsg('CSV 文件为空或只有表头');
      return;
    }

    // 解析表头，构建列名 → 索引映射
    const header = parseCSVLine(lines[0]);
    const colMap: Record<string, number> = {};
    header.forEach((h, i) => { colMap[h.trim().toLowerCase()] = i; });

    const items: ExportCard[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length === 0) continue;

      const get = (name: string) => {
        const idx = colMap[name.toLowerCase()];
        if (idx === undefined || idx >= cols.length) return '';
        return cols[idx].trim();
      };

      const category = state.category;
      const tags = get('tags') ? get('tags').split(';').map((t: string) => t.trim()).filter(Boolean) : [];
      const diff = (get('difficulty') || 'medium') as ExportCard['difficulty'];

      // 收集多语言代码
      const codes: Record<string, string> = {};
      for (const lang of CODE_LANG_KEYS) {
        const val = get(`code_${lang}`);
        if (val) codes[lang] = val;
      }

      const card: ExportCard = {
        id: get('id') || generateId(),
        category: category as ExportCard['category'],
        tags,
        difficulty: diff,
        sm2: createDefaultSM2() as SM2Record,
        favorited: false,
        number: get('number') ? Number(get('number')) : undefined,
        title: get('title') || undefined,
        titleCn: get('titlecn') || undefined,
        description: get('description') || undefined,
        approach: get('approach') || undefined,
        question: get('question') || undefined,
        answer: get('answer') || undefined,
        subTopic: get('subtopic') || undefined,
        source: get('source') || undefined,
        userNotes: get('usernotes') || undefined,
        codes: Object.keys(codes).length > 0 ? codes : undefined,
      };

      // 去空：至少要有 question 或 title
      if (card.question || card.title) {
        items.push(card);
      }
    }

    importCards(items);
  }

  function importCards(items: ExportCard[]) {
    let added = 0;
    let updated = 0;

    for (const ec of items) {
      if (!ec.id) continue;

      const existing = state.cardsById[ec.id];

      const targetCategory = state.category as Category;

      if (targetCategory === 'leetcode') {
        // LeetCode 卡片
        const card: FlashCard = {
          id: ec.id,
          category: 'leetcode' as const,
          number: ec.number || 0,
          title: ec.title || ec.question || '',
          titleCn: ec.titleCn || ec.title || ec.question || '',
          difficulty: (ec.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
          tags: ec.tags || [],
          description: ec.description || ec.answer || '',
          approach: ec.approach || ec.answer || '',
          codes: ec.codes,
          sm2: existing ? existing.sm2 : ec.sm2,
          favorited: existing ? existing.favorited : ec.favorited,
          userNotes: ec.userNotes || (existing?.userNotes as string | undefined),
        };
        dispatch({ type: existing ? 'UPDATE_CARD' : 'ADD_CARD', payload: card });
      } else {
        // QA 卡片
        const card: QACard = {
          id: ec.id,
          category: targetCategory as QACard['category'],
          question: ec.question || ec.titleCn || ec.title || '',
          answer: ec.answer || ec.approach || ec.description || '',
          tags: ec.tags,
          subTopic: ec.subTopic,
          difficulty: (ec.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
          source: ec.source,
          sm2: existing ? existing.sm2 : ec.sm2,
          favorited: existing ? existing.favorited : ec.favorited,
          userNotes: ec.userNotes || (existing?.userNotes as string | undefined),
        };
        dispatch({ type: existing ? 'UPDATE_CARD' : 'ADD_CARD', payload: card });
      }
      if (existing) updated++;
      else added++;
    }

    setImportMsg(`已导入到「${moduleName}」：新增 ${added} 张，更新 ${updated} 张`);
  }

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
      else { current += ch; }
    }
    result.push(current);
    return result;
  }

  return (
    <div className="fixed inset-0 z-40 bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <X className="w-5 h-5 dark:text-gray-300" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold dark:text-gray-100">卡片管理</h2>
          <p className="text-xs text-gray-400 truncate">当前模块：{moduleName}</p>
        </div>
        {/* Export dropdown */}
        <div className="relative">
          <button onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">导出</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[100px] z-10">
              <button onClick={handleExportCSV} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">导出当前模块 CSV</button>
              <button onClick={handleExportJSON} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">导出当前模块 JSON</button>
            </div>
          )}
        </div>
        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-sm cursor-pointer hover:bg-blue-600 transition-colors">
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">上传到当前模块</span>
          <input type="file" accept=".csv,.json" onChange={handleImport} className="hidden" />
        </label>
      </div>

      {/* Import message */}
      {importMsg && (
        <div className="px-3 py-2">
          <div className="text-xs p-2 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            {importMsg}
            <button onClick={() => setImportMsg(null)} className="ml-2 underline">关闭</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索卡片..."
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">当前模块 {allCards.length} 张，当前筛选 {filtered.length} 张</p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-20">
        {filtered.map((card) => {
          const assignment = getCardAssignment(card);
          return (
            <div key={card.id} className="flex items-start gap-2 py-2.5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate dark:text-gray-200">
                  {card.category === 'leetcode' ? `#${card.number} ${card.titleCn}` : card.question}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                  {(card.tags || []).slice(0, 3).join(' · ')}
                  {card.category === 'leetcode' && ` · ${card.difficulty}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 max-w-[120px] truncate">{assignment}</span>
                <button onClick={() => onEdit(card)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                  <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                </button>
                {confirmDelete === card.id ? (
                  <button onClick={() => handleDelete(card.id)} className="p-1.5 bg-red-500 text-white rounded text-xs font-bold">确认</button>
                ) : (
                  <button onClick={() => setConfirmDelete(card.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
