'use client';

import * as React from 'react';
import { Shield, Sparkles, Heart, Activity } from 'lucide-react';

export function ImpactDashboard() {
  const [helpersCount, setHelpersCount] = React.useState(142);
  const [resolvedCount, setResolvedCount] = React.useState(1284);
  const [emergenciesCount, setEmergenciesCount] = React.useState(24);

  // Simulate real-time updates for impact metrics
  React.useEffect(() => {
    // 1. Slightly fluctuate helpers count every 6 seconds
    const helpersInterval = setInterval(() => {
      setHelpersCount((prev) => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(135, prev + delta);
      });
    }, 6000);

    // 2. Increment resolved count occasionally (every 10 seconds)
    const resolvedInterval = setInterval(() => {
      setResolvedCount((prev) => prev + 1);
    }, 10000);

    // 3. Fluctuate active emergency cases
    const emergenciesInterval = setInterval(() => {
      setEmergenciesCount((prev) => {
        const delta = Math.random() > 0.6 ? 1 : -1;
        return Math.max(15, prev + delta);
      });
    }, 8500);

    return () => {
      clearInterval(helpersInterval);
      clearInterval(resolvedInterval);
      clearInterval(emergenciesInterval);
    };
  }, []);

  return (
    <div className="bg-[#131B2E]/50 border border-white/10 rounded-lg p-5 shadow-2xl backdrop-blur-md select-none w-full animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-indigo-400 animate-pulse" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
          🌍 Live Network Impact
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-[#0b0f1a]/40 border border-white/5 rounded-md p-3.5 flex flex-col items-start relative overflow-hidden group">
          <div className="absolute top-2 right-2 flex items-center justify-center">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Active Helpers
          </span>
          <span className="text-2xl font-semibold text-white mt-1.5 font-mono">
            {helpersCount}
          </span>
          <span className="text-[9px] text-emerald-400 mt-1 flex items-center gap-0.5">
            ● Live nearby
          </span>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#0b0f1a]/40 border border-white/5 rounded-md p-3.5 flex flex-col items-start relative overflow-hidden">
          <Heart className="absolute top-2.5 right-2.5 h-3.5 w-3.5 text-indigo-500/40" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Requests Resolved
          </span>
          <span className="text-2xl font-semibold text-indigo-300 mt-1.5 font-mono">
            {resolvedCount.toLocaleString()}
          </span>
          <span className="text-[9px] text-indigo-400 mt-1">
            +1 resolved recently
          </span>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#0b0f1a]/40 border border-white/5 rounded-md p-3.5 flex flex-col items-start relative overflow-hidden">
          <Shield className="absolute top-2.5 right-2.5 h-3.5 w-3.5 text-rose-500/40" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Active Emergencies
          </span>
          <span className="text-2xl font-semibold text-rose-400 mt-1.5 font-mono">
            {emergenciesCount}
          </span>
          <span className="text-[9px] text-rose-400 mt-1">
            🚨 Dispatching alerts
          </span>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#0b0f1a]/40 border border-white/5 rounded-md p-3.5 flex flex-col items-start relative overflow-hidden">
          <Sparkles className="absolute top-2.5 right-2.5 h-3.5 w-3.5 text-amber-500/40" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Avg Response Time
          </span>
          <span className="text-2xl font-semibold text-amber-300 mt-1.5 font-mono">
            4.2m
          </span>
          <span className="text-[9px] text-amber-400 mt-1">
            ⚡ Instant pairing
          </span>
        </div>
      </div>
    </div>
  );
}
