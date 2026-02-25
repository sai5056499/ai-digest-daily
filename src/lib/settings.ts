import { isFirebaseConfigured, getDb } from "@/lib/database/firebase";

export interface SiteSettings {
  // Landing page
  headline: string;
  headlineMuted: string;
  subtitle: string;
  // Newsletter
  newsletterName: string;
  newsletterFromName: string;
  // Features
  telegramEnabled: boolean;
  emailEnabled: boolean;
  aiProvider: string;
  aiModel: string;
  // Sources
  rssEnabled: boolean;
  hnEnabled: boolean;
  redditEnabled: boolean;
  // Schedule
  collectIntervalHours: number;
  sendHourUtc: number;
  maxArticlesPerDigest: number;
  // Email sections
  showTopStories: boolean;
  showAiNews: boolean;
  showTechNews: boolean;
  showQuickLinks: boolean;
  showSecurityNews: boolean;
  showCloudNews: boolean;
  // Phase 1 content upgrades
  showSpeedRead: boolean;
  showEditorsTake: boolean;
  // Phase 2 content depth
  showDeepDive: boolean;
  showPaperOfTheDay: boolean;
  showDataPoints: boolean;
  // Phase 3 engagement & polish
  showKeyTakeaways: boolean;
  showQuoteOfTheDay: boolean;
  showRelatedReads: boolean;
  // Feature: Tool of the Day
  showToolOfTheDay: boolean;
}

const DEFAULTS: SiteSettings = {
  headline: "Your morning brief,",
  headlineMuted: "written by AI.",
  subtitle: "The most important AI & tech news from 20+ sources, summarized and delivered to your inbox every morning.",
  newsletterName: "AI & Tech Daily",
  newsletterFromName: "AI Tech Daily",
  telegramEnabled: false,
  emailEnabled: true,
  aiProvider: "groq",
  aiModel: "llama-3.3-70b-versatile",
  rssEnabled: true,
  hnEnabled: true,
  redditEnabled: true,
  collectIntervalHours: 2,
  sendHourUtc: 8,
  maxArticlesPerDigest: 30,
  showTopStories: true,
  showAiNews: true,
  showTechNews: true,
  showQuickLinks: true,
  showSecurityNews: true,
  showCloudNews: true,
  showSpeedRead: true,
  showEditorsTake: true,
  showDeepDive: true,
  showPaperOfTheDay: true,
  showDataPoints: true,
  showKeyTakeaways: true,
  showQuoteOfTheDay: true,
  showRelatedReads: true,
  showToolOfTheDay: true,
};

let cachedSettings: SiteSettings | null = null;

export async function getSettings(): Promise<SiteSettings> {
  if (cachedSettings) return cachedSettings;

  if (!isFirebaseConfigured()) return { ...DEFAULTS };

  try {
    const db = getDb();
    const doc = await db.collection("settings").doc("site").get();
    if (doc.exists) {
      cachedSettings = { ...DEFAULTS, ...doc.data() } as SiteSettings;
      return cachedSettings;
    }
  } catch {
    // ignore
  }

  return { ...DEFAULTS };
}

export async function saveSettings(settings: Partial<SiteSettings>): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const db = getDb();
  await db.collection("settings").doc("site").set(
    { ...settings, updated_at: new Date().toISOString() },
    { merge: true }
  );

  // Clear cache so next read picks up changes
  cachedSettings = null;
}

export function getDefaults(): SiteSettings {
  return { ...DEFAULTS };
}
