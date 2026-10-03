'use client';

import { Loader2, Zap } from 'lucide-react';

interface LoadingStateProps {
  stage: 'scraping' | 'analyzing' | 'saving';
}

const STAGES = {
  scraping: {
    label: 'Scraping website...',
    sublabel: 'Extracting content, emails, and signals',
    icon: '🌐',
    progress: 30,
  },
  analyzing: {
    label: 'AI is analyzing your lead...',
    sublabel: 'Gemini is evaluating quality, intent, and conversion potential',
    icon: '🧠',
    progress: 70,
  },
  saving: {
    label: 'Saving results...',
    sublabel: 'Storing to your lead database',
    icon: '💾',
    progress: 95,
  },
};

export function LoadingState({ stage }: LoadingStateProps) {
  const info = STAGES[stage];

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 fade-in">
      {/* Animated icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center text-3xl">
          {info.icon}
        </div>
        <div className="absolute -inset-2 rounded-3xl border-2 border-blue-500/30 animate-ping" />
        <div className="absolute -inset-4 rounded-3xl border border-purple-500/20 animate-ping" style={{ animationDelay: '0.3s' }} />
      </div>

      {/* Progress indicator */}
      <div className="w-full max-w-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white">{info.label}</span>
          <span className="text-xs text-blue-400 font-medium">{info.progress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${info.progress}%` }}
          />
        </div>
        <p className="text-xs text-white/40 mt-2 text-center">{info.sublabel}</p>
      </div>

      {/* Animated dots */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-blue-500"
            style={{
              animation: 'pulse-dot 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-white/30">
        <Zap className="w-3 h-3 text-yellow-400" />
        <span>Powered by Gemini AI</span>
      </div>
    </div>
  );
}

export function SpinnerOverlay() {
  return (
    <div className="fixed inset-0 bg-navy-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="glass rounded-2xl p-8 flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-white/60">Processing...</p>
      </div>
    </div>
  );
}
