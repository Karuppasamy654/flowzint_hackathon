import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import HelpRequest from '@/models/HelpRequest';
import User from '@/models/User';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Fetch all users and help requests to compute stats
    // We fetch and compute in memory to support both MongoDB and MockDB seamlessly
    const allUsers = await User.find({});
    const allRequests = await HelpRequest.find({});

    // 1. Helpers count: users with at least one skill
    const helpersCount = allUsers.filter((u: any) => u.skills && u.skills.length > 0).length;

    // 2. Resolved requests count: requests with status === 'completed'
    const resolvedCount = allRequests.filter((r: any) => r.status === 'completed').length;

    // 3. Active emergencies: pending or active requests that are marked as 'urgent'
    const emergenciesCount = allRequests.filter(
      (r: any) => (r.status === 'pending' || r.status === 'active') && r.urgency === 'urgent'
    ).length;

    // 4. Average response time: average time from createdAt to acceptedAt for all accepted requests
    const acceptedRequests = allRequests.filter((r: any) => r.acceptedAt && r.createdAt);
    let avgResponseMinutes = 4.2; // default fallback
    if (acceptedRequests.length > 0) {
      const totalMinutes = acceptedRequests.reduce((acc: number, r: any) => {
        const diffMs = new Date(r.acceptedAt).getTime() - new Date(r.createdAt).getTime();
        return acc + (diffMs / 1000 / 60);
      }, 0);
      avgResponseMinutes = totalMinutes / acceptedRequests.length;
    }

    return NextResponse.json({
      success: true,
      data: {
        helpersCount,
        resolvedCount,
        emergenciesCount,
        avgResponseMinutes,
      },
    });
  } catch (error: any) {
    console.error('Fetch stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
