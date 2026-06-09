import { NextRequest, NextResponse } from 'next/server';
import { geminiFlash, callGeminiWithTimeout } from '@/lib/gemini';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { description, title, category } = await req.json();
    if (!description || typeof description !== 'string') {
      return NextResponse.json({ success: false, error: 'Description is required' }, { status: 400 });
    }

    const prompt = `You are an expert at writing clear, compelling help requests for a community platform called HelpNet.

A user wrote this help request:
Title: "${title || 'Untitled'}"
Category: "${category || 'General'}"
Description: "${description}"

Rewrite the description to be:
1. Clear and specific about what help is needed
2. Mentioning any relevant context (time constraints, skill level needed, etc.)
3. Friendly and respectful in tone
4. Between 50-200 characters
5. Natural, first-person voice

Return ONLY a valid JSON object, no markdown:
{
  "enhanced": "The improved description text here",
  "improvements": ["Short bullet: what was improved", "Another improvement"],
  "clarityGain": 3
}

clarityGain is how many clarity score points the rewrite adds (1-5).
improvements: max 3 short strings explaining what changed.`;

    let data;
    try {
      const response = await callGeminiWithTimeout(geminiFlash.generateContent(prompt), 8000);
      const text = response.response.text();
      let cleaned = text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
      }
      data = JSON.parse(cleaned.trim());
    } catch (err) {
      // Fallback: simple improvement
      data = {
        enhanced: description.trim() + ' Any help would be greatly appreciated.',
        improvements: ['Added polite closing', 'Cleaned up formatting'],
        clarityGain: 1,
      };
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('Enhance request error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
