// Job Prep Page — Agent chat workspace for job interview preparation

import { useState, useRef, useEffect } from 'react';
import { Send, Briefcase, Loader2, ChevronDown, ChevronRight, Play, FileText, Wand2, Download } from 'lucide-react';
import { API_BASE } from '../api/client';
import BackButton from './BackButton';

interface Props {
  onBack: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';
const ORANGE = '#F59E0B';

export default function JobPrepPage({ onBack }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeFilePath, setResumeFilePath] = useState('');
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeTailoring, setResumeTailoring] = useState<any | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function createSession(text: string) {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/job-prep/sessions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSessionId(data.sessionId);
      setMessages([{ id: 'sys', role: 'system', content: `准备面试「${data.role || ''}」` }]);
      if (data.assistantMessage) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.assistantMessage }]);
      }
      if (data.data?.planId) loadPlans(data.sessionId);
      setInput(''); // clear input after first message sent
    } catch {
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: '连接失败，请确认后端已启动。' }]);
    }
    setLoading(false);
  }

  async function sendMessage(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || !sessionId) return;
    if (!textOverride) setInput('');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/job-prep/sessions/${sessionId}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.assistantMessage) {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.assistantMessage }]);
      }
      // Auto-load plans if plan was generated/updated
      loadPlans();
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: '请求失败，请重试。' }]);
    }
    setLoading(false);
  }

  async function loadPlans(id = sessionId) {
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE}/job-prep/sessions/${id}/plans`);
      setPlans(await res.json());
    } catch {}
  }

  async function handleStartStage(stageId: string, _cardIds: string[]) {
    try {
      const res = await fetch(`${API_BASE}/job-prep/stages/${stageId}/start`, { method: 'POST' });
      const data = await res.json();
      // Dispatch to study — handled by App.tsx navigation
      console.log('Start stage:', data);
    } catch {}
  }

  async function tailorResume() {
    if (!sessionId || resumeText.trim().length < 40) return;
    setResumeLoading(true);
    try {
      const res = await fetch(`${API_BASE}/job-prep/sessions/${sessionId}/resume-tailoring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResumeTailoring(data);
    } catch {
      setResumeTailoring({
        summary: '简历优化失败，请确认后端已启动，并稍后重试。',
        matchedEvidence: [],
        gaps: [],
        rewrites: [],
        riskFlags: [{ severity: 'warning', text: '请求失败', reason: '后端暂时没有返回可用结果。' }],
      });
    }
    setResumeLoading(false);
  }

  async function uploadResume() {
    if (!sessionId || (!resumeFile && !resumeFilePath)) return;
    setResumeLoading(true);
    try {
      const res = resumeFilePath
        ? await fetch(`${API_BASE}/job-prep/sessions/${sessionId}/resume/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: resumeFilePath }),
        })
        : await fetch(`${API_BASE}/job-prep/sessions/${sessionId}/resume/upload`, {
          method: 'POST',
          body: (() => {
            const formData = new FormData();
            if (resumeFile) formData.append('file', resumeFile);
            return formData;
          })(),
        });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResumeTailoring(data);
    } catch {
      setResumeTailoring({
        summary: '简历文件优化失败，请确认 parser-worker 和后端都已启动。',
        matchedEvidence: [],
        gaps: [],
        rewrites: [],
        riskFlags: [{ severity: 'warning', text: '请求失败', reason: '文件解析或生成失败。' }],
      });
    }
    setResumeLoading(false);
  }

  async function chooseResumeFile() {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const path = await invoke<string | null>('choose_document_file');
      if (!path) return;
      if (!/\.(pdf|docx)$/i.test(path)) {
        setResumeTailoring({
          summary: '请选择 PDF 或 DOCX 简历文件。',
          matchedEvidence: [],
          gaps: [],
          rewrites: [],
          riskFlags: [{ severity: 'warning', text: path, reason: '当前简历优化只支持 PDF / DOCX。' }],
        });
        return;
      }
      setResumeFile(null);
      setResumeFilePath(path);
    } catch {
      document.getElementById('resume-file-input')?.click();
    }
  }

  // Initial state: ask for job target
  if (!sessionId) {
    return (
      <div className="dark-bg min-h-screen flex flex-col">
        <div className="nav-bar sticky top-0 z-20 flex items-center gap-3">
          <BackButton onClick={onBack} />
          <h1 className="nav-title">岗位备战</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-5">
          <div className="max-w-md w-full space-y-4">
            <div className="text-center mb-4"><Briefcase size={48} className="mx-auto mb-3" style={{ color: ORANGE }} /></div>
            <p className="text-[15px] text-center font-medium" style={{ color: TEXT_PRIMARY }}>你想准备什么公司和岗位的面试？</p>
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {['数据分析', '算法岗', '后端开发', '机器学习', 'LLM 应用'].map(label => (
                <button key={label} onClick={() => createSession(label)} className="px-4 py-2 rounded-xl text-[13px] font-medium border" style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}>
                  {label}
                </button>
              ))}
            </div>
            <div className="relative">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const t = input; setInput(''); createSession(t); } }}
                placeholder="例如：我要面试阿里的数据分析实习..."
                className="w-full rounded-xl border px-4 py-3 text-[14px] bg-transparent resize-none"
                style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
                rows={3}
                disabled={loading}
              />
              <button
                onClick={() => { const t = input; setInput(''); createSession(t); }}
                disabled={!input.trim() || loading}
                className="absolute bottom-3 right-3 p-2 rounded-lg text-white disabled:opacity-30"
                style={{ backgroundColor: ORANGE }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark-bg min-h-screen flex flex-col">
      <div className="nav-bar sticky top-0 z-20 flex items-center gap-3 shrink-0">
        <BackButton onClick={onBack} />
        <h1 className="nav-title">岗位备战</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {/* Plans section */}
        {plans.length > 0 && (
          <div className="rounded-2xl border p-4 space-y-3" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
            <h3 className="text-[14px] font-bold" style={{ color: TEXT_PRIMARY }}>学习计划</h3>
            {plans.map((plan: any) => (
              <div key={plan.id}>
                <button onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: CARD_BORDER }}>
                  <div className="text-left">
                    <div className="text-[13px] font-medium" style={{ color: TEXT_PRIMARY }}>{plan.title}</div>
                    <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{plan.totalStages} 阶段 · {plan.totalCards} 张卡片</div>
                  </div>
                  {expandedPlan === plan.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {expandedPlan === plan.id && plan.stages?.map((stage: any) => (
                  <div key={stage.id} className="ml-4 mt-2 p-3 rounded-xl border" style={{ borderColor: CARD_BORDER, backgroundColor: 'rgba(245,158,11,0.05)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>{stage.name}</div>
                        <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{stage.goal}</div>
                        <div className="text-[10px] mt-1" style={{ color: TEXT_MUTED }}>{stage.cards?.length || 0} 张卡片 · {stage.estimatedMinutes || '—'} 分钟</div>
                      </div>
                      <button onClick={() => handleStartStage(stage.id, stage.cards?.map((c: any) => c.cardId) || [])}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white"
                        style={{ backgroundColor: ORANGE }}>
                        <Play size={12} className="inline mr-1" />开始学习
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border p-4 space-y-3" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <div className="flex items-center gap-2">
            <FileText size={16} style={{ color: ORANGE }} />
            <h3 className="text-[14px] font-bold" style={{ color: TEXT_PRIMARY }}>简历优化</h3>
          </div>
          <div className="rounded-xl border px-3 py-3 space-y-2" style={{ borderColor: CARD_BORDER }}>
            <input
              id="resume-file-input"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={e => { setResumeFile(e.target.files?.[0] || null); setResumeFilePath(''); }}
              className="hidden"
              style={{ color: TEXT_MUTED }}
              disabled={resumeLoading}
            />
            <button
              onClick={chooseResumeFile}
              disabled={resumeLoading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium border"
              style={{ color: TEXT_PRIMARY, borderColor: CARD_BORDER }}
            >
              <FileText size={14} />
              选择 PDF / DOCX
            </button>
            {(resumeFilePath || resumeFile) && (
              <div className="text-[11px] truncate" style={{ color: TEXT_MUTED }}>
                {resumeFilePath || resumeFile?.name}
              </div>
            )}
            <button
              onClick={uploadResume}
              disabled={(!resumeFile && !resumeFilePath) || resumeLoading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-30"
              style={{ backgroundColor: ORANGE }}
            >
              {resumeLoading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
              上传并生成 Word / PDF
            </button>
          </div>
          <textarea
            value={resumeText}
            onChange={e => setResumeText(e.target.value)}
            placeholder="也可以先粘贴简历内容做快速分析..."
            className="w-full rounded-xl border px-3 py-2.5 text-[13px] bg-transparent resize-none"
            style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
            rows={5}
            disabled={resumeLoading}
          />
          <button
            onClick={tailorResume}
            disabled={resumeText.trim().length < 40 || resumeLoading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-30"
            style={{ backgroundColor: ORANGE }}
          >
            {resumeLoading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
            针对 JD 优化简历
          </button>

          {resumeTailoring && (
            <div className="space-y-3 pt-2">
              <p className="text-[12px] leading-relaxed" style={{ color: TEXT_MUTED }}>{resumeTailoring.summary}</p>
              {resumeTailoring.downloadUrls && (
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`${API_BASE.replace(/\/api$/, '')}${resumeTailoring.downloadUrls.docx}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border"
                    style={{ color: TEXT_PRIMARY, borderColor: CARD_BORDER }}
                  >
                    <Download size={13} /> 下载 Word
                  </a>
                  <a
                    href={`${API_BASE.replace(/\/api$/, '')}${resumeTailoring.downloadUrls.pdf}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border"
                    style={{ color: TEXT_PRIMARY, borderColor: CARD_BORDER }}
                  >
                    <Download size={13} /> 下载 PDF
                  </a>
                </div>
              )}
              {typeof resumeTailoring.appliedRewriteCount === 'number' && (
                <div className="text-[11px]" style={{ color: TEXT_MUTED }}>
                  已应用 {resumeTailoring.appliedRewriteCount} 处低风险改写
                </div>
              )}
              {resumeTailoring.rewrites?.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[12px] font-semibold" style={{ color: TEXT_PRIMARY }}>改写建议</div>
                  {resumeTailoring.rewrites.slice(0, 5).map((item: any, index: number) => (
                    <div key={`${item.beforeText}-${index}`} className="rounded-xl border p-3 space-y-1" style={{ borderColor: CARD_BORDER }}>
                      <div className="text-[11px]" style={{ color: TEXT_MUTED }}>原文：{item.beforeText}</div>
                      <div className="text-[12px] font-medium" style={{ color: TEXT_PRIMARY }}>建议：{item.afterText}</div>
                      <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{item.rationale}</div>
                    </div>
                  ))}
                </div>
              )}
              {resumeTailoring.gaps?.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[12px] font-semibold" style={{ color: TEXT_PRIMARY }}>JD 缺口</div>
                  {resumeTailoring.gaps.slice(0, 5).map((gap: any) => (
                    <div key={gap.requirement} className="text-[11px] rounded-lg border px-3 py-2" style={{ borderColor: CARD_BORDER, color: TEXT_MUTED }}>
                      <span className="font-medium" style={{ color: TEXT_PRIMARY }}>{gap.requirement}</span>：{gap.suggestion}
                    </div>
                  ))}
                </div>
              )}
              {resumeTailoring.riskFlags?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[12px] font-semibold" style={{ color: TEXT_PRIMARY }}>风险提示</div>
                  {resumeTailoring.riskFlags.slice(0, 4).map((flag: any, index: number) => (
                    <div key={`${flag.text}-${index}`} className="text-[11px]" style={{ color: flag.severity === 'blocker' ? '#EF4444' : TEXT_MUTED }}>
                      {flag.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat messages */}
        {messages.filter(m => m.role !== 'system').map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap`}
              style={{
                backgroundColor: msg.role === 'user' ? ORANGE : CARD_BG,
                color: msg.role === 'user' ? '#fff' : TEXT_PRIMARY,
                border: msg.role === 'assistant' ? `1px solid ${CARD_BORDER}` : 'none',
              }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
              <Loader2 size={16} className="animate-spin" style={{ color: ORANGE }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 px-5 py-3 border-t" style={{ borderColor: CARD_BORDER }}>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="输入消息..."
            className="flex-1 rounded-xl border px-4 py-2.5 text-[13px] bg-transparent"
            style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
            disabled={loading}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            className="px-4 rounded-xl text-white disabled:opacity-30" style={{ backgroundColor: ORANGE }}>
            <Send size={16} />
          </button>
        </div>
        {/* Quick action buttons */}
        <div className="flex gap-2 mt-2 flex-wrap">
          {['我只有 3 天', '加强 SQL', '加强项目', '减少算法', '增加机器学习', '重新生成计划'].map(label => (
            <button key={label} onClick={() => sendMessage(label)}
              className="px-2.5 py-1 rounded-lg text-[11px] border" style={{ borderColor: CARD_BORDER, color: TEXT_MUTED }}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
