import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { ProfilePage } from '@/components/profile/ProfilePage';

export default async function ProfileRouterPage() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect('/login');
  }

  await dbConnect();
  
  // Load fresh details directly from Database
  const dbUser = await User.findById(session.user.id).select('-passwordHash');
  if (!dbUser) {
    redirect('/login');
  }

  // Map to clean serialized initialUser object
  const serializedUser = {
    id: dbUser._id.toString(),
    name: dbUser.name,
    email: dbUser.email,
    bio: dbUser.bio || '',
    location: dbUser.location,
    skills: dbUser.skills || [],
    avatarUrl: dbUser.avatarUrl || '',
    avatarColor: dbUser.avatarColor,
    rating: {
      total: dbUser.rating?.total || 0,
      count: dbUser.rating?.count || 0,
    },
    avgRating: dbUser.avgRating || 0, // Mongoose virtual
    createdAt: new Date(dbUser.createdAt).toISOString(),
  };

  return <ProfilePage initialUser={serializedUser} />;
}
export const dynamic = 'force-dynamic';
export const revalidate = 0;
