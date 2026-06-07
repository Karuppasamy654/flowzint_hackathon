import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import HelpRequest from '@/models/HelpRequest';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const UpdateRequestSchema = z.object({
  status: z.enum(['cancelled', 'completed', 'expired']),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const helpRequest = await HelpRequest.findById(params.id)
      .populate('seeker', 'name email avatarUrl avatarColor rating bio location')
      .populate('acceptedHelper', 'name email avatarUrl avatarColor rating bio location')
      .populate('matchedHelpers', 'name email avatarUrl avatarColor rating bio location');

    if (!helpRequest) {
      return NextResponse.json(
        { success: false, error: 'Help request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: helpRequest }, { status: 200 });
  } catch (error: any) {
    console.error('GET help request details error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const helpRequest = await HelpRequest.findById(params.id);

    if (!helpRequest) {
      return NextResponse.json(
        { success: false, error: 'Help request not found' },
        { status: 404 }
      );
    }

    // Auth check: must be seeker
    if (helpRequest.seeker.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parseResult = UpdateRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message || 'Validation error',
        },
        { status: 422 }
      );
    }

    const { status } = parseResult.data;

    // A seeker can cancel a request only if it is still pending
    if (status === 'cancelled') {
      if (helpRequest.status !== 'pending') {
        return NextResponse.json(
          { success: false, error: 'Can only cancel pending requests' },
          { status: 400 }
        );
      }
      helpRequest.status = 'cancelled';
    } else {
      // Allow other status modifications if needed, but restrict appropriately
      helpRequest.status = status;
    }

    await helpRequest.save();

    return NextResponse.json({ success: true, data: helpRequest }, { status: 200 });
  } catch (error: any) {
    console.error('PATCH help request status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
