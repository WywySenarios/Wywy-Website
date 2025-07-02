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
import { Input } from "@/components/ui/formInput"
import { Slider } from "@/components/ui/slider/labelslider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radioGroup"

// const inputElementsAliases: Record<string, "textbox" | "linearSlider" | "radio"> = {
//   "textbox": "textbox",
//   "textarea": "textbox",
//   "linearSlider": "linearSlider",
//   "slider": "linearSlider",
//   "radio": "radio",
// }

// give the following pieces of information:
// field: the field object from react-hook-form
// defaultValue: the default value for the field
// columnName: the name of the column in the database
// fields: contains all desired information about each column
type inputElementFunction = (field: any, defaultValue: any, columnName: string, fields: Record<string, DataColumn | JsonColumn>) => ReactNode

const inputElements: Record<string, inputElementFunction> = {
  "textbox": (field, defaultValue, columnName, fields) => <Input onChange={(val: any) => {
    field.field.onChange(val)
  }} placeholder={defaultValue} {...field} />,
  //@ts-ignore
  "linearSlider": (field, defaultValue, columnName, fields) => <Slider className="w-screen" defaultVal={field.field.value} min={fields[columnName]["min"] ?? 0} max={fields[columnName]["max"] ?? 100} step={1} onChange={field.field.onChange} {...field}
  />,
  "radio": (field, defaultValue, columnName, fields) =>
    <RadioGroup onValueChange={field.field.onChange} defaultValue={field.field.value} className="flex flex-col">
      {
        //@ts-ignore
        fields[columnName].whitelist.map((option: string) => (
          <FormItem className="flex items-center gap-3" key={columnName + "-" + option + "-radio"}>
            <FormControl>
              <RadioGroupItem
                value={option}
              />
            </FormControl>
            <FormLabel>{option}</FormLabel>
          </FormItem>
        ))
      }
      <FormMessage />
    </RadioGroup>,
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


    // find a default value and create the form element
    switch (columnSchema.datatype) {
      case "json":
      case "JSON":
        break;
      default:
        zodSchema[columnName] = zodDatatypes[columnSchema.datatype]
        // look for any restrictions
        //@ts-ignore thanks to the ColumnData type, this is guarenteed to be OK.
        if ("min" in columnSchema) { zodSchema[columnName] = zodSchema[columnName].min(columnSchema.min) }
        //@ts-ignore thanks to the ColumnData type, this is guarenteed to be OK.
        if ("max" in columnSchema) { zodSchema[columnName] = zodSchema[columnName].max(columnSchema.max) }


        defaultValues[columnName] = columnSchema.defaultValue ?? getFallbackValue(columnSchema.datatype)
        // formElements.push(inputElements[columnSchema])
        // if (inputElementsAliases[columnSchema.entrytype] == "linearSlider") { console.log(defaultValues[columnName]) }
        // elementSchema[columnName] = inputElements[inputElementsAliases[columnSchema.entrytype]]
        elementSchema[columnName] = inputElements[columnSchema.entrytype]
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
  // const formSchema = z.object({
  //   first: z.string().min(0, {
  //     message: "Username must be at least 2 characters.",
  //   }),
  // })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    // defaultValues: {
    //   first: "asdasd",
    // }
    defaultValues,
  })

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // send them over to the database!
    console.log(values)
  }

  // console.log(Object.entries(elementSchema) as [string, inputElementFunction][])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {(Object.entries(elementSchema) as [string, inputElementFunction][]).map(([columnName, inputElement]: [string, inputElementFunction]) => {
          if (inputElement === undefined) { return } else {
            return (
              <FormField
                control={form.control}
                name={columnName}
                key={columnName + "-field"}
                render={(field) => {
                  return (
                    <FormItem>
                      <FormLabel>{columnName}</FormLabel>
                      <FormControl>
                        {inputElement(field, defaultValues[columnName], columnName, fieldsToEnter)}

                      </FormControl>
                    </FormItem>
                  )
                }}
              />
            )
          }
        }
        )
        }
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}