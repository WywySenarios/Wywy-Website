"use client"

import { Button } from "@/components/ui/button"

import type { TableInfo } from "@/env"
import { createFormSchemaAndHandlers, type OnSubmitInvalid } from "@/components/data/form-helper"
import { Columns } from "@/components/data/data-entry"

export function FormForm({
    databaseName,
    tableInfo,
    dbURL
}: {
    databaseName: string,
    tableInfo: TableInfo,
    dbURL: string
}) {
  const { form, onSubmit, onSubmitInvalid } = createFormSchemaAndHandlers(databaseName, tableInfo, dbURL)

  return (
    <form onSubmit={form.handleSubmit(onSubmit, onSubmitInvalid as OnSubmitInvalid)} className="flex flex-col gap-4">
      <Columns fieldsToEnter={tableInfo.schema} form={form} />
      <Button type="submit">Submit</Button>
    </form>
  )
}