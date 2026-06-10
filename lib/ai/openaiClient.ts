import fetch from 'node-fetch';

/**
 * Simple wrapper around OpenAI Chat Completion API with exponential back‑off.
 * All AI utilities (request analysis, matching, chat summarisation, fraud detection, recommendations)
 * use this client to keep a single place for the API key, request format and retry logic.
 */
class OpenAIClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1/chat/completions';
  private maxRetries = 3;
  private retryDelay = 500; // ms, will double each retry

  constructor() {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OPENAI_API_KEY not set in environment');
    }
    this.apiKey = key;
  }

  private async request(messages: { role: string; content: string }[]): Promise<any> {
    let attempt = 0;
    let delay = this.retryDelay;
    while (attempt <= this.maxRetries) {
      try {
        const resp = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini', // cost‑effective model for hackathon
            messages,
            temperature: 0.2,
          }),
        });
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`OpenAI API error ${resp.status}: ${txt}`);
        }
        const data = (await resp.json()) as any;
        return data.choices?.[0]?.message?.content?.trim();
      } catch (err) {
        if (attempt === this.maxRetries) throw err;
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
        attempt++;
      }
    }
  }

  /** Analyze a raw request description and return category, tags, and an improved text */
  async analyzeRequest(description: string): Promise<{ category: string; tags: string[]; improved: string }> {
    const prompt = `You are an AI assistant for a community help platform.
    Given the following request description, output JSON with three keys:
    - "category": a short high‑level category (e.g., "medical", "technical", "home", "emergency").
    - "tags": an array of up to 5 concise keywords extracted from the description.
    - "improved": a rewritten version of the description that is clearer, includes the extracted tags, and stays under 200 characters.
    Description: "${description}"`;
    const response = await this.request([{ role: 'system', content: 'You output pure JSON.' }, { role: 'user', content: prompt }]);
    try {
      return JSON.parse(response);
    } catch {
      // fallback – return raw string split crudely
      return { category: 'general', tags: [], improved: description };
    }
  }

  /** Rank helpers for a specific request and return score + explanation */
  async matchHelpers(request: any, helpers: any[]): Promise<{ score: number; explanation: string; rankedHelpers: any[] }> {
    const helperInfo = helpers
      .map((h, i) => `Helper ${i + 1}: {id:${h._id}, skills:${h.skills?.join(',')}, rating:${h.rating}, pastSuccess:${h.pastSuccessCount}}`)
      .join('\n');
    const prompt = `You are a matching engine for a peer‑to‑peer help platform.
    Request: ${JSON.stringify(request)}
    Helpers:\n${helperInfo}\n
    Rank the helpers from best to worst for this request. Return JSON with:
    - "score": a number 0‑100 representing overall match quality for the top helper.
    - "explanation": a short human‑readable sentence why the top helper is the best.
    - "rankedHelpers": an array of helper IDs ordered by suitability.`;
    const response = await this.request([{ role: 'system', content: 'Return pure JSON.' }, { role: 'user', content: prompt }]);
    try {
      return JSON.parse(response);
    } catch {
      return { score: 0, explanation: '', rankedHelpers: [] };
    }
  }

  /** Summarise a chat conversation and suggest quick replies */
  async summarizeChat(messages: { role: string; content: string }[]): Promise<{ summary: string; quickReplies: string[] }> {
    const prompt = `You are summarising a chat between a seeker and a helper.
    Provide:
    1. A concise 2‑sentence summary.
    2. Up to 3 short quick‑reply suggestions the seeker could send next.
    Messages: ${JSON.stringify(messages)}.`;
    const response = await this.request([{ role: 'system', content: 'Return JSON {summary:string, quickReplies:string[]}' }, { role: 'user', content: prompt }]);
    try {
      return JSON.parse(response);
    } catch {
      return { summary: '', quickReplies: [] };
    }
  }

  /** Detect fraud or trust issues for a user */
  async detectFraud(user: any): Promise<{ trustScore: number; flags: string[] }> {
    const prompt = `Assess the trustworthiness of a user on a help platform.
    Consider rating, number of cancellations, spammy request patterns, and any previous fraud flags.
    Return JSON with:
    - "trustScore": 0‑100 where higher is more trustworthy.
    - "flags": an array of short strings describing concerns (or empty if none).
    User data: ${JSON.stringify(user)}`;
    const response = await this.request([{ role: 'system', content: 'Return pure JSON.' }, { role: 'user', content: prompt }]);
    try {
      return JSON.parse(response);
    } catch {
      return { trustScore: 100, flags: [] };
    }
  }

  /** Recommend helpers or categories for a user */
  async recommendHelpers(user: any, allHelpers: any[]): Promise<{ helpers: any[]; categories: string[] }> {
    const prompt = `Based on the user's past activity (shown below) and the pool of available helpers, suggest:
    - Up to 5 helper IDs that would be a good fit for the next request.
    - Up to 3 popular request categories for this user.
    User: ${JSON.stringify(user)}
    Helpers: ${JSON.stringify(allHelpers.slice(0, 20))}`; // limit size
    const response = await this.request([{ role: 'system', content: 'Return JSON {helpers:string[], categories:string[]}' }, { role: 'user', content: prompt }]);
    try {
      return JSON.parse(response);
    } catch {
      return { helpers: [], categories: [] };
    }
  }
}

export const openaiClient = new OpenAIClient();
