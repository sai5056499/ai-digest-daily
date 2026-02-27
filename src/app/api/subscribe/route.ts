import { NextRequest, NextResponse } from "next/server";
import { isFirebaseConfigured, findSubscriberByEmail, createSubscriber, updateSubscriber } from "@/lib/database/firebase";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  if (!isFirebaseConfigured()) {
    return NextResponse.json(
      { error: "Service is being set up. Please try again later." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { email, name, frequency = "daily" } = body;
    let { categories } = body;

    const VALID_CATEGORIES = [
      "ai_breakthrough", "ai_tool", "ai_research", "tech_news", "startup",
      "cybersecurity", "cloud", "devops", "dev_community", "gadgets",
      "software", "business", "science", "ai", "tech",
    ];

    if (!Array.isArray(categories) || categories.length === 0) {
      categories = ["ai", "tech"];
    } else {
      categories = categories.filter((c: string) => typeof c === "string" && VALID_CATEGORIES.includes(c));
      if (categories.length === 0) categories = ["ai", "tech"];
    }

    if (!email || typeof email !== "string" || !email.includes("@") || email.length > 320) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if already subscribed
    const existing = await findSubscriberByEmail(normalizedEmail);

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json(
          { error: "This email is already subscribed!" },
          { status: 409 }
        );
      }

      // Reactivate inactive subscriber
      await updateSubscriber(existing.id!, { is_active: true, confirmed: true });

      return NextResponse.json({
        message: "Welcome back! Your subscription has been reactivated.",
        email: normalizedEmail,
      });
    }

    // Create new subscriber
    const confirmToken = randomUUID();
    const unsubscribeToken = randomUUID();

    await createSubscriber({
      email: normalizedEmail,
      name: name || null,
      frequency,
      categories,
      preferred_time: "08:00:00",
      timezone: "UTC",
      confirm_token: confirmToken,
      unsubscribe_token: unsubscribeToken,
      confirmed: true,
      is_active: true,
      last_email_sent: null,
      emails_received: 0,
    });

    return NextResponse.json({
      message: "Successfully subscribed! You'll receive your first digest soon.",
      email: normalizedEmail,
      frequency,
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
