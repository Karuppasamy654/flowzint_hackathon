import { useEffect, useState } from 'react';
import { createBrowserClient } from '../lib/supabase';

export interface RequestStatusUpdate {
  chatId: string;
  helperName: string;
  helperAvatar?: string;
  helperColor?: string;
  helperId: string;
  requestId: string;
}

export function useRequestStatus(requestId: string | undefined) {
  const [status, setStatus] = useState<'pending' | 'active' | 'resolved' | 'expired' | null>(null);
  const [acceptedDetails, setAcceptedDetails] = useState<RequestStatusUpdate | null>(null);

  // Fetch initial request status
  useEffect(() => {
    if (!requestId) return;

    async function fetchRequest() {
      try {
        const res = await fetch(`/api/requests/${requestId}`);
        const result = await res.json();
        if (result.success && result.data) {
          setStatus(result.data.status);
          if (result.data.status === 'active') {
            // If already active, we can also fetch corresponding chat if necessary
            // or simply set state.
            const acceptedHelper = result.data.acceptedHelper;
            setAcceptedDetails({
              chatId: '', // will be populated or handled by redirect query
              helperName: acceptedHelper?.name || 'Helper',
              helperAvatar: acceptedHelper?.avatarUrl,
              helperColor: acceptedHelper?.avatarColor,
              helperId: acceptedHelper?._id || '',
              requestId: requestId || '',
            });
          }
        }
      } catch (err) {
        console.error('Error fetching request status:', err);
      }
    }

    fetchRequest();
  }, [requestId]);

  // Subscribe to real-time status changes
  useEffect(() => {
    if (!requestId) return;

    const supabase = createBrowserClient();
    const channelName = `request:${requestId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'request_accepted' }, (payload: any) => {
        const data = payload.payload;
        if (!data) return;

        setStatus('active');
        setAcceptedDetails({
          chatId: data.chatId,
          helperName: data.helperName,
          helperAvatar: data.helperAvatar,
          helperColor: data.helperColor,
          helperId: data.helperId,
          requestId: data.requestId,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  return {
    status,
    acceptedDetails,
  };
}
