import { initializeApp, cert, getApps, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// ─── Firebase Initialization ─────────────────────────────────

let db: Firestore | null = null;
let initError: string | null = null;

/**
 * Check whether Firebase is configured (env vars are present).
 * Use this to gracefully skip DB operations when not configured.
 */
export function isFirebaseConfigured(): boolean {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
}

export function getDb(): Firestore {
  if (db) return db;

  if (initError) {
    throw new Error(initError);
  }

  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      initError =
        "Firebase is not configured. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, " +
        "and FIREBASE_PRIVATE_KEY to your .env file. " +
        "See README.md for setup instructions.";
      throw new Error(initError);
    }

    try {
      const serviceAccount: ServiceAccount = {
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      };
      initializeApp({ credential: cert(serviceAccount) });
    } catch (err) {
      initError = `Firebase initialization failed: ${(err as Error).message}`;
      throw new Error(initError);
    }
  }

  db = getFirestore();
  return db;
}

// ─── Collection Names ────────────────────────────────────────

const COLLECTIONS = {
  articles: "articles",
  subscribers: "subscribers",
  emailLogs: "email_logs",
} as const;

// ─── Type Definitions ────────────────────────────────────────

export interface Article {
  id?: string;
  title: string;
  link: string;
  description: string;
  content: string;
  published_at: string;
  source: string;
  category: string;
  priority: string;
  guid: string;
  author: string;
  image_url: string | null;
  collected_at: string;
  processed: boolean;
  ai_summary: string | null;
  ai_category: string | null;
  ai_tags: string[] | null;
  ai_importance: number;
  ai_sentiment: string | null;
  key_takeaway: string | null;
  so_what: string | null;
  data_points: string[] | null;
  included_in_email: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Subscriber {
  id?: string;
  email: string;
  name: string | null;
  is_active: boolean;
  frequency: "daily" | "weekly";
  categories: string[];
  preferred_time: string;
  timezone: string;
  confirmed: boolean;
  confirm_token: string;
  unsubscribe_token: string;
  last_email_sent: string | null;
  emails_received: number;
  created_at?: string;
}

export interface EmailLog {
  id?: string;
  subscriber_id: string;
  subject: string;
  articles_count: number;
  sent_at: string;
  opened: boolean;
  clicked: boolean;
  status: "sent" | "failed";
}

// ─── Article Operations ──────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveArticle(article: Record<string, any>): Promise<boolean> {
  const firestore = getDb();
  const col = firestore.collection(COLLECTIONS.articles);

  // Check for duplicate by guid or link
  const byGuid = await col.where("guid", "==", article.guid).limit(1).get();
  if (!byGuid.empty) return false;

  const byLink = await col.where("link", "==", article.link).limit(1).get();
  if (!byLink.empty) return false;

  await col.add({
    ...article,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveArticlesBatch(articles: Record<string, any>[]): Promise<number> {
  let saved = 0;
  for (const article of articles) {
    try {
      const wasSaved = await saveArticle(article);
      if (wasSaved) saved++;
    } catch (err) {
      console.error(`Failed to save article: ${article.title}`, err);
    }
  }
  return saved;
}

export async function getUnprocessedArticles(limit = 50): Promise<Article[]> {
  const firestore = getDb();
  const snapshot = await firestore
    .collection(COLLECTIONS.articles)
    .where("processed", "==", false)
    .orderBy("collected_at", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Article));
}

export async function getRecentArticles(hoursAgo = 24, limit = 100): Promise<Article[]> {
  const firestore = getDb();
  const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

  const snapshot = await firestore
    .collection(COLLECTIONS.articles)
    .where("processed", "==", true)
    .where("published_at", ">=", since)
    .orderBy("published_at", "desc")
    .limit(limit)
    .get();

  // Sort by ai_importance client-side (Firestore can't order by a field
  // that isn't the same as the inequality filter field in a compound query)
  const articles = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Article));
  return articles.sort((a, b) => (b.ai_importance || 0) - (a.ai_importance || 0));
}

export async function updateArticleAI(
  id: string,
  aiData: {
    ai_summary: string;
    ai_category: string;
    ai_tags: string[];
    ai_importance: number;
    ai_sentiment: string;
    key_takeaway: string;
  }
): Promise<void> {
  const firestore = getDb();
  await firestore
    .collection(COLLECTIONS.articles)
    .doc(id)
    .update({
      ...aiData,
      processed: true,
      updated_at: new Date().toISOString(),
    });
}

// ─── Subscriber Operations ───────────────────────────────────

export async function getActiveSubscribers(
  frequency: "daily" | "weekly" = "daily"
): Promise<Subscriber[]> {
  const firestore = getDb();
  const snapshot = await firestore
    .collection(COLLECTIONS.subscribers)
    .where("is_active", "==", true)
    .where("confirmed", "==", true)
    .where("frequency", "==", frequency)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Subscriber));
}

