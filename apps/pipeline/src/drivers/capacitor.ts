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
    accuracy: accuracy != null ? accuracy : null,
    altitude: altitude != null && altitude !== 0 ? altitude : null,
    altitudeAccuracy: altitudeAccuracy != null && altitudeAccuracy >= 0 ? altitudeAccuracy : null,
    speed: speed != null && speed >= 0 ? speed : null,
    heading: heading != null && heading >= 0 ? heading : null,
    timestamp: Math.round(pos.timestamp),
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
