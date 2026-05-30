import type { GeolocationWatcher } from "../geolocation/watcher";
import type { GeolocationFix } from "../geolocation/types";
import { Geolocation, type Position } from "@capacitor/geolocation";

function mapPosition(pos: Position): GeolocationFix {
  const {
    latitude,
    longitude,
    accuracy,
    altitude,
    altitudeAccuracy,
    speed,
    heading,
  } = pos.coords;
  return {
    latitude,
    longitude,
    accuracy: accuracy ?? null,
    altitude: altitude ?? null,
    altitudeAccuracy: altitudeAccuracy ?? null,
    speed: speed ?? null,
    heading: heading ?? null,
    timestamp: pos.timestamp,
  };
}

export const CapacitorGeolocationWatcher: GeolocationWatcher = {
  start(callback) {
    let callbackId: string | undefined;

    Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 10000 },
      (pos, err) => {
        if (err) {
          console.error("[pipeline] Geolocation error:", err);
          return;
        }
        if (pos) callback(mapPosition(pos));
      },
    ).then((id) => {
      callbackId = id;
    });

    return () => {
      if (callbackId) {
        Geolocation.clearWatch({ id: callbackId }).catch(() => {});
      }
    };
  },
};
