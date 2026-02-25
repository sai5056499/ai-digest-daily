import Groq from "groq-sdk";
import { logger } from "@/lib/utils/logger";
import type { BaseArticle } from "@/lib/types";
import type { CollectedArticle } from "@/lib/collectors/rssFeedCollector";

interface AIAnalysis {
  summary: string;
  category: string;
  tags: string[];
  importance: number;
  sentiment: string;
  key_takeaway: string;
  so_what: string;
  data_points: string[];
}

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing GROQ_API_KEY environment variable. " +
        "Get a free key at https://console.groq.com/keys"
    );
  }
  return new Groq({ apiKey });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function analyzeArticle(
  article: CollectedArticle
): Promise<AIAnalysis | null> {
  const groq = getGroqClient();

  const prompt = `You are a senior tech news analyst. Analyze this article and return ONLY valid JSON (no markdown, no code blocks).

ARTICLE:
Title: ${article.title}
Source: ${article.source}
Content: ${(article.description || article.content || "").substring(0, 2000)}

Return this exact JSON structure:
{
  "summary": "2-3 sentence concise summary of the key points",
  "category": "one of: ai_breakthrough, ai_tool, ai_research, tech_news, startup, cybersecurity, cloud, devops, dev_community, gadgets, software, business, science",
  "tags": ["tag1", "tag2", "tag3"],
  "importance": 7,
  "sentiment": "positive",
  "key_takeaway": "One line key insight for busy readers",
  "so_what": "Why this matters to tech professionals and what they should do about it. 1-2 sentences, actionable.",
  "data_points": ["$2.5B raised", "50M users", "3x faster than GPT-4"]
}

Rules:
- importance: 1-10 scale (10 = groundbreaking like GPT-5 launch, 1 = minor blog post)
- sentiment: "positive", "negative", or "neutral"
- tags: 2-4 specific, lowercase tags
- summary: factual and concise, no opinions
- key_takeaway: actionable insight in one sentence
- so_what: explain the real-world impact — who is affected and what should they do? Be specific.
- data_points: extract 0-3 concrete numbers, stats, funding amounts, benchmarks, dates, or metrics from the article. If no numbers are mentioned, return an empty array.`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    });

    const responseText = response.choices[0]?.message?.content || "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn(`No JSON found in AI response for: ${article.title}`);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as AIAnalysis;
    parsed.importance = Math.max(1, Math.min(10, parsed.importance || 5));
    return parsed;
  } catch (error) {
    logger.error(
      `AI analysis failed for "${article.title}": ${(error as Error).message}`
    );
    return null;
  }
}

export interface ProcessedArticle extends BaseArticle {
  ai_summary: string;
  ai_category: string;
  ai_tags: string[];
  ai_importance: number;
  ai_sentiment: string;
  key_takeaway: string;
  so_what: string;
  data_points: string[];
  processed: true;
}

export async function summarizeArticles(
  articles: CollectedArticle[]
): Promise<ProcessedArticle[]> {
  logger.info(`Processing ${articles.length} articles with Groq AI...`);

  const processed: ProcessedArticle[] = [];

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    logger.info(
      `Processing ${i + 1}/${articles.length}: ${article.title.substring(0, 60)}...`
    );

    const analysis = await analyzeArticle(article);

    if (analysis) {
      processed.push({
        title: article.title,
        link: article.link,
        description: article.description,
        content: article.content,
        published_at: article.published_at,
        source: article.source,
        category: article.category,
        priority: article.priority,
        guid: article.guid,
        author: article.author,
        image_url: article.image_url,
        collected_at: article.collected_at,
        included_in_email: article.included_in_email,
        ai_summary: analysis.summary,
        ai_category: analysis.category,
        ai_tags: analysis.tags,
        ai_importance: analysis.importance,
        ai_sentiment: analysis.sentiment,
        key_takeaway: analysis.key_takeaway,
        so_what: analysis.so_what || "",
        data_points: analysis.data_points || [],
        processed: true,
      });
    } else {
      processed.push({
        title: article.title,
        link: article.link,
        description: article.description,
        content: article.content,
        published_at: article.published_at,
        source: article.source,
        category: article.category,
        priority: article.priority,
        guid: article.guid,
        author: article.author,
        image_url: article.image_url,
        collected_at: article.collected_at,
        included_in_email: article.included_in_email,
        ai_summary: article.description?.substring(0, 200) || "No summary available.",
        ai_category: article.category,
        ai_tags: [],
        ai_importance: 5,
        ai_sentiment: "neutral",
        key_takeaway: "",
        so_what: "",
        data_points: [],
        processed: true,
      });
    }

    // Groq free tier: 30 requests/minute — wait 2.5s between requests
    if (i < articles.length - 1) {
      await sleep(2500);
    }
  }

  logger.info(`AI processing complete: ${processed.length} articles processed`);
  return processed;
}
