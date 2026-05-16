import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BarChart3, ChevronRight, FileText, Plus, Settings, Trash2, X } from 'lucide-react';

export interface ModuleTone {
  bg: string;
  fg: string;
  bar: string;
  label: string;
  glow: string;
}

export interface ModuleTopicCardModel {
  key: string;
  title: string;
  tone: ModuleTone;
  newCount: number;
  dueCount: number;
  total: number;
  completed: number;
  progress: number;
  isCustom?: boolean;
}

interface ModulePageTemplateProps {
  categoryLabel: string;
  moduleDue: number;
  totalNewCards: number;
  totalCards: number;
  topics: ModuleTopicCardModel[];
  onBack: () => void;
  onStartReview: () => void;
  onShowStats: () => void;
  onOpenCardManager: () => void;
  onCreateTopic: () => void;
  onEnterDeleteMode: () => void;
  onTopicClick: (topic: ModuleTopicCardModel) => void;
  onDeleteTopic?: (topic: ModuleTopicCardModel) => void;
  deleteMode?: boolean;
  onExitDeleteMode?: () => void;
}

export default function ModulePageTemplate({
  categoryLabel,
  moduleDue,
  totalNewCards,
  totalCards,
  topics,
  onBack,
  onStartReview,
  onShowStats,
  onOpenCardManager,
  onCreateTopic,
  onEnterDeleteMode,
  onTopicClick,
  onDeleteTopic,
  deleteMode,
  onExitDeleteMode,
}: ModulePageTemplateProps) {
  const [showManageMenu, setShowManageMenu] = useState(false);
  const manageMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showManageMenu) return;
    const onMouseDown = (event: MouseEvent) => {
      if (manageMenuRef.current && !manageMenuRef.current.contains(event.target as Node)) {
        setShowManageMenu(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [showManageMenu]);

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100">
      <div className="mx-auto max-w-md px-4 py-3">
        <div className="sticky top-0 z-20 -mx-4 bg-[#F6F8FB]/92 px-4 backdrop-blur-lg dark:bg-gray-950/92">
          <div className="relative flex h-[52px] items-center justify-between">
            <button onClick={onBack} className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-100">
              <ArrowLeft className="h-4 w-4" />
              <span>返回</span>
            </button>
            <div className="absolute left-1/2 top-1/2 max-w-[44%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
              <span>{categoryLabel}</span>
            </div>
            <div className="h-9 w-9" aria-hidden="true" />
          </div>
        </div>

        <main className="py-5">
          <section className="rounded-[18px] border border-[#D7DFEB] bg-white p-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.06)] dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-bold text-gray-950 dark:text-gray-50">{categoryLabel}</h1>
                <p className="mt-0.5 text-xs font-medium text-gray-400">选择专题开始一组更专注的复习</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <StatPill label="待复习" value={moduleDue} tone="blue" />
              <StatPill label="新卡" value={totalNewCards} tone="blue" />
              <StatPill label="总卡片" value={totalCards} tone="slate" />
            </div>

            <div className="mt-3 grid gap-2">
              <button onClick={onStartReview} className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#2378F4] px-3 text-[13px] font-semibold text-white shadow-[0_8px_16px_rgba(35,120,244,0.22)] transition-all hover:bg-[#1668df] active:scale-[0.99]">
                <span>开始复习</span>
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={onShowStats} className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#D7DFEB] bg-white px-3 text-[12px] font-semibold text-[#64748B] shadow-sm transition-colors hover:bg-slate-50 hover:text-[#2378F4] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
                  <BarChart3 className="h-4 w-4" />
                  <span>学习统计</span>
                </button>

                <div className="relative" ref={manageMenuRef}>
                  <button
                    onClick={() => setShowManageMenu((open) => !open)}
                    className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-[#D7DFEB] bg-white px-3 text-[12px] font-semibold text-[#64748B] shadow-sm transition-colors hover:bg-slate-50 hover:text-[#2378F4] active:scale-[0.99] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <Settings className="h-4 w-4" />
                    <span>模块管理</span>
                  </button>

                  {showManageMenu && (
                    <div className="absolute right-0 top-12 z-30 min-w-[150px] overflow-hidden rounded-2xl border border-gray-200 bg-white py-1.5 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                      <button
                        onClick={() => {
                          setShowManageMenu(false);
                          onOpenCardManager();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <FileText className="h-4 w-4" />
                        卡片管理
                      </button>
                      <button
                        onClick={() => {
                          setShowManageMenu(false);
                          onCreateTopic();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Plus className="h-4 w-4" />
                        新增专题
                      </button>
                      <button
                        onClick={() => {
                          setShowManageMenu(false);
                          onEnterDeleteMode();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                        删除专题
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-4 grid grid-cols-2 gap-2.5">
            {deleteMode && onExitDeleteMode && (
              <div className="col-span-2 mb-1 flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-3 py-2 dark:border-red-900/50 dark:bg-red-950/30">
                <span className="text-[12px] font-medium text-red-500">点击专题卡片上的删除按钮</span>
                <button onClick={onExitDeleteMode} className="text-[12px] font-semibold text-red-500 hover:text-red-600">取消</button>
              </div>
            )}
            {topics.map((topic) => (
              <ModuleTopicCard key={topic.key} topic={topic} onClick={() => onTopicClick(topic)} onDelete={onDeleteTopic ? () => onDeleteTopic(topic) : undefined} deleteMode={deleteMode} />
            ))}
            {topics.length % 2 === 1 && <div aria-hidden="true" />}
          </section>
        </main>
      </div>
    </div>
  );
}

function StatPill({ label, value, tone }: { label: string; value: number; tone: 'blue' | 'slate' }) {
  const valueClass = tone === 'blue' ? 'text-[#2378F4]' : 'text-gray-900 dark:text-gray-100';
  return (
    <div className="rounded-xl bg-[#F6F8FB] px-3 py-2 dark:bg-gray-950/70">
      <p className="text-[10px] font-medium leading-tight text-[#64748B] dark:text-gray-500">{label}</p>
      <p className={`mt-1 text-[22px] font-bold leading-none tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}

function ModuleTopicCard({ topic, onClick, onDelete, deleteMode }: { topic: ModuleTopicCardModel; onClick: () => void; onDelete?: () => void; deleteMode?: boolean }) {
  const showDelete = deleteMode;
  return (
    <button
      onClick={showDelete && onDelete ? () => onDelete() : onClick}
      className="group relative flex min-h-[158px] flex-col rounded-[18px] border border-[#D7DFEB] bg-white p-3 text-left shadow-[0_6px_16px_rgba(15,23,42,0.045)] transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-900/60"
    >
      <div className="flex w-full items-center justify-between gap-2">
        <h3 className="min-w-0 text-[15px] font-semibold leading-tight text-gray-900 dark:text-gray-100">{topic.title}</h3>
        <div className="flex shrink-0">
          {showDelete ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400">
              <X className="h-3.5 w-3.5" />
            </span>
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#D7DFEB] bg-white text-[#64748B] transition-colors group-hover:border-[#BBD2F7] group-hover:text-[#2378F4] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 grid w-full grid-cols-3 items-start rounded-xl bg-[#F6F8FB] px-2 py-2 dark:bg-gray-950/70">
        <div className="flex flex-col items-start">
          <p className="mb-1.5 text-[11px] font-medium text-[#64748B]">新卡</p>
          <p className="text-[14px] font-semibold leading-none text-blue-500 tabular-nums">{topic.newCount}</p>
        </div>
        <div className="flex flex-col items-center">
          <p className="mb-1.5 text-[11px] font-medium text-[#64748B]">待复习</p>
          <p className="text-[14px] font-semibold leading-none text-orange-500 tabular-nums">{topic.dueCount}</p>
        </div>
        <div className="flex flex-col items-end">
          <p className="mb-1.5 text-[11px] font-medium text-[#64748B]">总数</p>
          <p className="text-[14px] font-semibold leading-none text-gray-900 tabular-nums dark:text-gray-100">{topic.total}</p>
        </div>
      </div>

      <div
        className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#E9EEF6] shadow-[inset_0_1px_2px_rgba(15,23,42,0.1)] dark:bg-gray-800"
        style={{ backgroundColor: `${topic.tone.fg}24` }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${topic.progress}%`,
            minWidth: topic.progress > 0 ? '18px' : '0px',
            background: `linear-gradient(90deg, ${topic.tone.fg}, ${topic.tone.bar})`,
            boxShadow: `0 0 12px ${topic.tone.glow}`,
          }}
        />
      </div>
      <div className="mt-3 grid w-full grid-cols-2 items-center text-[10px] font-medium text-[#64748B]">
        <span className="justify-self-start whitespace-nowrap">进度 {topic.progress}%</span>
        <span className="justify-self-end whitespace-nowrap text-right">
          {topic.completed} / {topic.total}
        </span>
      </div>
    </button>
  );
}
