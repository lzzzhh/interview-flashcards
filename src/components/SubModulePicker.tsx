// ============================================================
// src/components/SubModulePicker.tsx — 子模块选择页面
// ============================================================

import { useMemo } from 'react';
import { ArrowLeft, RotateCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SUB_MODULES, CATEGORIES } from '../constants';

interface Props {
  onBack: () => void;
}

export default function SubModulePicker({ onBack }: Props) {
  const { state, dispatch, dueCountByCategory } = useAppContext();
  const { category } = state;

  const catMeta = CATEGORIES.find((c) => c.key === category);
  const subModules = SUB_MODULES[category] || [];

  const subStats = useMemo(() => {
    const cards = Object.values(state.cardsById);
    return subModules.map((sm) => {
      let mine: any[];
      if (sm.tags && sm.tags.length > 0) {
        // LeetCode: match by overlapping tags
        mine = cards.filter((c) => {
          if (c.category !== 'leetcode') return false;
          const ct = (c as any).tags || [];
          return sm.tags!.some((t: string) => ct.includes(t));
        });
      } else if (sm.subTopic) {
        // QA cards: match by subTopic
        mine = cards.filter((c) => (c as any).subTopic === sm.subTopic);
      } else {
        // "其他专题": cards not matching any defined sub-module
        const knownSubTopics = new Set(subModules.filter((s) => s.subTopic).map((s) => s.subTopic));
        const knownTags = new Set(subModules.filter((s) => s.tags).flatMap((s) => s.tags!));
        mine = cards.filter((c) => {
          if (c.category === 'leetcode') {
            if (knownTags.size === 0) return false;
            const ct = (c as any).tags || [];
            return !ct.some((t: string) => knownTags.has(t));
          }
          const st = (c as any).subTopic;
          return !st || !knownSubTopics.has(st);
        });
      }
      const newCount = mine.filter((c) => !c.sm2.state || c.sm2.state === 'new').length;
      const dueCount = mine.filter((c) => {
        const s = c.sm2.state;
        return s && s !== 'new' && c.sm2.nextReview <= Date.now();
      }).length;
      return { ...sm, newCount, dueCount, total: mine.length };
    });
  }, [state.cardsById, subModules]);

  const handleStudyNew = (sm: any) => {
    dispatch({ type: 'SET_FILTER_SUBTOPIC', payload: sm.key });
    dispatch({ type: 'SET_STUDY_MODE', payload: 'new' });
  };

  const handleReviewAll = () => {
    dispatch({ type: 'SET_STUDY_MODE', payload: 'review' });
  };

  const moduleDue = dueCountByCategory[category] ?? 0;

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-xl mx-auto px-3 sm:px-4 py-3 space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm">
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {catMeta?.label || category}
          </h2>
        </div>

        <button
          onClick={handleReviewAll}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <RotateCw className="w-6 h-6 text-orange-500" />
            <div className="text-left">
              <p className="font-bold text-orange-700 dark:text-orange-300">复习全部</p>
              <p className="text-xs text-orange-500">{moduleDue} 张到期</p>
            </div>
          </div>
        </button>

        <div className="grid grid-cols-2 gap-3">
          {subStats.map((sm) => (
            <button
              key={sm.key}
              onClick={() => handleStudyNew(sm)}
              disabled={sm.newCount === 0}
              className="homepage-module-card-dashboard group disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${sm.color} bg-opacity-10 text-sm font-bold`} style={{ backgroundColor: sm.color === 'bg-gray-400' ? '#f1f5f9' : undefined }}>
                <span className={`w-8 h-8 rounded-full ${sm.color} flex items-center justify-center text-white text-xs font-bold`}>
                  {sm.label.charAt(0)}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{sm.label}</h3>
              <div className="my-3 h-px bg-gray-100 dark:bg-gray-700" />
              <div className="flex items-end justify-between">
                <div className="space-y-1 text-[10px]">
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-blue-500">{sm.newCount}</span>
                    <span>新卡</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-orange-500">{sm.dueCount}</span>
                    <span>待复习</span>
                  </div>
                </div>
                {sm.dueCount > 0 && (
                  <span className="rounded-full bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 text-[10px] font-medium text-orange-500 dark:text-orange-400">
                    待复习 {sm.dueCount}
                  </span>
                )}
              </div>
              <div className="mt-1.5 text-[10px] text-gray-400">{sm.total} 张</div>
            </button>
          ))}
          {subStats.length % 2 === 1 && <div aria-hidden="true" />}
        </div>
      </div>
    </div>
  );
}
