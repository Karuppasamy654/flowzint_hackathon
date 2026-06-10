import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { InsightsDashboard } from '@/components/insights/InsightsDashboard';

export default async function InsightsPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect('/login');
  }

  return <InsightsDashboard />;
}

export const dynamic = 'force-dynamic';
