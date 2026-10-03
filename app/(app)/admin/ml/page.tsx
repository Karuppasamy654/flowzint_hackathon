import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MLDashboard } from '@/components/admin/MLDashboard';

export default async function AdminMLDashboardPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect('/login');
  }

  return <MLDashboard />;
}

export const dynamic = 'force-dynamic';
