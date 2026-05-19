import { useState, useRef } from 'react';
import { ArrowLeft, Moon, Sun, User, Download, Upload } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { exportProgress, importProgress, exportProgressCSV, importProgressCSV } from '../utils/backup';

interface Props {
  onBack: () => void;
}

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const BLUE = 'var(--blue)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';

export default function ProfilePage({ onBack }: Props) {
  const { state, dispatch } = useAppContext();
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      if (format === 'json') { await exportProgress(); }
      else { await exportProgressCSV(); }
      setMsg({ type: 'success', text: '导出成功' });
      setShowExportOptions(false);
    } catch { setMsg({ type: 'error', text: '导出失败' }); }
  };
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = file.name.endsWith('.csv')
      ? await importProgressCSV(file)
      : await importProgress(file);
    setMsg({ type: result.success ? 'success' : 'error', text: result.message });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center">
        <button onClick={onBack} className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="nav-title">我的</h1>
        <button onClick={() => dispatch({ type: 'TOGGLE_DARK' })} className="p-1">
          {state.isDark ? <Sun className="w-5 h-5" style={{ color: '#FBBF24' }} /> : <Moon className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />}
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-8 pb-24">

        {/* Profile Card */}
        <div className="rounded-2xl p-5 mb-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(40,130,215,0.15)' }}>
              <User className="w-6 h-6" style={{ color: BLUE }} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold" style={{ color: TEXT_PRIMARY }}>面经闪卡用户</h2>
              <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>持续学习中</p>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <h2 className="text-[14px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>设置</h2>
          <div className="space-y-1">
            <SettingRow label="深色模式" right={
              <button onClick={() => dispatch({ type: 'TOGGLE_DARK' })} className="w-11 h-6 rounded-full relative transition-colors" style={{ backgroundColor: state.isDark ? BLUE : '#CBD5E1' }}>
                <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform" style={{ left: state.isDark ? '22px' : '2px' }} />
              </button>
            } />
            <SettingRow label="版本" right={<span className="text-[13px]" style={{ color: TEXT_MUTED }}>0.3.6</span>} />
            <SettingRow label="数据存储路径" right={<span className="text-[11px] text-right max-w-[180px] truncate" style={{ color: TEXT_MUTED }}>~/Documents/interview-flashcards/</span>} />
          </div>
        </div>

        {/* 数据存储 */}
        <div className="rounded-2xl p-5 mt-4 border" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
          <h2 className="text-[14px] font-bold mb-3" style={{ color: TEXT_PRIMARY }}>数据存储</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowExportOptions(!showExportOptions)} className="flex-1 py-2 rounded-xl text-[13px] font-medium flex items-center justify-center gap-1 relative" style={{ backgroundColor: 'rgba(40,130,215,0.2)', color: BLUE }}>
              <Download className="w-4 h-4" />导出
            </button>
            <button onClick={() => fileRef.current?.click()} className="flex-1 py-2 rounded-xl text-[13px] font-medium flex items-center justify-center gap-1" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: TEXT_MUTED }}>
              <Upload className="w-4 h-4" />导入
            </button>
            <input ref={fileRef} type="file" accept=".json,.csv" onChange={handleImport} className="hidden" />
          </div>
          {showExportOptions && (
            <div className="flex gap-2 mt-2">
              <button onClick={() => handleExport('json')} className="flex-1 py-1.5 rounded-lg text-[12px] font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: TEXT_MUTED }}>JSON</button>
              <button onClick={() => handleExport('csv')} className="flex-1 py-1.5 rounded-lg text-[12px] font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: TEXT_MUTED }}>CSV</button>
            </div>
          )}
          {msg && <p className="text-[11px] mt-2" style={{ color: msg.type === 'success' ? '#22C55E' : '#EF4444' }}>{msg.text}</p>}
        </div>

      </div>
      </div>
    </div>
  );
}

function SettingRow({ label, right }: { label: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--card-border)' }}>
      <span className="text-[13px]" style={{ color: TEXT_PRIMARY }}>{label}</span>
      {right}
    </div>
  );
}
