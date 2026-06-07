'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { toast } from '@/components/ui/toast';
import { SKILL_COLORS } from '@/lib/constants';
import { MapPin, Mail, Star, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    _id: string;
    name: string;
    email: string;
    bio?: string;
    location: string;
    skills: string[];
    avatarUrl?: string;
    avatarColor: string;
    rating?: {
      total: number;
      count: number;
    };
    avgRating?: number;
  } | null;
  currentUserId: string;
}

export function UserProfileModal({ open, onOpenChange, user, currentUserId }: UserProfileModalProps) {
  const router = useRouter();
  const [isStartingChat, setIsStartingChat] = React.useState(false);

  if (!user) return null;

  const avgRating = user.avgRating ?? 0;
  const ratingCount = user.rating?.count ?? 0;
  const isSelf = user._id === currentUserId;

  const handleStartChat = async () => {
    setIsStartingChat(true);
    try {
      const res = await fetch('/api/chats/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helperId: user._id, category: 'Other' }),
      });
      const result = await res.json();
      if (result.success && result.chatId) {
        toast.success('Chat initiated!');
        onOpenChange(false);
        router.push(`/messages/${result.chatId}`);
      } else {
        toast.error(result.error || 'Failed to start chat');
      }
    } catch (e) {
      console.error(e);
      toast.error('An error occurred.');
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>User Profile</DialogTitle>
      </DialogHeader>

      <DialogContent className="max-h-[85vh] overflow-y-auto pr-2">
        <div className="space-y-6 text-left py-2">
          {/* Header Section */}
          <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-gray-100">
            <Avatar
              src={user.avatarUrl}
              name={user.name}
              color={user.avatarColor}
              size="lg"
            />
            <div className="space-y-1">
              <h4 className="text-xl font-display font-bold text-gray-900">{user.name}</h4>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-1.5 sm:gap-3 text-xs text-gray-500 font-medium">
                <span className="flex items-center justify-center gap-0.5">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  {user.location}
                </span>
                <span className="flex items-center justify-center gap-0.5">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  {user.email}
                </span>
              </div>
            </div>

            {/* Rating Stars */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i < Math.round(avgRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-200'
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Helper Rating: {avgRating.toFixed(1)} ({ratingCount} {ratingCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="space-y-1">
              <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">About</h5>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50/50 p-3 rounded-lg border border-gray-100/50">
                {user.bio}
              </p>
            </div>
          )}

          {/* Skills */}
          <div className="space-y-2">
            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Skills & Help categories</h5>
            {user.skills && user.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {user.skills.map((skill) => {
                  const colorClass = SKILL_COLORS[skill] || 'bg-gray-50 text-gray-600 border-gray-200';
                  return (
                    <Badge
                      key={skill}
                      variant="outline"
                      className={cn('text-xs font-semibold px-3 py-1 rounded-full border', colorClass)}
                    >
                      {skill}
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No skills specified.</p>
            )}
          </div>

          {/* Message Button */}
          {!isSelf && (
            <div className="pt-2">
              <Button
                onClick={handleStartChat}
                disabled={isStartingChat}
                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold flex items-center justify-center gap-2 h-11 shadow-card"
              >
                {isStartingChat ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    Starting Chat...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
