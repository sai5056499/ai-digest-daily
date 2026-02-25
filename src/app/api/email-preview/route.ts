import { NextRequest, NextResponse } from "next/server";
import { renderDailyDigest, type EmailTheme } from "@/lib/delivery/templates/dailyDigest";

const now = new Date().toISOString();
const h = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString();

const topStories = [
  {
    title: "OpenAI Announces Next-Gen Reasoning Models with Breakthrough Performance",
    link: "https://example.com/1",
    source: "TechCrunch",
    ai_importance: 9,
    ai_summary:
      "OpenAI has unveiled its latest reasoning models that demonstrate significant improvements in complex problem-solving, coding, and mathematical reasoning tasks. The new models achieve state-of-the-art results on every major benchmark, with particularly dramatic gains on graduate-level science and competition math.",
    so_what:
      "This could reshape how developers build AI-powered applications, making advanced reasoning accessible through simple API calls. Expect a wave of new coding tools and autonomous agents within weeks.",
    ai_tags: ["openai", "reasoning", "llm", "o3"],
    ai_category: "ai_breakthrough",
    ai_sentiment: "positive",
    key_takeaway: "OpenAI's new reasoning models set records on every benchmark, signaling a step-change in what AI can do out of the box.",
    data_points: ["92% on GPQA Diamond", "$200/month Pro tier", "3x faster than o1"],
    published_at: now,
    description: "", content: "", category: "ai_news", priority: "high",
    guid: "ex-1", author: "", image_url: null, collected_at: now, processed: true, included_in_email: true,
  },
  {
    title: "Google DeepMind Releases AlphaFold 4 for Universal Protein Design",
    link: "https://example.com/2",
    source: "The Verge",
    ai_importance: 8,
    ai_summary:
      "DeepMind's latest AlphaFold iteration can now design entirely new proteins from scratch, opening doors for drug discovery, materials science, and synthetic biology applications.",
    so_what:
      "Pharmaceutical companies could cut drug development timelines by years. This is the biotech moment the industry has been waiting for.",
    ai_tags: ["deepmind", "biotech", "alphafold", "research"],
    ai_category: "ai_research",
    ai_sentiment: "positive",
    key_takeaway: "AlphaFold 4 moves from predicting protein structures to designing them from scratch.",
    data_points: ["200M protein structures designed", "$4.5B drug pipeline impact"],
    published_at: h(1),
    description: "", content: "", category: "ai_news", priority: "high",
    guid: "ex-2", author: "", image_url: null, collected_at: now, processed: true, included_in_email: true,
  },
  {
    title: "Meta Open-Sources Llama 4 with Native Multimodal Understanding",
    link: "https://example.com/3",
    source: "Ars Technica",
    ai_importance: 8,
    ai_summary:
      "Meta has released Llama 4 under a permissive license, featuring built-in vision, audio, and video capabilities. The model matches GPT-4o on most benchmarks while being fully open-weight.",
    so_what:
      "Open-source AI just got a massive boost. Developers can now build multimodal applications without relying on proprietary APIs or paying per-token costs.",
    ai_tags: ["meta", "open-source", "multimodal", "llama"],
    ai_category: "ai_breakthrough",
    ai_sentiment: "positive",
    key_takeaway: "Llama 4 matches GPT-4o while being fully open-weight and free for commercial use.",
    data_points: ["405B parameters", "128K context window"],
    published_at: h(2),
    description: "", content: "", category: "ai_news", priority: "high",
    guid: "ex-3", author: "", image_url: null, collected_at: now, processed: true, included_in_email: true,
  },
  {
    title: "EU Parliament Passes Landmark AI Liability Directive",
    link: "https://example.com/13",
    source: "Reuters",
    ai_importance: 7,
    ai_summary:
      "The European Parliament has approved the AI Liability Directive, establishing clear rules for holding AI providers accountable for harm caused by their systems. The directive creates a presumption of causality for high-risk AI applications.",
    so_what:
      "Every company deploying AI in Europe needs to review their liability insurance and documentation practices. This is the most significant AI regulation since the EU AI Act.",
    ai_tags: ["eu", "regulation", "liability", "policy"],
    ai_category: "tech_news",
    ai_sentiment: "neutral",
    key_takeaway: "EU creates legal presumption that AI providers are liable for harm from high-risk systems.",
    data_points: null,
    published_at: h(3),
    description: "", content: "", category: "tech_news", priority: "high",
    guid: "ex-13", author: "", image_url: null, collected_at: now, processed: true, included_in_email: true,
  },
];

