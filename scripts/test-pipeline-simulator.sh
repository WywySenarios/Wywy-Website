#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CACHE_REPO="${CACHE_REPO:-/usr/local/Wywy-Website/Wywy-Website-Cache}"
CONTROL_DIR="${CONTROL_DIR:-/etc/Wywy-Website-Control}"
CONFIG_DIR="$CONTROL_DIR/config"

PASS=true

echo "=================================================="
echo "  Pipeline iOS Simulator E2E Test"
echo "=================================================="

# ── Prerequisites ──────────────────────────────────────
command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker required"; exit 1; }
command -v xcrun   >/dev/null 2>&1 || { echo "ERROR: Xcode CLI required"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "ERROR: python3 required"; exit 1; }

# ── Source environment variables — same order as docker-compose.test.yml
set -a
[ -f "$CONFIG_DIR/.env" ]              && . "$CONFIG_DIR/.env"
[ -f "$CONFIG_DIR/.env.dev" ]          && . "$CONFIG_DIR/.env.dev"
[ -f "$CONFIG_DIR/website/.env" ]      && . "$CONFIG_DIR/website/.env"
[ -f "$CONFIG_DIR/website/.env.dev" ]  && . "$CONFIG_DIR/website/.env.dev"
set +a

# Fallback if not set by env files (local dev / CI without control repo)
: "${CACHE_URL:=http://localhost:8000}"

if [ ! -d "$CACHE_REPO" ]; then
  echo "Cloning Wywy-Website-Cache to $CACHE_REPO ..."
  git clone https://github.com/WywySenarios/Wywy-Website-Cache.git "$CACHE_REPO"
fi

# ── Config merge ───────────────────────────────────────
TEMP_CONFIG=$(mktemp /tmp/cache-config-XXXXXX.yml)
trap 'rm -f "$TEMP_CONFIG"; docker compose -f "$CACHE_REPO/docker/docker-compose.base.yml" down 2>/dev/null || true' EXIT

python3 -c "
import yaml, sys
with open('$CONFIG_DIR/config.yml') as f:
    config = yaml.safe_load(f)
with open('$REPO_ROOT/scripts/test/geolocation-schema.yml') as f:
    extra = yaml.safe_load(f)
config.setdefault('data', []).extend(extra)
with open('$TEMP_CONFIG', 'w') as f:
    yaml.dump(config, f, default_flow_style=False)
"
echo "1/6 Merged geolocation schema into cache config."

# ── Start cache stack ──────────────────────────────────
export USER_ID="${USER_ID:-25230}"
export DATABASE_PASSWORD="${DATABASE_PASSWORD:-password}"
export DATABASE_USERNAME="${DATABASE_USERNAME:-postgres}"
export DATABASE_PORT="${DATABASE_PORT:-5433}"
export DATA_DIR="${DATA_DIR:-/var/lib/Wywy-Website}"
export SECRETS_DIR="${SECRETS_DIR:-$CONTROL_DIR/secrets}"
export UNIVERSAL_CONFIG_DIR="$CONFIG_DIR"

mkdir -p /var/log/Wywy-Website/cache /var/lib/Wywy-Website/cache "$SECRETS_DIR"
[ -f "$SECRETS_DIR/admin.txt" ] || echo "admin" > "$SECRETS_DIR/admin.txt"

echo "2/6 Starting cache (PostgreSQL + sync)..."
docker compose -f "$CACHE_REPO/docker/docker-compose.base.yml" up -d --wait --wait-timeout 120

echo "      Waiting for sync container..."
for i in $(seq 1 30); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" $CACHE_URL/cache/csrf 2>/dev/null || true)
  if [ "$STATUS" = "200" ]; then
    echo "      Cache ready at $CACHE_URL"
    break
  fi
  sleep 2
done

# ── Build Astro for Capacitor ─────────────────────────
echo "3/6 Building Astro for Capacitor..."
cd "$REPO_ROOT/apps/astro-app"
CACHE_URL=$CACHE_URL BUILD_TARGET=capacitor npx astro build 2>&1 | tail -5

# ── Sync and launch simulator ─────────────────────────
echo "4/6 Syncing Capacitor..."
cd "$REPO_ROOT/apps/capacitor-app"
npx cap sync 2>&1 | tail -3

echo "5/6 Launching iOS Simulator..."
DEVICE=$(xcrun simctl list devices --json 2>/dev/null | \
  python3 -c "
import sys, json
d = json.load(sys.stdin)
for key in sorted(d.get('devices', {}).keys(), reverse=True):
    for dev in d['devices'][key]:
        if dev.get('state') == 'Booted':
            print(dev['udid'])
            sys.exit(0)
" 2>/dev/null || true)

if [ -z "$DEVICE" ]; then
  echo "      Creating booted simulator device..."
  DEVICE=$(xcrun simctl create PipelineTestDevice iPhone-16-Pro 2>/dev/null || true)
  if [ -z "$DEVICE" ]; then
    echo "ERROR: Could not create device" >&2; exit 1
  fi
  xcrun simctl boot "$DEVICE"
  sleep 15
fi

echo "      Installing and launching app..."
# Install and launch directly (more reliable than `npx cap run ios`)
cd "$REPO_ROOT/apps/capacitor-app/ios/App"
xcodebuild -quiet -scheme App -destination "id=$DEVICE" -derivedDataPath build 2>&1 | tail -3
xcrun simctl install "$DEVICE" "$(find build/Build/Products -name '*.app' -type d | head -1)"
xcrun simctl launch "$DEVICE" com.wywy.website 2>&1
sleep 8

# ── Inject GPS and verify ─────────────────────────────
echo "6/6 Injecting GPS fixes..."
for i in $(seq 1 3); do
  echo "      Fix $i: 37.7749,-122.4194"
  xcrun simctl location "$DEVICE" set 37.7749,-122.4194
  sleep 6
done

echo "      Waiting for forward to cache..."
sleep 8

CACHED=$(curl -s "$CACHE_URL/cache/geolocation/geolocation_fixes" 2>/dev/null || echo "{}")
python3 -c "
import sys, json
data = json.loads('$CACHED')
if data and isinstance(data, dict) and len(data) > 0:
    print(f'      PASS: Cache received {len(data)} fix(es)')
    sys.exit(0)
else:
    print('      WARN: Cache empty — forwarding may not have completed')
    print('      Check logs: xcrun simctl spawn $DEVICE log stream --predicate \"subsystem == com.wywy.website\"')
    sys.exit(1)
" && PASS=true || PASS=false

# ── Done ───────────────────────────────────────────────
if [ "$PASS" = true ]; then
  echo ""
  echo "=================================================="
  echo "  TEST PASSED"
  echo "=================================================="
  exit 0
else
  echo ""
  echo "=================================================="
  echo "  TEST COMPLETED — data not in cache"
  echo "=================================================="
  echo ""
  echo "Troubleshooting:"
  echo "  1. Did the app request location permission? Reset:"
  echo "     xcrun simctl privacy $DEVICE reset location com.wywy.website"
  echo "  2. View live logs:"
  echo "     xcrun simctl spawn $DEVICE log stream --predicate 'subsystem == com.wywy.website'"
  echo "  3. Run directly (foreground):"
  echo "     BUILD_TARGET=capacitor CACHE_URL=http://localhost:8000 npx astro build"
  echo "     npx cap sync && npx cap run ios"
  exit 1
fi
