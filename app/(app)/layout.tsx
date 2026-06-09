import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { ChatAssistant } from '@/components/ai/ChatAssistant';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  // Pass session user metadata to the client component AppShell
  const userPayload = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    avatarUrl: (session.user as any).avatarUrl,
    avatarColor: (session.user as any).avatarColor,
    skills: (session.user as any).skills,
    location: (session.user as any).location,
  };

  return (
    <>
      <AppShell user={userPayload}>{children}</AppShell>
      <ChatAssistant />
    </>
  );
}
export const dynamic = 'force-dynamic';
