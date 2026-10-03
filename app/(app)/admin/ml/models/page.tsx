import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ModelInspectionView } from '@/components/admin/ModelInspectionView';

export default async function ModelInspectionPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect('/login');
  }

  return <ModelInspectionView />;
}

export const dynamic = 'force-dynamic';
