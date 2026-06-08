import { NextRequest, NextResponse } from 'next/server';
import { geminiFlash, callGeminiWithTimeout } from '@/lib/gemini';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { text, fromLang, toLang } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 });
    }
    if (!fromLang || !toLang) {
      return NextResponse.json({ success: false, error: 'fromLang and toLang are required' }, { status: 400 });
    }

    if (fromLang.toLowerCase().trim() === toLang.toLowerCase().trim()) {
      return NextResponse.json({ success: true, data: text }, { status: 200 });
    }

    const prompt = `Translate this text from ${fromLang} to ${toLang}.
Return ONLY the translated text, nothing else. No quotes, no explanation.
Text: "${text}"`;

    let data;
    try {
      const response = await callGeminiWithTimeout(geminiFlash.generateContent(prompt));
      const responseText = response.response.text();
      data = responseText.trim();
    } catch (geminiError) {
      console.error('Gemini Translate Message API Call failed:', geminiError);
      data = text; // fallback to original text
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('Translate message route error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
