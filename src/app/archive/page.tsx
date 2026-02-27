"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Article {
  id: string;
  title: string;
  link: string;
  source: string;
  published_at: string;
  ai_summary: string | null;
  ai_category: string | null;
  ai_tags: string[] | null;
  ai_importance: number;
  ai_sentiment: string | null;
  key_takeaway: string | null;
}

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "ai_breakthrough", label: "AI Breakthroughs" },
  { value: "ai_tool", label: "AI Tools" },
  { value: "ai_research", label: "Research" },
  { value: "tech_news", label: "Tech" },
  { value: "cybersecurity", label: "Security" },
  { value: "cloud", label: "Cloud" },
  { value: "startup", label: "Startups" },
  { value: "dev_community", label: "Developer" },
  { value: "software", label: "Software" },
  { value: "business", label: "Business" },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function importanceColor(score: number): string {
  if (score >= 9) return "#dc2626";
  if (score >= 7) return "#f59e0b";
  if (score >= 5) return "#22c55e";
  return "#a1a1aa";
}

export default function ArchivePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (category) params.set("category", category);
      const res = await fetch(`/api/articles?${params}`);
      const data = await res.json();
      setArticles(data.articles || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch {
      setArticles([]);
    }
    setLoading(false);
  }, [page, category]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0a0a0a]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-4xl mx-auto">
        <Link href="/" className="text-[15px] font-semibold tracking-tight">
          ai&thinsp;&&thinsp;tech daily
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-[13px] text-[#71717a] hover:text-[#0a0a0a] transition-colors"
          >
            dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-[32px] font-bold tracking-[-0.03em] mb-2">
            Archive
          </h1>
          <p className="text-[15px] text-[#71717a]">
            {total.toLocaleString()} articles from 20+ sources, analyzed by AI.
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-1.5 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all duration-200 ${
                category === cat.value
                  ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                  : "bg-white text-[#71717a] border-[#e4e4e7] hover:border-[#a1a1aa]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Articles */}
        {loading ? (
          <div className="text-center py-20 text-[14px] text-[#a1a1aa]">
            Loading articles...
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[14px] text-[#a1a1aa]">No articles found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/archive/${article.id}`}
                className="block p-5 rounded-xl border border-[#e4e4e7] bg-white hover:border-[#a1a1aa] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[15px] font-semibold leading-snug mb-1.5 tracking-[-0.01em]">
                      {article.title}
                    </h2>
                    <div className="flex items-center gap-2 text-[11px] text-[#a1a1aa] mb-2 font-mono">
                      <span>{article.source}</span>
                      <span>&middot;</span>
                      <span>{timeAgo(article.published_at)}</span>
                      {article.ai_category && (
                        <>
                          <span>&middot;</span>
                          <span className="text-[#71717a]">{article.ai_category.replace(/_/g, " ")}</span>
                        </>
                      )}
                    </div>
                    {article.key_takeaway && (
                      <p className="text-[13px] text-[#71717a] leading-relaxed line-clamp-2">
                        {article.key_takeaway}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold text-white"
                      style={{ backgroundColor: importanceColor(article.ai_importance) }}
                    >
                      {article.ai_importance}
                    </div>
                  </div>
                </div>
                {article.ai_tags && article.ai_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {article.ai_tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full text-[10px] text-[#a1a1aa] border border-[#e4e4e7] bg-[#fafafa]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg text-[13px] font-medium border border-[#e4e4e7] bg-white text-[#71717a] hover:border-[#a1a1aa] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <span className="text-[13px] text-[#a1a1aa] px-3">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg text-[13px] font-medium border border-[#e4e4e7] bg-white text-[#71717a] hover:border-[#a1a1aa] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-10 border-t border-[#e4e4e7] mt-10">
        <p className="text-[12px] text-[#a1a1aa]">
          <Link href="/" className="hover:text-[#0a0a0a] transition-colors">home</Link>
          <span className="mx-2">&middot;</span>
          <Link href="/dashboard" className="hover:text-[#0a0a0a] transition-colors">dashboard</Link>
        </p>
      </footer>
    </div>
  );
}
