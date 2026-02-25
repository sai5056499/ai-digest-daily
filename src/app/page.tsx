"use client";

import { useState, useEffect } from "react";

interface ToolOfTheDay {
  id: string;
  title: string;
  link: string;
  source: string;
  ai_summary: string | null;
  ai_importance: number;
  ai_tags: string[] | null;
  ai_category: string | null;
  so_what: string | null;
  key_takeaway: string | null;
  published_at: string;
}

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "already"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [stats, setStats] = useState({
    totalArticles: 0,
    activeSubscribers: 0,
    sourcesCount: 0,
  });
  const [toolOfTheDay, setToolOfTheDay] = useState<ToolOfTheDay | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.totalArticles !== undefined) setStats(data);
      })
      .catch(() => {});

    fetch("/api/tool-of-the-day")
      .then((r) => r.json())
      .then((data) => {
        if (data.tool) setToolOfTheDay(data.tool);
      })
      .catch(() => {});
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, frequency: "daily" }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else if (res.status === 409) {
        setStatus("already");
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0a0a0a] noise">
      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-3xl mx-auto animate-slide-down">
        <span className="text-[15px] font-semibold tracking-tight">
          ai&thinsp;&&thinsp;tech daily
        </span>
        <a
          href="/dashboard"
          className="text-[13px] text-[#71717a] hover:text-[#0a0a0a] transition-colors duration-300"
        >
          dashboard
        </a>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center px-6 pt-24 pb-32 max-w-3xl mx-auto">
        {/* Status pill */}
        <div className="animate-slide-up flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#e4e4e7] bg-white text-[12px] text-[#71717a] mb-14 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0a0a0a] animate-pulse-dot" />
          scanning {stats.sourcesCount || 20}+ sources
        </div>

        {/* Headline */}
        <h1 className="animate-slide-up delay-100 text-center text-[clamp(2.5rem,6vw,4rem)] font-bold leading-[1.08] tracking-[-0.04em] mb-6">
          Your morning brief,
          <br />
          <span className="text-[#71717a]">written by AI.</span>
        </h1>

        {/* Subtitle */}
        <p className="animate-slide-up delay-200 text-center text-[17px] leading-relaxed text-[#71717a] max-w-md mb-12">
          The most important AI & tech news from 20+ sources,
          summarized and delivered to your inbox every morning.
        </p>

        {/* Subscribe */}
        <form
          onSubmit={handleSubscribe}
          className="animate-slide-up delay-300 w-full max-w-sm"
        >
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status !== "idle" && status !== "loading")
                  setStatus("idle");
              }}
              placeholder="you@email.com"
              required
              className="flex-1 h-11 px-4 rounded-lg border border-[#e4e4e7] bg-white text-[14px] text-[#0a0a0a] outline-none placeholder:text-[#a1a1aa] focus:border-[#0a0a0a] focus:ring-1 focus:ring-[#0a0a0a] transition-all duration-200"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="h-11 px-5 rounded-lg bg-[#0a0a0a] text-white text-[14px] font-medium hover:bg-[#171717] active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {status === "loading" ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  ...
                </span>
              ) : (
                "Subscribe"
              )}
            </button>
          </div>

          {/* Status messages */}
          <div className="h-8 flex items-center justify-center mt-3">
            {status === "success" && (
              <p className="text-[13px] text-[#0a0a0a] animate-slide-up">
                You&apos;re in. First issue arrives tomorrow morning.
              </p>
            )}
            {status === "already" && (
              <p className="text-[13px] text-[#71717a] animate-slide-up">
                Already subscribed. Check your inbox.
              </p>
            )}
            {status === "error" && (
              <p className="text-[13px] text-red-500 animate-slide-up">
                {errorMessage}
              </p>
            )}
            {status === "idle" && (
              <p className="text-[12px] text-[#a1a1aa]">
                Free forever &middot; No spam &middot; Unsubscribe anytime
              </p>
            )}
          </div>
        </form>

        {/* Tool of the Day */}
        {toolOfTheDay && (
          <div className="w-full max-w-lg mt-20 animate-scale-in delay-400">
            <div className="relative overflow-hidden rounded-xl border border-[#e4e4e7] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              {/* Header strip */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#e4e4e7] bg-[#fafafa]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0a0a0a] animate-pulse-dot" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#71717a]">
                    Tool of the Day
                  </span>
                </div>
                <span className="text-[11px] text-[#a1a1aa]">
                  {toolOfTheDay.ai_importance}/10
                </span>
              </div>

              {/* Content */}
              <div className="px-5 py-4">
                <a
                  href={toolOfTheDay.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[16px] font-semibold text-[#0a0a0a] leading-snug hover:underline block mb-2 tracking-[-0.02em]"
                >
                  {toolOfTheDay.title}
                </a>

                <p className="text-[12px] text-[#a1a1aa] mb-3">
                  {toolOfTheDay.source}
                  {toolOfTheDay.published_at && (
                    <> &middot; {new Date(toolOfTheDay.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>
                  )}
                </p>

                {toolOfTheDay.ai_summary && (
                  <p className="text-[14px] text-[#71717a] leading-relaxed mb-3 line-clamp-3">
                    {toolOfTheDay.ai_summary}
                  </p>
                )}

                {toolOfTheDay.key_takeaway && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#fafafa] border border-[#e4e4e7] mb-3">
                    <span className="text-[11px] shrink-0 mt-px">&#9889;</span>
                    <p className="text-[12px] text-[#71717a] leading-relaxed">
                      {toolOfTheDay.key_takeaway}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {toolOfTheDay.ai_tags && toolOfTheDay.ai_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {toolOfTheDay.ai_tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full text-[11px] text-[#71717a] border border-[#e4e4e7] bg-[#fafafa]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <a
                  href={toolOfTheDay.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0a0a0a] hover:underline"
                >
                  Check it out
                  <span className="text-[11px]">&#8594;</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="w-12 h-px bg-[#e4e4e7] mt-20 mb-20 animate-fade-in delay-400" />

        {/* How it works */}
        <div className="w-full max-w-lg">
          <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#a1a1aa] text-center mb-10 animate-fade-in delay-400">
            How it works
          </p>
          <div className="grid grid-cols-1 gap-0">
            {[
              { num: "01", title: "Collect", desc: "Scrape 20+ RSS feeds, APIs, and social sources every few hours." },
              { num: "02", title: "Deduplicate", desc: "Remove duplicates and merge stories from multiple outlets." },
              { num: "03", title: "Analyze", desc: "AI summarizes, categorizes, and ranks every article by importance." },
              { num: "04", title: "Deliver", desc: "A clean email digest arrives in your inbox each morning." },
            ].map((step, i) => (
              <div
                key={step.num}
                className={`animate-slide-up delay-${(i + 4) * 100} flex items-start gap-5 py-6 ${i < 3 ? "border-b border-[#e4e4e7]" : ""}`}
              >
                <span className="text-[13px] font-mono text-[#a1a1aa] pt-0.5 shrink-0">
                  {step.num}
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold mb-1">{step.title}</h3>
                  <p className="text-[14px] text-[#71717a] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="w-12 h-px bg-[#e4e4e7] mt-20 mb-16 animate-fade-in delay-700" />

        {/* Sources */}
        <div className="text-center animate-fade-in delay-700">
          <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#a1a1aa] mb-6">
            Sources
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-lg">
            {[
              "TechCrunch", "The Verge", "Hacker News", "Reddit",
              "Ars Technica", "Wired", "OpenAI", "Google AI",
              "Hugging Face", "VentureBeat", "Product Hunt", "arXiv",
            ].map((s) => (
              <span
                key={s}
                className="px-3 py-1 rounded-full text-[12px] text-[#71717a] border border-[#e4e4e7] bg-white hover:border-[#0a0a0a] hover:text-[#0a0a0a] transition-all duration-300 cursor-default"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        {stats.totalArticles > 0 && (
          <div className="flex items-center gap-10 mt-16 animate-fade-in">
            <Stat value={stats.totalArticles.toLocaleString()} label="articles" />
            <div className="w-px h-8 bg-[#e4e4e7]" />
            <Stat value={stats.sourcesCount.toString()} label="sources" />
            <div className="w-px h-8 bg-[#e4e4e7]" />
            <Stat value={stats.activeSubscribers.toLocaleString()} label="readers" />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-10 border-t border-[#e4e4e7]">
        <p className="text-[12px] text-[#a1a1aa]">
          <a href="/dashboard" className="hover:text-[#0a0a0a] transition-colors duration-300">dashboard</a>
          <span className="mx-2">&middot;</span>
          built with next.js, groq ai & resend
        </p>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-[22px] font-bold tracking-tight">{value}</div>
      <div className="text-[11px] text-[#a1a1aa] mt-0.5">{label}</div>
    </div>
  );
}
