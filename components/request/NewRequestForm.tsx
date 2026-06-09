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
import { Loader2, Sparkles, Check, X } from 'lucide-react';
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
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isEnhancing, setIsEnhancing] = React.useState(false);
  const [enhancement, setEnhancement] = React.useState<{
    enhanced: string;
    improvements: string[];
    clarityGain: number;
  } | null>(null);
  const [analysis, setAnalysis] = React.useState<{
    title?: string;
    category?: string;
    urgency?: string;
    clarityScore: number;
    clarityFeedback?: string;
    missingInfo?: string[];
  } | null>(null);

  const [safety, setSafety] = React.useState<{
    safe: boolean;
    category: string;
    reason: string;
    suggestion: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<RequestFormData>({
    resolver: zodResolver(CreateRequestSchema),
    defaultValues: {
      location: userLocation,
      urgency: 'flexible',
      category: '',
    },
  });

  const watchDescription = watch('description');
  const watchTitle = watch('title');

  // Debounced input analysis
  React.useEffect(() => {
    if (!watchDescription || watchDescription.trim().length < 15) {
      setAnalysis(null);
      setSafety(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const [analysisRes, safetyRes] = await Promise.all([
          fetch('/api/ai/analyse-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: watchDescription }),
          }),
          fetch('/api/ai/safety-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: watchTitle || '', description: watchDescription }),
          })
        ]);

        const analysisResult = await analysisRes.json();
        const safetyResult = await safetyRes.json();

        if (analysisResult.success && analysisResult.data) {
          const data = analysisResult.data;
          setAnalysis(data);
          
          if (data.category) {
            setValue('category', data.category);
          }
          if (data.urgency) {
            setValue('urgency', data.urgency);
          }
          if (data.title && !watchTitle) {
            setValue('title', data.title);
          }
        }

        if (safetyResult.success && safetyResult.data) {
          setSafety(safetyResult.data);
        }
      } catch (err) {
        console.error('Real-time analysis error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [watchDescription, watchTitle, setValue]);

  const handleEnhance = async () => {
    const desc = watchDescription?.trim();
    if (!desc || desc.length < 10) {
      toast.warning('Please write a description first.');
      return;
    }
    setIsEnhancing(true);
    setEnhancement(null);
    try {
      const res = await fetch('/api/ai/enhance-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: desc,
          title: watchTitle || '',
          category: watch('category') || '',
        }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        setEnhancement(result.data);
      } else {
        toast.error('Could not enhance request. Try again.');
      }
    } catch (e) {
      toast.error('AI enhancement failed.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const acceptEnhancement = () => {
    if (enhancement) {
      setValue('description', enhancement.enhanced);
      setEnhancement(null);
      toast.success('Description enhanced by AI! ✨');
    }
  };

  const handleChipClick = (info: string) => {
    const currentText = watchDescription || '';
    const spacer = currentText ? (currentText.endsWith(' ') ? '' : ' ') : '';
    const newText = `${currentText}${spacer}[Add detail about ${info}: ]`;
    setValue('description', newText);
    const textarea = document.getElementById('description-textarea');
    if (textarea) {
      textarea.focus();
      // Move cursor to the end
      setTimeout(() => {
        (textarea as HTMLTextAreaElement).setSelectionRange(newText.length, newText.length);
      }, 0);
    }
  };

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
        setAnalysis(null);
        setSafety(null);
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

  const isClarityTooLow = analysis ? analysis.clarityScore < 5 : false;
  const isUnsafe = safety ? !safety.safe : false;
  const disableSubmit = isSubmitting || isAnalyzing || isClarityTooLow || isUnsafe;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-[#131B2E]/50 p-6 rounded-lg border border-white/10 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-display font-semibold text-white">Request Assistance</h3>
        {isAnalyzing && (
          <span className="inline-flex items-center text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
            AI analyzing...
          </span>
        )}
      </div>

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
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between animate-in fade-in duration-300">
            Category
            {analysis?.category && (
              <span className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wider">
                ✨ AI suggested
              </span>
            )}
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
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between animate-in fade-in duration-300">
            Urgency
            {analysis?.urgency && (
              <span className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wider">
                ✨ AI detected
              </span>
            )}
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
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Describe what you need
          </label>
          <button
            type="button"
            onClick={handleEnhance}
            disabled={isEnhancing || !watchDescription || watchDescription.trim().length < 10}
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all",
              isEnhancing
                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 cursor-wait"
                : "bg-violet-500/10 text-violet-300 border-violet-500/20 hover:bg-violet-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {isEnhancing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {isEnhancing ? 'Enhancing...' : '✨ Enhance with AI'}
          </button>
        </div>
        <Textarea
          id="description-textarea"
          placeholder="Describe the issue, what tools might be needed, and relevant details..."
          {...register('description')}
          className={cn(
            'resize-none bg-[#0B0F1A]/70 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 min-h-[100px]',
            errors.description ? 'border-red-500/60 focus-visible:ring-red-500/50' : ''
          )}
          disabled={isSubmitting}
          maxLength={300}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-400 font-medium">{errors.description.message}</p>
        )}

        {/* AI Enhancement Preview */}
        {enhancement && (
          <div className="mt-3 p-4 rounded-lg bg-violet-900/30 border border-violet-500/30 space-y-3 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">AI Enhanced Version</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">+{enhancement.clarityGain} clarity</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed bg-black/30 p-3 rounded-md border border-white/5 font-medium">
              {enhancement.enhanced}
            </p>
            {enhancement.improvements.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {enhancement.improvements.map((imp, i) => (
                  <span key={i} className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">✓ {imp}</span>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={acceptEnhancement}
                className="flex items-center gap-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-md transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                Use this version
              </button>
              <button
                type="button"
                onClick={() => setEnhancement(null)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Keep original
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clarity score checker UI */}
      {analysis && (
        <div className="p-4 rounded-lg bg-[#0F172A]/80 border border-white/10 space-y-3 transition-all duration-300 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Request Clarity Score
            </span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500",
                    analysis.clarityScore <= 3 ? 'bg-red-500' :
                    analysis.clarityScore <= 6 ? 'bg-amber-500' : 'bg-emerald-500'
                  )}
                  style={{ width: `${analysis.clarityScore * 10}%` }}
                />
              </div>
              <span className={cn(
                "text-sm font-bold",
                analysis.clarityScore <= 3 ? 'text-red-400' :
                analysis.clarityScore <= 6 ? 'text-amber-400' : 'text-emerald-400'
              )}>
                {analysis.clarityScore}/10
              </span>
            </div>
          </div>

          {analysis.clarityFeedback && (
            <p className="text-xs text-slate-300 leading-relaxed">
              {analysis.clarityFeedback}
            </p>
          )}

          {analysis.missingInfo && analysis.missingInfo.length > 0 && (
            <div className="space-y-1.5 pt-1 animate-in slide-in-from-bottom duration-300">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                💡 Tip: Click to append missing information:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {analysis.missingInfo.map((info, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleChipClick(info)}
                    className="text-[11px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 px-2.5 py-0.5 rounded-full transition-colors active:scale-95 cursor-pointer"
                  >
                    + {info}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trust & Safety Warning UI */}
      {safety && !safety.safe && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-white space-y-3 animate-shake">
          <div className="flex items-center gap-2 text-red-400">
            <span className="text-sm font-bold uppercase tracking-wider">
              ⚠️ Content Policy Warning ({safety.category.replace('_', ' ')})
            </span>
          </div>
          <p className="text-xs text-red-200 leading-relaxed">
            {safety.reason}
          </p>
          {safety.suggestion && (
            <p className="text-xs text-slate-300 italic">
              Suggestion: {safety.suggestion}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              onClick={() => {
                const textarea = document.getElementById('description-textarea');
                if (textarea) textarea.focus();
              }}
              className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 h-8 px-3 py-1 font-semibold rounded"
            >
              Edit Request
            </Button>
            <Button
              type="button"
              onClick={() => {
                toast.message('Support Contacted', {
                  description: 'Our safety team has been notified and will review your draft shortly.',
                });
              }}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 h-8 px-3 py-1 font-semibold rounded"
            >
              Contact Support
            </Button>
          </div>
        </div>
      )}

      <Button
        type="submit"
        disabled={disableSubmit}
        className={cn(
          "w-full h-11 font-semibold rounded-md shadow-lg flex items-center justify-center transition-colors text-sm",
          isUnsafe ? "bg-red-700/50 text-red-300 cursor-not-allowed hover:bg-red-700/50 border border-red-500/30" :
          isClarityTooLow ? "bg-amber-700/50 text-amber-300 cursor-not-allowed hover:bg-amber-700/50 border border-amber-500/30" :
          "bg-indigo-600 text-white hover:bg-indigo-700"
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Posting request...
          </>
        ) : isAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            AI analyzing request...
          </>
        ) : isUnsafe ? (
          'Submission Blocked: Safety Warning'
        ) : isClarityTooLow ? (
          'Submission Blocked: Low Clarity'
        ) : (
          'Submit Help Request'
        )}
      </Button>
    </form>
  );
}
