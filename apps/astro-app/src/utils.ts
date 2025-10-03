import { parse, format as formatDate, formatISO, isValid } from "date-fns";
import { type zodPrimaryDatatypes } from "./utils/data";

/**
 * Attempts to turnp any type of input into something pretty that the user can look at and easily understand.
 * @param value The value that needs to be parsed.
 * @param datatype @type {zodPrimaryDatatypes} The expected datatype of the value.
 * @returns @type {undefined} when the input is invalid, @type {string | number | boolean} or whatever that was put in.
 */
function prettyParseAny(value: string | number | undefined, datatype: "int" | "integer" | "float" | "number"): number | undefined
function prettyParseAny(value: string, datatype: "string" | "str" | "text"): string
function prettyParseAny(value: string | boolean, datatype: "bool" | "boolean"): boolean
// function prettyParseAny(value: Date, datatype: "date" | "time" | "timestamp"): Date
function prettyParseAny(value: string | number | boolean | undefined, datatype: zodPrimaryDatatypes): undefined | number | string | boolean {
    if (value == undefined) {
        return value
    }

    switch (datatype) {
        case "string":
        case "str":
        case "text":
            return value;
        case "int":
        case "integer":
            const result = parseInt(value.toString())
            if (isNaN(result)) {
                // console.warn(`parseAny received an invalid integer string: "${value}"`);
                return undefined; // Return undefined if parsing fails
            }
            return result as any;
        case "float":
        case "number":
            const floatResult = parseFloat(value.toString())
            if (isNaN(floatResult)) {
                return undefined as any;
            }
            return floatResult as any;
        case "boolean":
            return (value.toString().toLowerCase() === "true") as any;
        default:
            return undefined as any;
    }
}

/**
 * Attempts to turnp any type of input into a format recognized by the sql-receptionist.
 * @param value The value that needs to be parsed.
 * @param datatype @type {zodPrimaryDatatypes} The expected datatype of the value.
 * @returns @type {undefined} if the input is invalid, @type {string | number | boolean} otherwise.
 */
function parseAny(value: string | number | undefined, datatype: "int" | "integer" | "float" | "number"): number | undefined
function parseAny(value: string, datatype: "string" | "str" | "text"): string
function parseAny(value: string | boolean, datatype: "bool" | "boolean"): boolean
function parseAny(value: Date, datatype: "date" | "time" | "timestamp"): string | undefined
function parseAny(value: string | number | undefined | boolean | Date, datatype: zodPrimaryDatatypes): undefined | string | number | boolean {
    if (value == undefined) {
        return value
    }

    switch (datatype) {
        case "string":
        case "str":
        case "text":
            return value as string
        case "int":
        case "integer":
            if (typeof value == "number") {
                return value;
            }

            const result = parseInt(value as string)
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

            const floatResult = parseFloat(value as string)
            if (isNaN(floatResult)) {
                return undefined;
            }
            return floatResult;
        case "boolean":
            return (value.toString().toLowerCase() === "true");
        case "date":
            console.log("DATE:", value, typeof value);
            value = (new Date(value as Date | string)).toISOString();

            return formatISO(value, {
                representation: "date"
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
                value = (value as Date);
            }

            console.log(value, formatISO(value as Date | string, {
                representation: "time"
            }));

            return formatISO(value as Date | string, {
                representation: "time"
            });
        case "timestamp":
            console.log("TIMESTAMP:", value, typeof value);
            value = (new Date(value as Date | string)).toISOString();

            return formatISO(value, {
                representation: "complete"
            });
        default:
            return undefined as any
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
        console.warn("parseTime received an empty or undefined string.")
        return undefined as any;
    }

    const formatsToTry = ["HH:mm", "hh:mm a"]

    for (const fmt of formatsToTry) {
        const date = parse(`${time}`, `${fmt}`, new Date())
        if (isValid(date)) return formatDate(date, "hh:mm:ss");
    }

    console.warn(`parseTime could not parse the time string: "${time}" with any of the formats: ${formatsToTry.join(", ")}`);
    return undefined; // Return undefined if no valid format is found
}

/**
 * Attempts to parse a string representing a date into a Date object.
 * @param date @type {string} A string representing a date.
 * @returns @type {Date} when the parse is successful and @type {undefined} when it is not.
 */
function parseDate(date: string): Date | undefined {
    const formatsToTry = ["MM-dd-yyyy", "yyyy-MM-dd", "MM/dd/yyyy", "yyyy/MM/dd"]

    for (const fmt of formatsToTry) {
        const output = parse (`${date}`, fmt, new Date())
        if (isValid(output)) return output;
    }

    return undefined
}

/**
 * Attempts to parse a string representing time into a Date object.
 * @param time @type {string} A string representing time.
 * @returns @type {Date} when the parse is successful and @type {undefined} when it is not.
 */
function parseTime(time: string): Date | undefined {
    const formatsToTry = ["HH:mm", "hh:mm a"]

    for (const fmt of formatsToTry) {
        const output = parse (`${time}`, fmt, new Date())
        if (isValid(output)) return output;
    }

    return undefined
}

/**
 * Attempts to parse a string representing a timestamp into a Date object.
 * @param timestamp @type {string} A string representing time.
 * @returns @type {Date} when the parse is successful and @type {undefined} when it is not.
 */
function parseTimestamp(timestamp: string): Date | undefined {
    const formatsToTry = [""]

    for (const fmt of formatsToTry) {
        const output = parse (`${timestamp}`, fmt, new Date())
        if (isValid(output)) return output;
    }

    return undefined
}

export {prettyParseAny, parseAny, prettifyTimeString, parseDate, parseTime, parseTimestamp}