import { ArrowLeft } from 'lucide-react';

interface Props {
  onClick: () => void;
  label?: string;
  className?: string;
}

export default function BackButton({ onClick, label = '返回', className = '' }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-slate-200/70 dark:hover:bg-white/10 ${className}`}
      style={{ color: 'var(--text-primary)' }}
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}
