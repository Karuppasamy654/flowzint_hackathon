'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { SKILL_COLORS } from '@/lib/constants';
import { formatDistanceToNow, format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  History,
  MapPin,
  Star,
  XCircle,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PastRequestsPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = React.useState('my-requests');

  // Seeker states
  const [seekerRequests, setSeekerRequests] = React.useState<any[]>([]);
  const [isLoadingSeeker, setIsLoadingSeeker] = React.useState(true);

  // Helper states
  const [resolvedAssists, setResolvedAssists] = React.useState<any[]>([]);
  const [isLoadingHelper, setIsLoadingHelper] = React.useState(true);

  React.useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    async function loadSeekerHistory() {
      try {
        setIsLoadingSeeker(true);
        // Load all seeker requests, then filter in-memory for non-active/non-pending
        const res = await fetch('/api/requests?role=seeker');
        const result = await res.json();
        if (result.success) {
          const finished = (result.data || []).filter(
            (r: any) => r.status === 'completed' || r.status === 'cancelled' || r.status === 'expired'
          );
          setSeekerRequests(finished);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingSeeker(false);
      }
    }

    async function loadHelperHistory() {
      try {
        setIsLoadingHelper(true);
        // Load all chats, then filter for resolved assists where current user was the helper
        const res = await fetch('/api/chats');
        const result = await res.json();
        if (result.success) {
          const assists = (result.data || []).filter(
            (c: any) => c.helper._id === userId && c.status === 'resolved'
          );
          setResolvedAssists(assists);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingHelper(false);
      }
    }

    loadSeekerHistory();
    loadHelperHistory();
  }, [user?.id]);

  if (!user) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left">
      {/* Back to Profile block */}
      <div className="flex items-center gap-3 py-2">
        <button
          onClick={() => router.push('/profile')}
          className="p-2 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-md transition-all shrink-0"
        >
          <ArrowLeft className="h-4.5 w-4.5 text-slate-400" />
        </button>
        <div className="text-left">
          <h1 className="text-2xl font-display font-semibold text-white leading-tight">History</h1>
          <p className="text-sm text-slate-400">Review your past help requests and completed community assists.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 bg-slate-900/50 border border-white/5 p-1 rounded-lg">
          <TabsTrigger value="my-requests" className="flex items-center gap-1.5 font-semibold py-2.5 rounded-md data-[state=active]:bg-indigo-600/35 data-[state=active]:text-white text-slate-400 transition-all">
            <HelpCircle className="h-4 w-4" />
            My Help Requests
          </TabsTrigger>
          <TabsTrigger value="my-assists" className="flex items-center gap-1.5 font-semibold py-2.5 rounded-md data-[state=active]:bg-indigo-600/35 data-[state=active]:text-white text-slate-400 transition-all">
            <CheckCircle className="h-4 w-4" />
            Completed Assists
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Seeker History */}
        <TabsContent value="my-requests" className="space-y-4">
          {isLoadingSeeker ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <Skeleton key={n} className="h-24 w-full bg-[#131B2E]/60 rounded-lg border border-white/5" />
              ))}
            </div>
          ) : seekerRequests.length === 0 ? (
            <div className="bg-[#131B2E]/40 p-12 rounded-lg border border-dashed border-white/10 text-center space-y-3 backdrop-blur-md py-16">
              <History className="h-10 w-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-white">No past requests yet.</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Completed, cancelled, or expired help requests will be archived here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {seekerRequests.map((req) => {
                const colorClass = SKILL_COLORS[req.category] || 'bg-gray-800 text-slate-300 border-gray-700';
                
                let statusBadge = (
                  <span className="text-[9px] uppercase font-bold py-0.5 px-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded">
                    Completed
                  </span>
                );
                if (req.status === 'cancelled') {
                  statusBadge = (
                    <span className="text-[9px] uppercase font-bold py-0.5 px-2 bg-red-500/15 text-red-400 border border-red-500/25 rounded">
                      Cancelled
                    </span>
                  );
                } else if (req.status === 'expired') {
                  statusBadge = (
                    <span className="text-[9px] uppercase font-bold py-0.5 px-2 bg-slate-500/15 text-slate-400 border border-slate-500/25 rounded">
                      Expired
                    </span>
                  );
                }

                return (
                  <div key={req._id} className="bg-[#131B2E]/50 border border-white/10 p-5 rounded-lg hover:border-indigo-500/20 transition-all backdrop-blur-md text-left space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-white leading-snug">{req.title}</h4>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn('text-[10px] font-bold border rounded-sm px-2 py-0.5 capitalize', colorClass)}>
                            {req.category}
                          </span>
                          <span className="text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-sm px-2 py-0.5 capitalize">
                            {req.urgency}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">{statusBadge}</div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{req.description}</p>
                    <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 font-medium pt-2 border-t border-white/5 gap-2">
                      <div className="flex gap-4">
                        <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{req.location}</span>
                        <span>Created: {format(new Date(req.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                      {req.acceptedHelper && <span>Helper: {req.acceptedHelper.name}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Helper History */}
        <TabsContent value="my-assists" className="space-y-4">
          {isLoadingHelper ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <Skeleton key={n} className="h-28 w-full bg-[#131B2E]/60 rounded-lg border border-white/5" />
              ))}
            </div>
          ) : resolvedAssists.length === 0 ? (
            <div className="bg-[#131B2E]/40 p-12 rounded-lg border border-dashed border-white/10 text-center space-y-3 backdrop-blur-md py-16">
              <CheckCircle className="h-10 w-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-white">No completed assists yet</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Once you accept a request and the seeker marks it resolved, details appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {resolvedAssists.map((assist) => {
                const req = assist.request || {};
                const colorClass = SKILL_COLORS[req.category] || 'bg-gray-800 text-slate-300 border-gray-700';
                return (
                  <div key={assist._id} className="bg-[#131B2E]/50 border border-white/10 p-5 rounded-lg backdrop-blur-md text-left space-y-3.5">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-white leading-snug">{req.title || 'Help Assist'}</h4>
                        <div className="flex items-center gap-2">
                          <span className={cn('text-[10px] font-bold border rounded-sm px-2 py-0.5 capitalize', colorClass)}>{req.category || 'Other'}</span>
                          <span className="text-[10px] text-slate-400">Seeker: {assist.seeker?.name || 'Neighbor'}</span>
                        </div>
                      </div>
                      {assist.seekerRating && (
                        <div className="flex items-center text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400 mr-0.5" />
                          <span>{assist.seekerRating}.0</span>
                        </div>
                      )}
                    </div>
                    {assist.seekerFeedback && (
                      <div className="bg-white/5 border border-white/8 p-3 rounded-md text-xs text-slate-300 italic">
                        &ldquo;{assist.seekerFeedback}&rdquo;
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-1">
                      <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{assist.seeker?.location || 'Nearby'}</span>
                      <span>Resolved: {assist.resolvedAt ? format(new Date(assist.resolvedAt), 'MMM d, yyyy') : 'Unknown'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
export const dynamic = 'force-dynamic';
