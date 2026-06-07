import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'helpnet_avatars';

    // Fallback if Cloudinary is not configured yet
    if (!cloudName || cloudName.includes('<') || cloudName.trim() === '') {
      console.warn('Cloudinary cloud name is not set. Using generated placeholder initials avatar.');
      // Create a nice placeholder using Dicebear initials
      const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.user.name || 'User')}`;
      return NextResponse.json({ url: fallbackUrl }, { status: 200 });
    }

    // Prepare Cloudinary multipart request
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('upload_preset', uploadPreset);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: cloudinaryFormData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Cloudinary API upload error:', errText);
      return NextResponse.json(
        { success: false, error: 'Failed to upload image to Cloudinary storage' },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ url: data.secure_url }, { status: 200 });
  } catch (error: any) {
    console.error('Upload API route error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
