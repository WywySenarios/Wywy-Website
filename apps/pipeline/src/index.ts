import type { GeolocationWatcher } from "./geolocation/watcher";
import type { GeolocationFix } from "./geolocation/types";
import { GEOLOCATION_PIPELINE } from "./config";
import { forwardBatch } from "./cache";
import type { geolocationFixes } from "./db/schema";

export interface PipelineDb {
  insert(fix: GeolocationFix): void | Promise<void>;
  getPending(
    batchSize: number,
  ): Array<{ id: number } & GeolocationFix & { retryCount: number }> | Promise<Array<{ id: number } & GeolocationFix & { retryCount: number }>>;
  markForwarded(id: number): void | Promise<void>;
  incrementRetry(id: number): void | Promise<void>;
  prune(retentionMs: number): void | Promise<void>;
  getLastTimestamp(): number | undefined | Promise<number | undefined>;
}

export function initPipeline(
  watcher: GeolocationWatcher,
  db: PipelineDb,
): () => void {
  let lastCallbackTime = 0;

  const cleanupWatcher = watcher.start((fix: GeolocationFix) => {
    const now = Date.now();
    if (now - lastCallbackTime < GEOLOCATION_PIPELINE.debounceMs) return;
    lastCallbackTime = now;

    db.insert(fix);

    forwardPending();
  });

  async function forwardPending() {
    const pending = await Promise.resolve(db.getPending(GEOLOCATION_PIPELINE.batchSize));
    if (pending.length === 0) return;

    const success = await forwardBatch(pending);
    if (success) {
      for (const record of pending) {
        await Promise.resolve(db.markForwarded(record.id));
      }
    } else {
      for (const record of pending) {
        await Promise.resolve(db.incrementRetry(record.id));
      }
    }
  }

  const cleanupInterval = setInterval(() => {
    db.prune(GEOLOCATION_PIPELINE.retentionDays * 86_400_000);
  }, 3600_000);

  return () => {
    cleanupWatcher();
    clearInterval(cleanupInterval);
  };
}
