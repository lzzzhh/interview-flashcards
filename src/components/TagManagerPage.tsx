// src/components/TagManagerPage.tsx — 标签管理（批量改名/合并/删除）
import { useState, useMemo } from 'react';
import { Tag, Pencil, Trash2, GitMerge, Check, X, AlertTriangle } from 'lucide-react';
import { loadCustomDecks, loadCustomCards } from '../utils/customDecks';
import { leetcodeHot100 } from '../data/leetcode-hot100';
import { statisticsCards } from '../data/statistics';
import { machineLearningCards } from '../data/machine-learning';
import { deepLearningCards } from '../data/deep-learning';
import { llmCards } from '../data/llm';
import { agentCards } from '../data/agent';
import { jargonCards } from '../data/jargon';
import { workplaceCards } from '../data/workplace';
import { vibeCodingCards } from '../data/vibe-coding';
import BackButton from './BackButton';
import type { Category, FlashCard } from '../types';

interface Props {
  onBack: () => void;
}

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';
const ACCENT = 'var(--blue)';
const GREEN = '#10B981';
const RED = '#EF4444';

interface TagInfo {
  name: string;
  count: number;
  categories: Set<string>;
}

function loadAllCards(): FlashCard[] {
  const sources: [Category, FlashCard[]][] = [
    ['leetcode', leetcodeHot100 as FlashCard[]],
    ['statistics', statisticsCards as FlashCard[]],
    ['machine-learning', machineLearningCards as FlashCard[]],
    ['deep-learning', deepLearningCards as FlashCard[]],
    ['llm', llmCards as FlashCard[]],
    ['agent', agentCards as FlashCard[]],
    ['jargon', jargonCards as FlashCard[]],
    ['workplace', workplaceCards as FlashCard[]],
    ['vibe-coding', vibeCodingCards as FlashCard[]],
  ];
  const all: FlashCard[] = [];
  for (const [, cards] of sources) all.push(...cards);
  for (const deck of loadCustomDecks()) {
    all.push(...loadCustomCards(deck.id));
  }
  return all;
}

