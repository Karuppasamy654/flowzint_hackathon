import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { broadcastRealtimeEvent } from '@/lib/supabase';

const CreateMessageSchema = z.object({
  text: z.string().min(1, 'Message text cannot be empty').max(2000, 'Message cannot exceed 2000 characters'),
});

export async function POST(
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

    // Must be participant (seeker or helper)
    const isSeeker = chat.seeker.toString() === currentUserId;
    const isHelper = chat.helper.toString() === currentUserId;
    if (!isSeeker && !isHelper) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parseResult = CreateMessageSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message || 'Validation error',
        },
        { status: 422 }
      );
    }

    const { text } = parseResult.data;
    let senderId = currentUserId;
    if (process.env.USE_MOCK_DB === 'true' && body && body.senderId) {
      senderId = body.senderId;
    }

    // Create the message subdocument
    const messageId = new mongoose.Types.ObjectId();
    const newMessage = {
      _id: messageId,
      sender: new mongoose.Types.ObjectId(senderId),
      text,
      createdAt: new Date(),
      readBy: [new mongoose.Types.ObjectId(senderId)],
    };

    // Push to chat messages and update the chat timestamp
    chat.messages.push(newMessage as any);
    chat.updatedAt = new Date();
    await chat.save();

    const isSenderSeeker = chat.seeker.toString() === senderId;
    const recipientId = isSenderSeeker ? chat.helper : chat.seeker;

    const senderUser = await User.findById(senderId);
    const senderName = senderUser ? senderUser.name : 'Someone';
    const senderAvatar = senderUser ? senderUser.avatarUrl || '' : '';
    const senderColor = senderUser ? senderUser.avatarColor : '#7C3AED';

    // 1. Create Notification for the recipient
    const notification = await Notification.create({
      recipient: recipientId,
      type: 'message',
      title: `New message from ${senderName}`,
      body: text.length > 60 ? `${text.substring(0, 60)}...` : text,
      meta: {
        chatId,
        messageId: messageId.toString(),
        senderName,
      },
    });

    // 2. Broadcast to the specific Chat room channel
    await broadcastRealtimeEvent(`chat:${chatId}`, 'new_message', {
      messageId: messageId.toString(),
      senderId: senderId,
      senderName,
      senderAvatar,
      senderColor,
      text,
      createdAt: newMessage.createdAt.toISOString(),
    });

    // 3. Broadcast to the recipient's notification channel to alert them
    await broadcastRealtimeEvent(`notifications:${recipientId.toString()}`, 'message', {
      notificationId: notification._id.toString(),
      chatId,
      senderName,
      text: text.length > 40 ? `${text.substring(0, 40)}...` : text,
    });

    return NextResponse.json({ success: true, data: newMessage }, { status: 201 });
  } catch (error: any) {
    console.error('Send chat message error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
