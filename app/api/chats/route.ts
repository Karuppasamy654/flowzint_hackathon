import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { auth } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const currentUserId = session.user.id;

    // Retrieve chats where current user is seeker or helper
    const chats = await Chat.find({
      $or: [{ seeker: currentUserId }, { helper: currentUserId }],
    })
      .populate('seeker', 'name avatarUrl avatarColor location rating')
      .populate('helper', 'name avatarUrl avatarColor location rating')
      .populate('request', 'title category urgency status')
      .sort({ updatedAt: -1 });

    // Format chat items to include computed properties
    const formattedChats = chats.map((chat: any) => {
      const chatObj = chat.toJSON();
      const messages = chatObj.messages || [];
      const lastMessage = messages[messages.length - 1] || null;

      // Unread count: messages sent by the OTHER party that don't have current user in readBy
      const unreadCount = messages.filter((msg: any) => {
        const isNotSender = msg.sender.toString() !== currentUserId;
        const isNotRead = !msg.readBy.some(
          (readId: any) => readId.toString() === currentUserId
        );
        return isNotSender && isNotRead;
      }).length;

      return {
        _id: chatObj._id,
        request: chatObj.request,
        seeker: chatObj.seeker,
        helper: chatObj.helper,
        status: chatObj.status,
        seekerRating: chatObj.seekerRating,
        seekerFeedback: chatObj.seekerFeedback,
        createdAt: chatObj.createdAt,
        updatedAt: chatObj.updatedAt,
        resolvedAt: chatObj.resolvedAt,
        lastMessage: lastMessage
          ? {
              _id: lastMessage._id,
              sender: lastMessage.sender,
              text: lastMessage.text,
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount,
      };
    });

    return NextResponse.json({ success: true, data: formattedChats }, { status: 200 });
  } catch (error: any) {
    console.error('GET chats index error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
