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
import { parseTime, parseAny } from "@/utils"

// Input elements!
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider/labelslider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radioGroup"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "../ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover"

const inputElementsAliases: Record<string, "textbox" | "linearSlider" | "radio" | "calendar" | "time"> = {
  "textbox": "textbox",
  "textarea": "textbox",
  "linearSlider": "linearSlider",
  "slider": "linearSlider",
  "radio": "radio",
  "calendar": "calendar",
  "time": "time",
}

// give the following pieces of information:
// field: the field object from react-hook-form
// defaultValue: the default value for the field
// columnName: the name of the column in the database
// fields: contains all desired information about each column
type inputElementFunction = (field: any, columnInfo: DataColumn) => ReactElement<unknown, string | JSXElementConstructor<any>>

const inputElements: Record<string, inputElementFunction> = {
  "textbox": (field, columnInfo) => <FormItem className="rounded-lg border p-3 shadow-sm">
    <FormControl>
      <Textarea placeholder={columnInfo.defaultValue} {...field.field} onChange={(val) => { field.field.onChange(parseAny(val.target.value, columnInfo.datatype)) }} />
    </FormControl>
  </FormItem>,
  "linearSlider": (field, columnInfo) => <FormItem className="rounded-lg border p-3 shadow-sm">
    <div className="w-full flex flex-col items-center gap-4">
      <FormLabel className="text-lg font-semibold">{columnInfo.name}</FormLabel>
    </div>
    <FormControl>
      <Slider defaultVal={field.field.value} min={columnInfo.min ?? 0} max={columnInfo.max ?? 100} step={columnInfo.step ?? 1} onChange={field.field.onChange} {...field} />
    </FormControl>
  </FormItem>,
  "radio": (field, columnInfo) => <FormItem className="rounded-lg border p-3 shadow-sm">
    <div className="w-full flex flex-col items-center">
      <FormLabel className="text-lg font-semibold">{columnInfo.name}</FormLabel>
      <FormControl>
        <RadioGroup onValueChange={field.field.onChange} defaultValue={field.field.value}>
          {
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
    </div ></FormItem>,
  "switch": (field, columnInfo) => <FormItem className="w-full flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
    <div className="w-full space-y-0.5">
      <FormLabel className="space-y-0.5 text-lg font-semibold"><p>{columnInfo.name}</p>
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
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={field.field.value}
            onSelect={field.field.onChange}
            disabled={(date) =>
              date > new Date() || date < new Date("1900-01-01")
            }
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
        <Input
          type="time"
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          onChange={(val) => { field.field.onChange(parseTime(val.target.value)) }}
          placeholder={field.field.value}
          {...field.field}
        />
      </FormControl>
    </div>
  </FormItem>,
}

export function DataEntryForm({ fieldsToEnter, databaseName }: { fieldsToEnter: Array<DataColumn>, databaseName: string }) {
  // start creating the schema based on the given database
  let zodSchema: Record<string, ZodTypeAny> = {}
  // give Zod some default values to work with
  let defaultValues: Record<string, any> = {}


  for (let columnInfo of fieldsToEnter) {
    // immediately ignore anything not needed on the form.
    if (columnInfo.entrytype === "none") continue

    // throw things into the schema, adding in restrictions as necessary
    // @TODO add restrictions


    // find a default value and create the form element
    zodSchema[columnInfo.name] = zodDatatypes[columnInfo.datatype as zodPrimaryDatatypes]
    defaultValues[columnInfo.name] = columnInfo.defaultValue ?? getFallbackValue(columnInfo.datatype)
    // look for any restrictions
    // @ts-ignore thanks to the ColumnData type, this is guarenteed to be OK.
    if ("min" in columnInfo) { zodSchema[columnInfo.name] = zodSchema[columnInfo.name].min(columnInfo.min) }
    // @ts-ignore thanks to the ColumnData type, this is guarenteed to be OK.
    if ("max" in columnInfo) { zodSchema[columnInfo.name] = zodSchema[columnInfo.name].max(columnInfo.max) }
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

  function onSubmitInvalid(values: z.infer<typeof formSchema>) {
    // send them over to the database!
    console.log("SOMETHING BAD HAPPENED.", values)
  }


  // console.log(Object.entries(elementSchema) as [string, inputElementFunction][])

  // @todo optimize by just yeeting in a second pass of the let columnInfo of fieldsToEnter
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onSubmitInvalid)} className="flex flex-col gap-4">
        {fieldsToEnter.map((columnInfo: DataColumn) => {
          let inputElement: inputElementFunction = inputElements[inputElementsAliases[columnInfo.entrytype]]

          if (inputElement === undefined) {
            console.warn(`No input element found for column ${columnInfo.name}. This is likely a bug.`)
            return
          } else {
            return (
              <FormField
                control={form.control}
                name={columnInfo.name}
                key={columnInfo.name + "-field"}
                render={(field) => inputElement(field, columnInfo)}
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