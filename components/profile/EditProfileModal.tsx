'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { toast } from '@/components/ui/toast';
import { SKILL_CATEGORIES } from '@/lib/constants';
import { Camera, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AISkillSuggester } from './AISkillSuggester';
import { LocationAutocomplete } from '../ui/LocationAutocomplete';


interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    name: string;
    email: string;
    bio?: string;
    location: string;
    skills: string[];
    avatarUrl?: string;
    avatarColor: string;
  };
  onSuccess: (updatedUser: any) => void;
}

export function EditProfileModal({ open, onOpenChange, user, onSuccess }: EditProfileModalProps) {
  const [name, setName] = React.useState(user.name);
  const [bio, setBio] = React.useState(user.bio || '');
  const [location, setLocation] = React.useState(user.location);
  const [skills, setSkills] = React.useState<string[]>(user.skills || []);
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(user.avatarUrl || null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync state if user data updates externally
  React.useEffect(() => {
    setName(user.name);
    setBio(user.bio || '');
    setLocation(user.location);
    setSkills(user.skills || []);
    setPreviewUrl(user.avatarUrl || null);
  }, [user]);

  const handleToggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter((s) => s !== skill));
    } else {
      if (skills.length >= 5) {
        toast.warning('You can select a maximum of 5 skills.');
        return;
      }
      setSkills([...skills, skill]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Name is required.');
      return;
    }
    if (!location.trim()) {
      toast.warning('Location is required.');
      return;
    }

    setIsSubmitting(true);
    let avatarUrl = user.avatarUrl || '';

    try {
      // 1. Upload new photo to Cloudinary if selected
      if (file) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });
        const uploadResult = await uploadRes.json();
        if (uploadResult.url) {
          avatarUrl = uploadResult.url;
        }
      }

      // 2. Submit edits
      const updateData = {
        name,
        bio,
        location,
        skills,
        avatarUrl,
      };

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const result = await res.json();
      if (result.success) {
        toast.success('Profile updated successfully!');
        onSuccess(result.data);
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error(error);
      toast.error('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLimitReached = skills.length >= 5;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Edit Profile</DialogTitle>
      </DialogHeader>

      <DialogContent className="max-h-[80vh] overflow-y-auto pr-2">
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center justify-center space-y-2 py-1">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold cursor-pointer relative group overflow-hidden shadow-inner"
              style={{ backgroundColor: previewUrl ? undefined : user.avatarColor }}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-4 w-4 text-white" />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-primary hover:text-primary-hover"
            >
              Change Photo
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Full Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Location <span className="text-red-400">*</span>
            </label>
            <LocationAutocomplete
              value={location}
              onChange={setLocation}
              disabled={isSubmitting}
              placeholder="e.g. Koramangala, Bengaluru"
            />
            <div className="text-[11px] text-gray-400 mt-1 select-none">
              Type to search — select your real location from the list.
            </div>
          </div>

          {/* Bio */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Short Bio
              </label>
              <span className="text-[10px] text-gray-400">{bio.length} / 120</span>
            </div>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.substring(0, 120))}
              maxLength={120}
              disabled={isSubmitting}
              className="resize-none min-h-[70px]"
            />
          </div>

          {/* Skills Grid */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Skills Category Toggles
              </label>
              <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-1.5 py-0.5 rounded-full">
                {skills.length} / 5
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1 bg-gray-50/50 rounded-md border border-gray-100">
              {SKILL_CATEGORIES.map((skill) => {
                const isSelected = skills.includes(skill);
                const isDisabled = !isSelected && isLimitReached;

                return (
                  <button
                    key={skill}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleToggleSkill(skill)}
                    className={cn(
                      'inline-flex items-center text-[11px] font-semibold h-7 px-3 rounded-full border transition-all duration-150',
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : isDisabled
                        ? 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-primary/50'
                    )}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>

          {/* AI Skill Suggester */}
          <AISkillSuggester
            bio={bio}
            name={name}
            currentSkills={skills}
            onAddSkill={(skill) => {
              if (!skills.includes(skill) && skills.length < 5) {
                setSkills([...skills, skill]);
              }
            }}
          />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="flex-1 text-gray-500 hover:text-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold rounded-md shadow-card"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
