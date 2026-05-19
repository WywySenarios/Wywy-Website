"use client";

import { Button } from "@/components/ui/button";

import { createFormController } from "@utils/data/form/full-entry-handlers";
import { Columns, Tags, Descriptors } from "@/components/data/data-entry";
import { CACHE_URL } from "astro:env/client";
import type z from "zod";
import { submitEntry, useDataset } from "@utils/data/http";
import { toast } from "sonner";
import type { FieldErrors } from "react-hook-form";
import { toSnakeCase } from "@utils/parse";
import { useEffect, useState } from "react";
import { useAutoPopulate } from "@utils/data/form/useAutoPopulate";
import { Spinner } from "@/components/ui/spinner";
import { RefreshCcw } from "lucide-react";
import { type TAG_NAMES_DATASET } from "@utils/data/schema";
import {
  useDatabaseName,
  useTableInfo,
} from "@utils/data/schema-context";

/**
 * Basic form component.
 */
export function FormForm({
  onSubmitted,
}: {
  onSubmitted?: () => void;
}) {
  const databaseName = useDatabaseName();
  const tableInfo = useTableInfo()!;
  // TODO: extract a reusable form stage hook (idle -> populating -> ready -> submitting -> submitted)
  const { controller, schema } = createFormController(tableInfo);
  const { populate, isPopulating } = useAutoPopulate(tableInfo, controller);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagsRefreshState, setTagsRefreshState] = useState<number>(0);

  const [tagNamesDataset, tagsLoading, tagsError] = useDataset({
    valid: tableInfo.tagging === true,
    table_type: "tag_names",
    schema: undefined,
    source: "cache",
    endpointOptions: {
      databaseName,
      tableName: tableInfo.tableName,
    },
    refreshState: tagsRefreshState,
  });

  useEffect(() => {
    populate("start");
  }, []);

  const endpoint = `${CACHE_URL}/main/${toSnakeCase(databaseName)}/${toSnakeCase(tableInfo.tableName)}`;

  // Populates submit-time columns then validates and sends the form entry
  async function handleSubmitClick() {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await populate("submit");

      let submitted = false;
      await controller.handleSubmit(
        async (values: z.infer<typeof schema>) => {
          await submitEntry(endpoint, values, "cache");
          toast("Form submitted!");
          submitted = true;
        },
        (errors: FieldErrors<z.infer<typeof schema>>) => {
          console.error("Invalid form submission.", errors);
          toast("Invalid form submission.");
        },
      )();

      if (submitted) onSubmitted?.();
    } catch (reason) {
      toast(`Form submission failed: ${reason}`);
      console.error(`Form submission failed: ${reason}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
      <Columns fieldsToEnter={tableInfo.schema} form={controller} />
      {tableInfo.tagging ? (
        tagsLoading ? (
          <div className="flex flex-col items-center">
            <p>Loading tags...</p>
            <Spinner />
          </div>
        ) : tagsError ? (
          <div className="flex flex-col items-center">
            <p>Error while loading tags.</p>
            <Button
              onClick={() => {
                setTagsRefreshState(tagsRefreshState + 1);
              }}
            >
              <RefreshCcw />
            </Button>
          </div>
        ) : tagNamesDataset ? (
          <>
            {/* @TODO tag suggestions — pick the most likely tag instead of the first one */}
            <Tags
              /* type assertion: useDataset validates against TAG_NAMES_DATASET_SCHEMA internally, so the cast is safe */
              tagsDataset={tagNamesDataset as TAG_NAMES_DATASET}
              form={controller}
            />
          </>
        ) : null
      ) : null}
      {tableInfo.descriptors ? (
        <Descriptors form={controller} />
      ) : null}
      <Button
        type="button"
        disabled={isSubmitting || isPopulating}
        onClick={handleSubmitClick}
      >
        {isSubmitting ? <Spinner /> : "Submit"}
      </Button>
    </form>
  );
}
