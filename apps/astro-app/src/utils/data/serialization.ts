import type { Datatype } from "@/types/data";
import { GeodeticCoordinate } from "../datatypes/geodetic";
import type { JSONValue } from "../http";

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

/**
 * Attempts to parse a database value, expecting the given datatype. Throws an error if unsuccessful.
 * @TODO integer verification.
 * @param value The value that needs to be parsed.
 * @param datatype @type {Datatype} The expected datatype of the value.
 * @returns @type {string | number | boolean | Date} The date returned is UTC.
 */
function parseDatabaseValue(
  value: JSONValue,
  datatype: "int" | "integer" | "float" | "number",
): number;
function parseDatabaseValue(
  value: string,
  datatype: "string" | "str" | "text",
): string;
function parseDatabaseValue(
  value: JSONValue,
  datatype: "bool" | "boolean",
): boolean;
function parseDatabaseValue(
  value: JSONValue,
  datatype: "date" | "time" | "timestamp",
): Date;
function parseDatabaseValue(value: JSONValue, datatype: "enum"): string;
function parseDatabaseValue(
  value: JSONValue,
  datatype: "geodetic point",
): string;
function parseDatabaseValue(
  value: JSONValue,
  datatype: Datatype,
): string | number | boolean | Date;
function parseDatabaseValue(
  value: JSONValue,
  datatype: Datatype,
): string | number | boolean | Date {
  switch (datatype) {
    case "string":
    case "str":
    case "text":
      if (typeof value != "string")
        throw `Datatype mistmatch. Expected string but received ${typeof value}.`;
      return value;
    case "int":
    case "integer":
    case "float":
    case "number":
      switch (typeof value) {
        case "number":
        case "bigint":
          return value;
        case "string":
          const result = parseInt(value);
          if (isNaN(result))
            throw `Failed to parse database value "${value}". Expected a number or number-like string.`;
          return result;
        default:
          throw `Datatype mismatch. Expected number or number-like string but received ${typeof value}.`;
      }
    case "bool":
    case "boolean":
      switch (typeof value) {
        case "boolean":
          return value;
        case "string":
          switch (value.toLowerCase()) {
            case "true":
              return true;
            case "false":
              return false;
            default:
              throw `Failed to parse database value "${value}". Expected boolean or boolean-like string.`;
          }
        default:
          throw `Datatype mismatch. Expected boolean or boolean-like string but received ${typeof value}.`;
      }
    // The database always stores UTC values.
    case "date":
    case "time":
    case "timestamp":
      switch (typeof value) {
        case "string":
          const result = new Date(value);
          if (isNaN(result.getDate()))
            throw `Failed to parse database value "${value}". Expected a ${datatype}-like string.`;
          return result;
        default:
          throw `Datatype mismatch. Expected a ${datatype}-like string but received ${typeof value}.`;
      }
    case "enum":
      return ""; // @TODO
    case "geodetic point":
      return ""; // @TODO
  }
}

export interface formOutput {
  data: Record<string, any>;
  tags?: String[];
  descriptors?: Record<string, any>;
}

export { parseDatabaseValue };
