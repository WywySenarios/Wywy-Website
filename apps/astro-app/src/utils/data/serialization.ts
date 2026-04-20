import { GeodeticCoordinate } from "../datatypes/geodetic";
import type { JSONValue } from "@/types/http";

type formatDatabaseValueParams =
  | { datatype: "int" | "integer" | "float" | "number"; value: number }
  | { datatype: "string" | "str" | "text"; value: string }
  | { datatype: "bool" | "boolean"; value: boolean }
  | { datatype: "date" | "time" | "timestamp"; value: Date }
  | { datatype: "enum"; value: string }
  | { datatype: "geodetic point"; value: GeodeticCoordinate };
/**
 * Formats a value so that it can be exported via JSON.
 * @param input A record with only the datatype and the value to format.
 */
export function formatDatabaseValue(
  input: formatDatabaseValueParams,
): JSONValue {
  switch (input.datatype) {
    case "date":
    case "time":
    case "timestamp":
      return `'${input.value.toISOString().slice(0, -1)}'`;
    case "geodetic point":
      return input.value.toString();
    // most datatypes do not need conversion
    default:
      return input.value;
  }
}
