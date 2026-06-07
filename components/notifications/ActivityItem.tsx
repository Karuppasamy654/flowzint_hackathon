import * as React from 'react';
import { Calendar, HelpCircle, CheckCircle, Hand } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityItemProps {
  activity: {
    _id: string;
    type: 'help_posted' | 'help_accepted' | 'help_resolved' | 'joined';
    title: string;
    description: string;
    createdAt: string | Date;
  };
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const iconConfig = {
    help_posted: { icon: HelpCircle, color: 'bg-blue-50 text-blue-600 border-blue-100' },
    help_accepted: { icon: Hand, color: 'bg-amber-50 text-amber-600 border-amber-100' },
    help_resolved: { icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    joined: { icon: Calendar, color: 'bg-purple-50 text-purple-600 border-purple-100' },
  }[activity.type] || { icon: HelpCircle, color: 'bg-gray-50 text-gray-500 border-gray-100' };

  const Icon = iconConfig.icon;

  const formattedDate = React.useMemo(() => {
    try {
      return format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return '';
    }
  }, [activity.createdAt]);

  return (
    <div className="flex items-start gap-3 bg-white p-3.5 rounded-lg border border-border/60 hover:shadow-xs transition-shadow">
      <div className={`p-2 rounded-md border shrink-0 ${iconConfig.color}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>

      <div className="flex-1 min-w-0 text-left">
        <h5 className="text-sm font-semibold text-gray-800 leading-snug">
          {activity.title}
        </h5>
        <p className="text-xs text-gray-500 leading-normal mt-0.5">
          {activity.description}
        </p>
        <span className="text-[10px] text-gray-400 font-medium block mt-1.5">
          {formattedDate}
        </span>
      </div>
    </div>
  );
}
