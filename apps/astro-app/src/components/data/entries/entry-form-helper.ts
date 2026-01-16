import type { DescriptorInfo, TableInfo } from "@/env";
import { toast } from "sonner";
import { z, type AnyZodObject, type ZodTypeAny } from "zod";
import {
  formatValues,
  populateZodSchema,
  submitForm,
} from "@/components/data/form-helper";
import { useForm, type FieldErrors, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isTaggingEnabled } from "@/utils/data";
import { toSnakeCase } from "@/utils";

export function createGenericTableFormSchemaAndHandlers(
  databaseName: string,
  parentTableName: string,
  schema: TableInfo | DescriptorInfo,
  cacheURL: string
) {
  const isTableInfo = "tableName" in schema;

  // direct column related
  let zodSchema: Record<string, ZodTypeAny> = {};
  let defaultValues: Record<string, any> = {};

  populateZodSchema(schema.schema, zodSchema, defaultValues);

  if (isTableInfo && isTaggingEnabled(schema)) {
    zodSchema["primary_tag"] = z.number().int().min(1);
    // defaultValues["primary_tag"] = 1;
  }

  const formSchema = z.object(zodSchema);
  const controller: UseFormReturn<z.infer<typeof formSchema>> = useForm<
    z.infer<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  /**
   * Form submit handler. @TODO consolidate the valid keys for formattedValues into a type.
   * Parses the schema into something the sql-receptionist will recognize.
   * @param values The raw values the user inputted into the form.
   */
  function onSubmit(values: z.infer<typeof formSchema>) {
    let formattedValues: Record<string, any> = formatValues(
      values,
      schema.schema
    );

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

    if (isTableInfo && "descriptors" in values) {
      formattedValues.descriptors = {};

      // format every descriptor type.
      for (const descriptor_schema of schema.descriptors)
        if (values.descriptors[descriptor_schema.name])
          formattedValues.descriptors[descriptor_schema.name] =
            values.descriptors[descriptor_schema.name].map(
              (value: { [x: string]: any }) =>
                formatValues(value, descriptor_schema.schema)
            );
    }

    // POST to cache
    if (isTableInfo) {
      submitForm(
        `${cacheURL}/main/${toSnakeCase(databaseName)}/${toSnakeCase(parentTableName)}`,
        formattedValues
      );
    } else {
      submitForm(
        `${cacheURL}/main/${toSnakeCase(databaseName)}/${toSnakeCase(parentTableName)}/descriptors/${toSnakeCase(schema.name)}`,
        formattedValues
      );
    }
  }

  function onSubmitInvalid(
    errors: FieldErrors<z.infer<typeof formSchema>>
  ): void {
    // Create toast(s) to let to user know what went wrong.
    // @TODO fix type errors

    console.log("onSubmitInvalid called.");

    for (const fieldName in errors) {
      const error = errors[fieldName];
      if (error?.message) {
        toast(`${fieldName}: ${error.message}`);
        console.log(`${fieldName}: ${error.message}`);
      }
    }
  }

  return {
    controller,
    formSchema,
    onSubmit,
    onSubmitInvalid,
  };
}

export function createTaggingTableFormSchemaAndHandlers(
  databaseName: string,
  parentTableName: string,
  type: "tags" | "tag_names" | "tag_aliases" | "tag_groups",
  cacheURL: string
) {
  let zodSchema: AnyZodObject;
  let defaultValues: Record<string, any>;
  switch (type) {
    case "tags":
      zodSchema = z.object({
        // id: z.number().int().min(1).optional(),
        entry_id: z.number().int().min(1),
        tag_id: z.number().int().min(1),
      });
      defaultValues = {
        entry_id: 1,
        tag_id: 1,
      };
      break;
    case "tag_names":
      zodSchema = z.object({
        tag_name: z.string().nonempty(),
      });
      defaultValues = {
        tag_name: "",
      };
      break;
    case "tag_aliases":
      zodSchema = z.object({
        alias: z.string().nonempty(),
        tag_id: z.number().int().min(1),
      });
      defaultValues = {
        alias: "",
        tag_id: 1,
      };
      break;
    case "tag_groups":
      zodSchema = z.object({
        tag_id: z.number().int().min(1),
        group_name: z.string(),
      });
      defaultValues = {
        tag_id: 0,
        group_name: "",
      };
      break;
  }

  const formSchema: AnyZodObject = zodSchema;
  const controller: UseFormReturn<z.infer<typeof formSchema>> = useForm<
    z.infer<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  /**
   * Form submit handler. @TODO consolidate the valid keys for formattedValues into a type.
   * Parses the schema into something the sql-receptionist will recognize.
   * @param values The raw values the user inputted into the form.
   */
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Tags are special. Strings need to be quoted and numbers do not.
    let formattedValues: Record<string, string | number> = {};
    switch (type) {
      case "tags":
        formattedValues = values;
        break;
      case "tag_names":
        formattedValues["tag_name"] = `'${values["tag_name"]}'`;
        break;
      case "tag_aliases":
        formattedValues["alias"] = `'${values["alias"]}'`;
        formattedValues["tag_id"] = values["tag_id"];
        break;
      case "tag_groups":
        formattedValues["tag_id"] = values["tag_id"];
        formattedValues["group_name"] = `'${values["group_name"]}'`;
        break;
    }

    submitForm(
      `${cacheURL}/tags/${toSnakeCase(databaseName)}/${toSnakeCase(parentTableName)}/${type}`,
      formattedValues
    );
  }

  function onSubmitInvalid(
    errors: FieldErrors<z.infer<typeof formSchema>>
  ): void {
    // Create toast(s) to let to user know what went wrong.
    // @TODO fix type errors

    console.log("onSubmitInvalid called.");

    for (const fieldName in errors) {
      const error = errors[fieldName];
      if (error?.message) {
        toast(`${fieldName}: ${error.message}`);
        console.log(`${fieldName}: ${error.message}`);
      }
    }
  }

  return {
    controller,
    formSchema,
    onSubmit,
    onSubmitInvalid,
  };
}