const aiNews = [
  {
    title: "Anthropic Ships Claude with Persistent Memory Across Conversations",
    link: "https://example.com/4",
    source: "Ars Technica",
    ai_importance: 7,
    ai_summary:
      "Claude can now remember context and preferences across separate conversations, moving closer to truly personalized AI assistants that understand your workflow over time.",
    ai_category: "ai_tool",
    ai_sentiment: "positive",
    key_takeaway: "Claude now remembers you between conversations, making it a true AI assistant rather than a stateless chatbot.",
    data_points: ["30-day memory window"],
    published_at: h(2),
    description: "", content: "", category: "ai_news", priority: "high",
    guid: "ex-4", author: "", image_url: null, collected_at: now, processed: true, included_in_email: true,
    ai_tags: ["anthropic", "claude", "memory"], so_what: null,
  },
  {
    title: "Hugging Face Launches Open-Source Alternative to GPT-4 Vision",
    link: "https://example.com/5",
    source: "VentureBeat",
    ai_importance: 6,
    ai_summary:
      "The new open-source multimodal model matches proprietary alternatives on most benchmarks while being freely available for commercial use.",
    ai_category: "ai_tool",
    ai_sentiment: "positive",
    key_takeaway: "Open-source vision models are now competitive with GPT-4V for most practical use cases.",
    data_points: null,
    published_at: h(3),
    description: "", content: "", category: "ai_news", priority: "medium",
    guid: "ex-5", author: "", image_url: null, collected_at: now, processed: true, included_in_email: true,
    ai_tags: ["huggingface", "open-source", "vision"], so_what: null,
  },
  {
    title: "Stability AI Releases Video Generation Model Rivaling Sora",
    link: "https://example.com/6",
    source: "Wired",
    ai_importance: 6,
    ai_summary:
      "Stable Video 3.0 generates photorealistic 30-second clips from text prompts with unprecedented temporal consistency and motion control.",
    ai_category: "ai_tool",
    ai_sentiment: "positive",
    key_takeaway: "Text-to-video just became practical for content creators with Stable Video 3.0.",
    data_points: ["30-second clips", "1080p output"],
    published_at: h(4),
    description: "", content: "", category: "ai_news", priority: "medium",
    guid: "ex-6", author: "", image_url: null, collected_at: now, processed: true, included_in_email: true,
    ai_tags: ["stability-ai", "video", "generative"], so_what: null,
  },
];

const techNews = [
  {
    title: "Apple Reportedly Testing Foldable iPhone Prototype for 2027 Launch",
    link: "https://example.com/7",
    source: "Wired",
    ai_importance: 6,
    ai_summary:
      "Multiple supply chain sources confirm Apple has advanced prototypes of a foldable iPhone with crease-free display technology surpassing current Samsung foldables.",
    ai_category: "gadgets",
    ai_sentiment: "positive",
    key_takeaway: "Apple's foldable iPhone targets 2027 with display tech that eliminates the visible crease.",
    data_points: null,
    published_at: h(4),
    description: "", content: "", category: "tech_news", priority: "medium",
    guid: "ex-7", author: "", image_url: null, collected_at: now, processed: true, included_in_email: true,
    ai_tags: ["apple", "foldable", "iphone"], so_what: null,
  },
  {
    title: "Stripe Acquires AI-Powered Fintech Startup for $1.2B",
    link: "https://example.com/8",
    source: "TechCrunch",
    ai_importance: 5,
    ai_summary:
      "Stripe continues its AI acquisition spree, adding automated fraud detection and intelligent payment routing to its platform capabilities.",
    ai_category: "startup",
    ai_sentiment: "positive",
    key_takeaway: "Stripe bets big on AI-powered fraud detection with its largest acquisition ever.",
    data_points: ["$1.2B acquisition price"],
    published_at: h(5),
    description: "", content: "", category: "tech_news", priority: "medium",
    guid: "ex-8", author: "", image_url: null, collected_at: now, processed: true, included_in_email: true,
    ai_tags: ["stripe", "fintech", "acquisition"], so_what: null,
  },
];

