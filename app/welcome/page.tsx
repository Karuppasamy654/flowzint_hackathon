'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const { user, status, isLoading } = useCurrentUser();
  const [doorsOpen, setDoorsOpen] = React.useState(false);
  const [showContent, setShowContent] = React.useState(false);
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  // Set page title on client side
  React.useEffect(() => {
    document.title = 'Welcome to HelpNet';
  }, []);

  // Trigger snake door opening sequence
  React.useEffect(() => {
    if (status !== 'authenticated') return;

    // Start peeling open the snake strips after 500ms
    const openTimer = setTimeout(() => {
      setDoorsOpen(true);
    }, 500);

    // Show the minimal content after the snake transition completes
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 1200);

    // Auto-redirect to dashboard after 4.5 seconds
    const redirectTimer = setTimeout(() => {
      setIsRedirecting(true);
      router.push('/request');
    }, 4500);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(contentTimer);
      clearTimeout(redirectTimer);
    };
  }, [status, router]);

  // Handle explicit manual redirect
  const handleProceed = () => {
    setIsRedirecting(true);
    router.push('/request');
  };

  // Client-side authentication guard
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (isLoading || status === 'loading' || status === 'unauthenticated' || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-sm font-semibold tracking-wider text-slate-400 uppercase animate-pulse">
          Securing your session...
        </p>
      </div>
    );
  }

  // Gradients for the 10 horizontal strips representing the colorful door
  const STRIP_GRADIENTS = [
    'from-violet-600 to-indigo-600',
    'from-indigo-600 to-blue-600',
    'from-blue-600 to-cyan-600',
    'from-cyan-600 to-teal-600',
    'from-teal-600 to-emerald-600',
    'from-emerald-600 to-green-600',
    'from-green-600 to-yellow-600',
    'from-yellow-600 to-orange-600',
    'from-orange-600 to-rose-600',
    'from-rose-600 to-pink-600',
  ];

  return (
    <div className="min-h-screen w-full relative bg-slate-950 flex flex-col items-center justify-center overflow-hidden font-sans py-12 px-4">
      
      {/* Snake Door Transition Panels */}
      <div className="fixed inset-0 z-50 pointer-events-none select-none">
        {STRIP_GRADIENTS.map((gradient, idx) => {
          // Alternate sliding direction for adjacent strips to create the winding "snake" peel-off
          const slideLeft = idx % 2 === 0;
          const transformValue = doorsOpen 
            ? (slideLeft ? 'translateX(-100%)' : 'translateX(100%)') 
            : 'translateX(0)';
          
          return (
            <div
              key={idx}
              className={`absolute left-0 w-full h-[10%] bg-gradient-to-r ${gradient} transition-transform ease-in-out border-b border-white/5 shadow-md`}
              style={{
                top: `${idx * 10}%`,
                transform: transformValue,
                transitionDuration: '800ms',
                // Stagger the starts by 70ms to produce a continuous wavy animation
                transitionDelay: `${idx * 70}ms`,
              }}
            />
          );
        })}
      </div>

      {/* Main welcome page content underneath */}
      {/* Premium animated background mesh gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-rose-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute top-[30%] right-[20%] w-[40%] h-[40%] rounded-full bg-cyan-500/5 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      {/* Styled Brand header */}
      <div className="mb-12 flex items-center select-none z-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <span className="text-3xl font-display font-semibold text-white">Help</span>
        <span className="text-3xl font-sans font-extrabold text-primary">Net</span>
      </div>

      {/* Minimalist Welcome Typography Area (No box background, no loading bar, just text and CTA) */}
      <div 
        className="w-full max-w-2xl z-10 flex flex-col items-center text-center transition-all duration-1000"
        style={{
          transform: showContent ? 'translateY(0)' : 'translateY(24px)',
          opacity: showContent ? 1 : 0,
          pointerEvents: showContent ? 'auto' : 'none'
        }}
      >
        {/* Glowing visual emblem */}
        <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 animate-pulse">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>

        {/* Big greeting header */}
        <h1 className="text-4xl sm:text-5xl font-display font-semibold text-white tracking-tight leading-tight mb-4">
          Welcome to HelpNet, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-400">{user.name}</span>!
        </h1>

        {/* Single friendly welcoming sentence */}
        <p className="text-slate-300 text-base sm:text-lg font-normal max-w-lg mb-10 leading-relaxed">
          Your neighborhood workspace is ready - let's build a stronger, more connected community together.
        </p>

        {/* Elegant glassmorphic CTA button to skip timer */}
        <button
          onClick={handleProceed}
          disabled={isRedirecting}
          className="group flex items-center justify-center border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-full px-8 py-3.5 shadow-lg transition-all duration-200 text-sm hover:scale-[1.02] active:scale-[0.98] focus:outline-none"
        >
          {isRedirecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Redirecting...
            </>
          ) : (
            <>
              Let's Get Started
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>

      </div>
    </div>
  );
}
