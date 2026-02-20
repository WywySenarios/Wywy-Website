import { parse, format as formatDate, formatISO, isValid } from "date-fns";
import type { Datatype } from "@/types/data";

/**
 * Attempts to parse a string.
 * @TODO pretty print
 * @param value The value to parse.
 * @returns The string that was inputted.
 */
function prettyParseString(value: string): string {
  return value;
}

/**
 * Attempts to parse an integer.
 * @param value The value to parse.
 * @param defaultValue The fallback value in case parsing fails.
 * @returns An integer if parsing is successful. May return NaN if the defaultValue is not set or is NaN.
 */
function prettyParseInt(
  value: string | number,
  defaultValue: number = NaN,
): number {
  const floatResult = parseFloat(value.toString());
  if (isNaN(floatResult)) {
    return defaultValue;
  }

  return floatResult;
}

/**
 * Attempts to parse a float.
 * @param value The value to parse.
 * @param defaultValue The fallback value in case parsing fails.
 * @returns An integer if parsing is successful. May return NaN if the defaultValue is not set or is NaN.
 */
function prettyParseFloat(
  value: string | number,
  defaultValue: number = NaN,
): number | undefined {
  const floatResult = parseFloat(value.toString());
  if (isNaN(floatResult)) {
    return defaultValue;
  }

  return floatResult;
}
/**
 * Attempts to parse a boolean value.
 * @param value The value to parse.
 * @returns True if the text of the string is true (case insensitive), false otherwise.
 */
function prettyParseBoolean(value: string): boolean {
  return value.toString().toLowerCase() === "true";
}

/**
 * Attempts to parse a time.
 * @param value The value to prase.
 * @param defaultValue The fallback value in case parsing fails.
 * @returns
 */
function prettyParseTime(
  value: string | Date,
  defaultValue?: Date,
): Date | undefined {
  if (value instanceof Date) return value;
  let output = parseTime(value);

  return output ? output : defaultValue;
}

/**
 * Attempts to parse a date.
 * @param value The value to parse.
 * @param defaultValue The fallback value in case parsing fails.
 * @returns
 */
function prettyParseDate(
  value: string | Date,
  defaultValue?: Date,
): Date | undefined {
  if (value instanceof Date) return value;
  let output = parseDate(value);

  return output ? output : defaultValue;
}

/**
 * Attempts to parse a timestamp.
 * @param value The value to parse.
 * @param defaultValue The fallback value in case parsing fails.
 * @returns
 */
function prettyParseTimestamp(
  value: string | Date,
  defaultValue?: Date,
): Date | undefined {
  if (value instanceof Date) return value;
  let output = parseTimestamp(value);

  return output ? output : defaultValue;
}

/**
 * Attempts to turn any type of input into something pretty that the user can look at and easily understand.
 * @param value The value that needs to be parsed.
 * @param datatype @type {Datatype} The expected datatype of the value.
 * @returns @type {undefined} when the input is invalid, @type {string | number | boolean} or whatever that was put in.
 */
function prettyParseAny(
  value: string | number | undefined,
  datatype: "int" | "integer" | "float" | "number",
): number | undefined;
function prettyParseAny(
  value: string,
  datatype: "string" | "str" | "text",
): string;
function prettyParseAny(
  value: string | boolean,
  datatype: "bool" | "boolean",
): boolean;
// function prettyParseAny(value: Date, datatype: "date" | "time" | "timestamp"): Date
function prettyParseAny(
  value: string | number | boolean | undefined,
  datatype: Datatype,
): undefined | number | string | boolean {
  if (value == undefined) {
    return value;
  }

  switch (datatype) {
    case "string":
    case "str":
    case "text":
      return value;
    case "int":
    case "integer":
      const result = parseInt(value.toString());
      if (isNaN(result)) {
        // console.warn(`parseAny received an invalid integer string: "${value}"`);
        return undefined; // Return undefined if parsing fails
      }
      return result as any;
    case "float":
    case "number":
      const floatResult = parseFloat(value.toString());
      if (isNaN(floatResult)) {
        return undefined as any;
      }
      return floatResult as any;
    case "bool":
    case "boolean":
      return (value.toString().toLowerCase() === "true") as any;
    default:
      return undefined as any;
  }
}

/**
 * Attempts to turn any type of input into a format recognized by the sql-receptionist.
 * @param value The value that needs to be parsed.
 * @param datatype @type {Datatype} The expected datatype of the value.
 * @returns @type {undefined} if the input is invalid, @type {string | number | boolean} otherwise.
 */
function parseAny(
  value: string | number | undefined,
  datatype: "int" | "integer" | "float" | "number",
): number | undefined;
function parseAny(value: string, datatype: "string" | "str" | "text"): string;
function parseAny(
  value: string | boolean,
  datatype: "bool" | "boolean",
): boolean;
function parseAny(
  value: Date,
  datatype: "date" | "time" | "timestamp",
): string | undefined;
function parseAny(
  value: string | number | undefined | boolean | Date,
  datatype: Datatype,
): undefined | string | number | boolean {
  if (value == undefined) {
    return value;
  }

  switch (datatype) {
    case "string":
    case "str":
    case "text":
      return value as string;
    case "int":
    case "integer":
      if (typeof value == "number") {
        return value;
      }

      const result = parseInt(value as string);
      if (isNaN(result)) {
        // console.warn(`parseAny received an invalid integer string: "${value}"`);
        return undefined;
      }
      return result;
    case "float":
    case "number":
      if (typeof value == "number") {
        return value;
      }

      const floatResult = parseFloat(value as string);
      if (isNaN(floatResult)) {
        return undefined;
      }
      return floatResult;
    case "bool":
    case "boolean":
      return value.toString().toLowerCase() === "true";
    case "date":
      value = new Date(value as Date | string).toISOString();

      return formatISO(value, {
        representation: "date",
      });
    case "time":
      if (typeof value == "string") {
        value = parseTime(value as string);
        if (!value) {
          return undefined;
        } else {
          value = value;
        }
      } else {
        value = value as Date;
      }

      return formatISO(value as Date | string, {
        representation: "time",
      });
    case "timestamp":
      value = new Date(value as Date | string).toISOString();

      return formatISO(value, {
        representation: "complete",
      });
    default:
      return undefined as any;
  }
}

