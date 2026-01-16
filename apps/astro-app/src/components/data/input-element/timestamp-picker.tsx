"use client"

import { useState, useEffect } from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { parseTime } from "@/utils"

function convertToTimestampString(date: Date): string {
  let output = date.toISOString();
  output = output.substring(0, output.length - 1); // get rid of the trailing Z.
  return output;
}

export function Calendar24({ onChange, defaultValue }: { onChange: (val: any) => void, defaultValue?: string }) {
  const [open, setOpen] = useState<boolean>(false)
  const [date, setDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    let output = new Date();

    output.setMilliseconds(0);
    if (defaultValue) {
      let time = parseTime(defaultValue);
      if (time) {
        output.setHours(time.getHours());
        output.setMinutes(time.getMinutes());
        output.setSeconds(time.getSeconds());
      }
    }

    setDate(output);
  }, [])

  const onCalendarChange = (val: Date | undefined) => {
    console.log(onChange);
    if (!val || !onChange) {
      return;
    }
    console.log(onChange);
    console.log("datechange")

    // copy date
    let output;
    if (date) {
      output = new Date(date);
    } else {
      output = new Date();
    }

    // move over year, month, and day
    output.setFullYear(val.getFullYear());
    output.setMonth(val.getMonth());
    output.setDate(val.getDate());

    setDate(output);
    onChange(convertToTimestampString(output));
  };

  const onTimeChange = (val: string) => {
    console.log(val);
    if (!val || !onChange) return;
    console.log("Timechange")
    // copy date
    let output;
    if (date) {
      output = new Date(date);
    } else {
      output = new Date();
    }

    // extract the hours, minutes, and seconds from the string
    let copy = parseTime(val); // @todo check if val can always be expected to be provided in HH:mm:ss format
    if (copy) {
      // move over the hours, minutes, and seconds if possible
      output.setHours(copy.getHours());
      output.setMinutes(copy.getMinutes());
      output.setSeconds(copy.getSeconds());
    }

    console.log(convertToTimestampString(output));

    setDate(output);
    onChange(convertToTimestampString(output));
  };

  return (
    <div className="flex flex-row w-full items-center gap-4">
      <div className="flex items-center flex-col gap-3">
        <Label htmlFor="date-picker" className="px-1">
          Date
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker"
              className="w-32 justify-between font-normal"
            >
              {date ? date.toLocaleDateString() : "Select date"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              onSelect={(date: Date | undefined) => {
                onCalendarChange(date);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center flex-col w-full gap-3">
        <Label htmlFor="time-picker" className="px-1">
          Time
        </Label>
        <Input
          type="time"
          id="time-picker"
          step="1"
          defaultValue={defaultValue}
          onChange={(val: React.ChangeEvent<HTMLInputElement>) => {
            onTimeChange(val.target.value);
          }}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  )
}
