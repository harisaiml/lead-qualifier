'use client';

interface ScoreBarProps {
  label: string;
  score: number;
  icon: string;
  delay?: number;
}

const SCORE_COLORS: Record<string, { from: string; to: string }> = {
  excellent: { from: '#10B981', to: '#059669' },
  good: { from: '#3B82F6', to: '#6366F1' },
  fair: { from: '#F59E0B', to: '#EF4444' },
  poor: { from: '#EF4444', to: '#DC2626' },
};

function getScoreCategory(score: number): string {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

export function ScoreBar({ label, score, icon, delay = 0 }: ScoreBarProps) {
  const category = getScoreCategory(score);
  const colors = SCORE_COLORS[category];

  return (
    <div
      className="flex flex-col gap-1.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-white/70">
          <span>{icon}</span>
          <span className="font-medium">{label}</span>
        </div>
        <span
          className="font-bold text-sm"
          style={{ color: colors.from }}
        >
          {score}
        </span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden bg-white/5">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`,
            boxShadow: `0 0 8px ${colors.from}66`,
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}
