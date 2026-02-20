import { Slider } from "@/components/ui/slider";
import { GeodeticCoordinate } from "@utils/datatypes/geodetic";
import { NumberBox } from "./number-box";
import { Button } from "@/components/ui/button";
import { LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
      <Card>
        <CardHeader>Latitude</CardHeader>
        <CardContent>
          <Slider
            value={[value.latitude]}
            onValueChange={(latitude: number[]) => {
              let newValue: GeodeticCoordinate = new GeodeticCoordinate(value);
              newValue.latitude = latitude[0];
              onChange(newValue);
            }}
            min={-90}
            max={90}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>Longitude</CardHeader>
        <CardContent>
          <Slider
            value={[value.longitude]}
            onValueChange={(longitude: number[]) => {
              let newValue: GeodeticCoordinate = new GeodeticCoordinate(value);
              newValue.longitude = longitude[0];
              onChange(newValue);
            }}
            min={-180}
            max={180}
          />
        </CardContent>
      </Card>
      {
        /* Latitude & longitude accuracy */
        value.accuracy ? (
          <Card>
            <CardHeader>Latitude and longitude accuracy</CardHeader>
            <CardContent>
              <NumberBox
                value={value.accuracy}
                onChange={(accuracy: number) => {
                  let newValue: GeodeticCoordinate = new GeodeticCoordinate(
                    value,
                  );
                  newValue.accuracy = accuracy;
                  onChange(newValue);
                }}
              />
            </CardContent>
          </Card>
        ) : null
      }
      {
        /* Altitude */
        value.altitude || value.altitude == 0 ? (
          <Card>
            <CardHeader>Altitude</CardHeader>
            <CardContent>
              <NumberBox
                value={value.altitude}
                onChange={(altitude: number) => {
                  let newValue: GeodeticCoordinate = new GeodeticCoordinate(
                    value,
                  );
                  newValue.altitude = altitude;
                  onChange(newValue);
                }}
              />
            </CardContent>
          </Card>
        ) : null
      }
      {
        /* Altitude accuracy */
        value.altitudeAccuracy ? (
          <Card>
            <CardHeader>Altitude Accuracy</CardHeader>
            <CardContent>
              <NumberBox
                value={value.altitudeAccuracy}
                onChange={(altitudeAccuracy: number) => {
                  let newValue: GeodeticCoordinate = new GeodeticCoordinate(
                    value,
                  );
                  newValue.altitudeAccuracy = altitudeAccuracy;
                  onChange(newValue);
                }}
              />
            </CardContent>
          </Card>
        ) : null
      }
      {
        /* Heading */
        value.heading || value.heading == 0 ? (
          <Card>
            <CardHeader>Heading</CardHeader>
            <CardContent>
              <Slider
                value={[value.heading]}
                onValueChange={(heading: number[]) => {
                  let newValue: GeodeticCoordinate = new GeodeticCoordinate(
                    value,
                  );
                  newValue.heading = heading[0];
                  onChange(newValue);
                }}
                min={0}
                max={360}
              />
            </CardContent>
          </Card>
        ) : null
      }
      {
        /* Speed */
        value.speed || value.speed == 0 ? (
          <Card>
            <CardHeader>Speed</CardHeader>
            <CardContent>
              <NumberBox
                value={value.speed}
                onChange={(speed: number) => {
                  let newValue: GeodeticCoordinate = new GeodeticCoordinate(
                    value,
                  );
                  newValue.speed = speed;
                  onChange(newValue);
                }}
              />
            </CardContent>
          </Card>
        ) : null
      }
      {/* Set to current location button */}
      <Button
        className="w-full"
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
