'use client';

import { AlertTriangle } from 'lucide-react';

interface RiskFlagProps {
  flags: string[];
}

export function RiskFlags({ flags }: RiskFlagProps) {
  if (!flags || flags.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-5 border border-amber-500/20">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
          Risk Flags
        </h3>
      </div>
      <div className="flex flex-col gap-2">
        {flags.map((flag, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 text-sm text-white/70"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
            <span>{flag}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
