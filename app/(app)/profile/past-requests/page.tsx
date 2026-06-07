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
          className="p-2 hover:bg-white border border-transparent hover:border-gray-200 rounded-md transition-all shrink-0"
        >
          <ArrowLeft className="h-4.5 w-4.5 text-gray-600" />
        </button>
        <div className="text-left">
          <h1 className="text-2xl font-display font-semibold text-gray-900 leading-tight">
            History
          </h1>
          <p className="text-sm text-gray-500">
            Review your past help requests and completed community assists.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="my-requests" className="flex items-center gap-1.5 font-semibold py-2">
            <HelpCircle className="h-4 w-4" />
            My Help Requests
          </TabsTrigger>
          <TabsTrigger value="my-assists" className="flex items-center gap-1.5 font-semibold py-2">
            <CheckCircle className="h-4 w-4" />
            Completed Assists
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Seeker History */}
        <TabsContent value="my-requests" className="space-y-4">
          {isLoadingSeeker ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <Skeleton key={n} className="h-24 w-full bg-white rounded-lg border border-border" />
              ))}
            </div>
          ) : seekerRequests.length === 0 ? (
            <div className="bg-white p-12 rounded-lg border border-border border-dashed text-center space-y-3 text-gray-400 py-16">
              <History className="h-10 w-10 text-gray-300 mx-auto" />
              <p className="text-sm font-semibold text-gray-800">No past requests</p>
              <p className="text-xs max-w-xs mx-auto">
                Completed, cancelled, or expired help requests will be archived here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {seekerRequests.map((req) => {
                const colorClass = SKILL_COLORS[req.category] || 'bg-gray-50 text-gray-600 border-gray-200';
                
                let statusBadge = (
                  <Badge variant="success" className="text-[9px] uppercase font-bold py-0.5 px-2">
                    Completed
                  </Badge>
                );
                if (req.status === 'cancelled') {
                  statusBadge = (
                    <Badge variant="destructive" className="text-[9px] bg-red-50 text-red-700 border-red-100 uppercase font-bold py-0.5 px-2">
                      Cancelled
                    </Badge>
                  );
                } else if (req.status === 'expired') {
                  statusBadge = (
                    <Badge variant="outline" className="text-[9px] bg-gray-50 text-gray-500 border-gray-200 uppercase font-bold py-0.5 px-2">
                      Expired
                    </Badge>
                  );
                }

                return (
                  <div
                    key={req._id}
                    className="bg-white p-5 rounded-lg border border-border hover:border-primary/20 transition-all text-left space-y-3"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-gray-800 leading-snug">{req.title}</h4>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn('text-[10px] font-bold border rounded-sm px-2 py-0.5 capitalize', colorClass)}>
                            {req.category}
                          </span>
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-100 rounded-sm px-2 py-0.5 capitalize">
                            {req.urgency}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">{statusBadge}</div>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed">{req.description}</p>

                    <div className="flex flex-wrap items-center justify-between text-[10px] text-gray-400 font-medium pt-2 border-t border-gray-50 gap-2">
                      <div className="flex gap-4">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {req.location}
                        </span>
                        <span>
                          Created: {format(new Date(req.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {req.acceptedHelper && (
                        <span>Helper: {req.acceptedHelper.name}</span>
                      )}
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
                <Skeleton key={n} className="h-28 w-full bg-white rounded-lg border border-border" />
              ))}
            </div>
          ) : resolvedAssists.length === 0 ? (
            <div className="bg-white p-12 rounded-lg border border-border border-dashed text-center space-y-3 text-gray-400 py-16">
              <CheckCircle className="h-10 w-10 text-gray-300 mx-auto" />
              <p className="text-sm font-semibold text-gray-800">No completed assists yet</p>
              <p className="text-xs max-w-xs mx-auto">
                Once you accept a request and the seeker marks the chat as resolved, details will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {resolvedAssists.map((assist) => {
                const req = assist.request || {};
                const colorClass = SKILL_COLORS[req.category] || 'bg-gray-50 text-gray-600 border-gray-200';
                
                return (
                  <div
                    key={assist._id}
                    className="bg-white p-5 rounded-lg border border-border text-left space-y-3.5"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-gray-800 leading-snug">
                          {req.title || 'Help Assist'}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className={cn('text-[10px] font-bold border rounded-sm px-2 py-0.5 capitalize', colorClass)}>
                            {req.category || 'Other'}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            Seeker: {assist.seeker?.name || 'Neighbor'}
                          </span>
                        </div>
                      </div>

                      {/* Score Badge */}
                      {assist.seekerRating && (
                        <div className="flex items-center text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-pill border border-amber-100 shrink-0">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500 mr-0.5" />
                          <span>{assist.seekerRating}.0</span>
                        </div>
                      )}
                    </div>

                    {/* Feedback box */}
                    {assist.seekerFeedback && (
                      <div className="bg-gray-50/50 border border-gray-100 p-3 rounded-md text-xs text-gray-600 italic">
                        &ldquo;{assist.seekerFeedback}&rdquo;
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium pt-1">
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        {assist.seeker?.location || 'Nearby'}
                      </span>
                      <span>
                        Resolved:{' '}
                        {assist.resolvedAt
                          ? format(new Date(assist.resolvedAt), 'MMM d, yyyy')
                          : 'Unknown'}
                      </span>
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
