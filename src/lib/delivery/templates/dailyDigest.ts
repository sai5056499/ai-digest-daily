import Handlebars from "handlebars";
import type { NewsletterData } from "@/lib/ai/newsletterComposer";

// ── Theme definitions ──────────────────────────────────────
interface ThemeColors {
  bg: string;
  wrapper: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  border: string;
  card: string;
  cardFeatured: string;
  cardFeaturedBorder: string;
  surface: string;
  accent: string;
  accentSecondary: string;
  accentTertiary: string;
  green: string;
  barTrack: string;
  tagBorder: string;
  tagColor: string;
  toolBg: string;
  toolKeyBg: string;
  toolKeyBorder: string;
  /** Notion-style: no gradients, simple borders, black/white only */
  simpleStyle?: boolean;
  breakingBg?: string;
  breakingFg?: string;
  sectionIconBg?: string;
  sectionIconFg?: string;
}

const THEMES: Record<string, ThemeColors> = {
  dark: {
    bg: "#09090b",
    wrapper: "#09090b",
    text: "#fafafa",
    textSecondary: "#d4d4d8",
    textMuted: "#a1a1aa",
    textFaint: "#52525b",
    border: "#18181b",
    card: "#111113",
    cardFeatured: "#13111c",
    cardFeaturedBorder: "#2e2e4e",
    surface: "#18181b",
    accent: "#818cf8",
    accentSecondary: "#a78bfa",
    accentTertiary: "#c084fc",
    green: "#34d399",
    barTrack: "#1e1e2e",
    tagBorder: "#2e2e3e",
    tagColor: "#818cf8",
    toolBg: "#1e1b4b",
    toolKeyBg: "#09090b",
    toolKeyBorder: "#27272a",
  },
  light: {
    bg: "#fafafa",
    wrapper: "#ffffff",
    text: "#0a0a0a",
    textSecondary: "#27272a",
    textMuted: "#52525b",
    textFaint: "#a1a1aa",
    border: "#e4e4e7",
    card: "#f4f4f5",
    cardFeatured: "#eef2ff",
    cardFeaturedBorder: "#c7d2fe",
    surface: "#f4f4f5",
    accent: "#6366f1",
    accentSecondary: "#7c3aed",
    accentTertiary: "#9333ea",
    green: "#059669",
    barTrack: "#e4e4e7",
    tagBorder: "#c7d2fe",
    tagColor: "#6366f1",
    toolBg: "#eef2ff",
    toolKeyBg: "#f4f4f5",
    toolKeyBorder: "#e4e4e7",
  },
  notion: {
    bg: "#ffffff",
    wrapper: "#ffffff",
    text: "#0a0a0a",
    textSecondary: "#0a0a0a",
    textMuted: "#52525b",
    textFaint: "#737373",
    border: "#e5e5e5",
    card: "#fafafa",
    cardFeatured: "#f5f5f5",
    cardFeaturedBorder: "#e5e5e5",
    surface: "#fafafa",
    accent: "#0a0a0a",
    accentSecondary: "#0a0a0a",
    accentTertiary: "#0a0a0a",
    green: "#52525b",
    barTrack: "#e5e5e5",
    tagBorder: "#d4d4d4",
    tagColor: "#52525b",
    toolBg: "#fafafa",
    toolKeyBg: "#f5f5f5",
    toolKeyBorder: "#e5e5e5",
    simpleStyle: true,
    breakingBg: "#0a0a0a",
    breakingFg: "#ffffff",
    sectionIconBg: "#e5e5e5",
    sectionIconFg: "#52525b",
  },
  notionDark: {
    bg: "#0a0a0a",
    wrapper: "#0a0a0a",
    text: "#fafafa",
    textSecondary: "#e5e5e5",
    textMuted: "#a3a3a3",
    textFaint: "#737373",
    border: "#262626",
    card: "#171717",
    cardFeatured: "#1c1c1c",
    cardFeaturedBorder: "#262626",
    surface: "#171717",
    accent: "#fafafa",
    accentSecondary: "#fafafa",
    accentTertiary: "#fafafa",
    green: "#a3a3a3",
    barTrack: "#262626",
    tagBorder: "#404040",
    tagColor: "#a3a3a3",
    toolBg: "#171717",
    toolKeyBg: "#0a0a0a",
    toolKeyBorder: "#262626",
    simpleStyle: true,
    breakingBg: "#fafafa",
    breakingFg: "#0a0a0a",
    sectionIconBg: "#262626",
    sectionIconFg: "#a3a3a3",
  },
};

function getThemeColors(theme: string): ThemeColors {
  return THEMES[theme] || THEMES.dark;
}

// ── Register Handlebars helpers ────────────────────────────
Handlebars.registerHelper("timeAgo", function (dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
});

Handlebars.registerHelper("importanceClass", function (importance: number) {
  if (importance >= 8) return "importance-high";
  if (importance >= 5) return "importance-medium";
  return "importance-low";
});

Handlebars.registerHelper(
  "importanceBar",
  function (this: any, importance: number, options: any) {
    const t: ThemeColors = options.data.root._theme;
    const pct = (importance / 10) * 100;
    const color =
      importance >= 8
        ? t.accentSecondary
        : importance >= 6
          ? t.accent
          : t.textFaint;
    return new Handlebars.SafeString(
      `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">` +
        `<div style="flex:1;height:3px;background:${t.barTrack};border-radius:2px;overflow:hidden;">` +
        `<div style="width:${pct}%;height:100%;background:${color};border-radius:2px;"></div>` +
        `</div>` +
        `<span style="font-size:11px;font-weight:700;color:${color};font-family:'SF Mono',SFMono-Regular,Menlo,monospace;letter-spacing:0.02em;">${importance}/10</span>` +
        `</div>`
    );
  }
);

