"use client";

import { useState, useEffect } from "react";
import AiChat from "./ai-chat";

interface Settings {
  headline: string;
  headlineMuted: string;
  subtitle: string;
  newsletterName: string;
  newsletterFromName: string;
  telegramEnabled: boolean;
  emailEnabled: boolean;
  aiProvider: string;
  aiModel: string;
  rssEnabled: boolean;
  hnEnabled: boolean;
  redditEnabled: boolean;
  collectIntervalHours: number;
  sendHourUtc: number;
  maxArticlesPerDigest: number;
  showTopStories: boolean;
  showAiNews: boolean;
  showTechNews: boolean;
  showQuickLinks: boolean;
  showDeepDive: boolean;
  showPaperOfTheDay: boolean;
  showDataPoints: boolean;
  showKeyTakeaways: boolean;
  showQuoteOfTheDay: boolean;
  showRelatedReads: boolean;
  showToolOfTheDay: boolean;
}

type TabId = "landing" | "email" | "sources" | "pipeline" | "features";

export default function SandboxPage() {
  const [secret, setSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [tab, setTab] = useState<TabId>("landing");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [draft, setDraft] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const s = sessionStorage.getItem("admin_secret");
    if (s) { setSecret(s); setAuthenticated(true); }
  }, []);

  const headers = () => ({
    "Content-Type": "application/json",
    "x-admin-secret": secret,
  });

  const fetchSettings = async () => {
    const res = await fetch("/api/admin/settings", { headers: { "x-admin-secret": secret } });
    if (res.status === 401) { setAuthenticated(false); return; }
    const data = await res.json();
    setSettings(data.settings);
    setDraft(data.settings);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem("admin_secret", secret);
    setAuthenticated(true);
  };

  useEffect(() => {
    if (authenticated && secret) fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  const update = (key: keyof Settings, value: any) => {
    if (!draft) return;
    const next = { ...draft, [key]: value };
    setDraft(next);
    setHasChanges(JSON.stringify(next) !== JSON.stringify(settings));
    setSaved(false);
  };

  const deployToMain = async () => {
    if (!draft) return;
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ settings: draft }),
    });
    setSettings({ ...draft });
    setHasChanges(false);
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const resetDraft = () => {
    if (settings) {
      setDraft({ ...settings });
      setHasChanges(false);
    }
  };

  // Login
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center noise">
        <form onSubmit={handleLogin} className="w-full max-w-xs animate-scale-in">
          <h1 className="text-[15px] font-semibold tracking-tight text-center mb-1">sandbox</h1>
          <p className="text-[12px] text-[#a1a1aa] text-center mb-8">edit features, preview, then deploy</p>
          <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="admin secret"
            className="w-full h-11 px-4 rounded-lg border border-[#e4e4e7] bg-white text-[14px] outline-none placeholder:text-[#a1a1aa] focus:border-[#0a0a0a] focus:ring-1 focus:ring-[#0a0a0a] transition-all duration-200 mb-3" autoFocus />
          <button type="submit" className="w-full h-11 rounded-lg bg-[#0a0a0a] text-white text-[14px] font-medium hover:bg-[#171717] active:scale-[0.98] transition-all duration-200">
            open sandbox
          </button>
        </form>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const TABS: { id: TabId; label: string }[] = [
    { id: "landing", label: "Landing Page" },
    { id: "email", label: "Email Template" },
    { id: "sources", label: "Data Sources" },
    { id: "pipeline", label: "Pipeline" },
    { id: "features", label: "Features" },
  ];

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
              sandbox
            </span>
            {hasChanges && (
              <span className="text-[11px] text-[#0a0a0a] bg-[#f4f4f5] px-2 py-0.5 rounded-full animate-scale-in">
                unsaved changes
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <button onClick={resetDraft} className="text-[13px] text-[#a1a1aa] hover:text-[#0a0a0a] transition-colors">
                discard
              </button>
            )}
            <button
              onClick={deployToMain}
              disabled={!hasChanges || saving}
              className={`h-8 px-4 rounded-lg text-[13px] font-medium transition-all duration-200 active:scale-[0.98] ${
                hasChanges
                  ? "bg-[#0a0a0a] text-white hover:bg-[#171717]"
                  : "bg-[#f4f4f5] text-[#a1a1aa] cursor-default"
              }`}
            >
              {saving ? "deploying..." : saved ? "deployed!" : "deploy to main"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 animate-slide-up">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                tab === t.id ? "bg-[#0a0a0a] text-white" : "text-[#71717a] hover:text-[#0a0a0a] hover:bg-[#f4f4f5]"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_1fr] gap-8 animate-slide-up delay-100">
          {/* Left: Controls */}
          <div className="space-y-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#a1a1aa]">Edit</p>

            {tab === "landing" && (
              <div className="space-y-5">
                <Field label="Headline" value={draft.headline} onChange={(v) => update("headline", v)} />
                <Field label="Headline (muted)" value={draft.headlineMuted} onChange={(v) => update("headlineMuted", v)} />
                <TextArea label="Subtitle" value={draft.subtitle} onChange={(v) => update("subtitle", v)} />
                <Field label="Newsletter name" value={draft.newsletterName} onChange={(v) => update("newsletterName", v)} />
              </div>
            )}

            {tab === "email" && (
              <div className="space-y-5">
                <Field label="From name" value={draft.newsletterFromName} onChange={(v) => update("newsletterFromName", v)} />
                <Toggle label="Top Stories section" checked={draft.showTopStories} onChange={(v) => update("showTopStories", v)} />
                <Toggle label="AI News section" checked={draft.showAiNews} onChange={(v) => update("showAiNews", v)} />
                <Toggle label="Tech News section" checked={draft.showTechNews} onChange={(v) => update("showTechNews", v)} />
                <Toggle label="Quick Links section" checked={draft.showQuickLinks} onChange={(v) => update("showQuickLinks", v)} />
                <div className="pt-3 border-t border-[#f4f4f5]">
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#a1a1aa] mb-3">Content Depth</p>
                  <Toggle label="Deep Dive (top story analysis)" checked={draft.showDeepDive} onChange={(v) => update("showDeepDive", v)} />
                  <Toggle label="Paper of the Day" checked={draft.showPaperOfTheDay} onChange={(v) => update("showPaperOfTheDay", v)} />
                  <Toggle label="By the Numbers (data points)" checked={draft.showDataPoints} onChange={(v) => update("showDataPoints", v)} />
                </div>
                <div className="pt-3 border-t border-[#f4f4f5]">
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#a1a1aa] mb-3">Phase 3 — Engagement</p>
                  <Toggle label="Key Takeaways" checked={draft.showKeyTakeaways} onChange={(v) => update("showKeyTakeaways", v)} />
                  <Toggle label="Quote of the Day" checked={draft.showQuoteOfTheDay} onChange={(v) => update("showQuoteOfTheDay", v)} />
                  <Toggle label="Related Reads" checked={draft.showRelatedReads} onChange={(v) => update("showRelatedReads", v)} />
                </div>
                <div className="pt-3 border-t border-[#f4f4f5]">
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#a1a1aa] mb-3">Spotlight</p>
                  <Toggle label="Tool of the Day" checked={draft.showToolOfTheDay} onChange={(v) => update("showToolOfTheDay", v)} />
                  <p className="text-[11px] text-[#a1a1aa] mt-2 leading-relaxed">
                    Highlights the top AI tool from today&apos;s articles in both the landing page and email digest.
                  </p>
                </div>
                <NumberField label="Max articles per digest" value={draft.maxArticlesPerDigest} onChange={(v) => update("maxArticlesPerDigest", v)} min={5} max={50} />
              </div>
            )}

            {tab === "sources" && (
              <div className="space-y-5">
                <Toggle label="RSS Feeds (20+ sources)" checked={draft.rssEnabled} onChange={(v) => update("rssEnabled", v)} />
                <Toggle label="Hacker News API" checked={draft.hnEnabled} onChange={(v) => update("hnEnabled", v)} />
                <Toggle label="Reddit API" checked={draft.redditEnabled} onChange={(v) => update("redditEnabled", v)} />
                <p className="text-[12px] text-[#a1a1aa] leading-relaxed">
                  Toggle sources on/off. Disabled sources will be skipped during collection.
                  Edit <code className="px-1 py-0.5 bg-[#f4f4f5] rounded text-[11px] font-mono">src/lib/collectors/sources.config.ts</code> to add or remove individual RSS feeds.
                </p>
              </div>
            )}

            {tab === "pipeline" && (
              <div className="space-y-5">
                <Field label="AI provider" value={draft.aiProvider} onChange={(v) => update("aiProvider", v)} />
                <Field label="AI model" value={draft.aiModel} onChange={(v) => update("aiModel", v)} />
                <NumberField label="Collect interval (hours)" value={draft.collectIntervalHours} onChange={(v) => update("collectIntervalHours", v)} min={1} max={24} />
                <NumberField label="Send hour (UTC)" value={draft.sendHourUtc} onChange={(v) => update("sendHourUtc", v)} min={0} max={23} />
                <p className="text-[12px] text-[#a1a1aa]">
                  Collection runs every {draft.collectIntervalHours}h. Daily digest sends at {draft.sendHourUtc}:00 UTC ({formatLocalTime(draft.sendHourUtc)}).
                </p>
              </div>
            )}

            {tab === "features" && (
              <div className="space-y-5">
                <Toggle label="Email delivery" checked={draft.emailEnabled} onChange={(v) => update("emailEnabled", v)} />
                <Toggle label="Telegram notifications" checked={draft.telegramEnabled} onChange={(v) => update("telegramEnabled", v)} />
                <Toggle label="Tool of the Day spotlight" checked={draft.showToolOfTheDay} onChange={(v) => update("showToolOfTheDay", v)} />
                <div className="pt-4 border-t border-[#f4f4f5]">
                  <p className="text-[12px] font-medium text-[#71717a] mb-3">Quick links</p>
                  <div className="space-y-2">
                    <QuickLink href="/" label="Landing page" />
                    <QuickLink href="/dashboard" label="Dashboard" />
                    <QuickLink href="/admin" label="Admin panel" />
                    <QuickLink href="/test" label="Test suite" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Preview */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#a1a1aa] mb-6">Preview</p>

            {tab === "landing" && (
              <div className="border border-[#e4e4e7] rounded-xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="p-8 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#e4e4e7] text-[11px] text-[#a1a1aa] mb-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0a0a0a] animate-pulse" />
                    scanning 20+ sources
                  </div>
                  <h1 className="text-[28px] font-bold leading-tight tracking-[-0.03em] mb-2">
                    {draft.headline}
                    <br />
                    <span className="text-[#71717a]">{draft.headlineMuted}</span>
                  </h1>
                  <p className="text-[13px] text-[#71717a] leading-relaxed max-w-xs mx-auto mb-6">
                    {draft.subtitle}
                  </p>
                  <div className="flex gap-2 justify-center max-w-xs mx-auto">
                    <div className="flex-1 h-9 rounded-lg border border-[#e4e4e7] bg-[#fafafa]" />
                    <div className="h-9 px-4 rounded-lg bg-[#0a0a0a] text-white text-[12px] font-medium flex items-center">Subscribe</div>
                  </div>
                </div>
              </div>
            )}

            {tab === "email" && (
              <div className="border border-[#e4e4e7] rounded-xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="bg-[#0a0a0a] text-white text-center py-4 px-5">
                  <p className="text-[14px] font-bold">{draft.newsletterName}</p>
                  <p className="text-[10px] text-white/50 mt-0.5">February 16, 2026</p>
                </div>
                <div className="p-5 space-y-4 text-[12px]">
                  {draft.showToolOfTheDay && (
                    <div className="pb-3 mb-3 border-b border-[#f4f4f5]">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[11px]">&#9889;</span>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a1a1aa]">Tool of the Day</p>
                      </div>
                      <div className="p-3 bg-[#fafafa] rounded-lg border border-[#e4e4e7]">
                        <p className="text-[12px] font-semibold text-[#0a0a0a] mb-1">Cursor AI — The AI-First Code Editor</p>
                        <p className="text-[10px] text-[#a1a1aa] mb-1.5">Product Hunt &middot; 8/10</p>
                        <p className="text-[10px] text-[#71717a] leading-relaxed">AI-native IDE that integrates directly with your codebase for smarter completions and edits.</p>
                        <span className="inline-block mt-2 text-[10px] font-medium text-[#0a0a0a]">Check it out &rarr;</span>
                      </div>
                    </div>
                  )}
                  {draft.showTopStories && (
                    <Section title="Top Stories" items={["OpenAI launches GPT-5 with video understanding", "Google DeepMind achieves AGI benchmark", "Meta open-sources next-gen AI model"]} />
                  )}
                  {draft.showAiNews && (
                    <Section title="AI News" items={["Hugging Face releases new transformer architecture", "Anthropic raises $2B Series D"]} />
                  )}
                  {draft.showTechNews && (
                    <Section title="Tech News" items={["Apple unveils M5 chip lineup", "Stripe acquires fintech startup"]} />
                  )}
                  {draft.showQuickLinks && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a1a1aa] mb-2">Quick Links</p>
                      {["Rust 2.0 released", "Docker Desktop adds AI assistant", "VS Code February update"].map((t) => (
                        <p key={t} className="text-[12px] text-[#71717a] py-1">→ {t}</p>
                      ))}
                    </div>
                  )}
                  <div className="pt-3 border-t border-[#f4f4f5] text-center text-[10px] text-[#a1a1aa]">
                    From: {draft.newsletterFromName} &middot; Unsubscribe
                  </div>
                </div>
              </div>
            )}

            {tab === "sources" && (
              <div className="border border-[#e4e4e7] rounded-xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="space-y-3">
                  <SourceRow label="RSS Feeds" count="20+ feeds" enabled={draft.rssEnabled} detail="TechCrunch, Verge, Ars, Wired, VentureBeat, HF, OpenAI..." />
                  <SourceRow label="Hacker News" count="top 30" enabled={draft.hnEnabled} detail="Top stories filtered by score > 50" />
                  <SourceRow label="Reddit" count="4 subs" enabled={draft.redditEnabled} detail="r/artificial, r/MachineLearning, r/technology, r/singularity" />
                </div>
                <div className="mt-4 pt-4 border-t border-[#f4f4f5]">
                  <p className="text-[11px] text-[#a1a1aa]">
                    Active: {[draft.rssEnabled, draft.hnEnabled, draft.redditEnabled].filter(Boolean).length}/3 sources
                  </p>
                </div>
              </div>
            )}

            {tab === "pipeline" && (
              <div className="border border-[#e4e4e7] rounded-xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="space-y-3 text-[12px]">
                  <div className="flex justify-between py-2 border-b border-[#f4f4f5]">
                    <span className="text-[#71717a]">AI Provider</span>
                    <span className="font-mono">{draft.aiProvider}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#f4f4f5]">
                    <span className="text-[#71717a]">Model</span>
                    <span className="font-mono text-[11px]">{draft.aiModel}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#f4f4f5]">
                    <span className="text-[#71717a]">Collect every</span>
                    <span>{draft.collectIntervalHours}h</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#f4f4f5]">
                    <span className="text-[#71717a]">Send at</span>
                    <span>{draft.sendHourUtc}:00 UTC ({formatLocalTime(draft.sendHourUtc)})</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#71717a]">Max articles</span>
                    <span>{draft.maxArticlesPerDigest}</span>
                  </div>
                </div>
                <div className="mt-5 p-3 bg-[#fafafa] rounded-lg text-[11px] text-[#a1a1aa] leading-relaxed font-mono">
                  cron: 0 */{draft.collectIntervalHours} * * * (collect)<br />
                  cron: 0 {draft.sendHourUtc} * * * (send)
                </div>
              </div>
            )}

            {tab === "features" && (
              <div className="border border-[#e4e4e7] rounded-xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#a1a1aa] mb-4">Feature Status</p>
                <div className="space-y-2.5">
                  <FeatureRow label="Email delivery" on={draft.emailEnabled} />
                  <FeatureRow label="Telegram bot" on={draft.telegramEnabled} />
                  <FeatureRow label="AI summarization" on={true} />
                  <FeatureRow label="Deduplication" on={true} />
                  <FeatureRow label="RSS collection" on={draft.rssEnabled} />
                  <FeatureRow label="HN collection" on={draft.hnEnabled} />
                  <FeatureRow label="Reddit collection" on={draft.redditEnabled} />
                  <FeatureRow label="Top Stories email section" on={draft.showTopStories} />
                  <FeatureRow label="AI News email section" on={draft.showAiNews} />
                  <FeatureRow label="Tech News email section" on={draft.showTechNews} />
                  <FeatureRow label="Quick Links email section" on={draft.showQuickLinks} />
                  <FeatureRow label="Deep Dive analysis" on={draft.showDeepDive} />
                  <FeatureRow label="Paper of the Day" on={draft.showPaperOfTheDay} />
                  <FeatureRow label="By the Numbers" on={draft.showDataPoints} />
                  <FeatureRow label="Key Takeaways" on={draft.showKeyTakeaways} />
                  <FeatureRow label="Quote of the Day" on={draft.showQuoteOfTheDay} />
                  <FeatureRow label="Related Reads" on={draft.showRelatedReads} />
                  <FeatureRow label="Tool of the Day spotlight" on={draft.showToolOfTheDay} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-12 flex gap-4 text-[12px] text-[#a1a1aa]">
          <a href="/" className="hover:text-[#0a0a0a] transition-colors">home</a>
          <a href="/dashboard" className="hover:text-[#0a0a0a] transition-colors">dashboard</a>
          <a href="/admin" className="hover:text-[#0a0a0a] transition-colors">admin</a>
          <a href="/test" className="hover:text-[#0a0a0a] transition-colors">tests</a>
        </div>
      </div>

      {/* AI Assistant Chat */}
      <AiChat
        secret={secret}
        onSettingsChange={(updated) => {
          setSettings(updated);
          setDraft(updated);
          setHasChanges(false);
        }}
      />
    </div>
  );
}

// ─── Reusable Components ──────────────────────────────────

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[12px] text-[#71717a] mb-1.5 block">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-lg border border-[#e4e4e7] bg-white text-[13px] outline-none focus:border-[#0a0a0a] focus:ring-1 focus:ring-[#0a0a0a] transition-all duration-200" />
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[12px] text-[#71717a] mb-1.5 block">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
        className="w-full px-3 py-2 rounded-lg border border-[#e4e4e7] bg-white text-[13px] outline-none resize-none focus:border-[#0a0a0a] focus:ring-1 focus:ring-[#0a0a0a] transition-all duration-200" />
    </div>
  );
}

function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div>
      <label className="text-[12px] text-[#71717a] mb-1.5 block">{label}</label>
      <input type="number" value={value} min={min} max={max} onChange={(e) => onChange(parseInt(e.target.value) || min)}
        className="w-full h-9 px-3 rounded-lg border border-[#e4e4e7] bg-white text-[13px] outline-none focus:border-[#0a0a0a] focus:ring-1 focus:ring-[#0a0a0a] transition-all duration-200 tabular-nums" />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex items-center justify-between w-full group">
      <span className="text-[13px] text-[#0a0a0a]">{label}</span>
      <div className={`w-9 h-5 rounded-full transition-colors duration-200 flex items-center px-0.5 ${
        checked ? "bg-[#0a0a0a]" : "bg-[#e4e4e7]"
      }`}>
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`} />
      </div>
    </button>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a1a1aa] mb-2">{title}</p>
      {items.map((item) => (
        <div key={item} className="py-1.5 border-b border-[#f4f4f5] last:border-0">
          <p className="text-[12px] font-medium text-[#0a0a0a]">{item}</p>
          <p className="text-[10px] text-[#a1a1aa]">Source · 7/10 · 2h ago</p>
        </div>
      ))}
    </div>
  );
}

function SourceRow({ label, count, enabled, detail }: { label: string; count: string; enabled: boolean; detail: string }) {
  return (
    <div className={`flex items-start gap-3 py-3 border-b border-[#f4f4f5] last:border-0 ${!enabled ? "opacity-40" : ""} transition-opacity`}>
      <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${enabled ? "bg-[#0a0a0a]" : "bg-[#e4e4e7]"}`} />
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium">{label}</span>
          <span className="text-[11px] text-[#a1a1aa]">{count}</span>
        </div>
        <p className="text-[11px] text-[#a1a1aa] mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

function FeatureRow({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`w-1.5 h-1.5 rounded-full ${on ? "bg-[#0a0a0a]" : "bg-[#e4e4e7]"}`} />
      <span className={`text-[12px] ${on ? "text-[#0a0a0a]" : "text-[#d4d4d8]"}`}>{label}</span>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener" className="flex items-center gap-2 text-[12px] text-[#71717a] hover:text-[#0a0a0a] transition-colors">
      <span className="text-[#d4d4d8]">→</span> {label}
    </a>
  );
}

function formatLocalTime(utcHour: number): string {
  const offset = -(new Date().getTimezoneOffset() / 60);
  const local = (utcHour + offset + 24) % 24;
  const ampm = local >= 12 ? "PM" : "AM";
  const h = local % 12 || 12;
  return `${h}:00 ${ampm} local`;
}
