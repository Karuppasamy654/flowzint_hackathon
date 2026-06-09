import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import HelpRequest from '@/models/HelpRequest';
import Chat from '@/models/Chat';
import User from '@/models/User';
import { geminiFlash, callGeminiWithTimeout } from '@/lib/gemini';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Aggregate platform stats
    const [
      totalRequests,
      completedRequests,
      activeRequests,
      totalUsers,
      avgRatingResult,
      categoryBreakdown,
      recentResolutions,
    ] = await Promise.all([
      HelpRequest.countDocuments({}),
      HelpRequest.countDocuments({ status: 'completed' }),
      HelpRequest.countDocuments({ status: 'active' }),
      User.countDocuments({ isBot: false, isDemo: false }),
      Chat.aggregate([
        { $match: { status: 'resolved', seekerRating: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$seekerRating' }, count: { $sum: 1 } } },
      ]),
      HelpRequest.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      Chat.find({ status: 'resolved' })
        .sort({ resolvedAt: -1 })
        .limit(5)
        .populate('seeker', 'name avatarUrl avatarColor')
        .populate('helper', 'name avatarUrl avatarColor')
        .populate('request', 'title category'),
    ]);

    const avgRating = avgRatingResult[0]?.avg || 0;
    const ratingCount = avgRatingResult[0]?.count || 0;
    const successRate = totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 0;

    // Generate AI narrative summary using Gemini
    let aiSummary = '';
    try {
      const statsText = `Platform has ${totalUsers} members, ${totalRequests} total help requests, ${completedRequests} completed (${successRate}% success rate), ${activeRequests} ongoing right now, average helper rating ${avgRating.toFixed(1)}/5 from ${ratingCount} reviews. Top categories: ${categoryBreakdown.map((c: any) => `${c._id}(${c.count})`).join(', ')}.`;
      
      const prompt = `You are writing a 2-sentence "platform health" insight for HelpNet, a community help platform. Write warmly, like a proud founder sharing good news. Use the stats below. Be specific with numbers.

Stats: ${statsText}

Return ONLY valid JSON:
{"summary": "Two sentence narrative here.", "sentiment": "positive" | "growing" | "steady"}`;

      const response = await callGeminiWithTimeout(geminiFlash.generateContent(prompt), 6000);
      const text = response.response.text();
      let cleaned = text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
      }
      const parsed = JSON.parse(cleaned.trim());
      aiSummary = parsed.summary || '';
    } catch (err) {
      aiSummary = `HelpNet has connected ${totalUsers} community members through ${completedRequests} successful help exchanges. The platform maintains a ${successRate}% resolution rate with helpers rated ${avgRating.toFixed(1)}/5 on average.`;
    }

    return NextResponse.json({
      success: true,
      data: {
        totalRequests,
        completedRequests,
        activeRequests,
        totalUsers,
        avgRating: parseFloat(avgRating.toFixed(1)),
        ratingCount,
        successRate,
        categoryBreakdown,
        recentResolutions: recentResolutions.map((chat: any) => ({
          id: chat._id.toString(),
          seekerName: chat.seeker?.name || 'Anonymous',
          helperName: chat.helper?.name || 'Anonymous',
          seekerAvatar: chat.seeker?.avatarUrl,
          seekerColor: chat.seeker?.avatarColor,
          helperAvatar: chat.helper?.avatarUrl,
          helperColor: chat.helper?.avatarColor,
          requestTitle: chat.request?.title || 'Help Request',
          category: chat.request?.category,
          rating: chat.seekerRating,
          resolvedAt: chat.resolvedAt,
        })),
        aiSummary,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Insights error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
