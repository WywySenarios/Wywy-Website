import type { GeolocationFix } from "./types";

export interface GeolocationWatcher {
  /**
   * Start watching device position. Calls `callback` with each new fix.
   * Returns a cleanup function that stops watching.
   */
  start(callback: (fix: GeolocationFix) => void): () => void;
}