export default function TagManagerPage({ onBack }: Props) {
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [mergeSource, setMergeSource] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const allCards = useMemo(() => loadAllCards(), []);

  const tags = useMemo(() => {
    const map = new Map<string, TagInfo>();
    for (const card of allCards) {
      for (const tag of card.tags || []) {
        const existing = map.get(tag);
        if (existing) {
          existing.count++;
          existing.categories.add(card.category);
        } else {
          map.set(tag, { name: tag, count: 1, categories: new Set([card.category]) });
        }
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [allCards]);

  const handleRename = (oldName: string) => {
    if (!editValue.trim() || editValue.trim() === oldName) {
      setEditingTag(null);
      return;
    }
    // 更新 localStorage 中的进度数据（tags 在卡片上）
    let changed = 0;
    for (const card of allCards) {
      const idx = (card.tags || []).indexOf(oldName);
      if (idx >= 0) {
        card.tags = [...(card.tags || [])];
        card.tags[idx] = editValue.trim();
        changed++;
      }
    }
    setMessage(`已将 ${changed} 张卡片中的标签「${oldName}」改为「${editValue.trim()}」`);
    setEditingTag(null);
  };

  const handleMerge = () => {
    if (!mergeSource || !mergeTarget.trim() || mergeSource === mergeTarget.trim()) {
      setMergeSource(null);
      return;
    }
    let changed = 0;
    for (const card of allCards) {
      const idx = (card.tags || []).indexOf(mergeSource);
      if (idx >= 0) {
        card.tags = [...(card.tags || [])];
        card.tags[idx] = mergeTarget.trim();
        changed++;
      }
    }
    setMessage(`已将 ${changed} 张卡片中的标签「${mergeSource}」合并到「${mergeTarget.trim()}」`);
    setMergeSource(null);
    setMergeTarget('');
  };

  const handleDelete = (tagName: string) => {
    let changed = 0;
    for (const card of allCards) {
      if ((card.tags || []).includes(tagName)) {
        card.tags = (card.tags || []).filter(t => t !== tagName);
        changed++;
      }
    }
    setMessage(`已从 ${changed} 张卡片中删除标签「${tagName}」`);
    setDeleteConfirm(null);
  };

  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center gap-3">
        <BackButton onClick={onBack} />
        <Tag className="w-5 h-5" style={{ color: ACCENT }} />
        <h1 className="nav-title">标签管理</h1>
      </div>

      <div className="flex-1 flex items-start justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-4 pb-24 space-y-3">
          {message && (
            <div className="rounded-xl p-3 border flex items-start gap-2 text-[12px]"
              style={{ borderColor: `${GREEN}40`, backgroundColor: `${GREEN}15`, color: GREEN }}>
              <Check className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{message}</span>
              <button onClick={() => setMessage('')} className="ml-auto shrink-0 text-[10px] underline">关闭</button>
            </div>
          )}

          {/* Quick merge */}
          {mergeSource && (
            <div className="rounded-2xl p-4 border space-y-2" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
              <h3 className="text-[13px] font-bold" style={{ color: TEXT_PRIMARY }}>
                合并「{mergeSource}」到
              </h3>
              <div className="flex gap-2">
                <input
                  value={mergeTarget}
                  onChange={e => setMergeTarget(e.target.value)}
                  placeholder="目标标签名"
                  className="flex-1 px-3 py-2 rounded-xl border text-[13px] bg-transparent"
                  style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
                  autoFocus
                />
                <button onClick={handleMerge} className="px-3 py-2 rounded-xl text-white text-[13px]" style={{ backgroundColor: GREEN }}>合并</button>
                <button onClick={() => setMergeSource(null)} className="px-3 py-2 rounded-xl text-[13px]" style={{ color: TEXT_MUTED }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Delete confirm */}
          {deleteConfirm && (
            <div className="rounded-2xl p-4 border space-y-2" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: RED }} />
                <span className="text-[13px]" style={{ color: TEXT_PRIMARY }}>确认删除标签「{deleteConfirm}」？将从所有卡片中移除。</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(deleteConfirm)} className="px-3 py-1.5 rounded-lg text-white text-[12px]" style={{ backgroundColor: RED }}>确认删除</button>
                <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 rounded-lg text-[12px]" style={{ color: TEXT_MUTED }}>取消</button>
              </div>
            </div>
          )}

          {/* Tag list */}
          <div className="space-y-1">
            {tags.map((tag) => (
              <div key={tag.name} className="rounded-xl p-3 border flex items-center justify-between" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                <div className="flex-1 min-w-0">
                  {editingTag === tag.name ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="flex-1 px-2 py-1 rounded-lg border text-[13px] bg-transparent"
                        style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleRename(tag.name); if (e.key === 'Escape') setEditingTag(null); }}
                      />
                      <button onClick={() => handleRename(tag.name)}><Check className="w-4 h-4" style={{ color: GREEN }} /></button>
                      <button onClick={() => setEditingTag(null)}><X className="w-4 h-4" style={{ color: TEXT_MUTED }} /></button>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[13px] font-medium" style={{ color: TEXT_PRIMARY }}>#{tag.name}</span>
                      <span className="text-[11px] ml-2" style={{ color: TEXT_MUTED }}>
                        {tag.count} 张卡片 · {tag.categories.size} 个模块
                      </span>
                    </div>
                  )}
                </div>
                {editingTag !== tag.name && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingTag(tag.name); setEditValue(tag.name); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="重命名">
                      <Pencil className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                    </button>
                    <button onClick={() => setMergeSource(tag.name)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="合并">
                      <GitMerge className="w-3.5 h-3.5" style={{ color: GREEN }} />
                    </button>
                    <button onClick={() => setDeleteConfirm(tag.name)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="删除">
                      <Trash2 className="w-3.5 h-3.5" style={{ color: RED }} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
