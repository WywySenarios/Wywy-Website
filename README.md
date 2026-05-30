# iOS Build

Builds the Astro site into a native iOS app via Capacitor.

## Prerequisites

- Node.js 22+ (LTS)
- Xcode (Mac App Store)
- Xcode CLT
- CocoaPods
- Apple Developer account (free for device testing, $99/yr for App Store)

```bash
./scripts/setup-ios.sh
```

## Build

```bash
./scripts/build.sh
```

This runs the platform-aware Electron entrypoint (builds Astro static output, packages macOS DMG), then builds the iOS app via Capacitor.

### Output

- macOS DMG: `apps/electron-app/release/`
- iOS archive: `apps/capacitor-app/ios/`
