'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { HelperRow } from './HelperRow';
import { Button } from '../ui/button';
import { toast } from '@/components/ui/toast';
import { AlertCircle, HelpCircle, Loader2, Users, X } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface WaitingStateProps {
  requestId: string;
  onCancel: () => void;
}

// Mock helper profiles for the radar visualization if no matching db helpers are returned
const MOCK_RADAR_HELPERS = [
  {
    _id: 'c7cd0759e49f9ae65e4f46dc', // arun (from db.json)
    name: 'Arun Kumar',
    avatarColor: '#065F46',
    rating: { total: 5, count: 1 },
    avgRating: 4.8,
    location: 'Royapuram, Chennai',
    skills: ['Plumbing', 'Medical', 'Mental Health'],
    x: 35, // coordinates on radar (percentage)
    y: 30,
    delay: 4.2
  },
  {
    _id: '513bbdd386689b3e5402b40b', // sk (from db.json)
    name: 'Santhosh Kumar',
    avatarColor: '#B45309',
    rating: { total: 0, count: 0 },
    avgRating: 4.9,
    location: 'Adyar, Chennai',
    skills: ['Design', 'Web Dev'],
    x: 65,
    y: 70,
    delay: 5.8
  },
  {
    _id: '0437074e700cee7f9c63a157', // tester user
    name: 'Priya Raj',
    avatarColor: '#0F766E',
    rating: { total: 5, count: 1 },
    avgRating: 4.7,
    location: 'T Nagar, Chennai',
    skills: ['Elder Care', 'Meal Prep'],
    x: 75,
    y: 25,
    delay: 7.5
  }
];

function analyzeRequest(title: string, description: string, urgencyField: string) {
  const words = `${title} ${description}`.toLowerCase().split(/\W+/);
  
  const criticalKeywords = ['emergency', 'fire', 'leak', 'flood', 'blood', 'heart', 'pain', 'broken', 'help', 'urgent', 'smoke', 'gasp', 'choke', 'danger', 'hospital', 'accident', 'injury', 'gas'];
  const moderateKeywords = ['fix', 'repair', 'plumbing', 'sink', 'tool', 'lift', 'move', 'ride', 'tutorial', 'learn', 'setup', 'install', 'key', 'lock', 'leak'];
  
  const foundCritical = criticalKeywords.filter(w => words.includes(w));
  const foundModerate = moderateKeywords.filter(w => words.includes(w));
  
  let score = 30; // base score
  if (urgencyField === 'urgent') score += 40;
  else if (urgencyField === 'today') score += 20;
  
  score += foundCritical.length * 15;
  score += foundModerate.length * 5;
  score = Math.min(Math.max(score, 15), 99);
  
  const keywords = Array.from(new Set([...foundCritical, ...foundModerate]));
  if (keywords.length === 0) {
    keywords.push('assistance', 'general-help');
  }
  
  let recommendation = 'Standard dispatch to community helpers.';
  if (score > 75) {
    recommendation = 'Critical status. Initiating immediate priority matching & emergency neighbor broadcasts.';
  } else if (score > 45) {
    recommendation = 'Elevated urgency. Broadcasting requests within a 5.0 km mesh radius.';
  }
  
  return {
    score,
    keywords: keywords.slice(0, 5),
    recommendation
  };
}

