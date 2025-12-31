/**
 * Helpers for form creation. Does anything that may universally apply to all forms of data entry.
 */
import { zodResolver } from "@hookform/resolvers/zod"
import type { DataColumn } from "@root/src/env"
import { toSnakeCase } from "@root/src/utils"
import { getFallbackValue, zodDatatypes, type zodPrimaryDatatypes } from "@root/src/utils/data"
import type { ZodTypeAny } from "astro:schema"
import type { JSXElementConstructor, ReactElement } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

/**
 * Creates a schema and two event handlers according to the supplied inputs, which are assumed to be good.
 * @param databaseName The name of the database containing the table whose schema is to be replicated.
 * @param tableName The name of the table whose schema is to be replicated.
 * @returns A zod schema, produced by `useForm`, a onSubmit handler, and a onSubmitInvalid handler.
 */
export function createFormSchemaAndHandlers(fieldsToEnter: DataColumn[], databaseName: string, tableName: string, dbURL: string) {
    // read the config and populate the zod schema
    let zodSchema: Record<string, ZodTypeAny> = {}
    // give Zod some default values to work with
    let defaultValues: Record<string, any> = {}


    for (let columnInfo of fieldsToEnter) {
        // immediately ignore anything not needed on the form.
        if (columnInfo.entrytype === "none") continue

        // throw things into the schema, adding in restrictions as necessary
        // @TODO add restrictions
        zodSchema[columnInfo.name] = zodDatatypes[columnInfo.datatype as zodPrimaryDatatypes]
        // find a default value and create the form element
        defaultValues[columnInfo.name] = columnInfo.defaultValue ?? getFallbackValue(columnInfo.datatype)

        // update schema if there should be comments for this column
        // @TODO add length restriction
        zodSchema[columnInfo.name + "_comments"] = z.string().optional()
        defaultValues[columnInfo.name + "_comments"] = undefined

        // look for any restrictions
        // @ts-ignore thanks to the ColumnData type, this is guarenteed to be OK.
        if ("min" in columnInfo) { zodSchema[columnInfo.name] = zodSchema[columnInfo.name].min(columnInfo.min) }
        // @ts-ignore thanks to the ColumnData type, this is guarenteed to be OK.
        if ("max" in columnInfo) { zodSchema[columnInfo.name] = zodSchema[columnInfo.name].max(columnInfo.max) }
    }

    const formSchema = z.object(zodSchema)
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues,
    })

    /**
     * Form submit handler.
     * Parses the schema into something the sql-receptionist will recognize.
     * @param values The raw values the user inputted into the form.
     */
    function onSubmit(values: z.infer<typeof formSchema>) {
        let formattedValues: Record<string, any> = {}
        for (let field of fieldsToEnter) {
            // check the comments first
            if (values[field.name + "_comments"]) {
                values[field.name + "_comments"] = `'${values[field.name + "_comments"]}'`;
            }

            // check if the user really wanted to submit that or not
            if (!values[field.name]) {
                continue
            }

            // single-quote strings, dates, times, and timestamps
            switch (field.datatype) {
                case "string":
                case "str":
                case "text":
                case "date":
                case "time":
                case "timestamp":
                    values[field.name] = "'" + values[field.name] + "'"
                    break;
            }
        }

        // POST them to the SQL Receptionist!
        databaseName = toSnakeCase(databaseName);
        tableName = toSnakeCase(tableName);
        console.log()
        console.log(`POSTING to: ${dbURL + "/" + databaseName + "/" + tableName}`)
        fetch(dbURL + "/" + databaseName + "/" + tableName, {
            method: "POST",
            body: JSON.stringify(values),
            mode: "cors",
            credentials: "include",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
            }
        }).then((response) => {
            response.text().then((text: string) => {
                if (response.ok) {
                    if (response.headers.get("Content-Type") == "text/plain") {
                        toast(`Successfully submitted form!`)
                    } else {
                        toast(`The server has returned an unexpected response. Wywy is sad. ${text}`)
                    }
                } else {
                    toast(`Error while submitting form: ${text}`)
                }
            })
        })
    }

    function onSubmitInvalid(values: z.infer<typeof formSchema>) {
        // Create toast(s) to let to user know what went wrong.
        for (let erroringField in values) {
            toast(erroringField + ": " + values[erroringField]["message"])
        }
    }

    return {
        form,
        onSubmit,
        onSubmitInvalid
    }
}