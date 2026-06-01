import type { PipelineDb } from "../index";
import type { GeolocationFix } from "../geolocation/types";
import { geolocationFixes } from "./schema";
import { eq, lt, and, isNull, desc, sql, count, gte } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";

function toSafeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function createNodePipelineDb(
  db: BetterSQLite3Database<typeof import("./schema")>,
): PipelineDb {
  return {
    insert(fix) {
      db.insert(geolocationFixes)
        .values({
          latitude: fix.latitude,
          longitude: fix.longitude,
          accuracy: fix.accuracy,
          altitude: fix.altitude,
          altitudeAccuracy: fix.altitudeAccuracy,
          speed: fix.speed,
          heading: fix.heading,
          timestamp: fix.timestamp,
          capturedAt: Date.now(),
        })
        .run();
    },
    getPending(limit) {
      return db
        .select()
        .from(geolocationFixes)
        .where(
          and(
            isNull(geolocationFixes.forwardedAt),
            lt(geolocationFixes.retryCount, 3),
          ),
        )
        .limit(limit)
        .all();
    },
    markForwarded(id) {
      db.update(geolocationFixes)
        .set({ forwardedAt: Date.now() })
        .where(eq(geolocationFixes.id, id))
        .run();
    },
    incrementRetry(id) {
      db.update(geolocationFixes)
        .set({ retryCount: sql`${geolocationFixes.retryCount} + 1` })
        .where(eq(geolocationFixes.id, id))
        .run();
    },
    prune(retentionMs) {
      const cutoff = Date.now() - retentionMs;
      db.delete(geolocationFixes)
        .where(lt(geolocationFixes.forwardedAt, cutoff))
        .run();
    },
    getLastTimestamp() {
      const row = db
        .select({ ts: geolocationFixes.timestamp })
        .from(geolocationFixes)
        .orderBy(desc(geolocationFixes.timestamp))
        .get();
      return row?.ts != null ? toSafeNum(row.ts) : undefined;
    },
    getStats(maxRetries) {
      const [totalRow] = db.select({ value: count() }).from(geolocationFixes).all();
      const [pendingRow] = db
        .select({ value: count() })
        .from(geolocationFixes)
        .where(
          and(
            isNull(geolocationFixes.forwardedAt),
            lt(geolocationFixes.retryCount, maxRetries),
          ),
        )
        .all();
      const [failedRow] = db
        .select({ value: count() })
        .from(geolocationFixes)
        .where(gte(geolocationFixes.retryCount, maxRetries))
        .all();
      const ts = db
        .select({ ts: geolocationFixes.timestamp })
        .from(geolocationFixes)
        .orderBy(desc(geolocationFixes.timestamp))
        .get();
      return {
        total: toSafeNum(totalRow?.value),
        pending: toSafeNum(pendingRow?.value),
        failed: toSafeNum(failedRow?.value),
        lastTimestamp: ts?.ts != null ? toSafeNum(ts.ts) : undefined,
      };
    },
  };
}

export function createCapacitorPipelineDb(
  db: SqliteRemoteDatabase<typeof import("./schema")>,
): PipelineDb {
  return {
    async insert(fix) {
      await db.insert(geolocationFixes).values({
        latitude: fix.latitude,
        longitude: fix.longitude,
        accuracy: fix.accuracy,
        altitude: fix.altitude,
        altitudeAccuracy: fix.altitudeAccuracy,
        speed: fix.speed,
        heading: fix.heading,
        timestamp: fix.timestamp,
        capturedAt: Date.now(),
      });
    },
    async getPending(limit) {
      return await db
        .select()
        .from(geolocationFixes)
        .where(
          and(
            isNull(geolocationFixes.forwardedAt),
            lt(geolocationFixes.retryCount, 3),
          ),
        )
        .limit(limit);
    },
    async markForwarded(id) {
      await db
        .update(geolocationFixes)
        .set({ forwardedAt: Date.now() })
        .where(eq(geolocationFixes.id, id));
    },
    async incrementRetry(id) {
      await db
        .update(geolocationFixes)
        .set({ retryCount: sql`${geolocationFixes.retryCount} + 1` })
        .where(eq(geolocationFixes.id, id));
    },
    async prune(retentionMs) {
      const cutoff = Date.now() - retentionMs;
      await db
        .delete(geolocationFixes)
        .where(lt(geolocationFixes.forwardedAt, cutoff));
    },
    async getLastTimestamp() {
      const rows = await db
        .select({ ts: geolocationFixes.timestamp })
        .from(geolocationFixes)
        .orderBy(desc(geolocationFixes.timestamp))
        .limit(1);
      return rows[0]?.ts != null ? toSafeNum(rows[0].ts) : undefined;
    },
    async getStats(maxRetries) {
      const [totalRow] = await db.select({ value: count() }).from(geolocationFixes);
      const [pendingRow] = await db
        .select({ value: count() })
        .from(geolocationFixes)
        .where(
          and(
            isNull(geolocationFixes.forwardedAt),
            lt(geolocationFixes.retryCount, maxRetries),
          ),
        );
      const [failedRow] = await db
        .select({ value: count() })
        .from(geolocationFixes)
        .where(gte(geolocationFixes.retryCount, maxRetries));
      const tsRows = await db
        .select({ ts: geolocationFixes.timestamp })
        .from(geolocationFixes)
        .orderBy(desc(geolocationFixes.timestamp))
        .limit(1);
      return {
        total: toSafeNum(totalRow?.value),
        pending: toSafeNum(pendingRow?.value),
        failed: toSafeNum(failedRow?.value),
        lastTimestamp: tsRows[0]?.ts != null ? toSafeNum(tsRows[0].ts) : undefined,
      };
    },
  };
}
