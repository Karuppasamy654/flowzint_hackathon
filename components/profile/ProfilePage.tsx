'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
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
  const { t } = useLanguage();
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
      <div className="bg-[#131B2E]/60 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
        {/* Banner strip */}
        <div className="h-32 w-full bg-gradient-to-r from-indigo-600/80 to-violet-600/80" />
        
        {/* User main info container */}
        <div className="px-6 pb-6 relative flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
          {/* Avatar floating */}
          <div className="relative -mt-10 shrink-0 select-none">
            <Avatar
              src={user.avatarUrl}
              name={user.name}
              color={user.avatarColor}
              size="xl"
              className="ring-4 ring-[#131B2E] shadow-md"
            />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-1.5 mt-2">
            <h2 className="text-2xl font-display font-semibold text-white leading-tight">
              {user.name}
            </h2>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                {user.location}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                {user.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                Joined {joinDate}
              </span>
            </div>

            {user.bio && (
              <p className="text-sm text-slate-300 max-w-xl leading-relaxed pt-1.5">
                {user.bio}
              </p>
            )}
          </div>

          {/* Edit Profile Button */}
          <Button
            onClick={() => setIsEditOpen(true)}
            size="sm"
            variant="outline"
            className="mt-4 sm:mt-2 font-semibold text-xs h-9 flex items-center gap-1.5 rounded-md bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 shrink-0"
          >
            <Edit className="h-4 w-4" />
            {t('profile.editProfile')}
          </Button>
        </div>
      </div>

      {/* Grid: Left Column (Skills) & Right Column (Ratings Dashboard) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Skills Panel */}
        <div className="bg-[#131B2E]/60 p-6 rounded-xl border border-white/10 backdrop-blur-md md:col-span-2 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t('profile.skills')}
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
            <p className="text-sm text-slate-500">{t('profile.noSkills')}</p>
          )}
        </div>

        {/* Ratings Dashboard */}
        <div className="bg-[#131B2E]/60 p-6 rounded-xl border border-white/10 backdrop-blur-md space-y-4 text-center">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">
            {t('profile.helperRatings')}
          </h3>
          <div className="flex flex-col items-center justify-center py-2 space-y-1">
            <div className="text-4xl font-display font-semibold text-white">
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
                      : 'text-slate-700'
                  )}
                />
              ))}
            </div>

            <span className="text-xs text-slate-400 font-medium pt-1">
              Based on {user.rating.count} {user.rating.count === 1 ? t('profile.reviews').slice(0,-1) : t('profile.reviews')}
            </span>
          </div>
        </div>
      </div>

      {/* Past Requests Navigation Row */}
      <div
        onClick={() => router.push('/profile/past-requests')}
        className="bg-[#131B2E]/60 border border-white/10 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-indigo-500/30 hover:bg-[#131B2E]/80 transition-all duration-150 backdrop-blur-md"
      >
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-md shrink-0">
            <History className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-bold text-white">{t('profile.pastRequests')}</h4>
            <p className="text-xs text-slate-400">{t('profile.pastRequestsDesc')}</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-500" />
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
