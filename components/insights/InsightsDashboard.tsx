'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';
import { CommunityDigest } from './CommunityDigest';
import { useLanguage } from '@/lib/LanguageContext';
import {
  Users, CheckCircle, Clock, Star, TrendingUp,
  Sparkles, Brain, Zap, Heart, BarChart3, Loader2
} from 'lucide-react';

interface InsightsData {
  totalRequests: number;
  completedRequests: number;
  activeRequests: number;
  totalUsers: number;
  avgRating: number;
  ratingCount: number;
  successRate: number;
  categoryBreakdown: { _id: string; count: number }[];
  recentResolutions: {
    id: string;
    seekerName: string;
    helperName: string;
    seekerAvatar?: string;
    seekerColor?: string;
    helperAvatar?: string;
    helperColor?: string;
    requestTitle: string;
    category?: string;
    rating?: number;
    resolvedAt?: string;
  }[];
  aiSummary: string;
}

function AnimatedCounter({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    if (target === 0) return;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <>{count.toLocaleString()}</>;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{
            width: 14, height: 14,
            fill: i <= Math.round(rating) ? '#FBBF24' : 'transparent',
            color: i <= Math.round(rating) ? '#FBBF24' : '#D1D5DB',
          }}
        />
      ))}
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  'Web Dev': '#3B82F6',
  'Design': '#8B5CF6',
  'Plumbing': '#0EA5E9',
  'Electrician': '#F59E0B',
  'Teaching': '#10B981',
  'Medical': '#EF4444',
  'Legal': '#6366F1',
  'Cooking': '#F97316',
  'Carpentry': '#92400E',
  'Mental Health': '#EC4899',
  'Music': '#A855F7',
  'Finance': '#059669',
  'Language Translation': '#0891B2',
  'Other': '#6B7280',
};

