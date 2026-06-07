'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { EditProfileModal } from './EditProfileModal';
import { SKILL_COLORS } from '@/lib/constants';
import { MapPin, Mail, Calendar, Edit, Star, ChevronRight, HelpCircle, History } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProfilePageProps {
  initialUser: {
    id: string;
    name: string;
    email: string;
    bio?: string;
    location: string;
    skills: string[];
    avatarUrl?: string;
    avatarColor: string;
    rating: {
      total: number;
      count: number;
    };
    avgRating: number;
    createdAt: string;
  };
}

export function ProfilePage({ initialUser }: ProfilePageProps) {
  const router = useRouter();
  const [user, setUser] = React.useState(initialUser);
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  const joinDate = React.useMemo(() => {
    try {
      return format(new Date(user.createdAt), 'MMMM yyyy');
    } catch (e) {
      return '';
    }
  }, [user.createdAt]);

  const handleUpdateSuccess = (updatedUser: any) => {
    setUser({
      ...user,
      ...updatedUser,
      id: updatedUser.id || updatedUser._id, // Support different formats
    });
    
    // Refresh page state to sync NextAuth context
    router.refresh();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left">
      {/* Profile Cover Card */}
      <div className="bg-white rounded-lg border border-border shadow-card overflow-hidden">
        {/* Banner strip */}
        <div className="h-32 w-full bg-gradient-to-r from-primary/80 to-primary" />
        
        {/* User main info container */}
        <div className="px-6 pb-6 relative flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
          {/* Avatar floating */}
          <div className="relative -mt-10 shrink-0 select-none">
            <Avatar
              src={user.avatarUrl}
              name={user.name}
              color={user.avatarColor}
              size="xl"
              className="ring-4 ring-white shadow-md"
            />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-1.5 mt-2">
            <h2 className="text-2xl font-display font-semibold text-gray-900 leading-tight">
              {user.name}
            </h2>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                {user.location}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                {user.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                Joined {joinDate}
              </span>
            </div>

            {user.bio && (
              <p className="text-sm text-gray-600 max-w-xl leading-relaxed pt-1.5">
                {user.bio}
              </p>
            )}
          </div>

          {/* Edit Profile Button */}
          <Button
            onClick={() => setIsEditOpen(true)}
            size="sm"
            variant="outline"
            className="mt-4 sm:mt-2 font-semibold text-xs h-9 flex items-center gap-1.5 rounded-md hover:bg-gray-50 shrink-0 border-gray-200 text-gray-700"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Grid: Left Column (Skills) & Right Column (Ratings Dashboard) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Skills Panel */}
        <div className="bg-white p-6 rounded-lg border border-border shadow-card md:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Skills & Help categories
          </h3>
          {user.skills && user.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill) => {
                const colorClass = SKILL_COLORS[skill] || 'bg-gray-50 text-gray-600 border-gray-200';
                return (
                  <Badge
                    key={skill}
                    variant="outline"
                    className={cn(
                      'text-xs font-semibold px-3 py-1 rounded-full border',
                      colorClass
                    )}
                  >
                    {skill}
                  </Badge>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No help categories selected yet. Click Edit Profile to add skills.</p>
          )}
        </div>

        {/* Ratings Dashboard */}
        <div className="bg-white p-6 rounded-lg border border-border shadow-card space-y-4 text-center">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider text-left">
            Helper Ratings
          </h3>
          <div className="flex flex-col items-center justify-center py-2 space-y-1">
            <div className="text-4xl font-display font-semibold text-gray-900">
              {user.avgRating.toFixed(1)}
            </div>
            
            {/* Stars row */}
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-4 w-4',
                    i < Math.round(user.avgRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-200'
                  )}
                />
              ))}
            </div>

            <span className="text-xs text-gray-500 font-medium pt-1">
              Based on {user.rating.count} {user.rating.count === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        </div>
      </div>

      {/* Past Requests Navigation Row */}
      <div
        onClick={() => router.push('/profile/past-requests')}
        className="bg-white p-4 rounded-lg border border-border shadow-card flex items-center justify-between cursor-pointer hover:border-primary/40 hover:shadow-hover transition-all duration-150"
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary-light text-primary p-2.5 rounded-md shrink-0">
            <History className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-bold text-gray-800">Past Help Requests</h4>
            <p className="text-xs text-gray-400">View history of your requests and responses.</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        user={user}
        onSuccess={handleUpdateSuccess}
      />
    </div>
  );
}
