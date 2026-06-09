'use client';

import * as React from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLanguage } from '@/lib/LanguageContext';
import { NewRequestForm } from '@/components/request/NewRequestForm';
import { WaitingState } from '@/components/request/WaitingState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { SKILL_COLORS } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { Hand, HelpCircle, MessageSquare, MapPin, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function RequestPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = React.useState('need-help');
  const [pendingRequest, setPendingRequest] = React.useState<any>(null);
  const [seekerActiveRequests, setSeekerActiveRequests] = React.useState<any[]>([]);
  const [isLoadingSeeker, setIsLoadingSeeker] = React.useState(true);
  const [communityRequests, setCommunityRequests] = React.useState<any[]>([]);
  const [isLoadingHelper, setIsLoadingHelper] = React.useState(true);
  const [isAcceptingId, setIsAcceptingId] = React.useState<string | null>(null);

  const loadSeekerRequests = React.useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoadingSeeker(true);
      const resPending = await fetch('/api/requests?role=seeker&status=pending');
      const dataPending = await resPending.json();
      setPendingRequest(dataPending.success && dataPending.data?.length > 0 ? dataPending.data[0] : null);
      const resActive = await fetch('/api/requests?role=seeker&status=active');
      const dataActive = await resActive.json();
      if (dataActive.success) setSeekerActiveRequests(dataActive.data || []);
    } catch (e) { console.error(e); }
    finally { setIsLoadingSeeker(false); }
  }, [user?.id]);

  const loadHelperRequests = React.useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoadingHelper(true);
      const res = await fetch('/api/requests?role=helper&status=pending');
      const data = await res.json();
      if (data.success) setCommunityRequests(data.data || []);
    } catch (e) { console.error(e); }
    finally { setIsLoadingHelper(false); }
  }, [user?.id]);

  React.useEffect(() => {
    if (user?.id) { loadSeekerRequests(); loadHelperRequests(); }
  }, [user?.id, loadSeekerRequests, loadHelperRequests]);

  const handleRequestCreated = (req: any) => { setPendingRequest(req); loadSeekerRequests(); };
  const handleCancelPending = () => { setPendingRequest(null); loadSeekerRequests(); };

  const handleAcceptRequest = async (requestId: string) => {
    setIsAcceptingId(requestId);
    try {
      const res = await fetch(`/api/requests/${requestId}/accept`, { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        toast.success(t('notifications.acceptRequest'));
        router.push(`/messages/${result.data.chat._id}`);
      } else {
        toast.error(result.error || 'Failed to accept request');
        loadHelperRequests();
      }
    } catch (e) { toast.error('Could not accept request.'); }
    finally { setIsAcceptingId(null); }
  };

  const handleOpenChat = async (requestId: string) => {
    try {
      const res = await fetch('/api/chats');
      const result = await res.json();
      if (result.success) {
        const chat = result.data.find((c: any) => c.request?._id === requestId || c.request === requestId);
        router.push(chat ? `/messages/${chat._id}` : '/messages');
      }
    } catch (e) { router.push('/messages'); }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full text-left">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 bg-slate-900/50 border border-white/5 p-1 rounded-lg">
          <TabsTrigger
            value="need-help"
            className="flex items-center justify-center gap-1.5 font-semibold py-2.5 rounded-md data-[state=active]:bg-indigo-600/35 data-[state=active]:text-white text-slate-400 transition-all"
          >
            <HelpCircle className="h-4 w-4" />
            {t('request.needHelp')}
          </TabsTrigger>
          <TabsTrigger
            value="offer-help"
            className="flex items-center justify-center gap-1.5 font-semibold py-2.5 rounded-md data-[state=active]:bg-indigo-600/35 data-[state=active]:text-white text-slate-400 transition-all"
          >
            <Hand className="h-4 w-4" />
            {t('request.helpOthers')}
          </TabsTrigger>
        </TabsList>

        {/* ── Need Help Tab ── */}
        <TabsContent value="need-help" className="space-y-6">
          {isLoadingSeeker ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : pendingRequest ? (
            <div className="space-y-4">
              <div className="bg-[#131B2E]/40 border border-white/10 p-4 rounded-lg flex items-center justify-between shadow-2xl backdrop-blur-md">
                <span className="text-xs font-semibold text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/25 uppercase tracking-wider animate-pulse">
                  {t('request.pendingMatch')}
                </span>
                <span className="text-xs text-slate-400">
                  {formatDistanceToNow(new Date(pendingRequest.createdAt), { addSuffix: true })}
                </span>
              </div>
              <WaitingState requestId={pendingRequest._id} onCancel={handleCancelPending} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start animate-in fade-in duration-300">
              <div className="md:col-span-2">
                <NewRequestForm userLocation={user.location || ''} onRequestCreated={handleRequestCreated} />
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t('request.activeSessions')} ({seekerActiveRequests.length})
                </h4>

                {seekerActiveRequests.length === 0 ? (
                  <div className="bg-[#131B2E]/20 p-6 rounded-lg border border-dashed border-white/10 text-center space-y-2">
                    <MessageSquare className="h-8 w-8 text-slate-600 mx-auto" />
                    <p className="text-xs font-semibold text-slate-300">{t('request.noActiveSessions')}</p>
                    <p className="text-[11px] leading-normal text-slate-500">
                      {t('messages.subtitle')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {seekerActiveRequests.map((req) => (
                      <div
                        key={req._id}
                        onClick={() => handleOpenChat(req._id)}
                        className="bg-[#131B2E]/40 border border-white/10 p-4 rounded-lg hover:border-indigo-500/30 transition-all cursor-pointer text-left space-y-2.5 backdrop-blur-md"
                      >
                        <div>
                          <h5 className="text-sm font-bold text-white truncate pr-6">{req.title}</h5>
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-sm font-semibold inline-block mt-1 capitalize">
                            {req.category}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                          <span className="text-slate-400 font-medium truncate">Helper: {req.acceptedHelper?.name || 'Assigned'}</span>
                          <span className="text-indigo-400 font-bold text-[11px] shrink-0">{t('notifications.openChat')} →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Help Others Tab ── */}
        <TabsContent value="offer-help" className="space-y-4">
          {isLoadingHelper ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : communityRequests.length === 0 ? (
            <div className="bg-[#131B2E]/20 p-12 rounded-lg border border-dashed border-white/10 text-center max-w-xl mx-auto space-y-3 py-16">
              <AlertCircle className="h-10 w-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">{t('common.noneYet')}</p>
              <p className="text-xs leading-normal max-w-xs mx-auto text-slate-500">
                We couldn&apos;t find any pending help requests right now. Check back later!
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-w-3xl animate-in fade-in duration-300">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">
                {t('request.pendingRequests')} ({communityRequests.length})
              </h4>
              <div className="space-y-3">
                {communityRequests.map((req) => {
                  const colorClass = SKILL_COLORS[req.category] || 'bg-gray-800 text-slate-300 border-gray-700';
                  const isUrgent = req.urgency === 'urgent';
                  return (
                    <div
                      key={req._id}
                      className={cn(
                        'bg-[#131B2E]/45 border p-5 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left backdrop-blur-md transition-all',
                        isUrgent ? 'border-red-500/40 hover:border-red-500/60' : 'border-white/10 hover:border-indigo-500/20'
                      )}
                    >
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-bold text-white truncate pr-2">{req.title}</h4>
                          <span className={`text-[10px] font-bold border rounded-sm px-2 py-0.5 capitalize ${colorClass}`}>{req.category}</span>
                          <span className={cn('text-[10px] font-bold border rounded-sm px-2 py-0.5 capitalize',
                            isUrgent ? 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          )}>{req.urgency}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed max-w-xl">{req.description}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 font-medium">
                          <span>Seeker: {req.seeker?.name || 'Neighbor'}</span>
                          <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{req.location}</span>
                          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                      <Button
                        disabled={isAcceptingId === req._id}
                        onClick={() => handleAcceptRequest(req._id)}
                        className={cn('font-semibold text-xs h-9 px-5 rounded-md flex items-center justify-center shrink-0 w-full md:w-auto transition-colors',
                          isUrgent ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        )}
                      >
                        {isAcceptingId === req._id
                          ? <><Loader2 className="h-3 w-3 animate-spin mr-1.5" />{t('common.loading')}</>
                          : t('request.acceptChat')
                        }
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
