import type { GeolocationWatcher } from "../geolocation/watcher";
import type { GeolocationFix } from "../geolocation/types";
import { GEOLOCATION_PIPELINE } from "../config";

export const NodeTestWatcher: GeolocationWatcher = {
  start(callback) {
    const intervalId = setInterval(() => {
      const fix: GeolocationFix = {
        latitude: 37.7749 + Math.random() * 0.01,
        longitude: -122.4194 + Math.random() * 0.01,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        speed: null,
        heading: null,
        timestamp: Date.now(),
      };
      callback(fix);
    }, GEOLOCATION_PIPELINE.debounceMs);

    return () => clearInterval(intervalId);
  },
};
