// ============================================================
// src/components/TagRadar.tsx — 标签掌握度雷达图
// ============================================================

import { useMemo } from 'react';

interface Props {
  tagScores: { tag: string; score: number }[];
  size?: number;
}

export default function TagRadar({ tagScores, size = 200 }: Props) {
  const data = useMemo(() => {
    const n = Math.max(3, tagScores.length);
    const scores = tagScores.map((t) => Math.max(0.1, Math.min(1, (t.score + 2) / 4.5))); // normalize to 0-1
    return { labels: tagScores.map((t) => t.tag), scores, n };
  }, [tagScores]);

  const { labels, scores, n } = data;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.35;

  const getPoint = (i: number, value: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      x: cx + r * value * Math.cos(angle),
      y: cy + r * value * Math.sin(angle),
      lx: cx + (r + 18) * Math.cos(angle),
      ly: cy + (r + 18) * Math.sin(angle),
    };
  };

  const dataPoints = scores.map((s, i) => getPoint(i, s));
  const pathData = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  const levels = [0.25, 0.5, 0.75, 1];
  const levelPolygons = levels.map((level) => {
    return Array.from({ length: n }, (_, i) => {
      const p = getPoint(i, level);
      return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
    }).join(' ') + ' Z';
  });

  const axisLines = Array.from({ length: n }, (_, i) => {
    const outer = getPoint(i, 1);
    return { x1: cx, y1: cy, x2: outer.x, y2: outer.y };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Level polygons */}
      {levelPolygons.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
      ))}
      {/* Axis lines */}
      {axisLines.map((line, i) => (
        <line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#e2e8f0" strokeWidth="0.5" />
      ))}
      {/* Data polygon */}
      <path d={pathData} fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" strokeWidth="1.5" />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" />
      ))}
      {/* Labels */}
      {dataPoints.map((p, i) => (
        <text
          key={i}
          x={p.lx}
          y={p.ly}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[9px] fill-gray-500 dark:fill-gray-400"
        >
          {labels[i]}
        </text>
      ))}
    </svg>
  );
}
