import Groq from "groq-sdk";
import { logger } from "@/lib/utils/logger";
import { getSettings } from "@/lib/settings";
import type { Article } from "@/lib/database/firebase";

export interface ToolOfTheDayData {
  title: string;
  link: string;
  source: string;
  ai_summary: string | null;
  ai_importance: number;
  ai_tags: string[] | null;
  key_takeaway: string | null;
}

export interface SpeedReadItem {
  title: string;
  link: string;
  one_liner: string;
  source: string;
}

export interface DeepDiveData {
  title: string;
  link: string;
  source: string;
  content: string;
}

export interface PaperOfTheDayData {
  title: string;
  link: string;
  source: string;
  plain_english: string;
  one_liner: string;
}

export interface DataPointItem {
  stat: string;
  context: string;
  source: string;
  link: string;
}

// Phase 3
export interface QuoteOfTheDayData {
  quote: string;
  attribution: string;
  source: string;
  link: string;
}

export interface RelatedReadItem {
  title: string;
  link: string;
  source: string;
}

export interface NewsletterData {
  subject_line: string;
  intro: string;
  top_story_highlight: string;
  tldr: string;
  weekly_trend: string;
  editors_take: string;
  speed_read: SpeedReadItem[];
  read_time_minutes: number;
  deep_dive: DeepDiveData | null;
  paper_of_the_day: PaperOfTheDayData | null;
  data_points: DataPointItem[];
  key_takeaways: string[];
  quote_of_the_day: QuoteOfTheDayData | null;
  related_reads: RelatedReadItem[];
  topStories: Article[];
  aiNews: Article[];
  techNews: Article[];
  securityNews: Article[];
  cloudNews: Article[];
  allArticles: Article[];
  /** IDs of articles already placed in a named section (top/ai/tech/security/cloud) */
  sectionArticleIds: Set<string>;
  toolOfTheDay: ToolOfTheDayData | null;
  generatedAt: string;
}

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");
  return new Groq({ apiKey });
}

function buildSpeedRead(sorted: Article[]): SpeedReadItem[] {
  return sorted.slice(0, 10).map((a) => ({
    title: a.title,
    link: a.link,
    one_liner: a.key_takeaway || a.ai_summary?.split(".")[0] || a.title,
    source: a.source,
  }));
}

function estimateReadTime(articles: Article[]): number {
  const totalWords = articles.reduce((sum, a) => {
    const text = (a.ai_summary || "") + " " + (a.key_takeaway || "");
    return sum + text.split(/\s+/).length;
  }, 0);
  return Math.max(3, Math.ceil(totalWords / 230));
}

function articleId(a: Article): string {
  return a.guid || a.link;
}

function categorizeArticles(sorted: Article[]) {
  const usedIds = new Set<string>();

  const topStories = sorted.slice(0, 5);
  topStories.forEach((a) => usedIds.add(articleId(a)));

  const aiNews = sorted
    .filter((a) => a.ai_category?.includes("ai") && !usedIds.has(articleId(a)))
    .slice(0, 7);
  aiNews.forEach((a) => usedIds.add(articleId(a)));

  const securityNews = sorted
    .filter((a) =>
      !usedIds.has(articleId(a)) && (
        a.ai_category === "cybersecurity" ||
        a.category === "cybersecurity" ||
        (a.source && /security|hacker news.*security|netsec/i.test(a.source))
      )
    )
    .slice(0, 5);
  securityNews.forEach((a) => usedIds.add(articleId(a)));

  const cloudNews = sorted
    .filter((a) =>
      !usedIds.has(articleId(a)) && (
        a.ai_category === "cloud" ||
        a.category === "cloud" ||
        (a.source && /aws|gcp|azure|cncf|new stack/i.test(a.source))
      )
    )
    .slice(0, 5);
  cloudNews.forEach((a) => usedIds.add(articleId(a)));

  const techNews = sorted
    .filter((a) => !usedIds.has(articleId(a)) && !a.ai_category?.includes("ai"))
    .slice(0, 7);
  techNews.forEach((a) => usedIds.add(articleId(a)));

  return { topStories, aiNews, techNews, securityNews, cloudNews, usedIds };
}

