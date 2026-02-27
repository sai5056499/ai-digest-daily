"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const TOPIC_GROUPS = [
  { id: "ai", label: "AI & ML", categories: ["ai_breakthrough", "ai_tool", "ai_research"] },
  { id: "tech", label: "Tech News", categories: ["tech_news", "gadgets", "software"] },
  { id: "cybersecurity", label: "Security", categories: ["cybersecurity"] },
  { id: "cloud", label: "Cloud & DevOps", categories: ["cloud", "devops"] },
  { id: "startup", label: "Startups", categories: ["startup", "business"] },
  { id: "dev", label: "Developer", categories: ["dev_community"] },
  { id: "science", label: "Science", categories: ["science"] },
] as const;

function categoriesToTopics(categories: string[]): Set<string> {
  const topics = new Set<string>();
  for (const group of TOPIC_GROUPS) {
    if (group.categories.some((c) => categories.includes(c))) {
      topics.add(group.id);
    }
  }
  if (topics.size === 0) {
    topics.add("ai");
    topics.add("tech");
  }
  return topics;
}

function topicsToCategories(topics: Set<string>): string[] {
  return TOPIC_GROUPS
    .filter((g) => topics.has(g.id))
    .flatMap((g) => [...g.categories]);
}

function PreferencesContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  const fetchPrefs = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/preferences?token=${token}`);
      if (!res.ok) {
        setError("Could not load your preferences. The link may be invalid.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setEmail(data.email);
      setFrequency(data.frequency);
      setSelectedTopics(categoriesToTopics(data.categories || []));
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setStatus("idle");
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          categories: topicsToCategories(selectedTopics),
          frequency,
        }),
      });

      if (res.ok) {
        setStatus("saved");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save.");
        setStatus("error");
      }
    } catch {
      setError("Network error.");
      setStatus("error");
    }
    setSaving(false);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h1 className="text-[20px] font-semibold mb-3">Missing token</h1>
          <p className="text-[14px] text-[#71717a]">
            Use the preferences link from your newsletter email to manage your subscription.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-[14px] text-[#71717a]">Loading preferences...</div>
      </div>
    );
  }

  if (error && !email) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h1 className="text-[20px] font-semibold mb-3">Something went wrong</h1>
          <p className="text-[14px] text-[#71717a]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0a0a0a]">
      <nav className="flex items-center justify-between px-6 py-6 max-w-xl mx-auto">
        <a href="/" className="text-[15px] font-semibold tracking-tight">
          ai&thinsp;&&thinsp;tech daily
        </a>
      </nav>

      <main className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-[28px] font-bold tracking-[-0.03em] mb-2">
          Your preferences
        </h1>
        <p className="text-[14px] text-[#71717a] mb-10">
          Manage your newsletter for <span className="font-medium text-[#0a0a0a]">{email}</span>
        </p>

        {/* Frequency */}
        <div className="mb-10">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#a1a1aa] mb-4">
            Frequency
          </h2>
          <div className="flex gap-2">
            {(["daily", "weekly"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => { setFrequency(f); setStatus("idle"); }}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium border transition-all duration-200 ${
                  frequency === f
                    ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                    : "bg-white text-[#71717a] border-[#e4e4e7] hover:border-[#a1a1aa]"
                }`}
              >
                {f === "daily" ? "Daily digest" : "Weekly recap"}
              </button>
            ))}
          </div>
        </div>

        {/* Topics */}
        <div className="mb-10">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#a1a1aa] mb-4">
            Topics
          </h2>
          <div className="flex flex-wrap gap-2">
            {TOPIC_GROUPS.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => toggleTopic(group.id)}
                className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-all duration-200 ${
                  selectedTopics.has(group.id)
                    ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                    : "bg-white text-[#71717a] border-[#e4e4e7] hover:border-[#a1a1aa]"
                }`}
              >
                {group.label}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-[#a1a1aa] mt-3">
            Select at least one topic. Your newsletter will prioritize these categories.
          </p>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-11 px-6 rounded-lg bg-[#0a0a0a] text-white text-[14px] font-medium hover:bg-[#171717] active:scale-[0.98] transition-all duration-200 disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save preferences"}
        </button>

        {status === "saved" && (
          <p className="text-[13px] text-green-600 mt-3 animate-slide-up">
            Preferences saved successfully.
          </p>
        )}
        {status === "error" && (
          <p className="text-[13px] text-red-500 mt-3 animate-slide-up">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}

export default function PreferencesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-[14px] text-[#71717a]">Loading...</div>
      </div>
    }>
      <PreferencesContent />
    </Suspense>
  );
}
