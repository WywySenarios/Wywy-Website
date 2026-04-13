"use client";

import { Button } from "@/components/ui/button";

import type { TableInfo } from "@/types/data";
import { createFormController } from "@utils/data/form/full-entry-handlers";
import { Columns } from "@/components/data/data-entry";
import { CACHE_URL } from "astro:env/client";
import type z from "zod";
import { CACHE_CSRF_ENDPOINT } from "@utils/auth";
import { submitEntry } from "@utils/data/http";
import { toast } from "sonner";
import type { FieldErrors } from "react-hook-form";
import { toSnakeCase } from "@utils/parse";

/**
 * Basic form component.
 * @param databaseName The name of the database that this form gathers data for.
 * @param tableInfo The full table schema.
 * @param dbURL The URL that the form will post to on submit.
 */
export function FormForm({
  databaseName,
  tableInfo,
}: {
  databaseName: string;
  tableInfo: TableInfo;
}) {
  const { controller, schema } = createFormController(tableInfo);

  function onSubmit(
    values: z.infer<typeof schema>,
    event?: React.BaseSyntheticEvent,
  ): void {
    submitEntry(
      `${CACHE_URL}/main/${databaseName}/${toSnakeCase(tableInfo.tableName)}`,
      values,
      CACHE_CSRF_ENDPOINT,
    )
      .then(() => {
        // @TODO redirect, popup, etc.
        toast("Form submitted!");
      })
      .catch((reason) => {
        toast(`Form submission failed: ${reason}`);
        console.log(`Form submission failed: ${reason}`);
      });
  }

  function onSubmitInvalid(errors: FieldErrors<z.infer<typeof schema>>) {
    console.error("Invalid form submission.", errors);
    toast("Invalid form submission.");
  }

  return (
    <form
      onSubmit={controller.handleSubmit(onSubmit, onSubmitInvalid)}
      className="flex flex-col gap-4"
    >
      <Columns fieldsToEnter={tableInfo.schema} form={controller} />
      {/* @TODO add tags */}
      {/* @TODO add descriptors */}
      <Button type="submit">Submit</Button>
    </form>
  );
}
