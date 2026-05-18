import { ArrowLeft, Moon, Sun, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

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
