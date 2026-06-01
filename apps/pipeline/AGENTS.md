# AGENTS.md — Pipeline App

## How to test

```bash
# Unit tests (vitest)
cd apps/pipeline && npx vitest run

# Node test driver (simulates geolocation without a device)
cd apps/pipeline && npx tsx src/test-driver.ts

# Full E2E simulator (builds iOS app, installs to simulator, injects GPS, verifies cache)
cd /usr/local/Wywy-Website/Wywy-Website && ./scripts/test-pipeline-simulator.sh

# Via Docker (control repo)
/etc/Wywy-Website-Control/run.sh website up test
```

## Environment

The pipeline needs `CACHE_URL` at build time (for the Capacitor WebView) and at runtime (for Node scripts). Source it from the control config:

```bash
set -a
[ -f /etc/Wywy-Website-Control/config/.env ]          && . /etc/Wywy-Website-Control/config/.env
[ -f /etc/Wywy-Website-Control/config/.env.dev ]      && . /etc/Wywy-Website-Control/config/.env.dev
[ -f /etc/Wywy-Website-Control/config/website/.env ]  && . /etc/Wywy-Website-Control/config/website/.env
[ -f /etc/Wywy-Website-Control/config/website/.env.dev ] && . /etc/Wywy-Website-Control/config/website/.env.dev
set +a
```

For local dev without the control repo, set `CACHE_URL=http://localhost:8000` and run a cache server (see `Wywy-Website-Cache` repo).

## Architecture

The pipeline watches device geolocation, stores fixes in a local SQLite database, and forwards batches to `CACHE_URL`. It activates only when `BUILD_TARGET=capacitor` is set during the Astro build, running inside the Capacitor WebView via the `PipelineInit` React component.

- Entry point: `src/index.ts` (`initPipeline`)
- Env resolution: `src/cache.ts` (`cacheUrlFromEnv`) — checks `process.env.CACHE_URL` (Node) then `import.meta.env.PUBLIC_CACHE_URL || CACHE_URL` (browser)
- Config: `src/config.ts`
- DB adapter: `src/db/adapter.ts`
- Node driver: `src/drivers/node.ts`
- Capacitor driver: `src/drivers/capacitor.ts`
