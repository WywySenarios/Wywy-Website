import type { GeolocationFix } from "./geolocation/types";
import { GEOLOCATION_PIPELINE } from "./config";

export async function forwardBatch(fixes: GeolocationFix[]): Promise<boolean> {
  const CACHE_URL =
    typeof process !== "undefined" ? process.env.CACHE_URL : undefined;

  if (!CACHE_URL && !GEOLOCATION_PIPELINE.localCacheAddress) {
    console.error("[pipeline] No CACHE_URL or local cache configured");
    return false;
  }

  if (GEOLOCATION_PIPELINE.localCacheAddress) {
    try {
      const res = await fetch(
        `${GEOLOCATION_PIPELINE.localCacheAddress}/api/geolocation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fixes),
        },
      );
      if (res.ok) return true;
      console.warn(
        "[pipeline] Local cache returned",
        res.status,
        "— falling back",
      );
    } catch {
      console.warn(
        "[pipeline] Local cache unreachable — falling back to CACHE_URL",
      );
    }
  }

  try {
    const res = await fetch(`${CACHE_URL}/api/geolocation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fixes),
    });
    return res.ok;
  } catch (err) {
    console.error("[pipeline] CACHE_URL unreachable:", err);
    return false;
  }
}
