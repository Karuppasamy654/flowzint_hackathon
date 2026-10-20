import { NextResponse } from "next/server";
import classificationReport from "@/reports/classification_report.json";
import matchingReport from "@/reports/matching_report.json";
import metadata from "@/models/metadata.json";

export const dynamic = "force-dynamic";

export async function GET() {
  const mlServiceUrl = process.env.ML_SERVICE_URL;

  if (mlServiceUrl) {
    try {
      const res = await fetch(`${mlServiceUrl}/metrics`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback to static model reports
    }
  }

  return NextResponse.json({
    classification: classificationReport,
    matching: matchingReport,
    model_version: (metadata as any)?.model_version || "1.0.0",
  });
}
