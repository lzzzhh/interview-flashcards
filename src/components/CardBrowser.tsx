// ============================================================
// src/components/CardBrowser.tsx — 卡片列表浏览器
// ============================================================

import { useState, useMemo } from 'react';
import { Search, Trash2, Edit3, X, Plus, Download, ChevronDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SUB_MODULES, CATEGORIES } from '../constants';
import type { FlashCard, QACard } from '../types';

interface Props {
  onEdit: (card: FlashCard) => void;
  onClose: () => void;
}

const CSV_HEADER = 'id,type,question,answer,tags,subTopic,difficulty';

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

  const subTopic = (card as any).subTopic;
  if (subTopic) {
    const sm = subs.find((s) => s.subTopic === subTopic);
    if (sm) return `${moduleName} · ${sm.label}`;
    return `${moduleName} · ${subTopic}`;
  }
  return `${moduleName} · 未分配`;
}

export default function CardBrowser({ onEdit, onClose }: Props) {
  const { state, dispatch } = useAppContext();
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const allCards = useMemo(() => Object.values(state.cardsById), [state.cardsById]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allCards;
    const q = search.toLowerCase();
    return allCards.filter((c) => {
      if (c.category === 'leetcode') {
        return c.title.toLowerCase().includes(q) || c.titleCn.includes(q) || String(c.number).includes(q);
      }
      return c.question.includes(q) || c.answer.includes(q);
    });
  }, [allCards, search]);

  const moduleName = CATEGORIES.find((c) => c.key === state.category)?.label || state.category;

  const handleExportCSV = () => {
    const headers = CSV_HEADER;
    const rows = filtered.map((c) => {
      const q = c.category === 'leetcode' ? c.titleCn : c.question;
      const a = c.category === 'leetcode' ? c.approach : c.answer;
      const tags = (c.tags || []).join(';');
      const sub = (c as any).subTopic || '';
      const diff = c.category === 'leetcode' ? c.difficulty : ((c as any).difficulty || '');
      return [c.id, c.category, q, a, tags, sub, diff]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',');
    });
    const csv = [headers, ...rows].join('\n');
    downloadFile(csv, `${moduleName}.csv`, 'text/csv;charset=utf-8');
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    const data = filtered.map((c) => ({
      id: c.id, type: c.category,
      question: c.category === 'leetcode' ? c.titleCn : c.question,
      answer: c.category === 'leetcode' ? c.approach : c.answer,
      tags: c.tags || [],
      subTopic: (c as any).subTopic,
      difficulty: c.category === 'leetcode' ? c.difficulty : ((c as any).difficulty),
    }));
    downloadFile(JSON.stringify(data, null, 2), `${moduleName}.json`, 'application/json');
    setShowExportMenu(false);
  };

  function downloadFile(content: string, filename: string, mime: string) {
    const blob = new Blob(['\uFEFF' + content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_CARD', payload: id });
    setConfirmDelete(null);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const isCSV = file.name.endsWith('.csv');
      if (isCSV) importCSV(text);
      else { try { importJSON(text); } catch { /* ignore */ } }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  function importJSON(text: string) {
    const data = JSON.parse(text);
    const items = Array.isArray(data) ? data : [data];
    for (const item of items) {
      if (!item.question && !item.answer) continue;
      const card: QACard = {
        id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        category: state.category as QACard['category'],
        question: item.question || '',
        answer: item.answer || '',
        tags: item.tags || [],
        subTopic: item.subTopic || undefined,
        difficulty: item.difficulty || 'medium',
        sm2: { state: 'new', easeFactor: 2.5, interval: 0, repetitions: 0, lapses: 0, nextReview: Date.now() },
        favorited: false,
      };
      dispatch({ type: 'ADD_CARD', payload: card });
    }
  }

  function importCSV(text: string) {
    const lines = text.split('\n').filter(Boolean);
    if (lines.length < 2) return;
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length < 6) continue;
      const [id, type, question, answer, tagsStr, subTopic, difficulty] = cols;
      const card: QACard = {
        id: id || `import-${Date.now()}-${i}`,
        category: (type || state.category) as QACard['category'],
        question: question || '',
        answer: answer || '',
        tags: (tagsStr || '').split(';').map((t: string) => t.trim()).filter(Boolean),
        subTopic: subTopic || undefined,
        difficulty: (difficulty || 'medium') as any,
        sm2: { state: 'new', easeFactor: 2.5, interval: 0, repetitions: 0, lapses: 0, nextReview: Date.now() },
        favorited: false,
      };
      dispatch({ type: 'ADD_CARD', payload: card });
    }
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
        <h2 className="text-lg font-bold flex-1 dark:text-gray-100">卡片管理</h2>
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
              <button onClick={handleExportCSV} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">导出 CSV</button>
              <button onClick={handleExportJSON} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">导出 JSON</button>
            </div>
          )}
        </div>
        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-sm cursor-pointer hover:bg-blue-600 transition-colors">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">上传</span>
          <input type="file" accept=".csv,.json" onChange={handleImport} className="hidden" />
        </label>
        <button
          onClick={() => onEdit({} as FlashCard)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">新建</span>
        </button>
      </div>

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
        <p className="text-xs text-gray-400 mt-1">{filtered.length} 张卡片</p>
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