const securityNews = [
  {
    title: "Critical Zero-Day in Popular NPM Package Affects 15M Downloads",
    link: "https://example.com/9",
    source: "The Hacker News (Security)",
    ai_importance: 8,
    ai_summary:
      "A critical remote code execution vulnerability has been discovered in a widely-used NPM authentication library. Attackers are actively exploiting the flaw in the wild. Patches are available.",
    ai_category: "cybersecurity",
    ai_sentiment: "negative",
    key_takeaway: "Patch your auth-jwt-utils NPM package immediately — RCE is being exploited in the wild.",
    data_points: ["15M weekly downloads", "CVE-2026-1847"],
    published_at: h(1),
    description: "", content: "", category: "cybersecurity", priority: "high",
    guid: "ex-9", author: "", image_url: null, collected_at: now, processed: true, included_in_email: true,
    ai_tags: ["npm", "zero-day", "rce", "supply-chain"], so_what: null,
  },
  {
    title: "NIST Publishes Final Post-Quantum Cryptography Standards",
    link: "https://example.com/10",
    source: "Krebs on Security",
    ai_importance: 7,
    ai_summary:
      "NIST has finalized three post-quantum cryptography standards (ML-KEM, ML-DSA, SLH-DSA), giving organizations concrete algorithms to begin their quantum-safe migration.",
    ai_category: "cybersecurity",
    ai_sentiment: "positive",
    key_takeaway: "The post-quantum crypto standards are final — migration planning should start now.",
    data_points: ["3 algorithms standardized"],
    published_at: h(3),
    description: "", content: "", category: "cybersecurity", priority: "high",
    guid: "ex-10", author: "", image_url: null, collected_at: now, processed: true, included_in_email: true,
    ai_tags: ["nist", "post-quantum", "cryptography"], so_what: null,
  },
];

const cloudNews = [
  {
    title: "AWS Launches Next-Gen Graviton5 Instances with 2x Price-Performance",
    link: "https://example.com/11",
    source: "AWS What's New",
    ai_importance: 7,
    ai_summary:
      "Amazon's custom Graviton5 ARM chips deliver 2x the price-performance of Graviton3 for compute-intensive workloads, with native support for FP8 inference.",
    ai_category: "cloud",
    ai_sentiment: "positive",
    key_takeaway: "Graviton5 makes ARM the default for cost-conscious cloud workloads — x86 instances are now the premium option.",
    data_points: ["2x price-performance vs Graviton3", "FP8 inference support"],
    published_at: h(2),
    description: "", content: "", category: "cloud", priority: "high",
    guid: "ex-11", author: "", image_url: null, collected_at: now, processed: true, included_in_email: true,
    ai_tags: ["aws", "graviton", "arm", "cloud"], so_what: null,
  },
  {
    title: "Kubernetes 1.33 Ships with Built-In Service Mesh and eBPF Networking",
    link: "https://example.com/12",
    source: "The New Stack",
    ai_importance: 6,
    ai_summary:
      "The latest Kubernetes release integrates sidecar-free service mesh using eBPF, eliminating the need for Istio or Linkerd in many common deployments.",
    ai_category: "devops",
    ai_sentiment: "positive",
    key_takeaway: "K8s 1.33 makes Istio optional for most service mesh use cases with native eBPF networking.",
    data_points: ["40% reduction in pod resource overhead"],
    published_at: h(4),
    description: "", content: "", category: "cloud", priority: "medium",
    guid: "ex-12", author: "", image_url: null, collected_at: now, processed: true, included_in_email: true,
    ai_tags: ["kubernetes", "ebpf", "service-mesh"], so_what: null,
  },
];

