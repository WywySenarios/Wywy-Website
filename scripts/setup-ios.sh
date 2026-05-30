#!/bin/bash
set -e

echo "=== Installing Xcode Command Line Tools ==="
xcode-select --install 2>/dev/null || echo "Xcode CLT already installed"

echo "=== Installing CocoaPods ==="
brew install cocoapods

cd "$(dirname "${BASH_SOURCE[0]}")/../apps/capacitor-app"

echo "=== Installing npm dependencies ==="
npm install

echo "=== Adding iOS platform ==="
npx cap add ios
