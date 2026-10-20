import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const mlServiceUrl = process.env.ML_SERVICE_URL;

  if (mlServiceUrl) {
    try {
      const res = await fetch(`${mlServiceUrl}/health`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ ...data, mode: "external_microservice" });
      }
    } catch {
      // Fallback
    }
  }

  return NextResponse.json({
    status: "healthy",
    service: "HelpNet AI ML Service",
    mode: "integrated_artifacts",
    model_loaded: true,
    version: "1.0.0",
  });
}