/**
 * Turns time strings into a standard format.
 * @param time @type {string} The string to be parsed.
 * @returns A pretty time string.
 */
function prettifyTimeString(time: string): string {
  // avoid issues with undefined strings
  if (!time) {
    console.warn("prettifyTimeString received an empty or undefined string.");
    return undefined as any;
  }

  const formatsToTry = ["HH:mm", "hh:mm a", "HH:mm:ss", "hh:mm:ss a"];

  for (const fmt of formatsToTry) {
    const date = parse(`${time}`, `${fmt}`, new Date());
    if (isValid(date)) return formatDate(date, "hh:mm:ss");
  }

  console.warn(
    `prettifyTimeString could not parse the time string: "${time}" with any of the formats: ${formatsToTry.join(", ")}`,
  );
  return "";
}

/**
 * Attempts to parse a string representing a date into a Date object.
 * @param date @type {string} A string representing a date.
 * @returns @type {Date} when the parse is successful and @type {undefined} when it is not.
 */
function parseDate(date: string): Date | undefined {
  const formatsToTry = ["MM-dd-yyyy", "yyyy-MM-dd", "MM/dd/yyyy", "yyyy/MM/dd"];

  for (const fmt of formatsToTry) {
    const output = parse(`${date}`, fmt, new Date());
    if (isValid(output)) return output;
  }

  // @TODO don't band-aid solution this
  if (Date.parse(date)) return new Date(date);

  return undefined;
}

/**
 * Attempts to parse a string representing time into a Date object.
 * @param time @type {string} A string representing time.
 * @returns @type {Date} when the parse is successful and @type {undefined} when it is not.
 */
function parseTime(time: string): Date | undefined {
  const formatsToTry = ["HH:mm", "hh:mm a", "HH:mm:ss", "hh:mm:ss a"];

  for (const fmt of formatsToTry) {
    const output = parse(`${time}`, fmt, new Date());
    if (isValid(output)) return output;
  }

  return undefined;
}

/**
 * Attempts to parse a string representing a timestamp into a Date object.
 * @param timestamp @type {string} A string representing time.
 * @returns @type {Date} when the parse is successful and @type {undefined} when it is not.
 */
function parseTimestamp(timestamp: string): Date | undefined {
  let value = Date.parse(timestamp);
  if (isNaN(value)) return undefined;
  return new Date(value);
}

/**
 * Fragments an ISO timestamp into a date portion and a time portion.
 * @param timestamp The ISO timestamp to fragment.
 */
function fragmentTimestamp(timestamp: string): [string, string] {
  let output: Array<string> = timestamp.split(new RegExp("[T.Z]"));
  return output.slice(0, 2) as [string, string];
}

/**
 * Puts two UTC ISO timestamp fragments back together.
 * @param timestampFragments The UTC ISO timestamp fragments to put back together.
 */
function recombineUTCTimestamp(timestampFragments: [string, string]): Date {
  return new Date(`${timestampFragments[0]}T${timestampFragments[1]}Z`);
}

/**
 * Puts two locale ISO timestamp fragments back together.
 * @param timestampFragments The locale ISO timestamp fragments to put back together.
 */
function recombineLocaleTimestamp(timestampFragments: [string, string]): Date {
  return new Date(`${timestampFragments[0]}T${timestampFragments[1]}`);
}

/**
 * Converts a date into an ISO string in the user's current locale. Does not put in milliseconds.
 * @param date The date to convert.
 */
function toLocaleISOString(date: Date): string {
  // turn 0001-1-1 into 0001-01-01
  const pad = (n: number) => String(n).padStart(2, "0");

  // remember that the month is zero indexed.
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Converts a string to snake_case.
 * @param str The string to convert.
 * @returns The same string, but lower case and with all the spaces, dots, and dashes replaced with underscores.
 */
function toSnakeCase(str: string): string {
  return str.replace(/[\s.-]+/g, "_").toLowerCase();
}

function prettifySnakeCase(str: string): string {
  return str
    .replace(/_/g, " ") // replace underscores with spaces
    .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize each word
}

export {
  prettyParseString,
  prettyParseInt,
  prettyParseFloat,
  prettyParseBoolean,
  prettyParseTime,
  prettyParseDate,
  prettyParseTimestamp,
  prettyParseAny,
  parseAny,
  prettifyTimeString,
  parseDate,
  parseTime,
  parseTimestamp,
  fragmentTimestamp,
  recombineUTCTimestamp,
  recombineLocaleTimestamp,
  toLocaleISOString,
  toSnakeCase,
  prettifySnakeCase,
};
