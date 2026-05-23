import { GeodeticCoordinate } from "@utils/datatypes/geodetic";
import { Button } from "@/components/ui/button";
import { LocateFixed } from "lucide-react";
import { toast } from "sonner";

// everything defaults to true
export interface GeodeticCoordinateFields {
  latitude?: true;
  longitude?: true;
  accuracy?: boolean;
  altitude?: boolean;
  altitudeAccuracy?: boolean;
  heading?: boolean;
  speed?: boolean;
}

/**
 * An input element for a geographical coordinate. Assumes that there is a valid toaster to use. Only allows the user to refresh with their current location.
 * @param value The controlled state of the value of the geographical coordinate. Must be used in tandem with onChange
 * @param onChange Event handler when the value of the geographical coordinate changes.
 * @returns
 */
export function GeodeticPointMinimalInputElement({
  value,
  onChange,
}: {
  value: GeodeticCoordinate;
  onChange: (val: GeodeticCoordinate) => void;
}) {
  return (
    <div>
      {value ? (
        <div>
          <p>{`(${value.latitude}, ${value.longitude}${value.altitude ? `, ${value.altitude}${value.altitudeAccuracy ? ` ± ${value.altitudeAccuracy}` : ""}` : ""})${value.accuracy ? ` ± ${value.accuracy}` : ""}`}</p>
          {value.heading ? <p>Heading: {value.heading}</p> : null}
          {value.speed != null ? <p>Speed: {value.speed}</p> : null}
        </div>
      ) : (
        <p>No data.</p>
      )}
      {/* Set to current location button */}
      <Button
        type="button"
        className="w-full"
        onClick={() => {
          navigator.geolocation.getCurrentPosition(
            (position: GeolocationPosition) => {
              onChange(new GeodeticCoordinate(position.coords));
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
        }}
      >
        <LocateFixed />
      </Button>
    </div>
  );
}
