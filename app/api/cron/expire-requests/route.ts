import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import HelpRequest from '@/models/HelpRequest';
import Notification from '@/models/Notification';

export async function GET(req: NextRequest) {
  try {
    // Check Authorization: Bearer <CRON_SECRET>
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const now = new Date();

    // Find all requests where status=pending and expiresAt < now
    const expiredRequests = await HelpRequest.find({
      status: 'pending',
      expiresAt: { $lt: now },
    });

    if (expiredRequests.length === 0) {
      return NextResponse.json(
        { success: true, message: 'No pending requests have expired.', count: 0 },
        { status: 200 }
      );
    }

    // Update status to expired
    const expiredIds = expiredRequests.map((r: any) => r._id);
    await HelpRequest.updateMany(
      { _id: { $in: expiredIds } },
      { $set: { status: 'expired' } }
    );

    // Create notifications for each seeker
    const notificationPromises = expiredRequests.map(async (request: any) => {
      await Notification.create({
        recipient: request.seeker,
        type: 'request_expired',
        title: 'Request expired',
        body: `Your request "${request.title}" has expired after 24 hours without a helper.`,
        meta: {
          requestId: request._id.toString(),
        },
      });
    });

    await Promise.all(notificationPromises);

    return NextResponse.json(
      {
        success: true,
        message: `Successfully expired ${expiredRequests.length} requests.`,
        count: expiredRequests.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Request expiration cron error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
