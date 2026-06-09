import { GoogleGenerativeAI } from '@google/generative-ai';

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const geminiFlash = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Wraps a promise in a timeout to ensure it resolves or rejects within the specified time limit.
 * Used to enforce a strict 10 second timeout on Gemini API requests.
 */
export async function callGeminiWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  let timerId: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => {
      reject(new Error('Gemini API call timed out'));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timerId) clearTimeout(timerId);
    return result;
  } catch (error) {
    if (timerId) clearTimeout(timerId);
    throw error;
  }
}
