import { NextResponse } from "next/server";
import { isFirebaseConfigured, getDb } from "@/lib/database/firebase";
import type { Article } from "@/lib/database/firebase";
import { getSettings } from "@/lib/settings";

export async function GET() {
  if (!isFirebaseConfigured()) {
    return NextResponse.json({ tool: null, enabled: false });
  }

  try {
    const settings = await getSettings();

    if (!settings.showToolOfTheDay) {
      return NextResponse.json({ tool: null, enabled: false });
    }

    const db = getDb();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Strategy: try ai_tool category first, then fall back to tool-like articles
    const toolSnapshot = await db
      .collection("articles")
      .where("ai_category", "==", "ai_tool")
      .limit(20)
      .get();

    let candidates: Article[] = toolSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as Article)
      .filter((a) => a.processed);

    // Fallback: look for tool-related articles by tags or keywords
    if (candidates.length === 0) {
      const recentSnapshot = await db
        .collection("articles")
        .where("processed", "==", true)
        .orderBy("published_at", "desc")
        .limit(50)
        .get();

      const toolKeywords = ["tool", "app", "launch", "release", "platform", "api", "open-source", "product"];
      candidates = recentSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as Article)
        .filter((a) => {
          const text = `${a.title} ${a.ai_summary || ""} ${(a.ai_tags || []).join(" ")}`.toLowerCase();
          return toolKeywords.some((kw) => text.includes(kw));
        });
    }

    if (candidates.length === 0) {
      return NextResponse.json({ tool: null, enabled: true });
    }

    // Sort: recent first, then by importance
    candidates.sort((a, b) => (b.published_at || "").localeCompare(a.published_at || ""));

    const recentTools = candidates.filter((a) => a.published_at >= since);
    const pickFrom = recentTools.length > 0 ? recentTools : candidates;

    const best = pickFrom.sort(
      (a, b) => (b.ai_importance || 0) - (a.ai_importance || 0)
    )[0];

    return NextResponse.json({
      tool: best,
      enabled: true,
      fallback: recentTools.length === 0,
    });
  } catch (error) {
    console.error("Tool of the Day API error:", error);
    return NextResponse.json(
      { tool: null, error: "Failed to fetch tool of the day." },
      { status: 500 }
    );
  }
}
