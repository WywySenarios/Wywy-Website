/**
 * Helpers for form creation. Does anything that may universally apply to all forms of data entry.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import type { DataColumn, TableInfo } from "@/env";
import { toSnakeCase } from "@/utils";
import { getFallbackValue, getZodType } from "@/utils/data";
import { useForm, type FieldErrors, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { z, ZodArray, type AnyZodObject, type ZodTypeAny } from "zod";
import { getCSRFToken } from "@/utils/auth";

/**
 *
 * @param schema
 * @returns The default values pertaining to the respective schema.
 */
export function getDefaultValues(schema: DataColumn[]): Record<string, any> {
  let defaultValues: Record<string, any> = {};
  for (let columnInfo of schema) {
    defaultValues[columnInfo.name] =
      columnInfo.defaultValue ?? getFallbackValue(columnInfo.datatype);
  }
  return defaultValues;
}

/**
 * Formats values so that the receiving server gets the values in the format it can understand. Ignores values that do not relate to columns in the schema and does not include them in the output.
 * @param values The values that need to be formatted.
 * @param schema The schema that relates to the given values.
 * @returns An object filled with the formatted values, or a string with a corresponding error message if the schema does not match the values.
 */
export function formatValues(
  values: Record<string, any>,
  schema: Array<DataColumn>,
): Record<string, any> {
  let formattedValues: Record<string, any> = {};

  for (let column_schema of schema) {
    // check the comments first
    if (column_schema.comments) {
      formattedValues[`${column_schema.name}_comments`] =
        values[`${column_schema.name}_comments`] ?? "''";
    }

    // check if the user really wanted to submit that or not
    if (!values[column_schema.name]) {
      continue;
    }

    // single-quote strings, dates, times, and timestamps
    switch (column_schema.datatype) {
      case "string":
      case "str":
      case "text":
      case "date":
      case "time":
      case "timestamp":
        formattedValues[column_schema.name] = `'${values[column_schema.name]}'`;
        break;
      default:
        formattedValues[column_schema.name] = values[column_schema.name];
        break;
    }
  }

  return formattedValues;
}

export function populateZodSchema(
  itemInfo: DataColumn[],
  schema: Record<string, ZodTypeAny>,
  defaultValues: Record<string, any>,
) {
  for (let columnInfo of itemInfo) {
    // immediately ignore anything not needed on the form.
    // if (columnInfo.entrytype === "none") continue

    // throw things into the schema, adding in restrictions as necessary (handled by getZodType)
    schema[columnInfo.name] = getZodType(columnInfo);
    // find a default value and create the form element
    defaultValues[columnInfo.name] =
      columnInfo.defaultValue ?? getFallbackValue(columnInfo.datatype);

    // update schema if there should be comments for this column
    // @TODO add length restriction
    if (columnInfo.comments) {
      schema[`${columnInfo.name}_comments`] = z.string().optional();
    }
  }
}

/**
 * Attempt to submit a form externally.
 * @param dbURL The database or cache URL.
 * @param targetURL The URL of the endpoint to submit to.
 * @param values The values to submit, which will be serialized with JSON.stringify.
 */
export function submitForm(
  dbURL: string,
  targetURL: string,
  values: Record<string, any>,
): void {
  console.log(`POSTING to: ${targetURL}`);
  console.log(values);

  getCSRFToken(dbURL)
    .then((csrftoken: string) => {
      fetch(targetURL, {
        method: "POST",
        body: JSON.stringify(values),
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          "X-CSRFToken": csrftoken,
        },
      }).then((response) => {
        response.text().then((text: string) => {
          if (response.ok) {
            toast(`Successfully submitted form!`);
          } else {
            toast(`Error while submitting form: ${text}`);
          }
        });
      });
    })
    .catch((reason: string) => {
      toast(`Something went wrong while trying to submit the form: ${reason}`);
    });
}

/**
 * Creates a schema and two event handlers according to the supplied inputs, which are assumed to be good.
 * @param databaseName The name of the database containing the table whose schema is to be replicated.
 * @param tableInfo The table full table schema.
 * @param dbURL The URL of the cache or database to POST to
 * @returns A zod schema, produced by `useForm`, a onSubmit handler, and a onSubmitInvalid handler.
 */
export function createFormSchemaAndHandlers(
  databaseName: string,
  tableInfo: TableInfo,
  dbURL: string,
) {
  // direct column related
  let dataSchema: Record<string, ZodTypeAny> = {};
  let dataDefaultValues: Record<string, any> = {};

  populateZodSchema(tableInfo.schema, dataSchema, dataDefaultValues);

  // descriptors
  let descriptorSchema: Record<string, ZodArray<AnyZodObject>> = {};
  let descriptorDefaultValues: Record<string, Array<Object>> = {};
  if (tableInfo.tagging) {
    for (let descriptor of tableInfo.descriptors) {
      let thisSchema: Record<string, ZodTypeAny> = {};
      let thisDefaultValues: Record<string, any> = {};

      populateZodSchema(descriptor.schema, thisSchema, thisDefaultValues);

      descriptorSchema[descriptor.name] = z.array(z.object(thisSchema));
      descriptorDefaultValues[descriptor.name] = [];
    }
  }

  const formSchema = z.object({
    data: z.object(dataSchema),
    ...(tableInfo.tagging && { tags: z.array(z.string()).min(1) }),
    ...(tableInfo.descriptors &&
      descriptorSchema && { descriptors: z.object(descriptorSchema) }),
  });
  const form: UseFormReturn<z.infer<typeof formSchema>> = useForm<
    z.infer<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data: dataDefaultValues,
      ...(tableInfo.tagging && { tags: [] }),
      ...(tableInfo.descriptors &&
        descriptorSchema && { descriptors: descriptorDefaultValues }),
    },
  });

  /**
   * Form submit handler. @TODO consolidate the valid keys for formattedValues into a type.
   * Parses the schema into something the sql-receptionist will recognize.
   * @param values The raw values the user inputted into the form.
   */
  function onSubmit(values: z.infer<typeof formSchema>) {
    let formattedValues: Record<string, any> = {
      data: formatValues(values.data, tableInfo.schema),
    };

    // @TODO tags
    if ("tags" in values) {
      if ("primary_tag" in formattedValues.data) {
        toast("Primary tag already set? Contact dev for a fix.");
        return;
      }

      formattedValues.data["primary_tag"] = (values.tags as String[]).shift();

      if (!formattedValues.data["primary_tag"]) {
        toast("Primary tag cannot be empty.");
      }

      formattedValues["tags"] = values.tags;
    }

    if ("descriptors" in values) {
      formattedValues.descriptors = {};

      // format every descriptor type.
      for (const descriptor_schema of tableInfo.descriptors)
        if (values.descriptors[descriptor_schema.name])
          formattedValues.descriptors[descriptor_schema.name] =
            values.descriptors[descriptor_schema.name].map(
              (value: { [x: string]: any }) =>
                formatValues(value, descriptor_schema.schema),
            );
    }

    // POST to cache
    submitForm(
      dbURL,
      `${dbURL}/main/${toSnakeCase(databaseName)}/${toSnakeCase(tableInfo.tableName)}`,
      formattedValues,
    );
  }

  function onSubmitInvalid(
    errors: FieldErrors<z.infer<typeof formSchema>>,
  ): void {
    // Create toast(s) to let to user know what went wrong.
    // @TODO fix type errors

    console.log("onSubmitInvalid called.");
    console.log(errors);
  }

  return {
    form,
    formSchema,
    onSubmit,
    onSubmitInvalid,
  };
}
