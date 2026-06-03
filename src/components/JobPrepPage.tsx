// Job Prep Page — Agent chat workspace for job interview preparation

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Briefcase, Loader2, ChevronDown, ChevronRight, Play } from 'lucide-react';
import { API_BASE } from '../api/client';

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

  // Initial state: ask for job target
  if (!sessionId) {
    return (
      <div className="dark-bg min-h-screen flex flex-col">
        <div className="nav-bar sticky top-0 z-20 flex items-center gap-3">
          <button onClick={onBack} className="p-1 -ml-1"><ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} /></button>
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
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); createSession(input); } }}
                placeholder="例如：我要面试阿里的数据分析实习..."
                className="w-full rounded-xl border px-4 py-3 text-[14px] bg-transparent resize-none"
                style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
                rows={3}
                disabled={loading}
              />
              <button
                onClick={() => createSession(input)}
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
        <button onClick={onBack} className="p-1 -ml-1"><ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} /></button>
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
