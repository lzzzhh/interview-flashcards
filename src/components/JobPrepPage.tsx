// src/components/JobPrepPage.tsx — 岗位备战对话页
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Briefcase, Sparkles } from 'lucide-react';
import { apiPost } from '../api/client';

interface Message {
  role: 'user' | 'agent';
  text: string;
}

interface Props { onBack: () => void; }

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';
const BLUE = 'var(--blue)';

export default function JobPrepPage({ onBack }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

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
      {/* 导航栏 */}
      <div className="nav-bar sticky top-0 z-20 flex items-center gap-3">
        <button onClick={onBack} className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} />
        </button>
        <Briefcase className="w-5 h-5" style={{ color: BLUE }} />
        <h1 className="nav-title">岗位备战</h1>
      </div>

      {/* 消息列表 */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-16 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${BLUE}15` }}>
              <Sparkles className="w-7 h-7" style={{ color: BLUE }} />
            </div>
            <p className="text-[14px] font-bold" style={{ color: TEXT_PRIMARY }}>准备面试哪家公司？</p>
            <p className="text-[12px] text-center leading-relaxed" style={{ color: TEXT_MUTED }}>
              告诉我公司名和岗位，或直接粘贴 JD 链接，<br />AI 将为你匹配题库并生成学习计划。
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap break-words"
              style={m.role === 'user'
                ? {
                    backgroundColor: BLUE,
                    color: '#FFFFFF',
                    borderBottomRightRadius: '6px',
                  }
                : {
                    backgroundColor: CARD_BG,
                    color: TEXT_PRIMARY,
                    border: `1px solid ${CARD_BORDER}`,
                    borderBottomLeftRadius: '6px',
                  }
              }
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3 border text-[13px] flex items-center gap-2" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER, borderBottomLeftRadius: '6px' }}>
              <span className="inline-flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: BLUE, animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: BLUE, animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: BLUE, animationDelay: '300ms' }} />
              </span>
              <span style={{ color: TEXT_MUTED }}>分析中...</span>
            </div>
          </div>
        )}
      </div>

      {/* 底部输入栏 */}
      <div className="shrink-0 px-4 py-3 border-t" style={{ borderColor: CARD_BORDER, backgroundColor: CARD_BG }}>
        <div className="flex gap-2 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="输入公司/岗位或粘贴 JD..."
            className="flex-1 px-4 py-3 rounded-xl text-[13px] outline-none ring-0 border"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: TEXT_PRIMARY,
              borderColor: CARD_BORDER,
            }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
            style={{ backgroundColor: BLUE }}
          >
            <Send className="w-4.5 h-4.5" style={{ color: '#FFFFFF' }} />
          </button>
        </div>
        <p className="text-[10px] mt-1.5 text-center" style={{ color: TEXT_MUTED }}>按 Enter 发送，Shift+Enter 换行</p>
      </div>
    </div>
  );
}
