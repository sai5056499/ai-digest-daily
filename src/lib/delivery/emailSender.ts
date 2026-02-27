import nodemailer from "nodemailer";
import { renderDailyDigest, renderWeeklyDigest } from "./templates/dailyDigest";
import { getActiveSubscribers, createEmailLog, updateSubscriber } from "@/lib/database/firebase";
import type { Article, Subscriber } from "@/lib/database/firebase";
import type { NewsletterData, WeeklyRecapData } from "@/lib/ai/newsletterComposer";
import { logger } from "@/lib/utils/logger";

// ─── Email Transport ─────────────────────────────────────────
// Uses Gmail SMTP (Nodemailer) as primary, Resend as fallback.

type EmailProvider = "gmail" | "resend";

function getProvider(): EmailProvider {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) return "gmail";
  if (process.env.RESEND_API_KEY) return "resend";
  throw new Error(
    "No email provider configured. Set GMAIL_USER + GMAIL_APP_PASSWORD, or RESEND_API_KEY."
  );
}

function getGmailTransport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_APP_PASSWORD!,
    },
  });
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const provider = getProvider();
  const fromEmail =
    process.env.EMAIL_FROM ||
    (provider === "gmail"
      ? `AI Tech Daily <${process.env.GMAIL_USER}>`
      : "AI Tech Daily <onboarding@resend.dev>");

  if (provider === "gmail") {
    const transport = getGmailTransport();
    await transport.sendMail({
      from: fromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  } else {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) throw new Error(error.message);
  }
}

// ─── Daily Digest ────────────────────────────────────────────

export async function sendDailyDigest(
  newsletter: NewsletterData
): Promise<{ sentCount: number; failCount: number }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const subscribers = await getActiveSubscribers("daily");

  if (subscribers.length === 0) {
    logger.warn("No active subscribers found. Skipping email send.");
    return { sentCount: 0, failCount: 0 };
  }

  logger.info(`Sending daily digest to ${subscribers.length} subscribers via ${getProvider().toUpperCase()}...`);

  let sentCount = 0;
  let failCount = 0;

  for (const subscriber of subscribers) {
    try {
      const personalizedNewsletter = personalizeForSubscriber(newsletter, subscriber);

      const html = renderDailyDigest({
        newsletter: personalizedNewsletter,
        subscriberEmail: subscriber.email,
        issueNumber: subscriber.emails_received + 1,
        unsubscribeToken: subscriber.unsubscribe_token,
        appUrl,
        toolOfTheDay: newsletter.toolOfTheDay || null,
      });

      const subject = editionSubject(newsletter.subject_line, subscriber);

      await sendEmail({
        to: subscriber.email,
        subject,
        html,
      });

      await createEmailLog({
        subscriber_id: subscriber.id!,
        subject,
        articles_count: newsletter.allArticles.length,
        sent_at: new Date().toISOString(),
        opened: false,
        clicked: false,
        status: "sent",
      });

      await updateSubscriber(subscriber.id!, {
        last_email_sent: new Date().toISOString(),
        emails_received: subscriber.emails_received + 1,
      });

      sentCount++;
      logger.info(`Sent to: ${subscriber.email}`);

      // Rate limit: ~2 emails/sec
      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      failCount++;
      logger.error(
        `Failed to send to ${subscriber.email}: ${(error as Error).message}`
      );

      await createEmailLog({
        subscriber_id: subscriber.id!,
        subject: newsletter.subject_line,
        articles_count: 0,
        sent_at: new Date().toISOString(),
        opened: false,
        clicked: false,
        status: "failed",
      });
    }
  }

  logger.info(
    `Email sending complete: ${sentCount} sent, ${failCount} failed (via ${getProvider().toUpperCase()})`
  );
  return { sentCount, failCount };
}

// ─── Weekly Digest ──────────────────────────────────────────

