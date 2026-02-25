import { NextRequest, NextResponse } from "next/server";
import { isFirebaseConfigured } from "@/lib/database/firebase";

export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFirebaseConfigured()) {
    return NextResponse.json(
      { error: "Firebase not configured" },
      { status: 503 }
    );
  }

  try {
    const { runCollectionPipeline } = await import("@/lib/pipeline");
    const result = await runCollectionPipeline();
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron collect error:", error);
    return NextResponse.json(
      { error: `Collection failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