export async function findSubscriberByEmail(email: string): Promise<Subscriber | null> {
  const firestore = getDb();
  const snapshot = await firestore
    .collection(COLLECTIONS.subscribers)
    .where("email", "==", email)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Subscriber;
}

export async function findSubscriberByUnsubToken(token: string): Promise<Subscriber | null> {
  const firestore = getDb();
  const snapshot = await firestore
    .collection(COLLECTIONS.subscribers)
    .where("unsubscribe_token", "==", token)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Subscriber;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createSubscriber(data: Record<string, any>): Promise<string> {
  const firestore = getDb();
  const docRef = await firestore.collection(COLLECTIONS.subscribers).add({
    ...data,
    created_at: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateSubscriber(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
): Promise<void> {
  const firestore = getDb();
  await firestore.collection(COLLECTIONS.subscribers).doc(id).update(data);
}

// ─── Dashboard & Stats ───────────────────────────────────────

export async function getArticlesForDashboard(params: {
  category?: string;
  limit?: number;
  page?: number;
}): Promise<{ articles: Article[]; total: number }> {
  const firestore = getDb();
  const pageSize = params.limit || 20;

  let query = firestore
    .collection(COLLECTIONS.articles)
    .where("processed", "==", true)
    .orderBy("published_at", "desc");

  if (params.category) {
    query = query.where("ai_category", "==", params.category);
  }

  // Get total count (Firestore doesn't have a built-in count, so we estimate)
  const countSnapshot = await query.count().get();
  const total = countSnapshot.data().count;

  // Pagination using offset (simple approach for moderate data sizes)
  const offset = ((params.page || 1) - 1) * pageSize;
  const snapshot = await query.offset(offset).limit(pageSize).get();

  const articles = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Article));

  return { articles, total };
}

export async function getStats(): Promise<{
  totalArticles: number;
  activeSubscribers: number;
  emailsSentToday: number;
  sourcesCount: number;
}> {
  const firestore = getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [articlesCount, subscribersCount, emailsCount, sourcesSnapshot] =
    await Promise.all([
      firestore.collection(COLLECTIONS.articles).count().get(),
      firestore
        .collection(COLLECTIONS.subscribers)
        .where("is_active", "==", true)
        .count()
        .get(),
      // Single-field query to avoid needing a composite index
      firestore
        .collection(COLLECTIONS.emailLogs)
        .where("sent_at", ">=", today.toISOString())
        .count()
        .get(),
      firestore
        .collection(COLLECTIONS.articles)
        .select("source")
        .limit(1000)
        .get(),
    ]);

  const uniqueSources = new Set(
    sourcesSnapshot.docs.map((doc) => doc.data().source as string)
  );

  return {
    totalArticles: articlesCount.data().count,
    activeSubscribers: subscribersCount.data().count,
    emailsSentToday: emailsCount.data().count,
    sourcesCount: uniqueSources.size,
  };
}

// ─── Email Log Operations ────────────────────────────────────

export async function createEmailLog(log: Omit<EmailLog, "id">): Promise<void> {
  const firestore = getDb();
  await firestore.collection(COLLECTIONS.emailLogs).add(log);
}

// ─── Admin Operations ────────────────────────────────────────

export async function getAllSubscribers(): Promise<Subscriber[]> {
  const firestore = getDb();
  const snapshot = await firestore
    .collection(COLLECTIONS.subscribers)
    .orderBy("created_at", "desc")
    .limit(200)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Subscriber));
}

export async function getRecentEmailLogs(limit = 50): Promise<(EmailLog & { subscriber_email?: string })[]> {
  const firestore = getDb();
  const snapshot = await firestore
    .collection(COLLECTIONS.emailLogs)
    .orderBy("sent_at", "desc")
    .limit(limit)
    .get();

  const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as EmailLog));

  // Enrich with subscriber emails
  const subscriberIds = [...new Set(logs.map((l) => l.subscriber_id))];
  const emailMap = new Map<string, string>();

  for (const subId of subscriberIds) {
    try {
      const subDoc = await firestore.collection(COLLECTIONS.subscribers).doc(subId).get();
      if (subDoc.exists) {
        emailMap.set(subId, (subDoc.data() as Subscriber).email);
      }
    } catch { /* skip */ }
  }

  return logs.map((log) => ({
    ...log,
    subscriber_email: emailMap.get(log.subscriber_id) || "unknown",
  }));
}

export async function deleteSubscriber(id: string): Promise<void> {
  const firestore = getDb();
  await firestore.collection(COLLECTIONS.subscribers).doc(id).delete();
}
