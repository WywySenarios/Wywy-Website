import { drizzle } from "drizzle-orm/better-sqlite3";
import type { AsyncRemoteCallback } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

/** Node.js driver — uses better-sqlite3. Guards against missing optional dep. */
export function createNodeDb(dbPath: string) {
  try {
    const Database = require("better-sqlite3");
    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");
    return drizzle(sqlite, { schema });
  } catch {
    throw new Error(
      "better-sqlite3 is not available. Install it as an optional dependency.",
    );
  }
}

/** Capacitor driver — uses drizzle-orm/sqlite-proxy to wrap @capacitor-community/sqlite. */
export async function createCapacitorDb(dbName: string) {
  const { CapacitorSQLite } = await import("@capacitor-community/sqlite");
  const { drizzle: proxyDrizzle } = await import("drizzle-orm/sqlite-proxy");

  // Open (or create) the database
  await (CapacitorSQLite as any).openDatabase({ database: dbName });

  const queryFn: AsyncRemoteCallback = async (sql, params, method) => {
    if (method === "run") {
      const result = await (CapacitorSQLite as any).run({
        database: dbName,
        statement: sql,
        values: params,
      });
      return { rows: result.changes };
    }
    const result = await (CapacitorSQLite as any).query({
      database: dbName,
      statement: sql,
      values: params,
    });
    return { rows: result.values ?? [] };
  };

  return proxyDrizzle(queryFn, { schema });
}
