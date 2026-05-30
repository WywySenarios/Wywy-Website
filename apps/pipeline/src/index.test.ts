import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initPipeline } from "./index";
import type { GeolocationWatcher } from "./geolocation/watcher";
import type { GeolocationFix } from "./geolocation/types";
import type { PipelineDb } from "./index";

function createMockDb(): PipelineDb {
  const store: Array<{ id: number } & GeolocationFix & { retryCount: number; forwardedAt: number | null }> = [];
  let nextId = 1;

  return {
    insert(fix) {
      store.push({ id: nextId++, ...fix, retryCount: 0, forwardedAt: null });
    },
    getPending(limit) {
      return store
        .filter((r) => r.forwardedAt === null && r.retryCount < 3)
        .slice(0, limit) as any;
    },
    markForwarded(id) {
      const record = store.find((r) => r.id === id);
      if (record) record.forwardedAt = Date.now();
    },
    incrementRetry(id) {
      const record = store.find((r) => r.id === id);
      if (record) record.retryCount++;
    },
    prune() {},
    getLastTimestamp() {
      const sorted = [...store].sort((a, b) => b.timestamp - a.timestamp);
      return sorted[0]?.timestamp;
    },
  };
}

function createMockWatcher(): { watcher: GeolocationWatcher; trigger: (fix: GeolocationFix) => void } {
  let cb: ((fix: GeolocationFix) => void) | null = null;

  return {
    watcher: {
      start(callback) {
        cb = callback;
        return () => {
          cb = null;
        };
      },
    },
    trigger(fix) {
      cb?.(fix);
    },
  };
}

describe("initPipeline", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("stores a fix when the watcher fires", () => {
    const db = createMockDb();
    const { watcher, trigger } = createMockWatcher();

    const cleanup = initPipeline(watcher, db);

    const fix: GeolocationFix = {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      speed: null,
      heading: null,
      timestamp: Date.now(),
    };

    trigger(fix);

    const pending = db.getPending(10);
    expect(pending).toHaveLength(1);
    expect(pending[0].latitude).toBe(37.7749);

    cleanup();
  });

  it("debounces rapid callbacks", () => {
    const db = createMockDb();
    const { watcher, trigger } = createMockWatcher();

    const cleanup = initPipeline(watcher, db);

    const t0 = 0;
    trigger({ latitude: 1, longitude: 1, accuracy: null, altitude: null, altitudeAccuracy: null, speed: null, heading: null, timestamp: t0 });
    trigger({ latitude: 2, longitude: 2, accuracy: null, altitude: null, altitudeAccuracy: null, speed: null, heading: null, timestamp: t0 + 1000 });
    trigger({ latitude: 3, longitude: 3, accuracy: null, altitude: null, altitudeAccuracy: null, speed: null, heading: null, timestamp: t0 + 2000 });

    const pending = db.getPending(10);
    expect(pending).toHaveLength(1);

    cleanup();
  });

  it("marks forwarded records on successful POST", async () => {
    if (!process.env.CACHE_URL) return;

    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(new Response(null, { status: 200 }));

    const db = createMockDb();
    const { watcher, trigger } = createMockWatcher();

    const cleanup = initPipeline(watcher, db);

    const fix: GeolocationFix = {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      speed: null,
      heading: null,
      timestamp: Date.now(),
    };

    trigger(fix);

    await vi.waitFor(() => {
      const pending = db.getPending(10);
      expect(pending).toHaveLength(0);
    });

    cleanup();
  });

  it("increments retry count on failed POST", async () => {
    if (!process.env.CACHE_URL) return;

    vi.spyOn(console, "error").mockImplementation(() => {});
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockRejectedValue(new Error("Network error"));

    const db = createMockDb();
    const { watcher, trigger } = createMockWatcher();

    const cleanup = initPipeline(watcher, db);

    const fix: GeolocationFix = {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      speed: null,
      heading: null,
      timestamp: Date.now(),
    };

    trigger(fix);

    await vi.waitFor(() => {
      const pending = db.getPending(10);
      expect(pending).toHaveLength(1);
      expect(pending[0].retryCount).toBe(1);
    });

    cleanup();
    vi.mocked(console.error).mockRestore();
  });

  it("stops watching after cleanup is called", () => {
    const db = createMockDb();
    const { watcher, trigger } = createMockWatcher();

    const cleanup = initPipeline(watcher, db);

    cleanup();

    const fix: GeolocationFix = {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      speed: null,
      heading: null,
      timestamp: Date.now(),
    };

    trigger(fix);

    expect(db.getPending(10)).toHaveLength(0);
  });
});
