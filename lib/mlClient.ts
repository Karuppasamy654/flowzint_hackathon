/**
 * Next.js server-side integration helper for HelpNet AI Python ML Microservice.
 * Flow: User -> Next.js API -> FastAPI (http://localhost:8000) -> ML Models -> JSON Prediction
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

export interface PredictCategoryResponse {
  category: string;
  confidence: number;
  model_version: string;
  probabilities: Record<string, number>;
}

export interface HelperCandidateInput {
  id: string;
  skills: string[];
  bio?: string;
  location?: string;
  rating?: number;
}

export interface MatchHelperResult {
  helper_id: string;
  rank: number;
  score: number;
  reasons: string[];
  features: Record<string, number>;
}

export interface MatchResponse {
  model_version: string;
  is_ml_ranking: boolean;
  results: MatchHelperResult[];
}

export async function predictRequestCategory(title: string, description: string): Promise<PredictCategoryResponse | null> {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/predict/category`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
      cache: "no-store",
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("ML Service category prediction offline:", error);
    return null;
  }
}

export async function rankHelpersWithML(
  request: { title: string; description: string; category: string; location: string; urgency?: string },
  helpers: HelperCandidateInput[]
): Promise<MatchResponse | null> {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: request.title,
        description: request.description,
        category: request.category,
        location: request.location,
        urgency: request.urgency || "flexible",
        helpers,
      }),
      cache: "no-store",
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("ML Service helper matching offline:", error);
    return null;
  }
}

export async function recordMLFeedback(feedback: {
  request_id: string;
  helper_id: string;
  predicted_score: number;
  accepted: boolean;
  completed?: boolean;
  rating?: number;
}): Promise<boolean> {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedback),
    });
    return res.ok;
  } catch (error) {
    console.error("ML Service feedback recording failed:", error);
    return false;
  }
}

export async function getMLMetrics() {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/metrics`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}
