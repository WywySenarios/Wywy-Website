import type { Datatype, DescriptorInfo, TableInfo } from "@/types/data";
import { resolveEntrySchema } from "./iterators";
import { toSnakeCase } from "@utils/parse";

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

/**
 * Generates a default values object based on the given schema.
 * @param schema
 * @returns The default values pertaining to the respective schema.
 */
export function getDefaultValues(
  entrySchema: TableInfo | DescriptorInfo,
): Record<string, any> {
  let defaultValues: Record<string, any> = {};
  for (const resolvedColumn of resolveEntrySchema(entrySchema)) {
    if (resolvedColumn.defaultValue !== undefined) {
      defaultValues[toSnakeCase(resolvedColumn.name)] =
        resolvedColumn.defaultValue;
    }
  }
  return defaultValues;
}
