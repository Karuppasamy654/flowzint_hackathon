import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import HelpRequest from '@/models/HelpRequest';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { SKILL_CATEGORIES } from '@/lib/matching';
import { broadcastRealtimeEvent } from '@/lib/supabase';
import { geminiFlash, callGeminiWithTimeout } from '@/lib/gemini';
export const dynamic = 'force-dynamic';
const CreateRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required').max(300, 'Description is too long (max 300 characters)'),
  category: z.enum(SKILL_CATEGORIES as [string, ...string[]]),
  urgency: z.enum(['flexible', 'today', 'urgent']),
  location: z.string().min(1, 'Location is required'),
  aiTitle: z.string().optional(),
  detectedLanguage: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    const parseResult = CreateRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message || 'Validation error',
        },
        { status: 422 }
      );
    }

    const { title, description, category, urgency, location, aiTitle, detectedLanguage, keywords } = parseResult.data;
    const seekerId = session.user.id;

    // --- STEP 1: Server-side Safety Check (Second Layer) ---
    let safetyResult = { safe: true, category: 'safe', reason: '' };
    try {
      const safetyPrompt = `You are a content moderator for a community help platform where people
ask neighbours for assistance with everyday tasks.

Analyse this help request and return ONLY a JSON object. No markdown.

Request title: "${title}"
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

      const response = await callGeminiWithTimeout(geminiFlash.generateContent(safetyPrompt));
      const text = response.response.text();
      let cleaned = text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, '');
        cleaned = cleaned.replace(/\n```$/, '');
      }
      cleaned = cleaned.trim();
      const safetyObj = JSON.parse(cleaned);
      safetyResult = {
        safe: safetyObj.safe !== false,
        category: safetyObj.category || 'safe',
        reason: safetyObj.reason || '',
      };
    } catch (geminiError) {
      console.error('Gemini server-side safety check failed, failing open:', geminiError);
      safetyResult = { safe: true, category: 'safe', reason: '' };
    }

    if (!safetyResult.safe) {
      return NextResponse.json(
        { success: false, error: safetyResult.reason || 'This request violates our community safety guidelines.' },
        { status: 422 }
      );
    }

    // --- STEP 2: Wide net helpers query ---
    // Find all users whose skills array includes the category OR have a non-empty bio, excluding seeker
    const helpers = await User.find({
      _id: { $ne: seekerId },
      $or: [
        { skills: category },
        { bio: { $exists: true, $ne: '' } }
      ]
    });

    // --- STEP 3: Gemini Matching & Ranking ---
    let matchedHelpersData: { userId: any; score: number; reason: string }[] = [];
    if (helpers.length === 0) {
      // No candidates
      matchedHelpersData = [];
    } else if (helpers.length <= 5) {
      // Use all 5 or fewer candidates directly
      matchedHelpersData = helpers.map((h: any) => ({
        userId: h._id,
        score: 10,
        reason: `Matches category skill: ${category}`
      }));
    } else {
      try {
        const rankingPrompt = `You are matching a help request to the most suitable helpers.

Help request:
Title: "${aiTitle || title}"
Description: "${description}"
Category: "${category}"
Keywords: ${(keywords || []).join(', ')}

Helpers:
${JSON.stringify(helpers.map((h: any) => ({
  id: h._id.toString(),
  skills: h.skills,
  bio: h.bio || '',
  location: h.location,
  rating: h.avgRating || 0
})))}

Return ONLY a JSON array of objects sorted best to worst match:
[{ "id": "helperId", "score": 8, "reason": "One sentence why they match" }]

Only include genuinely relevant helpers. Raw JSON array only, no markdown.`;

        const response = await callGeminiWithTimeout(geminiFlash.generateContent(rankingPrompt));
        const text = response.response.text();
        let cleaned = text.trim();
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, '');
          cleaned = cleaned.replace(/\n```$/, '');
        }
        cleaned = cleaned.trim();
        
        const ranked: { id: string; score: number; reason: string }[] = JSON.parse(cleaned);
        
        matchedHelpersData = ranked
          .map((r: any) => {
            const helperDoc = helpers.find((h: any) => h._id.toString() === r.id);
            if (!helperDoc) return null;
            return {
              userId: helperDoc._id,
              score: Number(r.score),
              reason: r.reason
            };
          })
          .filter(Boolean) as any[];
      } catch (geminiError) {
        console.error('Gemini helper ranking failed, using skills fallback:', geminiError);
        // Fallback: skill-tag matching only, no scores
        matchedHelpersData = helpers
          .filter((h: any) => h.skills.includes(category))
          .map((h: any) => ({
            userId: h._id,
            score: 7,
            reason: `Helper is skilled in ${category}.`
          }));
      }
    }

    // --- STEP 4: Request Translation ---
    const originalLang = detectedLanguage || 'en';
    let translatedTitle = '';
    let translatedDescription = '';

    if (originalLang !== 'en') {
      try {
        const translatePrompt = `Translate the following text to English. Return ONLY a JSON object:
{
  "translatedTitle": "English title",
  "translatedDescription": "English description"
}
No markdown, no explanation.

Title: "${aiTitle || title}"
Description: "${description}"`;

        const response = await callGeminiWithTimeout(geminiFlash.generateContent(translatePrompt));
        const text = response.response.text();
        let cleaned = text.trim();
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, '');
          cleaned = cleaned.replace(/\n```$/, '');
        }
        cleaned = cleaned.trim();
        const transObj = JSON.parse(cleaned);
        translatedTitle = transObj.translatedTitle || title;
        translatedDescription = transObj.translatedDescription || description;
      } catch (geminiError) {
        console.error('Translation during request creation failed:', geminiError);
        translatedTitle = title;
        translatedDescription = description;
      }
    }

    // --- STEP 5: Create Help Request ---
    const helpRequest = await HelpRequest.create({
      seeker: new mongoose.Types.ObjectId(seekerId),
      title,
      description,
      category,
      urgency,
      location,
      matchedHelpers: matchedHelpersData,
      status: 'pending',
      aiTitle: aiTitle || title,
      originalLanguage: originalLang,
      translatedTitle: translatedTitle || undefined,
      translatedDescription: translatedDescription || undefined,
      safetyChecked: true,
      safetyCategory: safetyResult.category,
    });

    const seekerUser = await User.findById(seekerId);
    const seekerName = seekerUser ? seekerUser.name : 'Someone';
    const seekerAvatar = seekerUser ? seekerUser.avatarUrl || '' : '';

    // --- STEP 6: Notification creation & Broadcast ---
    const notificationPromises = matchedHelpersData.map(async (mh) => {
      const helperId = mh.userId.toString();

      // Create Notification doc in MongoDB
      const notification = await Notification.create({
        recipient: new mongoose.Types.ObjectId(helperId),
        type: 'new_match',
        title: 'Someone needs your help!',
        body: `${seekerName} needs help with ${category} near ${location}`,
        meta: {
          requestId: helpRequest._id.toString(),
          aiTitle: aiTitle || title,
          category,
          urgency,
          seekerName,
          seekerAvatar,
          location,
          description,
          originalLanguage: originalLang,
          translatedDescription: translatedDescription || undefined,
        },
      });

      // Broadcast via Supabase
      await broadcastRealtimeEvent(`notifications:${helperId}`, 'new_match', {
        notificationId: notification._id.toString(),
        requestId: helpRequest._id.toString(),
        aiTitle: aiTitle || title,
        category,
        urgency,
        seekerName,
        seekerAvatar,
        location,
        description,
        originalLanguage: originalLang,
        translatedDescription: translatedDescription || undefined,
      });
    });

    await Promise.all(notificationPromises);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...helpRequest.toJSON(),
          matchedHelpersCount: matchedHelpersData.length,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create help request error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    if (!role || (role !== 'seeker' && role !== 'helper')) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid 'role' parameter (must be 'seeker' or 'helper')" },
        { status: 422 }
      );
    }

    await dbConnect();
    const currentUserId = session.user.id;

    const query: Record<string, any> = {};

    if (status) {
      query.status = status;
    }

    if (role === 'seeker') {
      query.seeker = currentUserId;
    } else {
      if (status === 'pending') {
        query.seeker = { $ne: currentUserId };
      } else {
        query.$or = [
          { matchedHelpers: currentUserId },
          { acceptedHelper: currentUserId },
        ];
      }
    }

    const category = searchParams.get('category');
    const locationParam = searchParams.get('location');

    if (category) {
      query.category = category;
    }
    if (locationParam) {
      query.location = { $regex: new RegExp(locationParam, 'i') };
    }

    const requests = await HelpRequest.find(query)
      .populate('seeker', 'name email avatarUrl avatarColor rating location')
      .populate('acceptedHelper', 'name email avatarUrl avatarColor rating location')
      .sort({ createdAt: -1 });

    // ── Skill-based ranking and location-filtering for helper view ──
    if (role === 'helper' && status === 'pending') {
      const currentUser = await User.findById(currentUserId).select('skills location');
      const userSkills: string[] = currentUser?.skills || [];
      const userLocation: string = currentUser?.location || '';

      // Helper to check if a request location is "near by" user location
      const isNearby = (reqLoc: string, userLoc: string) => {
        if (!reqLoc || !userLoc) return true; // Default to true if not defined
        const r = reqLoc.toLowerCase().trim();
        const u = userLoc.toLowerCase().trim();
        
        // Exact match or direct inclusion
        if (r === u || r.includes(u) || u.includes(r)) return true;
        
        // Word token overlap
        const getTokens = (str: string) => {
          return str
            .split(/[\s,.\-\/]+/)
            .map((t) => t.trim())
            .filter((t) => t.length > 2 && !['india', 'usa', 'state', 'district', 'street', 'road', 'near', 'tamil', 'nadu', 'karnataka'].includes(t));
        };
        const rTokens = getTokens(r);
        const uTokens = getTokens(u);
        return rTokens.some((t) => uTokens.includes(t));
      };

      // Filter requests to only show nearby ones
      const nearbyRequests = requests.filter((req: any) => isNearby(req.location || '', userLocation));

      // Helper to check if two skill strings are related
      const isRelated = (reqCategory: string, skills: string[]) => {
        const cat = reqCategory.toLowerCase();
        return skills.some((s) => {
          const sk = s.toLowerCase();
          return sk.includes(cat) || cat.includes(sk);
        });
      };

      const ranked = [...nearbyRequests].map((req: any) => {
        const reqCat = req.category || '';
        if (userSkills.includes(reqCat)) {
          return { ...req.toObject(), _skillRank: 1, _skillLabel: 'exact' };
        } else if (isRelated(reqCat, userSkills) || userSkills.some((s) => reqCat.toLowerCase().includes(s.toLowerCase()))) {
          return { ...req.toObject(), _skillRank: 2, _skillLabel: 'related' };
        } else {
          return { ...req.toObject(), _skillRank: 3, _skillLabel: 'other' };
        }
      });

      // Sort: exact first, then related, then others; within same rank keep newest first
      ranked.sort((a: any, b: any) => {
        if (a._skillRank !== b._skillRank) return a._skillRank - b._skillRank;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      return NextResponse.json({ success: true, data: ranked }, { status: 200 });
    }

    return NextResponse.json({ success: true, data: requests }, { status: 200 });
  } catch (error: any) {
    console.error('List help requests error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
