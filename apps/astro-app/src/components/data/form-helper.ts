/**
 * Helpers for form creation. Does anything that may universally apply to all forms of data entry.
 */
import { zodResolver } from "@hookform/resolvers/zod"
import type { DescriptorInfo, TableInfo } from "@/env"
import { toSnakeCase } from "@/utils"
import { getFallbackValue, zodDatatypes, type zodPrimaryDatatypes } from "@root/src/utils/data"
import { useForm, type SubmitErrorHandler, type UseFormReturn } from "react-hook-form"
import { toast } from "sonner"
import { z, ZodArray, ZodObject, type AnyZodObject, type ZodTypeAny } from "zod"

export interface FormSchema {
    data: {
        [x: string]: any;
    }
    tags?: Array<string>
    descriptors?: {
        [x: string]: Array<{[x: string]: any}>
    }
}

export type Form = UseFormReturn<FormSchema>

export type OnSubmitInvalid = SubmitErrorHandler<FormSchema>

function populateZodSchema(itemInfo: TableInfo | DescriptorInfo, schema: Record<string, ZodTypeAny>, defaultValues: Record<string, any>) {
    for (let columnInfo of itemInfo.schema) {
        // immediately ignore anything not needed on the form.
        // if (columnInfo.entrytype === "none") continue

        // throw things into the schema, adding in restrictions as necessary
        // @TODO add restrictions
        schema[columnInfo.name] = zodDatatypes[columnInfo.datatype]
        // find a default value and create the form element
        defaultValues[columnInfo.name] = columnInfo.defaultValue ?? getFallbackValue(columnInfo.datatype)

        // update schema if there should be comments for this column
        // @TODO add length restriction
        schema[`${columnInfo.name}_comments`] = z.string().optional()
        defaultValues[`${columnInfo.name}_comments`] = ""

        // look for any restrictions
        // @ts-ignore thanks to the ColumnData type, this is guarenteed to be OK.
        if ("min" in columnInfo) { schema[columnInfo.name] = schema[columnInfo.name].min(columnInfo.min) }
        // @ts-ignore thanks to the ColumnData type, this is guarenteed to be OK.
        if ("max" in columnInfo) { schema[columnInfo.name] = schema[columnInfo.name].max(columnInfo.max) }
    }
}

/**
 * Creates a schema and two event handlers according to the supplied inputs, which are assumed to be good.
 * @param databaseName The name of the database containing the table whose schema is to be replicated.
 * @param tableInfo The table full table schema.
 * @param dbURL The URL of the cache or database to POST to
 * @returns A zod schema, produced by `useForm`, a onSubmit handler, and a onSubmitInvalid handler.
 */
export function createFormSchemaAndHandlers(databaseName: string, tableInfo: TableInfo, dbURL: string) {
    // direct column related
    let dataSchema: Record<string, ZodTypeAny> = {}
    let dataDefaultValues: Record<string, any> = {}
    
    populateZodSchema(tableInfo, dataSchema, dataDefaultValues)

    // descriptors
    let descriptorSchema: Record<string, ZodArray<AnyZodObject>> = {}
    let descriptorDefaultValues: Record<string, Array<Object>> = {}
    if (tableInfo.tagging) {
        for (let descriptor of tableInfo.descriptors) {
            let thisSchema: Record<string, ZodTypeAny> = {}
            let thisDefaultValues: Record<string, any> = {}

            populateZodSchema(descriptor, thisSchema, thisDefaultValues)

            descriptorSchema[descriptor.name] = z.array(z.object(thisSchema))
            descriptorDefaultValues[descriptor.name] = []
        }
    }

    const formSchema = z.object({
        data: z.object(dataSchema),
        ...(tableInfo.tagging) && { tags: z.array(z.string())},
        ...(tableInfo.descriptors && descriptorSchema) && {descriptors: z.object(descriptorSchema)},
    })
    const form: Form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            data: dataDefaultValues,
            ...(tableInfo.tagging) && { tags: []},
            ...(tableInfo.descriptors && descriptorSchema) && {descriptors: {}},
        },
    })

    /**
     * Form submit handler.
     * Parses the schema into something the sql-receptionist will recognize.
     * @param values The raw values the user inputted into the form.
     */
    function onSubmit(values: z.infer<typeof formSchema>) {
        let formattedValues: Record<string, any> = {}
        for (let field of tableInfo.schema) {
            // check the comments first
            if (values.data[field.name + "_comments"]) {
                values.data[field.name + "_comments"] = `'${values.data[field.name + "_comments"]}'`;
            }

            // check if the user really wanted to submit that or not
            if (!values.data[field.name]) {
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
                    values.data[field.name] = "'" + values.data[field.name] + "'"
                    break;
            }
        }

        // POST them to the SQL Receptionist!
        databaseName = toSnakeCase(databaseName);
        let tableName = toSnakeCase(tableInfo.tableName);
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
        for (let erroringField in values.data) {
            toast(erroringField + ": " + values.data[erroringField]["message"])
            console.log(erroringField + ": " + values.data[erroringField]["message"])
        }
    }

    return {
        form,
        onSubmit,
        onSubmitInvalid
    }
}