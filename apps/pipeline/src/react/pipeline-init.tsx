"use client";

import { useEffect, useRef } from "react";
import { usePipeline } from "./pipeline-provider";

export function PipelineInit() {
  const { pipelineDb, loading } = usePipeline();
  const cleanupRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    if (!pipelineDb) return;
    const db = pipelineDb;

    let cancelled = false;

    async function init() {
      try {
        const [{ initPipeline }, { CapacitorGeolocationWatcher }] =
          await Promise.all([
            import("../index"),
            import("../drivers/capacitor"),
          ]);

        if (cancelled) return;

        cleanupRef.current = initPipeline(CapacitorGeolocationWatcher, db);
      } catch (err: any) {
        console.error("[pipeline] Failed to initialize:", {
          message: err?.message ?? String(err),
          code: err?.code,
          stack: err?.stack,
        });
      }
    }

    init();
    return () => {
      cancelled = true;
      cleanupRef.current?.();
    };
  }, [pipelineDb]);

  return null;
}
