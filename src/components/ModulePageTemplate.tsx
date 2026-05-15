import { ArrowLeft, BarChart3, ChevronRight, ExternalLink, Layers, X, type LucideIcon } from 'lucide-react';

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
  categoryIcon?: LucideIcon;
  moduleDue: number;
  totalNewCards: number;
  totalCards: number;
  topics: ModuleTopicCardModel[];
  onBack: () => void;
  onStartReview: () => void;
  onShowStats: () => void;
  onTopicClick: (topic: ModuleTopicCardModel) => void;
  onDeleteTopic?: (topic: ModuleTopicCardModel) => void;
  deleteMode?: boolean;
  onExitDeleteMode?: () => void;
}

export default function ModulePageTemplate({
  categoryLabel,
  categoryIcon: CategoryIcon,
  moduleDue,
  totalNewCards,
  totalCards,
  topics,
  onBack,
  onStartReview,
  onShowStats,
  onTopicClick,
  onDeleteTopic,
  deleteMode,
  onExitDeleteMode,
}: ModulePageTemplateProps) {
  return (
    <div className="min-h-screen overflow-y-auto bg-[#F5F7FB] text-[#0F172A] transition-colors dark:bg-gray-950 dark:text-gray-100">
      <div className="mx-auto min-h-screen max-w-xl bg-gradient-to-b from-white via-[#F8FAFD] to-[#F3F6FB] shadow-[0_0_0_1px_rgba(148,163,184,0.18),0_18px_50px_rgba(15,23,42,0.08)] dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
        <div className="sticky top-0 z-20 border-b border-[#DCE3EE] bg-white/92 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/88">
          <div className="flex h-[64px] items-center justify-between px-4">
            <button onClick={onBack} className="flex items-center gap-1.5 rounded-xl px-2 py-2 text-[17px] font-semibold text-[#64748B] transition-colors hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-gray-800">
              <ArrowLeft className="h-6 w-6" />
              <span>返回</span>
            </button>
            <div className="flex min-w-[72px] items-center justify-end gap-1.5 text-[15px] font-semibold text-[#64748B] dark:text-gray-400">
              <span>{categoryLabel}</span>
              <ExternalLink className="h-[18px] w-[18px]" />
            </div>
          </div>
        </div>

        <main className="px-4 py-6">
          <section className="flex h-[123px] items-center gap-3 rounded-[18px] border border-[#D7DFEB] bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.07)] dark:border-gray-800 dark:bg-gray-900">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] shadow-inner">
              {CategoryIcon ? (
                <CategoryIcon className="h-8 w-8 text-[#2378F4]" strokeWidth={1.9} />
              ) : (
                <Layers className="h-8 w-8 text-[#2378F4]" strokeWidth={1.9} />
              )}
            </div>
            <div className="grid min-w-0 flex-1 grid-cols-3 divide-x divide-[#E2E8F0] dark:divide-gray-800">
              <div className="px-2 first:pl-0">
                <p className="mb-2 text-[10px] font-medium leading-tight text-[#64748B]">今日待复习</p>
                <p className="text-[26px] font-bold leading-none text-[#2378F4] tabular-nums">{moduleDue}</p>
              </div>
              <div className="px-2">
                <p className="mb-2 text-[10px] font-medium leading-tight text-[#64748B]">新卡</p>
                <p className="text-[26px] font-bold leading-none text-[#2378F4] tabular-nums">{totalNewCards}</p>
              </div>
              <div className="px-2">
                <p className="mb-2 text-[10px] font-medium leading-tight text-[#64748B]">总卡片</p>
                <p className="text-[26px] font-bold leading-none text-[#0F172A] tabular-nums dark:text-gray-100">{totalCards}</p>
              </div>
            </div>
            <div className="flex w-[92px] shrink-0 flex-col gap-2">
              <button onClick={onStartReview} className="flex h-10 items-center justify-center gap-1.5 rounded-[13px] bg-[#2378F4] px-2 text-[13px] font-semibold text-white shadow-[0_8px_16px_rgba(35,120,244,0.24)] transition-all hover:bg-[#1668df] active:scale-[0.99]">
                <span>开始复习</span>
                <ChevronRight className="h-4 w-4" />
              </button>
              <button onClick={onShowStats} className="flex h-10 items-center justify-center gap-1.5 rounded-[12px] border border-[#D7DFEB] bg-white px-2 text-[12px] font-semibold text-[#64748B] shadow-sm transition-colors hover:bg-slate-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
                <BarChart3 className="h-4 w-4" />
                <span>查看进度</span>
              </button>
            </div>
          </section>

          <section className="mt-5 grid grid-cols-2 gap-3">
            {deleteMode && onExitDeleteMode && (
              <div className="col-span-2 flex items-center justify-between px-1 mb-1">
                <span className="text-[13px] font-medium text-red-500">点击专题卡片上的 ✕ 删除</span>
                <button onClick={onExitDeleteMode} className="text-[12px] text-[#64748B] hover:text-gray-900 dark:hover:text-gray-300">取消</button>
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

function ModuleTopicCard({ topic, onClick, onDelete, deleteMode }: { topic: ModuleTopicCardModel; onClick: () => void; onDelete?: () => void; deleteMode?: boolean }) {
  const showDelete = deleteMode;
  return (
    <button
      onClick={showDelete && onDelete ? () => onDelete() : onClick}
      className="group relative flex min-h-[164px] flex-col rounded-2xl border border-[#D7DFEB] bg-white p-3 text-left shadow-[0_5px_14px_rgba(15,23,42,0.055)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(15,23,42,0.09)] dark:border-gray-800 dark:bg-gray-900"
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

      <div className="mt-5 grid w-full grid-cols-3 items-start">
        <div className="flex flex-col items-center justify-self-start">
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
        className="mt-4 h-3 w-full overflow-hidden rounded-full border border-white/80 bg-[#E9EEF6] shadow-[inset_0_1px_2px_rgba(15,23,42,0.12)] dark:border-gray-800"
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