async function generateEditorsTake(
  groq: Groq,
  articlesContext: string,
  today: string
): Promise<string> {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `You are the sharp-eyed editor of "AI & Tech Daily". Based on today's stories, write a short editorial opinion piece (3-5 sentences).

Today: ${today}
Stories:
${articlesContext}

Rules:
- Pick 2-3 stories that share a THEME and connect them into a narrative.
- Take a clear POSITION or make a PREDICTION. Don't be wishy-washy.
- Write as if you're a veteran tech analyst talking to a smart colleague over coffee.
- End with a forward-looking question or provocative thought.
- Do NOT use markdown. Do NOT use bullet points. Write in flowing prose.
- Return ONLY the editorial text, nothing else. No JSON.`,
        },
      ],
      temperature: 0.85,
      max_tokens: 400,
    });

    const text = response.choices[0]?.message?.content?.trim() || "";
    if (text.length > 50) return text;
  } catch (error) {
    logger.warn(`Editor's Take generation failed: ${(error as Error).message}`);
  }
  return "";
}

async function generateDeepDive(
  groq: Groq,
  article: Article
): Promise<DeepDiveData | null> {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `You are a senior tech analyst writing a "Deep Dive" segment for the newsletter "AI & Tech Daily".

ARTICLE:
Title: ${article.title}
Source: ${article.source}
Summary: ${article.ai_summary || article.description}
Full content snippet: ${(article.content || article.description || "").substring(0, 3000)}
Category: ${article.ai_category}
Why it matters: ${(article as any).so_what || ""}

Write a 300-500 word deep dive analysis covering:
1. WHAT HAPPENED — State the facts clearly in 2-3 sentences.
2. TECHNICAL CONTEXT — Explain the underlying technology, how it works, or what it builds on. Be specific (name architectures, protocols, standards). 3-5 sentences.
3. WHO THIS AFFECTS — Identify the specific groups impacted: developers, enterprises, consumers, startups, regulators, etc. 2-3 sentences with concrete examples.
4. WHAT HAPPENS NEXT — Make 1-2 specific predictions or identify the next domino to fall. Be bold but grounded.

Rules:
- Write in flowing prose, NOT bullet points.
- Use paragraph breaks between the four sections but do NOT include section headers.
- Tone: authoritative, specific, zero fluff — like a Stratechery analysis or Benedict Evans essay.
- Do NOT use markdown formatting of any kind.
- Return ONLY the analysis text, nothing else.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const text = response.choices[0]?.message?.content?.trim() || "";
    if (text.length > 100) {
      return {
        title: article.title,
        link: article.link,
        source: article.source,
        content: text,
      };
    }
  } catch (error) {
    logger.warn(`Deep Dive generation failed: ${(error as Error).message}`);
  }
  return null;
}

async function generatePaperOfTheDay(
  groq: Groq,
  articles: Article[]
): Promise<PaperOfTheDayData | null> {
  const researchArticle = articles.find(
    (a) =>
      a.ai_category === "ai_research" ||
      (a.source && /arxiv|deepmind|anthropic.*blog|meta ai/i.test(a.source))
  );
  if (!researchArticle) return null;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `You are explaining a research paper/finding to a smart developer who has no ML PhD.

PAPER/ARTICLE:
Title: ${researchArticle.title}
Source: ${researchArticle.source}
Summary: ${researchArticle.ai_summary || researchArticle.description}
Content: ${(researchArticle.content || researchArticle.description || "").substring(0, 2500)}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "plain_english": "4-6 sentence ELI5 explanation. Start with what the researchers set out to do. Then explain the key idea in plain language (use analogies if helpful). Then state the result and why it's significant. End with what it means practically for developers or the industry.",
  "one_liner": "One catchy sentence a developer would tweet about this paper."
}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    const responseText = response.choices[0]?.message?.content || "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: researchArticle.title,
        link: researchArticle.link,
        source: researchArticle.source,
        plain_english: parsed.plain_english || "",
        one_liner: parsed.one_liner || "",
      };
    }
  } catch (error) {
    logger.warn(`Paper of the Day generation failed: ${(error as Error).message}`);
  }
  return null;
}

function collectDataPoints(articles: Article[]): DataPointItem[] {
  const points: DataPointItem[] = [];
  for (const a of articles) {
    const dp = (a as any).data_points as string[] | undefined;
    if (dp && dp.length > 0) {
      for (const stat of dp) {
        if (stat && stat.length > 2 && stat.length < 120) {
          points.push({
            stat,
            context: a.title,
            source: a.source,
            link: a.link,
          });
        }
      }
    }
    if (points.length >= 6) break;
  }
  return points.slice(0, 4);
}

