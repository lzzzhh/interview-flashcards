import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import StatsDashboard from './StatsDashboard';
import type { Category } from '../types';

interface Props {
  onBack: () => void;
  category?: Category;
}

const TEXT_PRIMARY = '#F8FAFC';

export default function StatsPage({ onBack, category }: Props) {
  const { dispatch } = useAppContext();

  useEffect(() => {
    dispatch({ type: 'TOGGLE_STATS' });
    return () => { dispatch({ type: 'TOGGLE_STATS' }); };
  }, [dispatch]);

  return (
    <div className="dark-bg homepage-glass-stage flex min-h-screen items-center justify-center transition-colors">
      <div className="relative z-10 w-full max-w-md px-5 py-8 pb-24">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} />
          </button>
          <h1 className="text-[20px] font-bold" style={{ color: TEXT_PRIMARY }}>学习统计</h1>
        </div>

        <StatsDashboard category={category} />
      </div>
    </div>
  );
}
