'use client';

import * as React from 'react';
import { Loader2, Newspaper, RefreshCw } from 'lucide-react';

export function CommunityDigest() {
  const [data, setData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/community-digest');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError('Could not load digest');
      }
    } catch {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  if (isLoading) {
    return (
      <div className="bg-[#131B2E]/60 border border-white/10 rounded-xl p-6 backdrop-blur-md flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-indigo-400 shrink-0" />
        <p className="text-xs text-slate-400">AI generating weekly community digest...</p>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  return (
    <div className="bg-[#131B2E]/60 border border-white/10 rounded-xl p-6 backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Weekly Digest</span>
        </div>
        <button
          onClick={load}
          className="text-slate-500 hover:text-indigo-400 transition-colors p-1 rounded"
          title="Refresh digest"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-start gap-3">
        <div className="text-3xl shrink-0 mt-0.5">{data.emoji}</div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-white leading-tight">{data.headline}</h3>
          <p className="text-sm text-slate-300 leading-relaxed">{data.body}</p>
        </div>
      </div>

      <div className="flex gap-4 pt-1 border-t border-white/5">
        <div className="text-center">
          <p className="text-lg font-extrabold text-white">{data.stats?.newRequests ?? '—'}</p>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">New Requests</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-extrabold text-emerald-400">{data.stats?.resolvedThisWeek ?? '—'}</p>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Resolved</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-extrabold text-indigo-400">{data.stats?.newMembers ?? '—'}</p>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">New Members</p>
        </div>
      </div>

      <p className="text-[10px] text-slate-600">
        Generated {data.generatedAt ? new Date(data.generatedAt).toLocaleString() : 'now'} · Powered by Gemini AI
      </p>
    </div>
  );
}