Handlebars.registerHelper("gte", function (a: number, b: number) {
  return a >= b;
});

Handlebars.registerHelper(
  "formatTags",
  function (this: any, tags: string[], options: any) {
    if (!tags || tags.length === 0) return "";
    const t: ThemeColors = options.data.root._theme;
    return tags
      .slice(0, 4)
      .map(
        (tag) =>
          `<span style="display:inline-block;padding:3px 10px;border:1px solid ${t.tagBorder};border-radius:100px;font-size:10px;color:${t.tagColor};margin-right:5px;margin-bottom:4px;background:transparent;">#${tag}</span>`
      )
      .join(" ");
  }
);

// ── CSS generator ──────────────────────────────────────────
function generateCSS(t: ThemeColors): string {
  const simple = t.simpleStyle;
  const accentLine = simple
    ? `height: 1px; background: ${t.border};`
    : `height: 3px; background: linear-gradient(90deg, ${t.accent} 0%, ${t.accentSecondary} 40%, ${t.accentTertiary} 70%, ${t.accent} 100%); background-size: 200% 100%;`;
  const headlineSpan = simple
    ? `color: ${t.text};`
    : `background: linear-gradient(135deg, ${t.accent}, ${t.accentTertiary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;`;
  const sectionIconBg = t.sectionIconBg ?? t.accent;
  const sectionIconFg = t.sectionIconFg ?? "#fff";
  const sectionIcons = simple
    ? `.section-icon { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; background: ${sectionIconBg}; color: ${sectionIconFg}; }`
    : `.section-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #fff; }
    .section-icon.top { background: linear-gradient(135deg, #4f46e5, #7c3aed); }
    .section-icon.ai { background: linear-gradient(135deg, #2563eb, #0891b2); }
    .section-icon.tech { background: linear-gradient(135deg, #059669, #10b981); }
    .section-icon.links { background: linear-gradient(135deg, #d97706, #f59e0b); }`;
  const breakingBadge = t.breakingBg
    ? `.breaking-badge { display: inline-block; padding: 3px 10px; background: ${t.breakingBg}; color: ${t.breakingFg ?? "#fff"}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 4px; margin-bottom: 10px; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }`
    : `.breaking-badge { display: inline-block; padding: 3px 10px; background: linear-gradient(135deg, #dc2626, #ef4444); color: #fff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 4px; margin-bottom: 10px; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }`;
  const toolBlockBg = simple
    ? `background: ${t.toolBg};`
    : `background: linear-gradient(135deg, ${t.toolBg} 0%, ${t.surface} 100%);`;

  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: ${t.bg};
      color: ${t.textSecondary};
      -webkit-font-smoothing: antialiased;
      letter-spacing: -0.011em;
    }
    .wrapper { max-width: 620px; margin: 0 auto; background: ${t.wrapper}; }

    .accent-line { ${accentLine} }

    .header { padding: ${simple ? "32px 32px 24px" : "36px 32px 28px"}; }
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; }
    .brand { font-size: ${simple ? "13px" : "14px"}; font-weight: 600; color: ${t.textMuted}; letter-spacing: 0.06em; text-transform: uppercase; }
    .issue-badge { font-size: 11px; font-weight: 600; color: ${t.accent}; padding: 4px 12px; border: 1px solid ${t.border}; border-radius: 100px; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }
    .header-date { font-size: 13px; color: ${t.textFaint}; margin-top: 8px; }
    .header-headline { font-size: ${simple ? "24px" : "28px"}; font-weight: 700; color: ${t.text}; letter-spacing: -0.03em; line-height: 1.2; margin-top: ${simple ? "20px" : "28px"}; }
    .header-headline span { ${headlineSpan} }

    .stats-row { display: flex; gap: 0; padding: 0 32px; margin-bottom: 4px; }
    .stat-block { flex: 1; text-align: center; padding: ${simple ? "14px 0" : "18px 0"}; border: 1px solid ${t.border}; }
    .stat-block:first-child { border-radius: ${simple ? "6px" : "10px"} 0 0 ${simple ? "6px" : "10px"}; }
    .stat-block:last-child { border-radius: 0 ${simple ? "6px" : "10px"} ${simple ? "6px" : "10px"} 0; }
    .stat-block:not(:last-child) { border-right: none; }
    .stat-val { font-size: ${simple ? "20px" : "24px"}; font-weight: 700; color: ${t.text}; letter-spacing: -0.04em; display: block; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }
    .stat-lbl { font-size: 10px; color: ${t.textFaint}; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 3px; }

    .intro-block { padding: ${simple ? "20px 32px" : "24px 32px"}; font-size: 14px; line-height: 1.7; color: ${t.textMuted}; }

    .tldr-block { margin: 0 32px ${simple ? "20px" : "24px"}; padding: ${simple ? "14px 18px" : "18px 20px"}; background: ${t.surface}; border-radius: ${simple ? "6px" : "10px"}; border-left: 3px solid ${t.accent}; }
    .tldr-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: ${t.accent}; margin-bottom: 8px; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }
    .tldr-text { font-size: 14px; line-height: 1.6; color: ${t.textSecondary}; font-weight: 500; }

    .tool-block { margin: 0 32px ${simple ? "20px" : "24px"}; padding: ${simple ? "16px 18px" : "20px"}; ${toolBlockBg} border-radius: ${simple ? "6px" : "10px"}; border: 1px solid ${t.border}; }
    .tool-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: ${t.accentTertiary}; margin-bottom: 12px; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }
    .tool-title { font-size: 17px; font-weight: 700; color: ${t.text}; text-decoration: none; line-height: 1.35; display: block; margin-bottom: 6px; letter-spacing: -0.02em; }
    .tool-title:hover { text-decoration: underline; }

    .trend-block { margin: 0 32px ${simple ? "20px" : "24px"}; padding: ${simple ? "14px 18px" : "18px 20px"}; background: ${t.surface}; border-radius: ${simple ? "6px" : "10px"}; border-left: 3px solid ${t.green}; }
    .trend-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: ${t.green}; margin-bottom: 8px; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }
    .trend-text { font-size: 14px; line-height: 1.6; color: ${t.textMuted}; }

    .speed-read { margin: 0 32px ${simple ? "20px" : "24px"}; padding: ${simple ? "16px 18px" : "20px"}; background: ${t.surface}; border-radius: ${simple ? "6px" : "10px"}; border: 1px solid ${t.border}; }
    .speed-read-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .speed-read-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: ${t.accent}; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }
    .speed-read-time { font-size: 10px; color: ${t.textFaint}; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }
    .sr-item { padding: 7px 0; border-bottom: 1px solid ${t.border}; }
    .sr-item:last-child { border-bottom: none; }
    .sr-bullet { display: inline; color: ${t.accent}; font-weight: 700; margin-right: 6px; font-size: 11px; }
    .sr-item a { color: ${t.text}; text-decoration: none; font-weight: 600; font-size: 13px; line-height: 1.4; }
    .sr-item a:hover { color: ${t.accentSecondary}; }
    .sr-one-liner { font-size: 12px; color: ${t.textMuted}; margin-top: 2px; line-height: 1.5; }
    .sr-src { font-size: 10px; color: ${t.textFaint}; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }

    .editors-take { margin: 0 32px ${simple ? "20px" : "24px"}; padding: ${simple ? "16px 18px" : "20px"}; background: ${t.cardFeatured}; border-radius: ${simple ? "6px" : "10px"}; border: 1px solid ${t.cardFeaturedBorder}; }
    .editors-take-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: ${t.accentSecondary}; margin-bottom: 10px; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }
    .editors-take-text { font-size: 14px; line-height: 1.75; color: ${t.textSecondary}; font-style: italic; }

    .deep-dive { margin: 0 32px ${simple ? "20px" : "24px"}; padding: ${simple ? "18px 18px" : "24px"}; background: ${t.card}; border-radius: ${simple ? "6px" : "10px"}; border: 1px solid ${t.border}; border-top: 3px solid ${t.accentSecondary}; }
    .deep-dive-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: ${t.accentSecondary}; margin-bottom: 6px; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }
    .deep-dive-title { font-size: 17px; font-weight: 700; color: ${t.text}; text-decoration: none; line-height: 1.35; display: block; margin-bottom: 4px; letter-spacing: -0.02em; }
    .deep-dive-title:hover { text-decoration: underline; }
    .deep-dive-meta { font-size: 11px; color: ${t.textFaint}; margin-bottom: 14px; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }
    .deep-dive-body { font-size: 14px; line-height: 1.8; color: ${t.textSecondary}; white-space: pre-line; }

    .paper-block { margin: 0 32px ${simple ? "20px" : "24px"}; padding: ${simple ? "16px 18px" : "20px"}; background: ${t.surface}; border-radius: ${simple ? "6px" : "10px"}; border: 1px solid ${t.border}; border-left: 3px solid ${t.accentTertiary}; }
    .paper-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: ${t.accentTertiary}; margin-bottom: 6px; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }
    .paper-title { font-size: 15px; font-weight: 700; color: ${t.text}; text-decoration: none; line-height: 1.35; display: block; margin-bottom: 4px; letter-spacing: -0.02em; }
    .paper-title:hover { text-decoration: underline; }
    .paper-meta { font-size: 11px; color: ${t.textFaint}; margin-bottom: 12px; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }
    .paper-body { font-size: 13px; line-height: 1.7; color: ${t.textMuted}; margin-bottom: 10px; }
    .paper-one-liner { font-size: 13px; color: ${t.text}; font-weight: 600; font-style: italic; padding: 10px 12px; background: ${t.card}; border-radius: 6px; }

    .numbers-block { margin: 0 32px ${simple ? "20px" : "24px"}; padding: ${simple ? "16px 18px" : "20px"}; background: ${t.surface}; border-radius: ${simple ? "6px" : "10px"}; border: 1px solid ${t.border}; }
    .numbers-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: ${t.accent}; margin-bottom: 14px; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }
    .num-item { padding: 10px 0; border-bottom: 1px solid ${t.border}; }
    .num-item:last-child { border-bottom: none; }
    .num-stat { font-size: 18px; font-weight: 800; color: ${t.text}; letter-spacing: -0.03em; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }
    .num-context { font-size: 12px; color: ${t.textMuted}; margin-top: 2px; line-height: 1.5; }
    .num-context a { color: ${t.textMuted}; text-decoration: none; }
    .num-context a:hover { color: ${t.accentSecondary}; }
    .num-src { font-size: 10px; color: ${t.textFaint}; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }

    .key-takeaways-block { margin: 0 32px ${simple ? "20px" : "24px"}; padding: ${simple ? "14px 18px" : "18px 20px"}; background: ${t.surface}; border-radius: ${simple ? "6px" : "10px"}; border-left: 3px solid ${t.accent}; }
    .key-takeaways-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: ${t.accent}; margin-bottom: 10px; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }
    .kt-item { font-size: 13px; color: ${t.textSecondary}; line-height: 1.6; margin-bottom: 8px; padding-left: 14px; position: relative; }
    .kt-item:before { content: "\\2022"; position: absolute; left: 0; color: ${t.accent}; font-weight: 700; }
    .quote-block { margin: 0 32px ${simple ? "20px" : "24px"}; padding: ${simple ? "14px 18px" : "18px 20px"}; background: ${t.surface}; border-radius: ${simple ? "6px" : "10px"}; border-left: 3px solid ${t.accent}; }
    .quote-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: ${t.accent}; margin-bottom: 8px; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }
    .quote-text { font-size: 15px; line-height: 1.65; color: ${t.text}; font-style: italic; margin-bottom: 8px; }
    .quote-attribution { font-size: 12px; color: ${t.textMuted}; }
    .quote-attribution a { color: ${t.textMuted}; text-decoration: none; }
    .quote-attribution a:hover { color: ${t.accentSecondary}; }
    .community-pulse { margin: 0 32px ${simple ? "20px" : "24px"}; padding: ${simple ? "16px 18px" : "20px"}; background: ${t.surface}; border-radius: ${simple ? "6px" : "10px"}; border: 1px solid ${t.border}; }
    .community-pulse-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: ${t.green}; margin-bottom: 14px; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }
    .cp-item { padding: 8px 0; border-bottom: 1px solid ${t.border}; }
    .cp-item:last-child { border-bottom: none; }
    .cp-name { font-size: 13px; font-weight: 700; color: ${t.text}; text-decoration: none; display: block; margin-bottom: 2px; }
    .cp-name:hover { color: ${t.accentSecondary}; }
    .cp-desc { font-size: 12px; color: ${t.textMuted}; line-height: 1.5; margin-bottom: 3px; }
    .cp-meta { font-size: 10px; color: ${t.textFaint}; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }

    .discussion-block { margin: 0 32px ${simple ? "16px" : "20px"}; padding: ${simple ? "16px 18px" : "20px"}; background: ${t.cardFeatured}; border-radius: ${simple ? "6px" : "10px"}; border: 1px solid ${t.cardFeaturedBorder}; text-align: center; }
    .discussion-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: ${t.accentSecondary}; margin-bottom: 10px; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }
    .discussion-text { font-size: 15px; line-height: 1.6; color: ${t.text}; font-weight: 600; margin-bottom: 8px; }
    .discussion-cta { font-size: 12px; color: ${t.textMuted}; }

    .section-sep { height: 1px; background: ${t.border}; margin: 8px 32px; }

    .section { padding: ${simple ? "24px 32px 8px" : "28px 32px 8px"}; }
    .section-head { display: flex; align-items: center; gap: 10px; margin-bottom: ${simple ? "16px" : "22px"}; }
    ${sectionIcons}
    .section-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: ${t.text}; }

    .article-card { padding: ${simple ? "14px 16px" : "18px"}; margin-bottom: ${simple ? "10px" : "12px"}; border-radius: ${simple ? "6px" : "10px"}; background: ${t.card}; border: 1px solid ${t.border}; }
    .article-card.featured { background: ${t.cardFeatured}; border-color: ${t.cardFeaturedBorder}; }
    .article-title { font-size: ${simple ? "15px" : "16px"}; font-weight: 700; color: ${t.text}; text-decoration: none; line-height: 1.35; display: block; margin-bottom: 6px; letter-spacing: -0.02em; }
    .article-title:hover { color: ${t.accentSecondary}; text-decoration: ${simple ? "underline" : "none"}; }
    .article-meta { font-size: 11px; color: ${t.textFaint}; margin-bottom: 10px; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }
    .article-summary { font-size: 13px; color: ${t.textMuted}; line-height: 1.65; }
    .article-tags { margin-top: 10px; }

    ${breakingBadge}

    .why-block { margin-top: 12px; padding: 12px 14px; background: ${t.surface}; border-radius: 8px; border-left: 2px solid ${t.accentSecondary}; }
    .why-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: ${t.accentSecondary}; margin-bottom: 4px; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }
    .why-text { font-size: 12px; color: ${t.textMuted}; line-height: 1.55; }

    .read-btn { display: inline-block; margin-top: 12px; padding: 7px 16px; background: ${t.surface}; color: ${t.accentSecondary}; font-size: 12px; font-weight: 600; text-decoration: none; border-radius: 6px; border: 1px solid ${t.border}; }
    .read-btn:hover { opacity: 0.8; }

    .ql-item { padding: 12px 0; border-bottom: 1px solid ${t.border}; display: flex; justify-content: space-between; align-items: baseline; }
    .ql-item:last-child { border-bottom: none; }
    .ql-item a { color: ${t.textSecondary}; text-decoration: none; font-weight: 500; font-size: 13px; flex: 1; }
    .ql-item a:hover { color: ${t.accentSecondary}; }
    .ql-src { color: ${t.textFaint}; font-size: 11px; flex-shrink: 0; margin-left: 12px; font-family: 'SF Mono', SFMono-Regular, Menlo, monospace; }

    .footer { padding: 32px; text-align: center; font-size: 12px; color: ${t.textFaint}; border-top: 1px solid ${t.border}; margin-top: 16px; }
    .footer a { color: ${t.textMuted}; text-decoration: none; }
    .footer a:hover { color: ${t.accentSecondary}; }
    .footer p { margin-bottom: 8px; }
    .footer-brand { font-size: 11px; font-weight: 600; color: ${t.border}; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 16px; }

    @media (max-width: 600px) {
      .wrapper { margin: 0; }
      .header { padding: 28px 20px 24px; }
      .header-headline { font-size: 24px; }
      .section { padding: 24px 20px 8px; }
      .intro-block { padding: 20px; }
      .stats-row { padding: 0 20px; }
      .tldr-block { margin: 0 20px 20px; }
      .tool-block { margin: 0 20px 20px; }
      .trend-block { margin: 0 20px 20px; }
      .speed-read { margin: 0 20px 20px; }
      .editors-take { margin: 0 20px 20px; }
      .deep-dive { margin: 0 20px 20px; }
      .paper-block { margin: 0 20px 20px; }
      .numbers-block { margin: 0 20px 20px; }
      .community-pulse { margin: 0 20px 20px; }
      .discussion-block { margin: 0 20px 16px; }
      .key-takeaways-block { margin: 0 20px 20px; }
      .quote-block { margin: 0 20px 20px; }
      .related-reads-block { margin: 0 20px 20px; }
      .section-sep { margin: 8px 20px; }
      .footer { padding: 24px 20px; }
    }
  `;
}

// ── HTML body (shared between themes) ──────────────────────
const BODY_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI & Tech Daily</title>
  <style>{{{themeCSS}}}</style>
</head>
<body>
  <div class="wrapper">

    <div class="accent-line"></div>

    <div class="header">
      <div class="header-row">
        <span class="brand">AI & Tech Daily</span>
        <span class="issue-badge">#{{issueNumber}}</span>
      </div>
      <div class="header-date">{{date}}</div>
      <div class="header-headline">
        Your morning<br>
        <span>intelligence brief.</span>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-block">
        <span class="stat-val">{{totalArticles}}</span>
        <span class="stat-lbl">Scanned</span>
      </div>
      <div class="stat-block">
        <span class="stat-val">{{sourcesCount}}</span>
        <span class="stat-lbl">Sources</span>
      </div>
      <div class="stat-block">
        <span class="stat-val">{{aiArticlesCount}}</span>
        <span class="stat-lbl">AI Stories</span>
      </div>
      {{#if readTimeMinutes}}
      <div class="stat-block">
        <span class="stat-val">{{readTimeMinutes}}</span>
        <span class="stat-lbl">Min Read</span>
      </div>
      {{/if}}
    </div>

    <div class="intro-block">{{{intro}}}</div>

    <div class="tldr-block">
      <div class="tldr-tag">&#9889; TL;DR</div>
      <div class="tldr-text">{{tldr}}</div>
    </div>

    {{#if speedRead.length}}
    <div class="speed-read">
      <div class="speed-read-header">
        <span class="speed-read-tag">&#9889; In 30 Seconds</span>
        {{#if readTimeMinutes}}<span class="speed-read-time">~{{readTimeMinutes}} min read</span>{{/if}}
      </div>
      {{#each speedRead}}
      <div class="sr-item">
        <span class="sr-bullet">&#8227;</span><a href="{{link}}">{{title}}</a>
        <div class="sr-one-liner">{{one_liner}} <span class="sr-src">&middot; {{source}}</span></div>
      </div>
      {{/each}}
    </div>
    {{/if}}

    {{#if editorsTake}}
    <div class="editors-take">
      <div class="editors-take-tag">&#9998; The Editor's Take</div>
      <div class="editors-take-text">{{editorsTake}}</div>
    </div>
    {{/if}}

    {{#if deepDive}}
    <div class="deep-dive">
      <div class="deep-dive-tag">&#128269; Deep Dive</div>
      <a href="{{deepDive.link}}" class="deep-dive-title">{{deepDive.title}}</a>
      <div class="deep-dive-meta">{{deepDive.source}} &middot; Today's #1 Story</div>
      <div class="deep-dive-body">{{deepDive.content}}</div>
      <a href="{{deepDive.link}}" class="read-btn">Read the full story &#8594;</a>
    </div>
    {{/if}}

    {{#if toolOfTheDay}}
    <div class="tool-block">
      <div class="tool-label">&#9881; Tool of the Day</div>
      <a href="{{toolOfTheDay.link}}" class="tool-title">{{toolOfTheDay.title}}</a>
      <div style="font-size:11px;color:{{_theme.textFaint}};margin-bottom:10px;font-family:'SF Mono',SFMono-Regular,Menlo,monospace;">{{toolOfTheDay.source}} &middot; {{toolOfTheDay.ai_importance}}/10</div>
      {{#if toolOfTheDay.ai_summary}}
      <div style="font-size:13px;color:{{_theme.textMuted}};line-height:1.6;margin-bottom:10px;">{{toolOfTheDay.ai_summary}}</div>
      {{/if}}
      {{#if toolOfTheDay.key_takeaway}}
      <div style="padding:10px 12px;background:{{_theme.toolKeyBg}};border:1px solid {{_theme.toolKeyBorder}};border-radius:6px;margin-bottom:12px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:{{_theme.accentTertiary}};margin-bottom:4px;font-family:'SF Mono',SFMono-Regular,Menlo,monospace;">Key Takeaway</div>
        <div style="font-size:12px;color:{{_theme.textMuted}};line-height:1.5;">{{toolOfTheDay.key_takeaway}}</div>
      </div>
      {{/if}}
      <a href="{{toolOfTheDay.link}}" class="read-btn" style="color:{{_theme.accentTertiary}};border-color:{{_theme.cardFeaturedBorder}};">Check it out &#8594;</a>
    </div>
    {{/if}}

    {{#if weeklyTrend}}
    <div class="trend-block">
      <div class="trend-tag">&#x2191; Trending</div>
      <div class="trend-text">{{weeklyTrend}}</div>
    </div>
    {{/if}}

    {{#if paperOfTheDay}}
    <div class="paper-block">
      <div class="paper-tag">&#128218; Paper of the Day</div>
      <a href="{{paperOfTheDay.link}}" class="paper-title">{{paperOfTheDay.title}}</a>
      <div class="paper-meta">{{paperOfTheDay.source}}</div>
      <div class="paper-body">{{paperOfTheDay.plain_english}}</div>
      {{#if paperOfTheDay.one_liner}}
      <div class="paper-one-liner">&ldquo;{{paperOfTheDay.one_liner}}&rdquo;</div>
      {{/if}}
      <a href="{{paperOfTheDay.link}}" class="read-btn" style="margin-top:12px;">Read the paper &#8594;</a>
    </div>
    {{/if}}

    {{#if dataPoints.length}}
    <div class="numbers-block">
      <div class="numbers-tag">&#128202; By the Numbers</div>
      {{#each dataPoints}}
      <div class="num-item">
        <div class="num-stat">{{stat}}</div>
        <div class="num-context"><a href="{{link}}">{{context}}</a> <span class="num-src">&middot; {{source}}</span></div>
      </div>
      {{/each}}
    </div>
    {{/if}}

    {{#if key_takeaways.length}}
    <div class="key-takeaways-block">
      <div class="key-takeaways-tag">&#128161; Key Takeaways</div>
      {{#each key_takeaways}}
      <div class="kt-item">{{this}}</div>
      {{/each}}
    </div>
    {{/if}}

    {{#if quote_of_the_day}}
    <div class="quote-block">
      <div class="quote-tag">&#10077; Quote of the Day</div>
      <div class="quote-text">&ldquo;{{quote_of_the_day.quote}}&rdquo;</div>
      <div class="quote-attribution">&mdash; {{quote_of_the_day.attribution}}{{#if quote_of_the_day.source}} <span style="color:{{_theme.textFaint}};">&middot; {{quote_of_the_day.source}}</span>{{/if}}{{#if quote_of_the_day.link}} <a href="{{quote_of_the_day.link}}">Source</a>{{/if}}</div>
    </div>
    {{/if}}

    {{#if related_reads.length}}
    <div class="related-reads-block">
      <div class="related-reads-tag">&#128214; Related Reads</div>
      {{#each related_reads}}
      <div class="rr-item">
        <a href="{{link}}">{{title}}</a>
        <div class="rr-src">{{source}}</div>
      </div>
      {{/each}}
    </div>
    {{/if}}

    {{#if topStories.length}}
    <div class="section">
      <div class="section-head">
        <div class="section-icon top">&#9733;</div>
        <span class="section-label">Top Stories</span>
      </div>
      {{#each topStories}}
      <div class="article-card featured">
        {{#if (gte ai_importance 9)}}
        <span class="breaking-badge">&#9888; BREAKING</span>
        {{/if}}
        <a href="{{link}}" class="article-title">{{title}}</a>
        <div class="article-meta">{{source}} &middot; {{timeAgo published_at}}</div>
        {{{importanceBar ai_importance}}}
        <div class="article-summary">{{ai_summary}}</div>
        {{#if so_what}}
        <div class="why-block">
          <div class="why-label">&#8594; Why it matters</div>
          <div class="why-text">{{so_what}}</div>
        </div>
        {{/if}}
        {{#if ai_tags}}
        <div class="article-tags">{{{formatTags ai_tags}}}</div>
        {{/if}}
        <a href="{{link}}" class="read-btn">Read full article &#8594;</a>
      </div>
      {{/each}}
    </div>
    {{/if}}

    <div class="section-sep"></div>

    {{#if aiNews.length}}
    <div class="section">
      <div class="section-head">
        <div class="section-icon ai">&#9672;</div>
        <span class="section-label">AI & ML</span>
      </div>
      {{#each aiNews}}
      <div class="article-card">
        <a href="{{link}}" class="article-title">{{title}}</a>
        <div class="article-meta">{{source}} &middot; {{timeAgo published_at}}</div>
        {{{importanceBar ai_importance}}}
        <div class="article-summary">{{ai_summary}}</div>
        <a href="{{link}}" class="read-btn">Read more &#8594;</a>
      </div>
      {{/each}}
    </div>
    {{/if}}

    <div class="section-sep"></div>

    {{#if techNews.length}}
    <div class="section">
      <div class="section-head">
        <div class="section-icon tech">&#9670;</div>
        <span class="section-label">Tech</span>
      </div>
      {{#each techNews}}
      <div class="article-card">
        <a href="{{link}}" class="article-title">{{title}}</a>
        <div class="article-meta">{{source}} &middot; {{timeAgo published_at}}</div>
        {{{importanceBar ai_importance}}}
        <div class="article-summary">{{ai_summary}}</div>
        <a href="{{link}}" class="read-btn">Read more &#8594;</a>
      </div>
      {{/each}}
    </div>
    {{/if}}

    {{#if securityNews.length}}
    <div class="section-sep"></div>
    <div class="section">
      <div class="section-head">
        <div class="section-icon links">&#9888;</div>
        <span class="section-label">Security</span>
      </div>
      {{#each securityNews}}
      <div class="article-card">
        <a href="{{link}}" class="article-title">{{title}}</a>
        <div class="article-meta">{{source}} &middot; {{timeAgo published_at}}</div>
        {{{importanceBar ai_importance}}}
        <div class="article-summary">{{ai_summary}}</div>
        <a href="{{link}}" class="read-btn">Read more &#8594;</a>
      </div>
      {{/each}}
    </div>
    {{/if}}

    {{#if cloudNews.length}}
    <div class="section-sep"></div>
    <div class="section">
      <div class="section-head">
        <div class="section-icon links">&#9729;</div>
        <span class="section-label">Cloud & DevOps</span>
      </div>
      {{#each cloudNews}}
      <div class="article-card">
        <a href="{{link}}" class="article-title">{{title}}</a>
        <div class="article-meta">{{source}} &middot; {{timeAgo published_at}}</div>
        {{{importanceBar ai_importance}}}
        <div class="article-summary">{{ai_summary}}</div>
        <a href="{{link}}" class="read-btn">Read more &#8594;</a>
      </div>
      {{/each}}
    </div>
    {{/if}}

    {{#if quickLinks.length}}
    <div class="section">
      <div class="section-head">
        <div class="section-icon links">&#8599;</div>
        <span class="section-label">Quick Links</span>
      </div>
      {{#each quickLinks}}
      <div class="ql-item">
        <a href="{{link}}">{{title}}</a>
        <span class="ql-src">{{source}}</span>
      </div>
      {{/each}}
    </div>
    {{/if}}

    {{#if communityPulse.length}}
    <div class="community-pulse">
      <div class="community-pulse-tag">&#127793; Community Pulse &mdash; Trending on GitHub</div>
      {{#each communityPulse}}
      <div class="cp-item">
        <a href="{{url}}" class="cp-name">{{name}}</a>
        <div class="cp-desc">{{description}}</div>
        <div class="cp-meta">{{language}} &middot; &#9733; {{stars}}</div>
      </div>
      {{/each}}
    </div>
    {{/if}}

    {{#if discussionQuestion}}
    <div class="discussion-block">
      <div class="discussion-tag">&#128172; Join the Conversation</div>
      <div class="discussion-text">{{discussionQuestion}}</div>
      <div class="discussion-cta">Hit reply and tell us what you think.</div>
    </div>
    {{/if}}

    <div class="footer">
      <p style="color:{{_theme.textMuted}};">Curated by AI from {{sourcesCount}}+ sources</p>
      <p>
        <a href="{{preferencesUrl}}">preferences</a>
        <span style="margin:0 6px;color:{{_theme.border}};">&middot;</span>
        <a href="{{unsubscribeUrl}}">unsubscribe</a>
      </p>
      <div class="footer-brand">AI & Tech Daily</div>
    </div>

    <div class="accent-line"></div>

  </div>
</body>
</html>`;

