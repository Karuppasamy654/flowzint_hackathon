import { NextRequest, NextResponse } from "next/server";
import { predictRequestCategory } from "@/lib/mlClient";

export async function POST(req: NextRequest) {
  try {
    const { title, description } = await req.json();
    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: "Title and description required" },
        { status: 400 }
      );
    }

    const prediction = await predictRequestCategory(title, description);
    if (!prediction) {
      return NextResponse.json({
        success: false,
        error: "ML service temporarily unavailable",
        is_fallback: true
      });
    }

    return NextResponse.json({
      success: true,
      category: prediction.category,
      confidence: prediction.confidence,
      model_version: prediction.model_version,
      probabilities: prediction.probabilities
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
