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

import type { DataColumn } from "@root/src/env"
import { cn } from "@root/lib/utils"
import { getFallbackValue, zodDatatypes, type zodPrimaryDatatypes } from "@/utils/data"
import type { ZodTypeAny } from "astro:schema"
import type { JSXElementConstructor, ReactElement } from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { prettifyTimeString, prettyParseAny, parseAny } from "@/utils"

import { toast } from "sonner"


// Input elements!
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider/labelslider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radioGroup"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Calendar24 } from "@/components/ui/dateTimePicker"
import { TimePicker } from "@/components/ui/timePicker"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

type inputElementName = "textbox" | "linearSlider" | "switch" | "radio" | "calendar" | "time" | "timestamp";

const inputElementsAliases: Record<string, inputElementName> = {
  "textbox": "textbox",
  "textarea": "textbox",
  "linearSlider": "linearSlider",
  "slider": "linearSlider",
  "switch": "switch",
  "radio": "radio",
  "calendar": "calendar",
  "time": "time",
  "timestamp": "timestamp",
}

type inputElementFunction = (field: any, columnInfo: DataColumn) => ReactElement<unknown, string | JSXElementConstructor<any>>

const inputElements: Record<inputElementName, inputElementFunction> = {
  "textbox": (field, columnInfo) => <FormItem className="rounded-lg border p-3 shadow-sm">
    <FormControl>
      <Textarea placeholder={columnInfo.defaultValue} {...field.field} />
    </FormControl>
    {columnInfo.description && <FormDescription>{columnInfo.description}</FormDescription>}
  </FormItem>,
  "linearSlider": (field, columnInfo) => <FormItem className="rounded-lg border p-3 shadow-sm">
    <div className="w-full flex flex-col items-center gap-4">
      <FormLabel className="text-lg font-semibold">{columnInfo.name}</FormLabel>
      <FormControl>
        {
          // @ts-ignore
          <Slider defaultVal={field.field.value} min={columnInfo.min ?? 0} max={columnInfo.max ?? 100} step={columnInfo.step ?? 1} onChange={field.field.onChange} {...field} />
        }
      </FormControl>
      {columnInfo.description && <FormDescription>{columnInfo.description}</FormDescription>}
    </div>
  </FormItem>,
  "radio": (field, columnInfo) => <FormItem className="rounded-lg border p-3 shadow-sm">
    <div className="w-full flex flex-col items-center">
      <FormLabel className="text-lg font-semibold">{columnInfo.name}</FormLabel>
      <FormControl>
        <RadioGroup onValueChange={field.field.onChange} defaultValue={field.field.value}>
          {
            // @ts-ignore
            columnInfo.whitelist.map((option: string) => (
              // note that if two options have the same key, they will also have the same values. Pretty strange, huh?
              <FormItem className="flex items-center gap-3 w-full" key={columnInfo.name + "-" + option + "-radio"}>
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
      {columnInfo.description && <FormDescription>{columnInfo.description}</FormDescription>}
    </div ></FormItem>,
  "switch": (field, columnInfo) => <FormItem className="w-full flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
    <div className="w-full space-y-0.5">
      <FormLabel className="space-y-0.5 text-lg font-semibold">
        <p>{columnInfo.name}</p>
      </FormLabel>
    </div>
    <FormControl>
      <Switch
        checked={field.field.value}
        onCheckedChange={field.field.onChange}
      // className="w-2/12"
      />
    </FormControl>
    {columnInfo.description && <FormDescription>{columnInfo.description}</FormDescription>}
  </FormItem>,
  "calendar": (field, columnInfo) => <FormItem className="rounded-lg border p-3 shadow-sm">
    <div className="w-full flex flex-col items-center gap-4">
      <FormLabel className="text-lg font-semibold">{columnInfo.name}</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] pl-3 text-left font-normal",
                !field.field.value && "text-muted-foreground"
              )}
            >
              {field.field.value ? (
                format(field.field.value, "PPP")
              ) : (
                <span>Pick a date</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </FormControl>
          {columnInfo.description && <FormDescription>{columnInfo.description}</FormDescription>}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={field.field.value}
            onSelect={field.field.onChange}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>
    </div>
  </FormItem>,
  "time": (field, columnInfo) => <FormItem className="rounded-lg border p-3 shadow-sm">
    <div className="w-full flex flex-col items-center gap-4">
      <FormLabel className="text-lg font-semibold">{columnInfo.name}</FormLabel>
      <FormControl>
        <TimePicker
          // @ts-ignore
          defaultValue={columnInfo.defaultValue}
          onChange={field.field.onChange}
        />
      </FormControl>
      {columnInfo.description && <FormDescription>{columnInfo.description}</FormDescription>}
    </div>
  </FormItem>,
  "timestamp": (field, columnInfo) => <FormItem className="rounded-lg border p-3 shadow-sm">
    <div className="w-full flex flex-col items-center gap-4">
      <FormLabel className="text-lg font-semibold">{columnInfo.name}</FormLabel>
      <FormControl>
        <Calendar24 onChange={(val) => {
          field.field.onChange(val);
        }} {...field.field} />
      </FormControl>
      {columnInfo.description && <FormDescription>{columnInfo.description}</FormDescription>}
    </div>
  </FormItem>,
}

export function DataEntryForm({ fieldsToEnter, databaseName, tableName, dbURL }: { fieldsToEnter: Array<DataColumn>, databaseName: string, tableName: string, dbURL: string }) {
  // start creating the schema based on the given database
  let zodSchema: Record<string, ZodTypeAny> = {}
  // give Zod some default values to work with
  let defaultValues: Record<string, any> = {}


  for (let columnInfo of fieldsToEnter) {
    // immediately ignore anything not needed on the form.
    if (columnInfo.entrytype === "none") continue

    // throw things into the schema, adding in restrictions as necessary
    // @TODO add restrictions
    zodSchema[columnInfo.name] = zodDatatypes[columnInfo.datatype as zodPrimaryDatatypes]
    // find a default value and create the form element
    defaultValues[columnInfo.name] = columnInfo.defaultValue ?? getFallbackValue(columnInfo.datatype)

    // update schema if there should be comments for this column
    // @TODO add length restriction
    zodSchema[columnInfo.name + "-comments"] = z.string().optional()
    defaultValues[columnInfo.name + "-comments"] = undefined

    // look for any restrictions
    // @ts-ignore thanks to the ColumnData type, this is guarenteed to be OK.
    if ("min" in columnInfo) { zodSchema[columnInfo.name] = zodSchema[columnInfo.name].min(columnInfo.min) }
    // @ts-ignore thanks to the ColumnData type, this is guarenteed to be OK.
    if ("max" in columnInfo) { zodSchema[columnInfo.name] = zodSchema[columnInfo.name].max(columnInfo.max) }
  }

  const formSchema = z.object(zodSchema)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  /*
   * Form submit handler.
   * Parses the schema into something the sql-receptionist will recognize.
   */
  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)

    let formattedValues: Record<string, any> = {}
    for (let field of fieldsToEnter) {
      // check if the user really wanted to submit that or not
      if (!values[field.name]) {
        continue
      }

      // single-quote strings, dates, times, and timestamps
      switch (field.datatype) {
        case "string":
        case "str":
        case "text":
        case "date":
        case "time":
        case "timestamp":
          values[field.name] = "'" + values[field.name] + "'"
          break;
      }

      // let valueToInsert = parseAny(values[field.name], field.datatype);
      let valueToInsert = values[field.name]
      if (valueToInsert != undefined) {
        formattedValues[field.name] = valueToInsert
      }
    }

    // POST them to the SQL Receptionist!
    console.log(`${dbURL + "/" + databaseName + "/" + tableName}`)
    fetch(dbURL + "/" + databaseName + "/" + tableName, {
      method: "POST",
      body: JSON.stringify(values),
      mode: "cors",
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      }
    }).then((response) => {
      response.text().then((text: string) => {
        if (response.ok) {
          if (response.headers.get("Content-Type") == "text/plain") {
            toast(`Successfully submitted form!`)
          } else {
            toast(`The server has returned an unexpected response. Wywy is sad. ${text}`)
          }
        } else {
          toast(`Error while submitting form: ${text}`)
        }
      })
    })
  }

  function onSubmitInvalid(values: z.infer<typeof formSchema>) {
    // Create toast(s) to let to user know what went wrong.
    for (let erroringField in values) {
      toast(erroringField + ": " + values[erroringField]["message"])
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onSubmitInvalid)} className="flex flex-col gap-4">
        {fieldsToEnter.map((columnInfo: DataColumn) => {
          let inputElement: inputElementFunction = inputElements[inputElementsAliases[columnInfo.entrytype]]

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
                    name={columnInfo.name + "-comments"}
                    key={columnInfo.name + "-comments-field"}
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