"use client";

import type { DatabaseInfo, TableInfo } from "@/types/data";
import type { JSX } from "astro/jsx-runtime";
import { FormForm } from "@/components/data/data-entry/form";
import { TimerForm } from "@/components/data/data-entry/timer";
import { SchemaProvider, useTableInfo } from "@utils/data/schema-context";

/**
 * Selects the correct form element to use. Expects there to be a valid Toast element inside the page.
 * @param databaseInfo The full database info.
 * @param tableInfo The full table schema.
 * @param onSubmitted Called after a successful form submission.
 */
export default function DataEntryForm({
  databaseInfo,
  tableInfo,
  onSubmitted,
}: {
  databaseInfo: DatabaseInfo;
  tableInfo: TableInfo;
  onSubmitted?: () => void;
}): JSX.Element {
  return (
    <SchemaProvider databaseInfo={databaseInfo} tableInfo={tableInfo}>
      <DataEntryFormBody onSubmitted={onSubmitted} />
    </SchemaProvider>
  );
}

function DataEntryFormBody({ ...props }) {
  const tableInfo = useTableInfo()!;
  switch (tableInfo.entrytype) {
    case "form":
      return <FormForm {...props} />;
    case "timer":
      return <TimerForm {...props} />;
  }
}
