// ============================================================
// src/components/ProgressBar.tsx
// ============================================================

interface ProgressBarProps {
  current: number;
  total: number;
  mastered: number;
}

export default function ProgressBar({ current, total, mastered }: ProgressBarProps) {
  const completed = total > 0 ? Math.min(total, Math.max(0, mastered)) : 0;
  const currentPosition = total > 0 ? Math.min(total, Math.max(1, current + 1)) : 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="w-full">
      {/* Text */}
      <div className="flex justify-between items-center mb-1 text-xs text-gray-700 dark:text-gray-400">
        <span>
          第 {currentPosition} / 共 {total} 张
        </span>
        <span>已完成 {completed}/{total} · {pct}%</span>
      </div>

      {/* Bar */}
      <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
