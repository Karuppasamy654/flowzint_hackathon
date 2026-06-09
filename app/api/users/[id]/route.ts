import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { SKILL_CATEGORIES } from '@/lib/matching';

const UpdateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  bio: z.string().max(120, 'Bio must be at most 120 characters').optional().nullable(),
  location: z.string().min(1, 'Location is required').optional(),
  skills: z.array(z.enum(SKILL_CATEGORIES as [string, ...string[]])).max(5, 'Pick up to 5 skills').optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.string().length(0)),
  preferredLanguage: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const user = await User.findById(params.id).select('-passwordHash');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Since toJSON virtuals are configured, user.avgRating is included automatically.
    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error: any) {
    console.error('GET User profile error:', error);
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
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Authorisation check: must be own profile
    if (session.user.id !== params.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    await dbConnect();
    const body = await req.json();

    const parseResult = UpdateProfileSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message || 'Validation error',
        },
        { status: 422 }
      );
    }

    const { name, bio, location, skills, avatarUrl, preferredLanguage } = parseResult.data;

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio || undefined;
    if (location !== undefined) user.location = location;
    if (skills !== undefined) user.skills = skills;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl || undefined;
    if (preferredLanguage !== undefined) user.preferredLanguage = preferredLanguage;

    await user.save();

    const updatedUserResponse = await User.findById(params.id).select('-passwordHash');

    return NextResponse.json(
      { success: true, data: updatedUserResponse },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('PATCH User profile error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
