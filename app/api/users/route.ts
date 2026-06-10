import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { SKILL_CATEGORIES } from '@/lib/matching';

const AVATAR_COLORS = [
  '#7C3AED',
  '#0F766E',
  '#B45309',
  '#1D4ED8',
  '#9D174D',
  '#065F46',
  '#C2410C',
  '#1A7F5A',
];

const SignupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  skills: z.array(z.enum(SKILL_CATEGORIES as [string, ...string[]])).max(5, 'Pick up to 5 skills'),
  location: z.string().min(1, 'Location is required'),
  bio: z.string().max(120, 'Bio must be at most 120 characters').optional(),
  avatarColor: z.enum(AVATAR_COLORS as [string, ...string[]]),
  preferredLanguage: z.string().optional(),
});

export async function POST(req: NextRequest) {
  console.log('DEBUG: Enter POST /api/users');
  console.log('DEBUG MONGODB_URI (pre-connection):', process.env.MONGODB_URI);

  try {
    await dbConnect();
    console.log('DEBUG: dbConnect succeeded');
  } catch (connErr) {
    console.error('DEBUG: dbConnect failed', connErr);
    return NextResponse.json(
      {
        success: false,
        error: 'Database connection failed',
        details: (connErr as any).message || String(connErr),
      },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();

    // Validate body
    const parseResult = SignupSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message || 'Validation error',
        },
        { status: 422 }
      );
    }

    const { name, email, password, skills, location, bio, avatarColor, preferredLanguage } = parseResult.data;

    // Check email uniqueness
    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 422 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Save user
    let user;
    try {
      user = await User.create({
        name,
        email: normalizedEmail,
        passwordHash,
        skills,
        location,
        bio,
        avatarColor,
        preferredLanguage: preferredLanguage || 'en',
      });
    } catch (createErr: any) {
      if (createErr.name === 'ValidationError') {
        return NextResponse.json({ success: false, error: createErr.message || 'Validation error' }, { status: 422 });
      }
      throw createErr; // rethrow for outer catch
    }

    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      skills: user.skills,
      location: user.location,
      bio: user.bio,
      avatarColor: user.avatarColor,
      rating: user.rating,
      createdAt: user.createdAt,
    };

    return NextResponse.json({ success: true, data: userResponse }, { status: 201 });
  } catch (error: any) {
    console.error('Signup API Error:', error);
    // Duplicate key error (e.g., email already exists)
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Duplicate entry error', details: error.message },
        { status: 422 }
      );
    }
    // MongoServerError or other DB errors
    if (error.name === 'MongoServerError') {
      return NextResponse.json(
        { success: false, error: 'Database connection error', details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error', details: error.stack },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const skill = searchParams.get('skill');
    const location = searchParams.get('location');
    const search = searchParams.get('q') || searchParams.get('name');

    const filter: any = {};
    if (skill) {
      filter.skills = skill;
    }
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).select('-passwordHash');
    return NextResponse.json({ success: true, data: users }, { status: 200 });
  } catch (error: any) {
    console.error('Search Users API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
