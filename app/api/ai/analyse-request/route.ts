import { NextRequest, NextResponse } from 'next/server';
import { geminiFlash, callGeminiWithTimeout } from '@/lib/gemini';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { description } = await req.json();
    if (!description || typeof description !== 'string') {
      return NextResponse.json({ success: false, error: 'Description is required' }, { status: 400 });
    }

    const prompt = `You are an assistant for a community help platform.
Analyse this help request and return ONLY a valid JSON object.
No markdown, no explanation, just raw JSON.

Help request: "${description}"

Return exactly:
{
  "title": "Clear 8-word-max summary of what help is needed",
  "category": "One of: Web Dev, Design, Plumbing, Electrician, Teaching, Medical, Legal, Cooking, Carpentry, Mental Health, Music, Finance, Language Translation, Other",
  "urgency": "One of: flexible, today, urgent",
  "urgencyReason": "One sentence explaining urgency choice",
  "keywords": ["array", "of", "5", "relevant", "keywords"],
  "detectedLanguage": "ISO 639-1 language code e.g. en, ta, hi, kn, fr",
  "clarityScore": 5,
  "clarityFeedback": "One actionable sentence telling the user what to add to get better responses",
  "missingInfo": ["array of short strings naming what is missing"]
}

Rules:
- urgency 'urgent' only for danger, severe damage, or medical emergency
- urgency 'today' if needs same-day resolution
- urgency 'flexible' for everything else
- category must be the closest match from the list
- clarityScore: number from 1 to 10. Rules:
  10: Has description, location, urgency context, and enough detail for a helper to act.
  7-9: Has most info, minor details missing.
  4-6: Missing important context like location or timing.
  1-3: Too vague to act on (e.g. "help me" or single word).
- clarityFeedback: If score is 7 or below: one actionable sentence telling the user what to add to get better responses. If score above 7: empty string.
- missingInfo: array of short strings naming what is missing, e.g. 'your location', 'when you need help', 'how urgent this is'. Empty array if score > 7.`;

    let data;
    try {
      const response = await callGeminiWithTimeout(geminiFlash.generateContent(prompt));
      const text = response.response.text();
      
      // Clean up markdown block fences if returned
      let cleaned = text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, '');
        cleaned = cleaned.replace(/\n```$/, '');
      }
      cleaned = cleaned.trim();
      
      data = JSON.parse(cleaned);
    } catch (geminiError) {
      console.error('Gemini Request Analysis API Call failed:', geminiError);
      // Fallback response on failure
      data = {
        title: description.substring(0, 60),
        category: 'Other',
        urgency: 'flexible',
        urgencyReason: 'Could not compute urgency automatically due to API timeout.',
        keywords: ['help'],
        detectedLanguage: 'en',
        clarityScore: 5,
        clarityFeedback: 'Please write a bit more to describe your request.',
        missingInfo: []
      };
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('Analyse request error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
