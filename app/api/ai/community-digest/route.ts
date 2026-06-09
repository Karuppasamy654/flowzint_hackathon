import { NextRequest, NextResponse } from 'next/server';
import { geminiFlash, callGeminiWithTimeout } from '@/lib/gemini';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import HelpRequest from '@/models/HelpRequest';
import Chat from '@/models/Chat';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Gather last 7 days of data
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      newRequests,
      resolvedThisWeek,
      topCategories,
      newMembers,
    ] = await Promise.all([
      HelpRequest.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Chat.countDocuments({ status: 'resolved', resolvedAt: { $gte: sevenDaysAgo } }),
      HelpRequest.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 3 },
      ]),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo }, isBot: false }),
    ]);

    const topCatsText = topCategories.map((c: any) => `${c._id}(${c.count})`).join(', ') || 'various categories';

    let parsed;
    try {
      const prompt = `You are writing a warm, engaging weekly community digest for HelpNet — a peer-to-peer neighbourhood help platform. Write 3 short sentences (a paragraph) that feel like a proud community manager celebrating the week's wins. Be specific with the numbers.

This week's stats:
- New help requests posted: ${newRequests}
- Requests successfully resolved: ${resolvedThisWeek}
- Most-needed categories: ${topCatsText}
- New members who joined: ${newMembers}

Return ONLY valid JSON (no markdown):
{
  "headline": "A short punchy headline under 8 words",
  "body": "The 3-sentence warm community digest paragraph",
  "emoji": "A single relevant emoji"
}`;

      const response = await callGeminiWithTimeout(geminiFlash.generateContent(prompt), 7000);
      let text = response.response.text().trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
      }

      parsed = JSON.parse(text.trim());
    } catch (geminiError) {
      console.error('Community digest Gemini call failed, using fallback:', geminiError);
      // Fallback response when Gemini is unavailable
      parsed = {
        headline: 'Your Community This Week',
        body: `This week saw ${newRequests} new help requests from neighbours, with ${resolvedThisWeek} requests successfully resolved. ${newMembers > 0 ? `We also welcomed ${newMembers} new members to our community!` : 'The community continues to grow stronger together.'} Top categories include ${topCatsText} — keep helping each other!`,
        emoji: '🏘️',
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        ...parsed,
        stats: { newRequests, resolvedThisWeek, newMembers },
        generatedAt: new Date().toISOString(),
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Community digest error:', error);
    return NextResponse.json({ success: false, error: 'Could not generate digest' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
