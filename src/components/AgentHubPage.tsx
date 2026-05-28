import { Search, FileText, Briefcase, Sparkles, Mic, ListChecks } from 'lucide-react';


type Props = { onBack: () => void; onNavigate: (page: string) => void };

const TEXT_MUTED = '#9CA3AF';
const TEXT_PRIMARY = '#F3F4F6';

const AGENTS = [
  { key: 'search', icon: Search, title: 'AI 智能搜索', desc: '语义搜索所有卡片，快速定位薄弱知识点', color: '#3B82F6' },
  { key: 'ingest', icon: FileText, title: '资料制卡', desc: '上传 PDF/Word，AI 自动生成面试卡片', color: '#10B981' },
  { key: 'jobprep', icon: Briefcase, title: '岗位备战', desc: '输入公司/岗位，匹配题库并生成学习计划', color: '#F59E0B' },
  { key: 'drafts', icon: Sparkles, title: '草稿审核', desc: '审核 AI 生成的卡片草稿，一键入库', color: '#8B5CF6' },
  { key: 'mock-interview', icon: Mic, title: '模拟面试', desc: '自答自评模拟真实面试场景', color: '#EC4899' },
  { key: 'resume-project', icon: ListChecks, title: '简历项目追问', desc: '基于项目描述生成面试追问卡片', color: '#14B8A6' },
];

export default function AgentHubPage({ onBack, onNavigate }: Props) {
  const handleAgentClick = (agent: typeof AGENTS[number]) => {
    onNavigate(agent.key);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#111827', color: TEXT_PRIMARY }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid #1F2937' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: TEXT_MUTED, cursor: 'pointer', fontSize: '20px' }}>
          ←
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: 600, margin: 0 }}>AI Agent 中心</h1>
        <div style={{ width: '20px' }} />
      </div>

      <div style={{ padding: '16px', overflow: 'auto', flex: 1 }}>
        <p style={{ color: TEXT_MUTED, fontSize: '13px', marginBottom: '16px' }}>
          选择一个 AI 功能开始使用
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {AGENTS.map(agent => (
            <button
              key={agent.key}
              onClick={() => handleAgentClick(agent)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                background: '#1F2937',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: `${agent.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <agent.icon size={22} color={agent.color} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: TEXT_PRIMARY }}>{agent.title}</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: TEXT_MUTED }}>{agent.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
