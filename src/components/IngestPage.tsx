// src/components/IngestPage.tsx — 资料制卡（文档上传）
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, Loader2, ChevronRight, UploadCloud, ChevronDown } from 'lucide-react';
import { API_BASE } from '../api/client';
import { CATEGORIES } from '../constants';
import { loadCustomDecks } from '../utils/customDecks';
import { getDecks } from '../api/documents';
import { useDocumentQueue } from '../hooks/useDocumentQueue';

interface IngestResult {
  sourceId: string;
  fileName: string;
  sourceType: string;
  chunkCount: number;
  fullTextLength: number;
  warnings: string[];
  draftCount?: number;
}

interface Props {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';
const ACCENT = '#10B981';
const ACCEPTED_TYPES = '.pdf,.txt,.md';

export default function IngestPage({ onBack, onNavigate }: Props) {
  const [filePath, setFilePath] = useState('');
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [targetDeckId, setTargetDeckId] = useState('statistics');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'parsing' | 'queued' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const { addToQueue } = useDocumentQueue();
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDeckMenu, setShowDeckMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deckMenuRef = useRef<HTMLDivElement>(null);

  const [deckOptions, setDeckOptions] = useState<{ id: string; label: string }[]>(
    CATEGORIES.map(c => ({ id: c.key, label: c.label }))
  );

  // Merge API decks + file-storage custom decks
  useEffect(() => {
    const apiDecks = getDecks().then(decks => decks.map(d => ({ id: d.id, label: d.name })));
    const fileDecks = loadCustomDecks().map(d => ({ id: d.id, label: d.name }));
    apiDecks.then(list => {
      const seen = new Set(CATEGORIES.map(c => c.key));
      const extra = [...fileDecks, ...list].filter(d => !seen.has(d.id));
      setDeckOptions([...CATEGORIES.map(c => ({ id: c.key, label: c.label })), ...extra]);
    });
  }, []);

  useEffect(() => {
    if (!showDeckMenu) return;
    const h = (e: MouseEvent) => {
      if (deckMenuRef.current && !deckMenuRef.current.contains(e.target as Node)) setShowDeckMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showDeckMenu]);

  const readError = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text).error || text || `请求失败: ${res.status}`;
    } catch {
      return text || `请求失败: ${res.status}`;
    }
  };

  const fetchJson = async (url: string, init?: RequestInit) => {
    try {
      const res = await fetch(url, init);
      if (!res.ok) throw new Error(await readError(res));
      return res.json();
    } catch (err: any) {
      if (err?.message === 'Load failed' || err?.message === 'Failed to fetch') {
        throw new Error('无法连接本地后端，请确认桌面端后端已启动后重试');
      }
      throw err;
    }
  };

  const handleSubmit = async () => {
    if (!droppedFile) { setError('请先选择文件'); return; }
    setError('');
    setProgressMessage('');
    setStatus('uploading');
    try {
      const formData = new FormData();
      formData.append('targetDeckId', targetDeckId);
      formData.append('file', droppedFile!);
      const data = await fetchJson(`${API_BASE}/documents/process`, { method: 'POST', body: formData });
      const docId = data.sourceId || data.id;
      addToQueue(docId, data.filename || droppedFile!.name || filePath);
      setFilePath('');
      setDroppedFile(null);
      setStatus('queued');
      setProgressMessage('');
    } catch (err: any) {
      setError(err.message || '上传失败');
      setStatus('error');
    }
  };

  const chooseFile = async () => {
    // Use HTML file input — works in both browser and Tauri
    fileInputRef.current?.click();
  };

  const handleFileDrop = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['pdf', 'txt', 'md'].includes(ext)) {
      setError(`不支持的格式 .${ext}`);
      setStatus('error');
      return;
    }
    setDroppedFile(file);
    const path = (file as any).path || file.name;
    setFilePath(path);
    setError('');
    setProgressMessage('');
    setStatus('idle');
  };

  const isDone = status === 'done' && result;

  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center gap-3">
        <button onClick={onBack} className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} />
        </button>
        <FileText className="w-5 h-5" style={{ color: ACCENT }} />
        <h1 className="nav-title">资料制卡</h1>
      </div>

      <div className="flex-1 flex items-start justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-6 pb-24 space-y-4">
          <div className="rounded-xl p-3 border text-[13px]" style={{ backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30`, color: TEXT_MUTED }}>
            上传 PDF、TXT 或 Markdown 文档，AI 将自动提取知识点并生成复习卡片。
          </div>

          {!isDone && (
            <>
              {/* 拖拽上传区域 */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
                onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFileDrop(f); }}
                onClick={chooseFile}
                className="rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                style={{
                  borderColor: isDragOver ? ACCENT : CARD_BORDER,
                  backgroundColor: isDragOver ? `${ACCENT}08` : 'transparent',
                }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${ACCENT}15` }}>
                  {isDragOver ? <UploadCloud className="w-6 h-6" style={{ color: ACCENT }} /> : <Upload className="w-6 h-6" style={{ color: ACCENT }} />}
                </div>
                {isDragOver ? (
                  <p className="text-[13px] font-medium" style={{ color: ACCENT }}>释放文件</p>
                ) : (
                  <>
                    <p className="text-[13px] font-medium" style={{ color: TEXT_PRIMARY }}>拖拽文件到此处</p>
                    <p className="text-[11px]" style={{ color: TEXT_MUTED }}>或点击选择 · 支持 PDF / TXT / MD</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileDrop(f); }} className="hidden" />
              </div>

              {/* 文件路径 */}
              <div className="space-y-2">
                <label className="text-[13px] font-medium" style={{ color: TEXT_PRIMARY }}>文件路径</label>
                <input
                  type="text"
                  value={filePath}
                  readOnly
                  placeholder="选择文件后自动填充"
                  className="w-full rounded-lg border px-3 py-2.5 text-[13px] bg-transparent"
                  style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
                />
              </div>

              {/* 目标牌组下拉 */}
              <div className="space-y-2">
                <label className="text-[13px] font-medium" style={{ color: TEXT_PRIMARY }}>选择牌组</label>
                <div className="relative" ref={deckMenuRef}>
                  <button
                    onClick={() => setShowDeckMenu(!showDeckMenu)}
                    disabled={status === 'uploading' || status === 'parsing'}
                    className="w-full rounded-lg border px-3 py-2.5 text-[13px] text-left flex items-center justify-between bg-transparent"
                    style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
                  >
                    <span className="truncate">{deckOptions.find(d => d.id === targetDeckId)?.label || targetDeckId}</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${showDeckMenu ? 'rotate-180' : ''}`} style={{ color: TEXT_MUTED }} />
                  </button>
                  {showDeckMenu && (
                    <div className="absolute left-0 right-0 top-full mt-1 rounded-xl border py-1.5 z-20 max-h-56 overflow-y-auto shadow-lg" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                      {deckOptions.map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => { setTargetDeckId(opt.id); setShowDeckMenu(false); }}
                          className="w-full text-left px-3 py-2 text-[13px] truncate"
                          style={{ color: targetDeckId === opt.id ? ACCENT : TEXT_PRIMARY, backgroundColor: targetDeckId === opt.id ? `${ACCENT}12` : 'transparent' }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={status === 'uploading' || status === 'parsing' || !droppedFile}
                className="w-full rounded-xl p-3.5 flex items-center justify-center gap-2 text-[14px] font-medium transition-opacity disabled:opacity-40"
                style={{ backgroundColor: ACCENT, color: '#fff' }}
              >
                {(status === 'uploading' || status === 'parsing') ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> 解析中...</>
                ) : (
                  <><Upload className="w-4 h-4" /> 开始解析</>
                )}
              </button>

              {(status === 'uploading' || status === 'parsing') && progressMessage && (
                <div className="text-center text-[12px]" style={{ color: TEXT_MUTED }}>{progressMessage}</div>
              )}

              {status === 'queued' && (
                <div className="rounded-xl p-3 border flex items-center gap-2 text-[13px]" style={{ borderColor: `${ACCENT}40`, backgroundColor: `${ACCENT}10` }}>
                  <CheckCircle className="w-4 h-4" style={{ color: ACCENT }} />
                  <span style={{ color: TEXT_PRIMARY }}>已加入后台队列，可继续上传</span>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="rounded-xl p-3 border flex items-start gap-2 text-[13px]" style={{ borderColor: '#EF444430', backgroundColor: '#EF444410', color: '#EF4444' }}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isDone && (
            <div className="space-y-4">
              <div className="rounded-xl p-4 border space-y-2" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" style={{ color: ACCENT }} />
                  <span className="text-[14px] font-bold" style={{ color: TEXT_PRIMARY }}>解析完成</span>
                </div>
                <div className="text-[13px] space-y-1" style={{ color: TEXT_MUTED }}>
                  <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /><span>{result.fileName}（{result.sourceType}）</span></div>
                  <div>文本长度：{(result.fullTextLength ?? 0).toLocaleString()} 字符</div>
                  <div>分块数：{(result.chunkCount ?? 0)}</div>
                </div>
                {(result.warnings?.length ?? 0) > 0 && <div className="text-[12px] mt-1" style={{ color: '#F59E0B' }}>{result.warnings.join('；')}</div>}
              </div>

               <button onClick={() => onNavigate(result?.sourceId ? `drafts:${result.sourceId}` : 'drafts')} className="w-full rounded-xl p-3.5 flex items-center justify-center gap-2 text-[14px] font-medium" style={{ backgroundColor: ACCENT, color: '#fff' }}>
                 查看草稿（{result.draftCount ?? 0} 张）<ChevronRight className="w-4 h-4" />
              </button>

              <button onClick={() => { setStatus('idle'); setResult(null); setError(''); setProgressMessage(''); setFilePath(''); }} className="w-full rounded-xl p-3 text-[13px] text-center" style={{ color: TEXT_MUTED }}>
                重新上传文档
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
