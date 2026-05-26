#!/bin/bash

set -e

PROJECT_DIR="${1:-/app}"

cd "$PROJECT_DIR/apps/astro-app"

npm install

# Ensure all content collection directories exist (glob loader requires base paths)
mkdir -p src/data/{projects,directives,schedules,wishlist,datasets}

BUILD_TARGET=electron npx astro build

cd "$PROJECT_DIR/apps/electron-app"

npm install

npx tsc

OS="$(uname -s)"
if [ "$OS" = "Darwin" ]; then
    npx electron-builder --config electron-builder.yml --mac
else
    npx electron-builder --config electron-builder.yml --linux --win --x64
    npx electron-builder --config electron-builder.yml --linux --arm64
fi
