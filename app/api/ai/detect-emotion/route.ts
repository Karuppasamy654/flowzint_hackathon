import { NextRequest, NextResponse } from 'next/server';
import { geminiFlash, callGeminiWithTimeout } from '@/lib/gemini';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ success: true, data: { emotion: 'neutral', intensity: 0 } }, { status: 200 });
    }

    // Only analyze the last 3 messages from the seeker
    const recentText = messages
      .slice(-3)
      .map((m: any) => m.text)
      .join(' | ');

    const prompt = `Analyze the emotional tone of this message(s) from someone seeking help:
"${recentText}"

Return ONLY valid JSON, no markdown:
{
  "emotion": "stressed" | "frustrated" | "urgent" | "grateful" | "neutral",
  "intensity": 0-10,
  "helperTip": "One short empathetic action the helper can take (max 15 words). Empty string if neutral/grateful."
}

Only flag stressed/frustrated/urgent if clearly evident. Default to neutral.`;

    let data;
    try {
      const response = await callGeminiWithTimeout(geminiFlash.generateContent(prompt), 5000);
      const text = response.response.text();
      let cleaned = text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
      }
      data = JSON.parse(cleaned.trim());
    } catch (err) {
      data = { emotion: 'neutral', intensity: 0, helperTip: '' };
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('Detect emotion error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
