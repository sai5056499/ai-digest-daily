import { REDDIT_SUBREDDITS, HN_CONFIG } from "./sources.config";
import { logger } from "@/lib/utils/logger";
import type { CollectedArticle } from "./rssFeedCollector";

// ─── Hacker News API (Free, no auth needed) ─────────────────

interface HNStory {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number;
  descendants?: number;
  type: string;
}

export async function collectFromHackerNews(
  limit?: number
): Promise<CollectedArticle[]> {
  const maxStories = limit || HN_CONFIG.topStoriesLimit;
  const now = new Date().toISOString();

  try {
    logger.info("Fetching from Hacker News API...");

    const topRes = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json",
      { signal: AbortSignal.timeout(10000) }
    );
    const topIds: number[] = await topRes.json();
    const selectedIds = topIds.slice(0, maxStories);

    const articles: CollectedArticle[] = [];

    // Fetch stories in parallel batches of 10
    const batchSize = 10;
    for (let i = 0; i < selectedIds.length; i += batchSize) {
      const batch = selectedIds.slice(i, i + batchSize);
      const stories = await Promise.allSettled(
        batch.map(async (id) => {
          const res = await fetch(
            `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
            { signal: AbortSignal.timeout(5000) }
          );
          return (await res.json()) as HNStory;
        })
      );

      for (const result of stories) {
        if (result.status !== "fulfilled") continue;
        const story = result.value;

        if (
          story &&
          story.type === "story" &&
          story.url &&
          story.score >= HN_CONFIG.minScore
        ) {
          articles.push({
            title: story.title,
            link: story.url,
            description: `HN Score: ${story.score} | Comments: ${story.descendants || 0}`,
            content: "",
            published_at: new Date(story.time * 1000).toISOString(),
            source: "Hacker News",
            category: "tech",
            priority: story.score > 200 ? "high" : "medium",
            guid: `hn-${story.id}`,
            author: story.by,
            image_url: null,
            collected_at: now,
            processed: false,
            ai_summary: null,
            ai_category: null,
            ai_tags: null,
            ai_importance: story.score > 300 ? 7 : story.score > 100 ? 6 : 5,
            ai_sentiment: null,
            key_takeaway: null,
            data_points: null,
            included_in_email: false,
          });
        }
      }
    }

    logger.info(`Hacker News: ${articles.length} stories collected`);
    return articles;
  } catch (error) {
    logger.error(`HN API failed: ${(error as Error).message}`);
    return [];
  }
}

// ─── Reddit API (No auth needed for public data) ────────────

interface RedditPost {
  data: {
    id: string;
    title: string;
    url: string;
    selftext: string;
    score: number;
    author: string;
    created_utc: number;
    is_self: boolean;
    subreddit: string;
    thumbnail: string;
    num_comments: number;
  };
}

interface RedditResponse {
  data: {
    children: RedditPost[];
  };
}

export async function collectFromReddit(
  subreddits?: string[]
): Promise<CollectedArticle[]> {
  const subs = subreddits || REDDIT_SUBREDDITS;
  const now = new Date().toISOString();
  const articles: CollectedArticle[] = [];

  for (const sub of subs) {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/hot.json?limit=20`,
        {
          headers: { "User-Agent": "AITechNewsBot/1.0" },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!res.ok) {
        logger.warn(`Reddit r/${sub}: HTTP ${res.status}`);
        continue;
      }

      const data: RedditResponse = await res.json();

      for (const post of data.data.children) {
        const p = post.data;

        // Skip stickied posts and very low score posts
        if (p.score < 20) continue;

        articles.push({
          title: p.title,
          link: p.is_self
            ? `https://reddit.com/r/${sub}/comments/${p.id}`
            : p.url,
          description: p.selftext?.substring(0, 500) || "",
          content: p.selftext || "",
          published_at: new Date(p.created_utc * 1000).toISOString(),
          source: `Reddit r/${sub}`,
          category: "ai",
          priority: p.score > 500 ? "high" : "medium",
          guid: `reddit-${p.id}`,
          author: p.author,
          image_url:
            p.thumbnail && p.thumbnail.startsWith("http")
              ? p.thumbnail
              : null,
          collected_at: now,
          processed: false,
          ai_summary: null,
          ai_category: null,
          ai_tags: null,
          ai_importance: p.score > 1000 ? 7 : p.score > 300 ? 6 : 5,
          ai_sentiment: null,
          key_takeaway: null,
          data_points: null,
          included_in_email: false,
        });
      }

      logger.info(`Reddit r/${sub}: collected`);

      // Rate limit between subreddits
      await new Promise((r) => setTimeout(r, 1000));
    } catch (error) {
      logger.error(`Reddit r/${sub} failed: ${(error as Error).message}`);
    }
  }

  logger.info(`Reddit total: ${articles.length} posts collected`);
  return articles;
}
