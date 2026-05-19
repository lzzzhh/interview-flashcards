// src/components/JobPrepPage.tsx — 岗位备战对话页
import { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { apiPost } from '../api/client';

interface Message {
  role: 'user' | 'agent';
  text: string;
}

interface Props { onBack: () => void; }

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const BLUE = 'var(--blue)';
const CARD_BORDER = 'var(--card-border)';

export default function JobPrepPage({ onBack }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await apiPost<any>('/job-prep/session', {
        sessionId,
        message: userMsg,
      });
      setSessionId(res.sessionId);
      for (const msg of res.messages || []) {
        setMessages(prev => [...prev, { role: 'agent', text: msg }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'agent', text: '抱歉，发生错误，请重试。' }]);
    }
    setLoading(false);
  };

  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center">
        <button onClick={onBack} className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="nav-title">岗位备战</h1>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-[13px] mt-8" style={{ color: TEXT_MUTED }}>告诉我你准备面试的公司和岗位</p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%] rounded-xl px-4 py-2.5 text-[13px]" style={{
                backgroundColor: m.role === 'user' ? 'rgba(64,156,255,0.15)' : 'rgba(255,255,255,0.08)',
                color: m.role === 'user' ? BLUE : TEXT_PRIMARY,
              }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && <p className="text-center text-[12px]" style={{ color: TEXT_MUTED }}>思考中...</p>}
        </div>

        <div className="shrink-0 px-5 py-3 border-t" style={{ borderColor: CARD_BORDER }}>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="输入公司/岗位..."
              className="flex-1 px-3 py-2 rounded-lg text-[13px] border-0 outline-none"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: TEXT_PRIMARY }}
            />
            <button onClick={send} disabled={loading} className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(64,156,255,0.15)' }}>
              <Send className="w-4 h-4" style={{ color: BLUE }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
