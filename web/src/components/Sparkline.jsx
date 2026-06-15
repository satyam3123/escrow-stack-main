import { useId } from 'react';

/** Refined SVG sparkline: gradient area, hairline stroke, glowing leading dot. */
export default function Sparkline({ data = [], up = true, width = 280, height = 60 }) {
  const gradientId = useId();

  if (!data || data.length < 2) {
    return <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full" preserveAspectRatio="none" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pad = 6;
  const y = (v) => height - pad - ((v - min) / range) * (height - pad * 2);

  const points = data.map((v, i) => [i * stepX, y(v)]);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${width} ${height} L0 ${height} Z`;
  const color = up ? 'var(--color-up)' : 'var(--color-down)';
  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} opacity="0.25" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="1.8" fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
