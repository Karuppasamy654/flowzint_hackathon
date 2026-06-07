import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import HelpRequest from '@/models/HelpRequest';
import Chat from '@/models/Chat';
import User from '@/models/User';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const currentUserId = session.user.id;
    const body = await req.json();
    const { helperId, category } = body;

    if (!helperId || !category) {
      return NextResponse.json({ success: false, error: 'Missing helperId or category' }, { status: 400 });
    }

    // 1. Verify helper exists
    const helper = await User.findById(helperId);
    if (!helper) {
      return NextResponse.json({ success: false, error: 'Helper not found' }, { status: 404 });
    }

    // 2. Check if a direct active chat already exists between them for this request/category
    const existingChat = await Chat.findOne({
      seeker: new mongoose.Types.ObjectId(currentUserId),
      helper: new mongoose.Types.ObjectId(helperId),
      status: 'active',
    });

    if (existingChat) {
      return NextResponse.json({ success: true, chatId: existingChat._id.toString() }, { status: 200 });
    }

    // 3. Create a simulated active HelpRequest to satisfy schema references
    const helpRequest = await HelpRequest.create({
      seeker: new mongoose.Types.ObjectId(currentUserId),
      title: `Direct connection: ${category}`,
      description: `Direct conversation initiated via the Help Assistant.`,
      category,
      urgency: 'flexible',
      location: helper.location || 'Nearby',
      status: 'active',
      acceptedHelper: new mongoose.Types.ObjectId(helperId),
      acceptedAt: new Date(),
    });

    // 4. Create the Chat document
    const chat = await Chat.create({
      request: helpRequest._id,
      seeker: new mongoose.Types.ObjectId(currentUserId),
      helper: new mongoose.Types.ObjectId(helperId),
      messages: [],
      status: 'active',
    });

    return NextResponse.json({ success: true, chatId: chat._id.toString() }, { status: 201 });
  } catch (error: any) {
    console.error('Direct chat creation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
