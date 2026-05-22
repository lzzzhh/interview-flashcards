// src/components/AgentHubPage.tsx — Agent 中心入口
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, FileText, Briefcase, Search, Sparkles, Mic, ListChecks, X, Download, Loader2 } from 'lucide-react';

interface Props {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';
const BLUE = '#3B82F6';

const AGENTS = [
  { key: 'search', icon: Search, title: 'AI 智能搜索', desc: '语义搜索所有卡片，快速定位薄弱知识点', color: '#3B82F6', needsModel: 'bge-m3' },
  { key: 'ingest', icon: FileText, title: '资料制卡', desc: '上传 PDF/Word，AI 自动生成面试卡片', color: '#10B981' },
  { key: 'jobprep', icon: Briefcase, title: '岗位备战', desc: '输入公司/岗位，匹配题库并生成学习计划', color: '#F59E0B' },
  { key: 'drafts', icon: Sparkles, title: '草稿审核', desc: '审核 AI 生成的卡片草稿，一键入库', color: '#8B5CF6' },
  { key: 'mock-interview', icon: Mic, title: '模拟面试', desc: '自答自评模拟真实面试场景', color: '#EC4899' },
  { key: 'resume-project', icon: ListChecks, title: '简历项目追问', desc: '基于项目描述生成面试追问卡片', color: '#14B8A6' },
];

/** 检查模型是否已下载 */
async function checkBgeM3(): Promise<{ available: boolean; reason?: string }> {
  try {
    const res = await fetch('http://localhost:3001/api/models/bge-m3-status');
    return await res.json();
  } catch {
    return { available: false, reason: 'ollama_unreachable' };
  }
}

/** 开始下载模型 */
async function startPull(): Promise<{ ok: boolean; alreadyPulling?: boolean; status: string }> {
  const res = await fetch('http://localhost:3001/api/models/pull-bge-m3', { method: 'POST' });
  return await res.json();
}

/** 查询下载进度 */
async function getPullStatus(): Promise<{ status: string; progress: number; message: string; error?: string }> {
  const res = await fetch('http://localhost:3001/api/models/pull-status');
  return await res.json();
}

export default function AgentHubPage({ onBack, onNavigate }: Props) {
  const [activated, setActivated] = useState<Set<string>>(new Set());
  const [checking, setChecking] = useState(true);
  const [modal, setModal] = useState<{ agent: string; step: 'confirm' | 'downloading' | 'error' } | null>(null);
  const [downloadPct, setDownloadPct] = useState(0);
  const [downloadMsg, setDownloadMsg] = useState('');
  const [dlError, setDlError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 挂载时检查 bge-m3 是否已存在
  useEffect(() => {
    checkBgeM3().then(({ available }) => {
      if (available) setActivated(new Set(['search']));
      setChecking(false);
    });
  }, []);

  // 清理轮询
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const handleAgentClick = async (agent: typeof AGENTS[number]) => {
    // 已激活 → 直接进入
    if (activated.has(agent.key)) return onNavigate(agent.key);

    // 需要模型 → 先检查
    if (agent.needsModel) {
      const { available, reason } = await checkBgeM3();
      if (available) {
        setActivated(prev => new Set([...prev, agent.key]));
        return onNavigate(agent.key);
      }
      if (reason === 'ollama_unreachable') {
        setDlError('未能连接 Ollama 服务，请先在终端运行 ollama serve 启动服务');
        setModal({ agent: agent.key, step: 'error' });
      } else {
        setModal({ agent: agent.key, step: 'confirm' });
      }
      return;
    }

    // 不需要模型的其他功能 → 直接进入
    onNavigate(agent.key);
  };

  const handleConfirmDownload = async () => {
    setModal(prev => prev ? { ...prev, step: 'downloading' } : null);
    setDownloadPct(0);
    setDownloadMsg('正在连接...');
    try {
      const started = await startPull();
      if (!started.ok) {
        setDlError('无法启动下载');
        setModal(prev => prev ? { ...prev, step: 'error' } : null);
        return;
      }
      // 轮询进度
      pollRef.current = setInterval(async () => {
        try {
          const s = await getPullStatus();
          setDownloadPct(s.progress);
          setDownloadMsg(s.message);
          if (s.status === 'done') {
            if (pollRef.current) clearInterval(pollRef.current);
            // 下载完成，激活并进入
            setActivated(prev => new Set([...prev, 'search']));
            setModal(null);
            onNavigate('search');
          } else if (s.status === 'error') {
            if (pollRef.current) clearInterval(pollRef.current);
            setDlError(s.error || '下载失败');
            setModal(prev => prev ? { ...prev, step: 'error' } : null);
          }
        } catch {
          // 网络错误，继续轮询
        }
      }, 1500);
    } catch {
      setDlError('无法启动下载');
      setModal(prev => prev ? { ...prev, step: 'error' } : null);
    }
  };

  const closeModal = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setModal(null);
    setDownloadPct(0);
    setDownloadMsg('');
    setDlError('');
  };

  const retryDownload = () => {
    setDlError('');
    handleConfirmDownload();
  };

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
          <p className="text-[13px] mb-4" style={{ color: TEXT_MUTED }}>
            {checking ? '正在检测已安装模块...' : '选择一个 AI 功能开始使用'}
          </p>
          <div className="space-y-3">
            {AGENTS.map((agent) => {
              const isActive = activated.has(agent.key);
              const Icon = agent.icon;
              return (
                <button
                  key={agent.key}
                  onClick={() => handleAgentClick(agent)}
                  className="w-full rounded-xl p-4 border text-left flex items-center gap-4 transition-all hover:brightness-110"
                  style={{
                    backgroundColor: CARD_BG,
                    borderColor: isActive ? agent.color : CARD_BORDER,
                    borderWidth: isActive ? '2px' : '1px',
                    boxShadow: isActive ? `0 0 12px ${agent.color}30` : undefined,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${agent.color}18` }}
                  >
                    <Icon className="w-4.5 h-4.5" style={{ color: isActive ? agent.color : 'var(--text-muted)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-bold" style={{ color: TEXT_PRIMARY }}>{agent.title}</h3>
                      {isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${agent.color}20`, color: agent.color }}>已激活</span>
                      )}
                    </div>
                    <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>{agent.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 下载弹窗 ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeModal}>
          <div
            className="rounded-2xl p-6 w-[340px] max-w-[90vw] border"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>AI 智能搜索</h3>
              <button onClick={closeModal} className="p-1 rounded-lg" style={{ color: TEXT_MUTED }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {modal.step === 'confirm' && (
              <>
                <div className="mb-5">
                  <div className="text-[13px] leading-relaxed mb-2" style={{ color: TEXT_PRIMARY }}>
                    使用此模块需要下载 AI 模型
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Download className="w-4 h-4" style={{ color: TEXT_MUTED }} />
                    <span className="text-[12px]" style={{ color: TEXT_MUTED }}>bge-m3（约 1.2 GB）</span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: TEXT_MUTED }}>
                    模型仅需下载一次，下载完成后将自动激活此功能。
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-2 rounded-lg text-[13px] border transition-colors"
                    style={{ borderColor: 'var(--card-border)', color: TEXT_MUTED }}
                  >
                    稍后再说
                  </button>
                  <button
                    onClick={handleConfirmDownload}
                    className="flex-1 py-2 rounded-lg text-[13px] font-bold transition-colors"
                    style={{ backgroundColor: BLUE, color: '#fff' }}
                  >
                    确认下载
                  </button>
                </div>
              </>
            )}

            {modal.step === 'downloading' && (
              <>
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: BLUE }} />
                    <span className="text-[13px]" style={{ color: TEXT_PRIMARY }}>正在下载 bge-m3...</span>
                  </div>
                  {/* 进度条 */}
                  <div className="w-full h-2 rounded-full mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${downloadPct}%`, backgroundColor: BLUE }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px]" style={{ color: TEXT_MUTED }}>{downloadMsg}</span>
                    <span className="text-[11px] font-bold" style={{ color: BLUE }}>{downloadPct}%</span>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-full py-2 rounded-lg text-[12px] border transition-colors"
                  style={{ borderColor: 'var(--card-border)', color: TEXT_MUTED }}
                >
                  后台下载，稍后查看
                </button>
              </>
            )}

            {modal.step === 'error' && (
              <>
                <div className="mb-5">
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>{dlError}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-2 rounded-lg text-[13px] border transition-colors"
                    style={{ borderColor: 'var(--card-border)', color: TEXT_MUTED }}
                  >
                    返回
                  </button>
                  {dlError.includes('下载失败') ? (
                    <button
                      onClick={retryDownload}
                      className="flex-1 py-2 rounded-lg text-[13px] font-bold transition-colors"
                      style={{ backgroundColor: BLUE, color: '#fff' }}
                    >
                      重试
                    </button>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
