import type { GeodeticCoordinates } from "@/types/data";

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

  constructor(primaryItem?: GeodeticCoordinate | GeodeticCoordinates) {
    if (primaryItem != undefined) {
      this.latitude = primaryItem.latitude;
      this.longitude = primaryItem.longitude;
      this.altitude = primaryItem.altitude;
      this.accuracy = primaryItem.accuracy;
      this.altitudeAccuracy = primaryItem.altitudeAccuracy;
      this.heading = primaryItem.heading;
      this.speed = primaryItem.speed;
    } else {
      this.latitude = NaN;
      this.longitude = NaN;
    }
  }
}
