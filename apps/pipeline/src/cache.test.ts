import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { forwardBatch } from "./cache";
import type { GeolocationFix } from "./geolocation/types";

vi.mock("@root/config.yml", () => ({
  default: {
    pipelines: [{ type: "location", target: { database_name: "geolocation", table_name: "geolocation_fixes" } }],
  },
}));

const sampleFixes: GeolocationFix[] = [
  {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    speed: null,
    heading: null,
    timestamp: Date.now(),
  },
];

describe("forwardBatch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false when no CACHE_URL or local cache is configured", async () => {
    delete process.env.CACHE_URL;
    const result = await forwardBatch(sampleFixes);
    expect(result).toBe(false);
  });

  it("posts to CACHE_URL when no local cache is configured", async () => {
    const cacheUrl = process.env.CACHE_URL;
    if (!cacheUrl) return;

    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

    const result = await forwardBatch(sampleFixes);

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      `${cacheUrl}/main/geolocation/geolocation_fixes`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sampleFixes.map((f) => {
          const cleaned: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(f)) {
            if (v !== null) cleaned[k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)] = v;
          }
          return cleaned;
        })),
      }),
    );
  });

  it("returns false when CACHE_URL responds with error", async () => {
    const cacheUrl = process.env.CACHE_URL;
    if (!cacheUrl) return;

    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }));

    const result = await forwardBatch(sampleFixes);
    expect(result).toBe(false);
  });

  it("returns false when CACHE_URL is unreachable", async () => {
    const cacheUrl = process.env.CACHE_URL;
    if (!cacheUrl) return;

    const mockFetch = vi.mocked(fetch);
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await forwardBatch(sampleFixes);
    expect(result).toBe(false);
  });
});
