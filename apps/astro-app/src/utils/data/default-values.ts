import type { DataColumn } from "@/types/data";
import { resolveColumnsSchema } from "./iterators";
import { toSnakeCase } from "@utils/parse";

/**
 * Generates a default values object based on the given schema.
 * @param schema
 * @returns The default values pertaining to the respective schema.
 */
export function getDefaultValues(schema: DataColumn[]): Record<string, any> {
  let defaultValues: Record<string, any> = {};
  for (const resolvedColumn of resolveColumnsSchema(schema)) {
    if (resolvedColumn.defaultValue !== undefined) {
      defaultValues[toSnakeCase(resolvedColumn.name)] =
        resolvedColumn.defaultValue;
    }
  }
  return defaultValues;
}
