'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { SKILL_CATEGORIES } from '@/lib/constants';
import {
  Code,
  Palette,
  Wrench,
  Zap,
  BookOpen,
  HeartPulse,
  Scale,
  ChefHat,
  Hammer,
  Brain,
  Music,
  DollarSign,
  Languages,
  HelpCircle,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';

const SKILL_ICONS: Record<string, React.ComponentType<any>> = {
  'Web Dev': Code,
  'Design': Palette,
  'Plumbing': Wrench,
  'Electrician': Zap,
  'Teaching': BookOpen,
  'Medical': HeartPulse,
  'Legal': Scale,
  'Cooking': ChefHat,
  'Carpentry': Hammer,
  'Mental Health': Brain,
  'Music': Music,
  'Finance': DollarSign,
  'Language Translation': Languages,
  'Other': HelpCircle,
};

export function SignupStep2Form() {
  const router = useRouter();
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>([]);
  const [otherText, setOtherText] = React.useState('');

  // Load existing session values if backtracked
  React.useEffect(() => {
    const saved = sessionStorage.getItem('signup_step2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelectedSkills(parsed.skills || []);
        setOtherText(parsed.otherText || '');
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleToggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      if (selectedSkills.length >= 5) return;
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleBack = () => {
    router.push('/signup/step1');
  };

  const handleContinue = () => {
    if (selectedSkills.length === 0) return;
    sessionStorage.setItem(
      'signup_step2',
      JSON.stringify({ skills: selectedSkills, otherText })
    );
    router.push('/signup/step3');
  };

  const isLimitReached = selectedSkills.length >= 5;
  const isOtherSelected = selectedSkills.includes('Other');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500 font-medium">Select up to 5 categories</span>
        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", isLimitReached ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600")}>
          {selectedSkills.length} / 5 selected
        </span>
      </div>

      {/* Grid of Pills */}
      <div className="flex flex-wrap gap-2.5">
        {SKILL_CATEGORIES.map((skill) => {
          const Icon = SKILL_ICONS[skill] || HelpCircle;
          const isSelected = selectedSkills.includes(skill);
          const isDisabled = !isSelected && isLimitReached;

          return (
            <button
              key={skill}
              type="button"
              disabled={isDisabled}
              onClick={() => handleToggleSkill(skill)}
              className={cn(
                'inline-flex items-center gap-2 h-9 px-4 py-1.5 rounded-pill text-sm font-medium border transition-all duration-150 select-none outline-none focus:ring-2 focus:ring-primary',
                isSelected
                  ? 'bg-primary text-white border-primary shadow-sm hover:bg-primary-hover'
                  : isDisabled
                  ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-primary/50 hover:bg-gray-50'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{skill}</span>
            </button>
          );
        })}
      </div>

      {/* Other custom text input if Other is selected */}
      {isOtherSelected && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Tell us more about your skills
          </label>
          <Input
            type="text"
            placeholder="e.g. Pet sitting, gardening, moving assistance..."
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            className="w-full"
          />
        </div>
      )}

      {/* Button controls */}
      <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="ghost"
          onClick={handleBack}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          type="button"
          disabled={selectedSkills.length === 0}
          onClick={handleContinue}
          className="px-6 h-11 bg-primary text-white hover:bg-primary-hover font-semibold rounded-md shadow-card disabled:opacity-50 disabled:pointer-events-none"
        >
          Continue &rarr;
        </Button>
      </div>
    </div>
  );
}
