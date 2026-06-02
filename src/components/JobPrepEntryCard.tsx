// Job Prep entry card for Agent Hub

import { useState, useEffect } from 'react';
import { Briefcase, ChevronRight } from 'lucide-react';
import { API_BASE } from '../api/client';

interface Props {
  onEnter: () => void;
}

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';
const ORANGE = '#F59E0B';

export default function JobPrepEntryCard({ onEnter }: Props) {
  const [latest, setLatest] = useState<{ role?: string; company?: string } | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/job-prep/sessions`)
      .then(r => r.json())
      .then((sessions: any[]) => {
        if (sessions?.length > 0) setLatest(sessions[0]);
      })
      .catch(() => {});
  }, []);

  return (
    <button
      onClick={onEnter}
      className="group relative flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left backdrop-blur-xl hover:bg-white/45 dark:hover:bg-white/12"
      style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${ORANGE}22` }}>
        <Briefcase className="h-[22px] w-[22px]" color={ORANGE} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[15px] font-bold leading-tight" style={{ color: TEXT_PRIMARY }}>岗位备战</h3>
        <p className="mt-1 text-[12px] leading-snug" style={{ color: TEXT_MUTED }}>
          {latest ? `最近: ${latest.company || ''} ${latest.role || ''}` : '为目标岗位生成复习计划'}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: TEXT_MUTED }} />
    </button>
  );
}
