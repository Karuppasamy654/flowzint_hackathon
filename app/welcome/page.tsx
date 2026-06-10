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
  const { user, status } = useCurrentUser();
  const [doorsOpen, setDoorsOpen] = React.useState(false);
  const [showContent, setShowContent] = React.useState(false);
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    }
  }, [status]);

  // Once authenticated: open the doors, then show content, then redirect
  React.useEffect(() => {
    if (status !== "authenticated") return;

    const t1 = setTimeout(() => setDoorsOpen(true), 300);
    const t2 = setTimeout(() => setShowContent(true), 1200);
    const t3 = setTimeout(() => {
      setIsRedirecting(true);
      window.location.href = "/request";
    }, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [status]);

  const handleProceed = () => {
    setIsRedirecting(true);
    window.location.href = "/request";
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center overflow-hidden">
      {/* ── Snake Door Panels (always rendered, start closed) ── */}
      <div className="fixed inset-0 z-50 pointer-events-none select-none">
        {STRIP_GRADIENTS.map((gradient, idx) => {
          const slideLeft = idx % 2 === 0;
          return (
            <div
              key={idx}
              className={`absolute left-0 w-full h-[10%] bg-gradient-to-r ${gradient}`}
              style={{
                top: `${idx * 10}%`,
                transform: doorsOpen
                  ? slideLeft
                    ? "translateX(-102%)"
                    : "translateX(102%)"
                  : "translateX(0)",
                transition: `transform 850ms cubic-bezier(0.77, 0, 0.18, 1)`,
                transitionDelay: `${idx * 65}ms`,
              }}
            />
          );
        })}
      </div>

      {/* ── Content behind the doors ── */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center px-6">
        {/* While session is loading — show a subtle spinner */}
        {(status === "loading" || !user) && (
          <div className="flex flex-col items-center gap-4 text-white">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
            <p className="text-sm font-semibold tracking-widest text-slate-400 uppercase animate-pulse">
              Securing your session…
            </p>
          </div>
        )}

        {/* Once authenticated — welcome message fades in after doors open */}
        {status === "authenticated" && user && (
          <div
            className="flex flex-col items-center transition-all duration-700"
            style={{
              opacity: showContent ? 1 : 0,
              transform: showContent ? "translateY(0)" : "translateY(24px)",
              pointerEvents: showContent ? "auto" : "none",
            }}
          >
            {/* Brand */}
            <div className="mb-8 flex items-center select-none">
              <span className="text-4xl font-display font-semibold text-white">
                Help
              </span>
              <span className="text-4xl font-extrabold text-indigo-400">
                Net
              </span>
            </div>

            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 animate-pulse">
              <Sparkles className="h-6 w-6 text-indigo-400" />
            </div>

            {/* Greeting */}
            <h1 className="text-4xl sm:text-5xl font-display font-semibold text-white tracking-tight leading-tight mb-4">
              Welcome,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                {user.name}!
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-lg mb-10 leading-relaxed">
              Your neighbourhood workspace is ready — let's build a stronger,
              more connected community together.
            </p>

            {/* CTA */}
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
                  Let's Get Started
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