export async function sendWeeklyDigest(
  weeklyData: WeeklyRecapData
): Promise<{ sentCount: number; failCount: number }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const subscribers = await getActiveSubscribers("weekly");

  if (subscribers.length === 0) {
    logger.warn("No weekly subscribers found. Skipping weekly send.");
    return { sentCount: 0, failCount: 0 };
  }

  logger.info(`Sending weekly digest to ${subscribers.length} subscribers via ${getProvider().toUpperCase()}...`);

  let sentCount = 0;
  let failCount = 0;

  for (const subscriber of subscribers) {
    try {
      const html = renderWeeklyDigest({
        weeklyData,
        subscriberEmail: subscriber.email,
        unsubscribeToken: subscriber.unsubscribe_token,
        appUrl,
      });

      await sendEmail({
        to: subscriber.email,
        subject: weeklyData.subject_line,
        html,
      });

      await createEmailLog({
        subscriber_id: subscriber.id!,
        subject: weeklyData.subject_line,
        articles_count: weeklyData.totalArticlesThisWeek,
        sent_at: new Date().toISOString(),
        opened: false,
        clicked: false,
        status: "sent",
      });

      await updateSubscriber(subscriber.id!, {
        last_email_sent: new Date().toISOString(),
        emails_received: subscriber.emails_received + 1,
      });

      sentCount++;
      logger.info(`Weekly sent to: ${subscriber.email}`);
      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      failCount++;
      logger.error(`Weekly send failed for ${subscriber.email}: ${(error as Error).message}`);
    }
  }

  logger.info(`Weekly sending complete: ${sentCount} sent, ${failCount} failed`);
  return { sentCount, failCount };
}

// ─── Edition Subject Line ────────────────────────────────────

const EDITION_MAP: Record<string, string> = {
  cybersecurity: "Security Brief",
  cloud: "Cloud & DevOps",
  ai: "AI Focus",
  dev_community: "Dev Digest",
  startup: "Startup Watch",
  science: "Science Spotlight",
};

function editionSubject(defaultSubject: string, subscriber: Subscriber): string {
  const cats = subscriber.categories || [];
  if (cats.length === 0 || cats.length > 3) return defaultSubject;

  for (const [key, label] of Object.entries(EDITION_MAP)) {
    if (cats.length <= 2 && cats.every((c) => c.includes(key) || key.includes(c))) {
      return defaultSubject.replace(/AI & Tech Daily/, `AI & Tech Daily: ${label}`);
    }
  }
  return defaultSubject;
}

// ─── Personalization ─────────────────────────────────────────

function matchesCategories(article: Article, prefs: string[]): boolean {
  const cat = (article.ai_category || "").toLowerCase();
  return prefs.some((p) => {
    const pl = p.toLowerCase();
    return cat === pl || cat.includes(pl) || pl.includes(cat);
  });
}

function personalizeForSubscriber(
  newsletter: NewsletterData,
  subscriber: Subscriber
): NewsletterData {
  const prefs = subscriber.categories || [];
  if (prefs.length === 0) return newsletter;

  const matches = (a: Article) => matchesCategories(a, prefs);

  const filteredAll = newsletter.allArticles.filter(matches);

  // If filtering leaves fewer than 3 articles, the subscriber's prefs are
  // too narrow for today's content -- return the full newsletter instead of
  // sending a nearly empty email.
  if (filteredAll.length < 3) return newsletter;

  // Top stories: prefer matched articles but keep originals as fallback
  // so the email never has an empty hero section.
  const matchedTop = newsletter.topStories.filter(matches);
  const topStories = matchedTop.length >= 2 ? matchedTop : newsletter.topStories;

  const aiNews = newsletter.aiNews.filter(matches);
  const techNews = newsletter.techNews.filter(matches);
  const securityNews = newsletter.securityNews.filter(matches);
  const cloudNews = newsletter.cloudNews.filter(matches);

  const sectionArticleIds = new Set<string>();
  [topStories, aiNews, techNews, securityNews, cloudNews].forEach((section) =>
    section.forEach((a) => sectionArticleIds.add(a.guid || a.link))
  );

  // Filter speed read to subscriber interests
  const speedRead = newsletter.speed_read.filter((item) => {
    const matchingArticle = filteredAll.find((a) => a.link === item.link);
    return !!matchingArticle;
  });

  return {
    ...newsletter,
    topStories,
    aiNews,
    techNews,
    securityNews,
    cloudNews,
    allArticles: filteredAll,
    sectionArticleIds,
    speed_read: speedRead.length >= 3 ? speedRead : newsletter.speed_read,
  };
}

// ─── Breaking Alerts ─────────────────────────────────────────

