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

        const ts = new Date().toISOString();
        const h = (hrs: number) => new Date(Date.now() - hrs * 3600000).toISOString();
        const mkArticle = (overrides: Record<string, unknown>) => ({
          description: "", content: "", category: "ai_news", priority: "high",
          author: "", image_url: null, collected_at: ts, processed: true,
          included_in_email: true, ai_tags: null, ai_sentiment: null,
          key_takeaway: null, data_points: null, so_what: null, ...overrides,
        });

        const topStories = [
          mkArticle({ title: "OpenAI Announces Next-Gen Reasoning Models with Breakthrough Performance", link: "https://example.com/1", source: "TechCrunch", ai_importance: 9, ai_summary: "OpenAI has unveiled its latest reasoning models with dramatic gains on graduate-level science and competition math — setting records on every major benchmark.", ai_category: "ai_breakthrough", ai_tags: ["openai", "reasoning", "o3"], ai_sentiment: "positive", key_takeaway: "New reasoning models set records on every benchmark, signaling a step-change in AI capabilities.", so_what: "Expect a wave of smarter coding tools and autonomous agents within weeks.", data_points: ["92% on GPQA Diamond", "$200/month Pro tier", "3x faster than o1"], guid: "t-1", published_at: ts }),
          mkArticle({ title: "Google DeepMind Releases AlphaFold 4 for Universal Protein Design", link: "https://example.com/2", source: "The Verge", ai_importance: 8, ai_summary: "AlphaFold 4 can now design entirely new proteins from scratch, opening doors for drug discovery and synthetic biology.", ai_category: "ai_research", ai_tags: ["deepmind", "alphafold", "biotech"], ai_sentiment: "positive", key_takeaway: "AlphaFold moves from predicting protein structures to designing them from scratch.", data_points: ["200M structures designed", "$4.5B pipeline impact"], guid: "t-2", published_at: h(1) }),
          mkArticle({ title: "Meta Open-Sources Llama 4 with Native Multimodal Understanding", link: "https://example.com/3", source: "Ars Technica", ai_importance: 8, ai_summary: "Llama 4 matches GPT-4o on most benchmarks while being fully open-weight with native vision, audio, and video capabilities.", ai_category: "ai_breakthrough", ai_tags: ["meta", "open-source", "llama"], ai_sentiment: "positive", key_takeaway: "Llama 4 matches GPT-4o while being fully open-weight and free for commercial use.", data_points: ["405B parameters", "128K context window"], guid: "t-3", published_at: h(2) }),
          mkArticle({ title: "EU Parliament Passes Landmark AI Liability Directive", link: "https://example.com/13", source: "Reuters", ai_importance: 7, ai_summary: "Clear rules for holding AI providers accountable for harm. Creates a presumption of causality for high-risk AI applications.", ai_category: "tech_news", ai_tags: ["eu", "regulation", "policy"], ai_sentiment: "neutral", key_takeaway: "EU creates legal presumption that AI providers are liable for harm from high-risk systems.", guid: "t-4", published_at: h(3) }),
        ];
        const aiNews = [
          mkArticle({ title: "Anthropic Ships Claude with Persistent Memory Across Conversations", link: "https://example.com/4", source: "Ars Technica", ai_importance: 7, ai_summary: "Claude now remembers context and preferences across conversations — a true personalized AI assistant.", ai_category: "ai_tool", ai_tags: ["anthropic", "claude", "memory"], ai_sentiment: "positive", key_takeaway: "Claude now remembers you between conversations.", data_points: ["30-day memory window"], guid: "a-1", published_at: h(2) }),
          mkArticle({ title: "Hugging Face Launches Open-Source Alternative to GPT-4 Vision", link: "https://example.com/5", source: "VentureBeat", ai_importance: 6, ai_summary: "New open-source multimodal model matches proprietary alternatives on most benchmarks.", ai_category: "ai_tool", ai_tags: ["huggingface", "open-source", "vision"], ai_sentiment: "positive", key_takeaway: "Open-source vision models are now competitive with GPT-4V.", guid: "a-2", published_at: h(3) }),
          mkArticle({ title: "Stability AI Releases Video Generation Model Rivaling Sora", link: "https://example.com/6", source: "Wired", ai_importance: 6, ai_summary: "Stable Video 3.0 generates photorealistic 30-second clips from text prompts.", ai_category: "ai_tool", ai_tags: ["stability-ai", "video", "generative"], ai_sentiment: "positive", key_takeaway: "Text-to-video just became practical for content creators.", data_points: ["30-second clips", "1080p output"], guid: "a-3", published_at: h(4) }),
        ];
        const techNews = [
          mkArticle({ title: "Apple Reportedly Testing Foldable iPhone Prototype for 2027", link: "https://example.com/7", source: "Wired", ai_importance: 6, ai_summary: "Supply chain confirms advanced foldable prototypes with crease-free display.", ai_category: "gadgets", ai_tags: ["apple", "foldable", "iphone"], ai_sentiment: "positive", key_takeaway: "Apple's foldable targets 2027 with display tech that eliminates the visible crease.", guid: "te-1", published_at: h(4) }),
          mkArticle({ title: "Stripe Acquires AI-Powered Fintech Startup for $1.2B", link: "https://example.com/8", source: "TechCrunch", ai_importance: 5, ai_summary: "Stripe adds automated fraud detection and intelligent payment routing.", ai_category: "startup", ai_tags: ["stripe", "fintech", "acquisition"], ai_sentiment: "positive", key_takeaway: "Stripe bets big on AI-powered fraud detection.", data_points: ["$1.2B acquisition price"], guid: "te-2", published_at: h(5) }),
        ];
        const securityNews = [
          mkArticle({ title: "Critical Zero-Day in Popular NPM Package Affects 15M Downloads", link: "https://example.com/9", source: "The Hacker News (Security)", ai_importance: 8, ai_summary: "Critical RCE vulnerability in widely-used NPM auth library. Actively exploited in the wild.", ai_category: "cybersecurity", ai_tags: ["npm", "zero-day", "rce"], ai_sentiment: "negative", key_takeaway: "Patch auth-jwt-utils immediately — RCE is being exploited.", data_points: ["15M weekly downloads", "CVE-2026-1847"], guid: "s-1", published_at: h(1), category: "cybersecurity" }),
          mkArticle({ title: "NIST Publishes Final Post-Quantum Cryptography Standards", link: "https://example.com/10", source: "Krebs on Security", ai_importance: 7, ai_summary: "Three post-quantum cryptography standards finalized: ML-KEM, ML-DSA, SLH-DSA.", ai_category: "cybersecurity", ai_tags: ["nist", "post-quantum", "cryptography"], ai_sentiment: "positive", key_takeaway: "Post-quantum crypto standards are final — migration planning should start now.", data_points: ["3 algorithms standardized"], guid: "s-2", published_at: h(3), category: "cybersecurity" }),
        ];
        const cloudNews = [
          mkArticle({ title: "AWS Launches Next-Gen Graviton5 Instances with 2x Price-Performance", link: "https://example.com/11", source: "AWS What's New", ai_importance: 7, ai_summary: "Graviton5 ARM chips deliver 2x the price-performance of Graviton3 with native FP8 inference.", ai_category: "cloud", ai_tags: ["aws", "graviton", "arm"], ai_sentiment: "positive", key_takeaway: "Graviton5 makes ARM the default for cost-conscious cloud workloads.", data_points: ["2x price-performance", "FP8 inference support"], guid: "c-1", published_at: h(2), category: "cloud" }),
          mkArticle({ title: "Kubernetes 1.33 Ships with Built-In Service Mesh and eBPF Networking", link: "https://example.com/12", source: "The New Stack", ai_importance: 6, ai_summary: "K8s integrates sidecar-free service mesh using eBPF, eliminating Istio for many deployments.", ai_category: "devops", ai_tags: ["kubernetes", "ebpf", "service-mesh"], ai_sentiment: "positive", key_takeaway: "K8s 1.33 makes Istio optional for most service mesh use cases.", data_points: ["40% pod overhead reduction"], guid: "c-2", published_at: h(4), category: "cloud" }),
        ];
        const allArticles = [...topStories, ...aiNews, ...techNews, ...securityNews, ...cloudNews] as any[];
        const sectionArticleIds = new Set(allArticles.map((a: any) => a.guid || a.link));

        const sampleNewsletter = {
          subject_line: "🤖 AI & Tech Daily — Your Morning Brief",
          intro: "Good morning. Three major developments stand out today, led by a breakthrough in reasoning models that could reshape how we build software.",
          top_story_highlight: "OpenAI has unveiled its latest reasoning models with dramatic gains on every major benchmark.",
          tldr: "OpenAI ships next-gen reasoning, DeepMind cracks protein design, and Anthropic adds persistent memory to Claude.",
          weekly_trend: "Open-source AI models are closing the gap with proprietary alternatives faster than predicted. The moat is shifting to inference speed, tool-use, and post-training customization.",
          editors_take: "What strikes me most isn't any single announcement — it's the convergence. OpenAI pushes reasoning forward, Meta commoditizes multimodal AI through open-source, and Anthropic bets on persistent memory as the differentiator. We're watching the AI industry bifurcate: one camp competes on raw intelligence, the other on the relationship layer — memory, personalization, workflow integration. The question isn't who wins the benchmark race, but whether users will pay more for an AI that remembers them than one that scores 3% higher on GPQA.",
          discussion_question: "What's your take: will open-source models like Llama 4 make proprietary APIs irrelevant within 2 years, or will the intelligence gap keep widening?",
          speed_read: [
            { title: "OpenAI Announces Next-Gen Reasoning Models", link: "https://example.com/1", one_liner: "New models set records on every major benchmark.", source: "TechCrunch" },
            { title: "Google DeepMind Releases AlphaFold 4", link: "https://example.com/2", one_liner: "AlphaFold can now design new proteins from scratch.", source: "The Verge" },
            { title: "Meta Open-Sources Llama 4", link: "https://example.com/3", one_liner: "Matches GPT-4o, fully open-weight with native multimodal.", source: "Ars Technica" },
            { title: "Claude Gets Persistent Memory", link: "https://example.com/4", one_liner: "Remembers context across conversations.", source: "Ars Technica" },
            { title: "Critical NPM Zero-Day", link: "https://example.com/9", one_liner: "15M weekly downloads affected. Patch immediately.", source: "The Hacker News" },
            { title: "AWS Launches Graviton5", link: "https://example.com/11", one_liner: "2x price-performance with native FP8 inference.", source: "AWS" },
            { title: "EU Passes AI Liability Directive", link: "https://example.com/13", one_liner: "AI providers liable for harm from high-risk systems.", source: "Reuters" },
            { title: "K8s 1.33 Ships with eBPF Service Mesh", link: "https://example.com/12", one_liner: "Built-in networking makes Istio optional.", source: "The New Stack" },
          ],
          read_time_minutes: 6,
          deep_dive: {
            title: "OpenAI Announces Next-Gen Reasoning Models with Breakthrough Performance",
            link: "https://example.com/1",
            source: "TechCrunch",
            content: "OpenAI has released its next generation of reasoning models. The models achieve 92% on GPQA Diamond (up from 78%), solve 71% of SWE-bench coding problems, and score in the 99th percentile on competition math. The architecture introduces 'deliberative alignment' — the model explicitly references its safety training during reasoning, plus a 'think-then-verify' loop for self-correction. For developers, complex refactoring, multi-file generation, and architectural reasoning all see meaningful gains. Enterprise coding assistants should expect real productivity improvements. Expect Google DeepMind and Anthropic to respond within weeks — the reasoning model race is now the primary battleground.",
          },
          paper_of_the_day: {
            title: "Scaling Sparse Autoencoders to GPT-4 Level Models",
            link: "https://arxiv.org/abs/2406.XXXXX",
            source: "arXiv CS.LG",
            plain_english: "Researchers trained 'sparse autoencoders' — X-ray machines for neural networks — on a GPT-4-class model and discovered millions of distinct, interpretable features organized into hierarchical clusters. This is the first evidence we can systematically audit what a frontier model knows.",
            one_liner: "We can now see inside GPT-4's brain, and the concepts are surprisingly well-organized.",
          },
          data_points: [
            { stat: "92% on GPQA Diamond", context: "OpenAI Reasoning Models", source: "TechCrunch", link: "https://example.com/1" },
            { stat: "$1.2B acquisition", context: "Stripe AI Fintech Deal", source: "TechCrunch", link: "https://example.com/8" },
            { stat: "15M downloads affected", context: "NPM Zero-Day", source: "The Hacker News", link: "https://example.com/9" },
            { stat: "2x price-performance", context: "AWS Graviton5", source: "AWS", link: "https://example.com/11" },
          ],
          community_pulse: [
            { name: "browser-use/browser-use", url: "https://github.com/browser-use/browser-use", description: "Make websites accessible for AI agents.", language: "Python", stars: 52400 },
            { name: "jina-ai/reader", url: "https://github.com/jina-ai/reader", description: "Convert any URL to LLM-friendly input.", language: "TypeScript", stars: 18200 },
            { name: "vercel/ai", url: "https://github.com/vercel/ai", description: "Build AI-powered apps with React and Next.js.", language: "TypeScript", stars: 12800 },
            { name: "openai/swarm", url: "https://github.com/openai/swarm", description: "Multi-agent orchestration framework.", language: "Python", stars: 24100 },
          ],
          topStories,
          aiNews,
          techNews,
          securityNews,
          cloudNews,
          allArticles,
          sectionArticleIds,
          toolOfTheDay: {
            title: "Cursor AI — The AI-First Code Editor",
            link: "https://cursor.sh",
            source: "Product Hunt",
            ai_summary: "AI-native IDE with codebase-aware completions, multi-file edits, and natural language coding. Supports Claude, GPT-4, and custom models.",
            ai_importance: 8,
            ai_tags: ["cursor", "ide", "ai-coding"],
            key_takeaway: "Developers report 2-3x productivity gains on complex refactoring tasks.",
          },
          generatedAt: ts,
        };

        const html = renderDailyDigest({
          newsletter: sampleNewsletter as any,
          subscriberEmail: toEmail,
          issueNumber: 42,
          unsubscribeToken: "preview",
          appUrl,
          toolOfTheDay: sampleNewsletter.toolOfTheDay,
        });

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
            subject: sampleNewsletter.subject_line,
            html,
          });
        } else {
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);
          const fromEmail = process.env.EMAIL_FROM || "AI Tech Daily <onboarding@resend.dev>";
          const { error } = await resend.emails.send({
            from: fromEmail,
            to: toEmail,
            subject: sampleNewsletter.subject_line,
            html,
          });
          if (error) throw new Error(error.message);
        }
        return NextResponse.json({
          ok: true,
          detail: `Full newsletter preview sent to ${toEmail} with all sections`,
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
