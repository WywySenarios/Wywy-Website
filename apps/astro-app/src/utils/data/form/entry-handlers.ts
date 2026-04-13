import { zodResolver } from "@hookform/resolvers/zod";
import type { DescriptorInfo, TableInfo } from "@/types/data";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { getZodEntrySchema } from "@utils/data/schema";
import { getDefaultValues } from "../default-values";

/**
 * Create a form controller and zod schema.
 * @param entrySchema
 * @returns A form controller and zod schema.
 */
export function createFormController(entrySchema: TableInfo | DescriptorInfo) {
  const schema = z.object({
    data: getZodEntrySchema(entrySchema),
  });
  const controller: UseFormReturn<z.infer<typeof schema>> = useForm<
    z.infer<typeof schema>
  >({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(entrySchema),
  });

  return {
    controller,
    schema,
  };
}
