import { NextRequest, NextResponse } from "next/server";
import { isFirebaseConfigured } from "@/lib/database/firebase";

export const maxDuration = 300; // Allow up to 5 min for full pipeline on Vercel

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, mode = "full" } = body;

    // Verify admin secret
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret || secret !== adminSecret) {
      return NextResponse.json(
        { error: "Unauthorized. Invalid admin secret." },
        { status: 401 }
      );
    }

    if (!isFirebaseConfigured()) {
      return NextResponse.json(
        { error: "Firebase is not configured. Fill in your .env file first." },
        { status: 503 }
      );
    }

    // Dynamic import to avoid loading pipeline code until needed
    const { runFullPipeline, runCollectionPipeline } = await import(
      "@/lib/pipeline"
    );

    if (mode === "collect") {
      const result = await runCollectionPipeline();
      return NextResponse.json({
        message: "Collection pipeline completed.",
        ...result,
      });
    }

    const result = await runFullPipeline();
    return NextResponse.json({
      message: result.success
        ? "Full pipeline completed successfully!"
        : "Pipeline completed with errors.",
      ...result,
    });
  } catch (error) {
    console.error("Pipeline trigger error:", error);
    return NextResponse.json(
      { error: `Pipeline failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
