'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar } from '../ui/avatar';
import { format, isToday, isYesterday } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import { MessageSquare, CheckCircle, X, Loader2 } from 'lucide-react';
import { UserProfileModal } from '../profile/UserProfileModal';

interface ChatItem {
  _id: string;
  request: {
    title: string;
    category: string;
    urgency: string;
    status: string;
  };
  seeker: {
    _id: string;
    name: string;
    avatarUrl?: string;
    avatarColor?: string;
  };
  helper: {
    _id: string;
    name: string;
    avatarUrl?: string;
    avatarColor?: string;
  };
  status: 'active' | 'resolved';
  lastMessage: {
    text: string;
    createdAt: string;
    sender: string;
  } | null;
  unreadCount: number;
}

interface ConversationListProps {
  currentUserId: string;
}

function formatTimestamp(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'd MMM');
  } catch {
    return '';
  }
}

export function ConversationList({ currentUserId }: ConversationListProps) {
  const pathname = usePathname();
  const [chats, setChats] = React.useState<ChatItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<any | null>(null);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  // Debounced user search
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/users?q=${encodeURIComponent(searchQuery)}`);
        const result = await res.json();
        if (result.success) {
          setSearchResults((result.data || []).filter((u: any) => u._id !== currentUserId));
        }
      } catch (e) {
        console.error('Failed to search users:', e);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentUserId]);

  React.useEffect(() => {
    async function loadChats() {
      try {
        const res = await fetch('/api/chats');
        const result = await res.json();
        if (result.success) setChats(result.data || []);
      } catch (e) {
        console.error('Failed to load conversations list:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadChats();
  }, [pathname]);

  if (isLoading) {
    return (
      <div style={{ background: '#FFFFFF' }}>
        {[1, 2, 3].map((n) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #F2F2F2' }}>
            <Skeleton className="h-12 w-12 rounded-full" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const activeChats = chats.filter((c) => c.status === 'active');
  const resolvedChats = chats.filter((c) => c.status === 'resolved');

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 8, overflow: 'hidden', border: '1px solid #F2F2F2' }}>
      {/* Search Input */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #F2F2F2', background: '#F0F2F5', position: 'relative' }}>
        <input
          type="text"
          placeholder="Search neighbors to message…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            background: '#FFFFFF',
            color: '#111B21',
            border: 'none',
            borderRadius: 8,
            padding: '8px 32px 8px 12px',
            fontSize: 14,
            outline: 'none',
          }}
          className="placeholder:text-[#8696A0]"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); setSearchResults([]); }}
            style={{ position: 'absolute', right: 22, top: '50%', transform: 'translateY(-50%)', color: '#8696A0', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>

      {searchQuery.trim() !== '' ? (
        /* Search Results */
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8696A0', padding: '8px 16px', background: '#F0F2F5' }}>
            Search Results ({searchResults.length})
          </div>
          {isSearching ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              <Loader2 style={{ width: 20, height: 20, color: '#1B6CA8' }} className="animate-spin" />
            </div>
          ) : searchResults.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#8696A0', fontSize: 14 }}>
              No neighbors found matching &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            searchResults.map((u) => (
              <div
                key={u._id}
                onClick={() => { setSelectedUser(u); setIsProfileOpen(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #F2F2F2', cursor: 'pointer', background: 'white' }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#F5F5F5')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'white')}
              >
                <Avatar src={u.avatarUrl} name={u.name} color={u.avatarColor} size="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 500, color: '#111B21', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</p>
                  <p style={{ fontSize: 13, color: '#667781', margin: 0 }}>{u.location}</p>
                </div>
                <span style={{ fontSize: 12, color: '#1B6CA8', fontWeight: 600 }}>View Profile</span>
              </div>
            ))
          )}
        </div>
      ) : chats.length === 0 ? (
        /* Empty state */
        <div style={{ padding: '40px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare style={{ width: 24, height: 24, color: '#8696A0' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#111B21', margin: 0 }}>No conversations yet</p>
          <p style={{ fontSize: 13, color: '#667781', margin: 0, maxWidth: 240 }}>
            Once you accept a request or someone accepts yours, chats appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Active chats section */}
          {activeChats.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8696A0', padding: '8px 16px', background: '#F0F2F5' }}>
                Active
              </div>
              {activeChats.map((chat) => {
                const otherParty = chat.seeker?._id === currentUserId ? chat.helper : chat.seeker;
                if (!otherParty || !otherParty._id) return null;
                const isActive = pathname.includes(`/messages/${chat._id}`);
                const hasUnread = chat.unreadCount > 0;

                return (
                  <Link
                    key={chat._id}
                    href={`/messages/${chat._id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      borderBottom: '1px solid #F2F2F2',
                      background: isActive ? '#F0F2F5' : 'white',
                      textDecoration: 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseOver={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#F5F5F5'; }}
                    onMouseOut={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'white'; }}
                  >
                    {/* Avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar src={otherParty.avatarUrl} name={otherParty.name} color={otherParty.avatarColor} size="lg" />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontSize: 15, fontWeight: hasUnread ? 600 : 500, color: '#111B21', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {otherParty.name}
                        </span>
                        <span style={{ fontSize: 12, color: hasUnread ? '#1B6CA8' : '#667781', flexShrink: 0, marginLeft: 8 }}>
                          {chat.lastMessage ? formatTimestamp(chat.lastMessage.createdAt) : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: 14, color: '#667781', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {chat.lastMessage
                            ? chat.lastMessage.sender === currentUserId
                              ? `You: ${chat.lastMessage.text}`
                              : chat.lastMessage.text
                            : 'Chat opened. Say hello!'}
                        </p>
                        {hasUnread && (
                          <span style={{
                            background: '#1B6CA8', color: 'white', fontSize: 12, fontWeight: 700,
                            minWidth: 20, height: 20, borderRadius: 10, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', padding: '0 5px', marginLeft: 8, flexShrink: 0,
                          }}>
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </>
          )}

          {/* Resolved chats section */}
          {resolvedChats.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8696A0', padding: '8px 16px', background: '#F0F2F5' }}>
                Resolved
              </div>
              {resolvedChats.map((chat) => {
                const otherParty = chat.seeker?._id === currentUserId ? chat.helper : chat.seeker;
                if (!otherParty || !otherParty._id) return null;
                const isActive = pathname.includes(`/messages/${chat._id}`);

                return (
                  <Link
                    key={chat._id}
                    href={`/messages/${chat._id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      borderBottom: '1px solid #F2F2F2',
                      background: isActive ? '#F0F2F5' : 'white',
                      textDecoration: 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseOver={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#F5F5F5'; }}
                    onMouseOut={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'white'; }}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar src={otherParty.avatarUrl} name={otherParty.name} color={otherParty.avatarColor} size="lg" />
                      <span style={{
                        position: 'absolute', bottom: -2, right: -2,
                        background: '#22C55E', borderRadius: '50%', width: 16, height: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid white',
                      }}>
                        <CheckCircle style={{ width: 10, height: 10, color: 'white' }} />
                      </span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontSize: 15, fontWeight: 500, color: '#667781', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {otherParty.name}
                        </span>
                        <span style={{ fontSize: 12, color: '#667781', flexShrink: 0, marginLeft: 8 }}>
                          {chat.lastMessage ? formatTimestamp(chat.lastMessage.createdAt) : ''}
                        </span>
                      </div>
                      <p style={{ fontSize: 14, color: '#667781', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {chat.lastMessage ? chat.lastMessage.text : 'Resolved'}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </>
          )}
        </>
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        user={selectedUser}
        currentUserId={currentUserId}
      />
    </div>
  );
}
