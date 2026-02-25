import { logger } from "@/lib/utils/logger";
import type { BaseArticle } from "@/lib/types";

/**
 * Calculate Jaccard similarity between two strings.
 * Returns a value between 0 (completely different) and 1 (identical).
 */
function jaccardSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/));
  const words2 = new Set(str2.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/));

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Normalize a URL by removing tracking parameters and protocol.
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove common tracking params
    const trackingParams = [
      "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
      "ref", "source", "via", "fbclid", "gclid",
    ];
    trackingParams.forEach((p) => parsed.searchParams.delete(p));
    return `${parsed.hostname}${parsed.pathname}`.replace(/\/+$/, "").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Remove duplicate articles using multiple strategies:
 * 1. Exact URL dedup (after normalization)
 * 2. Title similarity (Jaccard index > 0.7)
 * 3. Keep highest priority/importance version
 */
export function deduplicateArticles<
  T extends BaseArticle
>(articles: T[]): T[] {
  logger.info(`Deduplicating ${articles.length} articles...`);

  // Step 1: URL-based dedup
  const urlMap = new Map<string, T>();
  for (const article of articles) {
    const normalizedUrl = normalizeUrl(article.link);

    if (urlMap.has(normalizedUrl)) {
      const existing = urlMap.get(normalizedUrl)!;
      // Keep the one from a higher-priority source
      if (
        article.priority === "high" &&
        existing.priority !== "high"
      ) {
        urlMap.set(normalizedUrl, article);
      }
    } else {
      urlMap.set(normalizedUrl, article);
    }
  }

  const urlDeduped = Array.from(urlMap.values());
  logger.info(`After URL dedup: ${urlDeduped.length} articles`);

  // Step 2: Title similarity dedup
  const titleDeduped: T[] = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < urlDeduped.length; i++) {
    if (usedIndices.has(i)) continue;

    let bestArticle = urlDeduped[i];
    const duplicateGroup: number[] = [i];

    for (let j = i + 1; j < urlDeduped.length; j++) {
      if (usedIndices.has(j)) continue;

      const similarity = jaccardSimilarity(
        urlDeduped[i].title,
        urlDeduped[j].title
      );

      if (similarity > 0.7) {
        duplicateGroup.push(j);
        usedIndices.add(j);

        // Keep the version with higher priority or importance
        const candidate = urlDeduped[j];
        if (
          candidate.priority === "high" &&
          bestArticle.priority !== "high"
        ) {
          bestArticle = candidate;
        } else if (
          candidate.ai_importance > bestArticle.ai_importance
        ) {
          bestArticle = candidate;
        }
      }
    }

    if (duplicateGroup.length > 1) {
      logger.debug(
        `Merged ${duplicateGroup.length} duplicates: "${bestArticle.title.substring(0, 60)}..."`
      );
    }

    titleDeduped.push(bestArticle);
    usedIndices.add(i);
  }

  logger.info(
    `Deduplication complete: ${articles.length} → ${titleDeduped.length} articles`
  );

  return titleDeduped;
}

/**
 * Filter articles to only include those from the last N hours.
 */
export function filterRecentArticles<T extends BaseArticle>(
  articles: T[],
  hoursAgo = 24
): T[] {
  const cutoff = Date.now() - hoursAgo * 60 * 60 * 1000;

  return articles.filter((article) => {
    const publishedTime = new Date(article.published_at).getTime();
    return publishedTime > cutoff;
  });
}

/**
 * Sort articles by importance (descending), then by published date (newest first).
 */
export function rankArticles<T extends BaseArticle>(articles: T[]): T[] {
  return [...articles].sort((a, b) => {
    // Primary: AI importance
    if (b.ai_importance !== a.ai_importance) {
      return b.ai_importance - a.ai_importance;
    }
    // Secondary: published date
    return (
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
  });
}
