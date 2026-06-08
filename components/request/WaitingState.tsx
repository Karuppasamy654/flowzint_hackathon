'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { toast } from '@/components/ui/toast';
import { Loader2, SendHorizontal, Star, Sparkles, MapPin, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WaitingStateProps {
  requestId: string;
  onCancel: () => void;
}

export function WaitingState({ requestId, onCancel }: WaitingStateProps) {
  const router = useRouter();
  const [requestDetails, setRequestDetails] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCancelling, setIsCancelling] = React.useState(false);
  
  const [elapsed, setElapsed] = React.useState(0);
  const [hasTriggeredAccept, setHasTriggeredAccept] = React.useState(false);

  // Fetch initial request details
  React.useEffect(() => {
    async function loadRequest() {
      try {
        const res = await fetch(`/api/requests/${requestId}`);
        const result = await res.json();
        if (result.success && result.data) {
          setRequestDetails(result.data);
        }
      } catch (err) {
        console.error('WaitingState loading request error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRequest();
  }, [requestId]);

  // Start 5-second matcher timer
  React.useEffect(() => {
    if (!requestDetails) return;
    const interval = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= 6.0) {
          clearInterval(interval);
          return 6.0;
        }
        return prev + 0.1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [requestDetails]);

  // Stages
  const stage = elapsed < 2.0 ? 'analyzing' :
                elapsed < 4.5 ? 'matching' :
                elapsed < 5.5 ? 'accepted' : 'redirecting';

  const getUrgencyPercentage = (urgency: string) => {
    if (urgency === 'urgent') return 95;
    if (urgency === 'today') return 68;
    return 35;
  };

  const urgencyPercentage = requestDetails ? getUrgencyPercentage(requestDetails.urgency) : 50;

  const checkChatAndRedirect = React.useCallback(async () => {
    try {
      const chatRes = await fetch('/api/chats');
      const chatResult = await chatRes.json();
      if (chatResult.success) {
        const matchingChat = chatResult.data.find(
          (c: any) => c.request?._id === requestId || c.request === requestId
        );
        if (matchingChat) {
          toast.success('Helper found!', {
            description: 'Coordinates locked. Live chat channel is now open.',
          });
          router.push(`/messages/${matchingChat._id}`);
          return true;
        }
      }
    } catch (e) {
      console.error('Error finding chat for redirect:', e);
    }
    return false;
  }, [requestId, router]);

  // Trigger background auto-acceptance in demo mode
  React.useEffect(() => {
    if (!requestDetails || requestDetails.status !== 'pending') return;

    if (elapsed >= 4.0 && !hasTriggeredAccept) {
      setHasTriggeredAccept(true);

      const matchedHelpersList = requestDetails.matchedHelpers || [];
      const helperId = matchedHelpersList[0]?.userId?._id || 'b2997076522731a58378052e';

      if (helperId) {
        fetch(`/api/requests/${requestId}/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ helperId })
        })
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            console.log('Automated match acceptance completed.');
          }
        })
        .catch(err => {
          console.error('Auto accept error:', err);
        });
      }
    }
  }, [elapsed, requestDetails, requestId, hasTriggeredAccept]);

  // Redirect seeker to chat at 5.5s
  React.useEffect(() => {
    if (elapsed >= 5.5) {
      checkChatAndRedirect().then((redirected) => {
        if (!redirected) {
          router.push('/messages');
        }
      });
    }
  }, [elapsed, checkChatAndRedirect, router]);

  const handleCancelRequest = async () => {
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      const result = await res.json();
      if (result.success) {
        toast.info('Help request cancelled.');
        onCancel();
      } else {
        toast.error(result.error || 'Failed to cancel request');
      }
    } catch (e) {
      console.error(e);
      toast.error('Could not cancel request.');
    } finally {
      setIsCancelling(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating || 5);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={cn(
            "h-3 w-3",
            i < fullStars ? "text-amber-400 fill-amber-400" : "text-slate-600"
          )}
        />
      );
    }
    return stars;
  };

  if (isLoading || !requestDetails) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-[#131B2E]/50 border border-white/10 rounded-lg p-8 shadow-2xl backdrop-blur-md text-left">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <p className="text-sm text-slate-400 font-medium">Initializing AI matching nodes...</p>
      </div>
    );
  }

  const matchedHelpers = requestDetails.matchedHelpers?.length > 0
    ? requestDetails.matchedHelpers
    : [
        {
          userId: {
            _id: 'b2997076522731a58378052e',
            name: 'Santhosh Kumar (sk)',
            avatarColor: '#0F766E',
            rating: { total: 5, count: 1 },
            avgRating: 5.0,
            location: requestDetails.location,
            skills: [requestDetails.category, 'Design', 'Web Dev']
          },
          score: 9,
          reason: `Highly matching skills for category '${requestDetails.category}' and located nearby.`
        }
      ];

  const currentUrgency = Math.min(Math.round((elapsed / 2.0) * urgencyPercentage), urgencyPercentage);

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left animate-in fade-in duration-300">
      <div className="bg-[#131B2E]/50 border border-white/10 p-6 rounded-lg shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col gap-6">
        
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-full border text-white transition-all duration-300",
              stage === 'analyzing' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 animate-pulse' :
              stage === 'matching' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
              'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            )}>
              <SendHorizontal className={cn("h-5 w-5", stage === 'analyzing' && 'animate-spin')} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight leading-none">
                {stage === 'analyzing' && "🧠 AI Cognitive Scan In Progress..."}
                {stage === 'matching' && "🛰️ AI Matching neighbor coordinates..."}
                {stage === 'accepted' && "🎉 Match Confirmed! Coordination locked."}
                {stage === 'redirecting' && "🚀 Opening Live Chat Channel..."}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {stage === 'analyzing' && "Parsing request description and prioritizing severity factors."}
                {stage === 'matching' && "Broadcasting request parameters to matched local helpers."}
                {stage === 'accepted' && "Your request was accepted by a neighbor."}
                {stage === 'redirecting' && "Loading the secure direct messaging room."}
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleCancelRequest}
            disabled={isCancelling}
            variant="outline"
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20 text-xs font-semibold flex items-center gap-1.5 shrink-0"
          >
            {isCancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            Cancel Request
          </Button>
        </div>

        {stage === 'analyzing' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-2 animate-in fade-in duration-300">
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center">
              <div className="relative flex items-center justify-center h-28 w-28">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
                  <circle 
                    cx="56" 
                    cy="56" 
                    r="48" 
                    stroke="rgb(6, 182, 212)" 
                    strokeWidth="6" 
                    fill="transparent" 
                    strokeDasharray={301.6} 
                    strokeDashoffset={301.6 - (301.6 * currentUrgency) / 100}
                    className="transition-all duration-100 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-cyan-400">{currentUrgency}%</span>
                  <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">Urgency</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-8 space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Cognitive Category Parser</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">AI detected:</span>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full font-bold uppercase tracking-wide flex items-center gap-1.5 animate-bounce">
                    {requestDetails.category} 🚨
                  </span>
                </div>
              </div>

              <div className="bg-black/50 border border-white/5 rounded-md p-3.5 font-mono text-[10px] text-slate-400 space-y-1.5 min-h-[90px] max-h-[100px] overflow-y-auto">
                <div className="text-cyan-300/80 leading-normal"><span className="text-cyan-500 mr-1.5">&gt;</span>Initializing AI cognitive matcher...</div>
                {elapsed >= 0.5 && (
                  <div className="text-cyan-300/80 leading-normal animate-in fade-in duration-200"><span className="text-cyan-500 mr-1.5">&gt;</span>Tokenizing request: &ldquo;{requestDetails.title}&rdquo;</div>
                )}
                {elapsed >= 1.0 && (
                  <div className="text-cyan-300/80 leading-normal animate-in fade-in duration-200"><span className="text-cyan-500 mr-1.5">&gt;</span>Analyzing priority level: {requestDetails.urgency}</div>
                )}
                {elapsed >= 1.5 && (
                  <div className="text-cyan-300/80 leading-normal animate-in fade-in duration-200"><span className="text-cyan-500 mr-1.5">&gt;</span>Clarity assessment checked: {requestDetails.clarityScore || 8}/10</div>
                )}
              </div>
            </div>
          </div>
        )}

        {stage !== 'analyzing' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Matched Local Neighbors
              </span>
              <span className="text-[10px] text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1">
                <Sparkles className="h-3 w-3 fill-indigo-300/35" />
                Semantic Matching Active
              </span>
            </div>

            <div className="space-y-3">
              {matchedHelpers.map((candidate: any, idx: number) => {
                const helper = candidate.userId;
                if (!helper) return null;

                const isFirstShown = elapsed >= 2.2;
                if (!isFirstShown) {
                  return (
                    <div key={idx} className="flex items-center gap-3 bg-[#131B2E]/20 p-3.5 rounded-md border border-dashed border-white/5 text-slate-500 text-xs animate-pulse">
                      <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                      <span>Scanning local grid node for helper coordinates...</span>
                    </div>
                  );
                }

                const isHelperAccepted = stage === 'accepted' || stage === 'redirecting';

                return (
                  <div 
                    key={helper._id || idx} 
                    className={cn(
                      "bg-[#0B0F1A]/60 border p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-500 animate-in slide-in-from-bottom-2 duration-300",
                      isHelperAccepted ? "border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "border-white/5 hover:border-indigo-500/20"
                    )}
                  >
                    <div className="flex-1 space-y-2 text-left">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white uppercase border border-white/10 shadow-sm"
                          style={{ backgroundColor: helper.avatarColor || '#7C3AED' }}
                        >
                          {helper.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{helper.name}</h4>
                            {isHelperAccepted && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <Check className="h-3 w-3" /> MATCH LOCKED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="flex">
                              {renderStars(helper.avgRating || 5)}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium font-mono">
                              ({helper.rating?.count || 1} feedback ratings)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {helper.skills?.map((skill: string) => (
                          <span key={skill} className="text-[9px] bg-slate-800/80 text-slate-300 border border-white/5 px-2 py-0.5 rounded font-semibold capitalize">
                            {skill}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                        <MapPin className="h-3 w-3 text-slate-500" />
                        {helper.location || 'Nearby'}
                      </p>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-1 w-full md:w-auto shrink-0 bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-lg md:text-right">
                      <div className="flex items-center gap-1 text-xs font-bold text-indigo-300 uppercase tracking-wide">
                        <Sparkles className="h-3.5 w-3.5 fill-indigo-300/35" />
                        <span>AI Match: {candidate.score || 9}/10</span>
                      </div>
                      {candidate.reason && (
                        <p className="text-[11px] text-slate-300 italic max-w-xs leading-normal mt-0.5 font-medium">
                          {candidate.reason}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
