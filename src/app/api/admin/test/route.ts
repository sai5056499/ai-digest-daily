import { NextRequest, NextResponse } from "next/server";
import { isFirebaseConfigured, getDb } from "@/lib/database/firebase";

function verifyAdmin(request: NextRequest): boolean {
  const secret = request.headers.get("x-admin-secret");
  return !!secret && secret === process.env.ADMIN_SECRET;
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { test } = body;
  const start = Date.now();

  try {
    switch (test) {
      // ─── Firebase ───────────────────────────────────
      case "firebase": {
        if (!isFirebaseConfigured()) {
          return NextResponse.json({ ok: false, error: "Not configured", ms: 0 });
        }
        const db = getDb();
        const ref = db.collection("_test").doc("ping");
        await ref.set({ ok: true, ts: new Date().toISOString() });
        const doc = await ref.get();
        await ref.delete();
        return NextResponse.json({
          ok: true,
          detail: "Write/Read/Delete passed",
          data: doc.data(),
          ms: Date.now() - start,
        });
      }

      // ─── Groq AI ───────────────────────────────────
      case "groq": {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
          return NextResponse.json({ ok: false, error: "GROQ_API_KEY not set", ms: 0 });
        }
        const Groq = (await import("groq-sdk")).default;
        const groq = new Groq({ apiKey });
        const r = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: "Respond with exactly: GROQ_OK" }],
          max_tokens: 10,
        });
        const text = r.choices[0]?.message?.content?.trim() || "";
        return NextResponse.json({
          ok: true,
          detail: text,
          model: "llama-3.3-70b-versatile",
          ms: Date.now() - start,
        });
      }

      // ─── Email provider check ─────────────────────────
      case "resend": {
        // Check Gmail SMTP first, then Resend
        if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
          const nodemailer = (await import("nodemailer")).default;
          const transport = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_APP_PASSWORD,
            },
          });
          await transport.verify();
          return NextResponse.json({
            ok: true,
            detail: `Gmail SMTP connected (${process.env.GMAIL_USER})`,
            provider: "gmail",
            ms: Date.now() - start,
          });
        }
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
          return NextResponse.json({ ok: false, error: "No email provider configured (GMAIL or RESEND)", ms: 0 });
        }
        const { Resend } = await import("resend");
        const resend = new Resend(apiKey);
        const { data, error } = await resend.domains.list();
        if (error) throw new Error(error.message);
        return NextResponse.json({
          ok: true,
          detail: "Resend API key valid",
          provider: "resend",
          domains: (data?.data || []).length,
          ms: Date.now() - start,
        });
      }

      // ─── RSS fetch ──────────────────────────────────
      case "rss": {
        const Parser = (await import("rss-parser")).default;
        const parser = new Parser({ timeout: 10000 });
        const feed = await parser.parseURL("https://hnrss.org/best?count=5");
        return NextResponse.json({
          ok: true,
          detail: `Fetched ${feed.items?.length || 0} items from Hacker News`,
          items: (feed.items || []).slice(0, 3).map((i) => i.title),
          ms: Date.now() - start,
        });
      }

      // ─── Send test email (full template preview) ─────
      case "email": {
        const toEmail = (body as any).to;
        if (!toEmail) {
          return NextResponse.json({ ok: false, error: "Provide 'to' email", ms: 0 });
        }
        const { renderDailyDigest } = await import("@/lib/delivery/templates/dailyDigest");
        const nodemailer = (await import("nodemailer")).default;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const sampleNewsletter = {
          subject_line: "AI & Tech Daily — Design Preview",
          intro: "Welcome to today's preview of the new minimalistic email design. This is a sample digest showing how your daily newsletter will look.",
          tldr: "New clean email design with monochrome palette, subtle borders, and typography that matches the app.",
          weekly_trend: "Minimalistic design trends continue to dominate tech newsletters, with a shift toward cleaner layouts and reduced visual noise.",
          topStories: [
            {
              title: "OpenAI Announces Next-Gen Reasoning Models with Breakthrough Performance",
              link: "https://example.com/1",
              source: "TechCrunch",
              ai_importance: 9,
              ai_summary: "OpenAI has unveiled its latest reasoning models that demonstrate significant improvements in complex problem-solving, coding, and mathematical reasoning tasks.",
              so_what: "This could reshape how developers build AI-powered applications, making advanced reasoning accessible through simple API calls.",
              ai_tags: ["AI", "OpenAI", "reasoning"],
              ai_category: "AI",
              published_at: new Date().toISOString(),
            },
            {
              title: "Google DeepMind Releases AlphaFold 4 for Universal Protein Design",
              link: "https://example.com/2",
              source: "The Verge",
              ai_importance: 8,
              ai_summary: "DeepMind's latest AlphaFold iteration can now design entirely new proteins from scratch, opening doors for drug discovery and materials science.",
              so_what: "Pharmaceutical companies could cut drug development timelines by years using AI-designed protein structures.",
              ai_tags: ["DeepMind", "biotech", "research"],
              ai_category: "AI",
              published_at: new Date(Date.now() - 3600000).toISOString(),
            },
          ],
          aiNews: [
            {
              title: "Anthropic Ships Claude with Persistent Memory Across Conversations",
              link: "https://example.com/3",
              source: "Ars Technica",
              ai_importance: 7,
              ai_summary: "Claude can now remember context and preferences across separate conversations, moving closer to truly personalized AI assistants.",
              ai_category: "AI",
              published_at: new Date(Date.now() - 7200000).toISOString(),
            },
            {
              title: "Hugging Face Launches Open-Source Alternative to GPT-4 Vision",
              link: "https://example.com/4",
              source: "VentureBeat",
              ai_importance: 6,
              ai_summary: "The new open-source multimodal model matches proprietary alternatives on most benchmarks while being freely available for commercial use.",
              ai_category: "AI",
              published_at: new Date(Date.now() - 10800000).toISOString(),
            },
          ],
          techNews: [
            {
              title: "Apple Reportedly Testing Foldable iPhone Prototype for 2027 Launch",
              link: "https://example.com/5",
              source: "Wired",
              ai_importance: 6,
              ai_summary: "Multiple supply chain sources confirm Apple has advanced prototypes of a foldable iPhone with a seamless crease-free display.",
              ai_category: "Tech",
              published_at: new Date(Date.now() - 14400000).toISOString(),
            },
          ],
          allArticles: [] as any[],
          toolOfTheDay: {
            title: "Cursor AI — The AI-First Code Editor That Developers Love",
            link: "https://cursor.com",
            source: "Product Hunt",
            ai_summary: "Cursor is an AI-native IDE built on VS Code that integrates directly with your codebase for smarter completions, multi-file edits, and natural language commands. It's rapidly becoming the go-to editor for AI-assisted development.",
            ai_importance: 8,
            ai_tags: ["ai", "developer-tools", "IDE"],
            key_takeaway: "Cursor represents the shift toward AI-first development environments where the editor understands your entire codebase contextually.",
          },
        };
        sampleNewsletter.allArticles = [
          ...sampleNewsletter.topStories,
          ...sampleNewsletter.aiNews,
          ...sampleNewsletter.techNews,
        ];
        (sampleNewsletter as any).sectionArticleIds = new Set(
          sampleNewsletter.allArticles.map((a: any) => a.guid || a.link)
        );

        const html = renderDailyDigest({
          newsletter: sampleNewsletter as any,
          subscriberEmail: toEmail,
          issueNumber: 0,
          unsubscribeToken: "preview",
          appUrl,
          toolOfTheDay: sampleNewsletter.toolOfTheDay,
        });

        // Send via Gmail SMTP if configured, else Resend
        if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
          const transport = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_APP_PASSWORD,
            },
          });
          const fromEmail = process.env.EMAIL_FROM || `AI Tech Daily <${process.env.GMAIL_USER}>`;
          await transport.sendMail({
            from: fromEmail,
            to: toEmail,
            subject: "ai & tech daily — design preview",
            html,
          });
        } else {
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);
          const fromEmail = process.env.EMAIL_FROM || "AI Tech Daily <onboarding@resend.dev>";
          const { error } = await resend.emails.send({
            from: fromEmail,
            to: toEmail,
            subject: "ai & tech daily — design preview",
            html,
          });
          if (error) throw new Error(error.message);
        }
        return NextResponse.json({
          ok: true,
          detail: `Design preview email sent to ${toEmail}`,
          ms: Date.now() - start,
        });
      }

      // ─── Send real newsletter preview ─────────────────
      case "email_preview": {
        const toEmail = (body as any).to;
        if (!toEmail) {
          return NextResponse.json({ ok: false, error: "Provide 'to' email", ms: 0 });
        }
        if (!isFirebaseConfigured()) {
          return NextResponse.json({ ok: false, error: "Firebase not configured", ms: 0 });
        }

        const { getRecentArticles } = await import("@/lib/database/firebase");
        const { composeNewsletter } = await import("@/lib/ai/newsletterComposer");
        const { sendTestEmail } = await import("@/lib/delivery/emailSender");

        const articles = await getRecentArticles(48, 30);
        if (articles.length === 0) {
          return NextResponse.json({ ok: false, error: "No articles in DB to preview", ms: Date.now() - start });
        }

        const newsletter = await composeNewsletter(articles);
        const sent = await sendTestEmail(toEmail, newsletter);

        return NextResponse.json({
          ok: sent,
          detail: sent
            ? `Full newsletter preview sent to ${toEmail} (${articles.length} articles, tool: ${newsletter.toolOfTheDay?.title || "none found"})`
            : "Failed to send preview email",
          toolOfTheDay: newsletter.toolOfTheDay?.title || null,
          articlesUsed: articles.length,
          ms: Date.now() - start,
        });
      }

      // ─── AI summarize test ──────────────────────────
      case "summarize": {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
          return NextResponse.json({ ok: false, error: "GROQ_API_KEY not set", ms: 0 });
        }
        const Groq = (await import("groq-sdk")).default;
        const groq = new Groq({ apiKey });
        const r = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{
            role: "user",
            content: `Summarize this headline in one sentence as a tech analyst:\n"OpenAI launches GPT-5 with native video understanding and real-time collaboration"\n\nReturn only the summary, nothing else.`,
          }],
          max_tokens: 100,
          temperature: 0.3,
        });
        return NextResponse.json({
          ok: true,
          detail: r.choices[0]?.message?.content?.trim(),
          ms: Date.now() - start,
        });
      }

      // ─── Env check ──────────────────────────────────
      case "env": {
        const vars = [
          "FIREBASE_PROJECT_ID",
          "FIREBASE_CLIENT_EMAIL",
          "FIREBASE_PRIVATE_KEY",
          "GROQ_API_KEY",
          "RESEND_API_KEY",
          "EMAIL_FROM",
          "TELEGRAM_BOT_TOKEN",
          "TELEGRAM_CHAT_ID",
          "ADMIN_SECRET",
          "CRON_SECRET",
          "NEWS_API_KEY",
        ];
        const status = vars.map((v) => ({
          name: v,
          set: !!process.env[v],
          preview: process.env[v]
            ? v.includes("KEY") || v.includes("SECRET") || v.includes("TOKEN")
              ? process.env[v]!.substring(0, 8) + "..."
              : process.env[v]!.substring(0, 30) + (process.env[v]!.length > 30 ? "..." : "")
            : "",
        }));
        return NextResponse.json({ ok: true, vars: status, ms: Date.now() - start });
      }

      default:
        return NextResponse.json({ error: `Unknown test: ${test}` }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: (error as Error).message,
      ms: Date.now() - start,
    });
  }
}
