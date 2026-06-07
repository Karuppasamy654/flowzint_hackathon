'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { MessageSquare, ShieldCheck, CheckCircle, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
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

export function ConversationList({ currentUserId }: ConversationListProps) {
  const pathname = usePathname();
  const [chats, setChats] = React.useState<ChatItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<any | null>(null);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/users?q=${encodeURIComponent(searchQuery)}`);
        const result = await res.json();
        if (result.success) {
          // Filter out current user from search results
          const filtered = (result.data || []).filter((u: any) => u._id !== currentUserId);
          setSearchResults(filtered);
        }
      } catch (e) {
        console.error('Failed to search users:', e);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, currentUserId]);

  React.useEffect(() => {
    async function loadChats() {
      try {
        const res = await fetch('/api/chats');
        const result = await res.json();
        if (result.success) {
          setChats(result.data || []);
        }
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
      <div className="space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-3 p-4 bg-white rounded-lg border border-border">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="bg-white p-10 rounded-lg border border-border border-dashed flex flex-col items-center justify-center text-center space-y-3 text-gray-500">
        <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center border border-border text-gray-400">
          <MessageSquare className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-800">No conversations yet</p>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            Once you accept a request or someone accepts your request, a direct chat channel will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Users Input */}
      <div className="relative mb-1">
        <input
          type="text"
          placeholder="Search neighbors to message..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-3.5 pr-8 py-2 text-xs border border-border rounded-md focus:outline-none focus:border-primary bg-white text-gray-800 animate-in fade-in duration-200"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
            }}
            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {searchQuery.trim() !== '' ? (
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 pl-1 text-left">
            Search Results ({searchResults.length})
          </h3>
          
          {isSearching ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="bg-white p-6 rounded-lg border border-border border-dashed text-center text-xs text-gray-500">
              No neighbors found matching &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            <div className="space-y-2.5">
              {searchResults.map((u) => (
                <div
                  key={u._id}
                  onClick={() => {
                    setSelectedUser(u);
                    setIsProfileOpen(true);
                  }}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 hover:shadow-card transition-all duration-150 cursor-pointer bg-white text-left"
                >
                  <div className="flex items-center gap-3 truncate">
                    <Avatar
                      src={u.avatarUrl}
                      name={u.name}
                      color={u.avatarColor}
                      size="sm"
                    />
                    <div className="truncate text-left">
                      <span className="text-xs font-bold text-gray-800 block truncate">
                        {u.name}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {u.location}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-primary font-bold pr-1 hover:underline shrink-0">View Profile</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : chats.length === 0 ? (
        <div className="bg-white p-10 rounded-lg border border-border border-dashed flex flex-col items-center justify-center text-center space-y-3 text-gray-500">
          <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center border border-border text-gray-400">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-800">No conversations yet</p>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Once you accept a request or someone accepts your request, a direct chat channel will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {chats.map((chat) => {
            // Find the other participant in the chat (seeker or helper)
            const otherParty = chat.seeker?._id === currentUserId ? chat.helper : chat.seeker;
            if (!otherParty || !otherParty._id) return null;
            const isActiveChat = pathname.includes(`/messages/${chat._id}`);
            const isResolved = chat.status === 'resolved';

            let relativeTime = '';
            if (chat.lastMessage) {
              try {
                relativeTime = formatDistanceToNow(new Date(chat.lastMessage.createdAt), {
                  addSuffix: true,
                });
              } catch (e) {
                console.error(e);
              }
            }

            return (
              <Link
                key={chat._id}
                href={`/messages/${chat._id}`}
                className={cn(
                  'flex items-center gap-3.5 p-4 rounded-lg border transition-all duration-150 relative block text-left',
                  isActiveChat
                    ? 'bg-primary-light border-primary/30 shadow-xs'
                    : 'bg-white border-border/70 hover:border-primary/30 hover:shadow-card'
                )}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <Avatar
                    src={otherParty.avatarUrl}
                    name={otherParty.name}
                    color={otherParty.avatarColor}
                    size="md"
                  />
                  {isResolved && (
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-white rounded-full p-0.5" title="Resolved">
                      <CheckCircle className="h-3 w-3 text-white fill-emerald-500" />
                    </span>
                  )}
                </div>

                {/* Middle Section: Name, request title, and last message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-bold text-gray-800 truncate">
                      {otherParty.name}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">
                      {relativeTime}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-primary truncate mb-1">
                    Req: {chat.request?.title || 'Help Request'}
                  </p>

                  <p className="text-xs text-gray-500 truncate leading-relaxed">
                    {chat.lastMessage
                      ? chat.lastMessage.sender === currentUserId
                        ? `You: ${chat.lastMessage.text}`
                        : chat.lastMessage.text
                      : 'Chat opened. Say hello!'}
                  </p>
                </div>

                {/* Right badge notification indicators */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {chat.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold h-5 px-1.5 min-w-[20px] flex items-center justify-center rounded-full">
                      {chat.unreadCount}
                    </span>
                  )}
                  {isResolved ? (
                    <Badge variant="success" className="text-[9px] uppercase tracking-wider py-0.5 px-2 font-bold shrink-0">
                      Resolved
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] uppercase tracking-wider py-0.5 px-2 font-bold bg-blue-50 text-blue-700 border-blue-100 shrink-0">
                      Active
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* User Profile Modal popup */}
      <UserProfileModal
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        user={selectedUser}
        currentUserId={currentUserId}
      />
    </div>
  );
}
