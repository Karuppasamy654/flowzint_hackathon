import { Avatar } from '../ui/avatar';
import { Star } from 'lucide-react';

interface Helper {
  _id: string;
  name: string;
  avatarUrl?: string;
  avatarColor?: string;
  rating: {
    total: number;
    count: number;
  };
  avgRating: number;
  location: string;
  skills: string[];
}

interface HelperRowProps {
  helper: Helper;
}

export function HelperRow({ helper }: HelperRowProps) {
  return (
    <div className="flex items-center gap-3 bg-[#131B2E]/60 p-3.5 rounded-md border border-white/10 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:border-indigo-500/20 transition-all duration-300">
      <Avatar
        src={helper.avatarUrl}
        name={helper.name}
        color={helper.avatarColor}
        size="md"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-semibold text-white truncate">{helper.name}</h5>
          <div className="flex items-center text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 shrink-0">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400 mr-0.5" />
            <span>{helper.avgRating ? helper.avgRating.toFixed(1) : '5.0'}</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-0.5 truncate">{helper.location}</p>
        
        {/* Skills list */}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {helper.skills && helper.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-[10px] font-semibold bg-[#0B0F1A]/70 text-slate-300 border border-white/5 rounded-sm px-1.5 py-0.5"
            >
              {skill}
            </span>
          ))}
          {helper.skills && helper.skills.length > 3 && (
            <span className="text-[9px] text-slate-500 font-medium self-center ml-0.5">
              +{helper.skills.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
