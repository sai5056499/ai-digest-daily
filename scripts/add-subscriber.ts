/**
 * Add a subscriber by email (same shape as /api/subscribe).
 * Usage: npx tsx scripts/add-subscriber.ts [email]
 * Example: npx tsx scripts/add-subscriber.ts tilak.tirumalanagaram@celigo.com
 */

import "dotenv/config";
import { randomUUID } from "crypto";

async function main() {
  const email = process.argv[2] || "tilak.tirumalanagaram@celigo.com";
  const normalizedEmail = email.toLowerCase().trim();

  if (!normalizedEmail.includes("@")) {
    console.error("Usage: npx tsx scripts/add-subscriber.ts <email>");
    process.exit(1);
  }

  const { isFirebaseConfigured, findSubscriberByEmail, createSubscriber, updateSubscriber } = await import(
    "../src/lib/database/firebase.js"
  );

  if (!isFirebaseConfigured()) {
    console.error("Firebase is not configured. Set FIREBASE_* in .env");
    process.exit(1);
  }

  const existing = await findSubscriberByEmail(normalizedEmail);
  if (existing) {
    if (existing.is_active) {
      console.log(`Already subscribed (active): ${normalizedEmail}`);
      process.exit(0);
    }
    await updateSubscriber(existing.id!, { is_active: true, confirmed: true });
    console.log(`Reactivated: ${normalizedEmail}`);
    process.exit(0);
  }

  await createSubscriber({
    email: normalizedEmail,
    name: null,
    frequency: "daily",
    categories: ["ai", "tech"],
    preferred_time: "08:00:00",
    timezone: "UTC",
    confirm_token: randomUUID(),
    unsubscribe_token: randomUUID(),
    confirmed: true,
    is_active: true,
    last_email_sent: null,
    emails_received: 0,
  });

  console.log(`Added subscriber: ${normalizedEmail}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
