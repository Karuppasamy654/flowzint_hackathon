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
- "clarityScore": Score from 1 to 10 based on:
  - Does the person clearly describe WHAT they need help with? (most important)
  - Do they give enough context for a helper to understand the problem?
  - Do they mention any relevant constraints (timing, skill level needed, etc.)?

DO NOT penalise for missing location. Help can be provided remotely/online.
DO NOT require location for a high score.
DO penalise only for vagueness, ambiguity, or lack of useful detail.

Score guide:
  9-10: Very clear what is needed, enough detail to act on immediately.
  7-8:  Clear but missing one helpful detail (e.g. when they need it).
  4-6:  Somewhat clear but missing important context about the problem itself.
  1-3:  Too vague to understand what help is needed at all.

- "clarityFeedback": If score 7 or below: one short actionable sentence
  telling user what to add. Never mention location as something to add.
  Focus only on clarity of the problem description.

- "missingInfo": Short strings for what is missing. Never include 'location',
  'your location', 'where you are', or any location-related item in this array.`;

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
      // Heuristic-based fallback when Gemini is unavailable
      data = analyseWithHeuristics(description);
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

// ── Heuristic-based fallback analyser ──────────────────────────────────
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Web Dev': ['website', 'web', 'html', 'css', 'javascript', 'react', 'node', 'api', 'frontend', 'backend', 'deploy', 'hosting', 'code', 'programming', 'app', 'developer', 'bug', 'server', 'webdev', 'webdeveloper'],
  'Design': ['design', 'logo', 'figma', 'ui', 'ux', 'graphic', 'photoshop', 'illustrator', 'branding', 'poster', 'banner', 'layout'],
  'Plumbing': ['plumbing', 'plumber', 'pipe', 'leak', 'leaking', 'faucet', 'drain', 'toilet', 'bathroom', 'shower'],
  'Electrician': ['electrical', 'wiring', 'socket', 'circuit', 'voltage', 'electrician', 'breaker'],
  'Teaching': ['teach', 'tutor', 'tutoring', 'lesson', 'study', 'exam', 'homework', 'school', 'education', 'math', 'science', 'physics', 'chemistry'],
  'Medical': ['doctor', 'medical', 'health', 'medicine', 'hospital', 'symptom', 'injury', 'sick', 'fever', 'nurse'],
  'Legal': ['legal', 'lawyer', 'court', 'contract', 'rights', 'dispute', 'attorney', 'lawsuit'],
  'Cooking': ['cook', 'cooking', 'recipe', 'bake', 'baking', 'kitchen', 'meal', 'ingredient', 'chef'],
  'Carpentry': ['carpentry', 'carpenter', 'woodwork', 'furniture', 'shelf', 'cabinet', 'woodworking'],
  'Mental Health': ['anxiety', 'stress', 'depression', 'mental', 'therapy', 'counseling', 'emotional', 'lonely', 'overwhelmed', 'therapist'],
  'Music': ['music', 'guitar', 'piano', 'singing', 'song', 'instrument', 'drums', 'musician', 'violin'],
  'Finance': ['finance', 'financial', 'tax', 'invest', 'budget', 'savings', 'loan', 'accounting', 'accountant'],
  'Language Translation': ['translate', 'translation', 'translator', 'interpreter', 'bilingual'],
};

const URGENCY_KEYWORDS = {
  urgent: [
    'urgent', 'emergency', 'asap', 'immediately', 'danger', 'critical', 'desperate',
    // Tamil
    'அவசரம்', 'உடனடியாக', 'ஆபத்து',
    // Hindi
    'तुरंत', 'आपातकाल', 'खतरा', 'जरूरी',
    // Telugu
    'అత్యవసరం', 'ప్రమాదం', 'వెంటనే',
    // Malayalam
    'അടിയന്തിരം', 'അപകടം', 'ഉടനടി',
  ],
  today: [
    'today', 'tonight', 'soon', 'quickly', 'deadline', 'right away',
    // Tamil
    'இன்று', 'இன்றே', 'விரைவில்',
    // Hindi
    'आज', 'जल्दी', 'शीघ्र',
    // Telugu
    'ఈరోజు', 'త్వరగా',
    // Malayalam
    'ഇന്ന്', 'വേഗം',
  ],
};

/**
 * Strip placeholder chip text like `[Add detail about ...: ]` before analysis
 * so it doesn't inflate word count and clarity score.
 */
function stripPlaceholderText(text: string): string {
  return text.replace(/\[Add detail about [^\]]*\]/gi, '').replace(/\s{2,}/g, ' ').trim();
}

function isGibberish(text: string): boolean {
  // If text contains non-Latin scripts (Indic, Arabic, etc.), it's not gibberish
  if (/[\u0900-\u0D7F\u0600-\u06FF\u0980-\u09FF]/.test(text)) return false;

  const cleaned = text.replace(/[^a-zA-Z\s]/g, '').trim().toLowerCase();
  if (!cleaned) return true;
  const words = cleaned.split(/\s+/);

  let gibberishWords = 0;
  const vowels = /[aeiou]/i;
  for (const word of words) {
    if (word.length <= 1) continue;
    if (word.length > 3 && !vowels.test(word)) { gibberishWords++; continue; }
    if (/^(.)\1{2,}$/.test(word)) { gibberishWords++; continue; }
    if (word.length > 15 && !word.includes(' ')) { gibberishWords++; continue; }
  }

  return words.length > 0 && gibberishWords / words.length > 0.5;
}

/**
 * Match category keywords using word boundaries to prevent false substring matches.
 */
function countCategoryMatches(text: string, keywords: string[]): number {
  let count = 0;
  for (const kw of keywords) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|\\b|\\s)${escaped}(?:\\b|\\s|$)`, 'i');
    if (regex.test(text)) {
      count++;
    }
  }
  return count;
}

