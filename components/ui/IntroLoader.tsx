'use client';

import * as React from 'react';

export function IntroLoader() {
  const [visible, setVisible] = React.useState(true);
  const [fadeOut, setFadeOut] = React.useState(false);

  React.useEffect(() => {
    // Trigger fade out at 2.3 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2300);

    // Entirely unmount loader at 2.8 seconds
    const unmountTimer = setTimeout(() => {
      setVisible(false);
    }, 2800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  if (!visible) return null;

  const letters = [
    { char: 'H', dir: 'top-left', color: '#ff4b72' },
    { char: 'e', dir: 'bottom-right', color: '#ff9f1c' },
    { char: 'l', dir: 'top', color: '#2ec4b6' },
    { char: 'p', dir: 'bottom', color: '#00bbf9' },
    { char: 'N', dir: 'left', color: '#a370f7' },
    { char: 'e', dir: 'right', color: '#f15bb5' },
    { char: 't', dir: 'top-right', color: '#ffe066' },
  ];

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950 transition-opacity duration-500 ease-out select-none ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Styles for dynamic keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fly-in-top-left {
          0% {
            opacity: 0;
            transform: translate3d(-300px, -300px, 0) scale(0.3) rotate(-90deg);
          }
          70% {
            transform: translate3d(10px, 10px, 0) scale(1.1) rotate(5deg);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          }
        }

        @keyframes fly-in-bottom-right {
          0% {
            opacity: 0;
            transform: translate3d(300px, 300px, 0) scale(0.3) rotate(90deg);
          }
          70% {
            transform: translate3d(-10px, -10px, 0) scale(1.1) rotate(-5deg);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          }
        }

        @keyframes fly-in-top {
          0% {
            opacity: 0;
            transform: translate3d(0, -300px, 0) scale(0.3) rotate(45deg);
          }
          70% {
            transform: translate3d(0, 10px, 0) scale(1.1) rotate(-2deg);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          }
        }

        @keyframes fly-in-bottom {
          0% {
            opacity: 0;
            transform: translate3d(0, 300px, 0) scale(0.3) rotate(-45deg);
          }
          70% {
            transform: translate3d(0, -10px, 0) scale(1.1) rotate(2deg);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          }
        }

        @keyframes fly-in-left {
          0% {
            opacity: 0;
            transform: translate3d(-300px, 0, 0) scale(0.3) rotate(-180deg);
          }
          70% {
            transform: translate3d(10px, 0, 0) scale(1.1) rotate(5deg);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          }
        }

        @keyframes fly-in-right {
          0% {
            opacity: 0;
            transform: translate3d(300px, 0, 0) scale(0.3) rotate(180deg);
          }
          70% {
            transform: translate3d(-10px, 0, 0) scale(1.1) rotate(-5deg);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          }
        }

        @keyframes fly-in-top-right {
          0% {
            opacity: 0;
            transform: translate3d(300px, -300px, 0) scale(0.3) rotate(90deg);
          }
          70% {
            transform: translate3d(-10px, 10px, 0) scale(1.1) rotate(-5deg);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          }
        }

        @keyframes text-pulse-glow {
          0%, 100% {
            text-shadow: 0 0 10px rgba(99, 102, 241, 0.4), 0 0 20px rgba(99, 102, 241, 0.2);
            transform: scale(1);
          }
          50% {
            text-shadow: 0 0 25px rgba(99, 102, 241, 0.8), 0 0 40px rgba(244, 63, 94, 0.5);
            transform: scale(1.04);
          }
        }

        @keyframes bg-gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-letter {
          display: inline-block;
          font-weight: 900;
          font-family: 'DM Serif Display', system-ui, serif;
          font-size: 4rem;
          color: currentColor;
          opacity: 0;
          animation-fill-mode: forwards;
          animation-duration: 0.8s;
          animation-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @media (min-width: 640px) {
          .animate-letter {
            font-size: 6rem;
          }
        }

        .animate-letter-top-left { animation-name: fly-in-top-left; animation-delay: 0.1s; }
        .animate-letter-bottom-right { animation-name: fly-in-bottom-right; animation-delay: 0.15s; }
        .animate-letter-top { animation-name: fly-in-top; animation-delay: 0.2s; }
        .animate-letter-bottom { animation-name: fly-in-bottom; animation-delay: 0.25s; }
        .animate-letter-left { animation-name: fly-in-left; animation-delay: 0.3s; }
        .animate-letter-right { animation-name: fly-in-right; animation-delay: 0.35s; }
        .animate-letter-top-right { animation-name: fly-in-top-right; animation-delay: 0.4s; }

        .assembled-word {
          animation: text-pulse-glow 1.8s ease-in-out infinite;
          animation-delay: 1.2s;
        }

        .shimmer-text {
          background: linear-gradient(to right, #ffffff 20%, #6366f1 50%, #f43f5e 80%, #ffffff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: bg-gradient 4s linear infinite;
        }

        .tagline-fade-in {
          opacity: 0;
          animation: fly-up-fade 0.7s ease-out forwards;
          animation-delay: 1.1s;
        }

        @keyframes fly-up-fade {
          0% {
            opacity: 0;
            transform: translate3d(0, 16px, 0);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
      ` }} />

      {/* Intro Letters Assembly Container */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="assembled-word flex space-x-1 select-none">
          {letters.map((item, idx) => (
            <span
              key={idx}
              className={`animate-letter animate-letter-${item.dir}`}
              style={{ color: item.color }}
            >
              {item.char}
            </span>
          ))}
        </div>

        {/* Dynamic Shimmering Tagline */}
        <div className="tagline-fade-in mt-6 select-none flex items-center justify-center">
          <span className="shimmer-text text-sm font-semibold tracking-widest uppercase">
            Community Help Network
          </span>
        </div>
      </div>
    </div>
  );
}
