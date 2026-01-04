"use client"

import { Button } from "@/components/ui/button"

import type { DataColumn } from "@/env"
import { createFormSchemaAndHandlers } from "@/components/data/form-helper"
import { Columns } from "@/components/data/data-entry"

export function FormForm({ fieldsToEnter, databaseName, tableName, dbURL }: { fieldsToEnter: Array<DataColumn>, databaseName: string, tableName: string, dbURL: string }) {
  const { form, onSubmit, onSubmitInvalid } = createFormSchemaAndHandlers(fieldsToEnter, databaseName, tableName, dbURL)

  return (
    <form onSubmit={form.handleSubmit(onSubmit, onSubmitInvalid)} className="flex flex-col gap-4">
      <Columns fieldsToEnter={fieldsToEnter} form={form} />
      <Button type="submit">Submit</Button>
    </form>
  )
}