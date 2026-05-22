// ============================================================
// src/components/ProgressBar.tsx
// ============================================================

interface ProgressBarProps {
  current: number;
  total: number;
  mastered: number;
}

export default function ProgressBar({ current, total, mastered }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return (
    <div className="w-full">
      {/* Text */}
      <div className="flex justify-between items-center mb-1 text-xs text-gray-700 dark:text-gray-400">
        <span>
          第 {current + 1} / 共 {total} 张
        </span>
        <span>{pct}%</span>
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
