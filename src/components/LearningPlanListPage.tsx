// src/components/LearningPlanListPage.tsx — 我的学习清单
import { useState } from 'react';
import { ArrowLeft, Trash2, ChevronRight, ListChecks, CheckCircle } from 'lucide-react';
import { loadPlans, deletePlan, type LearningPlan } from '../utils/learningPlans';

interface Props {
  onBack: () => void;
  onViewPlan: (id: string) => void;
}

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';
const GREEN = '#10B981';

export default function LearningPlanListPage({ onBack, onViewPlan }: Props) {
  const [plans, setPlans] = useState<LearningPlan[]>(() => {
    const loaded = loadPlans();
    return loaded;
  });

  const handleDelete = (id: string) => {
    deletePlan(id);
    setPlans(loadPlans());
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center">
        <button onClick={onBack} className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" style={{ color: TEXT_PRIMARY }} />
        </button>
        <h1 className="nav-title">学习清单</h1>
      </div>

      <div className="flex-1 flex items-start justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-6 pb-24">
          {plans.length === 0 ? (
            <div className="text-center mt-12">
              <ListChecks className="w-10 h-10 mx-auto mb-3" style={{ color: TEXT_MUTED }} />
              <p className="text-[13px]" style={{ color: TEXT_MUTED }}>暂无学习清单</p>
              <p className="text-[11px] mt-1" style={{ color: TEXT_MUTED }}>在 AI 搜索中生成学习清单后会出现在这里</p>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => {
                const completedCount = plan.items.filter(i => i.completed).length;
                const totalCount = plan.items.length;
                const allDone = completedCount === totalCount;
                return (
                <div
                  key={plan.id}
                  className="rounded-xl border overflow-hidden transition-colors"
                  style={{
                    backgroundColor: allDone ? 'rgba(16,185,129,0.05)' : CARD_BG,
                    borderColor: allDone ? GREEN : CARD_BORDER,
                  }}
                >
                  <button
                    onClick={() => onViewPlan(plan.id)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[14px] font-bold truncate" style={{ color: allDone ? GREEN : TEXT_PRIMARY }}>{plan.title}</h3>
                        {allDone && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: GREEN }}>已完成</span>
                        )}
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: allDone ? GREEN : TEXT_MUTED }}>
                        {completedCount}/{totalCount} 张卡片 · {formatDate(plan.createdAt)}
                      </p>
                    </div>
                    {allDone ? (
                      <CheckCircle className="w-4 h-4 shrink-0" style={{ color: GREEN }} />
                    ) : (
                      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: TEXT_MUTED }} />
                    )}
                  </button>
                  <div className="border-t flex" style={{ borderColor: allDone ? GREEN : CARD_BORDER }}>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="flex-1 py-2 flex items-center justify-center gap-1.5 text-[11px] transition-colors hover:bg-red-50 dark:hover:bg-red-900/10"
                      style={{ color: '#EF4444' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      删除
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