const quickLinkArticles = [
  { title: "Rust 2.0 Edition Released with Major Async Improvements", link: "https://example.com/ql1", source: "Lobsters", ai_importance: 5, ai_category: "dev_community", ai_summary: "", published_at: h(5), description: "", content: "", category: "dev_community", priority: "medium", guid: "ql-1", author: "", image_url: null, collected_at: now, processed: true, included_in_email: true, ai_tags: null, ai_sentiment: null, key_takeaway: null, data_points: null, so_what: null },
  { title: "Docker Desktop Adds AI-Powered Container Debugging", link: "https://example.com/ql2", source: "DEV.to", ai_importance: 4, ai_category: "devops", ai_summary: "", published_at: h(6), description: "", content: "", category: "dev_community", priority: "medium", guid: "ql-2", author: "", image_url: null, collected_at: now, processed: true, included_in_email: true, ai_tags: null, ai_sentiment: null, key_takeaway: null, data_points: null, so_what: null },
  { title: "VS Code February Update: Inline Chat Gets Multi-File Editing", link: "https://example.com/ql3", source: "InfoQ", ai_importance: 4, ai_category: "dev_community", ai_summary: "", published_at: h(6), description: "", content: "", category: "dev_community", priority: "medium", guid: "ql-3", author: "", image_url: null, collected_at: now, processed: true, included_in_email: true, ai_tags: null, ai_sentiment: null, key_takeaway: null, data_points: null, so_what: null },
  { title: "Deno 3.0 Launches with Full Node.js Compatibility", link: "https://example.com/ql4", source: "Hacker News", ai_importance: 5, ai_category: "dev_community", ai_summary: "", published_at: h(7), description: "", content: "", category: "dev_community", priority: "medium", guid: "ql-4", author: "", image_url: null, collected_at: now, processed: true, included_in_email: true, ai_tags: null, ai_sentiment: null, key_takeaway: null, data_points: null, so_what: null },
  { title: "GitHub Copilot Workspace Exits Beta, Now Free for All Users", link: "https://example.com/ql5", source: "GitHub Blog", ai_importance: 5, ai_category: "ai_tool", ai_summary: "", published_at: h(7), description: "", content: "", category: "ai_news", priority: "medium", guid: "ql-5", author: "", image_url: null, collected_at: now, processed: true, included_in_email: true, ai_tags: null, ai_sentiment: null, key_takeaway: null, data_points: null, so_what: null },
];

const allArticles = [...topStories, ...aiNews, ...techNews, ...securityNews, ...cloudNews, ...quickLinkArticles] as any[];

const sectionArticleIds = new Set(
  [...topStories, ...aiNews, ...techNews, ...securityNews, ...cloudNews].map((a) => a.guid || a.link)
);

