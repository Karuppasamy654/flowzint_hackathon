import { AlertCircle, HelpCircle } from 'lucide-react';

interface RequestContext {
  title: string;
  description: string;
  category: string;
  urgency: 'flexible' | 'today' | 'urgent';
  location: string;
}

interface PinnedContextCardProps {
  request: RequestContext;
}

export function PinnedContextCard({ request }: PinnedContextCardProps) {
  const urgencyColors = {
    flexible: 'bg-blue-50 text-blue-700 border-blue-100',
    today: 'bg-amber-50 text-amber-800 border-amber-100',
    urgent: 'bg-red-50 text-red-700 border-red-100',
  };

  return (
    <div className="bg-gray-50 border border-border p-4 rounded-md flex gap-3.5 items-start">
      <div className="bg-primary-light text-primary p-2 rounded-md shrink-0">
        <HelpCircle className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1">
          <h4 className="text-sm font-semibold text-gray-800 truncate">{request.title}</h4>
          <div className="flex gap-2">
            <span className="text-[10px] font-bold bg-primary-light text-primary border border-primary/20 rounded-sm px-2 py-0.5 capitalize">
              {request.category}
            </span>
            <span
              className={`text-[10px] font-bold border rounded-sm px-2 py-0.5 capitalize ${
                urgencyColors[request.urgency] || urgencyColors.flexible
              }`}
            >
              {request.urgency}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">{request.description}</p>
      </div>
    </div>
  );
}
