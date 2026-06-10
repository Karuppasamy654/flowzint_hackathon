import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { IntroLoader } from "@/components/ui/IntroLoader";
import Link from "next/link";
import { SKILL_COLORS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Shield,
  MessageSquare,
  Zap,
  Star,
  Users,
  ChevronRight,
} from "lucide-react";

export default async function Home() {
  const session = await auth();
  if (session) {
    redirect("/request");
  }

  const showcaseSkills = [
    "Plumbing",
    "Electrician",
    "Teaching",
    "Design",
    "Cooking",
    "Web Dev",
    "Mental Health",
    "Legal",
    "Music",
    "Finance",
  ];

  const aiFeatures = [
    {
      icon: "🧠",
      title: "AI Request Analyser",
      desc: "Scores clarity and auto-fills category in real time as you type.",
    },
    {
      icon: "✨",
      title: "AI Request Enhancer",
      desc: "One-click AI rewrite makes your request crystal clear.",
    },
    {
      icon: "🎯",
      title: "Semantic Matching",
      desc: "Gemini AI ranks nearby helpers by skill relevance and rating.",
    },
    {
      icon: "💬",
      title: "Smart Reply Chips",
      desc: "Context-aware reply suggestions keep chat flowing fast.",
    },
    {
      icon: "❤️",
      title: "Emotion Detector",
      desc: "Detects stress in messages and guides empathetic responses.",
    },
    {
      icon: "🌐",
      title: "Auto-Translate",
      desc: "Real-time cross-language translation so language is never a barrier.",
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Post your request",
      desc: "Describe what you need. AI instantly analyses, categorises, and safety-checks it.",
    },
    {
      num: "02",
      title: "AI finds your helper",
      desc: "Gemini ranks nearby skilled neighbours by relevance. Top matches are notified instantly.",
    },
    {
      num: "03",
      title: "Chat & coordinate",
      desc: "Open a real-time encrypted chat. Smart replies, translation, and emotion guidance built in.",
    },
    {
      num: "04",
      title: "Resolve & rate",
      desc: "Mark resolved when done. Rate your helper to build community trust scores.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-100 font-sans overflow-x-hidden">
      <IntroLoader />

      {/* ── TOP NAV ── */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#0B0F1A]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center select-none">
            <span className="text-2xl font-display font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              Help
            </span>
            <span className="text-2xl font-extrabold text-indigo-400">Net</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-400 hover:text-white transition-colors px-4 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/signup/step1"
              className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-full transition-colors shadow-lg shadow-indigo-500/20"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-blue-600/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center space-y-8">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold px-4 py-2 rounded-full">
            <Zap className="h-3.5 w-3.5 fill-indigo-300/50" />
            Powered by Google Gemini AI
          </div>

          <h1 className="text-5xl sm:text-7xl font-display font-semibold leading-[1.05] tracking-tight text-white">
            Your community is your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              greatest resource.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            HelpNet connects you with skilled neighbours who genuinely want to
            help. AI-powered matching, real-time chat, and zero fees.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/signup/step1"
              className="inline-flex items-center justify-center gap-2 h-13 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-full shadow-xl shadow-indigo-500/25 transition-colors text-base"
            >
              Get started free
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-13 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/8 text-slate-300 font-semibold px-8 py-3.5 rounded-full transition-colors text-base"
            >
              Sign in
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium pt-4">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Community-powered
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> AI safety moderation
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5" /> Rated helpers only
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" /> 10+ AI features
            </span>
          </div>
        </div>
      </section>

      {/* ── SKILLS TICKER ── */}
      <section className="py-12 border-y border-white/5 bg-white/2">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-5">
            People near you can help with
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {showcaseSkills.map((skill) => {
              const colorClass =
                SKILL_COLORS[skill] ||
                "bg-gray-800 text-slate-300 border-gray-700";
              return (
                <Badge
                  key={skill}
                  variant="outline"
                  className={`text-xs font-semibold px-4 py-1.5 rounded-full border ${colorClass}`}
                >
                  {skill}
                </Badge>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-400">
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl font-display font-semibold text-white tracking-tight">
              From request to resolution in minutes
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className="relative bg-[#131B2E]/60 border border-white/8 rounded-2xl p-6 text-left hover:border-indigo-500/30 transition-colors backdrop-blur-md"
              >
                <div className="text-4xl font-black text-white/5 font-mono mb-3 select-none">
                  {step.num}
                </div>
                <h3 className="text-sm font-bold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-700 text-lg">
                    ›
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI FEATURES ── */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent via-indigo-950/10 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-400">
              AI-first platform
            </p>
            <h2 className="text-3xl sm:text-4xl font-display font-semibold text-white tracking-tight">
              10 AI features working for you
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Every step of the help journey is enhanced by Google Gemini — from
              writing your request to closing the chat.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {aiFeatures.map((feat) => (
              <div
                key={feat.title}
                className="bg-[#131B2E]/60 border border-white/8 rounded-2xl p-6 hover:border-indigo-500/25 transition-colors backdrop-blur-md group"
              >
                <div className="text-3xl mb-4">{feat.icon}</div>
                <h3 className="text-sm font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              + Conflict Resolver, Community Digest, Voice Input and more built
              in
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA BLOCK ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-indigo-600/20 to-violet-600/10 border border-indigo-500/20 rounded-3xl p-12 space-y-6">
          <Brain className="h-12 w-12 text-indigo-400 mx-auto" />
          <h2 className="text-3xl sm:text-4xl font-display font-semibold text-white tracking-tight">
            Ready to help and be helped?
          </h2>
          <p className="text-slate-400 text-base max-w-lg mx-auto">
            Join HelpNet today — free for everyone, forever. Your skills can
            change someone&apos;s day.
          </p>
          <Link
            href="/signup/step1"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-10 py-4 rounded-full shadow-xl shadow-indigo-500/30 transition-colors text-base"
          >
            Join the community
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-semibold text-indigo-400">
              HelpNet
            </span>
            <span>— Community-powered help platform</span>
          </div>
          <span>
            Free to use · No sign-up fee · Community-powered · ©{" "}
            {new Date().getFullYear()} HelpNet
          </span>
        </div>
      </footer>
    </div>
  );
}
