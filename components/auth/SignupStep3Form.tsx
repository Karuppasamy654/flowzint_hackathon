'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { LocationAutocomplete } from '../ui/LocationAutocomplete';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { toast } from '@/components/ui/toast';
import { Camera, ChevronLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUPPORTED_LANGUAGES } from '@/lib/languages';

const PALETTE = [
  '#7C3AED',
  '#0F766E',
  '#B45309',
  '#1D4ED8',
  '#9D174D',
  '#065F46',
  '#C2410C',
  '#1A7F5A',
];

export function SignupStep3Form() {
  const router = useRouter();
  const [avatarColor, setAvatarColor] = React.useState('#7C3AED');
  const [location, setLocation] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [preferredLanguage, setPreferredLanguage] = React.useState('en');
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [step1Data, setStep1Data] = React.useState<any>(null);
  const [step2Data, setStep2Data] = React.useState<any>(null);

  React.useEffect(() => {
    // Pick a random color from the palette
    const randColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    setAvatarColor(randColor);

    const s1 = sessionStorage.getItem('signup_step1');
    const s2 = sessionStorage.getItem('signup_step2');
    
    if (!s1 || !s2) {
      toast.error('Signup session lost. Please start over.');
      router.push('/signup/step1');
      return;
    }

    try {
      setStep1Data(JSON.parse(s1));
      setStep2Data(JSON.parse(s2));
    } catch (e) {
      console.error(e);
      router.push('/signup/step1');
    }
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleBack = () => {
    router.push('/signup/step2');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      toast.warning('Please enter your location.');
      return;
    }

    setIsSubmitting(true);
    let avatarUrl = '';

    try {
      // 1. Upload photo to Cloudinary if selected
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
        } else {
          console.warn('Avatar upload failed, continuing with fallback');
        }
      }

      // 2. Submit user to database
      const userData = {
        name: step1Data.name,
        email: step1Data.email,
        password: step1Data.password,
        skills: step2Data.skills,
        location,
        bio,
        avatarColor,
        avatarUrl,
        preferredLanguage,
      };

      const signupRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const signupResult = await signupRes.json();
      if (!signupResult.success) {
        toast.error(signupResult.error || 'Registration failed');
        setIsSubmitting(false);
        return;
      }

      // 3. Initiate credentials sign in
      const signinResult = await signIn('credentials', {
        email: step1Data.email,
        password: step1Data.password,
        redirect: false,
      });

      if (signinResult?.error) {
        toast.error('Account created, but automatic login failed. Please sign in manually.');
        router.push('/login');
        return;
      }

      // Clear session values
      sessionStorage.removeItem('signup_step1');
      sessionStorage.removeItem('signup_step2');

      // 4. Redirect and trigger welcome toast
      toast.success(`Welcome to HelpNet, ${step1Data.name}!`, {
        description: 'Your community workspace is ready.',
      });
      
      router.push('/welcome');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error('An unexpected error occurred during signup.');
      setIsSubmitting(false);
    }
  };

  const nameInitials = step1Data?.name
    ? step1Data.name
        .trim()
        .split(/\s+/)
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar circular preview */}
      <div className="flex flex-col items-center justify-center space-y-2">
        <div
          onClick={triggerFileSelect}
          style={{ backgroundColor: previewUrl ? undefined : avatarColor }}
          className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold cursor-pointer relative group overflow-hidden shadow-md',
            previewUrl ? 'bg-transparent' : ''
          )}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
          ) : (
            <span>{nameInitials}</span>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-5 w-5 text-white" />
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
          onClick={triggerFileSelect}
          className="text-xs font-semibold text-primary hover:text-primary-hover focus:outline-none"
        >
          Upload photo
        </button>
      </div>

      {/* Location field */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
          Your Location (Neighborhood / City)
        </label>
        <LocationAutocomplete
          placeholder="e.g. Koramangala, Bengaluru"
          value={location}
          onChange={setLocation}
          required
          disabled={isSubmitting}
        />
        <div className="text-xs text-gray-400 select-none">
          Enter your neighbourhood or area name.
        </div>
      </div>

      {/* Preferred language field */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
          Preferred Language
        </label>
        <select
          value={preferredLanguage}
          onChange={(e) => setPreferredLanguage(e.target.value)}
          disabled={isSubmitting}
          className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 text-gray-800"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name} ({lang.nativeName})
            </option>
          ))}
        </select>
      </div>

      {/* Bio field */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Short Bio
          </label>
          <span className="text-[11px] text-gray-400">{bio.length} / 120</span>
        </div>
        <Textarea
          placeholder="Tell neighbors a bit about yourself..."
          value={bio}
          onChange={(e) => setBio(e.target.value.substring(0, 120))}
          maxLength={120}
          disabled={isSubmitting}
          className="resize-none"
        />
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="ghost"
          disabled={isSubmitting}
          onClick={handleBack}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 h-11 bg-primary text-white hover:bg-primary-hover font-semibold rounded-md shadow-card justify-center"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Completing setup...
            </>
          ) : (
            'Complete setup'
          )}
        </Button>
      </div>
    </form>
  );
}
