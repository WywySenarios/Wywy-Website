#!/bin/bash
set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CAPACITOR_DIR="$REPO_ROOT/apps/capacitor-app"
ASTRO_DIR="$REPO_ROOT/apps/astro-app"
CONFIG_DIR="/etc/Wywy-Website-Control/config"

EXPECTED_FORMAT="Usage: $0 <dev | prod>"

if [ $# -lt 1 ]; then
  echo "$EXPECTED_FORMAT" >&2
  exit 1
fi

MODE="$1"
shift

case "$MODE" in
  dev|prod) ;;
  *)
    echo "Error: Invalid argument '$MODE'. Expected <dev | prod>"
    echo "$EXPECTED_FORMAT" >&2
    exit 1
    ;;
esac

# Source environment variables — same order as docker compose
set -a
[ -f "$CONFIG_DIR/.env" ]              && . "$CONFIG_DIR/.env"
[ -f "$CONFIG_DIR/website/.env" ]      && . "$CONFIG_DIR/website/.env"
if [ "$MODE" = "dev" ]; then
  [ -f "$CONFIG_DIR/.env.dev" ]        && . "$CONFIG_DIR/.env.dev"
  [ -f "$CONFIG_DIR/website/.env.dev" ] && . "$CONFIG_DIR/website/.env.dev"
fi
set +a

echo "=== Building Astro for Capacitor ($MODE) ==="
cd "$ASTRO_DIR"
BUILD_TARGET=capacitor npx astro build

echo "=== Syncing Capacitor ==="
cd "$CAPACITOR_DIR"
npm install
npx cap sync

if [ "$MODE" = "dev" ]; then
  echo "=== Running on iOS Simulator ==="
  npx cap run ios

  echo ""
  echo "=== Streaming app console logs (Ctrl+C to stop) ==="
  set +e
  xcrun simctl spawn booted log stream --predicate 'processImagePath CONTAINS "Wywy"' --level debug 2>&1
  set -e
else
  echo "=== Building iOS Archive (release) ==="
  SCHEME=$(xcodebuild -workspace ios/App/App.xcworkspace -list -json | \
    python3 -c "import sys, json; d = json.load(sys.stdin); print(d['workspace']['schemes'][0])" 2>/dev/null || true)
  if [ -z "$SCHEME" ]; then
    echo "Error: Could not detect Xcode scheme. Run 'npx cap add ios' first." >&2
    exit 1
  fi
  npx cap build ios --scheme "$SCHEME"
fi

echo "=== Done ($MODE) ==="
