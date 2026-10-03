'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Zap, Globe, Building2, ChevronRight, History, X,
  BarChart3, TrendingUp, Users, Star, RefreshCw,
  ExternalLink, Info, Download, Trash2, Search,
  Sparkles, Check, Filter, Share2
} from 'lucide-react';
import { ScoreRing } from '@/components/ScoreRing';
import { ScoreBar } from '@/components/ScoreBar';
import { SuggestionsCard } from '@/components/SuggestionsCard';
import { OutreachTemplate } from '@/components/OutreachTemplate';
import { RiskFlags } from '@/components/RiskFlags';
import { LoadingState } from '@/components/LoadingState';
import { LeadHistoryCard } from '@/components/LeadHistoryCard';
import { LeadScore } from '@/lib/supabase';

interface ScoreResult {
  id?: string;
  score: {
    overallScore: number;
    breakdown: {
      businessQuality: number;
      buyingIntent: number;
      websiteQuality: number;
      contactCompleteness: number;
      conversionPotential: number;
    };
    summary: string;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    suggestions: string[];
    outreachTemplate: string;
    companyProfile: {
      industry: string;
      companySize: string;
      stage: string;
      targetMarket: string;
    };
    riskFlags: string[];
    aiModel?: string;
  };
  persistedToDb?: boolean;
}

const SCORE_CATEGORIES = [
  { key: 'businessQuality', label: 'Business Quality', icon: '🏢' },
  { key: 'buyingIntent', label: 'Buying Intent', icon: '🎯' },
  { key: 'websiteQuality', label: 'Website Quality', icon: '🌐' },
  { key: 'contactCompleteness', label: 'Contact Info', icon: '📋' },
  { key: 'conversionPotential', label: 'Conversion Potential', icon: '💰' },
] as const;

const INDUSTRIES = [
  'SaaS / Software', 'E-commerce', 'Marketing / Advertising', 'Finance / FinTech',
  'Healthcare', 'Real Estate', 'Manufacturing', 'Consulting', 'Education',
  'Legal', 'Retail', 'Media / Entertainment', 'Other',
];

const SAMPLE_LEADS = [
  {
    companyName: 'Stripe Payments',
    websiteUrl: 'https://stripe.com',
    industry: 'Finance / FinTech',
    contactInfo: 'partnerships@stripe.com',
    leadInfo: 'Global payments infrastructure for the internet. Millions of companies use Stripe to accept payments, send payouts, and manage business online.',
  },
  {
    companyName: 'Vercel Cloud',
    websiteUrl: 'https://vercel.com',
    industry: 'SaaS / Software',
    contactInfo: 'sales@vercel.com',
    leadInfo: 'Frontend cloud platform. Empowers developers to build and scale web applications, currently expanding enterprise sales and hiring globally.',
  },
  {
    companyName: 'Nexus AI Labs',
    websiteUrl: 'https://github.com',
    industry: 'SaaS / Software',
    contactInfo: 'team@nexusailabs.io',
    leadInfo: 'Series A stage AI research collective building autonomous developer tooling. Looking for B2B cloud infrastructure partners.',
  },
  {
    companyName: 'GreenLeaf Artisan Roasters',
    websiteUrl: 'https://example.com',
    industry: 'Retail',
    contactInfo: '',
    leadInfo: 'Local organic specialty coffee shop with 2 retail locations. Family owned, no website store, mostly in-person sales.',
  },
];

