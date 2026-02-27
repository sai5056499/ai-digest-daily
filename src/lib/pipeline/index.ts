import { collectFromRSS } from "@/lib/collectors/rssFeedCollector";
import {
  collectFromHackerNews,
  collectFromReddit,
  collectGitHubTrending,
} from "@/lib/collectors/apiCollector";
import { summarizeArticles } from "@/lib/ai/summarizer";
import {
  deduplicateArticles,
  filterRecentArticles,
  rankArticles,
} from "@/lib/ai/deduplicator";
import { composeNewsletter, composeWeeklyNewsletter } from "@/lib/ai/newsletterComposer";
import { sendDailyDigest, sendBreakingAlerts, sendWeeklyDigest } from "@/lib/delivery/emailSender";
import { sendToTelegram } from "@/lib/delivery/telegramBot";
import { saveArticlesBatch, getRecentArticles } from "@/lib/database/firebase";
import { logger } from "@/lib/utils/logger";
import type { BaseArticle } from "@/lib/types";
import type { CollectedArticle } from "@/lib/collectors/rssFeedCollector";
import {
  startPipeline,
  stepStart,
  stepDone,
  stepError,
  finishPipeline,
} from "./progress";

export type { PipelineProgress } from "./progress";
export { getProgress, subscribe } from "./progress";

export interface PipelineResult {
  success: boolean;
  articlesCollected: number;
  articlesAfterDedup: number;
  articlesProcessed: number;
  emailsSent: number;
  emailsFailed: number;
  telegramSent: number;
  breakingAlertsSent: number;
  duration: string;
  error?: string;
}

export async function runFullPipeline(): Promise<PipelineResult> {
  const startTime = Date.now();
  startPipeline("full");
  logger.info("===== FULL PIPELINE STARTED =====");

  try {
    // ─── STEP 1a: Collect RSS ───────────────────────────
    stepStart("collect_rss", "Fetching 20+ RSS feeds...");
    let rssArticles: CollectedArticle[] = [];
    try {
      rssArticles = await collectFromRSS();
      stepDone("collect_rss", `${rssArticles.length} articles`);
    } catch (e) {
      stepError("collect_rss", (e as Error).message);
    }

    // ─── STEP 1b: Collect HN ────────────────────────────
    stepStart("collect_hn", "Fetching top stories...");
    let hnArticles: CollectedArticle[] = [];
    try {
      hnArticles = await collectFromHackerNews();
      stepDone("collect_hn", `${hnArticles.length} stories`);
    } catch (e) {
      stepError("collect_hn", (e as Error).message);
    }

    // ─── STEP 1c: Collect Reddit ────────────────────────
    stepStart("collect_reddit", "Fetching subreddits...");
    let redditArticles: CollectedArticle[] = [];
    try {
      redditArticles = await collectFromReddit();
      stepDone("collect_reddit", `${redditArticles.length} posts`);
    } catch (e) {
      stepError("collect_reddit", (e as Error).message);
    }

    const allCollected = [...rssArticles, ...hnArticles, ...redditArticles];
    logger.info(`Collected: ${allCollected.length} total`);

    // ─── STEP 2: Deduplicate ────────────────────────────
    stepStart("dedup", `Processing ${allCollected.length} articles...`);
    const uniqueArticles = deduplicateArticles(allCollected);
    stepDone("dedup", `${allCollected.length} → ${uniqueArticles.length}`);

    // ─── STEP 3: Filter recent ──────────────────────────
    stepStart("filter", "Last 24 hours only...");
    const recentArticles = filterRecentArticles(uniqueArticles, 24);
    stepDone("filter", `${recentArticles.length} recent articles`);

    // ─── STEP 4: AI Processing ──────────────────────────
    const toProcess = recentArticles.slice(0, 30);
    stepStart("ai", `Analyzing ${toProcess.length} articles with AI...`);
    const processedArticles = await summarizeArticles(toProcess);
    const rankedArticles = rankArticles(processedArticles);
    stepDone("ai", `${processedArticles.length} summarized & ranked`);

    // ─── STEP 4b: Breaking Alerts ──────────────────────
    stepStart("breaking", "Checking for breaking news...");
    let breakingResult = { sent: 0, articles: [] as string[] };
    try {
      breakingResult = await sendBreakingAlerts(rankedArticles as any);
      stepDone("breaking", breakingResult.sent > 0
        ? `${breakingResult.articles.length} breaking stories, ${breakingResult.sent} alerts sent`
        : "No breaking news (9+/10)");
    } catch (e) {
      stepError("breaking", (e as Error).message);
    }

    // ─── STEP 5: Save to DB ────────────────────────────
    stepStart("save", "Writing to Firestore...");
    const savedCount = await saveArticlesBatch(
      rankedArticles.map((a) => ({ ...a, processed: true }))
    );
    stepDone("save", `${savedCount} new articles saved`);

    // ─── STEP 5b: GitHub Trending ─────────────────────
    stepStart("github", "Fetching trending repos...");
    let communityPulse: { name: string; url: string; description: string; language: string; stars: number }[] = [];
    try {
      const ghRepos = await collectGitHubTrending();
      communityPulse = ghRepos.slice(0, 6).map((r) => ({
        name: r.fullName,
        url: r.url,
        description: r.description,
        language: r.language,
        stars: r.stars,
      }));
      stepDone("github", `${communityPulse.length} repos`);
    } catch (e) {
      stepError("github", (e as Error).message);
    }

    // ─── STEP 6: Compose newsletter ─────────────────────
    stepStart("compose", "AI writing newsletter...");
    const bestArticles = await getRecentArticles(24, 50);
    const articlesForNewsletter =
      bestArticles.length > 0 ? bestArticles : (rankedArticles as any);
    const newsletter = await composeNewsletter(articlesForNewsletter, { communityPulse });
    stepDone("compose", newsletter.subject_line);

    // ─── STEP 7: Send emails ────────────────────────────
    stepStart("email", "Sending to subscribers...");
    const emailResult = await sendDailyDigest(newsletter);
    stepDone(
      "email",
      `${emailResult.sentCount} sent, ${emailResult.failCount} failed`
    );

    // ─── STEP 8: Telegram ───────────────────────────────
    stepStart("telegram", "Posting top stories...");
    let telegramSent = 0;
    try {
      telegramSent = await sendToTelegram(articlesForNewsletter);
      stepDone("telegram", telegramSent > 0 ? `${telegramSent} messages` : "skipped (not configured)");
    } catch (err) {
      stepDone("telegram", "skipped");
    }

    // ─── Done ───────────────────────────────────────────
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    finishPipeline();
    logger.info(`===== PIPELINE COMPLETE in ${duration}s =====`);

    return {
      success: true,
      articlesCollected: allCollected.length,
      articlesAfterDedup: uniqueArticles.length,
      articlesProcessed: processedArticles.length,
      emailsSent: emailResult.sentCount,
      emailsFailed: emailResult.failCount,
      telegramSent,
      breakingAlertsSent: breakingResult.sent,
      duration: `${duration}s`,
    };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    finishPipeline((error as Error).message);
    logger.error(`PIPELINE FAILED: ${(error as Error).message}`);

    return {
      success: false,
      articlesCollected: 0,
      articlesAfterDedup: 0,
      articlesProcessed: 0,
      emailsSent: 0,
      emailsFailed: 0,
      telegramSent: 0,
      breakingAlertsSent: 0,
      duration: `${duration}s`,
      error: (error as Error).message,
    };
  }
}

