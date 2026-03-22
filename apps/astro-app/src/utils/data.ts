import { z, ZodNumber, type ZodTypeAny } from "zod";
import type { DataColumn, Datatype, TableInfo } from "@/types/data";
import {
  GeodeticCoordinate,
  GetCurrentGeodeticCoordinatePromise,
} from "./datatypes/geodetic";
import type { JSONValue } from "./http";
import type { UseFormReturn } from "react-hook-form";

/**
 * Produces a ZodType with restrictions as defined by the given column schema.
 * @param columnInfo The schema of the respective column.
 * @returns The ZodType, with restrictions already baked in.
 */
export function getZodType(columnInfo: DataColumn): ZodTypeAny {
  let output: ZodTypeAny;

  switch (columnInfo.datatype) {
    case "int":
    case "integer":
      output = z.number().int();
      if ("min" in columnInfo && columnInfo.min !== undefined)
        output = (output as ZodNumber).max(columnInfo.min);
      if ("max" in columnInfo && columnInfo.max !== undefined)
        output = (output as ZodNumber).max(columnInfo.max);
      break;
    case "float":
    case "number":
      output = z.number();
      break;
    case "str":
    case "string":
    case "text":
      output = z.string();
      break;
    case "bool":
    case "boolean":
      output = z.coerce.boolean();
      break;
    // THIS IS BY NO MEANS ROBUST
    case "time":
      output = z
        .string()
        .regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?Z?$/, {
          message: "Invalid ISO time format",
        });
      break;
    // THIS IS BY NO MEANS ROBUST
    case "date":
      output = z.string().regex(/^[0-9]{1,4}-[0-9]{2}-[0-9]{2}$/, {
        message: "Invalid Date format",
      });
      break;
    // THIS IS BY NO MEANS ROBUST
    case "timestamp":
      output = z.coerce.date();
      break;
    case "enum":
      output = z.enum(columnInfo.values);
      break;
    case "geodetic point":
      output = z.custom<GeodeticCoordinate>(
        (val) => {
          if (typeof val !== "object" || val === null) return false;

          const v = val as GeodeticCoordinate;

          if (typeof v.latitude !== "number" || !Number.isFinite(v.latitude))
            return false;
          if (typeof v.longitude !== "number" || !Number.isFinite(v.longitude))
            return false;

          if (v.latitude < -90 || v.latitude > 90) return false;

          if (v.longitude < -180 || v.longitude > 180) return false;

          // Optional numeric fields (must be number or null if present)
          const optionalNumberOrNull = (n: unknown) =>
            n === null ||
            n === undefined ||
            (typeof n === "number" && Number.isFinite(n));

          if (!optionalNumberOrNull(v.altitude)) return false;
          if (!optionalNumberOrNull(v.accuracy)) return false;
          if (!optionalNumberOrNull(v.altitudeAccuracy)) return false;
          if (!optionalNumberOrNull(v.heading)) return false;
          if (!optionalNumberOrNull(v.speed)) return false;

          return true;
        },
        {
          message: "Invalid geodetic point",
        },
      );
      break;
  }

  // traits that might apply to any column
  // optional
  output = output.optional();

  return output;
}

/**
 * Constructs a zod schema for a dataset from a columns schema.
 * @param datasetSchema The schema of the dataset to pull.
 * @param tagging Whether or not the given item table has a related tagging table (i.e. needs primary_tag column)
 * @returns The zod schema forthe dataset to pull.
 */
