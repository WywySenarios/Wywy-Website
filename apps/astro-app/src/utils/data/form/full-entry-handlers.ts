import { zodResolver } from "@hookform/resolvers/zod";
import type { TableInfo } from "@/types/data";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z, ZodArray, type ZodType } from "zod";
import { toSnakeCase } from "@utils/parse";
import { FORM_TAGS_ZOD_SCHEMA, getZodEntrySchema } from "@utils/data/schema";
import { getDefaultValues } from "../default-values";

/**
 * Create a form controller and zod schema.
 * @param tableInfo The table full table schema.
 * @returns A form controller and zod schema.
 */
export function createFormController(tableInfo: TableInfo) {
  const defaultValues: {
    data: Record<string, any>;
    tags?: string[];
    descriptors?: Record<string, any>;
  } = {
    data: getDefaultValues(tableInfo),
  };

  // main table default values

  // tags default values
  if (tableInfo.tagging) {
    defaultValues["tags"] = [];
  }

  // descriptors
  const descriptorSchemaShape: Record<string, ZodArray<ZodType<any>>> = {};
  if (tableInfo.descriptors) {
    const descriptorDefaultValues: Record<string, any> = {};
    defaultValues["descriptors"] = descriptorDefaultValues;

    for (const descriptorInfo of tableInfo.descriptors) {
      const descriptorName = toSnakeCase(descriptorInfo.name);

      descriptorSchemaShape[descriptorName] = z.array(
        getZodEntrySchema(descriptorInfo),
      );
      descriptorDefaultValues[descriptorName] = [];
    }
  }

  const schema = z.object({
    data: getZodEntrySchema(tableInfo),
    tags: tableInfo.tagging ? FORM_TAGS_ZOD_SCHEMA : z.never().optional(),
    descriptors: tableInfo.descriptors
      ? z.object(descriptorSchemaShape)
      : z.never().optional(),
  });
  const controller: UseFormReturn<z.infer<typeof schema>> = useForm<
    z.infer<typeof schema>
  >({
    resolver: zodResolver(schema),
    defaultValues: defaultValues,
  });

  return {
    controller,
    schema,
  };
}
