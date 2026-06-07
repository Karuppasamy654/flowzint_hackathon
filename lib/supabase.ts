import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isPlaceholder = !supabaseUrl || supabaseUrl.includes('placeholder');

// Browser client using NEXT_PUBLIC_ variables
export function createBrowserClient() {
  if (isPlaceholder || !supabaseAnonKey) {
    return {
      channel: () => ({
        on: () => ({
          subscribe: () => ({})
        })
      }),
      removeChannel: () => {}
    } as any;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Server-side admin client using service role key
export function createServerClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createServerClient should only be used on the server side.');
  }
  if (isPlaceholder || !supabaseServiceRoleKey) {
    return {
      channel: () => ({
        subscribe: (cb: any) => {
          cb('SUBSCRIBED');
        },
        send: async () => ({})
      }),
      removeChannel: () => {}
    } as any;
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Broadcasts an event to a channel via Supabase Realtime.
 */
export async function broadcastRealtimeEvent(
  channelName: string,
  event: string,
  payload: Record<string, any>
) {
  if (isPlaceholder) {
    console.log(`[Supabase Realtime Mock] Broadcast on ${channelName} -> event: ${event}`, payload);
    return;
  }
  try {
    const supabase = createServerClient();
    const channel = supabase.channel(channelName);
    
    await new Promise<void>((resolve) => {
      channel.subscribe((status: any) => {
        if (status === 'SUBSCRIBED') {
          channel
            .send({
              type: 'broadcast',
              event,
              payload,
            })
            .then(() => {
              supabase.removeChannel(channel);
              resolve();
            })
            .catch((err: any) => {
              console.error(`Error sending broadcast on channel ${channelName}:`, err);
              supabase.removeChannel(channel);
              resolve();
            });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`Channel subscription issue ${status} for channel ${channelName}`);
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Failed to broadcast realtime event:', error);
  }
}
