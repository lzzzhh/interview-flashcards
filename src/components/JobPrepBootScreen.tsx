// Job Prep Boot Screen — checks environment readiness before entering JobPrepPage

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { API_BASE } from '../api/client';

interface Props {
  onBack: () => void;
  onReady: () => void;
}

type StepStatus = 'pending' | 'loading' | 'done' | 'error';

export default function JobPrepBootScreen({ onBack, onReady }: Props) {
  const [steps, setSteps] = useState<{ label: string; status: StepStatus; message?: string }[]>([
    { label: '检查后端服务', status: 'pending' },
    { label: '启动 Qdrant 向量数据库', status: 'pending' },
    { label: '初始化 RAG collection', status: 'pending' },
    { label: '检查 RAG 索引', status: 'pending' },
    { label: '加载 Neo4j 图谱搜索', status: 'pending' },
  ]);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function boot() {
      // Step 1: Check backend
      await updateStep(0, 'loading');
      try {
        await fetch(`${API_BASE}/job-prep/boot`, { method: 'POST' });
        await updateStep(0, 'done');
      } catch {
        await updateStep(0, 'error', '后端未启动');
        return;
      }

      // Step 2: Qdrant health
      await updateStep(1, 'loading');
      try {
        const health = await fetch(`${API_BASE}/rag/qdrant/health`).then(r => r.json());
        if (health.running) await updateStep(1, 'done');
        else await updateStep(1, 'error', 'Qdrant 未运行，请启动 Docker');
      } catch {
        await updateStep(1, 'error', 'Qdrant 未运行');
        setError('请确认 Docker 已启动并运行 Qdrant。\ndocker compose -f docker-compose.qdrant.yml up -d');
        return;
      }

      // Step 3: Init collection
      await updateStep(2, 'loading');
      try {
        await fetch(`${API_BASE}/rag/qdrant/init`, { method: 'POST' });
        await updateStep(2, 'done');
      } catch {
        await updateStep(2, 'error', 'Collection 初始化失败');
        return;
      }

      // Step 4: Check index
      await updateStep(3, 'loading');
      try {
        const status = await fetch(`${API_BASE}/rag/qdrant/check-index`, { method: 'POST' }).then(r => r.json());
        if (status.ready) await updateStep(3, 'done');
        else await updateStep(3, 'done'); // Allow empty index
      } catch {
        await updateStep(3, 'error', '索引检查失败');
        return;
      }

      // Step 5: Neo4j
      await updateStep(4, 'loading');
      setTimeout(async () => {
        await updateStep(4, 'done');
        setReady(true);
      }, 500);
    }

    async function updateStep(index: number, status: StepStatus, message?: string) {
      setSteps(prev => {
        const next = [...prev];
        next[index] = { ...next[index], status, message };
        return next;
      });
      await new Promise(r => setTimeout(r, 300));
    }

    boot();
  }, []);

  if (ready) {
    return (
      <div className="dark-bg min-h-screen flex flex-col items-center justify-center p-8 gap-4">
        <CheckCircle size={48} style={{ color: '#22C55E' }} />
        <h2 className="text-[18px] font-bold" style={{ color: 'var(--text-primary)' }}>环境就绪</h2>
        <button
          onClick={onReady}
          className="px-6 py-3 rounded-xl text-white font-medium"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
        >进入岗位备战</button>
      </div>
    );
  }

  return (
    <div className="dark-bg min-h-screen flex flex-col">
      <div className="nav-bar sticky top-0 z-20 flex items-center gap-3">
        <button onClick={onBack} className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="nav-title">岗位备战</h1>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full px-5 space-y-4">
          <p className="text-[13px] mb-4" style={{ color: 'var(--text-muted)' }}>正在准备岗位备战环境...</p>
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}>
              {step.status === 'loading' && <Loader2 size={18} className="animate-spin" style={{ color: '#F59E0B' }} />}
              {step.status === 'done' && <CheckCircle size={18} style={{ color: '#22C55E' }} />}
              {step.status === 'error' && <XCircle size={18} style={{ color: '#EF4444' }} />}
              {step.status === 'pending' && <div className="w-[18px] h-[18px] rounded-full border-2" style={{ borderColor: 'var(--card-border)' }} />}
              <span className="text-[13px]" style={{ color: step.status === 'error' ? '#EF4444' : 'var(--text-primary)' }}>{step.label}{step.message ? ` — ${step.message}` : ''}</span>
            </div>
          ))}
          {error && (
            <div className="rounded-xl p-4 border text-[12px] whitespace-pre-wrap" style={{ borderColor: '#EF444440', backgroundColor: '#EF444410', color: '#EF4444' }}>
              {error}
              <button onClick={() => window.location.reload()} className="mt-2 flex items-center gap-1 text-[11px] font-medium underline"><RefreshCw size={12} />重试</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
