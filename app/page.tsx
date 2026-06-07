import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SKILL_COLORS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';

export default async function Home() {
  const session = await auth();
  if (session) {
    redirect('/request');
  }

  // Pick 7 distinct skills to showcase on the landing screen
  const showcaseSkills = [
    'Plumbing',
    'Electrician',
    'Teaching',
    'Design',
    'Cooking',
    'Web Dev',
    'Mental Health',
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between font-sans">
      {/* Top Navbar */}
      <header className="w-full max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center select-none">
          <span className="text-2xl font-display font-semibold text-primary">Help</span>
          <span className="text-2xl font-sans font-extrabold text-primary">Net</span>
        </Link>
        <Link
          href="/login"
          className="text-sm font-semibold text-gray-600 hover:text-gray-900 border border-transparent hover:border-gray-200 hover:bg-white px-4 py-2 rounded-md transition-all duration-150"
        >
          Sign in
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 text-center max-w-4xl mx-auto">
        <div className="space-y-6 max-w-2xl">
          <h1 className="text-4xl sm:text-6xl font-display font-semibold leading-tight text-gray-900 tracking-tight">
            Your community is your greatest resource.
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 font-normal leading-relaxed max-w-lg mx-auto">
            Connect with skilled neighbours who want to help. Free, fast, human.
          </p>
        </div>

        {/* Call to Actions */}
        <div className="mt-8 flex gap-3 justify-center w-full max-w-md">
          <Link
            href="/signup/step1"
            className="flex-1 h-12 flex items-center justify-center bg-primary hover:bg-primary-hover text-white font-semibold px-8 rounded-pill shadow-card transition-colors text-sm sm:text-base whitespace-nowrap"
          >
            Get started &rarr;
          </Link>
          <Link
            href="/login"
            className="flex-1 h-12 flex items-center justify-center border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-8 rounded-pill transition-colors text-sm sm:text-base whitespace-nowrap"
          >
            Sign in
          </Link>
        </div>

        {/* Decorative Skills Showcase */}
        <div className="mt-16 space-y-3.5 select-none w-full max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            People near you can help with
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
            {showcaseSkills.map((skill) => {
              const colorClass = SKILL_COLORS[skill] || 'bg-gray-50 text-gray-600 border-gray-200';
              return (
                <Badge
                  key={skill}
                  variant="outline"
                  className={`text-xs font-semibold px-3.5 py-1 rounded-full border shadow-2xs ${colorClass}`}
                >
                  {skill}
                </Badge>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer Strip */}
      <footer className="w-full text-center py-6 text-xs text-gray-400 border-t border-border mt-12">
        <div className="max-w-6xl mx-auto px-6">
          Free to use &bull; No sign-up fee &bull; Community-powered &bull; &copy; {new Date().getFullYear()} HelpNet.
        </div>
      </footer>
    </div>
  );
}
