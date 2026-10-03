'use client';

import { useMemo } from 'react';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  animate?: boolean;
}

export function ScoreRing({ score, size = 200, strokeWidth = 14, animate = true }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Only fill ~75% of the circle (270 degrees) for gauge effect
  const gaugeCircumference = circumference * 0.75;
  const offset = gaugeCircumference - (score / 100) * gaugeCircumference;

  const { color, label, ringGradientId } = useMemo(() => {
    const id = `score-gradient-${Math.random().toString(36).slice(2)}`;
    if (score >= 80) return { color: '#10B981', label: 'Excellent', ringGradientId: id };
    if (score >= 60) return { color: '#3B82F6', label: 'Good', ringGradientId: id };
    if (score >= 40) return { color: '#F59E0B', label: 'Fair', ringGradientId: id };
    return { color: '#EF4444', label: 'Poor', ringGradientId: id };
  }, [score]);

  const center = size / 2;
  // Rotate so the gap is at the bottom center
  const rotation = 135;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <defs>
          <linearGradient id={ringGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${gaugeCircumference} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Score fill */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${ringGradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={`${gaugeCircumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: animate ? 'stroke-dashoffset 1.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            filter: `drop-shadow(0 0 8px ${color}88)`,
          }}
        />
      </svg>

      {/* Score label */}
      <div className="relative flex flex-col items-center justify-center z-10">
        <span
          className="font-black leading-none"
          style={{
            fontSize: size * 0.28,
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {score}
        </span>
        <span className="text-xs text-white/40 font-medium mt-1 tracking-widest uppercase">
          / 100
        </span>
        <span
          className="text-xs font-semibold mt-1 tracking-wider uppercase"
          style={{ color }}
        >
          {label}
        </span>
      </div>

      {/* Subtle glow */}
      <div
        className="absolute inset-0 rounded-full opacity-10 blur-xl"
        style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }}
      />
    </div>
  );
}