function analyseWithHeuristics(description: string) {
  // Strip placeholder text before analysis
  const text = stripPlaceholderText(description);
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = sentences.length;

  // Create expanded text where compound words are split for matching
  // e.g. "webdeveloper" → "webdeveloper web developer"
  const expandedLower = words.map((w) => {
    const lw = w.toLowerCase().replace(/[^a-z]/g, '');
    // Split compound words at common boundaries
    const parts: string[] = [lw];
    // Try known compound splits
    for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const kw of kws) {
        if (lw.includes(kw) && lw !== kw && lw.length > kw.length) {
          parts.push(kw);
          const remainder = lw.replace(kw, '');
          if (remainder.length > 2) parts.push(remainder);
        }
      }
    }
    return Array.from(new Set(parts)).join(' ');
  }).join(' ');

  // ── Detect gibberish ──
  const gibberish = isGibberish(text);

  // ── Clarity score ──
  let clarityScore = 1;
  const missingInfo: string[] = [];
  let clarityFeedback = '';

  if (gibberish || wordCount <= 2) {
    clarityScore = 1;
    clarityFeedback = 'This doesn\'t appear to be a meaningful help request. Please describe what you actually need help with.';
    missingInfo.push('meaningful description of the problem', 'what kind of help you need');
  } else if (wordCount <= 5) {
    clarityScore = 2;
    clarityFeedback = 'Your request is too brief. Please describe the problem in more detail so helpers can understand what you need.';
    missingInfo.push('detailed description of the problem');
  } else if (wordCount <= 10) {
    clarityScore = 4;
    clarityFeedback = 'Your request is quite short. Adding more context about the problem would help potential helpers understand your situation.';
    if (sentenceCount < 2) missingInfo.push('more context about the problem');
  } else if (wordCount <= 20) {
    clarityScore = 6;
    clarityFeedback = 'Good start! Adding a bit more detail about constraints or timing would make this even clearer.';
    if (!/when|time|by|before|deadline|today|urgent/i.test(lower)) missingInfo.push('timing or deadline');
  } else if (wordCount <= 40) {
    clarityScore = 7;
    clarityFeedback = sentenceCount >= 2
      ? 'Well written request. Consider mentioning any specific requirements or constraints.'
      : 'Good detail. Try breaking this into a couple of sentences for readability.';
  } else {
    clarityScore = 8;
    if (sentenceCount >= 3) clarityScore = 9;
    clarityFeedback = 'Great, detailed request! Helpers should have a clear picture of what you need.';
  }

  // ── Category detection (word-boundary matching) ──
  let category = 'Other';
  let maxMatches = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matches = countCategoryMatches(expandedLower, keywords);
    if (matches > maxMatches) {
      maxMatches = matches;
      category = cat;
    }
  }

  // ── Urgency detection (word-boundary matching) ──
  let urgency = 'flexible';
  let urgencyReason = 'No urgency indicators detected.';
  if (URGENCY_KEYWORDS.urgent.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(lower))) {
    urgency = 'urgent';
    urgencyReason = 'Urgent language detected in the request.';
  } else if (URGENCY_KEYWORDS.today.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(lower))) {
    urgency = 'today';
    urgencyReason = 'Same-day timing indicators found in the request.';
  }

  // ── Keywords extraction ──
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'about', 'but', 'or', 'and', 'not', 'no', 'so', 'if', 'it', 'its', 'my', 'me', 'i', 'we', 'our', 'you', 'your', 'he', 'she', 'they', 'them', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'how', 'when', 'where', 'why', 'need', 'help', 'want', 'please', 'get', 'got', 'very', 'really', 'just', 'also', 'add', 'detail']);
  const keywords = Array.from(new Set(
      words
        .map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
        .filter((w) => w.length > 2 && !stopWords.has(w))
    )).slice(0, 5);
  if (keywords.length === 0) keywords.push('help');

  // ── Title ──
  const title = gibberish
    ? 'Unclear help request'
    : words.slice(0, 8).join(' ') + (wordCount > 8 ? '...' : '');

  // ── Language detection ──
  const detectedLanguage = detectLanguage(text);

  return {
    title,
    category,
    urgency,
    urgencyReason,
    keywords,
    detectedLanguage,
    clarityScore,
    clarityFeedback,
    missingInfo,
  };
}

/**
 * Detect language from text using Unicode script ranges.
 * Supports: Tamil, Hindi (Devanagari), Malayalam, Telugu, Kannada, Bengali, Arabic.
 * Falls back to 'en' for Latin-script text.
 */
function detectLanguage(text: string): string {
  // Count characters matching each script's Unicode range
  const scripts: { code: string; regex: RegExp }[] = [
    { code: 'ta', regex: /[\u0B80-\u0BFF]/g },       // Tamil
    { code: 'hi', regex: /[\u0900-\u097F]/g },        // Hindi (Devanagari)
    { code: 'ml', regex: /[\u0D00-\u0D7F]/g },        // Malayalam
    { code: 'te', regex: /[\u0C00-\u0C7F]/g },        // Telugu
    { code: 'kn', regex: /[\u0C80-\u0CFF]/g },        // Kannada
    { code: 'bn', regex: /[\u0980-\u09FF]/g },        // Bengali
    { code: 'ar', regex: /[\u0600-\u06FF\u0750-\u077F]/g }, // Arabic
  ];

  let maxCount = 0;
  let detected = 'en';

  for (const { code, regex } of scripts) {
    const matches = text.match(regex);
    const count = matches ? matches.length : 0;
    if (count > maxCount) {
      maxCount = count;
      detected = code;
    }
  }

  // Only switch from English if at least 3 non-Latin characters found
  return maxCount >= 3 ? detected : 'en';
}
