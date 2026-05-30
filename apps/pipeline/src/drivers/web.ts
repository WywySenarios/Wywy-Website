import type { GeolocationWatcher } from "../geolocation/watcher";

/**
 * WebGeolocationWatcher would wrap navigator.geolocation.watchPosition().
 * NOT IMPLEMENTED — this is a future extension point for browser/Electron builds.
 *
 * Interface:
 *   start(callback) => registers navigator.geolocation.watchPosition(),
 *   maps GeolocationPosition.coords → GeolocationFix,
 *   returns cleanup that calls clearWatch(id).
 *
 * Gating: BUILD_TARGET=web or BUILD_TARGET=electron.
 */
// export const WebGeolocationWatcher: GeolocationWatcher = { start(callback) { ... } };