const compiledTemplate = Handlebars.compile(BODY_TEMPLATE);

// ── Public API ─────────────────────────────────────────────
export type EmailTheme = "dark" | "light" | "notion" | "notionDark";

export interface EmailTemplateData {
  newsletter: NewsletterData;
  subscriberEmail: string;
  issueNumber: number;
  unsubscribeToken: string;
  appUrl: string;
  theme?: EmailTheme;
  toolOfTheDay?: {
    title: string;
    link: string;
    source: string;
    ai_summary: string | null;
    ai_importance: number;
    key_takeaway: string | null;
  } | null;
}

export function renderDailyDigest(data: EmailTemplateData): string {
  const { newsletter, issueNumber, unsubscribeToken, appUrl } = data;
  const themeName = data.theme || "notion";
  const themeColors = getThemeColors(themeName);

  const uniqueSources = new Set(
    newsletter.allArticles.map((a) => a.source)
  );

  const sectionIds = newsletter.sectionArticleIds ?? new Set<string>();
  const quickLinks = newsletter.allArticles
    .filter((a) => !sectionIds.has(a.guid || a.link))
    .slice(0, 8);

  const templateData = {
    date: new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    issueNumber,
    totalArticles: newsletter.allArticles.length,
    sourcesCount: uniqueSources.size,
    aiArticlesCount: newsletter.aiNews.length,
    intro: newsletter.intro,
    tldr: newsletter.tldr,
    weeklyTrend: newsletter.weekly_trend || "",
    editorsTake: newsletter.editors_take || "",
    speedRead: newsletter.speed_read || [],
    readTimeMinutes: newsletter.read_time_minutes || 0,
    deepDive: newsletter.deep_dive || null,
    paperOfTheDay: newsletter.paper_of_the_day || null,
    dataPoints: newsletter.data_points || [],
    communityPulse: newsletter.community_pulse || [],
    discussionQuestion: newsletter.discussion_question || "",
    topStories: newsletter.topStories,
    aiNews: newsletter.aiNews,
    techNews: newsletter.techNews,
    securityNews: newsletter.securityNews || [],
    cloudNews: newsletter.cloudNews || [],
    quickLinks,
    toolOfTheDay: data.toolOfTheDay || null,
    unsubscribeUrl: `${appUrl}/api/unsubscribe?token=${unsubscribeToken}`,
    preferencesUrl: `${appUrl}/preferences?token=${unsubscribeToken}`,
    themeCSS: generateCSS(themeColors),
    _theme: themeColors,
  };

  return compiledTemplate(templateData);
}

