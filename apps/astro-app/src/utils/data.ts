import type { Datatype, TableInfo } from "@/types/data";
import {
  GeodeticCoordinate,
  GetCurrentGeodeticCoordinatePromise,
} from "./datatypes/geodetic";
import type { JSONValue } from "./http";

export function handleRecordOn(
  initialData: Record<string, any>,
  tableInfo: TableInfo,
  event_name: "start" | "split",
  printError: (msg: string) => unknown = (msg: string) => {},
  mode: "insert" | "purge" = "insert",
): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    let finalData = { ...initialData };
    let fetchTasks: Promise<any>[] = [];

    // update values that need to be recorded on start
    for (let columnSchema of tableInfo.schema) {
      if (columnSchema.record_on === event_name) {
        switch (mode) {
          case "purge":
            delete finalData[columnSchema.name];
            break;
          case "insert":
            switch (columnSchema.datatype) {
              case "timestamp":
                finalData[columnSchema.name] = new Date(Date.now());
                break;
              case "geodetic point":
                const currentTask = GetCurrentGeodeticCoordinatePromise(
                  navigator,
                  {
                    enableHighAccuracy: true,
                    timeout: 1000,
                  },
                )
                  .then((value: GeodeticCoordinate) => {
                    finalData[columnSchema.name] = value;
                  })
                  .catch((reason?: GeolocationPositionError) => {
                    finalData[columnSchema.name] = undefined;
                    if (reason)
                      printError(`Failed to fetch location: ${reason.message}`);
                  });
                fetchTasks.push(currentTask);
                break;
              default:
                throw `Column "${columnSchema.name}"'s datatype does not support record_on.`;
            }
            break;
        }
      }
    }

    let fetchTasksCompleted = Promise.allSettled(fetchTasks);
    fetchTasksCompleted.catch(() => {});
    fetchTasksCompleted.finally(() => {
      resolve(finalData);
    });
  });
}

export function getFallbackValue(datatype: "int" | "integer"): number;
export function getFallbackValue(datatype: "float" | "number"): number;
export function getFallbackValue(
  datatype: "string" | "str" | "text" | "enum",
): string;
export function getFallbackValue(datatype: "bool" | "boolean"): boolean;
export function getFallbackValue(
  datatype: "date" | "time" | "timestamp",
): string;
export function getFallbackValue(
  datatype: Datatype,
): number | string | boolean | Date | null | undefined;
export function getFallbackValue(
  datatype: Datatype,
): number | string | boolean | Date | null | undefined {
  switch (datatype) {
    case "int":
    case "integer":
    case "float":
    case "number":
      return 0;
    case "string":
    case "str":
    case "text":
    case "enum":
      return "";
    case "bool":
    case "boolean":
      return false;
    case "date":
      return "0001-01-01";
    case "time":
      return "01:00:00";
    case "timestamp":
      return new Date().toString();
    default:
      return null;
  }
}

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
