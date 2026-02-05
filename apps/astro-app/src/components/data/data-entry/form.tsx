"use client";

import { Button } from "@/components/ui/button";

import type { TableInfo } from "@/env";
import { createFormSchemaAndHandlers } from "@/components/data/form-helper";
import { Columns } from "@/components/data/data-entry";
import { CACHE_URL } from "astro:env/client";

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
  const { form, onSubmit, onSubmitInvalid } = createFormSchemaAndHandlers(
    databaseName,
    tableInfo,
    CACHE_URL,
  );

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, onSubmitInvalid)}
      className="flex flex-col gap-4"
    >
      <Columns fieldsToEnter={tableInfo.schema} form={form} />
      <Button type="submit">Submit</Button>
    </form>
  );
}
