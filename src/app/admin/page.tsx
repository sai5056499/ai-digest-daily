"use client";

import { useState, useEffect, useCallback } from "react";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  frequency: string;
  confirmed: boolean;
  emails_received: number;
  last_email_sent: string | null;
  created_at: string;
}

interface EmailLog {
  id: string;
  subscriber_id: string;
  subscriber_email?: string;
  subject: string;
  articles_count: number;
  sent_at: string;
  status: "sent" | "failed";
}

interface Stats {
  totalArticles: number;
  activeSubscribers: number;
  emailsSentToday: number;
  sourcesCount: number;
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [tab, setTab] = useState<"subscribers" | "logs" | "pipeline">("subscribers");
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<string | null>(null);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineSteps, setPipelineSteps] = useState<any[]>([]);
  const [pipelineStatus, setPipelineStatus] = useState<string>("idle");
  const [pipelineStartedAt, setPipelineStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const headers = useCallback(
    () => ({ "Content-Type": "application/json", "x-admin-secret": secret }),
    [secret]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, logRes, statsRes] = await Promise.all([
        fetch("/api/admin/subscribers", { headers: { "x-admin-secret": secret } }),
        fetch("/api/admin/logs", { headers: { "x-admin-secret": secret } }),
        fetch("/api/stats"),
      ]);

      if (subRes.status === 401) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      const subData = await subRes.json();
      const logData = await logRes.json();
      const statsData = await statsRes.json();

      setSubscribers(subData.subscribers || []);
      setLogs(logData.logs || []);
      setStats(statsData);
      setAuthenticated(true);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [secret]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchData();
  };

  const toggleSubscriber = async (id: string, currentActive: boolean) => {
    await fetch("/api/admin/subscribers", {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ id, is_active: !currentActive }),
    });
    setSubscribers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: !currentActive } : s))
    );
  };

  const removeSubscriber = async (id: string) => {
    if (!confirm("Remove this subscriber permanently?")) return;
    await fetch("/api/admin/subscribers", {
      method: "DELETE",
      headers: headers(),
      body: JSON.stringify({ id }),
    });
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
  };

  // Elapsed time ticker
  useEffect(() => {
    if (!pipelineRunning || !pipelineStartedAt) return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - pipelineStartedAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [pipelineRunning, pipelineStartedAt]);

  const runPipeline = async (mode: "full" | "collect") => {
    setPipelineRunning(true);
    setPipelineResult(null);
    setPipelineSteps([]);
    setPipelineStatus("running");
    setPipelineStartedAt(Date.now());
    setElapsed(0);

    // Start SSE listener for progress
    const evtSource = new EventSource(
      `/api/admin/pipeline-status?secret=${encodeURIComponent(secret)}`
    );

    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.steps) setPipelineSteps(data.steps);
        if (data.status) setPipelineStatus(data.status);
        if (data.startedAt) setPipelineStartedAt(data.startedAt);
        if (data.status === "done" || data.status === "error") {
          evtSource.close();
        }
      } catch { /* ignore parse errors */ }
    };

    evtSource.onerror = () => {
      evtSource.close();
    };

    // Trigger the pipeline
    try {
      const res = await fetch("/api/trigger-pipeline", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ secret, mode }),
      });
      const data = await res.json();
      setPipelineResult(JSON.stringify(data, null, 2));
      await fetchData();
    } catch (e) {
      setPipelineResult(`Error: ${(e as Error).message}`);
    }

    evtSource.close();
    setPipelineRunning(false);
  };

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_secret");
    if (saved) {
      setSecret(saved);
    }
  }, []);

  useEffect(() => {
    if (secret && !authenticated) {
      fetchData();
    }
  }, [secret, authenticated, fetchData]);

  function timeAgo(dateStr: string | null): string {
    if (!dateStr) return "never";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center noise">
        <form onSubmit={handleLogin} className="w-full max-w-xs animate-scale-in">
          <h1 className="text-[15px] font-semibold tracking-tight text-center mb-8">
            admin
          </h1>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="admin secret"
            className="w-full h-11 px-4 rounded-lg border border-[#e4e4e7] bg-white text-[14px] outline-none placeholder:text-[#a1a1aa] focus:border-[#0a0a0a] focus:ring-1 focus:ring-[#0a0a0a] transition-all duration-200 mb-3"
            autoFocus
          />
          <button
            type="submit"
            className="w-full h-11 rounded-lg bg-[#0a0a0a] text-white text-[14px] font-medium hover:bg-[#171717] active:scale-[0.98] transition-all duration-200"
          >
            {loading ? "verifying..." : "enter"}
          </button>
        </form>
      </div>
    );
  }

  const activeCount = subscribers.filter((s) => s.is_active).length;
  const inactiveCount = subscribers.length - activeCount;

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0a0a0a] noise">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#fafafa]/80 backdrop-blur-xl border-b border-[#e4e4e7]">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between animate-slide-down">
          <div className="flex items-center gap-3">
            <a href="/" className="text-[15px] font-semibold tracking-tight hover:opacity-60 transition-opacity">
              ai&thinsp;&&thinsp;tech daily
            </a>
            <span className="text-[11px] text-[#a1a1aa] border border-[#e4e4e7] px-2 py-0.5 rounded-full">
              admin
            </span>
          </div>
          <button
            onClick={fetchData}
            className="text-[13px] text-[#71717a] hover:text-[#0a0a0a] transition-colors duration-200"
          >
            refresh
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-5 gap-px bg-[#e4e4e7] rounded-xl overflow-hidden mb-10 animate-slide-up shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <MiniStat value={stats.totalArticles.toLocaleString()} label="Articles" />
            <MiniStat value={stats.sourcesCount.toString()} label="Sources" />
            <MiniStat value={activeCount.toString()} label="Active" />
            <MiniStat value={inactiveCount.toString()} label="Inactive" />
            <MiniStat value={stats.emailsSentToday.toLocaleString()} label="Sent today" />
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 animate-slide-up delay-100">
          {(["subscribers", "logs", "pipeline"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                tab === t
                  ? "bg-[#0a0a0a] text-white"
                  : "text-[#71717a] hover:text-[#0a0a0a] hover:bg-[#f4f4f5]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Subscribers tab */}
        {tab === "subscribers" && (
          <div className="animate-slide-up delay-200">
            {subscribers.length === 0 ? (
              <Empty message="No subscribers yet" />
            ) : (
              <div className="border border-[#e4e4e7] rounded-xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_90px_80px_80px_70px] gap-4 px-5 py-3 border-b border-[#f4f4f5] text-[11px] font-medium uppercase tracking-[0.1em] text-[#a1a1aa]">
                  <span>Email</span>
                  <span>Joined</span>
                  <span>Emails</span>
                  <span>Status</span>
                  <span></span>
                </div>

                {/* Rows */}
                {subscribers.map((sub) => (
                  <div
                    key={sub.id}
                    className="grid grid-cols-[1fr_90px_80px_80px_70px] gap-4 px-5 py-3.5 border-b border-[#f4f4f5] last:border-0 items-center hover:bg-[#fafafa] transition-colors duration-150"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium truncate">{sub.email}</p>
                      {sub.name && (
                        <p className="text-[11px] text-[#a1a1aa] truncate">{sub.name}</p>
                      )}
                    </div>
                    <span className="text-[12px] text-[#71717a] tabular-nums">
                      {timeAgo(sub.created_at)}
                    </span>
                    <span className="text-[12px] text-[#71717a] tabular-nums">
                      {sub.emails_received}
                    </span>
                    <button
                      onClick={() => toggleSubscriber(sub.id, sub.is_active)}
                      className="flex items-center gap-1.5 group"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          sub.is_active ? "bg-[#0a0a0a]" : "bg-[#d4d4d8]"
                        }`}
                      />
                      <span className="text-[12px] text-[#71717a] group-hover:text-[#0a0a0a] transition-colors">
                        {sub.is_active ? "active" : "paused"}
                      </span>
                    </button>
                    <button
                      onClick={() => removeSubscriber(sub.id)}
                      className="text-[12px] text-[#d4d4d8] hover:text-red-500 transition-colors duration-200 text-right"
                    >
                      remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Logs tab */}
        {tab === "logs" && (
          <div className="animate-slide-up delay-200">
            {logs.length === 0 ? (
              <Empty message="No emails sent yet" />
            ) : (
              <div className="border border-[#e4e4e7] rounded-xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="grid grid-cols-[1fr_1fr_80px_80px] gap-4 px-5 py-3 border-b border-[#f4f4f5] text-[11px] font-medium uppercase tracking-[0.1em] text-[#a1a1aa]">
                  <span>Recipient</span>
                  <span>Subject</span>
                  <span>Status</span>
                  <span>When</span>
                </div>

                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="grid grid-cols-[1fr_1fr_80px_80px] gap-4 px-5 py-3.5 border-b border-[#f4f4f5] last:border-0 items-center"
                  >
                    <span className="text-[13px] truncate">
                      {log.subscriber_email}
                    </span>
                    <span className="text-[13px] text-[#71717a] truncate">
                      {log.subject || "—"}
                    </span>
                    <span className={`text-[12px] font-medium ${
                      log.status === "sent" ? "text-[#0a0a0a]" : "text-red-500"
                    }`}>
                      {log.status}
                    </span>
                    <span className="text-[12px] text-[#a1a1aa] tabular-nums">
                      {timeAgo(log.sent_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pipeline tab */}
        {tab === "pipeline" && (
          <div className="animate-slide-up delay-200 space-y-8">
            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => runPipeline("collect")}
                disabled={pipelineRunning}
                className="h-10 px-5 rounded-lg border border-[#e4e4e7] bg-white text-[13px] font-medium hover:bg-[#f4f4f5] active:scale-[0.98] transition-all duration-200 disabled:opacity-40"
              >
                collect only
              </button>
              <button
                onClick={() => runPipeline("full")}
                disabled={pipelineRunning}
                className="h-10 px-5 rounded-lg bg-[#0a0a0a] text-white text-[13px] font-medium hover:bg-[#171717] active:scale-[0.98] transition-all duration-200 disabled:opacity-40"
              >
                full pipeline
              </button>
              {pipelineRunning && (
                <span className="text-[13px] text-[#71717a] tabular-nums ml-2">
                  {formatElapsed(elapsed)}
                </span>
              )}
            </div>

            {/* Live steps */}
            {pipelineSteps.length > 0 && (
              <div className="border border-[#e4e4e7] rounded-xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                {/* Progress bar */}
                <div className="h-1 bg-[#f4f4f5]">
                  <div
                    className="h-full bg-[#0a0a0a] transition-all duration-500 ease-out"
                    style={{
                      width: `${(pipelineSteps.filter((s: any) => s.status === "done").length / pipelineSteps.length) * 100}%`,
                    }}
                  />
                </div>

                {pipelineSteps.map((step: any, i: number) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-4 px-5 py-3.5 ${
                      i < pipelineSteps.length - 1 ? "border-b border-[#f4f4f5]" : ""
                    } transition-all duration-300 ${
                      step.status === "running" ? "bg-[#fafafa]" : ""
                    }`}
                  >
                    {/* Status icon */}
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      {step.status === "pending" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#e4e4e7]" />
                      )}
                      {step.status === "running" && (
                        <div className="w-4 h-4 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
                      )}
                      {step.status === "done" && (
                        <svg className="w-4 h-4 text-[#0a0a0a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {step.status === "error" && (
                        <span className="w-4 h-4 text-[13px] leading-none text-red-500">!</span>
                      )}
                    </div>

                    {/* Label */}
                    <span className={`text-[13px] flex-1 ${
                      step.status === "running"
                        ? "text-[#0a0a0a] font-medium"
                        : step.status === "done"
                          ? "text-[#71717a]"
                          : step.status === "error"
                            ? "text-red-500"
                            : "text-[#d4d4d8]"
                    }`}>
                      {step.label}
                    </span>

                    {/* Detail */}
                    {step.detail && (
                      <span className="text-[12px] text-[#a1a1aa] tabular-nums shrink-0">
                        {step.detail}
                      </span>
                    )}

                    {/* Duration */}
                    {step.status === "done" && step.startedAt && step.finishedAt && (
                      <span className="text-[11px] text-[#d4d4d8] tabular-nums shrink-0 w-12 text-right">
                        {formatMs(step.finishedAt - step.startedAt)}
                      </span>
                    )}
                    {step.status === "running" && step.startedAt && (
                      <span className="text-[11px] text-[#a1a1aa] tabular-nums shrink-0 w-12 text-right animate-pulse">
                        {formatMs(Date.now() - step.startedAt)}
                      </span>
                    )}
                  </div>
                ))}

                {/* Summary bar */}
                {(pipelineStatus === "done" || pipelineStatus === "error") && (
                  <div className={`px-5 py-3 text-[12px] border-t ${
                    pipelineStatus === "done"
                      ? "bg-[#fafafa] text-[#71717a]"
                      : "bg-red-50 text-red-500"
                  }`}>
                    {pipelineStatus === "done"
                      ? `Completed in ${formatElapsed(elapsed)}`
                      : "Pipeline failed — check result below"}
                  </div>
                )}
              </div>
            )}

            {/* JSON result */}
            {pipelineResult && !pipelineRunning && (
              <details className="group">
                <summary className="text-[12px] text-[#a1a1aa] cursor-pointer hover:text-[#71717a] transition-colors">
                  raw output
                </summary>
                <pre className="mt-3 p-5 rounded-xl border border-[#e4e4e7] bg-white text-[12px] font-mono text-[#71717a] leading-relaxed overflow-x-auto shadow-[0_1px_3px_rgba(0,0,0,0.04)] animate-scale-in">
                  {pipelineResult}
                </pre>
              </details>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white py-4 px-3 text-center">
      <div className="text-[18px] font-bold tracking-tight">{value}</div>
      <div className="text-[10px] text-[#a1a1aa] mt-0.5">{label}</div>
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="text-center py-24">
      <p className="text-[32px] mb-3 animate-float">~</p>
      <p className="text-[14px] text-[#a1a1aa]">{message}</p>
    </div>
  );
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function formatMs(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m${(seconds % 60).toString().padStart(2, "0")}s`;
}
