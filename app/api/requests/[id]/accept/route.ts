import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import HelpRequest from '@/models/HelpRequest';
import Chat from '@/models/Chat';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { auth } from '@/lib/auth';
import { broadcastRealtimeEvent } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const currentUserId = session.user.id;
    const requestId = params.id;

    const user = await User.findById(currentUserId);
    if (!user || user.isBot || user.isDemo) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const request = await HelpRequest.findById(requestId);
    if (!request) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }

    if (request.seeker.toString() === currentUserId) {
      return NextResponse.json({ success: false, error: 'You cannot accept your own request.' }, { status: 403 });
    }

    let helperId = currentUserId;
    if (process.env.USE_MOCK_DB === 'true') {
      try {
        const body = await req.json();
        if (body && body.helperId) {
          helperId = body.helperId;
        }
      } catch (e) {
        // Ignore empty body or parsing issues
      }
    }

    // Atomic MongoDB update using findOneAndUpdate to handle race condition
    const updated = await HelpRequest.findOneAndUpdate(
      { _id: requestId, status: 'pending' },
      { $set: { status: 'active', acceptedHelper: new mongoose.Types.ObjectId(helperId), acceptedAt: new Date() } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'This request has already been accepted by someone else.' },
        { status: 409 }
      );
    }

    // Create Chat document
    const chat = await Chat.create({
      request: new mongoose.Types.ObjectId(requestId),
      seeker: updated.seeker,
      helper: new mongoose.Types.ObjectId(helperId),
      messages: [],
      status: 'active',
    });

    const helperUser = await User.findById(helperId);
    const helperName = helperUser ? helperUser.name : 'A helper';
    const helperAvatar = helperUser ? helperUser.avatarUrl || '' : '';
    const helperColor = helperUser ? helperUser.avatarColor : '#7C3AED';

    const seekerId = updated.seeker.toString();

    // Create Notification for the seeker
    const notification = await Notification.create({
      recipient: new mongoose.Types.ObjectId(seekerId),
      type: 'request_accepted',
      title: 'Help is on the way!',
      body: `${helperName} accepted your request!`,
      meta: {
        chatId: chat._id.toString(),
        helperId: helperId,
      },
    });

    // Broadcast to seeker via Supabase Realtime channel request:[requestId]
    await broadcastRealtimeEvent(`request:${requestId}`, 'request_accepted', {
      chatId: chat._id.toString(),
      helperName,
      helperAvatar,
      helperColor,
      helperId,
      requestId,
    });

    // Notify seeker via notifications:seekerId channel
    await broadcastRealtimeEvent(`notifications:${seekerId}`, 'request_accepted', {
      notificationId: notification._id.toString(),
      chatId: chat._id.toString(),
      helperName,
      helperAvatar,
      helperColor,
      requestId,
    });

    // Handle notifications and broadcasts for other matched helpers
    const otherHelpers = updated.matchedHelpers.filter(
      (mh: any) => (mh.userId || mh).toString() !== helperId
    );

    const otherPromises = otherHelpers.map(async (mh: any) => {
      const otherId = (mh.userId || mh).toString();
      
      // Create Notification doc
      await Notification.create({
        recipient: new mongoose.Types.ObjectId(otherId),
        type: 'request_taken',
        title: 'Request taken',
        body: `The request you matched for has been accepted by someone else.`,
        meta: {
          requestId,
        },
      });

      // Broadcast event via Supabase notifications:[helperId]
      await broadcastRealtimeEvent(`notifications:${otherId}`, 'request_taken', {
        requestId,
      });
    });

    await Promise.all(otherPromises);

    return NextResponse.json({ success: true, chatId: chat._id.toString(), data: { chat } }, { status: 200 });
  } catch (error: any) {
    console.error('Accept request error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
