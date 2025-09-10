import { z, type ZodTypeAny } from "zod";

// map strings to Zod datatypes
export type zodPrimaryDatatypes = "int" | "integer" | "float" | "number" | "string" | "str" | "text" | "bool" | "boolean" | "date" | "time" | "timestamp"

export const zodDatatypes: Record<zodPrimaryDatatypes, ZodTypeAny> = {
  "integer": z.number(),
  "int": z.number(),
  "float": z.number(),
  "number": z.number(),
  "string": z.string(),
  "str": z.string(),
  "text": z.string(),
  "bool": z.boolean(),
  "boolean": z.boolean(),
  "date": z.date(),
  "time": z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?$/, {message: "Invalid ISO time format",}),
  // THIS IS BY NO MEANS ROBUST
  // "date": z.string().regex(/^(3[01]|[12][0-9]|0?[1-9])(\/|-)(1[0-2]|0?[1-9])\2([0-9]{2})?[0-9]{2}$/, {
  //   message: "Invalid Date format",
  // }),
  // THIS IS BY NO MEANS ROBUST
  "timestamp": z.string().regex(/^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/, {message: "Invalid ISO timestamp format"}),
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
    // case "time":
      // return new Time();
    // case "timestamp":
      // return new
    default:
      return null;  
  }
}