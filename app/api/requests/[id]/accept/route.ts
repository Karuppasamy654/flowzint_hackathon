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

    // Find the request
    const helpRequest = await HelpRequest.findById(requestId);
    if (!helpRequest) {
      return NextResponse.json(
        { success: false, error: 'Help request not found' },
        { status: 404 }
      );
    }

    // Must be in matchedHelpers array
    const isMatched = helpRequest.matchedHelpers.some(
      (hId: any) => hId.toString() === helperId
    );
    if (!isMatched && process.env.USE_MOCK_DB !== 'true') {
      return NextResponse.json(
        { success: false, error: 'You are not matched for this request' },
        { status: 403 }
      );
    }

    // Check request is still pending
    if (helpRequest.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `This request is no longer pending (status: ${helpRequest.status})` },
        { status: 400 }
      );
    }

    // Update request: acceptedHelper = helperId, status = active, acceptedAt = now
    helpRequest.acceptedHelper = new mongoose.Types.ObjectId(helperId);
    helpRequest.status = 'active';
    helpRequest.acceptedAt = new Date();
    
    // In mock DB mode, ensure helperId is in matchedHelpers if it wasn't already, so UI doesn't break
    if (process.env.USE_MOCK_DB === 'true' && !isMatched) {
      helpRequest.matchedHelpers.push(new mongoose.Types.ObjectId(helperId));
    }
    
    await helpRequest.save();

    // Create Chat document
    const chat = await Chat.create({
      request: new mongoose.Types.ObjectId(requestId),
      seeker: helpRequest.seeker,
      helper: new mongoose.Types.ObjectId(helperId),
      messages: [],
      status: 'active',
    });

    const helperUser = await User.findById(helperId);
    const helperName = helperUser ? helperUser.name : 'A helper';
    const helperAvatar = helperUser ? helperUser.avatarUrl || '' : '';
    const helperColor = helperUser ? helperUser.avatarColor : '#7C3AED';

    const seekerId = helpRequest.seeker.toString();

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

    // Broadcast to seeker via Supabase Realtime
    await broadcastRealtimeEvent(`notifications:${seekerId}`, 'request_accepted', {
      notificationId: notification._id.toString(),
      chatId: chat._id.toString(),
      helperName,
      helperAvatar,
      helperColor,
      requestId,
    });

    return NextResponse.json({ success: true, data: { chat } }, { status: 200 });
  } catch (error: any) {
    console.error('Accept request error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
