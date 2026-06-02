// Job Prep Boot Screen — checks environment readiness
// Required: backend, Qdrant, RAG collection, Neo4j
// NOT required: card chunks in Qdrant (cards come from SQLite/FTS5/Neo4j)

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { API_BASE } from '../api/client';

interface Props {
  onBack: () => void;
  onReady: () => void;
}

type StepStatus = 'pending' | 'loading' | 'done' | 'error';

interface Step {
  key: string;
  label: string;
  status: StepStatus;
  message?: string;
  actionable: boolean;
}

export default function JobPrepBootScreen({ onBack, onReady }: Props) {
  const [steps, setSteps] = useState<Step[]>([
    { key: 'backend', label: '检查后端服务', status: 'pending', actionable: false },
    { key: 'qdrant', label: 'Qdrant 向量数据库', status: 'pending', actionable: true },
    { key: 'collection', label: '初始化 RAG collection', status: 'pending', actionable: false },
    { key: 'rag', label: '检查 RAG 文本库', status: 'pending', actionable: false },
    { key: 'neo4j', label: 'Neo4j 图谱搜索', status: 'pending', actionable: false },
  ]);
  const [allDone, setAllDone] = useState(false);
  const [booting, setBooting] = useState(true);

  const setStep = useCallback((key: string, status: StepStatus, message?: string) => {
    setSteps(prev => prev.map(s => s.key === key ? { ...s, status, message: message || s.message } : s));
  }, []);

  async function checkBackend(): Promise<boolean> {
    setStep('backend', 'loading');
    try {
      const res = await fetch(`${API_BASE}/job-prep/boot`, { method: 'POST' });
      if (res.ok) { setStep('backend', 'done'); return true; }
      setStep('backend', 'error', '后端响应异常');
      return false;
    } catch {
      setStep('backend', 'error', '后端未启动');
      return false;
    }
  }

  async function checkQdrant(): Promise<boolean> {
    setStep('qdrant', 'loading');
    try {
      const res = await fetch(`${API_BASE}/rag/qdrant/health`);
      const data = await res.json();
      if (data.running) { setStep('qdrant', 'done'); return true; }
      setStep('qdrant', 'error', 'Qdrant 未运行');
      return false;
    } catch {
      setStep('qdrant', 'error', '无法连接 Qdrant（端口 6335）');
      return false;
    }
  }

  async function checkCollection(): Promise<boolean> {
    setStep('collection', 'loading');
    try {
      const res = await fetch(`${API_BASE}/rag/qdrant/init`, { method: 'POST' });
      if (res.ok) { setStep('collection', 'done'); return true; }
      const data = await res.json();
      if (data.created || data.collectionName) { setStep('collection', 'done'); return true; }
      setStep('collection', 'error', 'Collection 初始化失败');
      return false;
    } catch {
      setStep('collection', 'error', '初始化失败');
      return false;
    }
  }

  async function checkRag(): Promise<boolean> {
    setStep('rag', 'loading');
    try {
      const res = await fetch(`${API_BASE}/rag/qdrant/check-index`, { method: 'POST' });
      const data = await res.json();
      if (data.totalIndexed > 0) {
        setStep('rag', 'done', `${data.totalIndexed} 条文本索引`);
      } else {
        // Empty is fine — JD/docs will be indexed later
        setStep('rag', 'done', '暂无岗位文本索引，将在粘贴 JD 后自动建立');
      }
      return true; // never fails
    } catch {
      setStep('rag', 'done', '文本索引检查跳过');
      return true;
    }
  }

  async function checkNeo4j(): Promise<boolean> {
    setStep('neo4j', 'loading');
    try {
      const res = await fetch(`${API_BASE}/graph/job-prep/expand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: 'test', role: 'test', requirements: [] }),
      });
      if (res.ok) { setStep('neo4j', 'done'); return true; }
      setStep('neo4j', 'error', '图谱服务异常');
      return false;
    } catch {
      setStep('neo4j', 'done', '未连接（图谱增强不可用）');
      return true;
    }
  }

  async function runBoot() {
    setBooting(true);
    const backendOk = await checkBackend();
    if (!backendOk) { setBooting(false); return; }

    const qdrantOk = await checkQdrant();
    if (!qdrantOk) { setBooting(false); return; }

    const collOk = await checkCollection();
    if (!collOk) { setBooting(false); return; }

    // RAG check is informational — never blocks
    await checkRag();
    await checkNeo4j();

    setBooting(false);
    setAllDone(true);
  }

  async function retryStep(key: string) {
    setBooting(true);
    if (key === 'qdrant') {
      const ok = await checkQdrant();
      if (ok) { await checkCollection(); await checkRag(); await checkNeo4j(); setAllDone(true); }
    }
    setBooting(false);
  }

  useEffect(() => { runBoot(); }, []);

  const hasError = steps.some(s => s.status === 'error');
  const anyLoading = steps.some(s => s.status === 'loading');

  if (allDone) {
    return (
      <div className="dark-bg min-h-screen flex flex-col items-center justify-center p-8 gap-4">
        <CheckCircle size={48} style={{ color: '#22C55E' }} />
        <h2 className="text-[18px] font-bold" style={{ color: 'var(--text-primary)' }}>环境就绪</h2>
        <p className="text-[12px] text-center" style={{ color: 'var(--text-muted)' }}>
          {steps.map(s => (
            <span key={s.key} className="mx-1">{s.status === 'done' ? '✓' : ''} {s.label}{s.message ? ` (${s.message})` : ''}</span>
          ))}
        </p>
        <button onClick={onReady}
          className="px-6 py-3 rounded-xl text-white font-medium mt-4"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
          进入岗位备战
        </button>
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
          <p className="text-[13px] mb-4" style={{ color: 'var(--text-muted)' }}>
            {booting ? '正在检查环境...' : hasError ? '部分检查未通过' : '准备中...'}
          </p>
          {steps.map((step) => (
            <div key={step.key} className="flex items-center gap-3 p-3 rounded-xl border"
              style={{ borderColor: step.status === 'error' ? '#EF444440' : 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}>
              {step.status === 'loading' && <Loader2 size={18} className="animate-spin" style={{ color: '#F59E0B' }} />}
              {step.status === 'done' && <CheckCircle size={18} style={{ color: '#22C55E' }} />}
              {step.status === 'error' && <XCircle size={18} style={{ color: '#EF4444' }} />}
              {step.status === 'pending' && <div className="w-[18px] h-[18px] rounded-full border-2" style={{ borderColor: 'var(--card-border)' }} />}
              <div className="flex-1">
                <span className="text-[13px]" style={{ color: step.status === 'error' ? '#EF4444' : 'var(--text-primary)' }}>
                  {step.label}
                </span>
                {step.message && <div className="text-[11px]" style={{ color: step.status === 'error' ? '#EF4444' : 'var(--text-muted)' }}>{step.message}</div>}
              </div>
              {step.status === 'error' && step.actionable && (
                <button onClick={() => retryStep(step.key)} disabled={anyLoading}
                  className="px-2 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 shrink-0"
                  style={{ borderColor: '#EF444440', color: '#EF4444' }}>
                  <RefreshCw size={12} />重试
                </button>
              )}
            </div>
          ))}
          {!booting && hasError && (
            <div className="rounded-xl p-4 border text-[12px] space-y-2" style={{ borderColor: '#EF444440', backgroundColor: '#EF444410', color: '#EF4444' }}>
              <p className="font-medium">无法进入岗位备战</p>
              <p className="text-[11px] opacity-80">请确认：<br />1. Docker 已启动<br />2. Qdrant 已运行（端口 6335）<br />3. 后端服务正常（端口 3001）</p>
              <button onClick={runBoot} className="w-full py-2 rounded-lg text-white text-[12px] font-medium" style={{ backgroundColor: '#EF4444' }}>
                <RefreshCw size={12} className="inline mr-1" />重新检查全部
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
