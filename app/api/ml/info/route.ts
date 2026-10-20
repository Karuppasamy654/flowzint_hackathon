import { NextResponse } from "next/server";
import metadata from "@/models/metadata.json";

export const dynamic = "force-dynamic";

export async function GET() {
  const mlServiceUrl = process.env.ML_SERVICE_URL;

  if (mlServiceUrl) {
    try {
      const res = await fetch(`${mlServiceUrl}/model/info`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback
    }
  }

  return NextResponse.json(metadata);
}
