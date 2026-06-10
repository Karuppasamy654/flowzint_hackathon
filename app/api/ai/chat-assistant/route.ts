import { NextRequest, NextResponse } from 'next/server';
import { genAI } from '@/lib/gemini';
import { auth } from '@/lib/auth';
import User from '@/models/User';
import HelpRequest from '@/models/HelpRequest';
import dbConnect from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const { messages, userContext } = await req.json();

    let replyText: string;

    try {
      // Gather live platform data for context
      const platformContext = await gatherPlatformContext(messages);

      const systemInstruction = `
You are HelpNet AI, a friendly and helpful assistant for the HelpNet
community platform — a place where people help each other with everyday
tasks and skills.

Your personality: warm, patient, encouraging, and practical. Like a
knowledgeable friend, not a corporate bot. Use natural conversational
language. Keep responses concise — 2 to 4 sentences unless more detail
is genuinely needed. Never use bullet points unless the user asks for a list.

What you can help with:
- Explaining how HelpNet works (requesting help, accepting requests, chat)
- Helping the user write a clearer, better help request
- Finding helpers with specific skills (search users by skill)
- Finding help requests that need helpers (search open requests)
- Giving advice or guidance on their specific problem while they wait for a helper
- Answering general knowledge questions
- Offering a kind, supportive response if the user seems stressed or upset
- Suggesting what skills to add to their profile
- Any general question the user has

What you must NOT do:
- Never pretend to be a human
- Never make up information about the platform that contradicts how it works
- Never give dangerous medical, legal, or financial advice — always recommend
  a professional for serious matters
- Never be dismissive or tell the user you "can't help with that"
  — always try to be useful in some way

Current user context:
Name: ${userContext?.name || user.name}
Skills: ${userContext?.skills?.join(', ') || user.skills?.join(', ') || 'not set yet'}
Has active help request: ${userContext?.hasActiveRequest ? 'Yes' : 'No'}
Has active chat with a helper: ${userContext?.hasActiveChat ? 'Yes' : 'No'}

${platformContext}

Use this context to personalise responses where relevant. When the user asks
about available helpers or open requests, use the live data provided above
to give specific, real answers with names and details.
`;

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction });

      const formattedHistory = messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: m.parts,
      }));
      
      const latestMessage = messages[messages.length - 1];

      const chat = model.startChat({
        history: formattedHistory
      });

      const result = await chat.sendMessage(latestMessage.parts[0].text);
      replyText = result.response.text();
    } catch (geminiError) {
      console.error('Chat Assistant Gemini call failed, using fallback:', geminiError);
      const latestMessage = messages[messages.length - 1];
      const userText = latestMessage?.parts?.[0]?.text || '';
      const userName = userContext?.name || user?.name || '';
      replyText = await getFallbackReply(userText, userName);
    }

    return NextResponse.json({ success: true, reply: replyText }, { status: 200 });
  } catch (error: any) {
    console.error('Chat Assistant error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// ── Gather live platform data for Gemini context ───────────────────────
async function gatherPlatformContext(messages: any[]): Promise<string> {
  const latestText = messages[messages.length - 1]?.parts?.[0]?.text?.toLowerCase() || '';
  const parts: string[] = [];

  try {
    // If user is searching for helpers or asking about people with skills
    if (/helper|who can|find.*someone|search.*skill|someone.*help|expert|specialist|available|skilled/i.test(latestText)) {
      const helpers = await User.find({ isBot: false }).sort({ 'rating.total': -1 }).limit(20);
      if (helpers && helpers.length > 0) {
        const helperList = helpers.map((h: any) => {
          const rating = h.rating?.count > 0 ? `${(h.rating.total / h.rating.count).toFixed(1)}/5` : 'new';
          return `- ${h.name} (${h.location || 'unknown location'}): Skills: [${(h.skills || []).join(', ') || 'none listed'}], Rating: ${rating}`;
        }).join('\n');
        parts.push(`LIVE DATA — Community members who can help:\n${helperList}`);
      }
    }

    // If user is asking about a specific person by name
    const nameMatch = latestText.match(/(?:tell me about|who is|find user|show me|info about|profile of|about)\s+([a-z][a-z\s]{1,30}?)(?:\?|$|,|\s+on helpnet)/i)
      || latestText.match(/(?:is|does)\s+([a-z][a-z\s]{1,20}?)\s+(?:on|in|a member|registered|signed up)/i);
    if (nameMatch) {
      const searchName = nameMatch[1].trim();
      const foundUser = await User.findOne({ name: { $regex: searchName, $options: 'i' } });
      if (foundUser) {
        const rating = foundUser.rating?.count > 0 ? `${(foundUser.rating.total / foundUser.rating.count).toFixed(1)}/5 from ${foundUser.rating.count} reviews` : 'no ratings yet';
        parts.push(`LIVE DATA — User profile found:\nName: ${foundUser.name}\nLocation: ${foundUser.location || 'not set'}\nSkills: ${(foundUser.skills || []).join(', ') || 'none listed'}\nRating: ${rating}\nBio: ${foundUser.bio || 'no bio'}\nMember since: ${foundUser.createdAt ? new Date(foundUser.createdAt).toLocaleDateString() : 'unknown'}`);
      } else {
        parts.push(`LIVE DATA — No user found with name matching "${searchName}".`);
      }
    }

    // If user is asking about open/active requests
    if (/request|open.*request|pending|need.*help|who needs|available.*task|browse|looking for|wants help|people need/i.test(latestText)) {
      const openRequests = await HelpRequest.find({ status: { $in: ['pending', 'active'] } })
        .populate('seeker')
        .sort({ createdAt: -1 })
        .limit(15);
      if (openRequests && openRequests.length > 0) {
        const reqList = openRequests.map((r: any) => {
          const seekerName = r.seeker?.name || 'Anonymous';
          const urgencyEmoji = r.urgency === 'urgent' ? '🔴' : r.urgency === 'today' ? '🟡' : '🟢';
          return `${urgencyEmoji} "${r.title}" (${r.category}, ${r.urgency}) by ${seekerName} in ${r.location} — ${r.description?.substring(0, 80)}${r.description?.length > 80 ? '...' : ''}`;
        }).join('\n');
        parts.push(`LIVE DATA — Open help requests (people who need help):\n${reqList}`);
      }
    }

    // General stats for any conversation
    const [totalUsers, totalRequests, pendingRequests, completedRequests] = await Promise.all([
      User.countDocuments({ isBot: false }),
      HelpRequest.countDocuments({}),
      HelpRequest.countDocuments({ status: 'pending' }),
      HelpRequest.countDocuments({ status: 'completed' }),
    ]);
    parts.push(`Platform stats: ${totalUsers} members, ${totalRequests} total requests, ${pendingRequests} currently pending, ${completedRequests} successfully completed.`);
  } catch (err) {
    console.error('Error gathering platform context:', err);
  }

  return parts.join('\n\n');
}

// ── Smart fallback with database search ────────────────────────────────
async function getFallbackReply(userText: string, userName: string): Promise<string> {
  const lower = userText.toLowerCase();

  // ── Search for helpers by skill ──
  const findHelperMatch = lower.match(/(?:find|search|who|any|need|looking for|know).*(?:helper|someone|person|expert|specialist|people).*(?:with|for|in|who knows|skilled in|good at)\s+(.+)/i)
    || lower.match(/(?:find|search|who|any).*(?:can help|helps?).*(?:with|for|in)\s+(.+)/i)
    || lower.match(/(?:who|anyone).*(?:knows?|skilled|good at|expert)\s+(.+)/i)
    || lower.match(/(?:i need|looking for)\s+(?:a\s+)?(.+?)(?:\s+helper|\s+expert|\s+specialist|\s+person)?$/i);

  if (findHelperMatch && /helper|someone|person|expert|who|find|search|specialist|skilled|good at|knows/i.test(lower)) {
    const searchTerm = findHelperMatch[1]?.trim().replace(/[?.!]/g, '');
    if (searchTerm && searchTerm.length > 1) {
      try {
        const allUsers = await User.find({ isBot: false });
        const matched = (allUsers || []).filter((u: any) => {
          const skills = (u.skills || []).map((s: string) => s.toLowerCase());
          const name = (u.name || '').toLowerCase();
          const searchLower = searchTerm.toLowerCase();
          return skills.some((s: string) => s.includes(searchLower) || searchLower.includes(s))
            || name.includes(searchLower);
        });

        if (matched.length > 0) {
          const list = matched.slice(0, 5).map((u: any) => {
            const rating = u.rating?.count > 0 ? `⭐ ${(u.rating.total / u.rating.count).toFixed(1)}/5` : '🆕 new';
            return `• ${u.name} — Skills: ${(u.skills || []).join(', ')} (${rating}, ${u.location || 'unknown location'})`;
          }).join('\n');
          return `I found ${matched.length} helper${matched.length > 1 ? 's' : ''} matching "${searchTerm}":\n\n${list}\n\nYou can post a help request and they'll be notified automatically!`;
        } else {
          return `I couldn't find helpers with "${searchTerm}" skills right now, but don't worry! Post a help request and community members will be notified. Someone with the right skills may see it soon.`;
        }
      } catch (err) {
        console.error('Helper search error:', err);
      }
    }
  }

  // ── Look up a specific user by name ──
  const userLookupMatch = lower.match(/(?:tell me about|who is|find user|show me|info about|profile of)\s+([a-z][a-z\s]{1,30}?)(?:\?|$|,)/i)
    || lower.match(/(?:is|does)\s+([a-z][a-z\s]{1,20}?)\s+(?:on|in|a member|registered)/i);
  if (userLookupMatch) {
    const searchName = userLookupMatch[1].trim();
    try {
      const foundUser = await User.findOne({ name: { $regex: searchName, $options: 'i' } });
      if (foundUser) {
        const rating = foundUser.rating?.count > 0
          ? `⭐ ${(foundUser.rating.total / foundUser.rating.count).toFixed(1)}/5 (${foundUser.rating.count} reviews)`
          : '🆕 New member, no ratings yet';
        return `Here's what I found about **${foundUser.name}**:\n\n📍 Location: ${foundUser.location || 'not set'}\n🛠️ Skills: ${(foundUser.skills || []).join(', ') || 'none listed'}\n${rating}\n📝 Bio: ${foundUser.bio || 'No bio yet'}\n📅 Member since: ${foundUser.createdAt ? new Date(foundUser.createdAt).toLocaleDateString() : 'unknown'}\n\nYou can connect with ${foundUser.name.split(' ')[0]} by posting a help request that matches their skills!`;
      } else {
        return `I couldn't find a user named "${searchName}" on HelpNet. They might not be registered yet, or the name might be spelled differently. Try the exact username or browse community members on the platform.`;
      }
    } catch (err) {
      console.error('User lookup error:', err);
    }
  }

  if (/(?:open|pending|active|available).*request/i.test(lower)
    || /who needs help/i.test(lower)
    || /(?:browse|show|list|see).*request/i.test(lower)
    || /(?:what|any).*(?:request|task|people need)/i.test(lower)
    || /i want to help/i.test(lower)
    || /how can i help/i.test(lower)) {
    try {
      const openRequests = await HelpRequest.find({ status: { $in: ['pending', 'active'] } })
        .populate('seeker')
        .sort({ createdAt: -1 })
        .limit(10);

      if (openRequests && openRequests.length > 0) {
        const list = openRequests.map((r: any) => {
          const seekerName = r.seeker?.name || 'Someone';
          const urgencyEmoji = r.urgency === 'urgent' ? '🔴' : r.urgency === 'today' ? '🟡' : '🟢';
          return `${urgencyEmoji} "${r.title}" (${r.category}) — ${seekerName} in ${r.location}`;
        }).join('\n');
        return `Here are the current open help requests:\n\n${list}\n\nHead to the Help Requests page to accept one and start helping! 🙌`;
      } else {
        return `There are no open help requests right now. Check back later — new requests come in all the time! In the meantime, make sure your skills are up to date on your profile so you get matched when new requests arrive.`;
      }
    } catch (err) {
      console.error('Request search error:', err);
    }
  }

  // ── Category-specific search ──
  const categoryMatch = lower.match(/(?:request|help|task)s?\s+(?:for|about|in|related to)\s+(.+)/i);
  if (categoryMatch) {
    const searchCat = categoryMatch[1].trim().replace(/[?.!]/g, '');
    if (searchCat.length > 1) {
      try {
        const allRequests = await HelpRequest.find({ status: { $in: ['pending', 'active'] } })
          .populate('seeker')
          .sort({ createdAt: -1 })
          .limit(10);
        const matched = (allRequests || []).filter((r: any) =>
          r.category?.toLowerCase().includes(searchCat.toLowerCase())
          || r.title?.toLowerCase().includes(searchCat.toLowerCase())
          || r.description?.toLowerCase().includes(searchCat.toLowerCase())
        );
        if (matched.length > 0) {
          const list = matched.slice(0, 5).map((r: any) => {
            const seekerName = r.seeker?.name || 'Someone';
            return `• "${r.title}" (${r.category}) — by ${seekerName} in ${r.location}`;
          }).join('\n');
          return `I found ${matched.length} request${matched.length > 1 ? 's' : ''} related to "${searchCat}":\n\n${list}\n\nGo to the Help Requests page to accept any of these!`;
        }
      } catch (err) {
        console.error('Category search error:', err);
      }
    }
  }

  // ── Platform stats ──
  if (/how many|stats|statistics|members|community size|total/i.test(lower)) {
    try {
      const [totalUsers, totalRequests, pendingRequests, resolvedChats] = await Promise.all([
        User.countDocuments({ isBot: false }),
        HelpRequest.countDocuments({}),
        HelpRequest.countDocuments({ status: 'pending' }),
        HelpRequest.countDocuments({ status: 'completed' }),
      ]);
      return `📊 Here are the current HelpNet stats:\n\n• ${totalUsers} community members\n• ${totalRequests} total help requests posted\n• ${pendingRequests} requests currently waiting for helpers\n• ${resolvedChats} requests successfully completed\n\nThe community is active and growing! 🌱`;
    } catch (err) {
      console.error('Stats error:', err);
    }
  }

  // ── Static rule-based replies ──
  const STATIC_RULES: { patterns: RegExp[]; reply: string }[] = [
    {
      patterns: [/how\s+(does|do)\s+(helpnet|the platform|this|it)\s+work/i, /what\s+is\s+helpnet/i, /tell me about/i],
      reply: 'HelpNet is a peer-to-peer community platform where neighbours help each other with everyday tasks and skills. You can post a help request describing what you need, and community members with matching skills can offer to help. Once someone accepts, you\'ll be connected in a private chat to coordinate!',
    },
    {
      patterns: [/write.*request/i, /help me write/i, /create.*request/i, /better request/i],
      reply: 'To write a great help request, be specific about: (1) what the problem is, (2) what kind of help you need, and (3) any relevant details like timing or tools required. For example, instead of "need help with computer", try "My laptop won\'t connect to Wi-Fi after a Windows update — need someone who can help troubleshoot remotely." The more detail, the faster you\'ll get matched!',
    },
    {
      patterns: [/matching|match.*helper/i, /how.*find.*helper/i, /how.*get.*help/i],
      reply: 'When you post a help request, HelpNet shows it to community members whose skills match your needs. Helpers can browse open requests and choose to accept ones they\'re confident about. You\'ll get notified as soon as someone offers to help, and you can start chatting right away!',
    },
    {
      patterns: [/rating|ratings|review/i, /how.*rate/i],
      reply: 'After a help session is resolved, you can rate your helper from 1 to 5 stars and leave feedback. These ratings build a trust score that helps the community identify reliable helpers. Higher-rated helpers are more visible, so great help gets rewarded naturally!',
    },
    {
      patterns: [/safe|safety|secure|privacy/i, /is.*safe/i],
      reply: 'Your safety is important! HelpNet includes community ratings, AI-powered content safety checks, and the ability to report inappropriate behaviour. All conversations happen within the platform, so you control what personal information you share. For serious matters, we always recommend involving professionals.',
    },
    {
      patterns: [/skill|skills|profile|add.*skill/i, /what skill/i],
      reply: 'Adding skills to your profile helps you get matched with people who need your expertise! Think about what you\'re good at — it could be anything from cooking and gardening to web development or language translation. Go to your profile settings to add or update your skills anytime.',
    },
    {
      patterns: [/hello|hi|hey|howdy|good\s+(morning|afternoon|evening)/i, /^(hi|hey|hello)$/i],
      reply: 'Hey there! 👋 I\'m the HelpNet AI assistant. I can help you find helpers, browse open requests, write a better help request, or answer any questions about the platform. What\'s on your mind?',
    },
    {
      patterns: [/thank|thanks|thx|appreciate/i],
      reply: 'You\'re welcome! I\'m always here if you need anything else. Good luck with your request — the HelpNet community is great at stepping up! 💪',
    },
    {
      patterns: [/stress|anxious|anxiety|overwhelm|depress|sad|lonely|upset|frustrated/i],
      reply: 'I\'m sorry you\'re going through a tough time. It\'s okay to feel that way, and reaching out is a great first step. HelpNet\'s community is here to support you. If things feel really heavy, please consider talking to a professional — there\'s no shame in getting expert help. You\'re not alone! 💙',
    },
    {
      patterns: [/what can you do|what.*you.*help|your.*capabilities|features/i],
      reply: '🤖 Here\'s what I can do:\n\n• 🔍 Search for helpers by skill (try: "find someone who knows React")\n• 📋 Browse open help requests (try: "show open requests")\n• 📊 Show community stats (try: "how many members")\n• ✍️ Help you write a great help request\n• ❓ Answer questions about how HelpNet works\n• 💬 Chat about anything!\n\nJust ask away!',
    },
  ];

  for (const rule of STATIC_RULES) {
    if (rule.patterns.some((p) => p.test(userText))) {
      return rule.reply;
    }
  }

  // Generic fallback
  const name = userName ? `, ${userName.split(' ')[0]}` : '';
  return `Thanks for your message${name}! Here are some things I can help with:\n\n🔍 "Find helpers with [skill]" — Search for community members\n📋 "Show open requests" — Browse who needs help\n📊 "Show stats" — See community numbers\n✍️ "Help me write a request" — Get help crafting your post\n\nOr just ask me anything about how HelpNet works!`;
}