export function InsightsDashboard() {
  const [data, setData] = React.useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { t } = useLanguage();

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/insights');
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to load insights');
        }
      } catch (e) {
        setError('Could not connect to insights API');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="relative">
          <Brain className="w-10 h-10 text-indigo-400 opacity-30" />
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin absolute top-0 left-0" />
        </div>
        <p className="text-slate-400 text-sm font-medium">AI generating insights...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
        <BarChart3 className="w-10 h-10 text-slate-600" />
        <p className="text-white text-sm font-semibold">Could not load insights</p>
        <p className="text-slate-400 text-xs">{error || 'No data available yet'}</p>
      </div>
    );
  }

  const maxCategoryCount = Math.max(...data.categoryBreakdown.map(c => c.count), 1);

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-8 text-left">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('insights.title')}</h1>
        </div>
        <p className="text-sm text-slate-400">{t('insights.subtitle')}</p>
      </div>

      {/* AI Summary Card */}
      {data.aiSummary && (
        <div className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-xl p-5 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5">AI Platform Summary</p>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">{data.aiSummary}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-[#131B2E]/60 border border-white/10 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-[18px] h-[18px] text-blue-400" />
            </div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">{t('insights.members')}</span>
          </div>
          <p className="text-3xl font-extrabold text-white leading-none">
            <AnimatedCounter target={data.totalUsers} />
          </p>
          <p className="text-xs text-emerald-400 font-semibold mt-1">↑ Real accounts</p>
        </div>

        {/* Completed */}
        <div className="bg-[#131B2E]/60 border border-white/10 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-[18px] h-[18px] text-emerald-400" />
            </div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">{t('insights.resolved')}</span>
          </div>
          <p className="text-3xl font-extrabold text-white leading-none">
            <AnimatedCounter target={data.completedRequests} />
          </p>
          <p className="text-xs text-slate-400 font-medium mt-1">{data.successRate}{t('common.successRate')}</p>
        </div>

        {/* Active Now */}
        <div className="bg-[#131B2E]/60 border border-white/10 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Zap className="w-[18px] h-[18px] text-amber-400" />
            </div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">{t('insights.activeNow')}</span>
          </div>
          <p className="text-3xl font-extrabold text-white leading-none">
            <AnimatedCounter target={data.activeRequests} />
          </p>
          <p className="text-xs text-amber-400 font-semibold mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" />
            {t('common.inProgress')}
          </p>
        </div>

        {/* Avg Rating */}
        <div className="bg-[#131B2E]/60 border border-white/10 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Star className="w-[18px] h-[18px] text-amber-400 fill-amber-400" />
            </div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">{t('insights.avgRating')}</span>
          </div>
          <p className="text-3xl font-extrabold text-white leading-none">{data.avgRating.toFixed(1)}</p>
          <p className="text-xs text-slate-400 font-medium mt-1">{t('common.from')} {data.ratingCount} {t('profile.reviews')}</p>
        </div>
      </div>

      {/* Community Digest */}
      <CommunityDigest />

      {/* Category Breakdown */}
      {data.categoryBreakdown.length > 0 && (
        <div className="bg-[#131B2E]/60 border border-white/10 rounded-xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-[18px] h-[18px] text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Top Help Categories</h2>
          </div>
          <div className="flex flex-col gap-3">
            {data.categoryBreakdown.map((cat) => {
              const pct = Math.round((cat.count / maxCategoryCount) * 100);
              const color = CATEGORY_COLORS[cat._id] || '#6B7280';
              return (
                <div key={cat._id} className="flex items-center gap-3">
                  <span className="w-32 text-sm font-medium text-slate-300 shrink-0">{cat._id}</span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div style={{ width: `${pct}%`, background: color, transition: 'width 1s ease-out' }} className="h-full rounded-full" />
                  </div>
                  <span className="w-8 text-sm font-bold text-white text-right shrink-0">{cat.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Resolutions */}
      {data.recentResolutions.length > 0 && (
        <div className="bg-[#131B2E]/60 border border-white/10 rounded-xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-5">
            <Heart className="w-[18px] h-[18px] text-pink-400" />
            <h2 className="text-sm font-bold text-white">Recent Success Stories</h2>
          </div>
          <div className="flex flex-col divide-y divide-white/5">
            {data.recentResolutions.map((r) => (
              <div key={r.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center shrink-0 gap-2">
                  <Avatar src={r.seekerAvatar} name={r.seekerName} color={r.seekerColor} size="sm" />
                  <span className="text-xs text-slate-500">→</span>
                  <Avatar src={r.helperAvatar} name={r.helperName} color={r.helperColor} size="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{r.requestTitle}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {r.seekerName} helped by {r.helperName}
                    {r.category && (
                      <span className="ml-2 bg-indigo-500/15 text-indigo-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {r.category}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {r.rating && <StarRow rating={r.rating} />}
                  {r.resolvedAt && <span className="text-[11px] text-slate-500">{format(new Date(r.resolvedAt), 'd MMM')}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Features Showcase */}
      <div className="bg-gradient-to-br from-[#0F172A] to-[#1E1B4B] border border-indigo-500/20 rounded-xl p-7">
        <div className="flex items-center gap-2 mb-5">
          <Brain className="w-5 h-5 text-indigo-300" />
          <h2 className="text-base font-bold text-white">Powered by Gemini AI</h2>
          <span className="ml-auto text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">10 AI Features</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { icon: '🧠', label: 'Request Analyser', desc: 'Clarity scoring & category detection in real time' },
            { icon: '✨', label: 'Request Enhancer', desc: 'One-click AI rewrite to improve help requests' },
            { icon: '🛡️', label: 'Safety Shield', desc: 'Content moderation prevents harmful posts' },
            { icon: '💬', label: 'Smart Replies', desc: 'Context-aware reply suggestions in chat' },
            { icon: '❤️', label: 'Emotion Detector', desc: 'Detects stress and guides empathetic responses' },
            { icon: '🎯', label: 'AI Helper Matching', desc: 'Semantic skill matching ranks best local helpers' },
            { icon: '🌐', label: 'Auto-Translate', desc: 'Real-time cross-language message translation' },
            { icon: '💡', label: 'Skill Suggester', desc: 'AI recommends skills based on your bio' },
            { icon: '🤝', label: 'Conflict Resolver', desc: 'AI suggests de-escalation if tension detected' },
            { icon: '📊', label: 'AI Digest', desc: 'AI-generated weekly community health summary' },
          ].map((feat) => (
            <div key={feat.label} className="bg-white/5 border border-white/8 rounded-xl p-4">
              <p className="text-xl mb-1.5">{feat.icon}</p>
              <p className="text-xs font-bold text-indigo-200 mb-1">{feat.label}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
