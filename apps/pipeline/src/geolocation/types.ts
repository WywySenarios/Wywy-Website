export interface GeolocationFix {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  speed: number | null;
  heading: number | null;
  /** Unix timestamp in milliseconds for when the fix was recorded */
  timestamp: number;
}
