import type { GeolocationFix } from "./geolocation/types";
import { GEOLOCATION_PIPELINE } from "./config";
import { submitEntry } from "@wywy/http/data/http";
import { toSnakeCase } from "./util";
import config from "@root/config.yml";

const GEOLOCATION_FIELDS = {
  latitude: "latitude",
  longitude: "longitude",
  accuracy: "accuracy",
  altitude: "altitude",
  altitudeAccuracy: "altitude_accuracy",
  speed: "speed",
  heading: "heading",
  timestamp: "timestamp",
} as const;

/**
 * Prepare a fix for the cache:
 * 1. Strip null/undefined values (the cache rejects nulls for typed fields)
 * 2. Only include known geolocation fields (excludes DB internals like id, retry_count, captured_at)
 * 3. Convert epoch-ms timestamp to ISO 8601
 */
function prepareForCache(fix: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [k, out] of Object.entries(GEOLOCATION_FIELDS)) {
    const v = fix[k];
    if (v === null || v === undefined) continue;
    cleaned[out] = k === "timestamp" && typeof v === "number"
      ? new Date(v).toISOString()
      : v;
  }
  return cleaned;
}

function cacheUrlFromEnv(): string | undefined {
  // Node.js context (test driver, dev scripts)
  if (typeof process !== "undefined") return process.env.CACHE_URL;
  // Browser context — Vite statically inlines import.meta.env.PUBLIC_CACHE_URL
  // at build time. Dynamic property access (e.g. through an intermediate
  // type-cast variable) bypasses this replacement and yields undefined.
  return import.meta.env.PUBLIC_CACHE_URL;
}

function getGeolocationEndpoint(): string {
  const pipeline = config.pipelines?.find((p) => p.type === "location");
  if (!pipeline) return "/api/geolocation";
  return `/main/${toSnakeCase(pipeline.target.database_name)}/${toSnakeCase(pipeline.target.table_name)}`;
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

  const endpoint = getGeolocationEndpoint();

  async function postRecord(record: Record<string, unknown>, targetUrl: string): Promise<boolean> {
    try {
      await submitEntry(`${targetUrl}${endpoint}`, record, "cache", AbortSignal.timeout(GEOLOCATION_PIPELINE.forwardTimeoutMs));
      return true;
    } catch (err) {
      console.warn(`[pipeline:cache] POST failed (${targetUrl}${endpoint}):`, err);
      return false;
    }
  }

  let any = false;
  for (const fix of fixes) {
    const record = prepareForCache(fix);
    if (localAddr) {
      if (await postRecord(record, localAddr)) { any = true; continue; }
      console.warn("[pipeline:cache] Falling back to CACHE_URL");
    }
    if (url && await postRecord(record, url)) {
      any = true;
    }
  }

  if (any) {
    console.log(`[pipeline:cache] Forwarded ${fixes.length} record(s)`);
  } else {
    console.error(`[pipeline:cache] Forward FAILED (${fixes.length} record(s))`);
  }
  return any;
}
