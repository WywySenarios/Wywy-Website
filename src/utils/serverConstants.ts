// Server-side EXCLUSIVE constants

import { z, type ZodTypeAny } from "zod";
import { column } from "astro:db";

// maps strings to the Astro datatypes accepted for Astro DB.
export const astroDatatypes: Record<string, (params?: Record<any, any>) => any> = {
  "date": column.date,
  "integer": column.number,
  "int": column.number,
  "float": column.number,
  "number": column.number,
  "string": column.text,
  "str": column.text,
  "text": column.text,
  "json": column.json,
  "JSON": column.json,
  "bool": column.boolean,
  "boolean": column.boolean,
}

// map strings to Zod datatypes
export type zodPrimaryDatatypes = "int" | "integer" | "float" | "number" | "string" | "str" | "text" | "bool" | "boolean" | "date"

export const zodDatatypes: Record<zodPrimaryDatatypes, ZodTypeAny> = {
  "date": z.date(),
  "integer": z.number(),
  "int": z.number(),
  "float": z.number(),
  "number": z.number(),
  "string": z.string(),
  "str": z.string(),
  "text": z.string(),
  // "json": z.object,
  // "JSON": z.object,
  "bool": z.boolean(),
  "boolean": z.boolean(),
}

export function getFallbackValue(datatype: zodPrimaryDatatypes): number | string | boolean | Date | null | undefined {
  switch (datatype) {
    case "int":
    case "integer":
    case "float":
    case "number":
      return 0;
    case "string":
    case "str":
    case "text":
      return "";
    case "bool":
    case "boolean":
      return false;
    case "date":
      return new Date();
    default:
      return null;
  }
}