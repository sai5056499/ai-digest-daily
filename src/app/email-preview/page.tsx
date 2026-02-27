"use client";

import { useState, useEffect } from "react";

type Device = "desktop" | "mobile";
type Theme = "dark" | "light" | "notion" | "notionDark";
type Edition = "daily" | "weekly";

export default function EmailPreviewPage() {
  const [device, setDevice] = useState<Device>("desktop");
  const [theme, setTheme] = useState<Theme>("notion");
  const [edition, setEdition] = useState<Edition>("daily");
  const [loaded, setLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const widths: Record<Device, number> = { desktop: 620, mobile: 375 };

  const iframeSrc = `/api/email-preview?theme=${theme}&edition=${edition}&_=${refreshKey}`;

  useEffect(() => {
    setLoaded(false);
  }, [refreshKey, theme, edition]);

  const isDark = theme === "dark" || theme === "notionDark";
  const pageBg = isDark ? "#09090b" : "#f5f5f5";
  const pageText = isDark ? "#e4e4e7" : "#0a0a0a";
  const toolbarBg = isDark ? "#09090b" : "#ffffff";
  const toolbarBorder = isDark ? "#18181b" : "#e5e5e5";
  const pillBg = isDark ? "#18181b" : "#fafafa";
  const pillActive = isDark ? "#27272a" : "#e5e5e5";
  const pillText = isDark ? "#52525b" : "#737373";
  const pillActiveText = isDark ? "#ffffff" : "#0a0a0a";
  const badgeBorder = isDark ? "#27272a" : "#e5e5e5";
  const badgeText = isDark ? "#52525b" : "#737373";
  const chromeBg = isDark ? "#18181b" : "#fafafa";
  const chromeBorder = isDark ? "#27272a" : "#e5e5e5";
  const chromeBar = isDark ? "#09090b" : "#ffffff";
  const chromeBarText = isDark ? "#3f3f46" : "#737373";
  const iframeBg = isDark ? "#09090b" : "#ffffff";
  const spinnerColor = isDark ? "#818cf8" : "#0a0a0a";
  const dotColor = isDark ? "#27272a" : "#d4d4d4";
  const footerBorder = isDark ? "#18181b" : "#e5e5e5";
  const footerText = isDark ? "#3f3f46" : "#737373";
  const btnBg = isDark ? "#18181b" : "#fafafa";
  const btnBorder = isDark ? "#27272a" : "#e5e5e5";
  const btnText = isDark ? "#a1a1aa" : "#52525b";

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: pageBg, color: pageText }}>
      {/* Toolbar */}
      <div
        className="sticky top-0 z-20 backdrop-blur-xl transition-colors duration-300"
        style={{ background: `${toolbarBg}ee`, borderBottom: `1px solid ${toolbarBorder}` }}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Left */}
          <div className="flex items-center gap-4">
            <a href="/" className="text-[14px] font-semibold tracking-wide uppercase transition-colors" style={{ color: pillText }}>
              AI & Tech Daily
            </a>
            <span
              className="text-[11px] px-2.5 py-0.5 rounded-full font-mono transition-colors"
              style={{ color: badgeText, border: `1px solid ${badgeBorder}` }}
            >
              email preview
            </span>
          </div>

          {/* Center controls */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <div className="flex items-center gap-1 rounded-lg p-1 transition-colors" style={{ background: pillBg }}>
              <button
                onClick={() => setTheme("dark")}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200"
                style={{
                  background: theme === "dark" ? pillActive : "transparent",
                  color: theme === "dark" ? pillActiveText : pillText,
                }}
              >
                <span className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  Dark
                </span>
              </button>
              <button
                onClick={() => setTheme("light")}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200"
                style={{
                  background: theme === "light" ? pillActive : "transparent",
                  color: theme === "light" ? pillActiveText : pillText,
                }}
              >
                <span className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                  Light
                </span>
              </button>
              <button
                onClick={() => setTheme("notion")}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200"
                style={{
                  background: theme === "notion" ? pillActive : "transparent",
                  color: theme === "notion" ? pillActiveText : pillText,
                }}
              >
                <span className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <path d="M9 9h6" />
                    <path d="M9 13h6" />
                    <path d="M9 17h4" />
                  </svg>
                  Notion
                </span>
              </button>
              <button
                onClick={() => setTheme("notionDark")}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200"
                style={{
                  background: theme === "notionDark" ? pillActive : "transparent",
                  color: theme === "notionDark" ? pillActiveText : pillText,
                }}
              >
                <span className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <path d="M9 9h6" />
                    <path d="M9 13h6" />
                    <path d="M9 17h4" />
                  </svg>
                  Notion dark
                </span>
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-5 transition-colors" style={{ background: toolbarBorder }} />

            {/* Device toggle */}
            <div className="flex items-center gap-1 rounded-lg p-1 transition-colors" style={{ background: pillBg }}>
              <button
                onClick={() => setDevice("desktop")}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200"
                style={{
                  background: device === "desktop" ? pillActive : "transparent",
                  color: device === "desktop" ? pillActiveText : pillText,
                }}
              >
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                  Desktop
                </span>
              </button>
              <button
                onClick={() => setDevice("mobile")}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200"
                style={{
                  background: device === "mobile" ? pillActive : "transparent",
                  color: device === "mobile" ? pillActiveText : pillText,
                }}
              >
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                  Mobile
                </span>
              </button>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Edition toggle */}
            <div className="flex items-center gap-1 rounded-lg p-1 transition-colors" style={{ background: pillBg }}>
              <button
                onClick={() => setEdition("daily")}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200"
                style={{
                  background: edition === "daily" ? pillActive : "transparent",
                  color: edition === "daily" ? pillActiveText : pillText,
                }}
              >
                Daily
              </button>
              <button
                onClick={() => setEdition("weekly")}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200"
                style={{
                  background: edition === "weekly" ? pillActive : "transparent",
                  color: edition === "weekly" ? pillActiveText : pillText,
                }}
              >
                Weekly
              </button>
            </div>

            <div className="w-px h-5 transition-colors" style={{ background: toolbarBorder }} />

            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200 hover:opacity-80"
              style={{ color: pillText }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Refresh
            </button>
            <a
              href={`/api/email-preview?theme=${theme}`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200 hover:opacity-80"
              style={{ color: pillText }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Open raw
            </a>
            <a
              href="/sandbox"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200 hover:opacity-80"
              style={{ background: btnBg, border: `1px solid ${btnBorder}`, color: btnText }}
            >
              Sandbox
            </a>
          </div>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex justify-center py-10 px-6">
        <div className="relative">
          <div className="transition-all duration-500 ease-out" style={{ width: widths[device] }}>
            {/* Browser chrome */}
            <div
              className="rounded-t-xl px-4 py-2.5 flex items-center gap-3 transition-colors duration-300"
              style={{ background: chromeBg, border: `1px solid ${chromeBorder}`, borderBottom: "none" }}
            >
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full transition-colors" style={{ background: dotColor }} />
                <div className="w-2.5 h-2.5 rounded-full transition-colors" style={{ background: dotColor }} />
                <div className="w-2.5 h-2.5 rounded-full transition-colors" style={{ background: dotColor }} />
              </div>
              <div
                className="flex-1 rounded-md px-3 py-1 text-[11px] font-mono text-center transition-colors"
                style={{ background: chromeBar, color: chromeBarText }}
              >
                {edition} preview &mdash; {theme} &mdash; {widths[device]}px
              </div>
            </div>

            {/* Iframe container */}
            <div
              className="relative rounded-b-xl overflow-hidden transition-colors duration-300"
              style={{ background: iframeBg, border: `1px solid ${chromeBorder}`, minHeight: 600 }}
            >
              {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center z-10 transition-colors" style={{ background: iframeBg }}>
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${spinnerColor} transparent ${spinnerColor} ${spinnerColor}` }} />
                    <span className="text-[11px] font-mono" style={{ color: chromeBarText }}>
                      rendering {theme} template...
                    </span>
                  </div>
                </div>
              )}

              <iframe
                key={`${theme}-${refreshKey}`}
                src={iframeSrc}
                className="w-full border-0 transition-opacity duration-300"
                style={{
                  height: loaded ? undefined : 0,
                  minHeight: loaded ? 600 : 0,
                  opacity: loaded ? 1 : 0,
                }}
                onLoad={(e) => {
                  setLoaded(true);
                  const iframe = e.target as HTMLIFrameElement;
                  try {
                    const doc = iframe.contentDocument;
                    if (doc?.body) {
                      iframe.style.height = doc.body.scrollHeight + "px";
                    }
                  } catch {
                    iframe.style.height = "2400px";
                  }
                }}
              />
            </div>
          </div>

          {/* Dimension label */}
          <div className="text-center mt-4">
            <span className="text-[11px] font-mono transition-colors" style={{ color: dotColor }}>
              {widths[device]}px &times; auto
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center transition-colors" style={{ borderTop: `1px solid ${footerBorder}` }}>
        <div className="flex items-center justify-center gap-4 text-[11px] transition-colors" style={{ color: footerText }}>
          <a href="/" className="hover:opacity-70 transition-opacity">home</a>
          <span>&middot;</span>
          <a href="/sandbox" className="hover:opacity-70 transition-opacity">sandbox</a>
          <span>&middot;</span>
          <a href="/dashboard" className="hover:opacity-70 transition-opacity">dashboard</a>
          <span>&middot;</span>
          <a href="/admin" className="hover:opacity-70 transition-opacity">admin</a>
        </div>
      </div>
    </div>
  );
}
