"use client"

import * as React from "react"
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

export function Calendar24({ onChange } : { onChange: (any: any) => void}) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(undefined)

  const onCalendarChange = (val: Date | undefined) => {
    if (!val) {
      return;
    }

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
    output.setDate(val.getDay());

    setDate(output);
    onChange(output.toISOString());
  };

  const onTimeChange = (val: string) => {
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

    setDate(output);
    onChange(output.toISOString());
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-3">
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
      <div className="flex flex-col gap-3">
        <Label htmlFor="time-picker" className="px-1">
          Time
        </Label>
        <Input
          type="time"
          id="time-picker"
          step="1"
          defaultValue="10:30:00"
          onChange={(val: React.ChangeEvent<HTMLInputElement>) => {
            onTimeChange(val.target.value);
          }}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  )
}
