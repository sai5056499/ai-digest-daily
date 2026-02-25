"use client";

import { useState, useEffect, useCallback } from "react";

interface Article {
  id: number;
  title: string;
  link: string;
  ai_summary: string;
  source: string;
  ai_category: string;
  ai_tags: string[];
  ai_importance: number;
  ai_sentiment: string;
  published_at: string;
  image_url: string | null;
}

interface Stats {
  totalArticles: number;
  activeSubscribers: number;
  emailsSentToday: number;
  sourcesCount: number;
}

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "ai_breakthrough", label: "Breakthroughs" },
  { value: "ai_tool", label: "Tools" },
  { value: "ai_research", label: "Research" },
  { value: "tech_news", label: "Tech" },
  { value: "cybersecurity", label: "Security" },
  { value: "cloud", label: "Cloud" },
  { value: "startup", label: "Startups" },
  { value: "dev_community", label: "Dev" },
  { value: "software", label: "Software" },
  { value: "business", label: "Business" },
];

export default function DashboardPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "15" });
      if (category) params.set("category", category);
      const res = await fetch(`/api/articles?${params}`);
      const data = await res.json();
      setArticles(data.articles || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      console.error("Failed to fetch articles");
    }
    setLoading(false);
  }, [category, page]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);
  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then((data) => setStats(data)).catch(() => {});
  }, []);

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "now";
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0a0a0a] noise">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#fafafa]/80 backdrop-blur-xl border-b border-[#e4e4e7]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between animate-slide-down">
          <div className="flex items-center gap-3">
            <a href="/" className="text-[15px] font-semibold tracking-tight hover:opacity-60 transition-opacity">
              ai&thinsp;&&thinsp;tech daily
            </a>
            <span className="text-[11px] text-[#a1a1aa] border border-[#e4e4e7] px-2 py-0.5 rounded-full">
              dashboard
            </span>
          </div>
          <button
            onClick={fetchArticles}
            className="text-[13px] text-[#71717a] hover:text-[#0a0a0a] transition-colors duration-200"
          >
            refresh
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-px bg-[#e4e4e7] rounded-xl overflow-hidden mb-10 animate-slide-up shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <StatCard value={stats.totalArticles.toLocaleString()} label="Articles" />
            <StatCard value={stats.sourcesCount.toString()} label="Sources" />
            <StatCard value={stats.activeSubscribers.toLocaleString()} label="Readers" />
            <StatCard value={stats.emailsSentToday.toLocaleString()} label="Sent today" />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5 mb-8 animate-slide-up delay-100">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => { setCategory(cat.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                category === cat.value
                  ? "bg-[#0a0a0a] text-white"
                  : "text-[#71717a] hover:text-[#0a0a0a] hover:bg-[#f4f4f5]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-5 h-5 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-32 animate-fade-in">
            <p className="text-[40px] mb-4 animate-float">~</p>
            <p className="text-[15px] font-medium text-[#0a0a0a]">No articles yet</p>
            <p className="text-[13px] text-[#a1a1aa] mt-2">
              Run <code className="px-1.5 py-0.5 bg-[#f4f4f5] rounded text-[12px] font-mono">npm run pipeline</code> to start collecting.
            </p>
          </div>
        ) : (
          <div className="space-y-0 animate-slide-up delay-200">
            {articles.map((article, i) => (
              <a
                key={article.id}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 py-5 border-b border-[#f4f4f5] last:border-0 hover:bg-[#f4f4f5]/50 -mx-3 px-3 rounded-lg transition-all duration-200"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {/* Importance */}
                <div className="shrink-0 mt-1">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-[11px] font-bold ${
                    article.ai_importance >= 8
                      ? "bg-[#0a0a0a] text-white"
                      : article.ai_importance >= 6
                        ? "bg-[#27272a] text-white"
                        : "bg-[#f4f4f5] text-[#71717a]"
                  }`}>
                    {article.ai_importance}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-semibold leading-snug mb-1 group-hover:opacity-70 transition-opacity duration-200 line-clamp-2">
                    {article.title}
                  </h3>
                  {article.ai_summary && (
                    <p className="text-[13px] text-[#71717a] leading-relaxed line-clamp-2">
                      {article.ai_summary}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[11px] text-[#a1a1aa]">{article.source}</span>
                    {article.ai_tags?.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[11px] text-[#a1a1aa]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Time */}
                <span className="shrink-0 text-[11px] text-[#a1a1aa] mt-1 tabular-nums">
                  {timeAgo(article.published_at)}
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12 animate-fade-in">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-[13px] text-[#71717a] hover:text-[#0a0a0a] disabled:opacity-30 transition-all duration-200"
            >
              &larr; prev
            </button>
            <span className="text-[12px] text-[#a1a1aa] tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-[13px] text-[#71717a] hover:text-[#0a0a0a] disabled:opacity-30 transition-all duration-200"
            >
              next &rarr;
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white p-5 text-center">
      <div className="text-[22px] font-bold tracking-tight">{value}</div>
      <div className="text-[11px] text-[#a1a1aa] mt-0.5">{label}</div>
    </div>
  );
}
