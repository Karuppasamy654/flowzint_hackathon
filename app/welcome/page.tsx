"use client";

import * as React from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";

const STRIP_GRADIENTS = [
  "from-violet-600 to-indigo-600",
  "from-indigo-600 to-blue-600",
  "from-blue-600 to-cyan-600",
  "from-cyan-600 to-teal-600",
  "from-teal-600 to-emerald-600",
  "from-emerald-600 to-green-600",
  "from-green-600 to-yellow-600",
  "from-yellow-600 to-orange-600",
  "from-orange-600 to-rose-600",
  "from-rose-600 to-pink-600",
];

export default function WelcomePage() {
  const { user } = useCurrentUser();
  const [doorsOpen, setDoorsOpen] = React.useState(false);
  const [showContent, setShowContent] = React.useState(false);
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  // Start animation immediately on mount — do NOT wait for session status.
  // The session may take time to resolve on Vercel; gating on it means the
  // doors never open. Auth is enforced by app/(app)/layout.tsx on /request.
  React.useEffect(() => {
    const t1 = setTimeout(() => setDoorsOpen(true), 300); // doors start peeling
    const t2 = setTimeout(() => setShowContent(true), 1400); // welcome text fades in
    const t3 = setTimeout(() => {
      setIsRedirecting(true);
      window.location.href = "/request";
    }, 5000); // auto-navigate

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []); // run exactly once on mount

  const handleProceed = () => {
    setIsRedirecting(true);
    window.location.href = "/request";
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center overflow-hidden">
      {/* ── Snake-door panels — each strip splits from the centre ── */}
      <div className="fixed inset-0 z-50 pointer-events-none select-none">
        {STRIP_GRADIENTS.map((gradient, idx) => (
          <React.Fragment key={idx}>
            {/* Left half — slides out to the left */}
            <div
              className={`absolute left-0 w-1/2 h-[10%] bg-gradient-to-r ${gradient}`}
              style={{
                top: `${idx * 10}%`,
                transform: doorsOpen ? "translateX(-102%)" : "translateX(0)",
                transition: "transform 900ms cubic-bezier(0.77, 0, 0.18, 1)",
                transitionDelay: `${idx * 60}ms`,
              }}
            />
            {/* Right half — slides out to the right */}
            <div
              className={`absolute right-0 w-1/2 h-[10%] bg-gradient-to-l ${gradient}`}
              style={{
                top: `${idx * 10}%`,
                transform: doorsOpen ? "translateX(102%)" : "translateX(0)",
                transition: "transform 900ms cubic-bezier(0.77, 0, 0.18, 1)",
                transitionDelay: `${idx * 60}ms`,
              }}
            />
          </React.Fragment>
        ))}
      </div>

      {/* ── Welcome content — fades in after doors peel open ── */}
      <div
        className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center px-6 transition-all duration-700"
        style={{
          opacity: showContent ? 1 : 0,
          transform: showContent ? "translateY(0)" : "translateY(24px)",
          pointerEvents: showContent ? "auto" : "none",
        }}
      >
        {/* Brand mark */}
        <div className="mb-8 flex items-center select-none">
          <span className="text-4xl font-display font-semibold text-white">
            Help
          </span>
          <span className="text-4xl font-extrabold text-indigo-400">Net</span>
        </div>

        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 animate-pulse">
          <Sparkles className="h-6 w-6 text-indigo-400" />
        </div>

        {/* Greeting — shows name if session resolved, generic otherwise */}
        <h1 className="text-4xl sm:text-5xl font-display font-semibold text-white tracking-tight leading-tight mb-4">
          {user?.name ? (
            <>
              Welcome,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                {user.name}!
              </span>
            </>
          ) : (
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
              Welcome to HelpNet!
            </span>
          )}
        </h1>

        <p className="text-slate-300 text-base sm:text-lg max-w-lg mb-10 leading-relaxed">
          Your neighbourhood workspace is ready — let&apos;s build a stronger,
          more connected community together.
        </p>

        {/* CTA button */}
        <button
          onClick={handleProceed}
          disabled={isRedirecting}
          className="group flex items-center justify-center gap-2 border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-full px-8 py-3.5 shadow-lg transition-all duration-200 text-sm hover:scale-[1.02] active:scale-[0.98] focus:outline-none"
        >
          {isRedirecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecting…
            </>
          ) : (
            <>
              Let&apos;s Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
