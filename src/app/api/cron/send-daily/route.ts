import { NextRequest, NextResponse } from "next/server";
import { isFirebaseConfigured } from "@/lib/database/firebase";

export const maxDuration = 300;

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
    // Run a fresh collection before sending so content is up to date
    const { runCollectionPipeline, runFullPipeline } = await import("@/lib/pipeline");
    const collectionResult = await runCollectionPipeline();
    console.log(`Pre-send collection: ${collectionResult.collected} collected, ${collectionResult.saved} saved`);

    // Now run the full pipeline (process + compose + send)
    const result = await runFullPipeline();
    return NextResponse.json({
      ...result,
      preCollection: collectionResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron send-daily error:", error);
    return NextResponse.json(
      { error: `Daily pipeline failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
