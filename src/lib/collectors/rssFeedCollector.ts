import Parser from "rss-parser";
import { getAllSources, type RSSSource } from "./sources.config";
import { logger } from "@/lib/utils/logger";
import type { BaseArticle } from "@/lib/types";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "AITechNewsAggregator/1.0",
  },
  customFields: {
    item: [["content:encoded", "contentEncoded"]],
  },
});

export type CollectedArticle = BaseArticle;

function extractImage(item: Parser.Item): string | null {
  // Check enclosure
  const enclosure = item.enclosure;
  if (enclosure && typeof enclosure === "object" && "url" in enclosure) {
    const enc = enclosure as { url?: string; type?: string };
    if (enc.type?.startsWith("image/") && enc.url) return enc.url;
  }

  // Check content for first img tag
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itemAny = item as any;
  const content: string =
    itemAny.contentEncoded ||
    item.content ||
    "";
  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
  if (imgMatch) return imgMatch[1];

  // Check media:content or media:thumbnail
  const mediaContent = itemAny["media:content"];
  if (mediaContent) return mediaContent;

  return null;
}

async function fetchSingleFeed(
  source: RSSSource
): Promise<CollectedArticle[]> {
  try {
    const feed = await parser.parseURL(source.url);
    const now = new Date().toISOString();

    const articles: CollectedArticle[] = (feed.items || [])
      .filter((item) => item.title && item.link)
      .map((item) => ({
        title: item.title!.trim(),
        link: item.link!,
        description: (item.contentSnippet || item.content || "").substring(
          0,
          1000
        ),
        content: (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item as any).contentEncoded ||
          item.content ||
          ""
        ).substring(0, 5000),
        published_at: item.pubDate
          ? new Date(item.pubDate).toISOString()
          : item.isoDate || now,
        source: source.name,
        category: source.category,
        priority: source.priority,
        guid: item.guid || item.link!,
        author: item.creator || (item as any).author || source.name,
        image_url: extractImage(item),
        collected_at: now,
        processed: false,
        ai_summary: null,
        ai_category: null,
        ai_tags: null,
        ai_importance: source.priority === "high" ? 6 : 5,
        ai_sentiment: null,
        key_takeaway: null,
        data_points: null,
        included_in_email: false,
      }));

    logger.info(`${source.name}: ${articles.length} articles fetched`);
    return articles;
  } catch (error) {
    logger.error(
      `Failed to fetch ${source.name}: ${(error as Error).message}`
    );
    return [];
  }
}

export async function collectFromRSS(): Promise<CollectedArticle[]> {
  const sources = getAllSources();
  logger.info(`Fetching from ${sources.length} RSS sources...`);

  // Fetch all feeds in parallel (with concurrency limit of 5)
  const allArticles: CollectedArticle[] = [];
  const batchSize = 5;

  for (let i = 0; i < sources.length; i += batchSize) {
    const batch = sources.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((source) => fetchSingleFeed(source))
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        allArticles.push(...result.value);
      }
    }
  }

  logger.info(`RSS collection complete: ${allArticles.length} total articles`);
  return allArticles;
}
