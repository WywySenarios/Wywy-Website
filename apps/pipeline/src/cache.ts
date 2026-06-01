import type { GeolocationFix } from "./geolocation/types";
import { GEOLOCATION_PIPELINE } from "./config";
import { submitEntry } from "@wywy/http/data/http";

/** Convert camelCase to snake_case (e.g. "altitudeAccuracy" → "altitude_accuracy"). */
function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/**
 * Prepare a fix for the cache:
 * 1. Strip null values (the cache rejects nulls for typed fields)
 * 2. Convert keys to snake_case (the cache normalises schema names this way)
 */
function prepareForCache(fix: GeolocationFix): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fix)) {
    if (v !== null) cleaned[camelToSnake(k)] = v;
  }
  return cleaned;
}

const CACHE_PATH = "/cache/geolocation/geolocation_fixes";

function cacheUrlFromEnv(): string | undefined {
  // Node.js context (test driver, dev scripts)
  if (typeof process !== "undefined") return process.env.CACHE_URL;
  // Browser context — Vite statically inlines import.meta.env.PUBLIC_CACHE_URL
  // at build time. Dynamic property access (e.g. through an intermediate
  // type-cast variable) bypasses this replacement and yields undefined.
  return import.meta.env.PUBLIC_CACHE_URL;
}

export async function forwardBatch(fixes: GeolocationFix[]): Promise<boolean> {
  const url = cacheUrlFromEnv();
  const localAddr = GEOLOCATION_PIPELINE.localCacheAddress;

  console.log(
    `[pipeline:cache] forwardBatch called: CACHE_URL=${url ?? "(unset)"} localCacheAddress=${localAddr ?? "(unset)"} recordCount=${fixes.length}`,
  );

  if (!url && !localAddr) {
    console.error("[pipeline:cache] No CACHE_URL or local cache configured — forwarding impossible");
    return false;
  }

  const body = JSON.stringify(fixes.map(prepareForCache));

  if (localAddr) {
    const localEndpoint = `${localAddr}/api/geolocation`;
    try {
      await submitEntry(localEndpoint, fixes, undefined, AbortSignal.timeout(GEOLOCATION_PIPELINE.forwardTimeoutMs), "text/plain");
      console.log(
        `[pipeline:cache] Forwarded ${fixes.length} record(s) to local cache: ${localEndpoint}`,
      );
      return true;
    } catch (err) {
      console.warn(
        `[pipeline:cache] Local cache POST failed (${localEndpoint}):`,
        err,
      );
      console.warn("[pipeline:cache] Falling back to CACHE_URL");
    }
  }

  try {
    const remoteEndpoint = `${url}/api/geolocation`;
    console.log(
      `[pipeline:cache] Forwarding ${fixes.length} record(s) to: ${remoteEndpoint} (timeout=${GEOLOCATION_PIPELINE.forwardTimeoutMs}ms)`,
    );
    await submitEntry(remoteEndpoint, fixes, undefined, AbortSignal.timeout(GEOLOCATION_PIPELINE.forwardTimeoutMs), "text/plain");
    console.log(
      `[pipeline:cache] Forwarded ${fixes.length} record(s) to: ${remoteEndpoint}`,
    );
    return true;
  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === "TimeoutError";
    console.error(
      `[pipeline:cache] Forward FAILED (${fixes.length} record(s))${isTimeout ? " — TIMEOUT" : ""}:`,
      err,
    );
    return false;
  }
}
