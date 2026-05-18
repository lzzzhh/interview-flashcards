import { ArrowLeft, Moon, Sun, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface Props {
  onBack: () => void;
}

const TEXT_PRIMARY = '#F8FAFC';
const TEXT_MUTED = 'rgba(226,232,240,0.85)';
const TEXT_SECONDARY = 'rgba(226,232,240,0.98)';
const BLUE = '#2882d7';
const CARD_BG = 'rgba(255,255,255,0.15)';
const CARD_BORDER = 'rgba(255,255,255,0.3)';

export default function ProfilePage({ onBack }: Props) {
  const { state, dispatch } = useAppContext();

  return (
    <div className="dark-bg homepage-glass-stage flex min-h-screen items-center justify-center transition-colors">
      <div className="relative z-10 w-full max-w-md px-5 py-8 pb-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} />
          </button>
          <h1 className="text-[20px] font-bold flex-1" style={{ color: TEXT_PRIMARY }}>我的</h1>
          <button onClick={() => dispatch({ type: 'TOGGLE_DARK' })} className="p-2">
            {state.isDark ? (
              <Sun className="w-5 h-5" style={{ color: '#FBBF24' }} />
            ) : (
              <Moon className="w-5 h-5" style={{ color: TEXT_SECONDARY }} />
            )}
          </button>
        </div>

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
              <button onClick={() => dispatch({ type: 'TOGGLE_DARK' })} className="w-11 h-6 rounded-full relative transition-colors" style={{ backgroundColor: state.isDark ? BLUE : 'rgba(255,255,255,0.2)' }}>
                <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform" style={{ left: state.isDark ? '22px' : '2px' }} />
              </button>
            } />
            <SettingRow label="版本" right={<span className="text-[13px]" style={{ color: TEXT_MUTED }}>0.3.6</span>} />
            <SettingRow label="数据存储路径" right={<span className="text-[11px] text-right max-w-[180px] truncate" style={{ color: TEXT_MUTED }}>~/Documents/interview-flashcards/</span>} />
          </div>
        </div>

      </div>
    </div>
  );
}

function SettingRow({ label, right }: { label: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-b-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <span className="text-[13px]" style={{ color: TEXT_PRIMARY }}>{label}</span>
      {right}
    </div>
  );
}
