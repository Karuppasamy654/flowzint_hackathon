import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { ChatbotWindow } from '@/components/chatbot/ChatbotWindow';

export default async function ChatbotRouterPage() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect('/login');
  }

  await dbConnect();
  
  // Get fresh details of current user
  const dbUser = await User.findById(session.user.id).select('-passwordHash');
  if (!dbUser) {
    redirect('/login');
  }

  const serializedUser = {
    id: dbUser._id.toString(),
    name: dbUser.name,
    email: dbUser.email,
    location: dbUser.location,
    avatarUrl: dbUser.avatarUrl || '',
    avatarColor: dbUser.avatarColor,
  };

  return <ChatbotWindow currentUser={serializedUser} />;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
