export const GEOLOCATION_PIPELINE = {
  /** Min ms between successive watcher callbacks before storing (debounce) */
  debounceMs: 5_000,

  /** Max records to forward in a single POST */
  batchSize: 10,

  /** Max retries per record before dropping */
  maxRetries: 3,

  /** Records older than this (days) are pruned */
  retentionDays: 30,

  /** HTTP timeout for forwarding (ms) */
  forwardTimeoutMs: 30_000,

  /** Local cache address (same-machine/loopback). Set to null to skip. */
  localCacheAddress: null as string | null,
} as const;
