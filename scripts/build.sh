#!/bin/bash
set -e
set -a

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Source environment variables from config
CONFIG_DIR="/etc/Wywy-Website-Control/config"
if [ -f "$CONFIG_DIR/.env" ]; then
  . "$CONFIG_DIR/.env"
fi
if [ -f "$CONFIG_DIR/website/.env" ]; then
  . "$CONFIG_DIR/website/.env"
fi

set +a

echo "=== Building Astro + Electron (macOS DMG) ==="
"$REPO_ROOT/apps/electron-app/entrypoint.sh" "$REPO_ROOT"

echo "=== Building Capacitor (iOS) ==="
cd "$REPO_ROOT/apps/capacitor-app"
npm install
npx cap sync

# Detect the Xcode scheme from the workspace (matches appName in capacitor.config.ts)
SCHEME=$(xcodebuild -workspace ios/App/App.xcworkspace -list -json | python3 -c "import sys, json; d = json.load(sys.stdin); print(d['workspace']['schemes'][0])" 2>/dev/null || true)
if [ -z "$SCHEME" ]; then
  echo "Error: Could not detect Xcode scheme. Is 'ios/App.xcworkspace' generated?" >&2
  exit 1
fi
npx cap build ios --scheme "$SCHEME"

echo "=== Done ==="
echo "macOS DMG:   $REPO_ROOT/apps/electron-app/release/"
echo "iOS archive: $REPO_ROOT/apps/capacitor-app/ios/"
