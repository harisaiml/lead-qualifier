'use client';

import { useState } from 'react';
import { Copy, Check, Mail } from 'lucide-react';

interface OutreachTemplateProps {
  template: string;
  companyName?: string;
}

export function OutreachTemplate({ template, companyName }: OutreachTemplateProps) {
  const [copied, setCopied] = useState(false);

  if (!template) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(template);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Mail className="w-4 h-4 text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
            Outreach Email Template
          </h3>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
          style={{
            background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
            color: copied ? '#10B981' : 'rgba(255,255,255,0.6)',
            border: copied ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>

      <div
        className="rounded-xl p-4 text-sm text-white/70 leading-relaxed font-mono whitespace-pre-wrap overflow-auto max-h-64"
        style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.05)',
          fontSize: '0.8rem',
        }}
      >
        {template}
      </div>

      {companyName && (
        <p className="text-xs text-white/30 mt-3">
          Personalized for: <span className="text-blue-400">{companyName}</span>
        </p>
      )}
    </div>
  );
}
