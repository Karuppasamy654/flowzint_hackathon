import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import HelpRequest from '@/models/HelpRequest';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { broadcastRealtimeEvent } from '@/lib/supabase';

const ResolveChatSchema = z.object({
  rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  feedback: z.string().optional().default(''),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const currentUserId = session.user.id;
    const { chatId } = params;

    // Find the chat first
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return NextResponse.json(
        { success: false, error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Must be participant (seeker or helper)
    const isSeeker = chat.seeker.toString() === currentUserId;
    const isHelper = chat.helper.toString() === currentUserId;
    if (!isSeeker && !isHelper) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Mark messages from the OTHER party as read
    let hasChanges = false;
    chat.messages.forEach((msg: any) => {
      const isIncoming = msg.sender.toString() !== currentUserId;
      const isNotReadYet = !msg.readBy.some(
        (readId: any) => readId.toString() === currentUserId
      );
      if (isIncoming && isNotReadYet) {
        msg.readBy.push(new mongoose.Types.ObjectId(currentUserId));
        hasChanges = true;
      }
    });

    if (hasChanges) {
      await chat.save();
    }

    // Retrieve full populated chat
    const populatedChat = await Chat.findById(chatId)
      .populate('seeker', 'name avatarUrl avatarColor location rating')
      .populate('helper', 'name avatarUrl avatarColor location rating')
      .populate('request', 'title description category urgency status seeker')
      .populate('messages.sender', 'name avatarUrl avatarColor');

    return NextResponse.json({ success: true, data: populatedChat }, { status: 200 });
  } catch (error: any) {
    console.error('GET chat details error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const currentUserId = session.user.id;
    const { chatId } = params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return NextResponse.json({ success: false, error: 'Chat not found' }, { status: 404 });
    }

    // Auth check: must be seeker
    if (chat.seeker.toString() !== currentUserId) {
      return NextResponse.json(
        { success: false, error: 'Only the seeker can resolve the request and submit ratings' },
        { status: 403 }
      );
    }

    if (chat.status === 'resolved') {
      return NextResponse.json(
        { success: false, error: 'This chat is already resolved' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parseResult = ResolveChatSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message || 'Validation error',
        },
        { status: 422 }
      );
    }

    const { rating, feedback } = parseResult.data;

    // 1. Update Chat
    chat.status = 'resolved';
    chat.seekerRating = rating;
    chat.seekerFeedback = feedback;
    chat.resolvedAt = new Date();
    await chat.save();

    // 2. Update HelpRequest Status
    await HelpRequest.findByIdAndUpdate(chat.request, {
      status: 'completed',
      resolvedAt: new Date(),
    });

    // 3. Update helper rating metrics
    const helperId = chat.helper.toString();
    await User.findByIdAndUpdate(helperId, {
      $inc: {
        'rating.total': rating,
        'rating.count': 1,
      },
    });

    const seekerUser = await User.findById(currentUserId);
    const seekerName = seekerUser ? seekerUser.name : 'The seeker';

    // 4. Create Notification for helper
    const notification = await Notification.create({
      recipient: chat.helper,
      type: 'rating_received',
      title: 'Feedback received!',
      body: `${seekerName} rated their experience: ${rating} stars.`,
      meta: {
        chatId,
        rating,
        feedback,
      },
    });

    // 5. Broadcast via Supabase to helper
    await broadcastRealtimeEvent(`notifications:${helperId}`, 'rating_received', {
      notificationId: notification._id.toString(),
      rating,
      feedback,
      seekerName,
      chatId,
    });

    return NextResponse.json({ success: true, data: chat }, { status: 200 });
  } catch (error: any) {
    console.error('Resolve chat and rate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
