// ============================================================
// src/components/SubModulePicker.tsx — 子模块选择页面
// ============================================================

import { useMemo, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SUB_MODULES, CATEGORIES, type SubModuleMeta } from '../constants';
import ModulePageTemplate, { type ModuleTopicCardModel } from './ModulePageTemplate';
import CardBrowser from './CardBrowser';
import CardEditor from './CardEditor';
import StatsDashboard from './StatsDashboard';
import type { FlashCard, QACard } from '../types';
import { getDeckCards } from '../api/cards';
import type { CardDTO } from '../api/types';

interface Props {
  onBack: () => void;
}

type SubModuleWithStats = SubModuleMeta & {
  newCount: number;
  dueCount: number;
  total: number;
};

type ModuleTone = { bg: string; fg: string; bar: string; label: string; glow: string; };

const REVIEW_STATES = new Set(['learning', 'review', 'relearning']);

const COLOR_TONES: Record<string, Omit<ModuleTone, 'label'>> = {
  'bg-blue-500': { bg: 'from-[#2F86FF] to-[#1267EE]', fg: '#2378f4', bar: '#2378f4', glow: 'rgba(35,120,244,0.28)' },
  'bg-green-500': { bg: 'from-[#20D452] to-[#0EB442]', fg: '#14b83f', bar: '#14b83f', glow: 'rgba(20,184,63,0.26)' },
  'bg-amber-500': { bg: 'from-[#FFB11A] to-[#FB8C00]', fg: '#fb8c00', bar: '#fb8c00', glow: 'rgba(251,140,0,0.26)' },
  'bg-red-500': { bg: 'from-[#FF4655] to-[#F51F38]', fg: '#f5263d', bar: '#f5263d', glow: 'rgba(245,38,61,0.25)' },
  'bg-purple-500': { bg: 'from-[#C64DFF] to-[#9D2EEB]', fg: '#a438f1', bar: '#a438f1', glow: 'rgba(164,56,241,0.24)' },
  'bg-teal-500': { bg: 'from-[#15CDB8] to-[#08A891]', fg: '#08a891', bar: '#08a891', glow: 'rgba(8,168,145,0.24)' },
  'bg-pink-500': { bg: 'from-[#FF5DA8] to-[#EB2F79]', fg: '#eb2f79', bar: '#eb2f79', glow: 'rgba(235,47,121,0.22)' },
  'bg-orange-500': { bg: 'from-[#FF9C2F] to-[#F97316]', fg: '#f97316', bar: '#f97316', glow: 'rgba(249,115,22,0.23)' },
  'bg-cyan-500': { bg: 'from-[#22D3EE] to-[#0891B2]', fg: '#0891b2', bar: '#0891b2', glow: 'rgba(8,145,178,0.22)' },
  'bg-indigo-500': { bg: 'from-[#718BFF] to-[#4F46E5]', fg: '#4f46e5', bar: '#4f46e5', glow: 'rgba(79,70,229,0.22)' },
  'bg-rose-500': { bg: 'from-[#FB7185] to-[#E11D48]', fg: '#e11d48', bar: '#e11d48', glow: 'rgba(225,29,72,0.22)' },
  'bg-sky-500': { bg: 'from-[#38BDF8] to-[#0284C7]', fg: '#0284c7', bar: '#0284c7', glow: 'rgba(2,132,199,0.22)' },
  'bg-emerald-500': { bg: 'from-[#34D399] to-[#059669]', fg: '#059669', bar: '#059669', glow: 'rgba(5,150,105,0.22)' },
  'bg-violet-500': { bg: 'from-[#A78BFA] to-[#7C3AED]', fg: '#7c3aed', bar: '#7c3aed', glow: 'rgba(124,58,237,0.22)' },
  'bg-yellow-500': { bg: 'from-[#FACC15] to-[#EAB308]', fg: '#eab308', bar: '#eab308', glow: 'rgba(234,179,8,0.22)' },
  'bg-lime-500': { bg: 'from-[#A3E635] to-[#65A30D]', fg: '#65a30d', bar: '#65a30d', glow: 'rgba(101,163,13,0.22)' },
  'bg-gray-600': { bg: 'from-[#64748B] to-[#475569]', fg: '#475569', bar: '#475569', glow: 'rgba(71,85,105,0.18)' },
  'bg-gray-400': { bg: 'from-[#94A3B8] to-[#64748B]', fg: '#64748b', bar: '#64748b', glow: 'rgba(100,116,139,0.18)' },
};

const COLOR_OPTIONS = Object.keys(COLOR_TONES);

