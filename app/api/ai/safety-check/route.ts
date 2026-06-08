import { NextRequest, NextResponse } from 'next/server';
import { geminiFlash, callGeminiWithTimeout } from '@/lib/gemini';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description } = await req.json();
    if (!description || typeof description !== 'string') {
      return NextResponse.json({ success: false, error: 'Description is required' }, { status: 400 });
    }

    const prompt = `You are a content moderator for a community help platform where people
ask neighbours for assistance with everyday tasks.

Analyse this help request and return ONLY a JSON object. No markdown.

Request title: "${title || ''}"
Request description: "${description}"

Return exactly:
{
  "safe": true,
  "category": "safe",
  "reason": "",
  "suggestion": ""
}

Replace default values. Category must be one of: safe, harassment, illegal_activity, dangerous, privacy_violation, hate_speech, scam, other_violation.
"reason" must be a friendly but firm one-sentence explanation written directly to the user if not safe.
"suggestion" must be one sentence advising how to rephrase legitimately if not safe.

Flag as NOT safe if the request:
- Asks for help with illegal activities (breaking in, theft, fraud, drugs)
- Contains harassment, threats, or targeting of a specific person
- Requests dangerous or harmful actions
- Contains hate speech or discrimination
- Is clearly a scam or attempts to exploit helpers
- Violates anyone's privacy or safety

Do NOT flag:
- Legitimate home repair, medical, legal, financial, or personal help
- Requests that mention sensitive topics legitimately (e.g. mental health support)
- Anything that is a genuine community help request even if unusual
- Requests in any language — translate mentally before judging`;

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
      console.error('Gemini Safety Check API Call failed:', geminiError);
      // Fallback response on failure (fail open)
      data = {
        safe: true,
        category: 'safe',
        reason: '',
        suggestion: ''
      };
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('Safety check route error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
