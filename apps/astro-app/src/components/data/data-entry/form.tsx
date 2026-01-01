"use client"

import { Button } from "@/components/ui/button"

import type { DataColumn } from "@root/src/env"
import { oldInputElements, type oldInputElementFunction, oldInputElementsAliases, InputElement, FormElement } from "@/components/data/input-elements"


// Input elements!
import { Textarea } from "@/components/ui/textarea"
import { createFormSchemaAndHandlers } from "@/components/data/form-helper"

export function DataEntryForm({ fieldsToEnter, databaseName, tableName, dbURL }: { fieldsToEnter: Array<DataColumn>, databaseName: string, tableName: string, dbURL: string }) {
  const { form, onSubmit, onSubmitInvalid } = createFormSchemaAndHandlers(fieldsToEnter, databaseName, tableName, dbURL)

  return (
    <form onSubmit={form.handleSubmit(onSubmit, onSubmitInvalid)} className="flex flex-col gap-4">
      {fieldsToEnter.map((columnInfo: DataColumn) => {
        return (
          <FormElement form={form} columnInfo={columnInfo} />
        )
      }
      )
      }
      <Button type="submit">Submit</Button>
    </form>
  )
}