import { GeodeticCoordinateInputElement } from "@/components/data/input-element/geodetic-coordinate";
import { GeodeticCoordinate } from "@/utils/datatypes/geodetic";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function MyGeodeticCoordinate() {
  const [coord, setCoord] = useState<GeodeticCoordinate>(
    new GeodeticCoordinate(),
  );

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        setCoord(new GeodeticCoordinate(position.coords));
      },
      (error: GeolocationPositionError) => {
        toast(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      },
    );
  }, []);

  return (
    <div>
      <GeodeticCoordinateInputElement value={coord} onChange={setCoord} />
      <Card>
        <CardHeader>Your Location</CardHeader>
        <CardContent>
          <p>Your latitude is {coord.latitude} degrees.</p>
          <p>Your longitude is {coord.longitude} degrees.</p>
          <p>
            Your latitude and longitude have an uncertainty of {coord.accuracy}{" "}
            meters.
          </p>
          {coord.altitude != null ? (
            <p>Your altitude is {coord.altitude} meters above sea level.</p>
          ) : null}
          {coord.altitudeAccuracy ? (
            <p>
              Your altitude has an uncertainty of {coord.altitudeAccuracy}
              meters.
            </p>
          ) : null}
          {coord.heading || coord.heading == 0 ? (
            <p>Your heading is {coord.heading}.</p>
          ) : null}
          {coord.speed || coord.speed == 0 ? (
            <p>Your speed is {coord.speed}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