export async function composeNewsletter(
  articles: Article[]
): Promise<NewsletterData> {
  const sorted = [...articles].sort(
    (a, b) => (b.ai_importance || 0) - (a.ai_importance || 0)
  );

  const { topStories, aiNews, techNews, securityNews, cloudNews, usedIds } = categorizeArticles(sorted);
  const speedRead = buildSpeedRead(sorted);
  const readTime = estimateReadTime(sorted.slice(0, 20));

  let toolOfTheDay: ToolOfTheDayData | null = null;
  try {
    const settings = await getSettings();
    if (settings.showToolOfTheDay) {
      const toolArticle = sorted.find((a) => a.ai_category === "ai_tool");
      if (toolArticle) {
        toolOfTheDay = {
          title: toolArticle.title,
          link: toolArticle.link,
          source: toolArticle.source,
          ai_summary: toolArticle.ai_summary,
          ai_importance: toolArticle.ai_importance,
          ai_tags: toolArticle.ai_tags,
          key_takeaway: toolArticle.key_takeaway,
        };
        logger.info(`Tool of the Day: "${toolArticle.title}"`);
      }
    }
  } catch {
    // skip
  }

  const articlesContext = sorted
    .slice(0, 15)
    .map(
      (a) =>
        `Title: ${a.title}\nSummary: ${a.ai_summary || a.description}\nCategory: ${a.ai_category}\nSource: ${a.source}\nImportance: ${a.ai_importance}/10\nSentiment: ${a.ai_sentiment}`
    )
    .join("\n\n");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dataPoints = collectDataPoints(sorted);

  const fallback: NewsletterData = {
    subject_line: `🤖 AI & Tech Daily — ${today}`,
    intro: `Good morning! Here's your curated roundup of the most important AI and tech stories from the past 24 hours.`,
    top_story_highlight:
      topStories[0]?.ai_summary || "Check out today's top stories below.",
    tldr: "Another busy day in tech — here are the stories that matter.",
    weekly_trend: "",
    editors_take: "",
    speed_read: speedRead,
    read_time_minutes: readTime,
    deep_dive: null,
    paper_of_the_day: null,
    data_points: dataPoints,
    key_takeaways: [],
    quote_of_the_day: null,
    related_reads: [],
    topStories,
    aiNews,
    techNews,
    securityNews,
    cloudNews,
    allArticles: sorted,
    sectionArticleIds: usedIds,
    toolOfTheDay,
    generatedAt: new Date().toISOString(),
  };

  try {
    const groq = getGroqClient();

    const [compositionRes, editorsTake, deepDive, paperOfTheDay] = await Promise.all([
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `You are the editor of "AI & Tech Daily", a newsletter read by tech professionals.
Based on today's top stories, write newsletter content. Return ONLY valid JSON.

Today's date: ${today}
Today's top stories:
${articlesContext}

Return this JSON:
{
  "subject_line": "A catchy email subject with one emoji (under 60 chars)",
  "intro": "2-3 sentence greeting mentioning what's big in tech today. Conversational, smart tone.",
  "top_story_highlight": "2-3 sentences about the biggest story today. Why it matters.",
  "tldr": "One punchy sentence summarizing today in tech.",
  "weekly_trend": "Analyze the themes across these stories. What patterns do you see? What's the bigger narrative in tech this week? 2-3 sentences identifying trends (e.g., 'AI regulation is heating up', 'Big tech is pivoting to open source'). Be insightful and forward-looking."
}

Tone: Sharp, witty, no fluff — like Benedict Evans meets Stratechery.
Do NOT use markdown in any of the values.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
      generateEditorsTake(groq, articlesContext, today),
      topStories[0] ? generateDeepDive(groq, topStories[0]) : Promise.resolve(null),
      generatePaperOfTheDay(groq, sorted),
    ]);

    const responseText = compositionRes.choices[0]?.message?.content || "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const aiContent = JSON.parse(jsonMatch[0]);
      logger.info(`Newsletter composed: "${aiContent.subject_line}"`);

      return {
        subject_line: aiContent.subject_line,
        intro: aiContent.intro,
        top_story_highlight: aiContent.top_story_highlight,
        tldr: aiContent.tldr,
        weekly_trend: aiContent.weekly_trend || "",
        editors_take: editorsTake,
        speed_read: speedRead,
        read_time_minutes: readTime,
        deep_dive: deepDive,
        paper_of_the_day: paperOfTheDay,
        data_points: dataPoints,
        key_takeaways: [],
        quote_of_the_day: null,
        related_reads: [],
        topStories,
        aiNews,
        techNews,
        securityNews,
        cloudNews,
        allArticles: sorted,
        sectionArticleIds: usedIds,
        toolOfTheDay,
        generatedAt: new Date().toISOString(),
      };
    }
  } catch (error) {
    logger.error(`Newsletter composition failed: ${(error as Error).message}`);
  }

  return fallback;
}
