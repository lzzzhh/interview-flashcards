// src/components/IngestPage.tsx — 资料制卡（文档上传）
import { useState } from 'react';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { apiPost } from '../api/client';

interface IngestResult {
  sourceId: string;
  fileName: string;
  sourceType: string;
  chunkCount: number;
  fullTextLength: number;
  warnings: string[];
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

export default function IngestPage({ onBack, onNavigate }: Props) {
  const [filePath, setFilePath] = useState('');
  const [targetDeckId, setTargetDeckId] = useState('custom-ingest');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'parsing' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<{ generated: number } | null>(null);

  const handleSubmit = async () => {
    if (!filePath.trim()) { setError('请输入文件路径'); return; }
    setError('');
    setStatus('uploading');

    try {
      const ext = filePath.split('.').pop()?.toLowerCase() || '';
      const typeMap: Record<string, string> = { pdf: 'pdf', docx: 'docx', doc: 'docx', txt: 'txt', md: 'md' };
      const fileType = typeMap[ext] || 'txt';

      setStatus('parsing');
      const res = await apiPost<IngestResult>('/ingest/documents', {
        filePath,
        fileType,
        targetDeckId,
      });

      setResult(res);
      setStatus('done');
    } catch (err: any) {
      setError(err.message || '上传失败');
      setStatus('error');
    }
  };

  const handleGenerateDrafts = async () => {
    if (!result) return;
    setGenerating(true);
    try {
      const res = await apiPost<{ generated: number }>('/card-drafts/generate', {
        sourceId: result.sourceId,
        deckId: targetDeckId,
      });
      setGenResult(res);
    } catch (err: any) {
      setError('生成草稿失败: ' + (err.message || ''));
    } finally {
      setGenerating(false);
    }
  };

  const isDone = status === 'done' && result;

  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center">
        <button onClick={onBack} className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} />
        </button>
        <h1 className="nav-title">资料制卡</h1>
      </div>

      <div className="flex-1 flex items-start justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-6 pb-24 space-y-4">
          {/* 说明 */}
          <div className="rounded-xl p-3 border text-[13px]" style={{ backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30`, color: TEXT_MUTED }}>
            上传 PDF、Word、TXT 或 Markdown 文档，AI 将自动提取知识点并生成复习卡片。
          </div>

          {/* 文件路径输入 */}
          {!isDone && (
            <>
              <div className="space-y-2">
                <label className="text-[13px] font-medium" style={{ color: TEXT_PRIMARY }}>文件路径</label>
                <input
                  type="text"
                  value={filePath}
                  onChange={e => setFilePath(e.target.value)}
                  placeholder="例如：/Users/name/Documents/面试宝典.pdf"
                  className="w-full rounded-lg border px-3 py-2.5 text-[13px] bg-transparent"
                  style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
                  disabled={status === 'uploading' || status === 'parsing'}
                />
                <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                  支持 PDF、DOCX、TXT、MD 格式
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-medium" style={{ color: TEXT_PRIMARY }}>目标牌组</label>
                <input
                  type="text"
                  value={targetDeckId}
                  onChange={e => setTargetDeckId(e.target.value)}
                  placeholder="custom-ingest"
                  className="w-full rounded-lg border px-3 py-2.5 text-[13px] bg-transparent"
                  style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
                  disabled={status === 'uploading' || status === 'parsing'}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={status === 'uploading' || status === 'parsing' || !filePath.trim()}
                className="w-full rounded-xl p-3.5 flex items-center justify-center gap-2 text-[14px] font-medium transition-opacity disabled:opacity-40"
                style={{ backgroundColor: ACCENT, color: '#fff' }}
              >
                {(status === 'uploading' || status === 'parsing') ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> 解析中...</>
                ) : (
                  <><Upload className="w-4 h-4" /> 开始解析</>
                )}
              </button>
            </>
          )}

          {/* 错误 */}
          {error && (
            <div className="rounded-xl p-3 border flex items-start gap-2 text-[13px]" style={{ borderColor: '#EF444430', backgroundColor: '#EF444410', color: '#EF4444' }}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 结果 */}
          {isDone && (
            <div className="space-y-4">
              <div className="rounded-xl p-4 border space-y-2" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" style={{ color: ACCENT }} />
                  <span className="text-[14px] font-bold" style={{ color: TEXT_PRIMARY }}>解析完成</span>
                </div>
                <div className="text-[13px] space-y-1" style={{ color: TEXT_MUTED }}>
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{result.fileName}（{result.sourceType}）</span>
                  </div>
                  <div>文本长度：{result.fullTextLength.toLocaleString()} 字符</div>
                  <div>分块数：{result.chunkCount}</div>
                </div>
                {result.warnings.length > 0 && (
                  <div className="text-[12px] mt-1" style={{ color: '#F59E0B' }}>
                    {result.warnings.join('；')}
                  </div>
                )}
              </div>

              {!genResult ? (
                <button
                  onClick={handleGenerateDrafts}
                  disabled={generating}
                  className="w-full rounded-xl p-3.5 flex items-center justify-center gap-2 text-[14px] font-medium transition-opacity disabled:opacity-40"
                  style={{ backgroundColor: '#8B5CF6', color: '#fff' }}
                >
                  {generating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> LLM 生成卡片中...</>
                  ) : (
                    <>✨ 生成复习卡片</>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('drafts')}
                  className="w-full rounded-xl p-3.5 flex items-center justify-center gap-2 text-[14px] font-medium"
                  style={{ backgroundColor: ACCENT, color: '#fff' }}
                >
                  查看草稿（{genResult.generated} 张）
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => { setStatus('idle'); setResult(null); setGenResult(null); setError(''); setFilePath(''); }}
                className="w-full rounded-xl p-3 text-[13px] text-center"
                style={{ color: TEXT_MUTED }}
              >
                重新上传文档
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