export async function runWeeklyPipeline(): Promise<{
  success: boolean;
  emailsSent: number;
  emailsFailed: number;
  articlesCount: number;
  duration: string;
  error?: string;
}> {
  const startTime = Date.now();
  logger.info("===== WEEKLY PIPELINE STARTED =====");

  try {
    const weeklyArticles = await getRecentArticles(168, 200);
    logger.info(`Weekly: ${weeklyArticles.length} articles from the past 7 days`);

    if (weeklyArticles.length === 0) {
      logger.warn("No articles found for weekly digest");
      return { success: true, emailsSent: 0, emailsFailed: 0, articlesCount: 0, duration: "0s" };
    }

    const weeklyNewsletter = await composeWeeklyNewsletter(weeklyArticles);
    logger.info(`Weekly newsletter composed: "${weeklyNewsletter.subject_line}"`);

    const result = await sendWeeklyDigest(weeklyNewsletter);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    logger.info(`===== WEEKLY PIPELINE COMPLETE in ${duration}s =====`);

    return {
      success: true,
      emailsSent: result.sentCount,
      emailsFailed: result.failCount,
      articlesCount: weeklyArticles.length,
      duration: `${duration}s`,
    };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    logger.error(`WEEKLY PIPELINE FAILED: ${(error as Error).message}`);

    return {
      success: false,
      emailsSent: 0,
      emailsFailed: 0,
      articlesCount: 0,
      duration: `${duration}s`,
      error: (error as Error).message,
    };
  }
}

export async function runCollectionPipeline(): Promise<{
  collected: number;
  saved: number;
}> {
  startPipeline("collect");
  logger.info("===== COLLECTION PIPELINE STARTED =====");

  try {
    stepStart("collect_rss", "Fetching RSS feeds...");
    let rssArticles: CollectedArticle[] = [];
    try {
      rssArticles = await collectFromRSS();
      stepDone("collect_rss", `${rssArticles.length} articles`);
    } catch (e) {
      stepError("collect_rss", (e as Error).message);
    }

    stepStart("collect_hn", "Fetching Hacker News...");
    let hnArticles: CollectedArticle[] = [];
    try {
      hnArticles = await collectFromHackerNews(20);
      stepDone("collect_hn", `${hnArticles.length} stories`);
    } catch (e) {
      stepError("collect_hn", (e as Error).message);
    }

    const allCollected = [...rssArticles, ...hnArticles];

    stepStart("dedup", `Deduplicating ${allCollected.length} articles...`);
    const unique = deduplicateArticles(allCollected);
    stepDone("dedup", `${allCollected.length} → ${unique.length}`);

    stepStart("save", "Saving to database...");
    const saved = await saveArticlesBatch(unique);
    stepDone("save", `${saved} new articles saved`);

    finishPipeline();
    return { collected: allCollected.length, saved };
  } catch (error) {
    finishPipeline((error as Error).message);
    return { collected: 0, saved: 0 };
  }
}
