import { NodeTestWatcher } from "./drivers/node";
import { createNodeDb } from "./db/index";
import { createNodePipelineDb } from "./db/adapter";
import { initPipeline } from "./index";

const dbPath = process.env.DB_PATH ?? "./data/pipeline.db";
const db = await createNodeDb(dbPath);
const pipelineDb = createNodePipelineDb(db);

console.log("[pipeline] Starting Node test driver — DB:", dbPath);
console.log("[pipeline] Press Ctrl+C to stop.");

const cleanup = initPipeline(NodeTestWatcher, pipelineDb);

process.on("SIGINT", () => {
  console.log("\n[pipeline] Shutting down...");
  cleanup();
  process.exit(0);
});
