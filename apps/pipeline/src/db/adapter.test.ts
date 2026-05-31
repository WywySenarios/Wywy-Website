import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { createNodePipelineDb } from "./adapter";
import type { PipelineDb } from "../index";
import type { GeolocationFix } from "../geolocation/types";
import { unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const dbPath = join(tmpdir(), `pipeline-test-${Date.now()}.db`);

function createTestDb() {
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS geolocation_fixes (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      accuracy REAL,
      altitude REAL,
      altitude_accuracy REAL,
      speed REAL,
      heading REAL,
      timestamp INTEGER NOT NULL,
      captured_at INTEGER NOT NULL,
      forwarded_at INTEGER,
      retry_count INTEGER DEFAULT 0 NOT NULL
    );
  `);
  return drizzle(sqlite, { schema });
}

describe("Node pipeline DB adapter", () => {
  let db: PipelineDb;

  beforeEach(() => {
    const drizzleDb = createTestDb();
    db = createNodePipelineDb(drizzleDb);
  });

  afterEach(() => {
    if (existsSync(dbPath)) {
      try {
        unlinkSync(dbPath);
      } catch {
        // Windows may hold a lock
      }
    }
  });

  const sampleFix: GeolocationFix = {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    speed: null,
    heading: null,
    timestamp: Date.now(),
  };

  it("inserts a fix and retrieves it as pending", async () => {
    db.insert(sampleFix);

    const pending = await db.getPending(10);
    expect(pending).toHaveLength(1);
    expect(pending[0].latitude).toBe(sampleFix.latitude);
    expect(pending[0].longitude).toBe(sampleFix.longitude);
    expect(pending[0].forwardedAt).toBeNull();
    expect(pending[0].retryCount).toBe(0);
  });

  it("returns empty pending when no rows exist", async () => {
    const pending = await db.getPending(10);
    expect(pending).toHaveLength(0);
  });

  it("marks a record as forwarded", async () => {
    db.insert(sampleFix);
    const pending = await db.getPending(10);
    expect(pending).toHaveLength(1);

    db.markForwarded(pending[0].id);

    const remaining = await db.getPending(10);
    expect(remaining).toHaveLength(0);

    const lastTs = db.getLastTimestamp();
    expect(lastTs).toBe(sampleFix.timestamp);
  });

  it("increments retry count", async () => {
    db.insert(sampleFix);
    const pending = await db.getPending(10);
    expect(pending[0].retryCount).toBe(0);

    db.incrementRetry(pending[0].id);
    db.incrementRetry(pending[0].id);

    const pending2 = await db.getPending(10);
    expect(pending2[0].retryCount).toBe(2);
  });

  it("excludes records at max retries from pending", async () => {
    db.insert(sampleFix);
    const pending = await db.getPending(10);
    for (let i = 0; i < 3; i++) {
      db.incrementRetry(pending[0].id);
    }

    const remaining = await db.getPending(10);
    expect(remaining).toHaveLength(0);
  });

  it("prunes old forwarded records", async () => {
    vi.useFakeTimers();
    const baseTime = Date.now();

    vi.setSystemTime(baseTime);
    db.insert(sampleFix);
    const pending = await db.getPending(10);
    db.markForwarded(pending[0].id);

    vi.advanceTimersByTime(60_000);

    db.prune(50_000);

    const afterPrune = await db.getPending(10);
    expect(afterPrune).toHaveLength(0);

    const lastTs = db.getLastTimestamp();
    expect(lastTs).toBeUndefined();

    vi.useRealTimers();
  });

  it("getLastTimestamp returns undefined when no records", () => {
    const ts = db.getLastTimestamp();
    expect(ts).toBeUndefined();
  });

  it("getLastTimestamp returns the most recent timestamp", () => {
    const fix1: GeolocationFix = { ...sampleFix, timestamp: 1000 };
    const fix2: GeolocationFix = { ...sampleFix, timestamp: 2000 };
    const fix3: GeolocationFix = { ...sampleFix, timestamp: 1500 };

    db.insert(fix1);
    db.insert(fix2);
    db.insert(fix3);

    const ts = db.getLastTimestamp();
    expect(ts).toBe(2000);
  });
});
