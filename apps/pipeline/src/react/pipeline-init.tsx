"use client";

import { useEffect } from "react";

export function PipelineInit() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    async function init() {
      try {
        const [
          { initPipeline },
          { CapacitorGeolocationWatcher },
          { createCapacitorPipelineDb },
          { createCapacitorDb },
        ] = await Promise.all([
          import("../index"),
          import("../drivers/capacitor"),
          import("../db/adapter"),
          import("../db/index"),
        ]);

        if (cancelled) return;

        const db = await createCapacitorDb("pipeline");
        const pipelineDb = createCapacitorPipelineDb(db);
        cleanup = initPipeline(CapacitorGeolocationWatcher, pipelineDb);
      } catch (err) {
        console.error("[pipeline] Failed to initialize:", err);
      }
    }

    init();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return null;
}