const LOCAL_STORAGE_KEY = 'leadscore_history_v1';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'url' | 'manual'>('url');
  const [companyName, setCompanyName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [leadInfo, setLeadInfo] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'scraping' | 'analyzing' | 'saving'>('scraping');
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<LeadScore[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'hot' | 'warm' | 'fair'>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [activeResultTab, setActiveResultTab] = useState<'breakdown' | 'suggestions' | 'outreach'>('breakdown');
  const [copiedLink, setCopiedLink] = useState(false);

  // Load history from localStorage and API
  const fetchHistory = useCallback(async () => {
    let localLeads: LeadScore[] = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          localLeads = JSON.parse(stored);
        }
      } catch {
        // Ignore parse error
      }
    }

    try {
      const res = await fetch('/api/score?limit=50');
      if (res.ok) {
        const data = await res.json();
        const serverLeads: LeadScore[] = data.leads || [];

        // Merge without duplicates by company_name + website_url or id
        const mergedMap = new Map<string, LeadScore>();
        localLeads.forEach((l) => mergedMap.set(l.id || `${l.company_name}_${l.website_url}`, l));
        serverLeads.forEach((l) => mergedMap.set(l.id || `${l.company_name}_${l.website_url}`, l));

        const merged = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );

        setHistory(merged);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        }
        return;
      }
    } catch {
      // Fallback to local leads
    }

    if (localLeads.length > 0) {
      setHistory(localLeads);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const saveToLocalHistory = (lead: LeadScore) => {
    setHistory((prev) => {
      const updated = [lead, ...prev.filter((p) => p.id !== lead.id)];
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated.slice(0, 100)));
      }
      return updated;
    });
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear your local scored leads history?')) {
      setHistory([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  };

  const handleScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      // Stage 1: scraping
      setLoadingStage('scraping');
      await new Promise((r) => setTimeout(r, 600));

      // Stage 2: analyzing
      setLoadingStage('analyzing');

      const response = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          websiteUrl,
          leadInfo,
          industry,
          contactInfo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to score lead');
      }

      // Stage 3: saving
      setLoadingStage('saving');
      await new Promise((r) => setTimeout(r, 300));

      setResult(data);
      setActiveResultTab('breakdown');

      // Create history record
      const newLead: LeadScore = {
        id: data.id || 'lead_' + Date.now(),
        company_name: companyName || data.score?.companyProfile?.industry || 'Unknown Lead',
        website_url: websiteUrl,
        lead_info: leadInfo,
        industry: industry || data.score?.companyProfile?.industry,
        contact_info: contactInfo,
        overall_score: data.score.overallScore,
        business_quality: data.score.breakdown.businessQuality,
        buying_intent: data.score.breakdown.buyingIntent,
        website_quality: data.score.breakdown.websiteQuality,
        contact_completeness: data.score.breakdown.contactCompleteness,
        conversion_potential: data.score.breakdown.conversionPotential,
        summary: data.score.summary,
        suggestions: data.score.suggestions,
        outreach_template: data.score.outreachTemplate,
        status: data.score.status,
        created_at: new Date().toISOString(),
      };

      saveToLocalHistory(newLead);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSampleLead = (sample: typeof SAMPLE_LEADS[0]) => {
    setCompanyName(sample.companyName);
    setWebsiteUrl(sample.websiteUrl);
    setIndustry(sample.industry);
    setContactInfo(sample.contactInfo);
    setLeadInfo(sample.leadInfo);
    setActiveTab(sample.websiteUrl ? 'url' : 'manual');
  };

  const handleSelectHistoryLead = (lead: LeadScore) => {
    setCompanyName(lead.company_name || '');
    setWebsiteUrl(lead.website_url || '');
    setIndustry(lead.industry || '');
    setContactInfo(lead.contact_info || '');
    setLeadInfo(lead.lead_info || '');

    // Restore full scored card view
    setResult({
      id: lead.id,
      score: {
        overallScore: lead.overall_score,
        breakdown: {
          businessQuality: lead.business_quality,
          buyingIntent: lead.buying_intent,
          websiteQuality: lead.website_quality,
          contactCompleteness: lead.contact_completeness,
          conversionPotential: lead.conversion_potential,
        },
        summary: lead.summary,
        status: lead.status,
        suggestions: lead.suggestions || [],
        outreachTemplate: lead.outreach_template || '',
        companyProfile: {
          industry: lead.industry || 'General B2B',
          companySize: lead.overall_score >= 75 ? 'mid-market' : lead.overall_score >= 50 ? 'small' : 'startup',
          stage: lead.overall_score >= 75 ? 'growth' : 'early',
          targetMarket: 'B2B',
        },
        riskFlags: lead.overall_score < 50 ? ['Low buying signals', 'Incomplete verified contact'] : [],
      },
    });

    setShowHistory(false);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setCompanyName('');
    setWebsiteUrl('');
    setLeadInfo('');
    setIndustry('');
    setContactInfo('');
  };

  const exportHistoryCSV = () => {
    if (history.length === 0) return;

    const headers = [
      'Company Name',
      'Website',
      'Industry',
      'Overall Score',
      'Status',
      'Business Quality',
      'Buying Intent',
      'Website Quality',
      'Contact Completeness',
      'Conversion Potential',
      'Contact Info',
      'Summary',
      'Created At',
    ];

    const rows = history.map((item) => [
      `"${(item.company_name || '').replace(/"/g, '""')}"`,
      `"${(item.website_url || '').replace(/"/g, '""')}"`,
      `"${(item.industry || '').replace(/"/g, '""')}"`,
      item.overall_score,
      item.status,
      item.business_quality,
      item.buying_intent,
      item.website_quality,
      item.contact_completeness,
      item.conversion_potential,
      `"${(item.contact_info || '').replace(/"/g, '""')}"`,
      `"${(item.summary || '').replace(/"/g, '""')}"`,
      `"${item.created_at || new Date().toISOString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lead_qualification_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredHistory = useMemo(() => {
    return history.filter((lead) => {
      const matchSearch =
        !historySearch ||
        lead.company_name?.toLowerCase().includes(historySearch.toLowerCase()) ||
        lead.website_url?.toLowerCase().includes(historySearch.toLowerCase()) ||
        lead.industry?.toLowerCase().includes(historySearch.toLowerCase());

      if (!matchSearch) return false;

      if (historyFilter === 'hot') return lead.overall_score >= 80;
      if (historyFilter === 'warm') return lead.overall_score >= 60 && lead.overall_score < 80;
      if (historyFilter === 'fair') return lead.overall_score < 60;
      return true;
    });
  }, [history, historyFilter, historySearch]);

  const stats = useMemo(() => {
    const total = history.length;
    const hotCount = history.filter((l) => l.overall_score >= 80).length;
    const avgScore = total > 0 ? Math.round(history.reduce((acc, l) => acc + l.overall_score, 0) / total) : 0;
    return { total, hotCount, avgScore };
  }, [history]);

  return (
    <div className="min-h-screen bg-[#050A15] font-sans text-white">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Ambient glow */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-20 border-b border-white/5 bg-[#050A15]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">
                Lead<span className="gradient-text">Score</span>
              </span>
              <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                AI QUALIFIER
              </span>
            </div>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-3">
            {/* Quick Metrics */}
            {stats.total > 0 && (
              <div className="hidden md:flex items-center gap-4 mr-2 py-1 px-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="text-center">
                  <div className="text-xs font-bold text-white">{stats.total}</div>
                  <div className="text-[9px] text-white/40 uppercase tracking-wider">Prospects</div>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="text-center">
                  <div className="text-xs font-bold text-emerald-400">{stats.hotCount}</div>
                  <div className="text-[9px] text-white/40 uppercase tracking-wider">Hot Leads</div>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="text-center">
                  <div className="text-xs font-bold text-blue-400">{stats.avgScore}</div>
                  <div className="text-[9px] text-white/40 uppercase tracking-wider">Avg Score</div>
                </div>
              </div>
            )}

            {/* Export CSV button */}
            {stats.total > 0 && (
              <button
                onClick={exportHistoryCSV}
                title="Export scored leads as CSV"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}

            {/* History Drawer Trigger */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-all"
            >
              <History className="w-3.5 h-3.5 text-blue-400" />
              <span>History</span>
              {stats.total > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500 text-white">
                  {stats.total}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Hero header */}
        <div className="text-center mb-10 slide-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border border-blue-500/20 text-xs text-blue-400 font-medium mb-5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            AI Lead Quality Scorer • B2B Sales & Outreach
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 leading-tight tracking-tight">
            Qualify B2B Leads in Seconds
            <br />
            <span className="gradient-text">Prioritize Deals Before You Reach Out</span>
          </h1>
          <p className="text-white/50 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Paste a company website URL or lead profile. AI instantly evaluates business legitimacy,
            buying signals, tech stack, and writes a tailored outreach email.
          </p>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-2 slide-up slide-up-delay-1">
            <div className="glass rounded-2xl overflow-hidden border border-white/5 shadow-xl">
              {/* Tab switcher */}
              <div className="flex border-b border-white/5 bg-white/[0.01]">
                {[
                  { id: 'url', label: 'Website URL + Signals', icon: <Globe className="w-3.5 h-3.5" /> },
                  { id: 'manual', label: 'Manual Dossier', icon: <Building2 className="w-3.5 h-3.5" /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'url' | 'manual')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'text-white border-b-2 border-blue-500 bg-blue-500/10'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleScore} className="p-5 flex flex-col gap-4">
                {/* Company Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center justify-between">
                    <span>Company Name</span>
                    <span className="text-[10px] text-white/30 font-normal">Primary Identifier</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Stripe, Snowflake, Acme Inc"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/20 transition-all focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  />
                </div>

                {activeTab === 'url' ? (
                  /* URL tab */
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                      Website URL
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="text"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://company.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/20 transition-all focus:outline-none focus:ring-1 focus:ring-blue-500"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-white/35 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      Crawls meta tags, tech keywords, contact pages, and business signals automatically
                    </p>
                  </div>
                ) : (
                  /* Manual tab */
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                      Lead Information & Context
                    </label>
                    <textarea
                      value={leadInfo}
                      onChange={(e) => setLeadInfo(e.target.value)}
                      placeholder="Paste anything: LinkedIn notes, founder bio, funding news, hiring signals, CRM history, or email thread..."
                      rows={5}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/20 resize-none transition-all focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    />
                  </div>
                )}

                {/* Industry */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Industry <span className="text-white/30 font-normal lowercase">(optional)</span>
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white transition-all appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <option value="" style={{ background: '#0A0F1E' }}>Select target industry...</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind} style={{ background: '#0A0F1E' }}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contact Info */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                    Target Contact / Decision Maker <span className="text-white/30 font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="E.g. Alex Morgan, VP Sales (alex@company.com), +1 415-555-0199, LinkedIn URL"
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/20 resize-none transition-all focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-xl p-3 text-xs text-red-300 bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                    <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading || (!companyName && !websiteUrl && !leadInfo)}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    background: loading
                      ? 'rgba(59,130,246,0.3)'
                      : 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(59,130,246,0.35)',
                  }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Evaluating Prospect Signals...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-white" />
                      Score & Qualify Lead
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Sample leads picker */}
                <div className="pt-2 border-t border-white/5">
                  <p className="text-[10px] text-white/30 text-center mb-2.5 uppercase tracking-wider font-semibold">
                    Test with Curated Prospect Profiles
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {SAMPLE_LEADS.map((sample, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSampleLead(sample)}
                        className="p-2 rounded-xl text-left text-xs text-white/60 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] transition-all border border-white/5 flex flex-col gap-0.5"
                      >
                        <span className="font-semibold text-white/90 truncate">{sample.companyName}</span>
                        <span className="text-[10px] text-white/40 truncate">{sample.industry}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-3 slide-up slide-up-delay-2">
            {loading ? (
              <div className="glass rounded-2xl p-8 border border-white/5 shadow-xl">
                <LoadingState stage={loadingStage} />
              </div>
            ) : result ? (
              <div className="flex flex-col gap-5 fade-in">
                {/* Score overview Card */}
                <div className="glass rounded-2xl p-6 border border-white/5 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {result.score.aiModel || 'Gemini 1.5 Flash Verified'}
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Score gauge ring */}
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                      <ScoreRing score={result.score.overallScore} size={180} />
                      <p className="text-xs text-white/40 text-center font-medium">Composite Lead Score</p>
                    </div>

                    {/* Summary + company profile */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-xl font-bold text-white truncate">
                          {companyName || 'Prospect Qualification'}
                        </h2>
                        {websiteUrl && (
                          <a
                            href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-white/5 transition-all"
                            title="Open company website"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>

                      <p className="text-sm text-white/70 leading-relaxed mb-4">
                        {result.score.summary}
                      </p>

                      {/* Company profile tags */}
                      {result.score.companyProfile && (
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: result.score.companyProfile.industry, icon: '🏭' },
                            { label: result.score.companyProfile.companySize, icon: '👥' },
                            { label: result.score.companyProfile.stage, icon: '📈' },
                            { label: result.score.companyProfile.targetMarket, icon: '🎯' },
                          ].filter(item => item.label).map((item, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium text-white/70 capitalize"
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                              }}
                            >
                              <span className="mr-1">{item.icon}</span>
                              {item.label}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Score another lead button */}
                      <div className="mt-5 flex items-center gap-3">
                        <button
                          onClick={handleReset}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Score New Prospect
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabbed Result Details */}
                <div className="glass rounded-2xl overflow-hidden border border-white/5 shadow-xl">
                  {/* Tab bar */}
                  <div className="flex border-b border-white/5 bg-white/[0.01]">
                    {[
                      { id: 'breakdown', label: '5-Pillar Breakdown', icon: <BarChart3 className="w-3.5 h-3.5" /> },
                      { id: 'suggestions', label: 'Actionable Next Steps', icon: <TrendingUp className="w-3.5 h-3.5" /> },
                      { id: 'outreach', label: 'Generated Cold Email', icon: <Users className="w-3.5 h-3.5" /> },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveResultTab(tab.id as typeof activeResultTab)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-semibold transition-all ${
                          activeResultTab === tab.id
                            ? 'text-white border-b-2 border-blue-500 bg-blue-500/10'
                            : 'text-white/40 hover:text-white/70'
                        }`}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="p-6">
                    {activeResultTab === 'breakdown' && (
                      <div className="flex flex-col gap-4">
                        {SCORE_CATEGORIES.map((cat, i) => (
                          <ScoreBar
                            key={cat.key}
                            label={cat.label}
                            score={result.score.breakdown[cat.key]}
                            icon={cat.icon}
                            delay={i * 80}
                          />
                        ))}

                        {/* Risk flags */}
                        {result.score.riskFlags && result.score.riskFlags.length > 0 && (
                          <div className="mt-3">
                            <RiskFlags flags={result.score.riskFlags} />
                          </div>
                        )}
                      </div>
                    )}

                    {activeResultTab === 'suggestions' && (
                      <SuggestionsCard suggestions={result.score.suggestions} />
                    )}

                    {activeResultTab === 'outreach' && (
                      <OutreachTemplate
                        template={result.score.outreachTemplate}
                        companyName={companyName}
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Empty state before scoring */
              <div className="glass rounded-2xl p-10 flex flex-col items-center justify-center text-center min-h-[460px] border border-white/5 shadow-xl">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 text-2xl shadow-lg shadow-blue-500/20"
                  style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))' }}
                >
                  ⚡
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Ready to Qualify Leads</h3>
                <p className="text-white/40 text-sm max-w-sm mb-8 leading-relaxed">
                  Enter a target company name, website URL, or paste profile details to get an instant
                  0–100 score with conversion recommendations.
                </p>

                {/* 5 Evaluation Criteria Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md">
                  {[
                    { icon: '🏢', label: 'Business Quality' },
                    { icon: '🎯', label: 'Buying Intent' },
                    { icon: '🌐', label: 'Website Signals' },
                    { icon: '📋', label: 'Contact Health' },
                    { icon: '💰', label: 'Conversion ROI' },
                    { icon: '✉️', label: 'Outreach Copy' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl text-center flex flex-col items-center justify-center gap-1"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-[11px] font-medium text-white/50">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Sidebar Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-96 max-w-[90vw] z-40 transition-transform duration-300 ease-out shadow-2xl flex flex-col ${
          showHistory ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: 'rgba(5, 10, 21, 0.97)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              <h2 className="font-bold text-sm text-white">Scored Leads History</h2>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">
                {history.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={exportHistoryCSV}
                  title="Export to CSV"
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  title="Clear history"
                  className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowHistory(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search prospects by name, website, sector..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs text-white placeholder-white/20 bg-white/[0.04] border border-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'hot', label: 'Hot (80+)' },
              { id: 'warm', label: 'Warm (60-79)' },
              { id: 'fair', label: 'Fair (<60)' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setHistoryFilter(f.id as typeof historyFilter)}
                className={`flex-1 py-1 rounded text-[10px] font-semibold transition-all ${
                  historyFilter === f.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/[0.03] text-white/40 hover:text-white/70'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Drawer Lead List */}
        <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-3">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center justify-center">
              <Star className="w-8 h-8 text-white/10 mb-3" />
              <p className="text-xs text-white/40">
                {history.length === 0 ? 'No prospects scored yet' : 'No prospects match this filter'}
              </p>
            </div>
          ) : (
            filteredHistory.map((lead) => (
              <LeadHistoryCard
                key={lead.id}
                lead={lead}
                onClick={() => handleSelectHistoryLead(lead)}
              />
            ))
          )}
        </div>
      </div>

      {/* History backdrop */}
      {showHistory && (
        <div
          className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm transition-opacity"
          onClick={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
