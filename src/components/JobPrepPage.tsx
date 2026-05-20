// src/components/JobPrepPage.tsx — 岗位备战对话页
import { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { apiPost } from '../api/client';

interface Message {
  role: 'user' | 'agent';
  text: string;
}

interface Props { onBack: () => void; }

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
    } catch (err: any) {
      const msg = err.message || '请求失败，请确认后端已启动';
      setMessages(prev => [...prev, { role: 'agent', text: msg }]);
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
            <p className="text-center text-[13px] mt-8" style={{ color: 'var(--text-muted)' }}>告诉我你准备面试的公司和岗位</p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap"
                style={m.role === 'user'
                  ? {
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      borderBottomRightRadius: '4px',
                    }
                  : {
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--card-border)',
                      borderBottomLeftRadius: '4px',
                    }
                }
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && <p className="text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>思考中...</p>}
        </div>

        {/* 底部输入栏 */}
        <div className="shrink-0 px-4 py-3 border-t" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="输入公司/岗位或 JD 链接..."
              className="flex-1 px-4 py-2.5 rounded-xl text-[13px] outline-none"
              style={{
                backgroundColor: 'rgba(15,23,42,0.04)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={send}
              disabled={loading}
              className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-opacity disabled:opacity-40"
              style={{ backgroundColor: '#2563EB' }}
            >
              <Send className="w-4 h-4" style={{ color: '#FFFFFF' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
