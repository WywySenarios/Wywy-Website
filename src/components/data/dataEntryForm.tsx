"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import type { DataColumn, JsonColumn } from "@root/src/env"
import { getFallbackValue, zodDatatypes } from "@/utils/reactConstants"
import type { ZodTypeAny } from "astro:schema"
import type { ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"

const inputElementsAliases: Record<string, "textbox" | "linearSlider"> = {
  "textbox": "textbox",
  "textarea": "textbox",
  "linearSlider": "linearSlider",
  "slider": "linearSlider",
}

type inputElementFunction = (field: any, defaultValue?: any, restrictions?: any) => ReactNode

const inputElements: Record<string, inputElementFunction> = {
  "textbox": (field, defaultValue, restrictions) => <Input {...field} placeholder={defaultValue} />,
  "linearSlider": (field, defaultValue, restrictions) => <Slider
    defaultValue={[defaultValue]} value={[33]} min={0} max={100} step={1} onValueChange={(vals: number[]) => {
      field.onChange((vals[0]))
    }}//{...field}
  />,
  // "radio": 
}

export function DataEntryForm({ fieldsToEnter, databaseName }: { fieldsToEnter: Record<string, DataColumn | JsonColumn>, databaseName: string }) {
  // start creating the schema based on the given database
  let zodSchema: Record<string, ZodTypeAny> = {}
  // also keep track of default values
  let defaultValues: Record<string, any> = {}
  // also create Form elements to render later on so the user has something to interact with
  let elementSchema: Record<string, inputElementFunction> = {}
  // let formElements: Array<typeof FormField> = []


  for (let [columnName, columnSchema] of Object.entries(fieldsToEnter) as [string, DataColumn | JsonColumn][]) {
    // immediately ignore anything not needed on the form.
    if (columnSchema.entrytype === "none") continue

    // throw things into the schema, adding in restrictions as necessary
    // @TODO add restrictions

    // create Form elements
    // elementSchema[columnName] = 


    switch (columnSchema.datatype) {
      case "json":
      case "JSON":
        break;
      default:
        zodSchema[columnName] = zodDatatypes[columnSchema.datatype]
        defaultValues[columnName] = columnSchema.defaultValue ?? getFallbackValue(columnSchema.datatype)
        // formElements.push(inputElements[columnSchema])
        // if (inputElementsAliases[columnSchema.entrytype] == "linearSlider") { console.log(defaultValues[columnName]) }
        elementSchema[columnName] = inputElements[inputElementsAliases[columnSchema.entrytype]]
        break;
    }

    // deal with special cases for default values
    //   switch(columnSchema.datatype) {
    //     case "date":
    //       if columnSchema.defaultValue == "date":
    //         defaultValues[columnName] = time
    //   }
  }

  const formSchema = z.object(zodSchema)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // send them over to the database!
    console.log(values)
  }

  console.log(Object.entries(elementSchema) as [string, inputElementFunction][])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {(Object.entries(elementSchema) as [string, inputElementFunction][]).map(([columnName, inputElement]: [string, inputElementFunction]) => {
          if (inputElement === undefined) {return} else {return (
          <FormField
            control={form.control}
            name={columnName}
            key={columnName + "-field"}
            render={(field) => {
              return (
                <FormItem>
                  <FormLabel>{columnName}</FormLabel>
                  <FormControl>
                    {inputElement(field, defaultValues[columnName])}
                  </FormControl>
                </FormItem>
              )
            }}
          />
        )}
        }
        )
        }
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}