export function WaitingState({ requestId, onCancel }: WaitingStateProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [requestDetails, setRequestDetails] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCancelling, setIsCancelling] = React.useState(false);

  const [elapsed, setElapsed] = React.useState(0);
  const [hasSimulatedAccepted, setHasSimulatedAccepted] = React.useState(false);

  // Poll request status
  React.useEffect(() => {
    let active = true;

    async function checkStatus() {
      try {
        const res = await fetch(`/api/requests/${requestId}`);
        const result = await res.json();
        
        if (!active) return;
        
        if (result.success) {
          setRequestDetails(result.data);
          setIsLoading(false);

          // If request is accepted by helper, status becomes active.
          // Redirect seeker to the Chat!
          if (result.data.status === 'active' && result.data.acceptedHelper) {
            // Find the chat for this request
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
                return;
              }
            }
            // Fallback redirect to conversation list if direct chat room isn't ready
            router.push('/messages');
          } else if (result.data.status === 'cancelled' || result.data.status === 'expired') {
            toast.info(`Request is no longer active (status: ${result.data.status})`);
            onCancel();
          }
        }
      } catch (e) {
        console.error('Error polling request status:', e);
      }
    }

    checkStatus();
    // Poll every 3 seconds
    const interval = setInterval(checkStatus, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [requestId, router, onCancel]);

  // Elapsed timer increment
  React.useEffect(() => {
    if (isLoading || !requestDetails) return;
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 0.1);
    }, 100);
    return () => clearInterval(interval);
  }, [isLoading, requestDetails]);

  // AI calculations memo
  const aiAnalysis = React.useMemo(() => {
    if (!requestDetails) return null;
    return analyzeRequest(
      requestDetails.title || '',
      requestDetails.description || '',
      requestDetails.urgency || 'flexible'
    );
  }, [requestDetails]);

  // Helper displays coordinates memo
  const displayHelpers = React.useMemo(() => {
    const raw = requestDetails?.matchedHelpers && requestDetails.matchedHelpers.length > 0
      ? requestDetails.matchedHelpers
      : MOCK_RADAR_HELPERS.filter(h => h._id !== user?.id);

    return raw.map((h: any, idx: number) => ({
      ...h,
      x: h.x !== undefined ? h.x : [35, 65, 75, 25, 55][idx % 5],
      y: h.y !== undefined ? h.y : [30, 70, 25, 80, 45][idx % 5],
      delay: h.delay !== undefined ? h.delay : 4.2 + idx * 1.5
    }));
  }, [requestDetails, user?.id]);

  // Terminal log messages
  const terminalLogs = React.useMemo(() => {
    if (!requestDetails || !aiAnalysis) return [];
    
    const maxScore = aiAnalysis.score;
    const currentScore = Math.min(Math.round((elapsed / 3.0) * maxScore), maxScore);
    
    return [
      { t: 0.3, msg: '⚡ Initializing cognitive semantic parser...' },
      { t: 0.9, msg: `🔍 Tokenizing request: "${requestDetails.title}"` },
      { t: 1.6, msg: `🏷️ Extracted semantic identifiers: [${aiAnalysis.keywords.join(', ')}]` },
      { t: 2.3, msg: `📊 Evaluating priority severity weights...` },
      { t: 2.8, msg: `⚖️ Urgency factor computed: ${currentScore}% severity weight.` },
      { t: 3.2, msg: `🚀 Matching protocol deployed: ${aiAnalysis.recommendation}` }
    ];
  }, [requestDetails, aiAnalysis, elapsed]);

  // Simulated acceptance trigger
  React.useEffect(() => {
    if (isLoading || !requestDetails || requestDetails.status !== 'pending') return;
    if (process.env.NEXT_PUBLIC_USE_MOCK_DB !== 'true') return;
    if (hasSimulatedAccepted) return;

    if (elapsed >= 11.0) {
      setHasSimulatedAccepted(true);
      
      const targetHelper = displayHelpers[0];
      if (!targetHelper) return;

      const acceptRequest = async () => {
        try {
          console.log(`[Demo Mode] Simulated acceptance by helper: ${targetHelper.name} (${targetHelper._id})`);
          const res = await fetch(`/api/requests/${requestId}/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ helperId: targetHelper._id })
          });
          const result = await res.json();
          if (result.success) {
            console.log('[Demo Mode] Request accepted successfully.');
          } else {
            console.error('[Demo Mode] Simulated accept failed:', result.error);
          }
        } catch (err) {
          console.error('[Demo Mode] Error in simulated accept:', err);
        }
      };

      acceptRequest();
    }
  }, [elapsed, isLoading, requestDetails, requestId, displayHelpers, hasSimulatedAccepted]);

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

  if (isLoading || !requestDetails) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm text-slate-400 font-medium">Loading request status...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <style>{`
        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes laser-scan {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.8; }
          100% { top: 0%; opacity: 0.8; }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.4; }
          70% { transform: scale(2); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>

      {/* Main card */}
      <div className="bg-[#131B2E]/50 border border-white/10 p-6 rounded-lg shadow-2xl backdrop-blur-md relative overflow-hidden text-left">
        {elapsed < 3.5 ? (
          /* Stage 1: AI Analysis */
          <div className="space-y-6 relative min-h-[320px] flex flex-col justify-between">
            {/* Laser scanning bar */}
            <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[laser-scan_3s_ease-in-out_infinite]" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/35">
                    AI Cognitive Scan In Progress
                  </span>
                </div>
                <h3 className="text-xl font-display font-semibold text-white">
                  Analyzing Request Parameters...
                </h3>
              </div>

              {/* Urgency Gauge */}
              <div className="flex items-center gap-3 bg-[#0B0F1A]/60 border border-white/5 rounded-lg px-4 py-2 shrink-0">
                <div className="relative flex items-center justify-center h-12 w-12">
                  {/* Circular progress bar */}
                  <svg className="w-12 h-12 transform -rotate-90">
                    <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="transparent" />
                    <circle 
                      cx="24" 
                      cy="24" 
                      r="20" 
                      stroke="rgb(6, 182, 212)" 
                      strokeWidth="4" 
                      fill="transparent" 
                      strokeDasharray={125.6} 
                      strokeDashoffset={125.6 - (125.6 * Math.min((elapsed / 3.0) * (aiAnalysis?.score || 0), aiAnalysis?.score || 0)) / 100}
                      className="transition-all duration-100 ease-out"
                    />
                  </svg>
                  <span className="absolute text-xs font-bold text-cyan-400">
                    {Math.min(Math.round((elapsed / 3.0) * (aiAnalysis?.score || 0)), aiAnalysis?.score || 0)}%
                  </span>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Urgency Severity</p>
                  <p className="text-xs font-semibold text-white capitalize">{requestDetails.urgency} priority</p>
                </div>
              </div>
            </div>

            {/* Middle info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Parsed Content</h4>
                  <div className="bg-[#0B0F1A]/40 border border-white/5 p-4 rounded-md space-y-2">
                    <p className="text-sm font-semibold text-white truncate">{requestDetails.title}</p>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{requestDetails.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Semantic Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {aiAnalysis?.keywords.map(kw => (
                      <span key={kw} className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-2.5 py-1 rounded text-xs font-semibold capitalize">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Console window */}
              <div className="space-y-2 flex flex-col">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Diagnostics Console</h4>
                <div className="flex-1 bg-black/50 border border-white/5 rounded-md p-4 font-mono text-xs text-slate-400 space-y-1.5 min-h-[140px] max-h-[160px] overflow-y-auto">
                  {terminalLogs.map((log, idx) => elapsed >= log.t ? (
                    <div key={idx} className="animate-in fade-in slide-in-from-left-2 duration-200 text-cyan-300/80 leading-normal">
                      <span className="text-cyan-500 mr-1.5">&gt;</span>
                      {log.msg}
                    </div>
                  ) : null)}
                </div>
              </div>
            </div>

            {/* Cancel at bottom */}
            <div className="pt-4 border-t border-white/5 flex justify-end">
              <Button
                onClick={handleCancelRequest}
                disabled={isCancelling}
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-semibold flex items-center gap-1.5"
              >
                {isCancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                Cancel Broadcast
              </Button>
            </div>
          </div>
        ) : (
          /* Stage 2 & 3: Radar sweep and Match Results */
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-500/35">
                    🛰️ Active Mesh Radar Scanning
                  </span>
                </div>
                <h3 className="text-xl font-display font-semibold text-white">
                  Broadcasting to Nearby Helpers
                </h3>
              </div>

              {/* Status Radius */}
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400">Search Radius</p>
                <p className="text-sm font-semibold text-indigo-300">
                  {elapsed < 7.0 ? '1.0 km' : elapsed < 13.0 ? '5.0 km' : 'Global Network'}
                </p>
              </div>
            </div>

            {/* Main view container: Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Radar Widget Column (5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[#0B0F1A]/60 border border-white/5 rounded-lg p-6 min-h-[300px] relative overflow-hidden">
                {/* SVG radar drawing */}
                <div className="relative w-60 h-60 flex items-center justify-center">
                  
                  {/* Concentric grid lines */}
                  <div className="absolute inset-0 rounded-full border border-white/5" />
                  <div className="absolute inset-[15%] rounded-full border border-white/5" />
                  <div className="absolute inset-[30%] rounded-full border border-white/5" />
                  <div className="absolute inset-[45%] rounded-full border border-white/5" />
                  <div className="absolute inset-[60%] rounded-full border border-white/5" />

                  {/* Crosshairs */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/5" />
                  <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-white/5" />
                  
                  {/* Rotating sweep line */}
                  <div 
                    className="absolute inset-0 rounded-full animate-[radar-sweep_4s_linear_infinite]"
                    style={{
                      background: 'conic-gradient(from 0deg at 50% 50%, rgba(99, 102, 241, 0.15) 0deg, rgba(99, 102, 241, 0) 90deg)',
                    }}
                  />

                  {/* Range expand pulses */}
                  {elapsed >= 7.0 && (
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/10 animate-[ping-slow_4s_linear_infinite]" />
                  )}
                  {elapsed >= 13.0 && (
                    <div className="absolute inset-0 rounded-full border-2 border-violet-500/15 animate-[ping-slow_5s_linear_infinite]" style={{ animationDelay: '1.5s' }} />
                  )}

                  {/* Center Node (Seeker) */}
                  <div className="absolute z-20 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 border border-indigo-300/40 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                    <Users className="h-3.5 w-3.5" />
                  </div>

                  {/* Helper Pins */}
                  {displayHelpers.map((helper: any) => {
                    const isTriggered = elapsed >= helper.delay;
                    if (!isTriggered) return null;

                    return (
                      <div
                        key={helper._id}
                        className="absolute z-10 transition-all duration-700 ease-out transform -translate-x-1/2 -translate-y-1/2 animate-in zoom-in-50 duration-500"
                        style={{
                          left: `${helper.x}%`,
                          top: `${helper.y}%`
                        }}
                      >
                        {/* Ping radar circle */}
                        <span className="absolute -inset-1.5 rounded-full bg-indigo-500/30 animate-ping duration-1500" />
                        
                        {/* Avatar Node */}
                        <div 
                          className="relative flex h-8 w-8 items-center justify-center rounded-full border border-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.3)] hover:scale-110 transition-transform cursor-pointer"
                          style={{ backgroundColor: helper.avatarColor || '#7C3AED' }}
                          title={helper.name}
                        >
                          <span className="text-[10px] font-bold text-white uppercase">
                            {helper.name.slice(0, 2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 text-center">
                  <p className="text-[11px] text-slate-400 font-medium">
                    {elapsed < 7.0 
                      ? 'Mesh network active. Scanning standard radius...' 
                      : 'Expanding search coordinates to wider grid...'}
                  </p>
                </div>
              </div>

              {/* Helper List Column (7 cols) */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                
                {/* List of matched nodes */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Matched Local Helpers ({displayHelpers.filter(h => elapsed >= h.delay).length})
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {displayHelpers.map((helper: any, idx: number) => {
                      const isTriggered = elapsed >= helper.delay;
                      if (!isTriggered) {
                        return (
                          <div 
                            key={helper._id || idx}
                            className="flex items-center gap-3 bg-[#131B2E]/20 p-3.5 rounded-md border border-dashed border-white/5 text-slate-500 text-xs select-none"
                          >
                            <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                            <span>Scanning mesh node...</span>
                          </div>
                        );
                      }

                      return (
                        <div key={helper._id} className="animate-in slide-in-from-bottom-2 duration-300">
                          <HelperRow helper={helper} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cancel request at bottom */}
                <div className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-white/5">
                  <span className="text-[11px] text-slate-500 font-medium italic">
                    {process.env.NEXT_PUBLIC_USE_MOCK_DB === 'true' 
                      ? '⏱️ Auto-accept active (Demo Mode)' 
                      : '⌛ Waiting for neighbor acceptance...'}
                  </span>
                  
                  <Button
                    onClick={handleCancelRequest}
                    disabled={isCancelling}
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-semibold flex items-center gap-1.5"
                  >
                    {isCancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                    Cancel Request
                  </Button>
                </div>
              </div>

            </div>

            {/* Escalation Notification banner */}
            {elapsed >= 7.0 && elapsed < 13.0 && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg flex items-center gap-3 text-xs text-indigo-300 animate-in fade-in slide-in-from-top-2 duration-500">
                <AlertCircle className="h-4 w-4 shrink-0 text-indigo-400" />
                <div>
                  <span className="font-bold">Automated Search Escalation:</span> Search scope extended to 5km. Broadcasting requests to secondary backup mesh coordinates.
                </div>
              </div>
            )}
            
            {elapsed >= 13.0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex items-center gap-3 text-xs text-amber-300 animate-in fade-in slide-in-from-top-2 duration-500">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 animate-pulse" />
                <div>
                  <span className="font-bold">Wide Broadcast Active:</span> Searching broader municipality. Sending notifications to top-rated nearby expert helpers.
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
