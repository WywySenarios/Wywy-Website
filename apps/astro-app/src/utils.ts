import { parse, isValid } from "date-fns";
import { type zodPrimaryDatatypes } from "./utils/data";

export function parseAny<T extends zodPrimaryDatatypes | any>(value: any, datatype: T):
    T extends "string" | "str" | "text" ? string :
    T extends "int" | "integer" | "float" | "number" ? number :
    T extends "boolean" ? boolean :
    T extends "date" ? Date :
    T extends "time" ? Date :
    T extends "timestamp" ? Date:
    T extends any ? any:
    never {
    if (! (typeof value == "string")) {
        return value
    }
    
    switch (datatype) {
        case "string":
        case "str":
        case "text":
            return value as any;
        case "int":
        case "integer":
            const result = parseInt(value)
            if (isNaN(result)) {
                // console.warn(`parseAny received an invalid integer string: "${value}"`);
                return undefined as any; // Return undefined if parsing fails
            }
            return result as any;
        case "float":
        case "number":
            const floatResult = parseFloat(value)
            if (isNaN(floatResult)) {
                return undefined as any;
            }
            return parseFloat(value) as any;
        case "boolean":
            return (value.toLowerCase() === "true") as any;
        case "date":
            return new Date() as any; // @TODO fix this
            // return new Date(value) as any;
        case "time":
            return parseTime(value) as any;
        default:
            return undefined as any;
    }
}

export function parseTime(time: string): Date {
    console.log(time)

    // avoid issues with undefined strings
    if (!time) {
        console.warn("parseTime received an empty or undefined string.")
        return undefined as any;
    }

    const formatsToTry = ["HH:mm", "hh:mm a"]

    for (const fmt of formatsToTry) {
        const date = parse(`${time}`, `${fmt}`, new Date())
        if (isValid(date)) return date;
    }

    console.warn(`parseTime could not parse the time string: "${time}" with any of the formats: ${formatsToTry.join(", ")}`);
    return undefined as any; // Return undefined if no valid format is found
}