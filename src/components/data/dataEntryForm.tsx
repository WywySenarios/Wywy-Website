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
import type { JSXElementConstructor, ReactElement } from "react"

// Input elements!
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider/labelslider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radioGroup"
import { Switch } from "@/components/ui/switch"
import type { zodPrimaryDatatypes } from "@root/src/constants"

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
type inputElementFunction = (field: any, defaultValue: any, columnName: string, fields: Record<string, DataColumn | JsonColumn>) => ReactElement<unknown, string | JSXElementConstructor<any>>

const inputElements: Record<string, inputElementFunction> = {
  "textbox": (field, defaultValue, columnName, fields) => <FormItem className="rounded-lg border p-3 shadow-sm">
    <FormControl>
      <Textarea placeholder={defaultValue} {...field.field} />
    </FormControl>
  </FormItem>,
  "linearSlider": (field, defaultValue, columnName, fields) => <FormItem className="rounded-lg border p-3 shadow-sm">
    <div className="w-full flex flex-col items-center gap-4">
      <FormLabel className="text-lg font-semibold">{columnName}</FormLabel>
    </div>
    <FormControl>
      <Slider defaultVal={field.field.value} min={fields[columnName]["min"] ?? 0} max={fields[columnName]["max"] ?? 100} step={fields[columnName]["step"] ?? 1} onChange={field.field.onChange} {...field} />
      {/* <Input type="range" min={fields[columnName]["min"] ?? 0} max={fields[columnName]["max"] ?? 100} step={fields[columnName]["step"] ?? 1} className="w-full bg-background appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md" {...field.field} /> */}
    </FormControl>
  </FormItem>,
  "radio": (field, defaultValue, columnName, fields) => <FormItem className="rounded-lg border p-3 shadow-sm">
    <div className="w-full flex flex-col items-center">
      <FormLabel className="text-lg font-semibold">{columnName}</FormLabel>
      <FormControl>
        <RadioGroup onValueChange={field.field.onChange} defaultValue={field.field.value}>
          {
            //@ts-ignore
            fields[columnName].whitelist.map((option: string) => (
              // note that if two options have the same key, they will also have the same values. Pretty strange, huh?
              <FormItem className="flex items-center gap-3 w-full" key={columnName + "-" + option + "-radio"}>
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
        </RadioGroup>
      </FormControl>
    </div ></FormItem>,
  "switch": (field, defaultValue, columnName, fields) => <FormItem className="w-full flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
    <div className="w-full space-y-0.5">
      <FormLabel className="space-y-0.5 text-lg font-semibold"><p>{columnName}</p>
        {/* <FormDescription className="text-sm text-gray-500">: Toggle {columnName}</FormDescription> */}
      </FormLabel>
    </div>
    <FormControl>
      <Switch
        checked={field.field.value}
        onCheckedChange={field.field.onChange}
      // className="w-2/12"
      />
    </FormControl>
  </FormItem>,
  "time": (field, defaultValue, columnName, fields) => <FormItem className="rounded-lg border p-3 shadow-sm">
    <div className="w-full flex flex-col items-center gap-4">
      <FormLabel className="text-lg font-semibold">{columnName}</FormLabel>
      <FormControl>
        <Input
          type="time"
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          onChange={((val) => {
            field.field.onChange()
          })}
          {...field.field}
        />
      </FormControl>
    </div>
  </FormItem>,
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
        zodSchema[columnName] = zodDatatypes[columnSchema.datatype as zodPrimaryDatatypes]
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {(Object.entries(elementSchema) as [string, inputElementFunction][]).map(([columnName, inputElement]: [string, inputElementFunction]) => {
          if (inputElement === undefined) {
            console.warn(`No input element found for column ${columnName}. This is likely a bug.`)
            return
          } else {
            return (
              <FormField
                control={form.control}
                name={columnName}
                key={columnName + "-field"}
                render={(field) => inputElement(field, defaultValues[columnName], columnName, fieldsToEnter)}
              // className="flex flex-col items-center rounded-lg border p-8 shadow-sm"}
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