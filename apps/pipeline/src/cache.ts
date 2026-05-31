import type { GeolocationFix } from "./geolocation/types";
import { GEOLOCATION_PIPELINE } from "./config";
import { submitEntry } from "@wywy/http/data/http";

export async function forwardBatch(fixes: GeolocationFix[]): Promise<boolean> {
  const CACHE_URL =
    typeof process !== "undefined" ? process.env.CACHE_URL : undefined;

  if (!CACHE_URL && !GEOLOCATION_PIPELINE.localCacheAddress) {
    console.error("[pipeline] No CACHE_URL or local cache configured");
    return false;
  }

  if (GEOLOCATION_PIPELINE.localCacheAddress) {
    try {
      await submitEntry(
        `${GEOLOCATION_PIPELINE.localCacheAddress}/api/geolocation`,
        fixes as any,
      );
      return true;
    } catch {
      console.warn(
        "[pipeline] Local cache unreachable — falling back to CACHE_URL",
      );
    }
  }

  try {
    await submitEntry(`${CACHE_URL}/api/geolocation`, fixes as any);
    return true;
  } catch (err) {
    console.error("[pipeline] CACHE_URL unreachable:", err);
    return false;
  }
}
