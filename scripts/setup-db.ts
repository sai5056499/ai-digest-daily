/**
 * Database setup verification script.
 * Usage: npm run setup-db
 */

import "dotenv/config";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("tsx/esm", pathToFileURL("./"));

async function main() {
  console.log("\n🔥 Verifying Firebase Firestore connection...\n");

  const { isFirebaseConfigured, getDb } = await import(
    "../src/lib/database/firebase.js"
  );

  if (!isFirebaseConfigured()) {
    console.error("❌ Firebase is not configured!\n");
    console.log("Fill in these values in your .env file:");
    console.log("  FIREBASE_PROJECT_ID=...");
    console.log("  FIREBASE_CLIENT_EMAIL=...");
    console.log('  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
    console.log("\nSee README.md for detailed setup instructions.");
    process.exit(1);
  }

  try {
    const db = getDb();

    // Test write
    const testRef = db.collection("_connection_test").doc("test");
    await testRef.set({ connected: true, timestamp: new Date().toISOString() });
    console.log("✅ Write test passed");

    // Test read
    const doc = await testRef.get();
    console.log("✅ Read test passed:", doc.data());

    // Clean up
    await testRef.delete();
    console.log("✅ Delete test passed");

    console.log("\n🎉 Firebase Firestore is connected and working!\n");
    console.log("Collections created automatically on first use:");
    console.log("  • articles    — collected and AI-processed articles");
    console.log("  • subscribers — newsletter subscribers");
    console.log("  • email_logs  — email delivery history\n");
  } catch (error) {
    console.error("❌ Firebase connection failed!\n");
    console.error("Error:", (error as Error).message);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
