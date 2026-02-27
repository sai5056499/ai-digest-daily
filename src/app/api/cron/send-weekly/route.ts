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
    const { getSettings } = await import("@/lib/settings");
    const settings = await getSettings();

    if (!settings.weeklyEditionEnabled) {
      return NextResponse.json({
        skipped: true,
        reason: "Weekly edition is disabled in settings",
        timestamp: new Date().toISOString(),
      });
    }

    const { runWeeklyPipeline } = await import("@/lib/pipeline");
    const result = await runWeeklyPipeline();
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron send-weekly error:", error);
    return NextResponse.json(
      { error: `Weekly pipeline failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
