import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getSettings, saveSettings, type SiteSettings } from "@/lib/settings";

function verifyAdmin(request: NextRequest): boolean {
  const secret = request.headers.get("x-admin-secret");
  return !!secret && secret === process.env.ADMIN_SECRET;
}

function buildSystemPrompt(settings: SiteSettings): string {
  return `You are an AI assistant that helps configure an AI & Tech news aggregator website called "AI & Tech Daily". You can view and modify the website's settings through natural language conversation.

CURRENT SETTINGS:
${JSON.stringify(settings, null, 2)}

AVAILABLE SETTINGS YOU CAN MODIFY:
Landing Page:
  - headline (string): Main headline on the landing page
  - headlineMuted (string): Muted/gray part of the headline
  - subtitle (string): Description text below the headline
Newsletter:
  - newsletterName (string): The name of the newsletter
  - newsletterFromName (string): Sender name shown in emails
Delivery:
  - emailEnabled (boolean): Whether email delivery is active
  - telegramEnabled (boolean): Whether Telegram notifications are active
AI Processing:
  - aiProvider (string): AI provider name (e.g. "groq")
  - aiModel (string): AI model identifier
Data Sources:
  - rssEnabled (boolean): RSS feed collection (20+ feeds)
  - hnEnabled (boolean): Hacker News top stories collection
  - redditEnabled (boolean): Reddit collection (4 subreddits)
Schedule:
  - collectIntervalHours (number, 1-24): How often articles are collected
  - sendHourUtc (number, 0-23): Hour (UTC) when daily digest is sent
Email Layout:
  - maxArticlesPerDigest (number, 5-50): Max articles per email
  - showTopStories (boolean): "Top Stories" section in email
  - showAiNews (boolean): "AI News" section in email
  - showTechNews (boolean): "Tech News" section in email
  - showQuickLinks (boolean): "Quick Links" section in email

RESPONSE RULES:
1. You MUST respond with ONLY valid JSON — no markdown, no code fences.
2. Use this exact format:
{"message": "Your conversational response", "changes": null}
3. If the user asks to change something, include only the changed fields:
{"message": "Done! I updated the headline.", "changes": {"headline": "New headline"}}
4. If the user asks a question or doesn't request changes, set "changes" to null.
5. Be helpful, concise, and friendly. Always confirm what you changed.
6. For boolean settings, accept natural language like "turn on", "enable", "activate" as true, and "turn off", "disable", "deactivate" as false.
7. You can make multiple changes at once if the user asks.
8. If something is ambiguous, ask for clarification rather than guessing.`;
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GROQ_API_KEY in environment" },
      { status: 500 }
    );
  }

  let body: { message: string; history?: { role: string; content: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const settings = await getSettings();
  const systemPrompt = buildSystemPrompt(settings);

  try {
    const groq = new Groq({ apiKey });

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    if (body.history && body.history.length > 0) {
      for (const msg of body.history) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      }
    }

    messages.push({ role: "user", content: body.message });

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.3,
      max_tokens: 800,
    });

    const responseText = response.choices[0]?.message?.content || "";

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        message: "I had trouble processing that. Could you rephrase?",
        changes: null,
        currentSettings: settings,
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.changes && typeof parsed.changes === "object" && Object.keys(parsed.changes).length > 0) {
      const validKeys = Object.keys(settings);
      const safeChanges: Partial<SiteSettings> = {};

      for (const [key, value] of Object.entries(parsed.changes)) {
        if (validKeys.includes(key)) {
          (safeChanges as Record<string, unknown>)[key] = value;
        }
      }

      if (Object.keys(safeChanges).length > 0) {
        await saveSettings(safeChanges);
      }

      const updatedSettings = await getSettings();
      return NextResponse.json({
        message: parsed.message,
        changes: safeChanges,
        currentSettings: updatedSettings,
      });
    }

    return NextResponse.json({
      message: parsed.message,
      changes: null,
      currentSettings: settings,
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    return NextResponse.json(
      {
        message: `Sorry, something went wrong: ${errorMessage}`,
        changes: null,
        currentSettings: settings,
      },
      { status: 500 }
    );
  }
}
