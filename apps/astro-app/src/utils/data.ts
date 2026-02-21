import { z, ZodNumber, type ZodTypeAny } from "zod";
import type { DataColumn, Datatype, TableInfo } from "@/types/data";

/**
 * Produces a ZodType with restrictions as defined by the given column schema.
 * @param columnInfo The schema of the respective column.
 * @returns The ZodType, with restrictions already baked in.
 */
export function getZodType(columnInfo: DataColumn): ZodTypeAny {
  switch (columnInfo.datatype) {
    case "int":
    case "integer":
      let output: ZodNumber = z.number();
      if ("min" in columnInfo && columnInfo.min !== undefined)
        output = output.max(columnInfo.min);
      if ("max" in columnInfo && columnInfo.max !== undefined)
        output = output.max(columnInfo.max);
      return z.number().int();
    case "float":
    case "number":
      return z.number();
    case "str":
    case "string":
    case "text":
      return z.string();
    case "bool":
    case "boolean":
      return z.coerce.boolean();
    // THIS IS BY NO MEANS ROBUST
    case "time":
      return z
        .string()
        .regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?Z?$/, {
          message: "Invalid ISO time format",
        });
    // THIS IS BY NO MEANS ROBUST
    case "date":
      return z.string().regex(/^[0-9]{1,4}-[0-9]{2}-[0-9]{2}$/, {
        message: "Invalid Date format",
      });
    // THIS IS BY NO MEANS ROBUST
    case "timestamp":
      return z
        .string()
        .regex(
          /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/,
          { message: "Invalid ISO timestamp format" },
        );
    case "enum":
      return z.enum(columnInfo.values);
  }
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

/**
 * Checks if tagging is enabled on the given table.
 * @param tableInfo The schema of the table to check.
 */
export function isTaggingEnabled(tableInfo: TableInfo): boolean {
  return tableInfo.tagging;
}
