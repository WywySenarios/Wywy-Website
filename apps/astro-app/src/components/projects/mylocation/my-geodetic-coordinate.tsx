import { GeodeticCoordinateInputElement } from "@/components/data/input-element/geodetic-coordinate";
import { GeodeticCoordinate } from "@/utils/datatypes/geodetic";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
        console.log(error.message);
        toast(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      },
    );
  }, []);

  <GeodeticCoordinateInputElement value={coord} onChange={setCoord} />;
}
