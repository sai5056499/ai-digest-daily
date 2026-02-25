import { NextResponse } from "next/server";
import { isFirebaseConfigured, getStats } from "@/lib/database/firebase";

export async function GET() {
  // Return zeros if Firebase isn't configured yet
  if (!isFirebaseConfigured()) {
    return NextResponse.json({
      totalArticles: 0,
      activeSubscribers: 0,
      emailsSentToday: 0,
      sourcesCount: 0,
      configured: false,
    });
  }

  try {
    const stats = await getStats();
    return NextResponse.json({ ...stats, configured: true });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      {
        totalArticles: 0,
        activeSubscribers: 0,
        emailsSentToday: 0,
        sourcesCount: 0,
        error: "Failed to fetch stats.",
      },
      { status: 500 }
    );
  }
}
