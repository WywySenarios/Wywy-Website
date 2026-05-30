# Pipeline App

The pipeline app allows users to automatically forward their own data to their own servers.

## Geolocation Pipeline

The geolocation pipeline gathers data on the user's location, stores it in a local SQLite database, and forwards it through a cache chain to the configured `CACHE_URL`.

### Quick Start

1. Install dependencies:
   ```
   cd apps/pipeline && npm install
   ```

2. Configure `CACHE_URL` environment variable (or set `localCacheAddress` in `src/config.ts`).

3. Run with the Node.js test driver (no device needed):
   ```
   cd apps/pipeline && npx tsx src/test-driver.ts
   ```

### Testing

```
cd apps/pipeline && npx vitest run
```

Prerequisite: a cache server must be running for forwarding tests to pass.

Tests cover:
- NodeTestWatcher emits fixes at the configured interval
- Fixes are stored in SQLite with `forwarded_at = NULL`
- `forwardBatch` posts to local cache
- `forwardBatch` falls back to `CACHE_URL`
- Forwarded records are marked
- Retry count increments on failure
- Pruning removes old records

### Platform Guide

The pipeline is activated when `BUILD_TARGET=capacitor` is set during the Astro build. It runs inside the Capacitor webview via the `PipelineInit` React component.

#### iOS Permissions

Required `Info.plist` entries:
- `UIBackgroundModes: location` — allows watchPosition to fire when backgrounded
- `NSLocationAlwaysAndWhenInUseUsageDescription` — user prompt for background location
- `NSLocationWhenInUseUsageDescription` — user prompt for foreground location

#### Android Permissions

Required `AndroidManifest.xml` entries:
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION`

### Configuration

Compile-time constants in `src/config.ts`:

| Constant          | Default | Description                       |
| ----------------- | ------- | --------------------------------- |
| `debounceMs`      | 5000    | Min ms between watcher callbacks |
| `batchSize`       | 10      | Max records per POST              |
| `maxRetries`      | 3       | Max retries before dropping       |
| `retentionDays`   | 30      | Days before pruning old records   |
| `localCacheAddress` | null  | Same-machine cache URL or null    |
