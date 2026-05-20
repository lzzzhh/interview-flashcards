// src/components/AgentHubPage.tsx — Agent 中心入口
import { ArrowLeft, FileText, Briefcase, Search, Sparkles, Settings } from 'lucide-react';

interface Props {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';

const AGENTS = [
  { key: 'search', icon: Search, title: 'AI 智能搜索', desc: '语义搜索所有卡片，快速定位薄弱知识点', color: '#3B82F6' },
  { key: 'ingest', icon: FileText, title: '资料制卡', desc: '上传 PDF/Word，AI 自动生成面试卡片', color: '#10B981' },
  { key: 'jobprep', icon: Briefcase, title: '岗位备战', desc: '输入公司/岗位，匹配题库并生成学习计划', color: '#F59E0B' },
  { key: 'drafts', icon: Sparkles, title: '草稿审核', desc: '审核 AI 生成的卡片草稿，一键入库', color: '#8B5CF6' },
];

const SETTINGS = [
  { key: 'settings', icon: Settings, title: 'API 配置', desc: '设置 LLM API Key，驱动 AI 制卡和 JD 分析', color: '#6366F1' },
];

export default function AgentHubPage({ onBack, onNavigate }: Props) {
  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center">
        <button onClick={onBack} className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="nav-title">AI Agent 中心</h1>
      </div>

      <div className="flex-1 flex items-start justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-6 pb-24">
          <p className="text-[13px] mb-4" style={{ color: TEXT_MUTED }}>选择一个 AI 功能开始使用</p>
          <div className="space-y-3">
            {AGENTS.map((agent) => (
              <button
                key={agent.key}
                onClick={() => onNavigate(agent.key)}
                className="w-full rounded-xl p-4 border text-left flex items-center gap-4 transition-colors"
                style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${agent.color}20` }}>
                  <agent.icon className="w-5 h-5" style={{ color: agent.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-bold" style={{ color: TEXT_PRIMARY }}>{agent.title}</h3>
                  <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>{agent.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* 分隔线 */}
          <div className="my-4 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: CARD_BORDER }} />
            <span className="text-[11px]" style={{ color: TEXT_MUTED }}>系统</span>
            <div className="flex-1 h-px" style={{ backgroundColor: CARD_BORDER }} />
          </div>

          <div className="space-y-3">
            {SETTINGS.map((item) => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className="w-full rounded-xl p-4 border text-left flex items-center gap-4 transition-colors"
                style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${item.color}20` }}>
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-bold" style={{ color: TEXT_PRIMARY }}>{item.title}</h3>
                  <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
