import { NextRequest, NextResponse } from "next/server";
import {
  isFirebaseConfigured,
  findSubscriberByUnsubToken,
  updateSubscriber,
} from "@/lib/database/firebase";

const VALID_CATEGORIES = [
  "ai_breakthrough", "ai_tool", "ai_research", "tech_news", "startup",
  "cybersecurity", "cloud", "devops", "dev_community", "gadgets",
  "software", "business", "science", "ai", "tech",
];

export async function GET(request: NextRequest) {
  if (!isFirebaseConfigured()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  try {
    const subscriber = await findSubscriberByUnsubToken(token);
    if (!subscriber) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    return NextResponse.json({
      email: subscriber.email,
      frequency: subscriber.frequency,
      categories: subscriber.categories,
      is_active: subscriber.is_active,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch preferences: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!isFirebaseConfigured()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { token, categories, frequency } = body;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const subscriber = await findSubscriberByUnsubToken(token);
    if (!subscriber) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (Array.isArray(categories)) {
      const valid = categories.filter(
        (c: string) => typeof c === "string" && VALID_CATEGORIES.includes(c)
      );
      if (valid.length > 0) {
        updates.categories = valid;
      }
    }

    if (frequency === "daily" || frequency === "weekly") {
      updates.frequency = frequency;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    await updateSubscriber(subscriber.id!, updates);

    return NextResponse.json({
      message: "Preferences updated successfully",
      ...updates,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to update preferences: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