export async function sendBreakingAlerts(
  articles: Article[]
): Promise<{ sent: number; articles: string[] }> {
  const breaking = articles.filter((a) => (a.ai_importance || 0) >= 9);

  if (breaking.length === 0) {
    return { sent: 0, articles: [] };
  }

  logger.info(`Found ${breaking.length} breaking news articles (importance >= 9)`);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const subscribers = await getActiveSubscribers("daily");
  if (subscribers.length === 0) return { sent: 0, articles: [] };

  let totalSent = 0;
  const alertedTitles: string[] = [];

  for (const article of breaking) {
    const soWhat = (article as any).so_what || "";
    const html = `
      <div style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:620px;margin:0 auto;background:#09090b;color:#e4e4e7;letter-spacing:-0.011em;">
        <div style="height:3px;background:linear-gradient(90deg,#dc2626,#ef4444,#f87171,#ef4444,#dc2626);"></div>
        <div style="padding:32px 32px 24px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:14px;font-weight:600;color:#a1a1aa;letter-spacing:0.06em;text-transform:uppercase;">AI & Tech Daily</span>
            <span style="display:inline-block;padding:3px 10px;background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;border-radius:4px;font-family:'SF Mono',SFMono-Regular,Menlo,monospace;">BREAKING</span>
          </div>
        </div>
        <div style="padding:0 32px 28px;">
          <h1 style="font-size:22px;font-weight:800;color:#fafafa;line-height:1.3;margin-bottom:10px;letter-spacing:-0.03em;">${article.title}</h1>
          <p style="font-size:11px;color:#52525b;margin-bottom:16px;font-family:'SF Mono',SFMono-Regular,Menlo,monospace;">${article.source} &middot; ${article.ai_importance}/10</p>
          <p style="font-size:14px;color:#a1a1aa;line-height:1.7;margin-bottom:16px;">${article.ai_summary || article.description}</p>
          ${soWhat ? `
          <div style="background:#18181b;border-left:2px solid #a78bfa;padding:12px 14px;border-radius:8px;margin-bottom:16px;">
            <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#a78bfa;margin-bottom:4px;font-family:'SF Mono',SFMono-Regular,Menlo,monospace;">&#8594; Why it matters</p>
            <p style="font-size:12px;color:#a1a1aa;line-height:1.55;">${soWhat}</p>
          </div>` : ""}
          <a href="${article.link}" style="display:inline-block;padding:8px 18px;background:#18181b;color:#a78bfa;text-decoration:none;border-radius:6px;font-weight:600;font-size:12px;border:1px solid #27272a;">Read full story &#8594;</a>
        </div>
        <div style="padding:20px 32px;text-align:center;font-size:11px;color:#3f3f46;border-top:1px solid #18181b;">
          <a href="${appUrl}" style="color:#52525b;text-decoration:none;">AI & Tech Daily</a> &middot; breaking alerts for stories scoring 9+/10
        </div>
        <div style="height:3px;background:linear-gradient(90deg,#dc2626,#ef4444,#f87171,#ef4444,#dc2626);"></div>
      </div>
    `;

    for (const subscriber of subscribers) {
      try {
        await sendEmail({
          to: subscriber.email,
          subject: `Breaking: ${article.title.substring(0, 60)}`,
          html,
        });
        totalSent++;
        await new Promise((r) => setTimeout(r, 500));
      } catch {
        // Skip failures for breaking alerts
      }
    }

    alertedTitles.push(article.title);
  }

  logger.info(`Breaking alerts: ${totalSent} emails sent for ${breaking.length} articles`);
  return { sent: totalSent, articles: alertedTitles };
}

// ─── Test Email ──────────────────────────────────────────────

export async function sendTestEmail(
  toEmail: string,
  newsletter: NewsletterData
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const html = renderDailyDigest({
    newsletter,
    subscriberEmail: toEmail,
    issueNumber: 0,
    unsubscribeToken: "test",
    appUrl,
    toolOfTheDay: newsletter.toolOfTheDay || null,
  });

  try {
    await sendEmail({
      to: toEmail,
      subject: `[TEST] ${newsletter.subject_line}`,
      html,
    });

    logger.info(`Test email sent to: ${toEmail} via ${getProvider().toUpperCase()}`);
    return true;
  } catch (error) {
    logger.error(`Test email failed: ${(error as Error).message}`);
    return false;
  }
}
