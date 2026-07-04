import { useState } from 'react';
import { Search, FileText, Briefcase, Sparkles, Mic, ListChecks, ChevronRight } from 'lucide-react';
import { useDocumentQueue } from '../hooks/useDocumentQueue';
import BackButton from './BackButton';

type Props = { onBack: () => void; onNavigate: (page: string) => void };

const TEXT_MUTED = 'var(--text-muted)';
const TEXT_PRIMARY = 'var(--text-primary)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';

const AGENTS = [
  { key: 'search', icon: Search, title: 'AI 智能搜索', desc: '语义搜索所有卡片，快速定位薄弱知识点', color: '#3B82F6' },
  { key: 'ingest', icon: FileText, title: '资料制卡', desc: '上传 PDF/TXT/MD，AI 自动生成面试卡片', color: '#10B981' },
  { key: 'drafts', icon: Sparkles, title: '草稿审核', desc: '审核 AI 生成的卡片草稿，一键入库', color: '#8B5CF6' },
  { key: 'jobprep', icon: Briefcase, title: '岗位备战', desc: '输入公司/岗位，生成阶段化复习计划', color: '#F59E0B', disabled: true },
  { key: 'mock-interview', icon: Mic, title: '模拟面试', desc: '自答自评模拟真实面试场景', color: '#EC4899', disabled: true },
  { key: 'resume-project', icon: ListChecks, title: '简历项目追问', desc: '基于项目描述生成面试追问卡片', color: '#14B8A6', disabled: true },
];

export default function AgentHubPage({ onBack, onNavigate }: Props) {
  const { doneCount, pendingDraftCount } = useDocumentQueue();
  const [toast, setToast] = useState('');

  function handleAgentClick(agent: typeof AGENTS[0]) {
    if (agent.disabled) {
      setToast('功能开发中');
      return;
    }
    onNavigate(agent.key);
  }

  return (
    <div className="dark-bg homepage-glass-stage flex min-h-screen flex-col transition-colors" style={{ color: TEXT_PRIMARY }}>
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-8">
        <div className="flex shrink-0 items-center gap-3 border-b py-4" style={{ borderColor: CARD_BORDER }}>
          <BackButton onClick={onBack} />
          <div className="min-w-0 flex-1 text-center">
            <h1 className="text-[18px] font-bold leading-tight" style={{ color: TEXT_PRIMARY }}>
              AI Agent 中心
            </h1>
          </div>
          <div className="h-9 w-9 shrink-0" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-5">
          <p className="mb-4 text-[13px]" style={{ color: TEXT_MUTED }}>
            选择一个 AI 功能开始使用
          </p>

          <div className="flex flex-col gap-3">
            {AGENTS.map((agent) => (
              <button
                key={agent.key}
                type="button"
                onClick={() => handleAgentClick(agent)}
                className={`group relative flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left backdrop-blur-xl ${agent.disabled ? 'opacity-50' : 'hover:bg-white/45 dark:hover:bg-white/12 cursor-pointer'}`}
                style={{
                  backgroundColor: CARD_BG,
                  borderColor: CARD_BORDER,
                }}
              >
                {(agent.key === 'ingest' && doneCount > 0) && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center px-1 z-10">
                    {doneCount}
                  </span>
                )}
                {(agent.key === 'drafts' && pendingDraftCount > 0) && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center px-1 z-10">
                    {pendingDraftCount}
                  </span>
                )}
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    backgroundColor: `${agent.color}22`,
                    borderColor: 'transparent',
                  }}
                >
                  <agent.icon className="h-[22px] w-[22px]" color={agent.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[15px] font-bold leading-tight" style={{ color: TEXT_PRIMARY }}>
                    {agent.title}
                  </h3>
                  <p className="mt-1 text-[12px] font-medium leading-snug" style={{ color: TEXT_MUTED }}>
                    {agent.desc}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: TEXT_MUTED }} />
              </button>
            ))}
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl backdrop-blur-xl border shadow-lg text-[13px] font-medium transition-all"
            style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER, color: TEXT_MUTED }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
