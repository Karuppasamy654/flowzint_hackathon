import { NextRequest, NextResponse } from 'next/server';
import { geminiFlash, callGeminiWithTimeout } from '@/lib/gemini';
import { auth } from '@/lib/auth';
import { SKILL_CATEGORIES } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { bio, name } = await req.json();
    if (!bio || typeof bio !== 'string') {
      return NextResponse.json({ success: false, error: 'Bio is required' }, { status: 400 });
    }

    const validCategories = SKILL_CATEGORIES.join(', ');

    const prompt = `Based on this person's bio/profession, suggest exactly 3 skill categories they could offer as a helper on HelpNet, a community help platform.

Person: "${name || 'User'}"
Bio/Profession: "${bio}"

Available categories: ${validCategories}

Return ONLY valid JSON:
{
  "suggestions": [
    { "skill": "Category Name", "reason": "One sentence why this fits them" },
    { "skill": "Category Name", "reason": "One sentence why this fits them" },
    { "skill": "Category Name", "reason": "One sentence why this fits them" }
  ]
}

Each "skill" must be an EXACT match from the available categories list.`;

    let data;
    try {
      const response = await callGeminiWithTimeout(geminiFlash.generateContent(prompt), 8000);
      const text = response.response.text();
      let cleaned = text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
      }
      data = JSON.parse(cleaned.trim());
      // Validate that suggested skills exist in the list
      data.suggestions = (data.suggestions || []).filter(
        (s: any) => SKILL_CATEGORIES.includes(s.skill)
      ).slice(0, 3);
    } catch (err) {
      data = { suggestions: [] };
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('Skill suggest error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
