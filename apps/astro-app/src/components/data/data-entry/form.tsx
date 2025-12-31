"use client"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
} from "@/components/ui/form"

import type { DataColumn } from "@root/src/env"
import { oldInputElements, type oldInputElementFunction, oldInputElementsAliases } from "@/components/data/input-elements"


// Input elements!
import { Textarea } from "@/components/ui/textarea"
import { createFormSchemaAndHandlers } from "@/components/data/form-helper"

export function DataEntryForm({ fieldsToEnter, databaseName, tableName, dbURL }: { fieldsToEnter: Array<DataColumn>, databaseName: string, tableName: string, dbURL: string }) {
  const { form, onSubmit, onSubmitInvalid } = createFormSchemaAndHandlers(fieldsToEnter, databaseName, tableName, dbURL)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onSubmitInvalid)} className="flex flex-col gap-4">
        {fieldsToEnter.map((columnInfo: DataColumn) => {
          let inputElement: oldInputElementFunction = oldInputElements[oldInputElementsAliases[columnInfo.entrytype]]

          if (inputElement === undefined) {
            console.warn(`No input element found for column ${columnInfo.name}. This is likely a bug.`)
            return
          } else {
            if (columnInfo.comments) {
              return (
                <div className="rounded-lg border p-5 shadow-md" key={columnInfo.name}>
                  <FormField
                    control={form.control}
                    name={columnInfo.name}
                    key={columnInfo.name + "-field"}
                    render={(field) => inputElement(field, columnInfo)}
                  />
                  <div className="w-full flex flex-col items-center gap-4">
                    <FormLabel className="text-base">Comments</FormLabel>
                  </div>
                  {columnInfo.comments ? <FormField
                    control={form.control}
                    name={columnInfo.name + "_comments"}
                    key={columnInfo.name + "_comments-field"}
                    render={(field) => <FormControl>
                      <Textarea {...field.field} />
                    </FormControl>}
                  /> : null}
                </div>
              )
            } else {
              return (
                <FormField
                  control={form.control}
                  name={columnInfo.name}
                  key={columnInfo.name + "-field"}
                  render={(field) => inputElement(field, columnInfo)}
                />
              )
            }
          }
        }
        )
        }
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}