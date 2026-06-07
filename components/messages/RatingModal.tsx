'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  helperName: string;
  onSubmit: (rating: number, feedback: string) => Promise<void>;
}

export function RatingModal({ open, onOpenChange, helperName, onSubmit }: RatingModalProps) {
  const [rating, setRating] = React.useState(5);
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);
  const [feedback, setFeedback] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(rating, feedback);
      onOpenChange(false);
      setFeedback('');
      setRating(5);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Mark as Resolved</DialogTitle>
      </DialogHeader>

      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-sm text-gray-500 leading-normal text-center sm:text-left">
            Thank you for using HelpNet! How was your experience with <span className="font-semibold text-gray-800">{helperName}</span>?
          </p>

          {/* Star selector */}
          <div className="flex justify-center py-2 gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = star <= (hoverRating ?? rating);
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 focus:outline-none transition-transform active:scale-95"
                >
                  <Star
                    className={cn(
                      'h-8 w-8 transition-colors duration-150',
                      active
                        ? 'fill-amber-400 text-amber-400 scale-105'
                        : 'text-gray-300 hover:text-gray-400'
                    )}
                  />
                </button>
              );
            })}
          </div>

          {/* Feedback details */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Feedback (Optional)
            </label>
            <Textarea
              placeholder="Tell others what went well, what they helped with, and write a quick review..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full resize-none min-h-[90px]"
              maxLength={200}
              disabled={isSubmitting}
            />
          </div>

          {/* Controls */}
          <div className="flex gap-3 pt-2">
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
              className="flex-1 bg-primary text-white hover:bg-primary-hover font-semibold rounded-md shadow-card py-2"
            >
              {isSubmitting ? 'Resolving...' : 'Submit & Close'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
