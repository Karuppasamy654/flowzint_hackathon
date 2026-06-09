import { NextRequest, NextResponse } from 'next/server';
import { geminiFlash, callGeminiWithTimeout } from '@/lib/gemini';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, requestTitle, myRole } = await req.json();
    if (!messages || messages.length < 2) {
      return NextResponse.json({ success: false, error: 'Not enough messages to analyse' }, { status: 400 });
    }

    const conversationText = messages
      .slice(-6)
      .map((m: any) => `${m.sender}: ${m.text}`)
      .join('\n');

    const prompt = `You are a community mediator AI. Analyse this conversation between a help-seeker and helper on HelpNet, a peer-to-peer community platform.

Request: "${requestTitle}"
My role: ${myRole}

Conversation:
${conversationText}

Detect if there is tension, miscommunication, frustration, or conflict. 
If there is NO tension, respond: {"hasTension": false}
If there IS tension, respond with a JSON object (no markdown):
{
  "hasTension": true,
  "tensionLevel": "low" | "medium" | "high",
  "summary": "One sentence describing the issue",
  "suggestions": ["Actionable suggestion 1", "Actionable suggestion 2"],
  "deEscalationMessage": "A warm, ready-to-send de-escalation message they can use"
}`;

    const response = await callGeminiWithTimeout(
      geminiFlash.generateContent(prompt),
      6000
    );
    let text = response.response.text().trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
    }

    const parsed = JSON.parse(text.trim());
    return NextResponse.json({ success: true, data: parsed }, { status: 200 });
  } catch (error: any) {
    console.error('Conflict resolve error:', error);
    return NextResponse.json({ success: false, error: 'Could not analyse conversation' }, { status: 500 });
  }
}
