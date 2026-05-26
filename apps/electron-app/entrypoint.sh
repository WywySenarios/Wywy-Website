#!/bin/bash

set -e

cd /app/apps/astro-app

npm install

# Ensure all content collection directories exist (glob loader requires base paths)
mkdir -p src/data/{projects,directives,schedules,wishlist,datasets}

BUILD_TARGET=electron npx astro build

cd /app/apps/electron-app

npm install

npx tsc

# Linux x86-64 + Windows x86-64
npx electron-builder --config electron-builder.yml --linux --win --x64

# Linux ARM64
npx electron-builder --config electron-builder.yml --linux --arm64
