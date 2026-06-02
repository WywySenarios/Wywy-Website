import { useCallback, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { TableInfo, RecordOnEvent } from "@/types/data";
import { handleRecordOn } from "@utils/data/form/updates";
import { toSnakeCase } from "@utils/parse";
import { toast } from "sonner";

/**
 * Injects record_on column values into the form controller for a given event.
 * Reads current form state via controller.getValues, runs handleRecordOn,
 * then writes the merged values back via controller.setValue.
 * @param tableInfo The table schema.
 * @param controller The react-hook-form controller.
 * @param printError Error display callback (defaults to toast).
 */
export function useAutoPopulate(
  tableInfo: TableInfo,
  controller: UseFormReturn<any>,
  printError: (msg: any) => any = toast,
) {
  const [isPopulating, setIsPopulating] = useState<boolean>(false);

  const populate = useCallback(
    async (eventName: RecordOnEvent, mode: "insert" | "purge" = "insert") => {
      setIsPopulating(true);
      try {
        const current = controller.getValues("data") ?? {};
        const merged = await handleRecordOn(
          current,
          tableInfo,
          eventName,
          mode,
        );
        for (const [key, value] of Object.entries(merged)) {
          controller.setValue(`data.${key}`, value, {
            shouldValidate: true,
          });
        }
        if (mode === "purge") {
          for (const columnSchema of tableInfo.schema) {
            const columnName = toSnakeCase(columnSchema.name);
            if (columnSchema.record_on === eventName) {
              controller.setValue(`data.${columnName}`, undefined, {
                shouldValidate: true,
              });
            }
          }
        }
      } catch (error) {
        printError(error);
      } finally {
        setIsPopulating(false);
      }
    },
    [tableInfo, controller],
  );

  return { populate, isPopulating };
}
