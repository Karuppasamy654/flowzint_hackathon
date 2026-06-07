import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import HelpRequest from '@/models/HelpRequest';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { SKILL_CATEGORIES, findMatchingHelpers } from '@/lib/matching';
import { broadcastRealtimeEvent } from '@/lib/supabase';

const CreateRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required').max(300, 'Description is too long (max 300 characters)'),
  category: z.enum(SKILL_CATEGORIES as [string, ...string[]]),
  urgency: z.enum(['flexible', 'today', 'urgent']),
  location: z.string().min(1, 'Location is required'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    const parseResult = CreateRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message || 'Validation error',
        },
        { status: 422 }
      );
    }

    const { title, description, category, urgency, location } = parseResult.data;
    const seekerId = session.user.id;

    // 1. Run the matching algorithm
    const matchedHelpers = await findMatchingHelpers(category, seekerId, 20);
    const matchedHelperIds = matchedHelpers.map((h) => h._id);

    // 2. Create the HelpRequest
    const helpRequest = await HelpRequest.create({
      seeker: new mongoose.Types.ObjectId(seekerId),
      title,
      description,
      category,
      urgency,
      location,
      matchedHelpers: matchedHelperIds,
      status: 'pending',
    });

    const seekerUser = await User.findById(seekerId);
    const seekerName = seekerUser ? seekerUser.name : 'Someone';

    // 3. Create Notification documents & broadcast to each helper in parallel
    const notificationPromises = matchedHelpers.map(async (helper) => {
      const helperId = helper._id.toString();

      // Create Notification doc
      const notification = await Notification.create({
        recipient: new mongoose.Types.ObjectId(helperId),
        type: 'new_match',
        title: 'Someone needs your help!',
        body: `${seekerName} needs help with ${category} near ${location}`,
        meta: {
          requestId: helpRequest._id.toString(),
        },
      });

      // Broadcast event via Supabase
      await broadcastRealtimeEvent(`notifications:${helperId}`, 'new_match', {
        notificationId: notification._id.toString(),
        requestId: helpRequest._id.toString(),
        seekerName,
        category,
        urgency,
      });
    });

    await Promise.all(notificationPromises);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...helpRequest.toJSON(),
          matchedHelpersCount: matchedHelperIds.length,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create help request error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role'); // seeker | helper
    const status = searchParams.get('status'); // pending | active | completed | cancelled | expired

    if (!role || (role !== 'seeker' && role !== 'helper')) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid 'role' parameter (must be 'seeker' or 'helper')" },
        { status: 422 }
      );
    }

    await dbConnect();
    const currentUserId = session.user.id;

    const query: Record<string, any> = {};

    if (status) {
      query.status = status;
    }

    if (role === 'seeker') {
      query.seeker = currentUserId;
    } else {
      // helper role: show all pending requests in community (except helper's own)
      if (status === 'pending') {
        query.seeker = { $ne: currentUserId };
      } else {
        query.$or = [
          { matchedHelpers: currentUserId },
          { acceptedHelper: currentUserId },
        ];
      }
    }

    const category = searchParams.get('category');
    const locationParam = searchParams.get('location');

    if (category) {
      query.category = category;
    }
    if (locationParam) {
      query.location = { $regex: new RegExp(locationParam, 'i') };
    }

    const requests = await HelpRequest.find(query)
      .populate('seeker', 'name email avatarUrl avatarColor rating location')
      .populate('acceptedHelper', 'name email avatarUrl avatarColor rating location')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: requests }, { status: 200 });
  } catch (error: any) {
    console.error('List help requests error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
