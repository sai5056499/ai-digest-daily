/**
 * Local cron runner for development.
 * Usage: npm run cron
 *
 * Reads sendHourUtc and collectIntervalHours from your sandbox settings
 * so changes in the UI take effect without restarting this script.
 */

import "dotenv/config";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("tsx/esm", pathToFileURL("./"));

async function main() {
  console.log("\n⏰ Starting local cron scheduler...\n");

  const cron = await import("node-cron");
  const { runFullPipeline, runCollectionPipeline } = await import(
    "../src/lib/pipeline/index.js"
  );
  const { getSettings } = await import("../src/lib/settings.js");

  // Collect articles every 2 hours (uses setting for display, but runs every 2h)
  cron.default.schedule("0 */2 * * *", async () => {
    console.log(`\n[${new Date().toISOString()}] ⏰ Running: Article Collection`);
    try {
      const result = await runCollectionPipeline();
      console.log(`  → Collected: ${result.collected}, Saved: ${result.saved}`);
    } catch (err) {
      console.error("  → Collection failed:", err);
    }
  });

  // Check every hour if it's time to send the daily digest
  cron.default.schedule("0 * * * *", async () => {
    const settings = await getSettings();
    const currentUtcHour = new Date().getUTCHours();

    if (currentUtcHour !== settings.sendHourUtc) {
      return; // Not the configured send hour
    }

    console.log(`\n[${new Date().toISOString()}] ⏰ Running: Daily Digest Pipeline (configured for ${settings.sendHourUtc}:00 UTC)`);
    try {
      const result = await runFullPipeline();
      console.log(`  → Emails sent: ${result.emailsSent}, Failed: ${result.emailsFailed}`);
    } catch (err) {
      console.error("  → Pipeline failed:", err);
    }
  });

  // Monthly cleanup
  cron.default.schedule("0 0 1 * *", async () => {
    console.log(`\n[${new Date().toISOString()}] 🧹 Running: Monthly Cleanup`);
    try {
      const { getDb } = await import("../src/lib/database/firebase.js");
      const db = getDb();
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      const oldDocs = await db
        .collection("articles")
        .where("collected_at", "<", thirtyDaysAgo)
        .limit(500)
        .get();
      const batch = db.batch();
      oldDocs.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      console.log(`  → Cleaned up ${oldDocs.size} old articles`);
    } catch (err) {
      console.error("  → Cleanup failed:", err);
    }
  });

  const settings = await getSettings();
  const offset = -(new Date().getTimezoneOffset() / 60);
  const localHour = (settings.sendHourUtc + offset + 24) % 24;
  const ampm = localHour >= 12 ? "PM" : "AM";
  const h12 = localHour % 12 || 12;

  console.log("Scheduled jobs:");
  console.log("  • Article collection : every 2 hours");
  console.log(`  • Daily digest       : ${settings.sendHourUtc}:00 UTC (${h12}:00 ${ampm} local)`);
  console.log("  • Monthly cleanup    : 1st of each month");
  console.log("\nPress Ctrl+C to stop.\n");

  // Run an initial collection immediately
  console.log("Running initial collection...");
  try {
    const result = await runCollectionPipeline();
    console.log(
      `Initial collection: ${result.collected} collected, ${result.saved} saved\n`
    );
  } catch (err) {
    console.error("Initial collection failed:", err);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
