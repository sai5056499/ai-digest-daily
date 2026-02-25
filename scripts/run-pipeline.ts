/**
 * Manual pipeline runner.
 * Usage: npm run pipeline
 */

import "dotenv/config";

async function main() {
  console.log("\n🚀 Starting full pipeline...\n");

  const { runFullPipeline } = await import("../src/lib/pipeline/index");
  const result = await runFullPipeline();

  console.log("\n📊 Pipeline Results:");
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log("\n✅ Pipeline completed successfully!");
  } else {
    console.log("\n❌ Pipeline failed:", result.error);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
