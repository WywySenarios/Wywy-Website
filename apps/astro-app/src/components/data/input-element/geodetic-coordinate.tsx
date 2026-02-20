import { Slider } from "@/components/ui/slider";
import { GeodeticCoordinate } from "@utils/datatypes/geodetic";
import { NumberBox } from "./number-box";
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
 * An input element for a geographical coordinate. Assumes that there is a valid toaster to use.
 * @param value The controlled state of the value of the geographical coordinate. Must be used in tandem with onChange
 * @param onChange Event handler when the value of the geographical coordinate changes.
 * @param fields The fields that are relevant to the user. The relevant disabled fields will not necessarily explicitly be set to null.
 * @returns
 */
export function GeodeticCoordinateInputElement({
  value,
  onChange,
  fields = {},
}: {
  value: GeodeticCoordinate;
  onChange: (val: GeodeticCoordinate) => void;
  fields?: GeodeticCoordinateFields;
}) {
  return (
    <div>
      {/* latitude & longitude */}
      <Slider
        value={[value.latitude]}
        onValueCommit={(latitude: number[]) => {
          let newValue: GeodeticCoordinate = new GeodeticCoordinate(value);
          newValue.latitude = latitude[0];
          onChange(newValue);
        }}
      />
      <Slider
        value={[value.longitude]}
        onValueCommit={(longitude: number[]) => {
          let newValue: GeodeticCoordinate = new GeodeticCoordinate(value);
          newValue.longitude = longitude[0];
          onChange(newValue);
        }}
      />
      {
        /* Latitude & longitude accuracy */
        value.accuracy != null ? (
          <NumberBox
            value={value.accuracy}
            onChange={(accuracy: number) => {
              let newValue: GeodeticCoordinate = new GeodeticCoordinate(value);
              newValue.accuracy = accuracy;
              onChange(newValue);
            }}
          />
        ) : null
      }
      {
        /* Altitude */
        value.altitude != null ? (
          <Slider
            value={[value.altitude]}
            onValueCommit={(altitude: number[]) => {
              let newValue: GeodeticCoordinate = new GeodeticCoordinate(value);
              newValue.altitude = altitude[0];
              onChange(newValue);
            }}
          />
        ) : null
      }
      {
        /* Altitude accuracy */
        value.altitudeAccuracy != null ? (
          <NumberBox
            value={value.altitudeAccuracy}
            onChange={(altitudeAccuracy: number) => {
              let newValue: GeodeticCoordinate = new GeodeticCoordinate(value);
              newValue.altitudeAccuracy = altitudeAccuracy;
              onChange(newValue);
            }}
          />
        ) : null
      }
      {
        /* Heading */
        value.heading != null ? (
          <Slider
            value={[value.heading]}
            onValueCommit={(heading: number[]) => {
              let newValue: GeodeticCoordinate = new GeodeticCoordinate(value);
              newValue.heading = heading[0];
              onChange(newValue);
            }}
          />
        ) : null
      }
      {
        /* Speed */
        value.speed != null ? (
          <NumberBox
            value={value.speed}
            onChange={(speed: number) => {
              let newValue: GeodeticCoordinate = new GeodeticCoordinate(value);
              newValue.speed = speed;
              onChange(newValue);
            }}
          />
        ) : null
      }
      {/* Set to current location button */}
      <Button
        onClick={(event) => {
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
