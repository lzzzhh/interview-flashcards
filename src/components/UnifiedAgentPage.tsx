import { useEffect, useState } from 'react';
import { Bot, FileText, Loader2, Send, Download, Sparkles } from 'lucide-react';
import { API_BASE } from '../api/client';
import { useDocumentQueue } from '../hooks/useDocumentQueue';
import BackButton from './BackButton';

type Props = { onBack: () => void; onNavigate: (page: string) => void };

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any;
};

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';
const BLUE = '#3B82F6';
const ACTION_BG = 'rgba(59,130,246,0.14)';
const ACTION_BORDER = 'rgba(59,130,246,0.32)';

export default function UnifiedAgentPage({ onBack, onNavigate }: Props) {
  const [sessionId, setSessionId] = useState('');
  const [input, setInput] = useState('');
  const [filePath, setFilePath] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'hello', role: 'assistant', content: '你可以直接说：资料制卡、岗位备战，或按 JD 优化简历。也可以先选择 PDF/DOCX/TXT/MD 文件。' },
  ]);
  const { addToQueue } = useDocumentQueue();

  useEffect(() => {
    fetch(`${API_BASE}/agent/sessions`, { method: 'POST' })
      .then(res => res.json())
      .then(data => setSessionId(data.sessionId))
      .catch(() => {});
  }, []);

  async function chooseFile() {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const path = await invoke<string | null>('choose_document_file');
      if (path) setFilePath(path);
    } catch {
      setMessages(prev => [...prev, { id: `${Date.now()}-file`, role: 'assistant', content: '当前环境不支持本地文件选择，请在桌面 app 中使用。' }]);
    }
  }

  async function sendMessage(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!sessionId || (!text && !filePath)) return;
    setInput('');
    const selectedFile = filePath;
    setFilePath('');
    setMessages(prev => [...prev, {
      id: `${Date.now()}-user`,
      role: 'user',
      content: [text, selectedFile ? `文件：${selectedFile.split('/').pop()}` : ''].filter(Boolean).join('\n'),
    }]);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/agent/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, filePath: selectedFile }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.actionType === 'background_task_started' && data.documentId) {
        addToQueue(data.documentId, data.filename || selectedFile.split('/').pop() || '资料');
      }
      setMessages(prev => [...prev, {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: data.assistantMessage || '已处理。',
        data,
      }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { id: `${Date.now()}-err`, role: 'assistant', content: e?.message || '处理失败，请稍后重试。' }]);
    }
    setLoading(false);
  }

  function absoluteDownload(path: string) {
    return `${API_BASE.replace(/\/api$/, '')}${path}`;
  }

  return (
    <div className="dark-bg homepage-glass-stage flex min-h-screen flex-col transition-colors" style={{ color: TEXT_PRIMARY }}>
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-4 sm:px-5">
        <div className="flex shrink-0 items-center gap-3 border-b py-4" style={{ borderColor: CARD_BORDER }}>
          <BackButton onClick={onBack} />
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: ACTION_BG, border: `1px solid ${ACTION_BORDER}` }}>
            <Bot size={20} color={BLUE} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[18px] font-bold leading-tight">AI 工作台</h1>
            <p className="mt-0.5 truncate text-[12px] font-medium" style={{ color: TEXT_MUTED }}>
              自动判断制卡、备战和简历优化
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              ['把资料制成卡片', '帮我把这份资料制卡'],
              ['岗位备战', '我要准备数据分析岗位面试'],
              ['简历优化', '根据这个 JD 优化我的简历'],
            ].map(([label, prompt]) => (
              <button
                key={label}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="min-h-[44px] rounded-xl border px-2.5 py-2 text-center text-[12px] font-bold leading-snug transition-colors hover:bg-blue-500 hover:text-white disabled:opacity-50"
                style={{ borderColor: ACTION_BORDER, backgroundColor: ACTION_BG, color: TEXT_PRIMARY }}
                disabled={loading}
              >
                {label}
              </button>
            ))}
          </div>

          {messages.map(message => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[86%] rounded-2xl border px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap"
                style={{
                  backgroundColor: message.role === 'user' ? BLUE : CARD_BG,
                  borderColor: message.role === 'user' ? BLUE : CARD_BORDER,
                  color: message.role === 'user' ? '#fff' : TEXT_PRIMARY,
                }}>
                {message.content}
                {message.data?.actionType === 'background_task_started' && (
                  <button
                    type="button"
                    onClick={() => onNavigate(`drafts:${message.data.documentId}`)}
                    className="mt-2 inline-flex min-h-8 items-center rounded-lg px-3 text-[12px] font-bold text-white"
                    style={{ backgroundColor: BLUE }}
                  >
                    查看制卡进度
                  </button>
                )}
                {message.data?.jobPrepSessionId && message.data?.intent === 'job_prep' && (
                  <button
                    type="button"
                    onClick={() => onNavigate('jobprep-chat')}
                    className="mt-2 inline-flex min-h-8 items-center rounded-lg px-3 text-[12px] font-bold text-white"
                    style={{ backgroundColor: BLUE }}
                  >
                    打开岗位备战
                  </button>
                )}
                {message.data?.data?.downloadUrls && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a
                      href={absoluteDownload(message.data.data.downloadUrls.docx)}
                      className="inline-flex min-h-8 items-center gap-1 rounded-lg border px-3 text-[12px] font-bold"
                      style={{ borderColor: ACTION_BORDER, color: message.role === 'user' ? '#fff' : BLUE, backgroundColor: message.role === 'user' ? 'rgba(255,255,255,0.18)' : ACTION_BG }}
                    >
                      <Download size={12} /> Word
                    </a>
                    <a
                      href={absoluteDownload(message.data.data.downloadUrls.pdf)}
                      className="inline-flex min-h-8 items-center gap-1 rounded-lg border px-3 text-[12px] font-bold"
                      style={{ borderColor: ACTION_BORDER, color: message.role === 'user' ? '#fff' : BLUE, backgroundColor: message.role === 'user' ? 'rgba(255,255,255,0.18)' : ACTION_BG }}
                    >
                      <Download size={12} /> PDF
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div
          className="shrink-0 space-y-2 rounded-t-2xl border bg-white/85 px-3 pb-3 pt-3 shadow-lg backdrop-blur-xl dark:bg-slate-950/85"
          style={{
            borderColor: CARD_BORDER,
          }}
        >
          {filePath && (
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-medium" style={{ borderColor: ACTION_BORDER, backgroundColor: ACTION_BG, color: TEXT_PRIMARY }}>
              <FileText size={14} />
              <span className="min-w-0 flex-1 truncate">{filePath}</span>
              <button type="button" onClick={() => setFilePath('')} className="rounded-lg px-2 py-1 text-[12px] font-bold" style={{ color: BLUE }}>移除</button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={chooseFile}
              disabled={loading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors hover:bg-blue-500 hover:text-white disabled:opacity-50"
              style={{ borderColor: ACTION_BORDER, color: TEXT_PRIMARY, backgroundColor: ACTION_BG }}
              title="选择文件"
            >
              <FileText size={18} />
            </button>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="输入需求，或先选文件..."
              rows={2}
              className="min-h-11 flex-1 resize-none rounded-xl border px-3 py-2 text-[14px] leading-relaxed placeholder:text-slate-500 dark:placeholder:text-slate-300"
              style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY, backgroundColor: CARD_BG }}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={loading || (!input.trim() && !filePath)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md transition-transform active:scale-95 disabled:opacity-40 disabled:shadow-none"
              style={{ backgroundColor: BLUE }}
              title="发送"
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            </button>
          </div>
          <div className="flex items-center gap-1 text-[12px] font-medium" style={{ color: TEXT_MUTED }}>
            <Sparkles size={12} /> 会自动判断资料制卡、岗位备战或简历优化
          </div>
        </div>
      </div>
    </div>
  );
}
