'use client';

import { Building2, Globe, Tag, Clock } from 'lucide-react';
import { LeadScore } from '@/lib/supabase';

interface LeadHistoryCardProps {
  lead: LeadScore;
  onClick?: () => void;
}

function getScoreStyle(score: number) {
  if (score >= 80) return { color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' };
  if (score >= 60) return { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' };
  if (score >= 40) return { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' };
  return { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' };
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function LeadHistoryCard({ lead, onClick }: LeadHistoryCardProps) {
  const style = getScoreStyle(lead.overall_score);

  return (
    <button
      onClick={onClick}
      className="w-full text-left glass rounded-xl p-4 hover:border-blue-500/30 transition-all duration-200 group gradient-border-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
            <h4 className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
              {lead.company_name}
            </h4>
          </div>
          {lead.website_url && (
            <div className="flex items-center gap-1.5 mb-2">
              <Globe className="w-3 h-3 text-white/30" />
              <span className="text-xs text-white/40 truncate">{lead.website_url}</span>
            </div>
          )}
          {lead.industry && (
            <div className="flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-white/30" />
              <span className="text-xs text-white/50">{lead.industry}</span>
            </div>
          )}
        </div>
        <div
          className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center"
          style={{ background: style.bg, border: `1px solid ${style.border}` }}
        >
          <span className="text-lg font-black" style={{ color: style.color }}>
            {lead.overall_score}
          </span>
          <span className="text-[9px] text-white/40 uppercase">score</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-white/5">
        <Clock className="w-3 h-3 text-white/20" />
        <span className="text-[10px] text-white/30">{formatDate(lead.created_at)}</span>
        <span
          className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
          style={{ background: style.bg, color: style.color }}
        >
          {lead.status}
        </span>
      </div>
    </button>
  );
}