// ── Weekly Recap Template ─────────────────────────────────

const WEEKLY_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI & Tech Weekly</title>
  <style>{{{themeCSS}}}</style>
</head>
<body>
  <div class="wrapper">

    <div class="accent-line"></div>

    <div class="header">
      <div class="header-row">
        <span class="brand">AI & Tech Weekly</span>
        <span class="issue-badge">Week in Review</span>
      </div>
      <div class="header-date">{{dateRange}}</div>
      <div class="header-headline">
        Your weekly<br>
        <span>intelligence recap.</span>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-block">
        <span class="stat-val">{{totalArticles}}</span>
        <span class="stat-lbl">Articles</span>
      </div>
      <div class="stat-block">
        <span class="stat-val">{{sourcesCount}}</span>
        <span class="stat-lbl">Sources</span>
      </div>
      <div class="stat-block">
        <span class="stat-val">{{topStoriesCount}}</span>
        <span class="stat-lbl">Top Stories</span>
      </div>
    </div>

    <div class="intro-block">{{{intro}}}</div>

    {{#if weekInReview}}
    <div class="tldr-block">
      <div class="tldr-tag">&#128218; Week in Review</div>
      <div class="tldr-text">{{weekInReview}}</div>
    </div>
    {{/if}}

    {{#if topThemes.length}}
    <div class="trend-block">
      <div class="trend-tag">&#x2191; This Week's Themes</div>
      <div class="trend-text">
        {{#each topThemes}}
        <div style="margin-bottom:8px;">&#8226; {{this}}</div>
        {{/each}}
      </div>
    </div>
    {{/if}}

    {{#if topStories.length}}
    <div class="section">
      <div class="section-head">
        <div class="section-icon top">&#9733;</div>
        <span class="section-label">Top Stories This Week</span>
      </div>
      {{#each topStories}}
      <div class="article-card{{#if (gte ai_importance 8)}} featured{{/if}}">
        <a href="{{link}}" class="article-title">{{title}}</a>
        <div class="article-meta">{{source}} &middot; {{timeAgo published_at}}</div>
        {{{importanceBar ai_importance}}}
        <div class="article-summary">{{ai_summary}}</div>
        <a href="{{link}}" class="read-btn">Read more &#8594;</a>
      </div>
      {{/each}}
    </div>
    {{/if}}

    {{#if aiHighlights.length}}
    <div class="section-sep"></div>
    <div class="section">
      <div class="section-head">
        <div class="section-icon ai">&#9672;</div>
        <span class="section-label">AI Highlights</span>
      </div>
      {{#each aiHighlights}}
      <div class="article-card">
        <a href="{{link}}" class="article-title">{{title}}</a>
        <div class="article-meta">{{source}} &middot; {{timeAgo published_at}}</div>
        <div class="article-summary">{{ai_summary}}</div>
        <a href="{{link}}" class="read-btn">Read more &#8594;</a>
      </div>
      {{/each}}
    </div>
    {{/if}}

    {{#if techHighlights.length}}
    <div class="section-sep"></div>
    <div class="section">
      <div class="section-head">
        <div class="section-icon tech">&#9670;</div>
        <span class="section-label">Tech Highlights</span>
      </div>
      {{#each techHighlights}}
      <div class="article-card">
        <a href="{{link}}" class="article-title">{{title}}</a>
        <div class="article-meta">{{source}} &middot; {{timeAgo published_at}}</div>
        <div class="article-summary">{{ai_summary}}</div>
        <a href="{{link}}" class="read-btn">Read more &#8594;</a>
      </div>
      {{/each}}
    </div>
    {{/if}}

    <div class="footer">
      <p style="color:{{_theme.textMuted}};">Weekly recap &mdash; curated by AI from {{sourcesCount}}+ sources</p>
      <p>
        <a href="{{preferencesUrl}}">preferences</a>
        <span style="margin:0 6px;color:{{_theme.border}};">&middot;</span>
        <a href="{{unsubscribeUrl}}">unsubscribe</a>
      </p>
      <div class="footer-brand">AI & Tech Weekly</div>
    </div>

    <div class="accent-line"></div>

  </div>
</body>
</html>`;

const compiledWeeklyTemplate = Handlebars.compile(WEEKLY_TEMPLATE);

export interface WeeklyEmailTemplateData {
  weeklyData: import("@/lib/ai/newsletterComposer").WeeklyRecapData;
  subscriberEmail: string;
  unsubscribeToken: string;
  appUrl: string;
  theme?: EmailTheme;
}

export function renderWeeklyDigest(data: WeeklyEmailTemplateData): string {
  const { weeklyData, unsubscribeToken, appUrl } = data;
  const themeName = data.theme || "notion";
  const themeColors = getThemeColors(themeName);

  const now = new Date();
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const templateData = {
    dateRange: `${fmt(weekAgo)} — ${fmt(now)}, ${now.getFullYear()}`,
    totalArticles: weeklyData.totalArticlesThisWeek,
    sourcesCount: weeklyData.totalSourcesThisWeek,
    topStoriesCount: weeklyData.topStories.length,
    intro: weeklyData.intro,
    weekInReview: weeklyData.week_in_review || "",
    topThemes: weeklyData.top_themes || [],
    topStories: weeklyData.topStories,
    aiHighlights: weeklyData.aiHighlights,
    techHighlights: weeklyData.techHighlights,
    unsubscribeUrl: `${appUrl}/api/unsubscribe?token=${unsubscribeToken}`,
    preferencesUrl: `${appUrl}/preferences?token=${unsubscribeToken}`,
    themeCSS: generateCSS(themeColors),
    _theme: themeColors,
  };

  return compiledWeeklyTemplate(templateData);
}
