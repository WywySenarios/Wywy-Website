"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import type { PipelineDb, PipelineStats } from "../index";
import { GEOLOCATION_PIPELINE } from "../config";

interface PipelineContextValue {
  pipelineDb: PipelineDb | null;
  stats: PipelineStats | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

const PipelineContext = createContext<PipelineContextValue | null>(null);

export function usePipeline() {
  const ctx = useContext(PipelineContext);
  if (!ctx) throw new Error("usePipeline must be used within PipelineProvider");
  return ctx;
}

function isCapacitorNative(): boolean {
  return (
    typeof window !== "undefined" &&
    !!(window as unknown as Record<string, unknown>).Capacitor
  );
}

let watcherRefs = 0;
let watcherCleanupFn: (() => void) | undefined;

export function PipelineProvider({ children }: { children?: ReactNode }) {
  const [pipelineDb, setPipelineDb] = useState<PipelineDb | null>(null);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const localWatcherCleanup = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    console.log("[pipeline:provider] PipelineProvider mounted, starting initialization...");

    if (!isCapacitorNative()) {
      console.log("[pipeline:provider] Capacitor native check FAILED — window.Capacitor not found");
      setError("Capacitor runtime not available — pipeline requires the native mobile app");
      setLoading(false);
      return;
    }
    console.log("[pipeline:provider] Capacitor native check PASSED");
    const cap = (window as unknown as Record<string, Record<string, unknown>>).Capacitor;
    console.log("[pipeline:provider] Capacitor.getPlatform():", typeof cap?.getPlatform === "function" ? cap.getPlatform() : "N/A");
    console.log("[pipeline:provider] Capacitor.isNativePlatform():", typeof cap?.isNativePlatform === "function" ? cap.isNativePlatform() : "N/A");

    async function init() {
      try {
        console.log("[pipeline:provider] Importing pipeline core modules...");

        const modules = await Promise.allSettled([
          import("../db/index"),
          import("../db/adapter"),
          import("../index"),
          import("../drivers/capacitor"),
        ]);

        const moduleNames = ["db/index", "db/adapter", "index", "drivers/capacitor"];
        for (let i = 0; i < modules.length; i++) {
          const result = modules[i];
          if (result.status === "rejected") {
            console.error(`[pipeline:provider] FAILED to import ${moduleNames[i]}:`, result.reason);
            console.error(`[pipeline:provider] Error type: ${typeof result.reason}, keys:`, Object.keys(result.reason || {}));
            throw new Error(
              `Failed to import ${moduleNames[i]}: ${result.reason?.message ?? String(result.reason)}`,
            );
          }
        }

        const [{ value: dbIndex }, { value: dbAdapter }, { value: indexMod }, { value: driversCapacitor }] = modules as [
          PromiseFulfilledResult<typeof import("../db/index")>,
          PromiseFulfilledResult<typeof import("../db/adapter")>,
          PromiseFulfilledResult<typeof import("../index")>,
          PromiseFulfilledResult<typeof import("../drivers/capacitor")>,
        ];

        const { createCapacitorDb } = dbIndex;
        const { createCapacitorPipelineDb } = dbAdapter;
        const { initPipeline } = indexMod;
        const { CapacitorGeolocationWatcher } = driversCapacitor;

        console.log("[pipeline:provider] Modules imported successfully");

        if (cancelled) return;

        console.log("[pipeline:provider] Creating Capacitor DB (name: 'pipeline')...");
        const db = await createCapacitorDb("pipeline");
        console.log("[pipeline:provider] DB created successfully");

        console.log("[pipeline:provider] Creating pipeline adapter...");
        const pipeline = createCapacitorPipelineDb(db);
        console.log("[pipeline:provider] Pipeline adapter created");

        if (cancelled) return;

        if (watcherRefs === 0) {
          console.log("[pipeline:provider] Starting geolocation watcher (first instance)...");
          watcherCleanupFn = initPipeline(CapacitorGeolocationWatcher, pipeline);
        } else {
          console.log(`[pipeline:provider] Reusing existing watcher (refs=${watcherRefs})`);
        }
        watcherRefs++;
        localWatcherCleanup.current = () => {
          watcherRefs--;
          if (watcherRefs === 0 && watcherCleanupFn) {
            watcherCleanupFn();
            watcherCleanupFn = undefined;
          }
        };

        setPipelineDb(pipeline);
        setLoading(false);
        console.log("[pipeline:provider] Pipeline initialization COMPLETE");
      } catch (err: unknown) {
        if (cancelled) return;
        console.error("[pipeline:provider] Initialization FAILED:", err);
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    }

    init();
    return () => {
      console.log("[pipeline:provider] PipelineProvider unmounting, cleaning up...");
      cancelled = true;
      localWatcherCleanup.current?.();
    };
  }, []);

  const refreshStats = useCallback(async () => {
    if (!pipelineDb) return;
    try {
      const s = await pipelineDb.getStats(GEOLOCATION_PIPELINE.maxRetries);
      console.log(
        `[pipeline:provider] Stats: total=${s.total} pending=${s.pending} failed=${s.failed} lastTimestamp=${s.lastTimestamp}`,
      );
      setStats(s);
    } catch (err) {
      console.error("[pipeline:provider] Failed to refresh stats:", err);
    }
  }, [pipelineDb]);

  useEffect(() => {
    if (pipelineDb) refreshStats();
  }, [pipelineDb, refreshStats]);

  return (
    <PipelineContext.Provider value={{ pipelineDb, stats, loading, error, refreshStats }}>
      {children}
    </PipelineContext.Provider>
  );
}