export function getZodDatasetType(
  datasetSchema: Array<DataColumn>,
  tagging: boolean = false,
) {
  const rowSchema: Array<ZodTypeAny> = [];

  // ID column
  rowSchema.push(z.number().int());

  // primary_tag column
  if (tagging) rowSchema.push(z.string().nonempty());

  for (let columnSchema of datasetSchema) {
    switch (columnSchema.datatype) {
      case "geodetic point": // geodetic point
        rowSchema.push(
          z
            .string()
            .nullable()
            .refine((arg: string | null) => {
              if (arg === null) return true;
              const matches = arg.match(
                /^POINT ?\((-?[0-9]+(\.[0-9]+)?) (-?[0-9]+(\.[0-9]+)?)\)$/,
              );

              if (!matches) return false;

              let longitude = parseFloat(matches[1]);
              let latitude = parseFloat(matches[2]);
              if (longitude < -180 || longitude > 180) return false;
              if (latitude < -90 || latitude > 90) return false;
            }),
        );
        // latlong accuracy
        rowSchema.push(z.number().positive().nullable());
        // altitude
        rowSchema.push(z.number().nullable());
        // altitude accuracy
        rowSchema.push(z.number().positive().nullable());

        break;
      default:
        rowSchema.push(getZodType(columnSchema));
        break;
    }

    if (columnSchema.comments) {
      rowSchema.push(z.string().optional());
    }
  }

  return z
    .object({
      columns: z.array(z.string().nonempty()).length(rowSchema.length),
      data: z.array(z.tuple(rowSchema as [ZodTypeAny, ...ZodTypeAny[]])),
    })
    .strict();
}

type form = UseFormReturn<{
  descriptors: {
    [x: string]: {
      [x: string]: any;
    }[];
  };
  data: {
    [x: string]: any;
  };
  tags?: unknown;
}>;

export function handleRecordOn(
  initialData: Record<string, any>,
  tableInfo: TableInfo,
  event_name: "start" | "split",
  form: form,
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
      return "0001-01-01T01:00:00";
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

/**
 * Serializes data bound for a database.
 * @param values The values that need to be serialized.
 * @param schema The schema that relates to the given values.
 * @returns An object filled with the formatted values, or a string with a corresponding error message if the schema does not match the values.
 */
function serializeDataObject(
  values: Record<string, any>,
  schema: Array<DataColumn>,
): Record<string, any> {
  let formattedValues: Record<string, any> = {};

  for (let column_schema of schema) {
    // check the comments first
    if (column_schema.comments) {
      formattedValues[`${column_schema.name}_comments`] =
        values[`${column_schema.name}_comments`] ?? "''";
    }

    // check if the user really wanted to submit that or not
    if (values[column_schema.name] == null) {
      continue;
    }

    // single-quote strings, dates, times, and timestamps
    switch (column_schema.datatype) {
      case "string":
      case "str":
      case "text":
        formattedValues[column_schema.name] = `'${values[column_schema.name]}'`;
        break;
      case "date":
      case "time":
      case "timestamp":
        formattedValues[column_schema.name] =
          `'${typeof values[column_schema.name] == "string" ? values[column_schema.name] : values[column_schema.name].toISOString()}'`.replace(
            "Z",
            "",
          );
        break;
      default:
        formattedValues[column_schema.name] = values[column_schema.name];
        break;
    }
  }

  return formattedValues;
}

/**
 * Attempts to serialize database-bound data.
 * @param data The data to serialize.
 * @param strict Whether or not to throw out when a schema is incomplete (partially cooperative)
 * @param tableInfo The table schema of the data.
 */
export function serializeFormOutput(
  data: formOutput,
  strict: boolean,
  tableInfo: TableInfo,
): formOutput {
  let serializedValues: formOutput = {
    data: serializeDataObject(data.data, tableInfo.schema),
  };

  if ("tags" in data && data["tags"]) {
    if ("primary_tag" in data.data) {
      throw "Primary tag already set? Contact dev for a fix.";
    }

    data.data["primary_tag"] = data.tags.shift();

    if (strict && !data.data["primary_tag"]) {
      throw "Primary tag cannot be empty.";
    }

    serializedValues["tags"] = data.tags;
  }

  if ("descriptors" in data && data.descriptors != undefined) {
    serializedValues["descriptors"] = {};

    // format every descriptor type.
    for (const descriptor_schema of tableInfo.descriptors)
      serializedValues.descriptors[descriptor_schema.name] = data.descriptors[
        descriptor_schema.name
      ].map((value: { [x: string]: any }) =>
        serializeDataObject(value, descriptor_schema.schema),
      );
  }

  return serializedValues;
}

// export function deserializedDatabaseRecord(data: Record<string, unknown>) {}

/**
 * Checks if tagging is enabled on the given table.
 * @param tableInfo The schema of the table to check.
 */
export function isTaggingEnabled(tableInfo: TableInfo): boolean {
  return tableInfo.tagging;
}

export { parseDatabaseValue };
