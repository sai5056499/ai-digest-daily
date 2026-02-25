export interface RSSSource {
  name: string;
  url: string;
  category: string;
  priority: "high" | "medium" | "low";
}

export const RSS_SOURCES: Record<string, RSSSource[]> = {
  ai_news: [
    {
      name: "TechCrunch AI",
      url: "https://techcrunch.com/category/artificial-intelligence/feed/",
      category: "ai",
      priority: "high",
    },
    {
      name: "The Verge AI",
      url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
      category: "ai",
      priority: "high",
    },
    {
      name: "VentureBeat AI",
      url: "https://venturebeat.com/category/ai/feed/",
      category: "ai",
      priority: "high",
    },
    {
      name: "The Decoder",
      url: "https://the-decoder.com/feed/",
      category: "ai",
      priority: "medium",
    },
    {
      name: "AI News",
      url: "https://www.artificialintelligence-news.com/feed/",
      category: "ai",
      priority: "medium",
    },
    {
      name: "OpenAI Blog",
      url: "https://openai.com/blog/rss/",
      category: "ai_research",
      priority: "high",
    },
    {
      name: "Google AI Blog",
      url: "https://blog.google/technology/ai/rss/",
      category: "ai_research",
      priority: "high",
    },
    {
      name: "Hugging Face Blog",
      url: "https://huggingface.co/blog/feed.xml",
      category: "ai_tools",
      priority: "medium",
    },
    {
      name: "Unite.AI",
      url: "https://www.unite.ai/feed/",
      category: "ai",
      priority: "medium",
    },
    {
      name: "Anthropic Blog",
      url: "https://www.anthropic.com/blog/rss",
      category: "ai_research",
      priority: "high",
    },
    {
      name: "Meta AI Blog",
      url: "https://ai.meta.com/blog/rss/",
      category: "ai_research",
      priority: "high",
    },
    {
      name: "DeepMind Blog",
      url: "https://deepmind.google/blog/rss.xml",
      category: "ai_research",
      priority: "high",
    },
  ],

  general_tech: [
    {
      name: "TechCrunch",
      url: "https://techcrunch.com/feed/",
      category: "tech",
      priority: "high",
    },
    {
      name: "The Verge",
      url: "https://www.theverge.com/rss/index.xml",
      category: "tech",
      priority: "high",
    },
    {
      name: "Ars Technica",
      url: "https://feeds.arstechnica.com/arstechnica/index",
      category: "tech",
      priority: "medium",
    },
    {
      name: "Wired",
      url: "https://www.wired.com/feed/rss",
      category: "tech",
      priority: "medium",
    },
    {
      name: "Hacker News Best",
      url: "https://hnrss.org/best",
      category: "tech",
      priority: "high",
    },
    {
      name: "InfoQ",
      url: "https://feed.infoq.com/",
      category: "tech",
      priority: "medium",
    },
  ],

  cybersecurity: [
    {
      name: "The Hacker News (Security)",
      url: "https://feeds.feedburner.com/TheHackersNews",
      category: "cybersecurity",
      priority: "high",
    },
    {
      name: "Krebs on Security",
      url: "https://krebsonsecurity.com/feed/",
      category: "cybersecurity",
      priority: "high",
    },
    {
      name: "Dark Reading",
      url: "https://www.darkreading.com/rss.xml",
      category: "cybersecurity",
      priority: "medium",
    },
    {
      name: "Schneier on Security",
      url: "https://www.schneier.com/feed/",
      category: "cybersecurity",
      priority: "medium",
    },
    {
      name: "BleepingComputer",
      url: "https://www.bleepingcomputer.com/feed/",
      category: "cybersecurity",
      priority: "medium",
    },
  ],

  cloud_devops: [
    {
      name: "AWS What's New",
      url: "https://aws.amazon.com/about-aws/whats-new/recent/feed/",
      category: "cloud",
      priority: "high",
    },
    {
      name: "Google Cloud Blog",
      url: "https://cloud.google.com/blog/rss",
      category: "cloud",
      priority: "medium",
    },
    {
      name: "The New Stack",
      url: "https://thenewstack.io/feed",
      category: "cloud",
      priority: "medium",
    },
    {
      name: "CNCF Blog",
      url: "https://www.cncf.io/blog/feed/",
      category: "cloud",
      priority: "medium",
    },
  ],

  dev_community: [
    {
      name: "DEV.to",
      url: "https://dev.to/feed",
      category: "dev_community",
      priority: "medium",
    },
    {
      name: "Lobsters",
      url: "https://lobste.rs/rss",
      category: "dev_community",
      priority: "medium",
    },
    {
      name: "YC Blog",
      url: "https://www.ycombinator.com/blog/rss/",
      category: "startup",
      priority: "high",
    },
    {
      name: "a16z Blog",
      url: "https://a16z.com/feed/",
      category: "startup",
      priority: "high",
    },
  ],

  product_launches: [
    {
      name: "Product Hunt",
      url: "https://www.producthunt.com/feed",
      category: "products",
      priority: "medium",
    },
  ],

  research: [
    {
      name: "arXiv CS.AI",
      url: "https://arxiv.org/rss/cs.AI",
      category: "ai_research",
      priority: "medium",
    },
    {
      name: "arXiv CS.LG",
      url: "https://arxiv.org/rss/cs.LG",
      category: "ai_research",
      priority: "medium",
    },
    {
      name: "arXiv CS.CL",
      url: "https://arxiv.org/rss/cs.CL",
      category: "ai_research",
      priority: "medium",
    },
  ],
};

// Flatten all sources into a single array
export function getAllSources(): RSSSource[] {
  return Object.values(RSS_SOURCES).flat();
}

// Reddit subreddits to monitor
export const REDDIT_SUBREDDITS = [
  "artificial",
  "MachineLearning",
  "technology",
  "singularity",
  "netsec",
  "devops",
  "programming",
];

// Hacker News settings
export const HN_CONFIG = {
  topStoriesLimit: 30,
  minScore: 50, // only include stories with this minimum score
};
