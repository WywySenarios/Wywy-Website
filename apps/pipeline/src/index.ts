import type { GeolocationWatcher } from "./geolocation/watcher";
import type { GeolocationFix } from "./geolocation/types";
import { GEOLOCATION_PIPELINE } from "./config";
import { forwardBatch } from "./cache";
import type { geolocationFixes } from "./db/schema";

export interface PipelineStats {
  total: number;
  pending: number;
  failed: number;
  lastTimestamp: number | undefined;
}

export interface PipelineDb {
  insert(fix: GeolocationFix): void | Promise<void>;
  getPending(
    batchSize: number,
  ): Array<{ id: number } & GeolocationFix & { retryCount: number; forwardedAt: number | null }> | Promise<Array<{ id: number } & GeolocationFix & { retryCount: number; forwardedAt: number | null }>>;
  markForwarded(id: number): void | Promise<void>;
  incrementRetry(id: number): void | Promise<void>;
  prune(retentionMs: number): void | Promise<void>;
  getLastTimestamp(): number | undefined | Promise<number | undefined>;
  getStats(maxRetries: number): PipelineStats | Promise<PipelineStats>;
}

export function initPipeline(
  watcher: GeolocationWatcher,
  db: PipelineDb,
): () => void {
  console.log("[pipeline:core] initPipeline called, starting geolocation watcher...");
  let lastCallbackTime = 0;
  let fixCount = 0;

  const cleanupWatcher = watcher.start((fix: GeolocationFix) => {
    const now = Date.now();
    if (now - lastCallbackTime < GEOLOCATION_PIPELINE.debounceMs) {
      return;
    }
    lastCallbackTime = now;
    fixCount++;
    console.log(
      `[pipeline:core] Watcher callback #${fixCount}: fix at (${fix.latitude.toFixed(4)}, ${fix.longitude.toFixed(4)}), accuracy=${fix.accuracy}`,
    );

    db.insert(fix);
    console.log("[pipeline:core] Fix stored in local DB");

    forwardPending();
  });

  console.log("[pipeline:core] Watcher started successfully");

  async function forwardPending() {
    console.log(
      `[pipeline:core] Checking for pending records (batchSize=${GEOLOCATION_PIPELINE.batchSize})...`,
    );
    const pending = await Promise.resolve(db.getPending(GEOLOCATION_PIPELINE.batchSize));
    console.log(`[pipeline:core] Found ${pending.length} pending records`);

    if (pending.length === 0) return;

    console.log(`[pipeline:core] Attempting to forward ${pending.length} records...`);
    const success = await forwardBatch(pending);
    if (success) {
      for (const record of pending) {
        await Promise.resolve(db.markForwarded(record.id));
      }
      console.log(`[pipeline:core] Forward SUCCEEDED — ${pending.length} records marked as forwarded`);
    } else {
      for (const record of pending) {
        await Promise.resolve(db.incrementRetry(record.id));
      }
      console.log(`[pipeline:core] Forward FAILED — ${pending.length} records retry count incremented`);
    }
  }

  const pruneIntervalMs = 3600_000;
  const cleanupInterval = setInterval(() => {
    const cutoffDays = GEOLOCATION_PIPELINE.retentionDays;
    console.log(`[pipeline:core] Pruning records older than ${cutoffDays} days...`);
    db.prune(cutoffDays * 86_400_000);
  }, pruneIntervalMs);

  console.log(`[pipeline:core] Prune interval set (every ${pruneIntervalMs}ms, retention ${GEOLOCATION_PIPELINE.retentionDays} days)`);
  console.log("[pipeline:core] Pipeline fully initialized and running");

  return () => {
    console.log("[pipeline:core] Pipeline shutdown initiated");
    cleanupWatcher();
    clearInterval(cleanupInterval);
    console.log("[pipeline:core] Pipeline shutdown complete");
  };
}
