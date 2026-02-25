/**
 * Collection-only runner (no AI, no emails).
 * Usage: npm run collect
 */

import "dotenv/config";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("tsx/esm", pathToFileURL("./"));

async function main() {
  console.log("\n📡 Starting collection-only pipeline...\n");

  const { runCollectionPipeline } = await import("../src/lib/pipeline/index.js");
  const result = await runCollectionPipeline();

  console.log("\n📊 Collection Results:");
  console.log(`  Collected: ${result.collected}`);
  console.log(`  New saved: ${result.saved}`);
  console.log("\n✅ Done!");

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
