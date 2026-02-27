import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isFirebaseConfigured, getArticleById, getRelatedArticles } from "@/lib/database/firebase";
import ShareButtons from "./share-buttons";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  if (!isFirebaseConfigured()) {
    return { title: "Article | AI & Tech Daily" };
  }

  try {
    const article = await getArticleById(id);
    if (!article) return { title: "Not Found | AI & Tech Daily" };

    const description = article.ai_summary || article.key_takeaway || article.description;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return {
      title: `${article.title} | AI & Tech Daily`,
      description: description.substring(0, 160),
      openGraph: {
        title: article.title,
        description: description.substring(0, 160),
        type: "article",
        url: `${appUrl}/archive/${id}`,
        siteName: "AI & Tech Daily",
        publishedTime: article.published_at,
        authors: article.author ? [article.author] : undefined,
        tags: article.ai_tags || undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: article.title,
        description: description.substring(0, 160),
      },
    };
  } catch {
    return { title: "Article | AI & Tech Daily" };
  }
}

function importanceLabel(score: number): { text: string; color: string; bg: string } {
  if (score >= 9) return { text: "Critical", color: "#dc2626", bg: "#fef2f2" };
  if (score >= 7) return { text: "Important", color: "#f59e0b", bg: "#fffbeb" };
  if (score >= 5) return { text: "Notable", color: "#22c55e", bg: "#f0fdf4" };
  return { text: "Standard", color: "#a1a1aa", bg: "#f4f4f5" };
}

function sentimentLabel(sentiment: string | null): { text: string; color: string } | null {
  if (!sentiment) return null;
  const s = sentiment.toLowerCase();
  if (s === "positive") return { text: "Positive", color: "#22c55e" };
  if (s === "negative") return { text: "Negative", color: "#dc2626" };
  if (s === "neutral") return { text: "Neutral", color: "#71717a" };
  return { text: sentiment, color: "#71717a" };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;

  if (!isFirebaseConfigured()) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <p className="text-[14px] text-[#71717a]">Database not configured.</p>
      </div>
    );
  }

  const article = await getArticleById(id);
  if (!article) notFound();

  const importance = importanceLabel(article.ai_importance);
  const sentiment = sentimentLabel(article.ai_sentiment);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const articleUrl = `${appUrl}/archive/${id}`;

  let related: Awaited<ReturnType<typeof getRelatedArticles>> = [];
  if (article.ai_category) {
    try {
      related = await getRelatedArticles(article.ai_category, id, 4);
    } catch {
      // skip
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0a0a0a]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-3xl mx-auto">
        <Link href="/" className="text-[15px] font-semibold tracking-tight">
          ai&thinsp;&&thinsp;tech daily
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/archive" className="text-[13px] text-[#71717a] hover:text-[#0a0a0a] transition-colors">
            archive
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-[#a1a1aa] mb-6 font-mono">
          <Link href="/archive" className="hover:text-[#0a0a0a] transition-colors">Archive</Link>
          <span>/</span>
          {article.ai_category && (
            <>
              <Link
                href={`/archive?category=${article.ai_category}`}
                className="hover:text-[#0a0a0a] transition-colors"
              >
                {article.ai_category.replace(/_/g, " ")}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-[#71717a] truncate max-w-[200px]">{article.title}</span>
        </div>

        {/* Header */}
        <h1 className="text-[28px] sm:text-[34px] font-bold leading-[1.15] tracking-[-0.03em] mb-4">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#a1a1aa] mb-6 font-mono">
          <span className="text-[#71717a] font-medium">{article.source}</span>
          <span>&middot;</span>
          <span>{timeAgo(article.published_at)}</span>
          {article.author && (
            <>
              <span>&middot;</span>
              <span>{article.author}</span>
            </>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span
            className="px-2.5 py-1 rounded-md text-[11px] font-bold"
            style={{ color: importance.color, backgroundColor: importance.bg }}
          >
            {importance.text} ({article.ai_importance}/10)
          </span>
          {sentiment && (
            <span
              className="px-2.5 py-1 rounded-md text-[11px] font-medium border"
              style={{ color: sentiment.color, borderColor: sentiment.color + "40" }}
            >
              {sentiment.text}
            </span>
          )}
          {article.ai_category && (
            <span className="px-2.5 py-1 rounded-md text-[11px] font-medium text-[#71717a] bg-[#f4f4f5]">
              {article.ai_category.replace(/_/g, " ")}
            </span>
          )}
        </div>

        {/* Key Takeaway */}
        {article.key_takeaway && (
          <div className="p-4 rounded-xl bg-white border border-[#e4e4e7] mb-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#a1a1aa] mb-2 font-mono">
              Key Takeaway
            </div>
            <p className="text-[15px] text-[#0a0a0a] font-medium leading-relaxed">
              {article.key_takeaway}
            </p>
          </div>
        )}

        {/* AI Summary */}
        {article.ai_summary && (
          <div className="mb-6">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#a1a1aa] mb-3 font-mono">
              AI Summary
            </h2>
            <p className="text-[15px] text-[#3f3f46] leading-[1.75]">
              {article.ai_summary}
            </p>
          </div>
        )}

        {/* So What */}
        {article.so_what && (
          <div className="p-4 rounded-xl border-l-[3px] border-l-[#a78bfa] bg-[#faf5ff] mb-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#a78bfa] mb-2 font-mono">
              Why It Matters
            </div>
            <p className="text-[14px] text-[#3f3f46] leading-relaxed">
              {article.so_what}
            </p>
          </div>
        )}

        {/* Data Points */}
        {article.data_points && article.data_points.length > 0 && (
          <div className="p-4 rounded-xl bg-white border border-[#e4e4e7] mb-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#a1a1aa] mb-3 font-mono">
              By the Numbers
            </div>
            <div className="space-y-2">
              {article.data_points.map((dp, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[14px] font-bold font-mono text-[#0a0a0a]">{dp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {article.ai_tags && article.ai_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-8">
            {article.ai_tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full text-[11px] text-[#71717a] border border-[#e4e4e7] bg-white"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 py-6 border-t border-b border-[#e4e4e7] mb-10">
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0a0a0a] text-white text-[13px] font-medium hover:bg-[#171717] transition-all"
          >
            Read original article
            <span className="text-[11px]">&#8599;</span>
          </a>
          <ShareButtons title={article.title} url={articleUrl} />
        </div>

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#a1a1aa] mb-5 font-mono">
              Related Articles
            </h2>
            <div className="space-y-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/archive/${r.id}`}
                  className="block p-4 rounded-xl border border-[#e4e4e7] bg-white hover:border-[#a1a1aa] transition-all"
                >
                  <h3 className="text-[14px] font-semibold mb-1">{r.title}</h3>
                  <div className="text-[11px] text-[#a1a1aa] font-mono">
                    {r.source} &middot; {timeAgo(r.published_at)} &middot; {r.ai_importance}/10
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Footer */}
      <footer className="text-center py-10 border-t border-[#e4e4e7] mt-10">
        <p className="text-[12px] text-[#a1a1aa]">
          <Link href="/" className="hover:text-[#0a0a0a] transition-colors">home</Link>
          <span className="mx-2">&middot;</span>
          <Link href="/archive" className="hover:text-[#0a0a0a] transition-colors">archive</Link>
          <span className="mx-2">&middot;</span>
          <Link href="/dashboard" className="hover:text-[#0a0a0a] transition-colors">dashboard</Link>
        </p>
      </footer>
    </div>
  );
}
