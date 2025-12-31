import {
    FormControl,
    FormDescription,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { cn } from "@root/lib/utils"
import type { JSXElementConstructor, ReactElement } from "react"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Slider } from "@/components/ui/slider/labelslider"
import { RadioGroup, RadioGroupItem } from "@root/src/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Calendar24 } from "@root/src/components/ui/timestamp-picker"
import { TimePicker } from "@root/src/components/ui/time-picker"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import type { DataColumn } from "@root/src/env"


export type inputElementName = "textbox" | "linearSlider" | "switch" | "radio" | "calendar" | "time" | "timestamp";

export const inputElementsAliases: Record<string, inputElementName> = {
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

export type oldInputElementName = "textbox" | "linearSlider" | "switch" | "radio" | "calendar" | "time" | "timestamp";

export const oldInputElementsAliases: Record<string, oldInputElementName> = {
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

export type oldInputElementFunction = (field: any, columnInfo: DataColumn) => ReactElement<unknown, string | JSXElementConstructor<any>>

export const oldInputElements: Record<oldInputElementName, oldInputElementFunction> = {
    "textbox": (field, columnInfo) => <div className="w-full flex flex-col items-center">
        <FormLabel className="text-lg font-semibold">{columnInfo.name}</FormLabel>
        <FormItem className="w-full rounded-lg border p-3 shadow-sm">
            <FormControl>
                <Textarea placeholder={columnInfo.defaultValue} {...field.field} />
            </FormControl>
            {columnInfo.description && <FormDescription>{columnInfo.description}</FormDescription>}
        </FormItem>
    </div>,
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
                        columnInfo.values.map((option: string) => (
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