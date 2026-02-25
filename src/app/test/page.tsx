"use client";

import { useState, useEffect } from "react";

interface TestResult {
  ok?: boolean;
  error?: string;
  detail?: string;
  ms?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

type TestStatus = "idle" | "running" | "pass" | "fail";

interface TestItem {
  id: string;
  label: string;
  description: string;
  status: TestStatus;
  result: TestResult | null;
}

const INITIAL_TESTS: Omit<TestItem, "status" | "result">[] = [
  { id: "env", label: "Environment Variables", description: "Check all .env values are set" },
  { id: "firebase", label: "Firebase Firestore", description: "Write, read, delete test document" },
  { id: "groq", label: "Groq AI", description: "Send a prompt to Llama 3.3 70B" },
  { id: "resend", label: "Resend Email", description: "Verify API key is valid" },
  { id: "rss", label: "RSS Feed Fetch", description: "Fetch 5 articles from Hacker News" },
  { id: "summarize", label: "AI Summarization", description: "Summarize a sample headline with AI" },
];

export default function TestPage() {
  const [secret, setSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [tests, setTests] = useState<TestItem[]>(
    INITIAL_TESTS.map((t) => ({ ...t, status: "idle", result: null }))
  );
  const [allRunning, setAllRunning] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailResult, setEmailResult] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_secret");
    if (saved) { setSecret(saved); setAuthenticated(true); }
  }, []);

  const headers = () => ({
    "Content-Type": "application/json",
    "x-admin-secret": secret,
  });

  const runSingleTest = async (testId: string) => {
    setTests((prev) =>
      prev.map((t) => (t.id === testId ? { ...t, status: "running", result: null } : t))
    );

    try {
      const res = await fetch("/api/admin/test", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ test: testId }),
      });

      if (res.status === 401) { setAuthenticated(false); return; }

      const data: TestResult = await res.json();
      setTests((prev) =>
        prev.map((t) =>
          t.id === testId
            ? { ...t, status: data.ok ? "pass" : "fail", result: data }
            : t
        )
      );
    } catch (e) {
      setTests((prev) =>
        prev.map((t) =>
          t.id === testId
            ? { ...t, status: "fail", result: { ok: false, error: (e as Error).message } }
            : t
        )
      );
    }
  };

  const runAllTests = async () => {
    setAllRunning(true);
    for (const test of INITIAL_TESTS) {
      await runSingleTest(test.id);
    }
    setAllRunning(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem("admin_secret", secret);
    setAuthenticated(true);
    setTimeout(runAllTests, 100);
  };

  const sendTestEmail = async () => {
    if (!testEmail) return;
    setEmailStatus("sending");
    try {
      const res = await fetch("/api/admin/test", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ test: "email", to: testEmail }),
      });
      const data = await res.json();
      if (data.ok) {
        setEmailStatus("sent");
        setEmailResult(`Sent in ${data.ms}ms`);
      } else {
        setEmailStatus("error");
        setEmailResult(data.error || "Failed");
      }
    } catch (e) {
      setEmailStatus("error");
      setEmailResult((e as Error).message);
    }
  };

  const passCount = tests.filter((t) => t.status === "pass").length;
  const failCount = tests.filter((t) => t.status === "fail").length;
  const totalRun = passCount + failCount;

  // Login
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center noise">
        <form onSubmit={handleLogin} className="w-full max-w-xs animate-scale-in">
          <h1 className="text-[15px] font-semibold tracking-tight text-center mb-1">test suite</h1>
          <p className="text-[12px] text-[#a1a1aa] text-center mb-8">enter admin secret to begin</p>
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
            run tests
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0a0a0a] noise">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#fafafa]/80 backdrop-blur-xl border-b border-[#e4e4e7]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between animate-slide-down">
          <div className="flex items-center gap-3">
            <a href="/" className="text-[15px] font-semibold tracking-tight hover:opacity-60 transition-opacity">
              ai&thinsp;&&thinsp;tech daily
            </a>
            <span className="text-[11px] text-[#a1a1aa] border border-[#e4e4e7] px-2 py-0.5 rounded-full">
              tests
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-[13px] text-[#71717a] hover:text-[#0a0a0a] transition-colors">admin</a>
            <button
              onClick={runAllTests}
              disabled={allRunning}
              className="text-[13px] text-[#71717a] hover:text-[#0a0a0a] transition-colors disabled:opacity-40"
            >
              {allRunning ? "running..." : "run all"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Summary */}
        {totalRun > 0 && (
          <div className="flex items-center gap-4 mb-8 animate-slide-up">
            <div className={`text-[13px] font-medium px-3 py-1.5 rounded-lg ${
              failCount === 0 ? "bg-[#0a0a0a] text-white" : "bg-red-50 text-red-600"
            }`}>
              {failCount === 0 ? `${passCount}/${tests.length} passed` : `${failCount} failed`}
            </div>
            {/* Progress dots */}
            <div className="flex gap-1">
              {tests.map((t) => (
                <span
                  key={t.id}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    t.status === "pass" ? "bg-[#0a0a0a]" :
                    t.status === "fail" ? "bg-red-500" :
                    t.status === "running" ? "bg-[#a1a1aa] animate-pulse" :
                    "bg-[#e4e4e7]"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tests */}
        <div className="border border-[#e4e4e7] rounded-xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] animate-slide-up">
          {tests.map((test, i) => (
            <div
              key={test.id}
              className={`px-5 py-4 ${i < tests.length - 1 ? "border-b border-[#f4f4f5]" : ""} ${
                test.status === "running" ? "bg-[#fafafa]" : ""
              } transition-all duration-200`}
            >
              <div className="flex items-center gap-4">
                {/* Status icon */}
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  {test.status === "idle" && (
                    <span className="w-2 h-2 rounded-full bg-[#e4e4e7]" />
                  )}
                  {test.status === "running" && (
                    <div className="w-4 h-4 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
                  )}
                  {test.status === "pass" && (
                    <svg className="w-4 h-4 text-[#0a0a0a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {test.status === "fail" && (
                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[14px] font-medium ${
                      test.status === "fail" ? "text-red-600" :
                      test.status === "pass" ? "text-[#0a0a0a]" : "text-[#71717a]"
                    }`}>
                      {test.label}
                    </span>
                    <span className="text-[12px] text-[#d4d4d8]">{test.description}</span>
                  </div>

                  {/* Result details */}
                  {test.result && (
                    <div className="mt-1.5">
                      {test.result.ok && test.result.detail && (
                        <p className="text-[12px] text-[#71717a]">{test.result.detail}</p>
                      )}
                      {test.result.error && (
                        <p className="text-[12px] text-red-500">{test.result.error}</p>
                      )}
                      {/* Env vars table */}
                      {test.id === "env" && test.result.vars && (
                        <div className="mt-2 space-y-0.5">
                          {test.result.vars.map((v: { name: string; set: boolean; preview: string }) => (
                            <div key={v.name} className="flex items-center gap-2 text-[12px]">
                              <span className={`w-1.5 h-1.5 rounded-full ${v.set ? "bg-[#0a0a0a]" : "bg-[#e4e4e7]"}`} />
                              <span className="font-mono text-[#71717a] w-48">{v.name}</span>
                              <span className={v.set ? "text-[#a1a1aa]" : "text-red-400"}>
                                {v.set ? v.preview : "not set"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* RSS items */}
                      {test.id === "rss" && test.result.items && (
                        <div className="mt-1.5 space-y-0.5">
                          {test.result.items.map((title: string, idx: number) => (
                            <p key={idx} className="text-[11px] text-[#a1a1aa] truncate">
                              {idx + 1}. {title}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Timing + rerun */}
                <div className="flex items-center gap-3 shrink-0">
                  {test.result?.ms !== undefined && (
                    <span className="text-[11px] text-[#d4d4d8] tabular-nums w-12 text-right">
                      {test.result.ms}ms
                    </span>
                  )}
                  <button
                    onClick={() => runSingleTest(test.id)}
                    disabled={test.status === "running"}
                    className="text-[12px] text-[#d4d4d8] hover:text-[#0a0a0a] transition-colors disabled:opacity-30"
                  >
                    rerun
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Send test email */}
        <div className="mt-10 animate-slide-up delay-200">
          <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-[#a1a1aa] mb-4">
            Send test email
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => { setTestEmail(e.target.value); setEmailStatus("idle"); }}
              placeholder="your@email.com"
              className="flex-1 h-10 px-4 rounded-lg border border-[#e4e4e7] bg-white text-[13px] outline-none placeholder:text-[#a1a1aa] focus:border-[#0a0a0a] focus:ring-1 focus:ring-[#0a0a0a] transition-all duration-200"
            />
            <button
              onClick={sendTestEmail}
              disabled={emailStatus === "sending" || !testEmail}
              className="h-10 px-5 rounded-lg bg-[#0a0a0a] text-white text-[13px] font-medium hover:bg-[#171717] active:scale-[0.98] transition-all duration-200 disabled:opacity-40"
            >
              {emailStatus === "sending" ? "sending..." : "send"}
            </button>
          </div>
          {emailStatus === "sent" && (
            <p className="text-[12px] text-[#0a0a0a] mt-2 animate-slide-up">{emailResult}</p>
          )}
          {emailStatus === "error" && (
            <p className="text-[12px] text-red-500 mt-2 animate-slide-up">{emailResult}</p>
          )}
        </div>

        {/* Links */}
        <div className="mt-10 flex gap-4 text-[12px] text-[#a1a1aa] animate-fade-in delay-300">
          <a href="/" className="hover:text-[#0a0a0a] transition-colors">home</a>
          <a href="/dashboard" className="hover:text-[#0a0a0a] transition-colors">dashboard</a>
          <a href="/admin" className="hover:text-[#0a0a0a] transition-colors">admin</a>
        </div>
      </main>
    </div>
  );
}
