'use client';

import { Lightbulb } from 'lucide-react';

interface SuggestionsCardProps {
  suggestions: string[];
}

const SUGGESTION_ICONS = ['🎯', '📊', '🔗', '📧', '💡'];

export function SuggestionsCard({ suggestions }: SuggestionsCardProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-purple-400" />
        </div>
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
          AI Improvement Suggestions
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {suggestions.map((suggestion, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-purple-500/20 transition-colors duration-200 slide-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="text-lg flex-shrink-0 mt-0.5">{SUGGESTION_ICONS[i] || '✨'}</span>
            <p className="text-sm text-white/70 leading-relaxed">{suggestion}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