const SAMPLE_DATA = {
  subject_line: "🤖 AI & Tech Daily — Your Morning Brief",
  intro:
    "Good morning. Here's what happened in AI and tech overnight — the stories that matter, the noise filtered out. Three major developments stand out today, led by a breakthrough in reasoning models that could reshape how we build software.",
  top_story_highlight:
    "OpenAI has unveiled its latest reasoning models that demonstrate significant improvements in complex problem-solving, coding, and mathematical reasoning tasks.",
  tldr: "OpenAI ships next-gen reasoning models, Google DeepMind cracks universal protein design, and Anthropic adds persistent memory to Claude. Plus: Apple testing foldable iPhone prototypes for 2027.",
  weekly_trend:
    "Open-source AI models are closing the gap with proprietary alternatives faster than predicted. Three major open-weight releases this week alone suggest the moat is shrinking — and the real competition is shifting to inference speed, tool-use, and post-training customization.",
  editors_take:
    "What strikes me most about today's news isn't any single announcement — it's the convergence. OpenAI pushes reasoning capabilities forward, Meta commoditizes multimodal AI through open-source, and Anthropic bets on persistent memory as the differentiator. We're watching the AI industry bifurcate in real time: one camp competes on raw model intelligence, the other on the relationship layer — memory, personalization, workflow integration. The interesting question isn't who wins the benchmark race, but whether users will pay more for an AI that remembers them than one that scores 3% higher on GPQA.",
  speed_read: [
    { title: "OpenAI Announces Next-Gen Reasoning Models", link: "https://example.com/1", one_liner: "New models set records on every major benchmark, with dramatic gains on graduate-level science.", source: "TechCrunch" },
    { title: "Google DeepMind Releases AlphaFold 4", link: "https://example.com/2", one_liner: "AlphaFold can now design entirely new proteins from scratch, not just predict structures.", source: "The Verge" },
    { title: "Meta Open-Sources Llama 4", link: "https://example.com/3", one_liner: "Matches GPT-4o on benchmarks, fully open-weight with native multimodal capabilities.", source: "Ars Technica" },
    { title: "Anthropic Ships Claude with Persistent Memory", link: "https://example.com/4", one_liner: "Claude now remembers context across conversations — personalized AI assistants are here.", source: "Ars Technica" },
    { title: "Critical NPM Zero-Day Affects 15M Downloads", link: "https://example.com/9", one_liner: "Active exploitation of RCE in auth-jwt-utils. Patch immediately.", source: "The Hacker News" },
    { title: "AWS Launches Graviton5 Instances", link: "https://example.com/11", one_liner: "2x price-performance of Graviton3 with native FP8 inference support.", source: "AWS" },
    { title: "EU Passes AI Liability Directive", link: "https://example.com/13", one_liner: "Legal presumption that AI providers are liable for harm from high-risk systems.", source: "Reuters" },
    { title: "Kubernetes 1.33 Ships with Built-In Service Mesh", link: "https://example.com/12", one_liner: "eBPF networking makes Istio optional for most deployments.", source: "The New Stack" },
  ],
  read_time_minutes: 6,
  deep_dive: {
    title: "OpenAI Announces Next-Gen Reasoning Models with Breakthrough Performance",
    link: "https://example.com/1",
    source: "TechCrunch",
    content: `OpenAI has released its next generation of reasoning-focused models, codenamed internally as the "o3" family. The models achieve 92% on GPQA Diamond (up from 78%), solve 71% of SWE-bench verified coding problems, and score in the 99th percentile on competition mathematics — all significant jumps over their predecessors.

The technical approach builds on chain-of-thought reasoning but introduces what OpenAI calls "deliberative alignment" — the model explicitly references its safety training during its reasoning process, producing more reliable and grounded outputs. The architecture also incorporates a novel "think-then-verify" loop where the model generates a candidate answer, critiques its own reasoning, and revises before returning a final response. This self-verification step is what drives the benchmark improvements, particularly on multi-step problems.

For developers, the immediate impact is substantial. The new models can handle complex refactoring tasks, multi-file code generation, and architectural reasoning that previous models struggled with. Enterprise customers running internal coding assistants should expect meaningful productivity gains. For AI startups building on top of OpenAI's APIs, this raises the bar — thin wrapper products that add little value beyond the base model are increasingly vulnerable as the foundation models get smarter.

Expect Google DeepMind and Anthropic to respond within weeks. The reasoning model race is now the primary battleground in AI, having shifted away from the raw scale competition of 2024. The key question is whether these capabilities will trickle down to smaller, cheaper models quickly enough to commoditize before OpenAI can capture the premium market.`,
  },
  paper_of_the_day: {
    title: "Scaling Sparse Autoencoders to GPT-4 Level Models: Understanding Features at Scale",
    link: "https://arxiv.org/abs/2406.XXXXX",
    source: "arXiv CS.LG",
    plain_english: "Researchers at Anthropic wanted to understand what's actually happening inside large language models — not just what they output, but what concepts they've learned internally. They trained 'sparse autoencoders' (think of them as X-ray machines for neural networks) on a GPT-4-class model and discovered that the model has learned millions of distinct, interpretable features — from specific programming concepts to abstract reasoning patterns. The key finding is that these features are much more organized than previously thought: they form hierarchical clusters that mirror how humans categorize knowledge. This matters because it's the first evidence that we can systematically audit what a frontier model knows and how it reasons, which is a prerequisite for truly trustworthy AI.",
    one_liner: "We can now see inside GPT-4's brain, and it turns out the concepts it learned are surprisingly well-organized.",
  },
  data_points: [
    { stat: "92% on GPQA Diamond", context: "OpenAI Announces Next-Gen Reasoning Models", source: "TechCrunch", link: "https://example.com/1" },
    { stat: "$1.2B acquisition", context: "Stripe Acquires AI-Powered Fintech Startup", source: "TechCrunch", link: "https://example.com/8" },
    { stat: "15M weekly downloads affected", context: "Critical Zero-Day in Popular NPM Package", source: "The Hacker News", link: "https://example.com/9" },
    { stat: "2x price-performance", context: "AWS Launches Graviton5 Instances", source: "AWS", link: "https://example.com/11" },
  ],
  key_takeaways: [
    "OpenAI's new reasoning models set records on every major benchmark — expect a wave of smarter coding tools and agents.",
    "AlphaFold 4 moves from predicting protein structures to designing them from scratch; drug discovery timelines could shrink by years.",
    "Open-source AI (Llama 4, Claude memory) is closing the gap with proprietary APIs; the moat is shifting to inference and workflow.",
  ],
  quote_of_the_day: {
    quote: "The most profound technologies are those that disappear. They weave themselves into the fabric of everyday life until they are indistinguishable from it.",
    attribution: "Mark Weiser",
    source: "The Computer for the 21st Century",
    link: "https://example.com/weiser",
  },
  related_reads: [
    { title: "Why Reasoning Is the Next Frontier for AI", link: "https://example.com/related1", source: "MIT Tech Review" },
    { title: "Protein Design Beyond AlphaFold", link: "https://example.com/related2", source: "Nature" },
    { title: "The Economics of Open-Source AI", link: "https://example.com/related3", source: "a16z" },
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
    ai_summary:
      "AI-native IDE that integrates directly with your codebase for context-aware completions, multi-file edits, and natural language coding. Supports Claude, GPT-4, and custom models.",
    ai_importance: 8,
    ai_tags: ["cursor", "ide", "ai-coding"],
    key_takeaway:
      "Developers report 2-3x productivity gains on complex refactoring tasks compared to traditional editors with AI plugins.",
  },
  generatedAt: now,
};

export async function GET(request: NextRequest) {
  try {
    const themeParam = request.nextUrl.searchParams.get("theme") || "dark";
    const theme = ["dark", "light", "notion", "notionDark"].includes(themeParam)
      ? (themeParam as EmailTheme)
      : "dark";

    const html = renderDailyDigest({
      newsletter: SAMPLE_DATA as any,
      subscriberEmail: "preview@example.com",
      issueNumber: 42,
      unsubscribeToken: "preview",
      appUrl: "https://example.com",
      theme,
      toolOfTheDay: SAMPLE_DATA.toolOfTheDay,
    });

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("Email preview error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    const errorHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Preview Error</title></head><body style="font-family:system-ui;padding:2rem;background:#fafafa;color:#0a0a0a;"><h1>Preview failed</h1><p>${message}</p><p><a href="/email-preview">Try again</a></p></body></html>`;
    return new NextResponse(errorHtml, {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
