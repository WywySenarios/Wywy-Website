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
  const formSchema = z.object({
    data: getZodEntrySchema(entrySchema),
  });
  const form: UseFormReturn<z.infer<typeof formSchema>> = useForm<
    z.infer<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(entrySchema),
  });

  return {
    form,
    formSchema,
  };
}
