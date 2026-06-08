import { NextRequest, NextResponse } from 'next/server';
import { geminiFlash, callGeminiWithTimeout } from '@/lib/gemini';
import { auth } from '@/lib/auth';

interface ChatMessageContext {
  sender: 'me' | 'them';
  text: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { chatContext, requestTitle, requestDescription, myRole } = await req.json();

    if (!Array.isArray(chatContext)) {
      return NextResponse.json({ success: false, error: 'chatContext array is required' }, { status: 400 });
    }

    const contextStr = chatContext
      .map((m: ChatMessageContext) => `${m.sender === 'me' ? 'Me' : 'Them'}: ${m.text}`)
      .join('\n');

    const prompt = `You are helping someone reply in a community help chat.
The chat is about: "${requestTitle || ''}"
Original request: "${requestDescription || ''}"
This user is the: ${myRole || 'seeker'}

Recent conversation:
${contextStr}

Generate exactly 3 short natural reply suggestions for the ${myRole || 'seeker'}.
Each under 10 words. Conversational and context-aware.
Return ONLY a JSON array of 3 strings. No markdown.
Example: ["Sure, I can come today!", "What time works for you?", "Thanks!"]`;

    let data;
    try {
      const response = await callGeminiWithTimeout(geminiFlash.generateContent(prompt));
      const text = response.response.text();
      
      let cleaned = text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, '');
        cleaned = cleaned.replace(/\n```$/, '');
      }
      cleaned = cleaned.trim();
      
      data = JSON.parse(cleaned);
    } catch (geminiError) {
      console.error('Gemini Suggest Replies API Call failed:', geminiError);
      data = [];
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('Suggest replies route error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
