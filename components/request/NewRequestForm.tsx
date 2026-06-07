'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { SKILL_CATEGORIES } from '@/lib/constants';
import { toast } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const CreateRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required').max(300, 'Description cannot exceed 300 characters'),
  category: z.string().min(1, 'Please select a skill category'),
  urgency: z.enum(['flexible', 'today', 'urgent']),
  location: z.string().min(1, 'Location is required'),
});

type RequestFormData = z.infer<typeof CreateRequestSchema>;

interface NewRequestFormProps {
  userLocation: string;
  onRequestCreated: (request: any) => void;
}

export function NewRequestForm({ userLocation, onRequestCreated }: NewRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RequestFormData>({
    resolver: zodResolver(CreateRequestSchema),
    defaultValues: {
      location: userLocation,
      urgency: 'flexible',
      category: '',
    },
  });

  const onSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (result.success) {
        toast.success('Help request posted!', {
          description: 'Nearby helpers have been notified.',
        });
        reset();
        onRequestCreated(result.data);
      } else {
        toast.error(result.error || 'Failed to post help request');
      }
    } catch (e) {
      console.error(e);
      toast.error('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-[#131B2E]/50 p-6 rounded-lg border border-white/10 shadow-2xl backdrop-blur-md">
      <h3 className="text-lg font-display font-semibold text-white mb-2">Request Assistance</h3>

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Request Title
        </label>
        <Input
          type="text"
          placeholder="e.g. Kitchen sink faucet leaking"
          {...register('title')}
          className={cn(
            "bg-[#0B0F1A]/70 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50",
            errors.title ? 'border-red-500/60 focus-visible:ring-red-500/50' : ''
          )}
          disabled={isSubmitting}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-400 font-medium">{errors.title.message}</p>
        )}
      </div>

      {/* Category & Urgency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Category
          </label>
          <select
            {...register('category')}
            disabled={isSubmitting}
            className={cn(
              "flex h-10 w-full rounded-md border border-white/10 bg-[#0B0F1A]/70 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50 text-white",
              errors.category ? 'border-red-500/60' : ''
            )}
          >
            <option value="" disabled className="bg-[#0B0F1A] text-slate-400">Select category</option>
            {SKILL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-[#0B0F1A] text-white">
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-xs text-red-400 font-medium">{errors.category.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Urgency
          </label>
          <select
            {...register('urgency')}
            disabled={isSubmitting}
            className={cn(
              "flex h-10 w-full rounded-md border border-white/10 bg-[#0B0F1A]/70 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50 text-white",
              errors.urgency ? 'border-red-500/60' : ''
            )}
          >
            <option value="flexible" className="bg-[#0B0F1A] text-white">Flexible schedule</option>
            <option value="today" className="bg-[#0B0F1A] text-white">Sometime today</option>
            <option value="urgent" className="bg-[#0B0F1A] text-white">Urgent (Asap)</option>
          </select>
          {errors.urgency && (
            <p className="mt-1 text-xs text-red-400 font-medium">{errors.urgency.message}</p>
          )}
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Location / Address (Neighborhood)
        </label>
        <Input
          type="text"
          placeholder="e.g. Brooklyn, NY"
          {...register('location')}
          className={cn(
            "bg-[#0B0F1A]/70 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50",
            errors.location ? 'border-red-500/60 focus-visible:ring-red-500/50' : ''
          )}
          disabled={isSubmitting}
        />
        {errors.location && (
          <p className="mt-1 text-xs text-red-400 font-medium">{errors.location.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Describe what you need
        </label>
        <Textarea
          placeholder="Describe the issue, what tools might be needed, and relevant details..."
          {...register('description')}
          className={cn(
            'resize-none bg-[#0B0F1A]/70 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50',
            errors.description ? 'border-red-500/60 focus-visible:ring-red-500/50' : ''
          )}
          disabled={isSubmitting}
          maxLength={300}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-400 font-medium">{errors.description.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 bg-indigo-600 text-white hover:bg-indigo-700 font-semibold rounded-md shadow-lg flex items-center justify-center transition-colors"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Posting request...
          </>
        ) : (
          'Submit Help Request'
        )}
      </Button>
    </form>
  );
}
