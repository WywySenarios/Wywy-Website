import type { AsyncRemoteCallback } from "drizzle-orm/sqlite-proxy";
import type { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

/** Node.js driver — uses better-sqlite3. Guards against missing optional dep. */
export async function createNodeDb(dbPath: string) {
  try {
    const { drizzle } = await import("drizzle-orm/better-sqlite3");
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

const FALLBACK_CREATE_TABLE_SQL = `CREATE TABLE IF NOT EXISTS geolocation_fixes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
);`;

async function loadMigrationSql(): Promise<string> {
  try {
    const mod = await import("../../migrations/0000_geolocation_fixes.sql?raw");
    const sql = (mod as { default?: string }).default;
    if (typeof sql === "string" && sql.length > 0) {
      console.log("[pipeline:db] Migration SQL loaded from file via ?raw import");
      return sql;
    }
  } catch (err) {
    console.warn(
      "[pipeline:db] Could not load migration SQL from file, using fallback:",
      (err as Error)?.message ?? String(err),
    );
  }
  console.log("[pipeline:db] Using fallback (inline) migration SQL");
  return FALLBACK_CREATE_TABLE_SQL;
}

let dbPromise: Promise<SqliteRemoteDatabase<typeof schema>> | undefined;

function checkCapacitorEnv(): void {
  console.log("[pipeline:db] Running Capacitor environment check...");
  if (typeof window === "undefined") {
    console.log("[pipeline:db] FAILED: not in a browser environment (no window)");
    throw new Error("Not in a browser environment");
  }
  const cap = (window as unknown as Record<string, Record<string, unknown>>)
    .Capacitor;
  if (!cap) {
    console.log("[pipeline:db] FAILED: window.Capacitor not found");
    throw new Error(
      "Capacitor runtime not available — pipeline requires the native mobile app",
    );
  }
  console.log("[pipeline:db] window.Capacitor found");
  if (typeof cap.isPluginAvailable === "function") {
    const sqliteAvailable = cap.isPluginAvailable("CapacitorSQLite");
    console.log("[pipeline:db] isPluginAvailable('CapacitorSQLite'):", sqliteAvailable);
    if (!sqliteAvailable) {
      throw new Error(
        "SQLite plugin not available — ensure the app was built with the native SQLite plugin",
      );
    }
  } else {
    console.log("[pipeline:db] isPluginAvailable not available on Capacitor object, skipping plugin check");
  }
  console.log("[pipeline:db] Capacitor environment check PASSED");
}

/** Capacitor driver — uses drizzle-orm/sqlite-proxy to wrap @capacitor-community/sqlite. */
export async function createCapacitorDb(dbName: string) {
  if (dbPromise) {
    console.log("[pipeline:db] createCapacitorDb: returning cached dbPromise for", dbName);
    return dbPromise;
  }

  console.log(`[pipeline:db] createCapacitorDb called for "${dbName}", creating new promise...`);
  dbPromise = (async () => {
    checkCapacitorEnv();

    let CapacitorSQLite: any;
    let proxyDrizzle: any;

    console.log("[pipeline:db] Importing @capacitor-community/sqlite...");
    let SQLiteConnectionClass: any;
    try {
      const mod = await import("@capacitor-community/sqlite");
      CapacitorSQLite = mod.CapacitorSQLite;
      SQLiteConnectionClass = mod.SQLiteConnection;
      console.log("[pipeline:db] @capacitor-community/sqlite imported successfully");
    } catch (err) {
      console.error("[pipeline:db] FAILED to import @capacitor-community/sqlite:", err);
      throw new Error(
        `Failed to load SQLite plugin: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    console.log("[pipeline:db] Importing drizzle-orm/sqlite-proxy...");
    try {
      const mod = await import("drizzle-orm/sqlite-proxy");
      proxyDrizzle = mod.drizzle;
      console.log("[pipeline:db] drizzle-orm/sqlite-proxy imported successfully");
    } catch (err) {
      console.error("[pipeline:db] FAILED to import drizzle-orm/sqlite-proxy:", err);
      throw new Error(
        `Failed to load drizzle SQLite proxy: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    console.log(`[pipeline:db] Setting up connection for database "${dbName}"...`);
    const sqliteConnection = new SQLiteConnectionClass(CapacitorSQLite);
    let dbConnection: any;
    try {
      // Close any stale connection left from a previous page load (native persists)
      console.log(`[pipeline:db] Closing any stale native connection for "${dbName}"...`);
      try {
        await CapacitorSQLite.closeConnection({ database: dbName, readonly: false });
        console.log(`[pipeline:db] Stale connection closed`);
      } catch {
        console.log(`[pipeline:db] No stale connection to close (or close failed — expected)`);
      }

      dbConnection = await sqliteConnection.createConnection(
        dbName,
        false,  // encrypted
        "no-encryption",  // mode
        1,  // version
        false,  // readonly
      );
      console.log(`[pipeline:db] Connection created for "${dbName}"`);
    } catch (err) {
      console.error(`[pipeline:db] FAILED to create connection for "${dbName}":`, err);
      throw new Error(
        `Failed to create connection "${dbName}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    console.log(`[pipeline:db] Opening database "${dbName}"...`);
    try {
      await dbConnection.open();
      console.log(`[pipeline:db] Database "${dbName}" opened successfully`);
    } catch (err) {
      console.error(`[pipeline:db] FAILED to open database "${dbName}":`, err);
      throw new Error(
        `Failed to open database "${dbName}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    console.log(`[pipeline:db] Loading migration SQL...`);
    const migrationSql = await loadMigrationSql();
    console.log(`[pipeline:db] Running migration on "${dbName}"...`);
    console.log(`[pipeline:db] Migration SQL: ${migrationSql.substring(0, 80)}...`);
    try {
      const execResult = await dbConnection.execute(migrationSql);
      console.log(`[pipeline:db] Migration executed successfully, result:`, execResult);
    } catch (err) {
      console.error(`[pipeline:db] FAILED to run migration on "${dbName}":`, err);
      throw new Error(
        `Failed to create tables in "${dbName}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const queryFn: AsyncRemoteCallback = async (sql, params, method) => {
      if (method === "run") {
        await dbConnection.run(sql, params);
        return { rows: [] };
      }
      const result = await dbConnection.query(sql, params);
      const rawValues: unknown[] = result.values ?? [];
      const rows = rawValues.map((row) => {
        if (Array.isArray(row)) return row;
        if (row !== null && typeof row === "object") {
          return Object.values(row as Record<string, unknown>);
        }
        return row;
      });
      return { rows };
    };

    console.log(`[pipeline:db] Database "${dbName}" fully initialized`);
    return proxyDrizzle(queryFn, { schema });
  })();

  return dbPromise;
}
