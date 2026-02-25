/**
 * Shared types used across the application.
 */

/** Base article shape - minimum fields needed for dedup, ranking, etc. */
export interface BaseArticle {
  title: string;
  link: string;
  description: string;
  content: string;
  published_at: string;
  source: string;
  category: string;
  priority: string;
  guid: string;
  author: string;
  image_url: string | null;
  collected_at: string;
  processed: boolean;
  ai_summary: string | null;
  ai_category: string | null;
  ai_tags: string[] | null;
  ai_importance: number;
  ai_sentiment: string | null;
  key_takeaway: string | null;
  data_points: string[] | null;
  included_in_email: boolean;
}