function getTopicModel(sm: SubModuleWithStats): ModuleTopicCardModel {
  const completed = Math.max(0, sm.total - sm.newCount);
  const progress = sm.total > 0 ? Math.round((completed / sm.total) * 100) : 0;
  return { key: sm.key, title: sm.label, newCount: sm.newCount, dueCount: sm.dueCount, total: sm.total, completed, progress, isCustom: sm.key.startsWith('custom-') };
}

function loadCustomTopics(category: string): SubModuleMeta[] {
  try { const raw = localStorage.getItem(`fc-custom-topics-${category}`); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveCustomTopics(category: string, topics: SubModuleMeta[]) {
  localStorage.setItem(`fc-custom-topics-${category}`, JSON.stringify(topics));
}
function loadDeletedTopics(category: string): string[] {
  try { const raw = localStorage.getItem(`fc-deleted-topics-${category}`); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveDeletedTopic(category: string, key: string) {
  const deleted = loadDeletedTopics(category);
  if (!deleted.includes(key)) { deleted.push(key); }
  localStorage.setItem(`fc-deleted-topics-${category}`, JSON.stringify(deleted));
}

function getSubModuleTopics(sm: Pick<SubModuleMeta, 'subTopic' | 'subTopics'>): string[] {
  return Array.from(new Set([sm.subTopic, ...(sm.subTopics ?? [])].filter(Boolean) as string[]));
}

function qaCardMatchesSubModule(card: FlashCard, sm: Pick<SubModuleMeta, 'subTopic' | 'subTopics'>): boolean {
  if (!('subTopic' in card)) return false;
  return !!card.subTopic && getSubModuleTopics(sm).includes(card.subTopic);
}

function cardMatchesSubModuleTags(card: FlashCard, sm: Pick<SubModuleMeta, 'subTopic' | 'subTopics' | 'tags'>): boolean {
  if (!sm.tags?.length) return false;
  const tagMatched = (card.tags ?? []).some((t) => sm.tags!.includes(t));
  if (!tagMatched) return false;
  if (card.category === 'leetcode') return true;
  const topics = getSubModuleTopics(sm);
  if (topics.length === 0) return true;
  return 'subTopic' in card && !!card.subTopic && topics.includes(card.subTopic);
}

export default function SubModulePicker({ onBack }: Props) {
  const { state, dispatch, dueCountByCategory } = useAppContext();
  const { category } = state;

  const catMeta = CATEGORIES.find((c) => c.key === category);
  const builtInSubs = useMemo(() => {
    const deleted = loadDeletedTopics(category);
    return (SUB_MODULES[category] || []).filter((s) => !deleted.includes(s.key));
  }, [category]);
  const [customTopics, setCustomTopics] = useState<SubModuleMeta[]>(() => loadCustomTopics(category));
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('bg-blue-500');
  const [deleteTarget, setDeleteTarget] = useState<{ key: string; label: string } | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashCard | null>(null);

  // Load cards from API when entering a sub-module
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const deckId = category === 'leetcode' ? 'leetcode' :
        category === 'statistics' ? 'statistics' :
        category === 'machine-learning' ? 'machine-learning' :
        category === 'deep-learning' ? 'deep-learning' :
        category === 'jargon' ? 'jargon' :
        category === 'workplace' ? 'workplace' :
        category === 'vibe-coding' ? 'vibe-coding' :
        category === 'llm' ? 'llm' :
        category === 'agent' ? 'agent' : category;
      try {
        const resp = await getDeckCards(deckId, 500);
        if (cancelled || !resp?.cards?.length) return;
        const cards: FlashCard[] = resp.cards.map((dto: CardDTO) => ({
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
        } satisfies QACard));
        dispatch({ type: 'LOADED_QUEUE', payload: { cards, mode: 'new' } });
      } catch (e) {
        console.warn('[SubModulePicker] load cards failed:', e);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [category, dispatch]);

  const subModules = useMemo(() => [...builtInSubs, ...customTopics], [builtInSubs, customTopics]);

  const subStats = useMemo<SubModuleWithStats[]>(() => {
    const cards = Object.values(state.cardsById);
    return subModules.map((sm) => {
      let mine: FlashCard[];
      if (sm.tags && sm.tags.length > 0) {
        mine = cards.filter((c) => cardMatchesSubModuleTags(c, sm));
      } else if (sm.subTopic) {
        mine = cards.filter((c) => qaCardMatchesSubModule(c, sm));
      } else {
        const knownSubTopics = new Set(subModules.flatMap((s) => getSubModuleTopics(s)));
        const knownTags = new Set(subModules.filter((s) => s.tags).flatMap((s) => s.tags!));
        mine = cards.filter((c) => {
          if (c.category === 'leetcode') { if (knownTags.size === 0) return false; return !c.tags.some((t) => knownTags.has(t)); }
          const st = 'subTopic' in c ? c.subTopic : undefined;
          return !st || !knownSubTopics.has(st);
        });
      }
      return { ...sm, newCount: mine.filter((c) => !c.sm2.state || c.sm2.state === 'new').length, dueCount: mine.filter((c) => REVIEW_STATES.has(c.sm2.state) && c.sm2.nextReview <= Date.now()).length, total: mine.length };
    });
  }, [state.cardsById, subModules]);

  const topics = useMemo(() => subStats.map(getTopicModel), [subStats]);

  const handleStudyNew = (topic: ModuleTopicCardModel) => {
    if (topic.total === 0) {
      setShowBrowser(true);
      return;
    }
    // For custom topics, use the subTopic value; for built-in, use the key
    const sm = subModules.find((s) => s.key === topic.key);
    const filterValue = sm?.key.startsWith('custom-') ? (sm.subTopic || sm.key) : sm?.key || topic.key;
    dispatch({ type: 'SET_FILTER_SUBTOPIC', payload: filterValue });
    dispatch({ type: 'SET_STUDY_MODE', payload: 'new' });
  };

  const handleDeleteTopic = () => {
    if (!deleteTarget) return;
    if (deleteTarget.key.startsWith('custom-')) {
      const updated = customTopics.filter((t) => t.key !== deleteTarget.key);
      setCustomTopics(updated);
      saveCustomTopics(category, updated);
    } else {
      saveDeletedTopic(category, deleteTarget.key);
    }
    setDeleteTarget(null);
    setDeleteMode(false);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const newTopic: SubModuleMeta = {
      key: `custom-${Date.now()}`,
      label: newName.trim(),
      category,
      subTopic: newName.trim(),
      color: newColor,
    };
    const updated = [...customTopics, newTopic];
    setCustomTopics(updated);
    saveCustomTopics(category, updated);
    setShowCreate(false);
    setNewName('');
    setNewColor('bg-blue-500');
    setShowBrowser(true);
  };

  const handleReviewAll = () => dispatch({ type: 'SET_STUDY_MODE', payload: 'review' });
  const handleNewAll = () => dispatch({ type: 'SET_STUDY_MODE', payload: 'new' });
  const moduleDue = dueCountByCategory[category] ?? 0;
  const totalNewCards = Object.values(state.cardsById).filter(c => !c.sm2.state || c.sm2.state === 'new').length;
  const totalCards = Object.keys(state.cardsById).length;

  return (
    <>
      <ModulePageTemplate
        categoryLabel={catMeta?.label || category}
        moduleDue={moduleDue}
        totalNewCards={totalNewCards}
        totalCards={totalCards}
        topics={topics}
        onBack={onBack}
        onStartReview={handleReviewAll}
        onStartNewCards={handleNewAll}
        onTopicClick={handleStudyNew}
        onOpenCardManager={() => setShowBrowser(true)}
        onCreateTopic={() => setShowCreate(true)}
        onDeleteTopic={(topic) => { setDeleteTarget({ key: topic.key, label: topic.title }); }}
        onEnterDeleteMode={() => setDeleteMode(true)}
        deleteMode={deleteMode}
      />
      <StatsDashboard category={category} />
      {showBrowser && <CardBrowser onEdit={(card) => { if (!card.id) setEditingCard(null); else setEditingCard(card); }} onClose={() => setShowBrowser(false)} />}
      {editingCard !== null && <CardEditor card={editingCard} onSave={() => { setEditingCard(null); dispatch({ type: 'SET_CATEGORY', payload: state.category }); }} onClose={() => setEditingCard(null)} />}

      {/* Create topic dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold dark:text-gray-100">新增专题</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">专题名称</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="例如：强化学习"
                  className="w-full mt-0.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()} autoFocus />
              </div>
              <div>
                <label className="text-xs text-gray-500">颜色</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {COLOR_OPTIONS.map((c) => (
                    <button key={c} onClick={() => setNewColor(c)}
                      className={`w-8 h-8 rounded-lg ${c} transition-all ${newColor === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'opacity-60 hover:opacity-100'}`} />
                  ))}
                </div>
              </div>
              <button onClick={handleCreate} disabled={!newName.trim()}
                className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-medium disabled:opacity-30 hover:bg-blue-600 transition-colors">
                创建并添加卡片
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 w-full max-w-sm">
            <h3 className="text-lg font-bold dark:text-gray-100 mb-2">确认删除</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              确定要删除「{deleteTarget.label}」专题吗？专题下的卡片不会被删除，将回到未分配状态。
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                取消
              </button>
              <button onClick={handleDeleteTopic}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors">
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
