import type { GeodeticCoordinates } from "@/types/data";

export function GetCurrentGeodeticCoordinatePromise(
  navigator: Navigator,
  options: PositionOptions = {},
): Promise<GeodeticCoordinate> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator))
      reject(new Error("Geolocation not supported."));

    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        resolve(new GeodeticCoordinate(position.coords));
      },
      reject,
      options,
    );
  });
}

/**
 * A geodetic coordinate.
 */
export class GeodeticCoordinate {
  public latitude: number;
  public longitude: number;
  public altitude: number | null = null;
  public accuracy: number | null = null;
  public altitudeAccuracy: number | null = null;
  public heading: number | null = null;
  public speed: number | null = null;

  /**
   * Initializes a GeodeticCoordinate with NaN latitude and longitude.
   */
  constructor();
  /**
   * Initializes a GeodeticCoordinate with the data from a GeolocationCoordinates object.
   * @param geolocationCoordinate The geolocation coordinate to copy.
   */
  constructor(geolocationCoordinate: GeodeticCoordinates);
  /**
   * Initializes a GeodeticCoordinate by copying the given GeodeticCoordinate.
   * @param geodeticCoordinate The GeodeticCoordinate to duplicate.
   */
  constructor(geodeticCoordinate: GeodeticCoordinate);
  /**
   * Initializes a GeodeticCoordinate given PostGIS point WKT and optionally accuracies.
   * @param wkt A PostGIS point WKT to copy.
   * @param latlongAccuracy Optional accuracy.
   * @param altitudeAccuracy Optional altitude accuracy.
   */
  constructor(
    wkt: string,
    latlongAccuracy: number | null,
    altitudeAccuracy: number | null,
  );

  constructor(
    primaryItem?: GeodeticCoordinate | GeodeticCoordinates | string,
    latlongAccuracy: number | null = null,
    altitudeAccuracy: number | null = null,
  ) {
    switch (typeof primaryItem) {
      case "string":
        const matches = primaryItem.match(
          /^POINT(?: Z)? \(\s*([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)(?:\s+([-+]?\d*\.?\d+))?\s*\)$/,
        );

        if (!matches) throw "Invalid GeodeticCoordinate WKT.";

        this.longitude = parseFloat(matches[1]);
        this.latitude = parseFloat(matches[2]);
        this.altitude =
          matches[3] !== undefined ? parseFloat(matches[3]) : null;

        if (latlongAccuracy !== null) this.accuracy = latlongAccuracy;
        if (altitudeAccuracy !== null) this.altitudeAccuracy = altitudeAccuracy;

        break;
      case "object":
        this.latitude = primaryItem.latitude;
        this.longitude = primaryItem.longitude;
        this.altitude = primaryItem.altitude;
        this.accuracy = primaryItem.accuracy;
        this.altitudeAccuracy = primaryItem.altitudeAccuracy;
        this.heading = primaryItem.heading;
        this.speed = primaryItem.speed;
        break;
      default:
        throw "Invalid GeodeticCoordinate.";
        break;
    }
  }

  // JSON.stringify serializtion. POINT Z? (LONG, LAT, ALTITUDE?)
  toJSON(): string {
    if (isNaN(this.latitude) || isNaN(this.longitude))
      throw `Cannot serialize invalid Geodetic Point.`;

    if (this.altitude === null) {
      return `POINT (${this.longitude} ${this.latitude})`;
    } else {
      return `POINT Z (${this.longitude} ${this.latitude} ${this.altitude})`;
    }
  }
}
