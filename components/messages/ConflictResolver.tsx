'use client';

import * as React from 'react';
import { Loader2, ShieldAlert, X, Copy, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  _id: string;
  sender: { _id: string; name: string };
  text: string;
  createdAt: string | Date;
}

interface ConflictResolverProps {
  messages: Message[];
  currentUserId: string;
  requestTitle: string;
  myRole: 'seeker' | 'helper';
  onUseSuggestion: (text: string) => void;
}

export function ConflictResolver({
  messages,
  currentUserId,
  requestTitle,
  myRole,
  onUseSuggestion,
}: ConflictResolverProps) {
  const [result, setResult] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  const lastMessageId = messages[messages.length - 1]?._id;

  // Auto-analyse every 5 messages from the other party
  const msgCount = messages.length;
  React.useEffect(() => {
    if (dismissed || msgCount < 4) return;

    // Only run when there are enough messages
    const recentMessages = messages.slice(-6).map((m) => ({
      sender: m.sender._id === currentUserId ? 'me' : 'them',
      text: m.text,
    }));

    let active = true;
    async function analyse() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/ai/conflict-resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: recentMessages, requestTitle, myRole }),
        });
        const data = await res.json();
        if (active && data.success && data.data?.hasTension) {
          setResult(data.data);
          setExpanded(false);
        } else if (active) {
          setResult(null);
        }
      } catch {
        // silent fail — conflict detection is non-critical
      } finally {
        if (active) setIsLoading(false);
      }
    }

    analyse();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessageId]);

  if (!result?.hasTension || dismissed) return null;

  const tensionColor = ({
    low: 'border-amber-500/30 bg-amber-500/5',
    medium: 'border-orange-500/30 bg-orange-500/5',
    high: 'border-red-500/30 bg-red-500/5',
  } as Record<string, string>)[result.tensionLevel] || 'border-amber-500/30 bg-amber-500/5';

  const tensionText = ({
    low: 'text-amber-300',
    medium: 'text-orange-300',
    high: 'text-red-300',
  } as Record<string, string>)[result.tensionLevel] || 'text-amber-300';

  const handleCopy = () => {
    navigator.clipboard.writeText(result.deEscalationMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('mx-4 mb-2 rounded-lg border p-3 text-left animate-in slide-in-from-bottom-2 duration-300', tensionColor)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className={cn('h-4 w-4 shrink-0', tensionText)} />
          <div>
            <p className={cn('text-xs font-bold', tensionText)}>
              AI Conflict Detector — {result.tensionLevel} tension detected
            </p>
            <p className="text-[11px] text-slate-300 mt-0.5">{result.summary}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-white p-0.5 rounded"
          >
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')} />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-white p-0.5 rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 animate-in fade-in duration-200">
          {result.suggestions && result.suggestions.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Suggestions</p>
              {result.suggestions.map((s: string, i: number) => (
                <p key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                  <span className="text-indigo-400 shrink-0 mt-0.5">•</span>
                  {s}
                </p>
              ))}
            </div>
          )}

          {result.deEscalationMessage && (
            <div className="bg-black/20 rounded-md p-3 border border-white/5 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ready-to-send message</p>
              <p className="text-xs text-slate-200 leading-relaxed italic">&ldquo;{result.deEscalationMessage}&rdquo;</p>
              <div className="flex gap-2">
                <button
                  onClick={() => onUseSuggestion(result.deEscalationMessage)}
                  className="text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md transition-colors"
                >
                  Use this
                </button>
                <button
                  onClick={handleCopy}
                  className="text-[11px] font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          View suggestions →
        </button>
      )}
    </div>
  );
}
