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
  // Browser context — Astro replaces import.meta.env at build time
  try {
    return (import.meta as unknown as Record<string, Record<string, string>>).env
      ?.PUBLIC_CACHE_URL;
  } catch {
    return undefined;
  }
}

export async function forwardBatch(fixes: GeolocationFix[]): Promise<boolean> {
  const url = cacheUrlFromEnv();

  if (!url && !GEOLOCATION_PIPELINE.localCacheAddress) {
    console.error("[pipeline] No CACHE_URL or local cache configured");
    return false;
  }

  const body = JSON.stringify(fixes.map(prepareForCache));

  if (GEOLOCATION_PIPELINE.localCacheAddress) {
    try {
      await submitEntry(
        `${GEOLOCATION_PIPELINE.localCacheAddress}/api/geolocation`,
        fixes,
      );
      return true;
    } catch {
      console.warn(
        "[pipeline] Local cache unreachable — falling back to CACHE_URL",
      );
    }
  }

  try {
    await submitEntry(`${url}/api/geolocation`, fixes);
    return true;
  } catch (err) {
    console.error("[pipeline] CACHE_URL unreachable:", err);
    return false;
  }
}
