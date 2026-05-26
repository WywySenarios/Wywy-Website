#!/bin/bash
set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Building Astro + Electron (macOS DMG) ==="
"$REPO_ROOT/apps/electron-app/entrypoint.sh" "$REPO_ROOT"

echo "=== Building Capacitor (iOS) ==="
cd "$REPO_ROOT/apps/capacitor-app"
npm install
npx cap sync
npx cap build ios

echo "=== Done ==="
echo "macOS DMG:   $REPO_ROOT/apps/electron-app/release/"
echo "iOS archive: $REPO_ROOT/apps/capacitor-app/ios/"
